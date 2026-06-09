import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { LearnerAssessmentResponse } from '../../database/entities/learner-assessment-response.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserRole, UserStatus, ProspectStatus } from '@/database/entities/enums';
import { MailService } from '../auth/services/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    @InjectRepository(LearnerAssessmentResponse)
    private readonly learnerRepository: Repository<LearnerAssessmentResponse>,
    private readonly mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async findStudentDetail(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    if (user.role !== UserRole.STUDENT) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    const rows = await this.learnerRepository
      .createQueryBuilder('l')
      .where('l.user_id = :userId', { userId: id })
      .andWhere('(l.profile_status = :profile OR l.status = :completed)', {
        profile: 'profile',
        completed: 'completed',
      })
      .orderBy('l.is_self', 'DESC')
      .addOrderBy('l.updated_at', 'DESC')
      .getMany();

    const seen = new Set<string>();
    const learners = rows
      .filter((row) => {
        if (seen.has(row.learnerLabel)) return false;
        seen.add(row.learnerLabel);
        return true;
      })
      .map((row) => ({
        id: row.id,
        learnerLabel: row.learnerLabel,
        learnerFirstName: row.learnerFirstName,
        learnerLastName: row.learnerLastName,
        gradeLevel: row.gradeLevel,
        gender: row.gender,
        relationshipToLearner: row.relationshipToLearner,
        avatarIcon: row.avatarIcon,
        isSelf: row.isSelf,
        status: row.status,
        profileStatus: row.profileStatus,
        updatedAt: row.updatedAt,
      }));

    return {
      student: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status,
        gender: user.gender,
        avatarIcon: user.avatarIcon,
        profilePhotoUrl: user.profilePhotoUrl,
        registersSelfAsLearner: user.registersSelfAsLearner,
        availableCredits: user.availableCredits,
        referralCode: user.referralCode,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        suspensionReason: user.suspensionReason,
      },
      learners,
    };
  }

  async findAllStudents(status?: string): Promise<User[]> {
    const whereCondition: any = { role: UserRole.STUDENT };
    
    // If status is 'all', don't filter by status
    if (status && status.toLowerCase() !== 'all') {
      whereCondition.status = status as UserStatus;
    }

    return this.userRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }

  async updateUserStatus(id: number, updateUserStatusDto: UpdateUserStatusDto): Promise<User> {
    const user = await this.findOne(id);

    // Validate suspension reason is provided when suspending
    if (updateUserStatusDto.status === UserStatus.SUSPENDED && !updateUserStatusDto.suspensionReason) {
      throw new BadRequestException('Suspension reason is required when suspending a user');
    }

    const oldStatus = user.status;
    user.status = updateUserStatusDto.status;
    
    // Update suspension reason if provided
    if (updateUserStatusDto.suspensionReason) {
      user.suspensionReason = updateUserStatusDto.suspensionReason;
    } else if (updateUserStatusDto.status !== UserStatus.SUSPENDED) {
      // Clear suspension reason if status is not suspended
      user.suspensionReason = null;
    }

    const updatedUser = await this.userRepository.save(user);

    // If user is being suspended, also suspend their prospect record if it exists
    if (updateUserStatusDto.status === UserStatus.SUSPENDED) {
      const prospect = await this.prospectRepository.findOne({
        where: { userId: user.id },
      });

      if (prospect) {
        prospect.status = ProspectStatus.SUSPENDED;
        await this.prospectRepository.save(prospect);
      }
    }

    // If user is being reactivated, also reactivate their prospect record if it exists
    if (updateUserStatusDto.status === UserStatus.ACTIVE && oldStatus === UserStatus.SUSPENDED) {
      const prospect = await this.prospectRepository.findOne({
        where: { userId: user.id },
      });

      if (prospect && prospect.status === ProspectStatus.SUSPENDED) {
        prospect.status = ProspectStatus.ACTIVE;
        await this.prospectRepository.save(prospect);
      }
    }

    // Send email notification about status change
    await this.mailService.sendUserStatusChangeEmail(
      user.email,
      user.fullName,
      oldStatus,
      updateUserStatusDto.status,
      updateUserStatusDto.suspensionReason,
    );

    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}