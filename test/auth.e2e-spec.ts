import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// import { setupApp } from 'src/setup-app';
import { User } from 'src/users/user.model';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // setupApp(app); // NOTE: This is a way to configure the pipes and interceptor in the e2e tests if this is done in the main.ts file but not needed if already configured in appModule.
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('handles a signup request', () => {
    const email = 'test5@gmail.com';

    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: '123456' })
      .expect(201)
      .then((res) => {
        const { id, email: userEmail } = res.body as User;
        expect(id).toBeDefined();
        expect(userEmail).toEqual(email);
      });
  });

  it('signup as a new user then get the currently logged in user', async () => {
    const email = 'test6@gmail.com';

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: '123456' })
      .expect(201);

    const cookie = res.get('Set-Cookie');

    const { body } = await request(app.getHttpServer())
      .get('/auth/whoami')
      .set('Cookie', cookie)
      .expect(200);

    expect(body.email).toEqual(email);
  });

  it('signup then signout and again signin and get the currently logged in user', async () => {
    const email = 'test7@gmail.com';

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: '123456' })
      .expect(201);

    const cookie = res.get('Set-Cookie');

    await request(app.getHttpServer())
      .post('/auth/signout')
      .set('Cookie', cookie)
      .expect(201);

    const signinRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password: '123456' })
      .expect(201);

    const cookieAfterSignin = signinRes.get('Set-Cookie');

    const { body } = await request(app.getHttpServer())
      .get('/auth/whoami')
      .set('Cookie', cookieAfterSignin)
      .expect(200);

    expect(body.email).toEqual(email);
  });
});
