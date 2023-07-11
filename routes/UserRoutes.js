import express from 'express'
import {
    addToPlaylist, changePassword, forgotPassword,
    getMyProfile, login, logout, register, resetPassword,
    updateProfile, updateProfilePicture, removeFromPlaylist,
    getAllUsers, updateUserRole, deleteUser, deleteMyProfile
} from '../controllers/UserController.js'
import { authorizeAdmin, isAuthenticated } from '../middlewares/auth.js'
import singleUpload from '../middlewares/multer.js'

const router = express.Router()


//?  It is a new method of setting routes

//^ Auth End Points
router.route('/register').post(singleUpload, register)
router.route('/login').post(login)
router.route('/logout').get(logout)

//^ User Routes 
router.route('/me')
    .get(isAuthenticated, getMyProfile)
    .delete(isAuthenticated, deleteMyProfile)
router.route('/change-password').put(isAuthenticated, changePassword)
router.route('/update-profile').patch(isAuthenticated, updateProfile)
router.route('/update-profile-picture').put(isAuthenticated, singleUpload, updateProfilePicture)

router.route('/forgot-password').post(forgotPassword)
router.route('/reset-password/:token').put(resetPassword)

router.route('/add-to-playlist').post(isAuthenticated, addToPlaylist)
router.route('/remove-from-playlist').delete(isAuthenticated, removeFromPlaylist)

//^  ________Admin Routes

router.route('/admin/users')
    .get(isAuthenticated, authorizeAdmin, getAllUsers)

router.route('/admin/user/:id')
    .put(isAuthenticated, authorizeAdmin, updateUserRole)
    .delete(isAuthenticated, authorizeAdmin, deleteUser)



export default router