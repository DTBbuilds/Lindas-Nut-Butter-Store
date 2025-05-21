/**
 * Custom product import script for Linda's Nut Butter Store
 * This script will add all 18 products with the updated price list
 */

const mongoose = require('mongoose');
const { Product } = require('./server/models');
const config = require('./server/config');

// Product data with appealing names, prices from the provided list, and mapped to existing images
const products = [
  {
    name: "Creamy Almond Butter",
    description: "Our smooth and creamy almond butter is made from premium almonds, carefully roasted and ground to perfection. Enjoy this delicious and nutritious spread on toast, in smoothies, or straight from the jar!",
    price: 1200,
    category: "Almond Butter",
    sku: "ALM-CREAMY-001",
    images: ["/images/plain-almond.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Crunchy Almond Butter",
    description: "For those who prefer a bit of texture, our crunchy almond butter contains delicious chunks of roasted almonds. Rich in protein and healthy fats, this is the perfect addition to your healthy lifestyle.",
    price: 1200,
    category: "Almond Butter",
    sku: "ALM-CRUNCHY-002",
    images: ["/images/almond-butter.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Chocolate Almond Butter",
    description: "The perfect blend of creamy almond butter with rich chocolate. This indulgent spread offers the perfect balance of nutrition and taste for a guilt-free treat any time of day.",
    price: 1400,
    category: "Almond Butter",
    sku: "ALM-CHOC-003",
    images: ["/images/chocolate-almond.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Chocolate Orange Almond Butter",
    description: "A delightful combination of almonds, rich chocolate, and zesty orange. This unique flavor profile creates a luxurious spread that's perfect for special occasions or an everyday treat.",
    price: 1400,
    category: "Almond Butter",
    sku: "ALM-CHOC-ORANGE-004",
    images: ["/images/chocolate-orange-almond.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Spicy Chilli Cashew Butter",
    description: "Our spicy cashew butter combines the creamy texture of premium cashews with a kick of chilli. Perfect for those who enjoy a bit of heat with their healthy snacks.",
    price: 1050,
    category: "Cashew Butter",
    sku: "CASH-CHILLI-005",
    images: ["/images/chilli-choco-cashew-.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Pure Cashew Butter",
    description: "Our signature cashew butter is made from high-quality cashews, slowly roasted and ground to create a smooth, creamy texture. Naturally sweet and nutritious, it's perfect on toast or as an ingredient in your favorite recipes.",
    price: 900,
    category: "Cashew Butter",
    sku: "CASH-PLAIN-006",
    images: ["/images/plain-cashew.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Chocolate Cashew Butter",
    description: "The irresistible combination of smooth cashew butter and rich chocolate creates a luxurious spread that's both nutritious and indulgent. Enjoy as a dip, spread, or straight from the jar!",
    price: 1050,
    category: "Cashew Butter",
    sku: "CASH-CHOC-007",
    images: ["/images/chocolate-cashew.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Chocolate Orange Cashew Butter",
    description: "Our chocolate orange cashew butter combines the smooth texture of cashews with rich chocolate and a refreshing orange zest. A unique flavor combination that's sure to delight your taste buds.",
    price: 1200,
    category: "Cashew Butter",
    sku: "CASH-CHOC-ORANGE-008",
    images: ["/images/chocolate-orange-cashew.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Coconut Cashew Butter",
    description: "Transport yourself to the tropics with our coconut cashew butter. We've combined premium cashews with coconut for a uniquely delicious spread that's perfect in smoothies or as a topping for your morning toast.",
    price: 1050,
    category: "Cashew Butter",
    sku: "CASH-COCO-009",
    images: ["/images/coconut-cashew-butter.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Chocolate Hazelnut Butter",
    description: "Our premium chocolate hazelnut butter is made with the finest hazelnuts and high-quality chocolate for an incredibly rich and satisfying spread. A luxurious treat for any occasion.",
    price: 2600,
    category: "Hazelnut Butter",
    sku: "HAZEL-CHOC-010",
    images: ["/images/chocolate-hazelnut-butter.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Pure Natural Honey",
    description: "Our 100% natural honey is collected from local hives and minimally processed to preserve all its natural goodness. Rich in antioxidants and offering a naturally sweet flavor, it's perfect for drizzling over breakfast or adding to hot drinks.",
    price: 600,
    category: "Honey",
    sku: "HONEY-PURE-011",
    images: ["/images/pure-honey.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Pure Macadamia Nut Butter",
    description: "Our macadamia butter is made from premium macadamia nuts, slowly roasted to perfection and ground into a smooth, creamy butter. With its naturally buttery taste and texture, it's a truly indulgent treat.",
    price: 1050,
    category: "Macadamia Butter",
    sku: "MAC-PLAIN-012",
    images: ["/images/macadamia-butter.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Chocolate Macadamia Butter",
    description: "We've combined the luxurious taste of macadamia nuts with rich chocolate to create this indulgent spread. Perfect for special occasions or as an everyday treat for chocolate lovers.",
    price: 1200,
    category: "Macadamia Butter",
    sku: "MAC-CHOC-013",
    images: ["/images/chocolate-macadamia.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Creamy Peanut Butter",
    description: "Our classic creamy peanut butter is made from premium roasted peanuts, ground to a smooth, spreadable consistency. With no added sugar or oils, it's a nutritious and delicious addition to your pantry.",
    price: 500,
    category: "Peanut Butter",
    sku: "PB-CREAMY-014",
    images: ["/images/creamy-peanut-butter.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Crunchy Peanut Butter",
    description: "For those who prefer some texture, our crunchy peanut butter contains chunks of roasted peanuts for that satisfying crunch. Made from 100% premium peanuts with no additives.",
    price: 500,
    category: "Peanut Butter",
    sku: "PB-CRUNCHY-015",
    images: ["/images/crunchy-peanut-butter.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Chocolate Peanut Butter",
    description: "The perfect blend of our creamy peanut butter with rich chocolate. This indulgent spread offers the best of both worlds - the nutrition of peanuts with the satisfaction of chocolate.",
    price: 800,
    category: "Peanut Butter",
    sku: "PB-CHOC-016",
    images: ["/images/chocolate-peanut.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  },
  {
    name: "Chocolate Mint Peanut Butter",
    description: "A refreshing twist on our popular chocolate peanut butter. We've added natural mint flavor to create a uniquely refreshing spread that's perfect for special treats and desserts.",
    price: 600,
    category: "Peanut Butter",
    sku: "PB-CHOC-MINT-017",
    images: ["/images/mint-chocolate-peanut.jpg"],
    stockQuantity: 0,
    lowStockThreshold: 10,
    inventoryStatus: "OUT_OF_STOCK"
  },
  {
    name: "Pumpkin Seed Butter",
    description: "Our pumpkin seed butter is packed with nutrients and offers a unique flavor profile. Made from premium pumpkin seeds, it's perfect for those looking to add variety to their diet or for those with nut allergies.",
    price: 1000,
    category: "Seed Butter",
    sku: "PUMPKIN-SEED-018",
    images: ["/images/pumpkin-seed-butter.jpg"],
    stockQuantity: 100,
    lowStockThreshold: 10,
    inventoryStatus: "IN_STOCK"
  }
];

// Connect to MongoDB
async function importProducts() {
  try {
    // Connect to the database
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB connected');

    // Check if products already exist
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} products.`);
      const deletePrompt = `Do you want to delete existing products and import new ones? (y/n)`;
      
      // Since we're in a script, we'll proceed with deletion
      console.log('Deleting existing products...');
      await Product.deleteMany({});
      console.log('Existing products deleted.');
    }

    // Import new products
    console.log('Importing new products...');
    const importedProducts = await Product.insertMany(products);
    console.log(`Successfully imported ${importedProducts.length} products:`);
    
    // Log imported products with their names and prices
    importedProducts.forEach(product => {
      console.log(`- ${product.name} (${product.category}) - ${product.price} KES`);
    });

    console.log('\nProducts imported successfully! The store now has all 18 products with unlimited stock.');
    
    // Set special status for Chocolate Mint Peanut Butter
    console.log('\nSetting Chocolate Mint Peanut Butter as available only on order...');
    const mintProduct = await Product.findOne({ sku: 'PB-CHOC-MINT-017' });
    if (mintProduct) {
      mintProduct.stockQuantity = 0;
      mintProduct.inventoryStatus = 'OUT_OF_STOCK';
      await mintProduct.save();
      console.log('Chocolate Mint Peanut Butter status updated - Available on Order');
    }

  } catch (error) {
    console.error('Error importing products:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the import function
importProducts();
