import crypto from 'crypto'
import cloudinary from 'cloudinary'

import { catchAsyncError } from '../middlewares/catchAsyncError.js'
import ErrorHandler from '../utils/errorHandler.js'

import { User } from '../models/User.js'
import { Stats } from '../models/Stats.js'

import { Course } from '../models/Course.js'
import { sendToken } from '../utils/sendToken.js'
import { sendEmail } from '../utils/sendEmail.js'

import getDataURI from '../utils/dataURI.js'



//^ ____________________________________________________

export const register = catchAsyncError(
    async (req, res, next) => {

        const { name, email, password } = req.body
        const file = req.file

        if (!name || !email || !password || !file) {
            return next(new ErrorHandler("Please fill all the fields", 400))
        }

        //* This end point will check that either user already exist in the database or not
        const existing_user = await User.findOne({ email })

        if (existing_user) {
            return next(new ErrorHandler("User Already Exist", 409))
        }

        //^ If it a new User : Upload file on cloudinary
        //* this is avatar File

        const fileUri = await getDataURI(file)
        const myCloud = await cloudinary.v2.uploader.upload(fileUri.content)


        const new_user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            }
        })

        sendToken(res, new_user, "Account Created Successfully", 201)
    }
)


//^ ____________________________________________________

export const login = catchAsyncError(
    async (req, res, next) => {

        const { email, password } = req.body

        if (!email || !password) {
            return next(new ErrorHandler("Please fill all the fields", 400))
        }

        const user = await User.findOne({ email }).select('+password')
        // console.log(user)
        if (!user) {
            return next(new ErrorHandler("Incorrect Email or Password", 401))
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return next(new ErrorHandler("Incorrect Email or Password", 401))
        }

        sendToken(res, user, `Welcome Back , ${user.name}`, 200)
    }
)

//^ ____________________________________________________

export const logout = catchAsyncError(
    async (req, res, next) => {

        res.status(200)
            .cookie('token', null, {
                expires: new Date(Date.now()),
                httpOnly: true,
                // secure: true,
                // sameSite: 'none',
            })
            .json({
                success: true,
                message: "Logout Successfully"
            })
    }
)

//^ ____________________________________________________

export const getMyProfile = catchAsyncError(
    async (req, res, next) => {

        const user = await User.findById(req.user._id)

        return res.status(200)
            .json({
                success: true,
                user
            })
    }
)

//^ ____________________________________________________

export const changePassword = catchAsyncError(
    async (req, res, next) => {

        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler("All Fields are required", 400))
        }

        const user = await User.findById(req.user._id).select("+password")

        const isMatch = await user.comparePassword(oldPassword)

        if (!isMatch) {
            return next(new ErrorHandler("Incorrect Old Password", 400))
        }

        user.password = newPassword
        await user.save()

        return res.status(200)
            .json({
                success: true,
                message: "Password Changed Successfully"
            })
    })

//^ ____________________________________________________

export const updateProfile = catchAsyncError(
    async (req, res, next) => {

        const { name, email } = req.body

        const user = await User.findById(req.user._id)

        if (name) user.name = name
        if (email) user.email = email

        await user.save()

        return res.status(200)
            .json({
                success: true,
                message: "Profile Updated Successfully"
            })
    }
)

//^ ____________________________________________________

export const updateProfilePicture = catchAsyncError(
    async (req, res, next) => {

        const user = await User.findById(req.user._id)

        const file = req.file
        const fileUri = await getDataURI(file)
        const myCloud = await cloudinary.v2.uploader.upload(fileUri.content)

        await cloudinary.v2.uploader.destroy(user.avatar.public_id)

        user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }

        await user.save()

        res.status(200)
            .json({
                message: "Profile Picture Updated Successfully"
            })
    }
)

//^ ____________________________________________________

export const forgotPassword = catchAsyncError(
    async (req, res, next) => {

        const { email } = req.body

        if (!email) {
            return next(new ErrorHandler("All Fields are required", 400))
        }

        const user = await User.findOne({ email })
        if (!user) {
            return next(new ErrorHandler("No user Found with this Email", 400))
        }

        const resetToken = await user.getResetToken()

        await user.save()

        const url = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
        const message = `Click on this link to reset Your Password ${url}
        If you have not requested then please ignore.`

        //^ send this reset token via email to the user
        await sendEmail(user.email, "Reset password token", message)


        //* This code is not mandatory it is just to make the message more secure.
        //* we will be sending the email with * not the full email
        //? Ex: not rahul@gamil.com but as ra***@gmail.com
        //?___________________________________________________

        const userEmail = user.email
        const atIndex = userEmail.indexOf('@')
        const username = userEmail.slice(0, 2)
        const domain = userEmail.slice(atIndex)

        const maskedEmail = username + '*'.repeat(10) + domain

        res.status(200)
            .json({
                success: true,
                message: `Reset password link has been sent to ${maskedEmail}`,
            })
    }
)

//^ ____________________________________________________

export const resetPassword = catchAsyncError(
    async (req, res, next) => {

        const { token } = req.params

        const resetPasswordToken
            = crypto.createHash('sha256')
                .update(token)
                .digest('hex')

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        })

        if (user === null || !user) {
            return res.status(401).json({
                success: false,
                message: "Reset Token is Invalid or has been Expired"
            })
            // return next(new ErrorHandler("Reset Token is Invalid or has been Expired", 401))
        }


        user.password = req.body.password
        user.resetPasswordExpires = undefined
        user.resetPasswordToken = undefined

        await user.save()


        res.status(200)
            .json({
                success: true,
                message: 'Password Reset Successfully'
            })

    }
)

//^ ____________________________________________________

export const addToPlaylist = catchAsyncError(
    async (req, res, next) => {

        const user = await User.findById(req.user._id)
        const course = await Course.findById(req.body.id)

        if (!course) {
            return next(new ErrorHandler("Course Not Found with this id", 404))
        }

        const itemExist = user.playlist.find((item) => {
            if (item.course.toString() === course._id.toString())
                return true
        })

        if (itemExist) {
            return next(new ErrorHandler("Course Already Exist in the Playlist"), 409)
        }
        user.playlist.push({
            course: course._id,
            poster: course.poster.url,
            //* ____ update 
            title: course.title
        })

        await user.save()

        return res.status(200)
            .json({
                success: true,
                message: 'Course Added to Playlist Successfully'
            })
    }
)

//^ ____________________________________________________

export const removeFromPlaylist = catchAsyncError(
    async (req, res, next) => {

        const user = await User.findById(req.user._id)
        const course = await Course.findById(req.query.id)
        if (!course) {
            return next(new ErrorHandler("Course Not Found with this id", 404))
        }

        const newPlaylist = user.playlist.filter((item) => {
            if (item.course.toString() !== course._id.toString())
                return item
        })

        user.playlist = newPlaylist
        await user.save()

        res.status(200)
            .json({
                success: true,
                message: 'Course Removed from Playlist Successfully'
            })
    }
)


//^ ____________________________________________________

export const getAllUsers = catchAsyncError(
    async (req, res, next) => {

        const allUsers = await User.find({})

        res.status(200)
            .json({
                success: true,
                message: 'All users',
                allUsers
            })
    }
)

//^ ____________________________________________________

export const updateUserRole = catchAsyncError(
    async (req, res, next) => {

        const user = await User.findById(req.params.id)

        if (!user)
            return next(new ErrorHandler("User Not Found", 404))

        if (user.role === "user")
            user.role = 'admin'
        else
            user.role = 'user'

        await user.save()

        res.status(200)
            .json({
                success: true,
                message: 'User Role Updated Successfully'
            })
    }
)

//^ ____________________________________________________

export const deleteUser = catchAsyncError(
    async (req, res, next) => {

        const { id } = req.params
        const user = await User.findById(id)
        if (!user)
            return next(new ErrorHandler("User Not Found", 404))

        await cloudinary.v2.uploader.destroy(user.avatar.public_id)

        //TODO : ______  Cancel Subscription if subscribed  _______

        await User.findByIdAndDelete(id)

        res.status(200)
            .json({
                success: true,
                message: 'User Deleted Successfully'
            })
    }
)

//^ ____________________________________________________

export const deleteMyProfile = catchAsyncError(
    async (req, res, next) => {

        const user = await User.findById(req.user._id)

        await cloudinary.v2.uploader.destroy(user.avatar.public_id)

        //TODO : ______  Cancel Subscription if subscribed  _______

        await User.findByIdAndDelete(req.user._id)

        res.status(200)
            .cookie('token', null, {
                expires: new Date(Date.now()),
                httpOnly: true,
                // secure: true,
                // sameSite: 'none',
            })
            .json({
                success: true,
                message: 'My Profile Deleted Successfully'
            })
    }
)


User.watch().on('change', async () => {

    const stats = await Stats.find({})
        .sort({ createdAt: 'desc' })
        .limit(1)

    console.log(stats)

    const subscriptions = await User.find({ 'subscription.status': 'active' })

    stats[0].users = await User.countDocuments()
    stats[0].subscriptions = subscriptions.length

    stats[0].createdAt = new Date(Date.now())

    await stats[0].save()
})
