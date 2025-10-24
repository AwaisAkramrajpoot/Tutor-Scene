import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { VideoSessionsService } from './video-sessions.service';
import { CreateVideoSessionDto } from './dto/create-video-session.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Video Sessions')
@Controller('video-sessions')
export class VideoSessionsController {
  constructor(private readonly videoSessionsService: VideoSessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create video session for booking' })
  @ApiResponse({ status: 201, description: 'Video session created' })
  async create(@Body() createDto: CreateVideoSessionDto) {
    return this.videoSessionsService.create(createDto);
  }

  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get video session by booking ID' })
  @ApiResponse({ status: 200, description: 'Video session details' })
  async findByBooking(@Param('bookingId') bookingId: string) {
    return this.videoSessionsService.findByBooking(+bookingId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get video session by ID' })
  @ApiResponse({ status: 200, description: 'Video session details' })
  async findOne(@Param('id') id: string) {
    return this.videoSessionsService.findOne(+id);
  }

  @Patch(':id/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End video session' })
  @ApiResponse({ status: 200, description: 'Video session ended' })
  async endSession(@Param('id') id: string) {
    return this.videoSessionsService.endSession(+id);
  }
}
