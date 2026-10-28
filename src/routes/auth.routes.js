import {Router} from 'express'
import * as userController from '../controller/user.controller.js'
const authRouter=Router()
authRouter.post('/register',userController.registerUser)
authRouter.post('/login',userController.loginUser)
authRouter.get('/get-me',userController.getMe)
authRouter.get('/refresh-token',userController.refreshToken)
authRouter.get('/logout',userController.logout)
authRouter.post('/logout-all',userController.logoutAll)
authRouter.get('/verify-email',userController.verifyEmail)

export default authRouter