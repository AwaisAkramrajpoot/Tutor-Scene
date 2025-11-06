import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/database/entities/user.entity';
import { JwtPayload } from '@/modules/auth/strategies/jwt.strategy';

/**
 * Guard for WebSocket authentication using JWT tokens
 * Extracts and verifies JWT from WebSocket handshake and attaches user data to socket client
 * Requirements: 5.1, 7.1, 12.1, 12.2
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      
      // Extract token from handshake auth or query
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Authentication token not provided');
      }

      // Verify JWT token
      const payload = this.jwtService.verify<JwtPayload>(token);

      // Validate token type
      if (payload.type !== 'access') {
        throw new WsException('Invalid token type');
      }

      // Fetch user from database
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive()) {
        throw new WsException('User not found or inactive');
      }

      // Attach user to socket client data
      client.data.user = user;

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      
      // Handle JWT verification errors
      if (error.name === 'JsonWebTokenError') {
        throw new WsException('Invalid authentication token');
      }
      
      if (error.name === 'TokenExpiredError') {
        throw new WsException('Authentication token expired');
      }

      throw new WsException('Authentication failed');
    }
  }

  /**
   * Extract JWT token from WebSocket handshake
   * Supports both auth.token and query.token formats
   */
  private extractToken(client: Socket): string | null {
    // Try to get token from auth object (preferred method)
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // Fallback to query parameter
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    // Try to extract from Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
