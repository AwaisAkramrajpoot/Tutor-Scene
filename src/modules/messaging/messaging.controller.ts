import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(@Body() sendMessageDto: SendMessageDto, @Request() req: any) {
    return this.messagingService.sendMessage(sendMessageDto, req.user.id);
  }

  @Get('conversation/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation with a user' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getConversation(@Param('userId') userId: string, @Request() req: any) {
    return this.messagingService.getConversation(req.user.id, +userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all messages for current user' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getAllMessages(@Request() req: any) {
    return this.messagingService.getAllMessages(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markAsRead(@Param('id') id: string) {
    return this.messagingService.markAsRead(+id);
  }

  @Get('unread/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread message count' })
  async getUnreadCount(@Request() req: any) {
    const count = await this.messagingService.getUnreadCount(req.user.id);
    return { count };
  }
}
