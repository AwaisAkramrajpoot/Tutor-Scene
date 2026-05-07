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

  // ✅ Read role from the incoming request and encode it in OAuth state
  authorizationParams(options: any): Record<string, string> {
    const role = options?.role || 'student'; // options here comes from req.query via Passport
    return {
      prompt: 'select_account',
      state: role, // encode role as the state string
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

    // ✅ Google sends your state string back in req.query.state on callback
    const role = req.query?.state || 'student';

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