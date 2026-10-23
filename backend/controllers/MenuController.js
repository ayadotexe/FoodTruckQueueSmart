const store = require('../menu/store');

exports.getMenu = (req, res) => {
  res.status(200).json(store.menuItems);
};

exports.addMenuItem = (req, res) => {
  const { name, description, expectedDuration, priorityLevel, category, price, image } = req.body;

  if (!name || typeof name !== 'string' || name.length > 50) {
    return res.status(400).json({ error: "Valid name under 50 characters is required." });
  }

  const newItem = {
    id: store.nextId++,
    name,
    description: description || "",
    category: category || "food",
    price: price || 0,
    image: image || "", // image link
    expectedDuration: expectedDuration || 5,
    priorityLevel: priorityLevel || "Normal",
    addons: []
  };
  
  store.menuItems.push(newItem);
  res.status(201).json(newItem);
};

exports.deleteMenuItem = (req, res) => {
  const itemId = parseInt(req.params.id);
  store.menuItems = store.menuItems.filter(item => item.id !== itemId);
  res.status(200).json({ message: "Item removed successfully" });
};

exports.updateMenuItem = (req, res) => {
  const itemId = parseInt(req.params.id);
  const itemIndex = store.menuItems.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  // merge  existing with new
  const updatedItem = { ...store.menuItems[itemIndex], ...req.body };
  store.menuItems[itemIndex] = updatedItem;

  res.status(200).json(updatedItem);
};