import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create availability slot (Tutor)' })
  @ApiResponse({ status: 201, description: 'Availability slot created' })
  async create(@Body() createDto: CreateAvailabilitySlotDto, @Request() req: any) {
    return this.availabilityService.create(createDto, req.user.profileId);
  }

  @Get('tutor/:tutorId')
  @ApiOperation({ summary: 'Get tutor availability slots' })
  @ApiResponse({ status: 200, description: 'List of availability slots' })
  async findByTutor(@Param('tutorId') tutorId: string) {
    return this.availabilityService.findByTutor(+tutorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get availability slot by ID' })
  @ApiResponse({ status: 200, description: 'Availability slot details' })
  async findOne(@Param('id') id: string) {
    return this.availabilityService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update availability slot' })
  @ApiResponse({ status: 200, description: 'Availability slot updated' })
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateAvailabilitySlotDto>) {
    return this.availabilityService.update(+id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete availability slot' })
  @ApiResponse({ status: 200, description: 'Availability slot deleted' })
  async delete(@Param('id') id: string) {
    await this.availabilityService.delete(+id);
    return { message: 'Availability slot deleted successfully' };
  }
}
