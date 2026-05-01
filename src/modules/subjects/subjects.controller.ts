import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Public } from '../auth/decorators/auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subject (Admin only)' })
  @ApiResponse({ status: 201, description: 'Subject created successfully' })
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiResponse({ status: 200, description: 'List of all subjects' })
  findAll(
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('gradeLevel') gradeLevel?: string,
    @Query('databaseOnly') databaseOnly?: string,
  ) {
    const dbOnly = databaseOnly === 'true' || databaseOnly === '1';
    return this.subjectsService.findAll({ category, keyword, gradeLevel, databaseOnly: dbOnly });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List subjects stored in database (admin)' })
  @ApiResponse({ status: 200, description: 'Database subjects only' })
  findAllForAdmin() {
    return this.subjectsService.findAllFromDatabase();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiResponse({ status: 200, description: 'Subject details' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a subject (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subject updated successfully' })
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(+id, updateSubjectDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a subject (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subject deleted successfully' })
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(+id);
  }
}
