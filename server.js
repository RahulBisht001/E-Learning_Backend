import app from "./app.js"
import { connectDB } from "./config/database.js"

import cloudinary from 'cloudinary'
import Razorpay from 'razorpay'
import nodeCron from 'node-cron'

import { Stats } from './models/Stats.js'



//^  MongoDB connection Function

connectDB()

//^  Creating Instance of Razorpay

export const instance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
});



//^  Cloudinary Configuration 

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    api_key: process.env.CLOUDINARY_API_KEY,
})

//^ nodeCron config

nodeCron.schedule('0 0 0 1 * *', async () => {
    try {

        await Stats.create({})
    } catch (err) {
        console.log(err)
    }
})

app.listen(process.env.PORT, () => {
    console.log(`Server is listening on PORT http://localhost:${process.env.PORT}`)
})