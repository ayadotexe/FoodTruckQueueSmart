const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');

// 1. Get entire cart
router.get('/:userId', CartController.getCart);

// 2. Add item to cart
router.post('/:userId', CartController.addToCart);

// 3. Clear entire cart
router.delete('/:userId', CartController.clearCart);

// 4. Remove single item
router.delete('/:userId/item/:cartItemId', CartController.removeCartItem);

// 5. Update item quantity
router.put('/:userId/item/:cartItemId', CartController.updateCartItem);

module.exports = router;