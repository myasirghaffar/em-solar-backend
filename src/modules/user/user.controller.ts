import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/constants/roles.enum';
import { ControllerSuccess } from '../../common/utils/response.util';
import { SuccessCodes } from '../../common/constants/success-messages';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { IUser } from './interfaces/user.interface';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest): Promise<ControllerSuccess<IUser>> {
    const user = await this.userService.findById(req.user.userId);
    return {
      data: user as IUser,
      successCode: SuccessCodes.AUTH_LOGIN_SUCCESS,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getUserById(@Param('id') id: string): Promise<ControllerSuccess<IUser | null>> {
    const user = await this.userService.findById(id);
    return {
      data: user,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<ControllerSuccess<IUser>> {
    const updated = await this.userService.updateUser(id, dto);
    return {
      data: updated,
    };
  }
}

