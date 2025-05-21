// Product data with local image paths
const products = [
  // Coconut Cashew Butter - New Product
  {
    id: 16,
    name: 'Coconut Cashew Butter',
    price: 1050, // Updated to match Cashew Butter - Coconut
    originalPrice: null,
    image: '/images/coconut-cashew-butter.jpg',
    secondaryImage: '/images/coconut-cashew-butter.jpg',
    description: 'A delightful blend of premium cashews and coconut for a tropical flavor experience.',
    features: ['Tropical Flavor', 'Organic', 'Vegan'],
    rating: 4.8,
    reviews: 32,
    inStock: true,
    size: '370g',
    category: 'Cashew',
    variants: [
      { mass: 370, price: 1050, stock: 18 }, // Single 370g variant with updated price
    ]
  },
  // Almond Butters
  {
    id: 1,
    name: 'Creamy Almond Butter',
    price: 1200, // Updated to match Almond Butter - Creamy
    originalPrice: null,
    image: '/images/plain-almond.jpg',
    secondaryImage: '/images/chocolate-almond.jpg',
    description: 'Our signature smooth almond butter made from premium organic almonds.',
    features: ['Organic', 'Vegan', 'No Added Sugar'],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    size: '370g',
    category: 'Almonds',
    variants: [
      { mass: 370, price: 1200, stock: 18 }, // Single 370g variant with correct price
    ]
  },
  {
    id: 2,
    name: 'Chocolate Almond Butter',
    price: 1400, // Confirmed price for Almond Butter - Chocolate
    originalPrice: null,
    image: '/images/chocolate-almond-butter.jpg',
    secondaryImage: '/images/chocolate-almond-butter.jpg',
    description: 'Creamy almond butter with rich chocolate for a delightful flavor experience.',
    features: ['Organic', 'No Added Sugar'],
    rating: 4.7,
    reviews: 86,
    inStock: true,
    size: '370g',
    category: 'Almonds',
    variants: [
      { mass: 370, price: 1400, stock: 33 } // Ensure variant price matches base price
    ]
  },
  {
    id: 19, // Adding the missing product
    name: 'Almond Butter - Chocolate Orange',
    price: 1400, // Correct price as per list
    originalPrice: null,
    image: '/images/chocolate-orange-almond.jpg',
    secondaryImage: '/images/chocolate-orange-almond.jpg',
    description: 'A delightful blend of orange-infused chocolate and creamy almond butter.',
    features: ['Organic', 'Limited Edition', 'Vegan'],
    rating: 4.9,
    reviews: 42,
    inStock: true,
    size: '370g',
    category: 'Almonds',
    variants: [
      { mass: 370, price: 1400, stock: 22 } // Single 370g variant with correct price
    ]
  },
  {
    id: 3,
    name: 'Pure Honey',
    price: 600, // Confirmed price for Honey
    originalPrice: null,
    image: '/images/pure-honey.jpg',
    secondaryImage: '/images/plain-almond.jpg',
    description: 'Pure, natural wildflower honey sourced from local Kenyan beekeepers.',
    features: ['Natural Sweetener', 'Gluten-Free'],
    rating: 4.5,
    reviews: 67,
    inStock: true,
    size: '370g',
    category: 'Honey',
    variants: [
      { mass: 212, price: 400, stock: 10 },
      { mass: 370, price: 600, stock: 8 },
    ]
  },
  
  // Cashew Butters
  {
    id: 4,
    name: 'Creamy Cashew Butter',
    price: 900, // Updated to match Cashew Butter - Plain
    originalPrice: null,
    image: '/images/cashew-butter.jpg',
    secondaryImage: '/images/cashew-butter.jpg',
    description: 'Luxuriously smooth cashew butter made from organic cashews.',
    features: ['Organic', 'Creamy Texture'],
    rating: 4.9,
    reviews: 76,
    inStock: true,
    size: '370g',
    category: 'Cashew',
    variants: [
      { mass: 370, price: 1200, stock: 18 }, // Single 370g variant with correct price
    ]
  },
  {
    id: 17,
    name: 'Spicy Chili Cashew Butter',
    price: 1050, // Confirmed price for Cashew Butter - Chilli
    originalPrice: null,
    image: '/images/chilli-choco-cashew-.jpg',
    secondaryImage: '/images/chilli-choco-cashew-.jpg',
    description: 'A spicy twist on our cashew butter with a kick of chili peppers.',
    features: ['Spicy Flavor', 'Organic', 'Vegan'],
    rating: 4.7,
    reviews: 48,
    inStock: true,
    size: '370g',
    category: 'Cashew',
    variants: [
      { mass: 212, price: 850, stock: 10 },
      { mass: 370, price: 1050, stock: 8 },
    ]
  },
  {
    id: 5,
    name: 'Chocolate Cashew Butter',
    price: 1050, // Confirmed price for Cashew Butter - Chocolate
    originalPrice: null,
    image: '/images/chocolate-cashew.jpg',
    secondaryImage: '/images/plain-cashew.jpg',
    description: 'Smooth cashew butter blended with rich chocolate for a decadent treat.',
    features: ['Organic', 'Natural Sweetener'],
    rating: 4.8,
    reviews: 58,
    inStock: true,
    size: '370g',
    category: 'Cashew',
    variants: [
      { mass: 370, price: 1050, stock: 18 }, // Single 370g variant with updated price
    ]
  },
  {
    id: 20, // Adding the missing product
    name: 'Cashew Butter - Chocolate Orange',
    price: 1200, // Correct price as per list
    originalPrice: null,
    image: '/images/chocolate-orange-cashew.jpg',
    secondaryImage: '/images/chocolate-orange-cashew.jpg',
    description: 'Vibrant orange and rich chocolate infused with creamy cashew butter.',
    features: ['Organic', 'Limited Edition', 'Vegan'],
    rating: 4.8,
    reviews: 38,
    inStock: true,
    size: '370g',
    category: 'Cashew',
    variants: [
      { mass: 370, price: 1200, stock: 20 } // Single 370g variant with correct price
    ]
  },
  
  // Macadamia Butters
  {
    id: 6,
    name: 'Macadamia Nut Butter',
    price: 1050, // Updated to match Macadamia Nut Butter
    originalPrice: null,
    image: '/images/macadamia-butter.jpg',
    secondaryImage: '/images/macadamia-butter.jpg',
    description: 'Premium macadamia nut butter with a rich, buttery texture and flavor.',
    features: ['Keto-Friendly', 'High in Healthy Fats'],
    rating: 4.9,
    reviews: 42,
    inStock: true,
    size: '370g',
    category: 'Macadamia',
    variants: [
      { mass: 370, price: 1050, stock: 18 }, // Single 370g variant with updated price
    ]
  },
  {
    id: 7,
    name: 'Chocolate Macadamia Butter',
    price: 1200, // Confirmed price for Macadamia Butter - Chocolate
    originalPrice: null,
    image: '/images/chocolate macadamia.jpg',
    secondaryImage: '/images/macadamia butter.jpg',
    description: 'Premium macadamia nut butter blended with rich chocolate for a luxurious spread.',
    features: ['Limited Edition', 'No Added Sugar'],
    rating: 4.8,
    reviews: 36,
    inStock: true,
    size: '370g',
    category: 'Macadamia',
    variants: [
      { mass: 370, price: 1200, stock: 18 }, // Single 370g variant with correct price
    ]
  },
  
  // Peanut Butters
  {
    id: 8,
    name: 'Creamy Peanut Butter',
    price: 500, // Confirmed price for Peanut Butter - Creamy
    originalPrice: null,
    image: '/images/creamy-peanut-butter.jpg',
    secondaryImage: '/images/creamy-peanut-butter.jpg',
    description: 'Classic smooth peanut butter made with roasted peanuts.',
    features: ['Gluten-Free', 'High Protein'],
    rating: 4.7,
    reviews: 112,
    inStock: true,
    size: '370g',
    category: 'Peanut',
    variants: [
      { mass: 370, price: 500, stock: 18 }, // Single 370g variant with correct price
    ]
  },
  {
    id: 9,
    name: 'Crunchy Peanut Butter',
    price: 500, // Confirmed price for Peanut Butter Crunchy
    originalPrice: null,
    image: '/images/crunchy-peanut-butter.jpg',
    secondaryImage: '/images/crunchy-peanut-butter.jpg',
    description: 'Classic crunchy peanut butter with bits of roasted peanuts for extra texture.',
    features: ['Gluten-Free', 'High Protein'],
    rating: 4.6,
    reviews: 98,
    inStock: true,
    size: '370g',
    category: 'Peanut',
    variants: [
      { mass: 370, price: 500, stock: 18 }, // Single 370g variant with correct price
    ]
  },
  {
    id: 10,
    name: 'Chocolate Peanut Butter',
    price: 800, // Updated to match Peanut Butter - Chocolate
    originalPrice: null,
    image: '/images/chocolate-peanut.jpg',
    secondaryImage: '/images/chocolate-peanut.jpg',
    description: 'Smooth peanut butter blended with rich chocolate for a delicious treat.',
    features: ['Natural Sweetener', 'Kid-Friendly'],
    rating: 4.5,
    reviews: 74,
    inStock: true,
    size: '370g',
    category: 'Peanut',
    variants: [
      { mass: 370, price: 800, stock: 18 }, // Single 370g variant with correct price
    ]
  },
  {
    id: 18, // Adding the missing product
    name: 'Peanut Butter - Chocolate Mint',
    price: 600, // Correct price as per list
    originalPrice: null,
    image: '/images/mint-chocolate-peanut.jpg',
    secondaryImage: '/images/mint-chocolate-peanut.jpg',
    description: 'Refreshing mint chocolate peanut butter - special order only.',
    features: ['Special Order Only', 'Limited Edition', 'Seasonal'],
    rating: 4.9,
    reviews: 12,
    inStock: false, // Not in stock since it's special order only
    size: '370g',
    category: 'Peanut',
    variants: [
      { mass: 370, price: 600, stock: 0 }, // Special order only
    ]
  },
  
  // Hazelnut Butters
  {
    id: 11,
    name: 'Chocolate Hazelnut Spread',
    price: 2600, // Updated to match Hazelnut Butter - Chocolate
    originalPrice: null,
    image: '/images/chocolate hezelnut.jpg',
    secondaryImage: '/images/chocolate hezelnut.jpg',
    description: 'Indulgent chocolate hazelnut spread made with premium hazelnuts and cocoa.',
    features: ['Vegan', 'No Palm Oil'],
    rating: 4.7,
    reviews: 112,
    inStock: true,
    size: '370g',
    category: 'Hazelnut',
    variants: [
      { mass: 370, price: 2600, stock: 18 }, // Single 370g variant with correct price
    ]
  },
  {
    id: 12,
    name: 'Pure Hazelnut Butter',
    price: 2600, // Updated to match Hazelnut Butter - Chocolate
    originalPrice: null,
    image: '/images/chocolate-hazelnut-butter.jpg',
    secondaryImage: '/images/chocolate-hazelnut-butter.jpg',
    description: 'Pure hazelnut butter made from roasted hazelnuts with no added ingredients.',
    features: ['100% Nuts', 'Organic'],
    rating: 4.8,
    reviews: 64,
    inStock: true,
    size: '370g',
    category: 'Hazelnut',
    variants: [
      { mass: 370, price: 2600, stock: 18 }, // Single 370g variant with correct price
    ]
  },
  
  // Seed Butters
  {
    id: 13,
    name: 'Sunflower Seed Butter',
    price: 900,
    originalPrice: null,
    image: '/images/chocolate-peanut.jpg',
    secondaryImage: '/images/crunchy-chocolate-peanut.jpg',
    description: 'Creamy sunflower seed butter, perfect for those with nut allergies.',
    features: ['Nut-Free', 'Allergy-Friendly'],
    rating: 4.6,
    reviews: 88,
    inStock: true,
    size: '370g',
    category: 'Seed Butters',
    variants: [
      { mass: 370, price: 1200, stock: 18 }, // Single 370g variant with correct price
    ]
  },
  {
    id: 14,
    name: 'Pumpkin Seed Butter',
    price: 1000, // Updated to match Pumpkin Seed Butter
    originalPrice: null,
    image: '/images/pumpkin-seed-butter.jpg',
    secondaryImage: '/images/pumpkin-seed-butter.jpg',
    description: 'Nutritious pumpkin seed butter rich in minerals and antioxidants.',
    features: ['Nut-Free', 'High in Magnesium'],
    rating: 4.5,
    reviews: 56,
    inStock: true,
    size: '370g',
    category: 'Seed Butters',
    variants: [
      { mass: 370, price: 1050, stock: 18 }, // Single 370g variant with updated price
    ]
  },
  {
    id: 15,
    name: 'Mixed Seed Butter',
    price: 1000, // Using Pumpkin Seed Butter price as reference
    originalPrice: null,
    image: '/images/pure-honey.jpg',
    secondaryImage: '/images/chocolate-peanut.jpg',
    description: 'A blend of sunflower, pumpkin, flax, and chia seeds for maximum nutrition.',
    features: ['Nut-Free', 'Omega-Rich'],
    rating: 4.7,
    reviews: 42,
    inStock: true,
    size: '370g',
    category: 'Seed Butters',
    variants: [
      { mass: 370, price: 1000, stock: 18 }, // Single 370g variant with correct price
    ]
  }
];

export default products;
