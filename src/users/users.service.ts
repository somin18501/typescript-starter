import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserData, User } from 'src/users/user.model';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(email: string, password: string): Promise<User> {
    return this.prisma.user.create({
      data: { email, password },
    });
  }

  findOne(id: number): Promise<User | null> {
    return id
      ? this.prisma.user.findUnique({
          where: { id },
        })
      : Promise.resolve(null);
  }

  find(email?: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: email ? { email } : undefined,
    });
  }

  async update(id: number, attrs: UpdateUserData): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: { id },
      data: attrs,
    });
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
