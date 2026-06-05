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
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/database/entities/user.entity';
import { Prospect } from '@/database/entities/prospect.entity';
import { StudentReferral } from '@/database/entities/student-referral.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { JwtPayload } from '../strategies/jwt.strategy';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { MailService } from './mail.service';
import { UserStatus, UserRole, ProspectStatus } from '@/database/entities/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    @InjectRepository(StudentReferral)
    private readonly referralRepository: Repository<StudentReferral>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = registerDto.email.toLowerCase();

    // Check if user already exists by email
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create new user
    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phoneNumber: registerDto.phone,
      status: UserStatus.ACTIVE,
      role: registerDto.role as any || 'student',
      gender: registerDto.gender,
      emailVerified: false,
      emailVerifiedAt: null,
    });

    await this.userRepository.save(user);

    if (registerDto.referralCode?.trim() && user.role === UserRole.STUDENT) {
      const normalized = registerDto.referralCode.trim().toUpperCase();
      const referrer = await this.userRepository.findOne({
        where: { referralCode: normalized },
      });
      if (referrer && referrer.id !== user.id) {
        user.referredByUserId = referrer.id;
        await this.userRepository.save(user);
        await this.referralRepository.save(
          this.referralRepository.create({
            referrerUserId: referrer.id,
            referredUserId: user.id,
            referredEmail: user.email,
            status: 'in_progress',
          }),
        );
      }
    }

    const verificationToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'verify' },
      {
        expiresIn: '24h',
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );
    await this.userRepository.update(user.id, {
      emailVerificationToken: verificationToken,
    });
    await this.mailService.sendEmailVerificationEmail(user.email, verificationToken);

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = loginDto.email.toLowerCase();

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      select: [
        'id',
        'email',
        'passwordHash',
        'firstName',
        'lastName',
        'status',
        'role',
        'emailVerified',
        'lastLoginAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive()) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before signing in');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hadPriorLogin = Boolean(user.lastLoginAt);
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });
    const auth = await this.generateAuthResponse(user);
    return { ...auth, additionalLoginNotice: hadPriorLogin };
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

  async verifyEmail(token: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as { sub: number; email?: string; type?: string };

      if (payload.type !== 'verify') {
        throw new BadRequestException('Invalid verification token');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub, email: payload.email },
        select: ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'status', 'role', 'emailVerified'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.userRepository.update(user.id, {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      });

      user.emailVerified = true;
      return this.generateAuthResponse(user);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Verification link has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid verification token');
      }
      throw error;
    }
  }

  // Forgot password implementation
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase();
    
    // Check if user exists by email
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
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

  // ─── NEW: Google OAuth Login ───────────────────────────────────────────────
  async googleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
    googleId: string;
    role?: string; //  add this
  }): Promise<AuthResponseDto> {
    const normalizedEmail = googleUser.email.toLowerCase();
  
    let user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
  
    if (!user) {
      const roleStr = String(googleUser.role || '').toLowerCase();
      const role = roleStr === 'tutor' ? UserRole.TUTOR : UserRole.STUDENT;
      
      user = this.userRepository.create({
        email: normalizedEmail,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        profilePhotoUrl: googleUser.profilePhotoUrl,
        googleId: googleUser.googleId,
        status: UserStatus.ACTIVE,
        role: role, //  dynamic role
        emailVerified: true,
        emailVerifiedAt: new Date(),
        passwordHash: '',
      });
      await this.userRepository.save(user);
    } else {
      if (!user.googleId) {
        await this.userRepository.update(user.id, {
          googleId: googleUser.googleId,
          emailVerified: true,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        });
        user.googleId = googleUser.googleId;
        user.emailVerified = true;
      }
    }
  
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });
    return this.generateAuthResponse(user);
  }
  // ──────────────────────────────────────────────────────────────────────────

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

    // Fetch prospect data if user is a tutor and status is active
    let paymentOnBoarded: boolean | undefined;
    let prospectId: number | undefined;
    let prospectStatus: string | undefined;
    let publishedStatus: string | undefined;
    let hasPendingProfileUpdate: boolean | undefined;

    if (user.role === UserRole.TUTOR && user.status === UserStatus.ACTIVE) {
      const published = await this.prospectRepository.findOne({
        where: { userId: user.id, parentProspectId: IsNull() },
        select: ['id', 'paymentOnBoarded', 'status'],
        order: { updatedAt: 'DESC' },
      });

      if (published) {
        paymentOnBoarded = published.paymentOnBoarded ?? false;
        prospectId = published.id;
        publishedStatus = published.status;
        prospectStatus = published.status;

        const pendingDraft = await this.prospectRepository.findOne({
          where: {
            parentProspectId: published.id,
            status: ProspectStatus.PENDING,
          },
          select: ['id'],
        });
        if (pendingDraft && published.status === ProspectStatus.ACTIVE) {
          prospectStatus = ProspectStatus.PENDING;
          hasPendingProfileUpdate = true;
        }
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        ...(paymentOnBoarded !== undefined && { paymentOnBoarded }),
        ...(prospectId !== undefined && { prospectId }),
        ...(prospectStatus !== undefined && { prospectStatus }),
        ...(publishedStatus !== undefined && { publishedStatus }),
        ...(hasPendingProfileUpdate !== undefined && { hasPendingProfileUpdate }),
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