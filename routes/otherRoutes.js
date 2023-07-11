import express from 'express'
import { authorizeAdmin, isAuthenticated } from '../middlewares/auth.js'
import {
    contact, courseRequest,
    getDashboardStats
} from '../controllers/OtherController.js'

const router = express.Router()

//* These are some other routes like
//* help, join-us ,contact etc


//! ___ Contact Form

router.route('/contact')
    .post(contact)

//! ___ Course Request Form 

router.route('/course-request')
    .post(courseRequest)


//? ____ The Most important Route : Admin Dashboard and Stats

router.route('/admin/stats')
    .get(isAuthenticated, authorizeAdmin, getDashboardStats)

export default router
