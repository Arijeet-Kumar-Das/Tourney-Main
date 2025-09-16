import express from 'express';
const router = express.Router();
import { createOrder, verifyPayment } from '../../Controllers/Players/paymentController.js';
import { userAuthMiddleware } from '../../Middlewares/jwtAuth.js';

// @desc    Create a new Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
// @desc    Create a new Razorpay order
// @route   POST /api/payments/create-order
// @access  Private (Player)
router.post('/create-order', userAuthMiddleware, createOrder);

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private (Player)
router.post('/verify', userAuthMiddleware, verifyPayment);

export default router;
