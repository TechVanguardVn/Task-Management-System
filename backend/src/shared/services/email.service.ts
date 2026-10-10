import { Resend } from 'resend'
import dotenv from 'dotenv'

import { env } from '../config/env.config'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export const sendVerificationEmail = async (email: string, otp: string) => {
  if (!resend) {
    console.error('RESEND_API_KEY is not configured!')
    throw new Error('Email service is not configured')
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'TechVanguard <onboarding@resend.dev>',
      to: [email],
      subject: 'Xác thực tài khoản TechVanguard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1d1d1f;">Chào mừng bạn đến với TechVanguard!</h2>
          <p>Mã xác thực (OTP) của bạn là:</p>
          <div style="background-color: #f5f5f7; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p>Mã này sẽ hết hạn trong vòng 15 phút.</p>
          <p>Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw new Error('Failed to send verification email')
    }
    return data
  } catch (error) {
    console.error('Email service error:', error)
    throw new Error('Failed to send verification email')
  }
}
