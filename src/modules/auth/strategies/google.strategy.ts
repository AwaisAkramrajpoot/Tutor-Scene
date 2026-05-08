import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_REDIRECT_URI'),
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  authorizationParams(options: any): Record<string, string> {
    const raw = options?.state ?? options?.role ?? 'student';
    const state = String(raw).toLowerCase() === 'tutor' ? 'tutor' : 'student';
    return {
      prompt: 'select_account',
      state,
    };
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    const rawState = req.query?.state;
    const role =
      typeof rawState === 'string' && rawState.toLowerCase() === 'tutor'
        ? 'tutor'
        : 'student';

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      profilePhotoUrl: photos?.[0]?.value,
      googleId: profile.id,
      role,
    };
    done(null, user);
  }
}