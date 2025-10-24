import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TicketStatus } from '@/database/entities/enums';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async create(@Body() createDto: CreateTicketDto, @Request() req: any) {
    return this.supportService.create(createDto, req.user.id);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tickets (Admin) or user tickets' })
  @ApiResponse({ status: 200, description: 'List of tickets' })
  async findAll(@Request() req: any) {
    if (req.user.role === 'ADMIN') {
      return this.supportService.findAll();
    }
    return this.supportService.findByUser(req.user.id);
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket details' })
  async findOne(@Param('id') id: string) {
    return this.supportService.findOne(+id);
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket status (Admin)' })
  @ApiResponse({ status: 200, description: 'Ticket status updated' })
  async updateStatus(@Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.supportService.updateStatus(+id, status);
  }

  @Patch('tickets/:id/assign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign ticket (Admin)' })
  @ApiResponse({ status: 200, description: 'Ticket assigned' })
  async assignTicket(@Param('id') id: string, @Body('assignedTo') assignedTo: number) {
    return this.supportService.assignTicket(+id, assignedTo);
  }

  @Patch('tickets/:id/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve ticket (Admin)' })
  @ApiResponse({ status: 200, description: 'Ticket resolved' })
  async resolveTicket(@Param('id') id: string, @Body('resolutionNotes') notes: string) {
    return this.supportService.resolveTicket(+id, notes);
  }
}
