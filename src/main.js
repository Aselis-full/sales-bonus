function calculateSimpleRevenue(purchase, _product) {
    const {discount, sale_price, quantity} = purchase;
    if (sale_price === undefined || quantity === undefined) {
        throw new Error('Отсутствуют поля sale_price или quantity');
    }
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

    //Проверка массива purchase_records
    if (!data.purchase_records || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('purchase_records должен быть непустым массивом');
    }

    if (!(typeof calculateRevenue === "function")
        || !(typeof calculateBonus === "function")) {
        throw new Error('Ошибка в функции');
    }

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(seller=>[seller.id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product=>[product.sku, product]));
    // Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count += 1;
        seller.revenue += record.total_amount;
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, productIndex[item.sku]);
            const profit = revenue - cost;
            seller.profit += profit;
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Сортировка продавцов по прибыли
    sellerStats.sort((a,b)=>b.profit - a.profit);

    // Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({
                sku: sku,
                quantity: quantity,
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: parseFloat(seller.revenue.toFixed(2)),
        profit: parseFloat(seller.profit.toFixed(2)),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: parseFloat(seller.bonus.toFixed(2)),
    }));
}
