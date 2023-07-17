import { User } from "../models/User.js"

export const sendToken = (res, user, message, statusCode = 200) => {

    const token = user.getJWTToken()

    const options = {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    }
     res.setHeader('Access-Control-Allow-Origin', 'https://e-learning-front-end-iota.vercel.app');
    res.status(statusCode)
        .cookie("token", token, options)
        .json({
            success: true,
            message,
            user
        })
}
