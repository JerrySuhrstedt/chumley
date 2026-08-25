# Tests

    npm test            # watch
    npm run test:run    # once, for CI
    npm run test:cov    # with coverage

## Two kinds, and the difference matters

**`tests/unit`** needs nothing. Pure functions, no database, no network. These
run everywhere and always, and they are where most of the value is: the date
handling, the phone formatting, the money parsing and the address matching are
all things that have already been wrong once.

**`tests/integration`** talks to Postgres and is **skipped unless
`TEST_DATABASE_URL` is set**. It refuses outright if that URL is the same as
`DATABASE_URL`. A test suite that creates and deletes rows must never be one
typo away from doing it to real customers, and the guard is in
`tests/integration/db.ts` rather than in a comment asking people to be careful.

## Running the integration tests

Make a second Supabase project, or a local Postgres, and point at it:

    TEST_DATABASE_URL='postgresql://...' npm run test:run

Push the schema into it once with `drizzle-kit push`, or run the baseline
migration against it.

Without that variable the integration files report as skipped, not as passing.
