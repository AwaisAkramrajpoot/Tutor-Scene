import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserRole, UserStatus } from '@/database/entities/enums';
import { MailService } from '../auth/services/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async findAllStudents(status?: string): Promise<User[]> {
    const whereCondition: any = { role: UserRole.STUDENT };
    
    if (status) {
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