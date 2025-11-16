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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://tutorscene.com');
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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://tutorscene.com');
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

  async sendBookingCancellationToStudent(
    to: string,
    studentName: string,
    tutorName: string,
    classStartTime: Date,
  ): Promise<void> {
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
      subject: 'Booking Cancellation Notice - Tutor Scene',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Tutor Scene</h1>
          </div>
          
          <h2 style="color: #333;">Hi ${studentName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            We regret to inform you that your tutoring session has been cancelled by your tutor.
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">Cancelled Session Details</h3>
            <p style="margin: 10px 0;"><strong>Tutor:</strong> ${tutorName}</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
          </div>
          
          <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #155724;">Refund Information</h3>
            <p style="margin: 10px 0; color: #155724;">
              Your payment has been fully refunded. The refund will appear in your account within 5-10 business days, 
              depending on your bank or card issuer.
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            We apologize for any inconvenience this may have caused. Please feel free to book another session 
            with a different tutor or reschedule with the same tutor at a later time.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            If you have any questions or concerns, please don't hesitate to contact our support team.
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
      console.log(`Booking cancellation email sent to student: ${to}`);
    } catch (error) {
      console.error('Error sending cancellation email to student:', error);
      throw new InternalServerErrorException('Failed to send cancellation email');
    }
  }

  async sendBookingCancellationToTutor(
    to: string,
    tutorName: string,
    studentName: string,
    classStartTime: Date,
  ): Promise<void> {
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
      subject: 'Student Cancelled Booking - Tutor Scene',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Tutor Scene</h1>
          </div>
          
          <h2 style="color: #333;">Hi ${tutorName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            We wanted to inform you that a student has cancelled their booking with you.
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">Cancelled Session Details</h3>
            <p style="margin: 10px 0;"><strong>Student:</strong> ${studentName}</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
          </div>
          
          <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0c5460;">Refund Information</h3>
            <p style="margin: 10px 0; color: #0c5460;">
              The student's payment has been fully refunded as per our cancellation policy.
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            This time slot is now available for other bookings. You can view your updated schedule 
            in your dashboard.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            If you have any questions, please contact our support team.
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
      console.log(`Booking cancellation email sent to tutor: ${to}`);
    } catch (error) {
      console.error('Error sending cancellation email to tutor:', error);
      throw new InternalServerErrorException('Failed to send cancellation email');
    }
  }

  async sendInterviewScheduledEmail(
    to: string,
    tutorName: string,
    interviewDateTime: Date,
    participantJoinUrl: string,
  ): Promise<void> {
    const formattedDate = interviewDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = interviewDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const mailOptions = {
      from: `"${this.configService.get<string>('SMTP_FROM_NAME', 'Tutor Scene')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
      to,
      subject: 'Your Interview Has Been Scheduled - Tutor Scene',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Tutor Scene</h1>
          </div>
          
          <h2 style="color: #333;">Hi ${tutorName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Great news! Your interview with Tutor Scene has been scheduled.
          </p>
          
          <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #155724;">Interview Details</h3>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 10px 0;"><strong>Duration:</strong> 60 minutes</p>
            <p style="margin: 10px 0;"><strong>Platform:</strong> Zoom Video Conference</p>
          </div>
          
          <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0c5460;">What to Expect</h3>
            <ul style="color: #0c5460; line-height: 1.8;">
              <li>The interview will be conducted via Zoom video call</li>
              <li>Please ensure you have a stable internet connection</li>
              <li>Have your teaching materials or portfolio ready to share</li>
              <li>Be prepared to discuss your teaching experience and methodology</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            We look forward to meeting you! If you need to reschedule or have any questions, 
            please contact us as soon as possible.
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
      console.log(`Interview scheduled email sent to: ${to}`);
    } catch (error) {
      console.error('Error sending interview scheduled email:', error);
      throw new InternalServerErrorException('Failed to send interview scheduled email');
    }
  }

  async sendUserStatusChangeEmail(
    to: string,
    userName: string,
    oldStatus: string,
    newStatus: string,
    suspensionReason?: string,
  ): Promise<void> {
    let subject = '';
    let statusMessage = '';
    let statusColor = '';
    let additionalInfo = '';

    // Customize email based on new status
    switch (newStatus) {
      case 'active':
        subject = 'Your Account Has Been Activated - Tutor Scene';
        statusMessage = 'Your account has been activated and you now have full access to Tutor Scene.';
        statusColor = '#28a745';
        additionalInfo = `
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            You can now access all features and services. Welcome back!
          </p>
        `;
        break;
      
      case 'suspended':
        subject = 'Important: Your Account Has Been Suspended - Tutor Scene';
        statusMessage = 'Your account has been suspended.';
        statusColor = '#dc3545';
        additionalInfo = `
          <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #721c24;">Suspension Reason</h3>
            <p style="margin: 10px 0; color: #721c24;">
              ${suspensionReason || 'No specific reason provided.'}
            </p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            During this suspension period, you will not be able to access your account or use our services.
            If you believe this is a mistake or would like to appeal this decision, please contact our support team.
          </p>
        `;
        break;
      
      case 'inactive':
        subject = 'Your Account Status Has Changed - Tutor Scene';
        statusMessage = 'Your account has been set to inactive.';
        statusColor = '#6c757d';
        additionalInfo = `
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Your account is currently inactive. If you wish to reactivate your account, please contact our support team.
          </p>
        `;
        break;
      
      case 'pending':
        subject = 'Your Account Status Update - Tutor Scene';
        statusMessage = 'Your account status has been changed to pending.';
        statusColor = '#ffc107';
        additionalInfo = `
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Your account is currently under review. We will notify you once the review is complete.
          </p>
        `;
        break;
      
      default:
        subject = 'Your Account Status Has Been Updated - Tutor Scene';
        statusMessage = `Your account status has been changed from ${oldStatus} to ${newStatus}.`;
        statusColor = '#17a2b8';
    }

    const mailOptions = {
      from: `"${this.configService.get<string>('SMTP_FROM_NAME', 'Tutor Scene')}" <${this.configService.get<string>('SMTP_FROM_EMAIL')}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Tutor Scene</h1>
          </div>
          
          <h2 style="color: #333;">Hi ${userName},</h2>
          
          <div style="background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: ${statusColor};">Account Status Update</h3>
            <p style="margin: 10px 0; font-size: 16px; color: #333;">
              ${statusMessage}
            </p>
          </div>
          
          ${additionalInfo}
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            If you have any questions or concerns about this status change, please don't hesitate to contact our support team.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #666;">
              Need help? Contact us at support@tutorscene.com
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message from Tutor Scene. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`User status change email sent to: ${to}`);
    } catch (error) {
      console.error('Error sending user status change email:', error);
      throw new InternalServerErrorException('Failed to send status change email');
    }
  }
}
