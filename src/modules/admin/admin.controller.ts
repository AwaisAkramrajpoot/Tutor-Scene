import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get single user with prospect data (Admin)' })
  @ApiResponse({ status: 200, description: 'User details' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(+id);
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle user active status (Admin)' })
  @ApiResponse({ status: 200, description: 'User status toggled' })
  async toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(+id);
  }

  @Patch('users/:id/profile')
  @ApiOperation({ summary: 'Edit user profile fields (Admin)' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  async updateUserProfile(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
      gender?: string;
      status?: string;
      profilePhotoUrl?: string;
      availableCredits?: number;
    },
  ) {
    return this.adminService.updateUserProfile(+id, body);
  }

  @Patch('prospects/:id/profile')
  @ApiOperation({ summary: 'Edit tutor prospect profile fields (Admin)' })
  @ApiResponse({ status: 200, description: 'Updated prospect' })
  async updateProspectProfile(
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      dateOfBirth?: string;
      subjects?: string;
      gradeLevels?: string;
      yearsOfExperience?: number;
      teachingPhilosophy?: string;
      fee?: number;
      status?: string;
      cv?: string;
      introVideo?: string;
      govId?: string;
      profilePic?: string;
    },
  ) {
    return this.adminService.updateProspectProfile(+id, body);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings (Admin)' })
  @ApiResponse({ status: 200, description: 'List of all bookings' })
  async getAllBookings() {
    return this.adminService.getAllBookings();
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments (Admin)' })
  @ApiResponse({ status: 200, description: 'List of all payments' })
  async getAllPayments() {
    return this.adminService.getAllPayments();
  }

  @Get('platform-settings')
  @ApiOperation({ summary: 'Get platform settings (Admin)' })
  @ApiResponse({ status: 200, description: 'Platform settings' })
  async getPlatformSettings() {
    return this.adminService.getPlatformSettings();
  }

  @Patch('platform-settings/rating-period')
  @ApiOperation({ summary: 'Update rating period in months (Admin)' })
  @ApiResponse({ status: 200, description: 'Updated platform settings' })
  async updateRatingPeriod(@Body('months') months: number) {
    return this.adminService.updateRatingPeriod(Number(months));
  }
}
