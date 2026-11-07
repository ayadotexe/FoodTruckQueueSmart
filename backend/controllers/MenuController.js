// const store = require('../menu/store');
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

// added by aya
exports.deleteMenuItem = async (req, res) => {
  const itemId = Number(req.params.id);

  if (
    !Number.isInteger(itemId) ||
    itemId < 1 ||
    itemId > 4294967295
  ) {
    return res.status(400).json({ error: "Invalid menu item ID." });
  }

  const [result] = await pool.execute(
    `UPDATE MenuItem
     SET is_active = FALSE
     WHERE menu_item_id = ? AND is_active = TRUE`,
    [itemId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Item not found" });
  }

  res.status(200).json({ message: "Item removed successfully" });
};

// exports.updateMenuItem = (req, res) => {
//   const itemId = parseInt(req.params.id);
//   const itemIndex = store.menuItems.findIndex(item => item.id === itemId);

//   if (itemIndex === -1) {
//     return res.status(404).json({ error: "Item not found" });
//   }

//   // merge  existing with new
//   const updatedItem = { ...store.menuItems[itemIndex], ...req.body };
//   store.menuItems[itemIndex] = updatedItem;

//   res.status(200).json(updatedItem);
// };

// TO BE CHANGED BELOW
exports.updateMenuItem = async (req, res) => {
  const itemId = Number(req.params.id);

  if (
    !Number.isInteger(itemId) ||
    itemId < 1 ||
    itemId > 4294967295
  ) {
    return res.status(400).json({ error: "Invalid menu item ID." });
  }

  const {
    name,
    description,
    category,
    price,
    image,
    expectedDuration,
  } = req.body || {};

  if (
    name !== undefined &&
    (typeof name !== "string" || !name.trim() || name.length > 50)
  ) {
    return res.status(400).json({
      error: "Name must contain 1–50 characters.",
    });
  }

  if (
    (description !== undefined &&
      (typeof description !== "string" || description.length > 5000)) ||
    (image !== undefined &&
      (typeof image !== "string" || image.length > 2048))
  ) {
    return res.status(400).json({
      error: "Description or image URL is invalid or too long.",
    });
  }

  if (category !== undefined && !["food", "drink"].includes(category)) {
    return res.status(400).json({
      error: "Category must be food or drink.",
    });
  }

  if (
    price !== undefined &&
    (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 99999999.99 ||
      Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
    )
  ) {
    return res.status(400).json({
      error: "Price must be a nonnegative number with at most two decimal places.",
    });
  }

  if (
    expectedDuration !== undefined &&
    (
      !Number.isInteger(expectedDuration) ||
      expectedDuration < 1 ||
      expectedDuration > 60
    )
  ) {
    return res.status(400).json({
      error: "Preparation time must be an integer from 1 to 60 minutes.",
    });
  }

  if (
    [name, description, category, price, image, expectedDuration]
      .every((value) => value === undefined)
  ) {
    return res.status(400).json({
      error: "Provide at least one menu field to update.",
    });
  }

  const [result] = await pool.execute(
    `UPDATE MenuItem
     SET name = COALESCE(?, name),
         description = COALESCE(?, description),
         category = COALESCE(?, category),
         price = COALESCE(?, price),
         image_url = COALESCE(?, image_url),
         expected_duration_minutes =
           COALESCE(?, expected_duration_minutes)
     WHERE menu_item_id = ? AND is_active = TRUE`,
    [
      name === undefined ? null : name.trim(),
      description ?? null,
      category ?? null,
      price ?? null,
      image ?? null,
      expectedDuration ?? null,
      itemId,
    ]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Item not found" });
  }

  const [rows] = await pool.execute(
    `SELECT *
     FROM MenuItem
     WHERE menu_item_id = ? AND is_active = TRUE`,
    [itemId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: "Item not found" });
  }

  const item = rows[0];

  res.status(200).json({
    id: item.menu_item_id,
    name: item.name,
    description: item.description || "",
    category: item.category,
    price: Number(item.price),
    image: item.image_url || "",
    expectedDuration: item.expected_duration_minutes,
    priorityLevel: "Normal",
    addons: item.addons || [],
  });
};