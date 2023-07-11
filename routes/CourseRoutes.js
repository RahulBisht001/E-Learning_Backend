import express from 'express'
import {
    addLectures, createCourse, deleteCourse,
    deleteLecture,
    getAllCourses, getCourseLectures
} from '../controllers/CourseController.js'
import singleUpload from '../middlewares/multer.js'
import { authorizeAdmin, authorizeSubscribers, isAuthenticated } from '../middlewares/auth.js'


const router = express.Router()

//?  It is a new method of setting routes


//! get all courses without lectures
router.route('/courses')
    .get(getAllCourses)

//! Create a New Course - only authorize admin

router.route('/create-course')
    .post(isAuthenticated, authorizeAdmin, singleUpload, createCourse)

//! Add Lecture ,delete Course and  get Course Details
router.route('/course/:id')
    .get(isAuthenticated, authorizeSubscribers, getCourseLectures)
    .post(isAuthenticated, authorizeAdmin, singleUpload, addLectures)
    .delete(isAuthenticated, authorizeAdmin, deleteCourse)

//! Delete a Lecture from the course
router.route('/lecture')
    .delete(isAuthenticated, authorizeAdmin, deleteLecture)


export default router