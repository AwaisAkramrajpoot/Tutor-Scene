import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/database/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { JwtPayload } from '../strategies/jwt.strategy';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists by email
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create new user
    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phoneNumber: registerDto.phone,
      role: registerDto.role as any || 'student',
    });

    await this.userRepository.save(user);

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'status', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive()) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateAuthResponse(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  // Forgot password implementation
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    
    // Check if user exists by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // We don't want to reveal if the email exists or not for security reasons
      // So we return the same message whether the user exists or not
      return { message: 'If your email is registered, you will receive a password reset link shortly.' };
    }

    try {
      // Generate reset token
      const resetToken = this.jwtService.sign(
        { sub: user.id, email: user.email, type: 'reset' },
        { 
          expiresIn: '1h',
          secret: this.configService.get<string>('JWT_SECRET')
        }
      );

      // Send reset password email
      await this.mailService.sendResetPasswordEmail(user.email, resetToken);

      return { message: 'If your email is registered, you will receive a password reset link shortly.' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to process forgot password request');
    }
  }

  // Reset password implementation
  async resetPassword(resetPasswordDto: ResetPasswordDto, token: string): Promise<{ message: string }> {
    const { newPassword, confirmPassword } = resetPasswordDto;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    try {
      // Verify the token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      });

      // Check if it's a reset token
      if (payload.type !== 'reset') {
        throw new BadRequestException('Invalid token type');
      }

      // Find user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, email: payload.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update user password
      await this.userRepository.update(user.id, {
        passwordHash: hashedPassword,
      });

      return { message: 'Password successfully reset' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid token');
      }
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  private async generateAuthResponse(user: User): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };

    const refreshPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(refreshPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}