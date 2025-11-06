import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Configure SMTP transporter with Gmail-specific settings
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 10,
    });
  }

  async sendResetPasswordEmail(to: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${this.configService.get<string>('SMTP_FROM_NAME', 'Tutor Scene')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new InternalServerErrorException('Failed to send reset password email');
    }
  }

  async sendBookingPaymentEmail(
    to: string,
    studentName: string,
    bookingId: number,
    amount: number,
    classStartTime: Date,
    paymentIntentId: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const paymentUrl = `${frontendUrl}/payments?bookingId=${bookingId}&paymentIntentId=${paymentIntentId}&amount=${amount}`;

    // Format the class start time
    const formattedDate = classStartTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = classStartTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const mailOptions = {
      from: `"${this.configService.get<string>('SMTP_FROM_NAME', 'Tutor Scene')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
      to,
      subject: 'Complete Your Booking Payment - Tutor Scene',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Tutor Scene</h1>
          </div>
          
          <h2 style="color: #333;">Hi ${studentName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Thank you for booking your class! Your tutor has accepted your booking request.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Class Details</h3>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 10px 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            To confirm your booking, please complete the payment by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}" 
               style="background-color: #007bff; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;
                      font-size: 16px; font-weight: bold;">
              Pay Now
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #007bff; word-break: break-all;">
            ${paymentUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message from Tutor Scene. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Booking payment email sent to ${to}`);
    } catch (error) {
      console.error('Error sending booking payment email:', error);
      throw new InternalServerErrorException('Failed to send booking payment email');
    }
  }
}
