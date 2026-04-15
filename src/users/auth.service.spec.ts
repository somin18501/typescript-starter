import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService, SEPARATOR } from 'src/users/auth.service';
import { User } from 'src/users/user.model';
import { UsersService } from 'src/users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // NOTE: This is a fake users service that will be used to test the auth service.
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        return Promise.resolve(users.filter((user) => user.email === email));
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 1000000),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('testUser@gmail.com', 'xxxx');
    expect(user.password).not.toEqual('xxxx');
    const [salt, hash] = user.password.split(SEPARATOR);
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('testUser@gmail.com', 'xxxx');
    await expect(service.signup('testUser@gmail.com', 'xxxx')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws an error if signin is called with an unused email', async () => {
    await expect(service.signin('test@gmail.com', 'xxxx')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws an error if an invalid password is provided', async () => {
    await service.signup('testUser@gmail.com', 'xxxx');
    await expect(
      service.signin('testUser@gmail.com', 'wrongPassword'),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns a user if correct password is provided way 1', async () => {
    // HACK: This is a hack to get the user with the correct password.
    // fakeUsersService.find = () =>
    //   Promise.resolve([
    //     {
    //       id: 1,
    //       email: 'testUser@gmail.com',
    //       password:
    //         '6bf1cb566b4d7abc=_=a46c2d23c9904e9b89adced61b3efe0af2ca4fbebe01728267ed8f0aa8d1bb96',
    //     } as User,
    //   ]);
    // const user = await service.signin('testUser@gmail.com', 'xxxx');
    // expect(user).toBeDefined();

    await service.signup('testUser@gmail.com', 'xxxx');
    const user = await service.signin('testUser@gmail.com', 'xxxx');
    expect(user).toBeDefined();
  });
});
