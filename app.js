import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import cors from 'cors'


import course from './routes/CourseRoutes.js'
import user from './routes/UserRoutes.js'
import payment from './routes/paymentRoutes.js'
import other from './routes/otherRoutes.js'


import ErrorMiddleware from './middlewares/Error.js'

const app = express()

dotenv.config({
    path: './config/config.env'
})

//?   CORS option

const corsOptions = {
    // origin: process.env.FRONTEND_URL,
    origin: 'https://e-learning-front-end-iota.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE'],
    optionSuccessStatus: 200
}
app.use(cors(corsOptions))


//? Using Middleware for body parsing (FORM Data)
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(cookieParser())


//? Importing and Using Routes
app.use(course)
app.use(user)
app.use(payment)
app.use(other)

export default app

app.use(ErrorMiddleware)
