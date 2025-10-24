import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a booking request' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  async create(@Body() createBookingDto: CreateBookingDto, @Request() req: any) {
    return this.bookingsService.create(createBookingDto, req.user.profileId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings for current user' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async findAll(@Request() req: any) {
    return this.bookingsService.findAll(req.user.profileId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a booking (Tutor)' })
  @ApiResponse({ status: 200, description: 'Booking accepted' })
  async accept(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.acceptBooking(+id, req.user.profileId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a booking (Tutor)' })
  @ApiResponse({ status: 200, description: 'Booking rejected' })
  async reject(
    @Param('id') id: string,
    @Request() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.rejectBooking(+id, req.user.profileId, reason);
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
}
