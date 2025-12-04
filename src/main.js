function calculateSimpleRevenue(purchase, _product) {
    const {discount, sale_price, quantity} = purchase;
    return sale_price*quantity*(1-(discount/100));
}

function calculateBonusByProfit(index, total, seller) {
    const{profit}=seller;
    if (index===0){
        return profit*(0.15);
    }
    else if (index===1 || index===2){
        return profit*(0.1);
    }
    else if (index === total-1){
        return 0;
    }
    else{
        return profit*(0.05);
    }
}

function analyzeSalesData(data, options) {
    // Проверка входных данных
    if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Некорректные входные данные');
    }

    // Проверка наличия опций
    const {calculateRevenue, calculateBonus} = options;

    if (!(typeof calculateRevenue === "function")
        || !(typeof calculateBonus === "function")) {
        throw new Error('Ошибка в функции');
    }

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        salesCount: 0,
        productsSold: {}
    }));

    // Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(seller=>[seller.id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product=>[product.sku, product]));
    // Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        if (record.length === 0){
            throw new Error("Пустой массив");
        }
        const seller = sellerIndex[record.seller_id];
        seller.salesCount += 1;
        seller.revenue += record.total_amount;
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, productIndex[item.sku]);
            const profit = revenue - cost;
            seller.profit += profit;
            if (!seller.productsSold[item.sku]) {
                seller.productsSold[item.sku] = 0;
            }
            seller.productsSold[item.sku] += item.quantity;
        });
    });

    // Сортировка продавцов по прибыли
    sellerStats.sort((a,b)=>b.profit - a.profit);

    // Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.topProducts = Object.entries(seller.productsSold)
            .map(([sku, quantity]) => ({
                sku: sku,
                quantity: quantity,
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    return sellerStats.map(seller => ({
        sellerId: seller.id,
        name: seller.name,
        revenue: seller.revenue.toFixed(2),
        profit: seller.profit.toFixed(2),
        salesCount: seller.salesCount,
        topProducts: seller.topProducts,
        bonus: seller.bonus.toFixed(2),
    }));
}
