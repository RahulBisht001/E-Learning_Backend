import mongoose from "mongoose"

const courseSchema = new mongoose.Schema({

    title: {
        type: String,
        required: [true, 'Course Title required'],
        minLength: [4, 'Title must be at least 4 characters'],
        maxLength: [25, "Title can't exceed 25 characters"]
    },
    description: {
        type: String,
        required: [true, 'Course Description required'],
        minLength: [25, 'Description must be at least 25 characters'],
    },
    lectures: [
        {
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            video: {
                public_id: {
                    type: String,
                    required: true
                },
                url: {
                    type: String,
                    required: true
                }
            },
        }
    ],
    poster: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },

    views: {
        type: Number,
        default: 0
    },
    numOfVideos: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: [true, 'Course Creator Name is required']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }


})

export const Course = mongoose.model('Course', courseSchema)
