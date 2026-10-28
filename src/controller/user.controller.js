import userModel from '../models/user.model.js'
import crypto from 'crypto'
import JWT from 'jsonwebtoken'
import sessionModel from '../models/session.model.js'
import {sendEmail} from '../services/email.service.js'
import {generateOTP,getOtpHtml} from '../utils/utils.js'
import otpModel from '../models/otp.model.js'

import config from '../config/config.js'



export async function registerUser(req,res){

    const {username,email,password}=req.body

    const isalreadyExist=await userModel.findOne({
           $or: [
            {username},
            {email}
        ]
    })
    if(isalreadyExist){
        return res.status(409).json({
            success:false,
            message:'username or email already exist'
        })
    }
    const hashedPassword=crypto.createHash('sha256').update(password).digest('hex')

    const user=await userModel.create({
        username,
        email,
        password:hashedPassword
    })

     const otp=generateOTP()
    const html=getOtpHtml(otp)

    const otpHash=crypto.createHash('sha256').update(otp).digest('hex')
    await otpModel.create({
        email,
        otpHash,
        user:user._id
    })


    await sendEmail(email,"OTP Verification",html)


    return res.status(201).json({
     message:'user registered successfully',
     user:{
        username:user.username,
        email:user.email,
        token:accessToken
     }
    })


}
export async function loginUser(req,res){
const {email,password}=req.body
if(!email || !password){
    return res.status(400).json({
        success:false,
        message:'email and password are required'
    })
}
const user=await userModel.findOne({email})
if(!user){
    return res.status(404).json({
        success:false,
        message:'user not found'
    })
}
if(!user.Verified){
    return res.status(401).json({
        success:false,
        message:'user is not verified'
    })
}
const hashedPassword=crypto.createHash('sha256').update(password
).digest('hex')
if(user.password!==hashedPassword){
    return res.status(401).json({
        success:false,
        message:'invalid credentials'
    })
}
    const refreshToken=JWT.sign({
    id:user._id
},config.JWT_SECRET,{
    expiresIn:'7d'
})
const refreshTokenHash=crypto.createHash('sha256').update(refreshToken).digest('hex')

    const session=await sessionModel.create({
        user:user._id,
        refreshTokenHash,
        ip:req.ip,
        userAgent:req.get('User-Agent')
    })
const accessToken=JWT.sign({
    id:user._id,
    sessionId:session._id
},config.JWT_SECRET,{
    expiresIn:'15m'
})


res.cookie('refreshToken',refreshToken,{
    httpOnly:true,
    secure:true,
    SameSite:'strict',
    maxAge:7*24*60*60*1000
})
   

    return res.status(200).json({
        success:true,
        message:'user logged in successfully',
        user:{
            username:user.username,
            email:user.email,
            token:accessToken
        }
    })



}
export async function getMe(req,res){
    const token=req.headers.authorization?.split(' ')[1]
    if(!token){
        return res.status(401).json({
            success:false,
            message:'unauthorized'
        })
    }
    const decoded=JWT.verify(token,config.JWT_SECRET)

    const user=await userModel.findById(decoded.id).select('-password')
    if(!user){
        return res.status(404).json({
            success:false,
            message:'user not found'
        })
    }
    return res.status(200).json({
        success:true,
        user
    })
}
export async function refreshToken(req,res){
const refreshToken=req.cookies.refreshToken
if(!refreshToken){
    return res.status(401).json({
        success:false,
        message:'unauthorized'
    })
}
const decoded=JWT.verify(refreshToken,config.JWT_SECRET)

const refreshTokenHash=crypto.createHash('sha256').update(refreshToken).digest('hex')

const session=await sessionModel.findOne({
    refreshTokenHash,
    revoked:false
})
if(!session){
    return res.status(401).json({
        success:false,
        message:'unauthorized'
    })
}

const accessToken=JWT.sign({
    id:decoded.id
},config.JWT_SECRET,{
    expiresIn:'15m'
})
const newRefreshToken=JWT.sign({
    id:decoded.id
},config.JWT_SECRET,{
    expiresIn:'7d'
})

const newRefreshTokenHash=crypto.createHash('sha256').update(newRefreshToken).digest('hex')
session.refreshTokenHash=newRefreshTokenHash
await session.save()



res.cookie('refreshToken',newRefreshToken,{
    httpOnly:true,
    secure:true,
    SameSite:'strict',
    maxAge:7*24*60*60*1000
})
return res.status(200).json({
    success:true,
    accessToken
})


}
export async function logout(req,res){

const refreshToken=req.cookies.refreshToken

if(!refreshToken){
    return res.status(401).json({
        success:false,
        message:'unauthorized'
    })
}
const refreshTokenHash=crypto.createHash('sha256').update(refreshToken).digest('hex')

const session=await sessionModel.findOne({
    refreshTokenHash,
    revoked:false
})
if(!session){
    return res.status(401).json({
        success:false,
        message:'unauthorized'
    })
}
session.revoked=true
await session.save()
res.clearCookie('refreshToken')
return res.status(200).json({
    success:true,
    message:'logged out successfully'
})
    
}
export async function logoutAll(req,res){

const refreshToken=req.cookies.refreshToken

if(!refreshToken){
    return res.status(401).json({
        success:false,
        message:'unauthorized'
    })
}
const decoded=JWT.verify(refreshToken,config.JWT_SECRET)

await sessionModel.updateMany({
    user:decoded.id,
    revoked:false
},{
    revoked:true
})
res.clearCookie('refreshToken')

return res.status(200).json({
    success:true,
    message:'logged out from all devices successfully'
})

}
export async function verifyEmail(req,res){
    const {email,otp}=req.query
  
    const otpDoc=await otpModel.findOne({
        email,
        otp
    })
    if(!otpDoc){
        return res.status(400).json({
            success:false,
            message:'invalid otp'
        })
    }
    const user=await userModel.findByIdAndUpdate(otpDoc.user,{
        Verified:true
    })
    await otpDoc.deleteMany({
        user:otpDoc.user
    })

    return res.status(200).json({
        success:true,
        message:'email verified successfully'
    })
}