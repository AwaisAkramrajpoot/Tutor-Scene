import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false, // Allow array indices
  }))
  @ApiOperation({ summary: 'Create availability slot(s) - accepts single object or array' })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/CreateAvailabilitySlotDto' },
        { type: 'array', items: { $ref: '#/components/schemas/CreateAvailabilitySlotDto' } }
      ]
    }
  })
  @ApiResponse({ status: 201, description: 'Availability slot(s) created' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  async create(@Body() body: CreateAvailabilitySlotDto | CreateAvailabilitySlotDto[]) {
    // Handle both single object and array
    if (Array.isArray(body)) {
      return this.availabilityService.createBulk(body);
    }
    return this.availabilityService.create(body, body.tutorProfileId);
  }

  @Get('tutor/:tutorUserId/calendar-slots')
  @ApiOperation({
    summary: 'Get tutor calendar slots for learner booking (with status)',
  })
  @ApiResponse({ status: 200, description: 'Calendar slots with availability status' })
  async getCalendarSlots(
    @Param('tutorUserId') tutorUserId: string,
    @Query('tutorProspectId') tutorProspectId?: string,
    @Query('studentId') studentId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.availabilityService.getLearnerCalendarSlots(+tutorUserId, {
      tutorProspectId: tutorProspectId ? +tutorProspectId : undefined,
      studentId: studentId ? +studentId : undefined,
      start,
      end,
    });
  }

  @Get('tutor/:tutorId')
  @ApiOperation({ summary: 'Get tutor availability slots' })
  @ApiResponse({ status: 200, description: 'List of availability slots' })
  async findByTutor(
    @Param('tutorId') tutorId: string,
    @Query('includeExpired') includeExpired?: string,
  ) {
    return this.availabilityService.findByTutor(+tutorId, includeExpired === 'true');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get availability slot by ID' })
  @ApiResponse({ status: 200, description: 'Availability slot details' })
  @ApiResponse({ status: 404, description: 'Availability slot not found' })
  async findOne(@Param('id') id: string) {
    return this.availabilityService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update availability slot' })
  @ApiResponse({ status: 200, description: 'Availability slot updated' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 404, description: 'Availability slot not found' })
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateAvailabilitySlotDto>) {
    return this.availabilityService.update(+id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete availability slot' })
  @ApiResponse({ status: 200, description: 'Availability slot deleted' })
  @ApiResponse({ status: 404, description: 'Availability slot not found' })
  async delete(@Param('id') id: string) {
    await this.availabilityService.delete(+id);
    return { message: 'Availability slot deleted successfully' };
  }

  @Delete('bulk/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete multiple availability slots' })
  @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'number' } } } } })
  @ApiResponse({ status: 200, description: 'Availability slots deleted' })
  async deleteBulk(@Body('ids') ids: number[]) {
    await this.availabilityService.deleteBulk(ids);
    return { message: `${ids.length} availability slots deleted successfully` };
  }
}
