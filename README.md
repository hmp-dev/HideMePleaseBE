# Hidemeplease Monorepo

## Installation:

1. make sure to have `pnpm` installed globally (`npm i -g pnpm`)
2. run `pnpm install -r`
3. run `pnpm run prisma:generate`

To update dependencies:

-   run `pnpm up -r --latest`

To launch the dev environment, use docker - `docker compose up`.
Make sure to have an up to date `.env` file in the root of your repository.

## Git

### Commits

The repository follows [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) which are enforced using
[CommitLint](https://github.com/conventional-changelog/commitlint) (executed via husky on commit).


## Commands

### Test commands:

`pnpm run test` - run tests.

### Linting commands:

`pnpm run lint` - lint with auto fix using ESLint.
`pnpm run check` - lint with only check using ESLint.
`pnpm run format` - format all supported files using prettier.

### Dev commands:

`pnpm run dev` - run the backend locally.

## How to migrate the DB locally?

Start by running the container for the DB locally with:

```shell
docker compose up db --detach
```

Then export the env variables for the DB connection:

```shell
export DATABASE_URL=postgresql://hidemeplease:hidemeplease@0.0.0.0:5432/hidemeplease
```

And now execute the migration commands:

```shell
pnpm run prisma:migrate:dev
```

Followed by:

```shell
pnpm run prisma:generate
```

Create empty migration

```shell
prisma migrate dev --create-only --name <NAME_OF_YOUR_MIGRATION>
```

Print db diff

```shell
npx prisma migrate diff --from-schema-datamodel ./prisma/schema.prisma --to-url postgresql://hidemeplease:hidemeplease@localhost:5432/hidemeplease --script

```

Mark migration as applied

```shell
npx prisma migrate resolve --applied <NAME_OF_YOUR_MIGRATION>

```
