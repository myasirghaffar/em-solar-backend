import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async createUser(data: CreateUserDto & { password: string }): Promise<IUser> {
    const created = await this.userModel.create({
      ...data,
    });

    return created.get({ plain: true }) as IUser;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.userModel.findOne({
      where: { email },
    });

    return user ? (user.get({ plain: true }) as IUser) : null;
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await this.userModel.findByPk(id);
    return user ? (user.get({ plain: true }) as IUser) : null;
  }

  async updateUser(id: string, payload: UpdateUserDto): Promise<IUser | null> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      return null;
    }

    await user.update(payload);
    return user.get({ plain: true }) as IUser;
  }

  async setRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.userModel.update(
      { refreshToken },
      {
        where: { id },
      },
    );
  }
}

