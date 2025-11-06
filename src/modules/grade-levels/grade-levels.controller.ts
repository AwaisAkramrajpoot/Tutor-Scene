import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GradeLevelsService } from './grade-levels.service';
import { CreateGradeLevelDto } from './dto/create-grade-level.dto';
import { UpdateGradeLevelDto } from './dto/update-grade-level.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '@/database/entities/enums';

@ApiTags('Grade Levels')
@Controller('grade-levels')
export class GradeLevelsController {
  constructor(private readonly gradeLevelsService: GradeLevelsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new grade level (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Grade level created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Grade level with this name already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async create(@Body() createGradeLevelDto: CreateGradeLevelDto) {
    return this.gradeLevelsService.create(createGradeLevelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all grade levels' })
  @ApiResponse({
    status: 200,
    description: 'List of all grade levels',
  })
  async findAll() {
    return this.gradeLevelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a grade level by ID' })
  @ApiResponse({
    status: 200,
    description: 'Grade level details',
  })
  @ApiResponse({
    status: 404,
    description: 'Grade level not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gradeLevelsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a grade level (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Grade level updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Grade level not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Grade level with this name already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGradeLevelDto: UpdateGradeLevelDto,
  ) {
    return this.gradeLevelsService.update(id, updateGradeLevelDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a grade level (Admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Grade level deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Grade level not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.gradeLevelsService.remove(id);
  }
}
