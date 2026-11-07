const db = require('../config/db');

// Get user's cart
exports.getCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const [cart] = await db.query(
      `SELECT c.cart_item_id, c.quantity, m.*
       FROM CartItem c
       JOIN MenuItem m ON c.menu_item_id = m.menu_item_id
       WHERE c.user_id = ?`,
      [userId]
    );
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  const { userId } = req.params;
  const { menu_item_id, quantity = 1 } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT cart_item_id, quantity FROM CartItem WHERE user_id = ? AND menu_item_id = ?',
      [userId, menu_item_id]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE CartItem SET quantity = quantity + ? WHERE cart_item_id = ?',
        [quantity, existing[0].cart_item_id]
      );
    } else {
      await db.query(
        'INSERT INTO CartItem (user_id, menu_item_id, quantity) VALUES (?, ?, ?)',
        [userId, menu_item_id, quantity]
      );
    }
    res.status(200).json({ message: "Cart updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

// Update specific cart item quantity
exports.updateCartItem = async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  try {
    await db.query('UPDATE CartItem SET quantity = ? WHERE cart_item_id = ?', [quantity, cartItemId]);
    res.status(200).json({ message: "Quantity updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update quantity" });
  }
};

// Remove specific item from cart
exports.removeCartItem = async (req, res) => {
  const { cartItemId } = req.params;
  try {
    await db.query('DELETE FROM CartItem WHERE cart_item_id = ?', [cartItemId]);
    res.status(200).json({ message: "Item removed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove item" });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query('DELETE FROM CartItem WHERE user_id = ?', [userId]);
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
};