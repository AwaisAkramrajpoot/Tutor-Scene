import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConversationsService } from '../services/conversations.service';

/**
 * Guard to validate that the authenticated user is a participant in the conversation
 * before allowing access to conversation-related endpoints.
 * Requirements: 3.4, 7.3
 */
@Injectable()
export class ConversationAccessGuard implements CanActivate {
  constructor(private readonly conversationsService: ConversationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const conversationId = parseInt(request.params.id, 10);

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!conversationId || isNaN(conversationId)) {
      throw new NotFoundException('Invalid conversation ID');
    }

    try {
      // Use the service's findOne method which includes access validation
      await this.conversationsService.findOne(conversationId, user.id);
      return true;
    } catch (error) {
      // Re-throw the error from the service (NotFoundException or ForbiddenException)
      throw error;
    }
  }
}
