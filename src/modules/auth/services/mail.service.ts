import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired } from '@sendgrid/mail';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {
    const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey);
    }
  }

  async sendResetPasswordEmail(to: string, resetToken: string): Promise<void> {
    const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    
    // If no API key is configured, just log the email
    if (!sendGridApiKey) {
      console.log(`EMAIL NOT SENT - SendGrid API key not configured. Reset token for ${to}: ${resetToken}`);
      console.log(`To test this feature, add SENDGRID_API_KEY to your environment variables.`);
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const msg: MailDataRequired = {
      to,
      from: this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@yourapp.com'),
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
      await sgMail.send(msg);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new InternalServerErrorException('Failed to send reset password email');
    }
  }
}