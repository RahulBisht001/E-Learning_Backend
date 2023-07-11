//? This is a custom Error handler. Learn more about it from chatGPT
//^ Express will directly call a default Error handler as all the middlewares
//^ called from a route But we can make our own Error Handler as well


const ErrorMiddleware = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500
    err.message = err.message || "Internal Server Error Custom Error 😂"

    // console.log(err)
    res.status(err.statusCode)
        .json({
            success: false,
            message: err.message
        })
}

export default ErrorMiddleware