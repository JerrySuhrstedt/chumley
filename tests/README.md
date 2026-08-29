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
`TEST_DATABASE_URL` is set**. The fixtures write and delete rows through
`TEST_DATABASE_URL`, but the code under test imports `@/db`, which connects
through `DATABASE_URL`. So when `TEST_DATABASE_URL` is set the suite refuses
outright unless `DATABASE_URL` names the **same** database: otherwise the
fixtures and the code hit two different databases, the tests assert against
nothing, and whatever `DATABASE_URL` points at (production included) is what
actually gets touched. The guard is in `tests/integration/db.ts` rather than
in a comment asking people to be careful.

## Running the integration tests

Make a scratch database, a second Neon branch or a local Postgres, and point
**both** variables at it so the fixtures and the code under test share one DB:

    TEST_DATABASE_URL='postgresql://scratch...' \
    DATABASE_URL='postgresql://scratch...' \
    npm run test:run

Push the schema into it once with `drizzle-kit push`, or run the baseline
migration against it.

Without `TEST_DATABASE_URL` the integration files report as skipped, not as
passing.
