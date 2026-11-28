const express = require('express');
const { protect } = require('../middleware/auth.middleware'); 
const { createOrder } = require('../controllers/order.controller');

const router = express.Router();

router.post('/', protect, createOrder);

module.exports = router;