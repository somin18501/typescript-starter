# Migrating This NestJS Project From TypeORM to Prisma

This document explains what was changed in this project, why each change was needed, and how the new Prisma-based setup works.

## 1. What was wrong with the old setup

The project originally used:

- `ormconfig.js` for database configuration
- `@nestjs/typeorm` and `TypeOrmModule`
- entity classes with decorators such as `@Entity()`, `@Column()`, `@ManyToOne()`
- injected repositories with `@InjectRepository()`

That style is still valid for older TypeORM-based projects, but it is not how Prisma works.

Prisma does not use:

- `ormconfig.js`
- runtime entity discovery
- repository injection

Prisma is schema-first. That means the database models live in `schema.prisma`, Prisma generates a typed client from that schema, and your Nest services call that client directly.

## 2. Why Prisma could not be a one-file replacement for `ormconfig.js`

Your old TypeORM config switched database providers by environment:

- `development` -> `sqlite`
- `test` -> `sqlite`
- `production` -> `postgres`

That works in TypeORM because the config is plain JavaScript.

Prisma is stricter. In Prisma, the datasource `provider` is fixed inside a schema file. Because of that, one Prisma schema cannot dynamically switch between `sqlite` and `postgresql` the way `ormconfig.js` did.

That is the main reason the Prisma migration needed a slightly different design.

## 3. The solution used here

I kept your original environment behavior by introducing two Prisma schemas:

- `prisma/sqlite/schema.prisma`
- `prisma/postgresql/schema.prisma`

Then I added a small command wrapper:

- `scripts/run-prisma.mjs`

This script:

1. Reads `NODE_ENV`
2. Loads the matching `.env.<environment>` file
3. Chooses the correct Prisma schema
4. Runs Prisma CLI commands against that schema

This gives you a Prisma equivalent of environment-based database configuration without pretending Prisma supports provider switching inside one schema.

## 4. Environment files

I updated the local env files so Prisma has a `DATABASE_URL` to read.

### Development

File: `.env.development`

```env
DATABASE_URL="file:./dev.db"
COOKIE_KEY=qwerty
PORT=3000
```

### Test

File: `.env.test`

```env
DATABASE_URL="file:./test.db"
COOKIE_KEY=qwerty
PORT=3000
```

For production, you should provide a real Postgres URL in `.env.production` or through your deployment environment:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
COOKIE_KEY=your_cookie_key
PORT=3000
```

## 5. Prisma schemas that replaced the entities

The old TypeORM entities were removed:

- `src/users/user.entity.ts`
- `src/reports/report.entity.ts`

They were replaced by Prisma models:

- `User`
- `Report`

Important choices made in the Prisma schema:

- `User.email` is marked `@unique`
- `Report.userId` is required
- deleting a user cascades to reports

### Why `email` was made unique

Even though the old code manually checked for duplicate emails, authentication logic clearly assumes a user email should uniquely identify one account. Putting that rule in the database is safer than relying only on application code.

## 6. Why Prisma 6 was used instead of Prisma 7

The first install pulled Prisma 7. Prisma 7 changed the datasource configuration flow and no longer fit this project’s Node 20 + tutorial-style `DATABASE_URL` setup cleanly.

To keep this project easier to learn and closer to common NestJS + Prisma tutorials, I switched to Prisma 6.

That gives you the familiar and much simpler flow:

- `schema.prisma`
- `DATABASE_URL`
- `PrismaClient`

## 7. NestJS integration changes

### Added

- `src/prisma/prisma.service.ts`
- `src/prisma/prisma.module.ts`

### Why this was needed

Nest needs a shared place to create and manage the Prisma client.

`PrismaService` is the Prisma equivalent of what `TypeOrmModule.forRoot()` was doing for you before.

It handles:

- connecting when the app starts
- disconnecting when the app shuts down
- being injectable into services

`PrismaModule` is marked global so the Prisma service can be used anywhere without repeating imports everywhere.

## 8. App module changes

In `src/app.module.ts`:

- removed `TypeOrmModule.forRoot()`
- added `PrismaModule`

### Why this was needed

Prisma does not plug into Nest through `TypeOrmModule`. Once the app moved to Prisma, the TypeORM bootstrapping code had to disappear completely.

## 9. Service layer refactor

The biggest application-level change was in the services.

### Before

The services used repository injection:

```ts
constructor(@InjectRepository(User) private repo: Repository<User>) {}
```

### After

The services now inject `PrismaService`:

```ts
constructor(private prisma: PrismaService) {}
```

### Why this matters

With Prisma, the client is your data access layer. Instead of `repo.find()` or `repo.save()`, you use:

- `this.prisma.user.findMany()`
- `this.prisma.user.create()`
- `this.prisma.user.update()`
- `this.prisma.report.create()`

This is the core mental shift when moving from TypeORM to Prisma.

## 10. Why `User` and `Report` are now model types instead of entity classes

I added:

- `src/users/user.model.ts`
- `src/reports/report.model.ts`

These files export TypeScript types derived from Prisma.

### Why this was needed

Other parts of the app still need user/report types for controller method signatures, middleware typing, and tests. Prisma gives you generated types, but they are not decorated entity classes.

So these small model files give the project a clean place to import app-level domain types from.

## 11. The `createEstimate()` query and why it changed

The old TypeORM version used a query builder with SQL-like filtering and averaging.

Prisma does not have a direct equivalent for every query-builder pattern, especially for calculations like:

- filter by nearby latitude/longitude/year
- sort by absolute mileage distance
- average the closest three records

Instead of forcing raw SQL immediately, I changed the logic to:

1. fetch matching approved reports with Prisma
2. sort them in application code by distance from the requested mileage
3. take the closest three
4. compute the average in JavaScript

### Why this was a good first migration choice

- easier to read for a first NestJS project
- no database-specific raw SQL
- works for both sqlite and postgres

If the dataset gets large later, you can optimize this query further.

## 12. Why explicit return types were added to service methods

Some Prisma calls return `PrismaPromise`, which is fine in app code but awkward in tests when mocks return normal `Promise`s.

I added explicit return types like:

```ts
find(email?: string): Promise<User[]>
```

### Why this helps

It keeps the service contract simple for the rest of the app and makes unit-test mocks much easier to write.

## 13. Testing changes

### Unit tests

Several tests needed small dependency-provider fixes. Some of those failures were not caused by Prisma directly, but they blocked verification.

I updated those specs so they provide the required mocked dependencies.

### E2E tests

Your e2e setup originally deleted the test sqlite file. After moving to Prisma, that deletion happened after Prisma had already synced the schema, which removed the tables again.

I updated `test/setup-e2e.ts` so it now:

1. deletes the old Prisma test database
2. reruns the Prisma setup script
3. starts each e2e file with a fresh Prisma-managed schema

## 14. New scripts you can use

The migration added two kinds of scripts:

- helper scripts that directly run Prisma commands
- npm `pre*` lifecycle scripts that automatically prepare Prisma before normal app commands

### A. Helper scripts

#### `npm run prisma:generate`

This runs:

```bash
node scripts/run-prisma.mjs generate
```

What it does:

- chooses the right Prisma schema based on `NODE_ENV`
- loads the correct `.env.<environment>` file
- regenerates the Prisma client

Why it matters:

- Prisma generates TypeScript-aware client code from your schema
- after changing `schema.prisma`, you usually need to regenerate the client
- without generation, your code and Prisma types can go out of sync

Use it when:

- you changed a Prisma model
- you want fresh generated Prisma client code without changing the database

#### `npm run prisma:db:push`

This runs:

```bash
node scripts/run-prisma.mjs db push
```

What it does:

- takes the current Prisma schema
- updates the selected database so its structure matches the schema
- does not create migration history files

Why it matters:

- it is the fastest way to make the local development database match your schema
- it is great for learning, prototyping, and quick iteration

Use it when:

- you are working locally
- you want the database updated immediately
- you do not need a tracked migration file

#### `npm run prisma:migrate:dev`

This runs:

```bash
node scripts/run-prisma.mjs migrate dev
```

What it does:

- compares the current schema against the migration history
- generates a new migration
- applies that migration to the database

Why it matters:

- unlike `db push`, this creates actual migration history
- that history is important when multiple people work on the project
- it is the safer long-term workflow once schema changes become important to track

Important note:

You usually do not write the migration manually before running this command.

Typical flow:

1. edit the Prisma schema
2. run `npm run prisma:migrate:dev -- --name some_change`
3. Prisma generates the migration files for you
4. Prisma applies them

So in most cases, Prisma writes the migration for you.

#### `npm run prisma:migrate:deploy`

This runs:

```bash
node scripts/run-prisma.mjs migrate deploy
```

What it does:

- applies already-created migrations to the target database
- does not create a new migration

Why it matters:

- this is the production-style command
- production should generally apply reviewed migrations, not invent new schema changes on the fly

Use it when:

- you already have migration files committed
- you are deploying to a real environment such as staging or production

### B. Automatic `pre*` scripts

These scripts run automatically before the matching npm commands:

- `prebuild`
- `prestart`
- `prestart:dev`
- `prestart:debug`
- `prestart:prod`
- `pretest`
- `pretest:watch`
- `pretest:cov`
- `pretest:debug`
- `pretest:e2e`

This is standard npm behavior:

- `prestart` runs before `start`
- `pretest` runs before `test`
- `prebuild` runs before `build`

### Why these automatic scripts were added

They remove repetitive manual setup work.

Without them, you would have to remember to run Prisma commands yourself every time before:

- building
- starting the app
- running tests

That would be easy to forget, especially in a first project.

### What each automatic script is doing

#### `prebuild`

Runs:

```bash
cross-env NODE_ENV=development node scripts/setup-prisma-env.mjs --generate-only
```

Why:

- ensures the Prisma client is generated before TypeScript build runs
- uses `--generate-only` because building code should not modify the database

#### `prestart`, `prestart:dev`, `prestart:debug`

These run the setup script in `development`.

Why:

- generate the Prisma client
- create the sqlite file if needed
- run `db push` for local sqlite development

That makes local development smoother because the database is kept in sync automatically.

#### `prestart:prod`

Runs the setup script in `production` with `--generate-only`.

Why:

- production still needs the Prisma client
- but production should not auto-run `db push`
- schema changes in production should be controlled through migrations, typically `migrate deploy`

#### `pretest`, `pretest:watch`, `pretest:cov`, `pretest:debug`, `pretest:e2e`

These run the setup script in `test`.

Why:

- ensure the Prisma client exists for test runs
- create the sqlite test database file if needed
- push the Prisma schema into the test database before tests start

That guarantees tests do not fail just because the test database was missing or outdated.

### C. Why `db push` and `migrate dev` are both present

This is an important distinction.

#### `db push`

Think of it as:

- "make my database match the schema right now"

Characteristics:

- fast
- convenient
- no migration history

#### `migrate dev`

Think of it as:

- "record this schema change as a real migration and apply it"

Characteristics:

- generates migration files
- keeps schema history
- better for team workflows and production preparation

### D. Do you need to write migrations separately before running `migrate dev`?

Usually no.

In normal Prisma usage:

1. you edit the schema
2. you run `migrate dev`
3. Prisma generates the migration for you

You only write SQL manually in special cases, such as:

- custom data migrations
- database-specific SQL behavior
- changes Prisma cannot express automatically

### E. One project-specific note for this repository

This project uses:

- sqlite schema for `development` and `test`
- postgres schema for `production`

That means migrations are schema/provider specific.

So if you decide to rely on real migration history later, you should be clear about which provider you are generating migrations for.

For a learning project, the current setup is reasonable:

- `db push` for easy local iteration
- `migrate dev` when you want proper tracked migrations
- `migrate deploy` for production-style deployment flow

## 15. Files removed

- `ormconfig.js`
- `src/users/user.entity.ts`
- `src/reports/report.entity.ts`

These are not needed anymore because Prisma now owns schema definition and database access.

## 16. Files added

- `prisma/sqlite/schema.prisma`
- `prisma/postgresql/schema.prisma`
- `scripts/run-prisma.mjs`
- `scripts/setup-prisma-env.mjs`
- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`
- `src/users/user.model.ts`
- `src/reports/report.model.ts`

## 17. What to learn from this migration

The main difference between TypeORM and Prisma in a NestJS app is this:

### TypeORM mindset

- define decorated classes
- inject repositories
- let the ORM map entities dynamically

### Prisma mindset

- define schema models
- generate a typed client
- inject one Prisma service
- query through `prisma.<model>`

If you remember only one thing, remember this:

Prisma replaces both the old configuration file and the repository pattern with a generated, typed client.

## 18. Commands I used to verify the migration

These now pass:

```bash
npm run build
npm test
npm run test:e2e
```

## 19. What you should do next if you keep growing this project

Recommended next improvements:

1. Add a real `.env.production` in deployment, not in git.
2. Add proper Prisma migrations for each provider if you want long-term schema history for both sqlite and postgres.
3. Consider moving from sqlite to postgres in all environments once the project grows, because Prisma is simplest when one provider is used everywhere.
4. Add error handling for Prisma unique-constraint errors on signup so duplicate emails are handled cleanly even if the database rejects them first.

## 20. Short summary

You absolutely can replace the old TypeORM config with Prisma, but not as a direct 1:1 config-file translation.

The successful migration required:

- replacing `ormconfig.js` with Prisma schema files
- replacing `TypeOrmModule` with `PrismaModule`
- replacing repositories with `PrismaService`
- replacing entity classes with Prisma-backed model types
- updating scripts and tests so Prisma setup happens automatically

That is the normal shape of a real TypeORM -> Prisma migration in NestJS.
