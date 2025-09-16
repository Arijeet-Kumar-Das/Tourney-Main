import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with your API keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    
    console.log('Backend - Received payment request:', {
      amount,
      currency,
      receipt,
      body: req.body,
      user: req.user ? req.user.id : 'No user in request'
    });
    
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      payment_capture: 1 // Auto capture payment
    };

    console.log('Backend - Creating Razorpay order with options:', options);
    
    const order = await razorpay.orders.create(options);
    
    console.log('Backend - Razorpay order created:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });
    
    // Include the received amount in the response for debugging
    res.status(200).json({
      success: true,
      order,
      debug: {
        receivedAmount: amount,
        processedAmount: order.amount / 100, // Convert back to rupees from paise
        receipt: receipt
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order',
      error: error.message
    });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;
    
    // Create the expected signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(order_id + '|' + payment_id)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Payment is successful and verified
    // Here you can update your database with the payment details
    // For example, mark the registration as paid

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment_id
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

export { createOrder, verifyPayment };
