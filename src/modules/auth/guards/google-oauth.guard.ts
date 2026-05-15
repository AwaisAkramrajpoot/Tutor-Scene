import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

function roleFromQuery(role: unknown): 'tutor' | 'student' {
  if (role == null || typeof role !== 'string') return 'student';
  return role.trim().toLowerCase() === 'tutor' ? 'tutor' : 'student';
}

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const state = roleFromQuery(req.query?.role);
    return { state };
  }
}
