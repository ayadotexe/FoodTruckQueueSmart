const express = require('express');
const router = express.Router();

const MenuController = require('../controllers/MenuController');

router.get('/', MenuController.getMenu);
router.post('/', MenuController.addMenuItem);
router.delete('/:id', MenuController.deleteMenuItem);
router.put('/:id', MenuController.updateMenuItem);

module.exports = router;