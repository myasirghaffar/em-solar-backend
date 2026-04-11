import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenType } from '../../../common/constants/token-types.enum';
import { UserRole } from '../../../common/constants/roles.enum';
import { JwtPayload } from '../../../common/utils/jwt.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });
  }

  validate(payload: JwtPayload): {
    userId: string;
    email: string;
    role: UserRole;
    type: TokenType;
  } {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      type: payload.type,
    };
  }
}

