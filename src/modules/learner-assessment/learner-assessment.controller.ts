import {
  Body,
  Controller,
  Delete,
  Get,
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
import { LearnerAssessmentService } from './learner-assessment.service';
import { SaveLearnerAssessmentDto } from './dto/save-learner-assessment.dto';

@ApiTags('Learner assessment')
@Controller('learner-assessment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.STUDENT)
export class LearnerAssessmentController {
  constructor(private readonly service: LearnerAssessmentService) {}

  @Get('completed')
  @ApiOperation({ summary: 'List completed learner assessments for current user' })
  async listCompleted(@CurrentUser() user: User) {
    const rows = await this.service.listCompleted(user.id);
    return {
      learners: rows.map((r) => ({
        learnerLabel: r.learnerLabel,
        learnerFirstName: r.learnerFirstName,
        learnerLastName: r.learnerLastName,
        gradeLevel: r.gradeLevel,
        gender: r.gender,
        relationshipToLearner: r.relationshipToLearner,
        avatarIcon: r.avatarIcon,
        isSelf: r.isSelf,
        updatedAt: r.updatedAt,
      })),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get saved learner assessment draft or completion' })
  async getOne(
    @CurrentUser() user: User,
    @Query('learnerLabel') learnerLabel: string,
  ) {
    if (!learnerLabel || !learnerLabel.trim()) {
      return { answers: {}, status: null };
    }
    const row = await this.service.findForUserAndLearner(
      user.id,
      learnerLabel.trim(),
    );
    if (!row) {
      return { answers: {}, status: null };
    }
    return {
      answers: row.answers || {},
      status: row.status,
      learnerLabel: row.learnerLabel,
      learnerFirstName: row.learnerFirstName,
      gradeLevel: row.gradeLevel,
      gender: row.gender,
      relationshipToLearner: row.relationshipToLearner,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Save or complete learner assessment' })
  async save(@CurrentUser() user: User, @Body() dto: SaveLearnerAssessmentDto) {
    const row = await this.service.upsert(user.id, dto);
    return {
      id: row.id,
      learnerLabel: row.learnerLabel,
      status: row.status,
      answers: row.answers,
      learnerFirstName: row.learnerFirstName,
      gradeLevel: row.gradeLevel,
      gender: row.gender,
      relationshipToLearner: row.relationshipToLearner,
    };
  }

  @Delete()
  @ApiOperation({ summary: 'Remove a learner assessment record' })
  async remove(
    @CurrentUser() user: User,
    @Query('learnerLabel') learnerLabel: string,
  ) {
    if (!learnerLabel?.trim()) {
      return { success: false };
    }
    await this.service.deleteForUser(user.id, learnerLabel.trim());
    return { success: true };
  }
}
