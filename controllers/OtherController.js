import { catchAsyncError } from "../middlewares/catchAsyncError.js"
import ErrorHandler from "../utils/errorHandler.js"

import { sendEmail } from '../utils/sendEmail.js'

import { Stats } from '../models/Stats.js'


//^ _____________________________________________

export const contact = catchAsyncError(
    async (req, res, next) => {

        const { name, email, message } = req.body

        if (!name || !email || !message) {
            return next(new ErrorHandler('Please Fill all the Fields', 400))
        }

        const to = process.env.MY_MAIL
        const subject = "Contact Info from E-Learning User"

        const text = `
\n
Hello Rahul,\n
You have received a message from a user of your E-Learning website.\n
Here are the contact details:\n\n
Name: ${name}\n
Email: ${email}\n\n

Here's Message:\n
${message}\n

Please respond to the user's inquiry as soon as possible.`

        await sendEmail(to, subject, text)
        console.log(text)


        res.status(200)
            .json({
                success: true,
                message: 'Your Message has been sent.'
            })
    }
)


//^ _____________________________________________

export const courseRequest = catchAsyncError(
    async (req, res, next) => {

        const { name, email, course } = req.body

        if (!name || !email || !course) {
            return next(new ErrorHandler('Please Fill all the Fields', 400))
        }

        const to = process.env.MY_MAIL
        const subject = "Course Request By E-Learning User"

        const text = `
\n
Hello Rahul,\n
You have received a Course Request from a user of your E-Learning website.\n
Here are the contact details:\n\n
Name: ${name}\n
Email: ${email}

Here's Course Request:\n
${course}\n
Please respond to the user's inquiry as soon as possible.`

        await sendEmail(to, subject, text)
        console.log(text)


        res.status(200)
            .json({
                success: true,
                message: 'Your Course Request has been sent.'
            })
    }
)

//^ _____________________________________________

export const getDashboardStats = catchAsyncError(
    async (req, res, next) => {

        const stats = await Stats
            .find({})
            .sort({
                createdAt: 'desc'
            })
            .limit(12)

        const statsData = []
        const requiredSize = 12 - stats.length

        for (let i = 0; i < stats.length; ++i) {
            statsData.push(stats[i])
        }

        for (let i = 0; i < requiredSize; ++i) {
            statsData.unshift({
                users: 0,
                subscriptions: 0,
                views: 0
            })
        }

        const usersCount = statsData[11].users
        const subscriptionsCount = statsData[11].subscriptions
        const viewsCount = statsData[11].views

        let usersProfit = true,
            subscriptionsProfit = true,
            viewsProfit = true

        let usersPercentage = 0,
            subscriptionsPercentage = 0,
            viewsPercentage = 0

        if (statsData[10].users === 0)
            usersPercentage = usersCount * 100
        if (statsData[10].views === 0)
            viewsPercentage = viewsCount * 100
        if (statsData[10].subscriptions === 0)
            subscriptionsPercentage = subscriptionsCount * 100

        else {
            const difference = {
                users: statsData[11].users - statsData[10].users,
                subscriptions: statsData[11].subscriptions - statsData[10].subscriptions,
                views: statsData[11].views - statsData[10].views
            }

            usersPercentage = (difference.users / statsData[10].users) * 100
            subscriptionsPercentage = (difference.subscriptions / statsData[10].subscriptions) * 100
            viewsPercentage = (difference.views / statsData[10].views) * 100

            if (usersPercentage < 0)
                usersProfit = false
            if (subscriptionsPercentage < 0)
                subscriptionsProfit = false
            if (viewsPercentage < 0)
                viewsProfit = false
        }

        res.status(200)
            .json({
                success: true,
                stats: statsData,

                usersCount,
                subscriptionsCount,
                viewsCount,

                usersPercentage,
                viewsPercentage,
                subscriptionsPercentage,

                usersProfit,
                subscriptionsProfit,
                viewsProfit,

                message: 'User Stats Received'
            })
    }
)