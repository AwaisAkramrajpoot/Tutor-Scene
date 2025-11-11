import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetStudentSessionsQueryDto } from './dto/get-student-sessions-query.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a booking request' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings for current user' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async findAll(@Request() req: any) {
    return this.bookingsService.findAll(req.user.profileId);
  }

  @Get('pending-review/tutor/:tutorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bookings pending review for a tutor' })
  @ApiResponse({ status: 200, description: 'List of bookings awaiting tutor approval' })
  async findPendingReview(@Param('tutorId') tutorId: string) {
    return this.bookingsService.findPendingReviewByTutor(+tutorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Get(':id/payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment intent client secret for booking' })
  @ApiResponse({ status: 200, description: 'Payment intent client secret' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your booking' })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  async getPaymentIntent(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ clientSecret: string }> {
    return this.bookingsService.getPaymentIntentClientSecret(id, user.id);
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a booking (Tutor)' })
  @ApiResponse({ status: 200, description: 'Booking accepted' })
  async accept(
    @Param('id') id: string,
    @Body('prospectId', ParseIntPipe) prospectId: number,
  ) {
    return this.bookingsService.acceptBooking(+id, prospectId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a booking (Tutor)' })
  @ApiResponse({ status: 200, description: 'Booking rejected' })
  async reject(
    @Param('id') id: string,
    @Body('prospectId', ParseIntPipe) prospectId: number,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.rejectBooking(+id, prospectId, reason);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  async cancel(
    @Param('id') id: string,
    @Request() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancelBooking(+id, req.user.id, reason);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark booking as completed' })
  @ApiResponse({ status: 200, description: 'Booking completed' })
  async complete(@Param('id') id: string) {
    return this.bookingsService.completeBooking(+id);
  }

  @Get('student/:studentId/sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking sessions for a student' })
  @ApiResponse({ status: 200, description: 'List of student sessions with pagination' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getStudentSessions(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: GetStudentSessionsQueryDto,
  ) {
    return this.bookingsService.findStudentSessions(
      studentId,
      query.status,
      query.page,
      query.limit,
    );
  }

  @Get('tutor/:tutorId/sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking sessions for a tutor' })
  @ApiResponse({ status: 200, description: 'List of tutor sessions with pagination' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication token' })
  async getTutorSessions(
    @Param('tutorId', ParseIntPipe) tutorId: number,
    @Query() query: GetStudentSessionsQueryDto,
  ) {
    return this.bookingsService.findTutorSessions(
      tutorId,
      query.status,
      query.page,
      query.limit,
    );
  }

  @Get('tutor/:tutorId/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tutor statistics including current week bookings and active students count' })
  @ApiResponse({ status: 200, description: 'Tutor statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication token' })
  async getTutorStatistics(@Param('tutorId', ParseIntPipe) tutorId: number) {
    return this.bookingsService.getTutorStatistics(tutorId);
  }
}
