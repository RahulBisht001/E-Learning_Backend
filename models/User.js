import mongoose from 'mongoose'
import validator from 'validator'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'


const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please Enter Your Name"]
    },
    email: {
        type: String,
        required: [true, 'Please Enter Your Email'],
        unique: true,
        validator: validator.isEmail
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        unique: true,
        minLength: [6, 'password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    subscription: {
        id: String,
        status: String
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    playlist: [
        {
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            },
            poster: String,
            title:String,
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now()
    },

    resetPasswordToken: String,
    resetPasswordExpires: String,
})

UserSchema.pre('save', async function (next) {

    if (this.isModified("password")) {
        const hashedPassword = await bcrypt.hash(this.password, 10)
        this.password = hashedPassword
    }
    next()
})

UserSchema.methods.getJWTToken = function () {

    const token = jwt.sign({ _id: this._id },
        process.env.JWT_SECRET, {
        expiresIn: '15d'
    })
    return token
}

UserSchema.methods.comparePassword = async function (password) {
    // console.log(this.password)
    return await bcrypt
        .compare(password, this.password)
}

UserSchema.methods.getResetToken = async function (email) {

    const resetToken = crypto.randomBytes(20).toString('hex')

    this.resetPasswordToken = crypto.createHash('sha256')
        .update(resetToken)
        .digest('hex')

    this.resetPasswordExpires = Date.now() + (15 * 60 * 1000)

    return resetToken
}

export const User = mongoose.model('User', UserSchema)
