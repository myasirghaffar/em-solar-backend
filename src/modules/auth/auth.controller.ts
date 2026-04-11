import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ControllerSuccess } from '../../common/utils/response.util';
import { SuccessCodes } from '../../common/constants/success-messages';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GeneratedTokens } from '../../common/utils/jwt.util';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<ControllerSuccess<GeneratedTokens>> {
    const tokens = await this.authService.register(dto);

    return {
      data: tokens,
      successCode: SuccessCodes.AUTH_REGISTER_SUCCESS,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<ControllerSuccess<GeneratedTokens>> {
    const tokens = await this.authService.login(dto);

    return {
      data: tokens,
      successCode: SuccessCodes.AUTH_LOGIN_SUCCESS,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest): Promise<ControllerSuccess<null>> {
    await this.authService.logout(req.user.userId);

    return {
      data: null,
      successCode: SuccessCodes.AUTH_LOGOUT_SUCCESS,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshTokens(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RefreshTokenDto,
  ): Promise<ControllerSuccess<GeneratedTokens>> {
    const tokens = await this.authService.refreshTokens(req.user.userId, dto);

    return {
      data: tokens,
      successCode: SuccessCodes.AUTH_REFRESH_SUCCESS,
    };
  }
}

