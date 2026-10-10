import { UserModel } from '@modules/auth/user.model'
import { hashPassword, comparePassword } from '@shared/utils/hash.util'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@shared/utils/jwt.util'
import { RegisterInput, LoginInput, VerifyEmailInput } from '@modules/auth/auth.schema'
import { sendVerificationEmail } from '@shared/services/email.service'
import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
)

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

export const registerUser = async (input: RegisterInput) => {
  const existing = await UserModel.findOne({ email: input.email })
  if (existing) throw new Error('Email already registered')

  const otp = generateOTP()
  const hashedOtp = await hashPassword(otp)
  const hashed = await hashPassword(input.password)

  const user = await UserModel.create({
    email: input.email,
    password: hashed,
    fullName: input.fullName,
    isEmailVerified: false,
    verificationToken: hashedOtp,
    verificationTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
  })

  await sendVerificationEmail(user.email, otp)

  return { id: user._id, email: user.email, fullName: user.fullName }
}

export const loginUser = async (input: LoginInput) => {
  const user = await UserModel.findOne({ email: input.email })
  if (!user) throw new Error('Invalid credentials')

  const isMatch = await comparePassword(input.password, user.password)
  if (!isMatch) throw new Error('Invalid credentials')

  if (!user.isEmailVerified) {
    throw new Error('Please verify your email first')
  }

  const accessToken = signAccessToken(user._id.toString())
  const refreshToken = signRefreshToken(user._id.toString())

  await UserModel.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: { $each: [refreshToken], $slice: -10 } },
  })

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, fullName: user.fullName, avatar: user.avatar },
  }
}

export const refreshUserToken = async (oldRefreshToken: string) => {
  const decoded = verifyRefreshToken(oldRefreshToken)
  const user = await UserModel.findById(decoded.userId)

  if (!user || !user.refreshTokens.includes(oldRefreshToken)) {
    throw new Error('Invalid refresh token')
  }

  const newAccessToken = signAccessToken(user._id.toString())
  const newRefreshToken = signRefreshToken(user._id.toString())

  await UserModel.findByIdAndUpdate(user._id, {
    $pull: { refreshTokens: oldRefreshToken },
  })
  await UserModel.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: { $each: [newRefreshToken], $slice: -10 } },
  })

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export const logoutUser = async (userId: string, refreshToken: string) => {
  await UserModel.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: refreshToken },
  })
}

export const logoutAllDevices = async (userId: string) => {
  await UserModel.findByIdAndUpdate(userId, { refreshTokens: [] })
}

export const getMe = async (userId: string) => {
  const user = await UserModel.findById(userId).select('-password -refreshTokens -verificationToken')
  if (!user) throw new Error('User not found')
  return user
}

export const verifyEmail = async (input: VerifyEmailInput) => {
  const user = await UserModel.findOne({ email: input.email })
  if (!user) throw new Error('User not found')
  if (user.isEmailVerified) throw new Error('Email is already verified')
  if (!user.verificationToken || !user.verificationTokenExpiresAt) throw new Error('No OTP found')
  if (user.verificationTokenExpiresAt < new Date()) throw new Error('OTP has expired')

  const isValid = await comparePassword(input.otp, user.verificationToken)
  if (!isValid) throw new Error('Invalid OTP')

  user.isEmailVerified = true
  user.verificationToken = undefined
  user.verificationTokenExpiresAt = undefined
  await user.save()

  // Auto login after verification
  const accessToken = signAccessToken(user._id.toString())
  const refreshToken = signRefreshToken(user._id.toString())

  await UserModel.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: { $each: [refreshToken], $slice: -10 } },
  })

  return { accessToken, refreshToken, user: { id: user._id, email: user.email, fullName: user.fullName, avatar: user.avatar } }
}

export const resendOtp = async (email: string) => {
  const user = await UserModel.findOne({ email })
  if (!user) throw new Error('User not found')
  if (user.isEmailVerified) throw new Error('Email is already verified')

  const otp = generateOTP()
  user.verificationToken = await hashPassword(otp)
  user.verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
  await user.save()

  await sendVerificationEmail(user.email, otp)
}

export const googleLogin = async (code: string) => {
  const { tokens } = await googleClient.getToken(code)
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload || !payload.email) throw new Error('Invalid Google token')

  let user = await UserModel.findOne({ email: payload.email })

  if (!user) {
    // Generate random password for google users (they login via SSO)
    const randomPassword = await hashPassword(Math.random().toString(36).slice(-10) + 'A1')
    user = await UserModel.create({
      email: payload.email,
      fullName: payload.name || payload.email.split('@')[0],
      avatar: payload.picture,
      password: randomPassword,
      isEmailVerified: payload.email_verified || true,
    })
  } else if (!user.isEmailVerified) {
    user.isEmailVerified = true
    await user.save()
  }

  const accessToken = signAccessToken(user._id.toString())
  const refreshToken = signRefreshToken(user._id.toString())

  await UserModel.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: { $each: [refreshToken], $slice: -10 } },
  })

  return { accessToken, refreshToken, user: { id: user._id, email: user.email, fullName: user.fullName, avatar: user.avatar } }
}
