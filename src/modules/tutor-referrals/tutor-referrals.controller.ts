import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';
import { UserRole } from '@/database/entities/enums';
import { TutorReferralsService } from './tutor-referrals.service';
import { UpdateReferralProgramSettingsDto } from './dto/update-referral-program-settings.dto';
import { Public } from '@/modules/auth/decorators/auth.decorator';

@ApiTags('Tutor Referrals')
@Controller('tutor-referrals')
export class TutorReferralsController {
  constructor(private readonly tutorReferralsService: TutorReferralsService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral summary for dashboard stat block' })
  async getSummary(@CurrentUser() user: User) {
    return this.tutorReferralsService.getDashboardSummary(user.id);
  }

  @Get('program')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral program details for modal' })
  async getProgram(@CurrentUser() user: User) {
    return this.tutorReferralsService.getReferralProgramDetails(user.id);
  }

  @Get('program-content')
  @Public()
  @ApiOperation({ summary: 'Get editable referral program verbiage' })
  async getProgramContent() {
    return this.tutorReferralsService.getProgramSettings();
  }

  @Patch('program-content')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update referral program verbiage (admin)' })
  async updateProgramContent(@Body() dto: UpdateReferralProgramSettingsDto) {
    return this.tutorReferralsService.updateProgramSettings(dto);
  }
}
