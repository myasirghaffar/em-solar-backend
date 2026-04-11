import { JwtService } from '@nestjs/jwt';
import { TokenType } from '../constants/token-types.enum';
import { UserRole } from '../constants/roles.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: TokenType;
}

export interface GenerateTokensOptions {
  userId: string;
  email: string;
  role: UserRole;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
}

export const generateTokens = async (
  jwtService: JwtService,
  options: GenerateTokensOptions,
): Promise<GeneratedTokens> => {
  const payloadBase = {
    sub: options.userId,
    email: options.email,
    role: options.role,
  };

  const accessToken = await jwtService.signAsync({
    ...payloadBase,
    type: TokenType.ACCESS,
  });

  const refreshToken = await jwtService.signAsync(
    {
      ...payloadBase,
      type: TokenType.REFRESH,
    },
    {
      expiresIn: options.refreshExpiresIn,
    },
  );

  return {
    accessToken,
    refreshToken,
  };
};

