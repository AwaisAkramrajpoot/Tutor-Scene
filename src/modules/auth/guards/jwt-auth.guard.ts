import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      const infoMessage = info?.message || '';
      // Missing token is expected for unauthenticated/public browsing.
      // Keep logs concise and avoid noisy stack traces in this common case.
      if (infoMessage && infoMessage !== 'No auth token') {
        console.error('JWT Auth Error:', {
          error: err?.message || err || null,
          info: infoMessage,
          hasUser: !!user,
        });
      }
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
