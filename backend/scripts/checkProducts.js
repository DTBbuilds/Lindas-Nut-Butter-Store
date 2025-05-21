const axios = require('axios');

async function checkProducts() {
  try {
    const response = await axios.get('http://localhost:5000/api/products');
    const products = response.data;
    
    console.log('\n=== PRODUCTS IN DATABASE ===');
    console.log(`Total products: ${products.length}\n`);
    
    // Group by category
    const byCategory = products.reduce((acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push({
        name: product.name,
        price: product.price,
        variants: product.variants
      });
      return acc;
    }, {});
    
    // Display by category
    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n=== ${category.toUpperCase()} (${items.length}) ===`);
      items.forEach(item => {
        console.log(`\n${item.name}`);
        console.log(`  Price: KES ${item.price}`);
        console.log('  Variants:');
        item.variants.forEach(v => {
          console.log(`    - ${v.mass}g: KES ${v.price} (${v.stock} in stock)`);
        });
      });
    });
    
  } catch (error) {
    console.error('Error checking products:', error.message);
  }
}

checkProducts();
