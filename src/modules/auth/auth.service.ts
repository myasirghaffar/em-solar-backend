import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '../../common/constants/error-codes';
import { HttpStatusCode } from '../../common/constants/http-status';
import { comparePassword, hashPassword } from '../../common/utils/password.util';
import {
  GeneratedTokens,
  generateTokens,
} from '../../common/utils/jwt.util';
import { buildErrorPayload } from '../../common/utils/response.util';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<GeneratedTokens> {
    const createdUser = await this.userService.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    const tokens = await this.generateAndStoreTokens(createdUser.id, createdUser.email, createdUser.role);

    return tokens;
  }

  async login(dto: LoginDto): Promise<GeneratedTokens> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      const errorPayload = buildErrorPayload({
        errorCode: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        statusCode: HttpStatusCode.UNAUTHORIZED,
      });

      throw new HttpException(errorPayload, HttpStatusCode.UNAUTHORIZED);
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      const errorPayload = buildErrorPayload({
        errorCode: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        statusCode: HttpStatusCode.UNAUTHORIZED,
      });

      throw new HttpException(errorPayload, HttpStatusCode.UNAUTHORIZED);
    }

    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.role);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.userService.updateUser(userId, { refreshToken: null } as never);
  }

  async refreshTokens(userId: string, dto: RefreshTokenDto): Promise<GeneratedTokens> {
    const user = await this.userService.findById(userId);
    if (!user || !user.refreshToken) {
      const errorPayload = buildErrorPayload({
        errorCode: ErrorCodes.AUTH_REFRESH_TOKEN_MISSING,
        statusCode: HttpStatusCode.UNAUTHORIZED,
      });

      throw new HttpException(errorPayload, HttpStatusCode.UNAUTHORIZED);
    }

    const isRefreshTokenValid = await comparePassword(dto.refreshToken, user.refreshToken);
    if (!isRefreshTokenValid) {
      const errorPayload = buildErrorPayload({
        errorCode: ErrorCodes.AUTH_REFRESH_TOKEN_INVALID,
        statusCode: HttpStatusCode.UNAUTHORIZED,
      });

      throw new HttpException(errorPayload, HttpStatusCode.UNAUTHORIZED);
    }

    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.role);

    return tokens;
  }

  private async generateAndStoreTokens(
    userId: string,
    email: string,
    role: unknown,
  ): Promise<GeneratedTokens> {
    const accessExpiresIn =
      this.configService.get<string>('jwt.accessExpiration') ?? '15m';
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiration') ?? '7d';

    const tokens = await generateTokens(this.jwtService, {
      userId,
      email,
      role: role as never,
      accessExpiresIn,
      refreshExpiresIn,
    });

    const hashedRefreshToken = await hashPassword(tokens.refreshToken);
    await this.userService.updateUser(userId, {
      refreshToken: hashedRefreshToken,
    } as never);

    return tokens;
  }
}

