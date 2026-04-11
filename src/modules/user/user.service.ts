import { Injectable } from '@nestjs/common';
import { ErrorCodes } from '../../common/constants/error-codes';
import { HttpStatusCode } from '../../common/constants/http-status';
import { buildErrorPayload } from '../../common/utils/response.util';
import { hashPassword } from '../../common/utils/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(dto: CreateUserDto): Promise<IUser> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      const errorPayload = buildErrorPayload({
        errorCode: ErrorCodes.USER_ALREADY_EXISTS,
        statusCode: HttpStatusCode.CONFLICT,
      });
      throw errorPayload;
    }

    const hashedPassword = await hashPassword(dto.password);

    return this.userRepository.createUser({
      ...dto,
      password: hashedPassword,
    });
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<IUser | null> {
    return this.userRepository.findById(id);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<IUser> {
    const updated = await this.userRepository.updateUser(id, dto);
    if (!updated) {
      const errorPayload = buildErrorPayload({
        errorCode: ErrorCodes.USER_NOT_FOUND,
        statusCode: HttpStatusCode.NOT_FOUND,
      });
      throw errorPayload;
    }

    return updated;
  }
}

