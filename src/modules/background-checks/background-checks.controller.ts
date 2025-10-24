import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BackgroundChecksService } from './background-checks.service';
import { InitiateBackgroundCheckDto } from './dto/initiate-background-check.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Background Checks')
@Controller('background-checks')
export class BackgroundChecksController {
  constructor(private readonly backgroundChecksService: BackgroundChecksService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate background check (Admin)' })
  @ApiResponse({ status: 201, description: 'Background check initiated' })
  async initiate(@Body() dto: InitiateBackgroundCheckDto) {
    return this.backgroundChecksService.initiate(dto.tutorProfileId);
  }

  @Get('tutor/:tutorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get background checks by tutor' })
  @ApiResponse({ status: 200, description: 'List of background checks' })
  async findByTutor(@Param('tutorId') tutorId: string) {
    return this.backgroundChecksService.findByTutor(+tutorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get background check by ID' })
  @ApiResponse({ status: 200, description: 'Background check details' })
  async findOne(@Param('id') id: string) {
    return this.backgroundChecksService.findOne(+id);
  }
}
