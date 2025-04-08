import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Email gönderici oluştur
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export async function POST(request: Request) {
  try {
    const { to, subject, text } = await request.json()

    // Email gönderme işlemi
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    })

    console.log('Email gönderildi:', info.messageId)
    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('Email gönderme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Email gönderilemedi' },
      { status: 500 }
    )
  }
}

// Test fonksiyonu
export async function GET() {
  try {
    const testEmail = {
      to: process.env.EMAIL_USER, // Kendinize test emaili gönderin
      subject: 'Test Email - CoupleFin',
      text: 'Bu bir test emailidir. Eğer bu emaili alıyorsanız, email gönderme sistemi çalışıyor demektir.',
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      ...testEmail,
    })

    console.log('Test emaili gönderildi:', info.messageId)
    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('Test emaili gönderme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Test emaili gönderilemedi' },
      { status: 500 }
    )
  }
} 