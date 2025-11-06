import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole, UserStatus } from '../entities/enums';

@Injectable()
export class SeedingService implements OnModuleInit {
  private readonly logger = new Logger(SeedingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser(): Promise<void> {
    const adminEmail = 'admin@tutorscene.com';
    const adminPassword = 'Passw0rd';

    try {
      // Check if admin user already exists
      const existingAdmin = await this.userRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log('Admin user already exists');
        return;
      }

      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

      // Create admin user
      const adminUser = this.userRepository.create({
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });

      await this.userRepository.save(adminUser);

      this.logger.log(`Admin user created successfully with email: ${adminEmail}`);
    } catch (error) {
      this.logger.error('Failed to seed admin user', error.stack);
    }
  }
}
