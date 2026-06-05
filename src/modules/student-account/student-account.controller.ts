import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';
import { UserRole } from '@/database/entities/enums';
import { StudentAccountService } from './student-account.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpsertLearnerDto } from './dto/upsert-learner.dto';

@ApiTags('Student account')
@Controller('student-account')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.STUDENT)
export class StudentAccountController {
  constructor(private readonly service: StudentAccountService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Account settings (read-only profile + security + notifications)' })
  getSettings(@CurrentUser() user: User) {
    return this.service.getAccountSettings(user.id);
  }

  @Patch('account')
  @ApiOperation({ summary: 'Update phone number' })
  updateAccount(@CurrentUser() user: User, @Body() dto: UpdateAccountDto) {
    return this.service.updateAccount(user.id, dto);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update profile (gender, avatar, self registration)' })
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.id, dto);
  }

  @Patch('notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  updateNotifications(
    @CurrentUser() user: User,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.updateNotificationPreferences(user.id, body);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password while logged in' })
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(user.id, dto);
  }

  @Patch('two-factor')
  @ApiOperation({ summary: 'Enable or disable two-factor authentication flag' })
  setTwoFactor(
    @CurrentUser() user: User,
    @Body() body: { enabled: boolean },
  ) {
    return this.service.setTwoFactor(user.id, Boolean(body.enabled));
  }

  @Get('learners')
  @ApiOperation({ summary: 'List managed learners' })
  listLearners(@CurrentUser() user: User) {
    return this.service.listLearners(user.id);
  }

  @Post('learners')
  @ApiOperation({ summary: 'Create or update a learner profile' })
  upsertLearner(@CurrentUser() user: User, @Body() dto: UpsertLearnerDto) {
    return this.service.upsertLearner(user.id, dto);
  }

  @Get('learners/:learnerLabel/removal-preview')
  @ApiOperation({ summary: 'Preview sessions affected by learner removal' })
  removalPreview(
    @CurrentUser() user: User,
    @Param('learnerLabel') learnerLabel: string,
  ) {
    return this.service.getRemovalPreview(
      user.id,
      decodeURIComponent(learnerLabel),
    );
  }

  @Get('credits-referrals')
  @ApiOperation({ summary: 'Credits, referrals, and reward history' })
  getCreditsReferrals(@CurrentUser() user: User) {
    return this.service.getCreditsReferrals(user.id);
  }

  @Post('referral-code')
  @ApiOperation({ summary: 'Apply a referral code to this account' })
  applyReferralCode(
    @CurrentUser() user: User,
    @Body() body: { code: string },
  ) {
    return this.service.applyReferralCode(user.id, body.code || '');
  }

  @Get('session-history')
  @ApiOperation({ summary: 'Session history for credits page' })
  getSessionHistory(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('sort') sort?: 'newest' | 'oldest',
  ) {
    return this.service.getSessionHistory(user.id, status, sort || 'newest');
  }

  @Delete('learners/:learnerLabel')
  @ApiOperation({ summary: 'Remove a learner' })
  removeLearner(
    @CurrentUser() user: User,
    @Param('learnerLabel') learnerLabel: string,
    @Query('cancelSessions') cancelSessions?: string,
  ) {
    return this.service.removeLearner(
      user.id,
      decodeURIComponent(learnerLabel),
      cancelSessions === 'true',
    );
  }
}
