const store = require('../menu/store');
const pool = require("../config/db");

exports.getMenu = async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT
      menu_item_id,
      name,
      description,
      category,
      price,
      image_url,
      expected_duration_minutes,
      addons
    FROM MenuItem
    WHERE is_active = TRUE
    ORDER BY menu_item_id
  `);

  const menu = rows.map((item) => ({
    id: item.menu_item_id,
    name: item.name,
    description: item.description || "",
    category: item.category,
    price: Number(item.price),
    image: item.image_url || "",
    expectedDuration: item.expected_duration_minutes,
    priorityLevel: "Normal",
    addons: item.addons || [],
  }));

  res.status(200).json(menu);
};

exports.addMenuItem = async (req, res) => {
  const {
    name,
    description = "",
    category = "food",
    price = 0,
    image = "",
    expectedDuration = 5,
  } = req.body || {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 50
  ) {
    return res.status(400).json({
      error: "Name must contain 1–50 characters.",
    });
  }

  if (
    typeof description !== "string" ||
    description.length > 5000 ||
    typeof image !== "string" ||
    image.length > 2048
  ) {
    return res.status(400).json({
      error: "Description or image URL is invalid or too long.",
    });
  }

  if (!["food", "drink"].includes(category)) {
    return res.status(400).json({
      error: "Category must be food or drink.",
    });
  }

  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 99999999.99 ||
    Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
  ) {
    return res.status(400).json({
      error: "Price must be a nonnegative number with at most two decimal places.",
    });
  }

  if (
    !Number.isInteger(expectedDuration) ||
    expectedDuration < 1 ||
    expectedDuration > 60
  ) {
    return res.status(400).json({
      error: "Preparation time must be an integer from 1 to 60 minutes.",
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO MenuItem
      (name, description, category, price, image_url,
       expected_duration_minutes, addons)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      description,
      category,
      price,
      image,
      expectedDuration,
      JSON.stringify([]),
    ]
  );

  res.status(201).json({
    id: result.insertId,
    name: name.trim(),
    description,
    category,
    price,
    image,
    expectedDuration,
    priorityLevel: "Normal",
    addons: [],
  });
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