import cloudinary from 'cloudinary'

import { catchAsyncError } from '../middlewares/catchAsyncError.js'

import { Course } from '../models/Course.js'
import { Stats } from '../models/Stats.js'

import getDataURI from '../utils/dataURI.js'
import ErrorHandler from '../utils/errorHandler.js'


export const getAllCourses = catchAsyncError(async (req, res, next) => {

    let keyword = req.query.keyword || "";
    let category = req.query.category || "";

    // //^ It will return all the course as array of object from the backend
    const query = {};

    if (category !== "") {
        query.category = { $regex: category, $options: "i" };
    }

    if (keyword !== "") {
        query.$or = [
            { title: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } }
        ];
    }

    const courses = await Course
        .find(query)
        .select("-lectures");

    console.log('_---------------------')
    console.log(courses)

    res.status(200).json({
        success: true,
        courses,
        message: 'All Courses'
    })
})

export const createCourse = catchAsyncError(async (req, res, next) => {

    const { title, description, category, createdBy } = req.body
    const file = req.file

    const fileUri = await getDataURI(file)

    //^ Uploading the file to the cloudinary 
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content)

    console.log(title)
    console.log(description)
    console.log(category)
    console.log(createdBy)


    if (!title || !description || !category || !createdBy) {
        console.log("Course creation Function Error")
        return next(new ErrorHandler("Please Add all Fields", 400))
    }

    const newCourse = await Course.create({
        title,
        description,
        category,
        createdBy,
        poster: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    })

    await newCourse.save()

    res.status(201)
        .json({
            success: true,
            message: 'Course Created Successfully! You can add Lectures Now'
        })

})


export const getCourseLectures = catchAsyncError(async (req, res, next) => {

    const course = await Course.findById(req.params.id)

    if (!course) {
        return next(new ErrorHandler('Course Not Found'), 404)
    }

    course.views += 1
    await course.save()

    res.status(200).json({
        success: true,
        lectures: course.lectures
    })
})


//* Max video size is 100mb as we are using a free service of cloudinary

export const addLectures = catchAsyncError(async (req, res, next) => {

    const { id } = req.params   //? this the id of the course in which we will add lectures
    const { title, description } = req.body

    const course = await Course.findById(id)

    if (!course) {
        return next(new ErrorHandler('Course Not Found'), 404)
    }

    //? video File
    const file = req.file
    const fileUri = await getDataURI(file)

    //^ Uploading the file to the cloudinary 
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
        resource_type: 'video'
    })

    course.lectures.push({
        title,
        description,
        video: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    })

    course.numOfVideos = course.lectures.length

    await course.save()

    res.status(200).json({
        success: true,
        message: "Lecture added in the Course Successfully"
    })
})


export const deleteCourse = catchAsyncError(
    async (req, res, next) => {

        const { id } = req.params
        const course = await Course.findById(id)

        if (!course) {
            return next(new ErrorHandler('Course Not Found'), 404)
        }

        //* Before deleting the course we need to destroy all the posters
        //* and videos from cloudinary because now they don't mean anything

        // console.log(course.poster)
        await cloudinary.v2.uploader.destroy(course.poster.public_id)

        for (let i = 0; i < course.lectures.length; ++i) {
            const singleLecture = course.lectures[i]
            // console.log(singleLecture)
            await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
                resource_type: 'video'
            })
        }

        // await course.remove()
        await Course.findByIdAndDelete(course._id)

        res.status(200).json({
            success: true,
            message: 'Course Deleted Successfully'
        })
    }
)

export const deleteLecture = catchAsyncError(
    async (req, res, next) => {

        const { courseId, lectureId } = req.query

        const course = await Course.findById(courseId)

        if (!course) {
            return next(new ErrorHandler('Course Not Found'), 404)
        }

        const lecture = course.lectures.find((item) => {
            if (item._id.toString() === lectureId.toString())
                return item
        })

        await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
            resource_type: 'video'
        })

        course.lectures = course.lectures.filter((item) => {
            if (item._id.toString() !== lectureId.toString())
                return item
        })

        course.numOfVideos = course.lectures.length
        await course.save()

        res.status(200).json({
            success: true,
            message: 'Lecture Deleted Successfully'
        })
    }
)


Course.watch().on('change', async () => {

    const stats = await Stats.find({})
        .sort({ createdAt: 'desc' })
        .limit(1)

    console.log(stats)

    const courses = await Course.find({})
    let totalViews = 0

    for (let i = 0; i < courses.length; i++) {
        const element = courses[i]
        totalViews += courses[i].views
    }
    stats[0].views = totalViews
    stats[0].createdAt = new Date(Date.now())
    await stats[0].save()

})