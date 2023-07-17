import crypto from "crypto";

import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import ErrorHandler from "../utils/errorHandler.js";
import { instance } from "../server.js";


//^ __________________________________________________________________

export const buySubscription = catchAsyncError(async (req, res, next) => {

    const id = req.user._id

    const user = await User.findById(id)


    if (user.role === "admin") {
        return next(new ErrorHandler("Admin Can't Buy Subscription", 401))
    }

    const plan_id = process.env.PLAN_ID || "plan_MCE9dqGij6DlsJ"



    const subscription = await instance.subscriptions.create({
        plan_id,
        customer_notify: 1,
        total_count: 12,
    })

    user.subscription.id = subscription.id
    user.subscription.status = subscription.status

    await user.save()


    res.status(201).json({
        success: true,
        subscriptionId: subscription.id,
    })
})


//^ __________________________________________________________________

export const paymentVerification = catchAsyncError(async (req, res, next) => {

    const { razorpay_subscription_id,
        razorpay_signature, razorpay_payment_id } = req.body;

    const id = req.user._id
    const user = await User.findById(id)

    const subscription_id = user.subscription.id

    const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
        .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
        .digest("hex")

    const isAuthentic = generated_signature === razorpay_signature

    if (!isAuthentic) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment-fail`)
    }

    //* If payment is Authentic then We will store it in the DataBase

    await Payment.create({
        razorpay_signature,
        razorpay_payment_id,
        razorpay_subscription_id,
    })

    user.subscription.status = "active"

    await user.save()

    return res.redirect(
        `${process.env.FRONTEND_URL}/payment-success?reference=${razorpay_payment_id}`
    )
});


//^ __________________________________________________________________

export const getRazorpayKey = catchAsyncError(
    async (req, res, next) => {

        return res.status(200)
            .json({
                success: true,
                key: process.env.RAZORPAY_API_KEY
            });
    }
);

//^ __________________________________________________________________

export const cancelSubscription = catchAsyncError(
    async (req, res, next) => {

        const id = req.user._id
        const user = await User.findById(id)
        const subscriptionId = user.subscription.id

        let refund = false
        instance.subscriptions.cancel(subscriptionId)

        const payment = await Payment.findOne({
            razorpay_subscription_id: subscriptionId
        })
        // console.log(payment)

        //? Finding the gap that wheather the user is eligible for refund
        const gap = Date.now() - payment.createdAt
        const refundTime = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000

        if (refundTime >= gap) {
            refund = true
            // console.log(payment.razorpay_payment_id)
            instance.payments.refund(payment.razorpay_payment_id)
                .then(async (item) => {
                    await Payment.findByIdAndDelete(payment._id)
                    user.subscription.id = undefined
                    user.subscription.status = undefined

                    await user.save()

                    return res.status(200)
                        .json({
                            success: true,
                            message: 'Subscription Cancelled , You will get Refund in 7 working Days.'
                        })
                })
                .catch((err) => {
                    console.log("----------")
                    console.log(err)
                    return res.status(500).json({
                        success: false,
                        message: "Internal server error"
                    })
                })
        }
        else {
            user.subscription.id = undefined
            user.subscription.status = undefined

            await Payment.findByIdAndDelete(payment._id)
            await user.save()

            return res.status(200)
                .json({
                    success: true,
                    message: 'Subscription Cancelled , No Refund initiated as you cancelled subscription after 7 days.'
                })
        }

    }
)