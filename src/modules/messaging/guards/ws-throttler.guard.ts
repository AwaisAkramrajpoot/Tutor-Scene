import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WebSocket Throttler Guard
 * Extends ThrottlerGuard to work with WebSocket connections
 * Tracks rate limits per user for WebSocket events
 */
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  /**
   * Get tracker key for WebSocket client
   * Uses user ID from socket data for tracking
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const client = req as Socket;
    const user = client.data?.user;
    
    if (!user) {
      return client.id; // Fallback to socket ID if no user
    }
    
    // Track by user ID to prevent rate limit bypass via reconnection
    return `ws-${user.id}`;
  }

  /**
   * Override handleRequest to prevent HTTP header operations on WebSocket
   */
  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: any,
  ): Promise<boolean> {
    const client = context.switchToWs().getClient() as Socket;
    const tracker = await this.getTracker(client);
    const key = this.generateKey(context, tracker, throttler.name);
    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      await this.throwThrottlingException(context);
    }

    return true;
  }

  /**
   * Handle rate limit exceeded
   * Emits error event to WebSocket client instead of throwing HTTP exception
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    const client = context.switchToWs().getClient() as Socket;
    
    // Emit error event to client
    client.emit('error', {
      event: 'rateLimitExceeded',
      message: 'Rate limit exceeded. Please slow down.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
    
    // Throw WebSocket exception to stop execution
    throw new WsException('Rate limit exceeded');
  }
}
