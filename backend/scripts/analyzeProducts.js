const axios = require('axios');

async function analyzeProducts() {
  try {
    const response = await axios.get('http://localhost:5000/api/products');
    const products = response.data;
    
    // Print raw data for the first product
    console.log('\n=== SAMPLE PRODUCT DATA ===');
    console.log(JSON.stringify(products[0], null, 2));

    
    console.log('\n=== PRODUCT ANALYSIS ===');
    console.log(`Total products: ${products.length}\n`);
    
    // Check for duplicate names
    const nameMap = {};
    const duplicateNames = [];
    
    products.forEach(product => {
      if (nameMap[product.name]) {
        duplicateNames.push(product.name);
      } else {
        nameMap[product.name] = true;
      }
    });
    
    if (duplicateNames.length > 0) {
      console.log('⚠️ DUPLICATE NAMES FOUND:');
      duplicateNames.forEach(name => console.log(`  - ${name}`));
    } else {
      console.log('✅ No duplicate names found');
    }
    
    // Check for duplicate IDs
    const idMap = {};
    const duplicateIds = [];
    
    products.forEach(product => {
      if (idMap[product.id]) {
        duplicateIds.push(product.id);
      } else {
        idMap[product.id] = true;
      }
    });
    
    if (duplicateIds.length > 0) {
      console.log('\n⚠️ DUPLICATE IDs FOUND:');
      duplicateIds.forEach(id => console.log(`  - ${id}`));
    } else {
      console.log('✅ No duplicate IDs found');
    }
    
    // Check for missing images
    const missingImages = products.filter(p => !p.images || p.images.length === 0 || !p.images[0]);
    
    if (missingImages.length > 0) {
      console.log('\n⚠️ PRODUCTS WITH MISSING IMAGES:');
      missingImages.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`));
    } else {
      console.log('✅ All products have images');
    }
    
    // Check for inconsistent pricing
    const pricingIssues = [];
    
    products.forEach(product => {
      if (!product.variants || product.variants.length === 0) {
        pricingIssues.push(`${product.name} (ID: ${product.id}) - No variants defined`);
      } else {
        // Check if main price matches largest variant price
        const largestVariant = product.variants.reduce((prev, current) => 
          (prev.mass > current.mass) ? prev : current);
          
        if (product.price !== largestVariant.price) {
          pricingIssues.push(`${product.name} (ID: ${product.id}) - Main price (${product.price}) doesn't match largest variant price (${largestVariant.price})`);
        }
        
        // Check if smaller variants are cheaper than larger ones
        const sortedVariants = [...product.variants].sort((a, b) => a.mass - b.mass);
        for (let i = 0; i < sortedVariants.length - 1; i++) {
          if (sortedVariants[i].price >= sortedVariants[i+1].price) {
            pricingIssues.push(`${product.name} (ID: ${product.id}) - Smaller variant (${sortedVariants[i].mass}g) price (${sortedVariants[i].price}) is >= larger variant (${sortedVariants[i+1].mass}g) price (${sortedVariants[i+1].price})`);
          }
        }
      }
    });
    
    if (pricingIssues.length > 0) {
      console.log('\n⚠️ PRICING ISSUES FOUND:');
      pricingIssues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ No pricing issues found');
    }
    
    // Check for naming consistency
    const namingPatterns = {
      'Almond': /^Almond Butter - /,
      'Peanut': /^Peanut Butter - /,
      'Cashew': /^Cashew Butter - /
    };
    
    const namingIssues = [];
    
    products.forEach(product => {
      if (namingPatterns[product.category] && !namingPatterns[product.category].test(product.name)) {
        namingIssues.push(`${product.name} (ID: ${product.id}) - Name doesn't follow category pattern`);
      }
    });
    
    if (namingIssues.length > 0) {
      console.log('\n⚠️ NAMING CONSISTENCY ISSUES:');
      namingIssues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ Product naming is consistent');
    }
    
    console.log('\n=== ANALYSIS COMPLETE ===');
    
  } catch (error) {
    console.error('Error analyzing products:', error.message);
  }
}

analyzeProducts();
