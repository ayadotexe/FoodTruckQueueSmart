let menuItems = [
  {
    id: 1,
    name: "Carne Asada Tacos",
    description: "2 carne asada tacos with corn tortillas, cilantro, and salsa.",
    category: "food",
    price: 5.00, 
    image: "https://images.themodernproper.com/production/posts/CarneAsadaTacos_5.jpg?w=1200&h=1200&q=60&fm=jpg&fit=crop&dm=1756447357&s=2f007a91722e9db076a4c8e609c6c9b2",
    addons: ["Extra Salsa", "No Onions", "Extra Lime"],
    expectedDuration: 5,
    priorityLevel: "Normal"
  },
  {
    id: 2,
    name: "Tacos Al Pastor",
    description: "2 tacos with thinly sliced pork, cilantro, salsa, and corn tortillas.",
    category: "food",
    price: 4.00, 
    image: "https://www.allrecipes.com/thmb/0A1rK8Wiyq2ojdIQFTtjjrOCmfU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/257538-authentic-tacos-al-pastor-VAT-Beauty-4x3-f65ed2ca0f0c4958a44ee51d0ea02a62.jpg",
    addons: ["Extra Salsa", "No Onions", "Extra Lime"],
    expectedDuration: 5,
    priorityLevel: "Normal"
  },
  {
    id: 3,
    name: "Chicken Tacos",
    description: "2 chicken tacos with corn tortillas, cilantro, and salsa.",
    category: "food",
    price: 4.00, 
    image: "https://www.blessthismessplease.com/wp-content/uploads/2019/09/chicken-taco-5-of-5.jpg",
    addons: ["Extra Salsa", "No Onions", "Extra Lime"],
    expectedDuration: 5,
    priorityLevel: "Normal"
  },
  {
    id: 4,
    name: "Mulitas de Birria",
    description: "Birria with Oaxaca cheese, onions, cilantro, and salsa in between two corn tortillas.",
    category: "food",
    price: 6.00, 
    image: "https://tb-static.uber.com/prod/image-proc/processed_images/8d4ebd843832033ed039c8d6a8944c71/70aa2a4db7f990373ca9c376323e3dea.jpeg",
    addons: ["Extra Salsa", "No Onions"],
    expectedDuration: 6,
    priorityLevel: "Normal"
  },
  {
    id: 5,
    name: "Bottled Coke",
    description: "Cold Mexican Coca-Cola.",
    category: "drink",
    price: 2.50, 
    image: "https://images.albertsons-media.com/is/image/ABS/960508901-ECOM?$ng-ecom-pdp-desktop$&defaultImage=Not_Available",
    addons: [],
    expectedDuration: 3,
    priorityLevel: "Normal"
  },
  {
    id: 6,
    name: "Mangonada",
    description: "Mango sorbet topped with tajin, chamoy, lime, and mango chunks.",
    category: "drink",
    price: 6.00, 
    image: "https://www.lemonblossoms.com/wp-content/uploads/2022/02/Mangonada-S1.jpg",
    addons: [],
    expectedDuration: 3,
    priorityLevel: "Normal"
  }

];

let nextId = 7;

module.exports = { menuItems, nextId };