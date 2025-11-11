import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailService } from '../auth/services/mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Prospect])],
  controllers: [UsersController],
  providers: [UsersService, MailService],
  exports: [UsersService],
})
export class UsersModule {}