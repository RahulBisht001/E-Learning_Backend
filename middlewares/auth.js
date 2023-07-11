import jwt from 'jsonwebtoken'
import { catchAsyncError } from './catchAsyncError.js'
import ErrorHandler from '../utils/errorHandler.js'
import { User } from '../models/User.js'


//^ ___________________________________________

export const isAuthenticated = catchAsyncError(
    async (req, res, next) => {
        if (!req.cookies)
            return next(new ErrorHandler("Please login first", 401));

        const { token } = req.cookies
        // console.log(token)
        if (!token) {
            return next(new ErrorHandler("You are Not Logged in", 401))
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = await User.findById(decoded._id)
        next()
    }
)

//^ ___________________________________________

export const authorizeSubscribers = (req, res, next) => {

    if (req.user.subscription.status !== 'active' && req.user.role !== 'admin') {
        return next(new ErrorHandler("Only Subscribers Can Access this Resource", 401))
    }
    next()

}

//^ ___________________________________________

export const authorizeAdmin = (req, res, next) => {

    if (req.user.role !== 'admin')
        return next(new ErrorHandler(`${req.user.role} is not allowed to access this resource`, 403))

    next()
}
