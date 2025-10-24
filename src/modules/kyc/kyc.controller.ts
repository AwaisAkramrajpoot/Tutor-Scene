import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { SubmitKYCDto } from './dto/submit-kyc.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit KYC documents (Tutor)' })
  @ApiResponse({ status: 201, description: 'KYC submitted successfully' })
  async submit(@Body() submitKYCDto: SubmitKYCDto, @Request() req: any) {
    return this.kycService.submit(submitKYCDto, req.user.profileId);
  }

  @Get('tutor/:tutorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get KYC requests by tutor' })
  @ApiResponse({ status: 200, description: 'List of KYC requests' })
  async findByTutor(@Param('tutorId') tutorId: string) {
    return this.kycService.findByTutor(+tutorId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all KYC requests (Admin)' })
  @ApiResponse({ status: 200, description: 'List of all KYC requests' })
  async findAll() {
    return this.kycService.findAll();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve KYC request (Admin)' })
  @ApiResponse({ status: 200, description: 'KYC approved' })
  async approve(@Param('id') id: string, @Request() req: any) {
    return this.kycService.approve(+id, req.user.id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject KYC request (Admin)' })
  @ApiResponse({ status: 200, description: 'KYC rejected' })
  async reject(@Param('id') id: string, @Request() req: any, @Body('reason') reason: string) {
    return this.kycService.reject(+id, req.user.id, reason);
  }
}
