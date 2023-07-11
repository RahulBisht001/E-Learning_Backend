import express from 'express'
import { isAuthenticated } from '../middlewares/auth.js'
import {
    buySubscription,
    cancelSubscription,
    getRazorpayKey, paymentVerification
} from '../controllers/paymentController.js'

const router = express.Router()


//^ Buy Subscription
//todo :  _______ This is not tested yet
router.route('/subscribe')
    .get(isAuthenticated, buySubscription)

//verified payment and reference saved in the database
//todo :  _______ This is not tested yet
router.route('/payment-verification')
    .post(isAuthenticated, paymentVerification)

// get razorpay key
router.route('/razorpayKey')
    .get(isAuthenticated, getRazorpayKey)

// cancel Subscription
//todo :  _______ This is not tested yet
router.route('/subscribe/cancel')
    .delete(isAuthenticated, cancelSubscription)

export default router
