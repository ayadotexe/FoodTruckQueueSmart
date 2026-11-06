const db = require('../db'); 

// 1. GET ALL ITEMS
exports.getMenu = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM MenuItem');
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
};

// 2. ADD NEW ITEM
exports.addMenuItem = async (req, res) => {
  const { name, description, expectedDuration, category, price, image } = req.body;

  if (!name || typeof name !== 'string' || name.length > 50) {
    return res.status(400).json({ error: "Valid name under 50 characters is required." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO MenuItem 
      (name, description, category, price, image_url, expected_duration_minutes) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name, 
        description || null, 
        category || "food", 
        price || 0, 
        image || null, 
        expectedDuration || 5
      ]
    );
    
    res.status(201).json({ message: "Item added", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add menu item" });
  }
};

// 3. DELETE ITEM
exports.deleteMenuItem = async (req, res) => {
  const itemId = parseInt(req.params.id);
  
  try {
    await db.query('DELETE FROM MenuItem WHERE menu_item_id = ?', [itemId]);
    res.status(200).json({ message: "Item removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete item" });
  }
};

// 4. UPDATE ITEM
exports.updateMenuItem = async (req, res) => {
  const itemId = parseInt(req.params.id);
  const { name, description, category, price, image, expectedDuration } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE MenuItem 
       SET name = COALESCE(?, name), 
           description = COALESCE(?, description), 
           category = COALESCE(?, category), 
           price = COALESCE(?, price), 
           image_url = COALESCE(?, image_url), 
           expected_duration_minutes = COALESCE(?, expected_duration_minutes)
       WHERE menu_item_id = ?`,
      [name, description, category, price, image, expectedDuration, itemId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json({ message: "Item updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update item" });
  }
};