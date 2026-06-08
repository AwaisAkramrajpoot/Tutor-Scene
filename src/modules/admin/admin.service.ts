import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/database/entities/user.entity';
import { Booking } from '@/database/entities/booking.entity';
import { Payment } from '@/database/entities/payment.entity';
import { PlatformSettings } from '@/database/entities/platform-settings.entity';
import { UserRole, UserStatus } from '@/database/entities/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PlatformSettings)
    private readonly platformSettingsRepository: Repository<PlatformSettings>,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const totalTutors = await this.userRepository.count({ where: { role: UserRole.TUTOR } });
    const totalStudents = await this.userRepository.count({ where: { role: UserRole.STUDENT } });
    const totalBookings = await this.bookingRepository.count();
    const totalRevenue = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    return {
      totalUsers,
      totalTutors,
      totalStudents,
      totalBookings,
      totalRevenue: totalRevenue?.total || 0,
    };
  }

  async getAllUsers() {
    return this.userRepository.find({ order: { createdAt: 'DESC' } });
  }

  async toggleUserStatus(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.status = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
      return this.userRepository.save(user);
    }
    return null;
  }

  async getAllBookings() {
    return this.bookingRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getAllPayments() {
    return this.paymentRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getPlatformSettings(): Promise<PlatformSettings> {
    let settings = await this.platformSettingsRepository.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.platformSettingsRepository.create({ ratingPeriodMonths: 3 });
      await this.platformSettingsRepository.save(settings);
    }
    return settings;
  }

  async updateRatingPeriod(months: number): Promise<PlatformSettings> {
    if (months < 1 || months > 24) {
      throw new BadRequestException('Rating period must be between 1 and 24 months');
    }
    const settings = await this.getPlatformSettings();
    settings.ratingPeriodMonths = months;
    return this.platformSettingsRepository.save(settings);
  }
}
