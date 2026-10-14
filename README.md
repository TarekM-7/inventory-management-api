# Inventory Management API – Node.js, Express, TypeScript and PostgreSQL

[![CI](https://github.com/TarekM-7/inventory-management-api/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/TarekM-7/inventory-management-api/actions/workflows/ci.yml)

A REST API to manage a screw inventory, built with **Node.js**, **Express 5** and **TypeScript**. It stores the products and every stock entry and exit in **PostgreSQL** through **Sequelize**, keeps the stock and its history in sync with transactions, validates every request, answers every error in JSON, documents itself with **Swagger**, and is covered by integration tests written with **Jest** and **Supertest**. **GitHub Actions** checks every push, and the production copy runs on a Windows PC under **PM2**.

This is a practice project I built after the REST API section of the Udemy course [React de Principiante a Experto](https://www.udemy.com/course/react-de-principiante-a-experto-creando-mas-de-10-aplicaciones/). It repeats the pattern of the course's product API with a different domain, the screws stock at a manufacturing plant, so I could build an API on my own and question each decision instead of copying it.

## Features

- Full CRUD for products: list, get one, create, update and delete.
- Stock movements: every entry (`in`) or exit (`out`) is recorded with its quantity and an optional note, and changes the stock. An exit greater than the stock gets a `409`.
- The stock only changes through movements. A new product starts at 0, its initial stock is an entry, and the update never touches the stock, so the history always explains the current number.
- The movement and the stock change are saved in one transaction, with the product row locked, so simultaneous exits can never leave a negative stock.
- Movements are a history: they cannot be edited or deleted, and a product that has movements cannot be deleted either (`409`).
- Each product's history, and a list of every movement with its product, newest first.
- Paginated lists, newest first, with `page` and `limit` (up to 100 per page) and a `meta` object with the totals.
- Every request is validated. Invalid input gets a `400` with one error per field.
- Product codes are unique and saved trimmed and in uppercase, so `hex-m6` and `HEX-M6` are the same product. A repeated code gets a `409`.
- Every response is JSON, errors included: `404` for a missing product, movement or route, `500` without internal details.
- The server refuses to start without a database or a `DATABASE_URL`, with a clear message.
- Interactive API documentation with Swagger UI at `/docs`.
- 51 integration tests that cover every endpoint, every documented status code, the transaction, the lock and the docs themselves, on a separate test database.
- Continuous integration: every push to `main` and every pull request runs the format check, the type check, the 51 tests against a fresh PostgreSQL and the build.
- A production setup for a Windows PC: its own folder, database, port and `.env`, kept alive by PM2, started again when the user logs in, and updated with one command.

## Tech Stack

- [Node.js](https://nodejs.org/) and [Express 5](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/) 7
- [PostgreSQL](https://www.postgresql.org/) with [Sequelize](https://sequelize.org/) and [sequelize-typescript](https://github.com/sequelize/sequelize-typescript)
- [express-validator](https://express-validator.github.io/) for request validation
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) and [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) for the OpenAPI docs
- [dotenv](https://github.com/motdotla/dotenv) and [colors](https://github.com/Marak/colors.js)
- [Jest](https://jestjs.io/), [@swc/jest](https://swc.rs/docs/usage/jest) and [Supertest](https://github.com/ladjs/supertest) for testing, and [swagger-parser](https://apitools.dev/swagger-parser/) to validate the docs
- [tsx](https://tsx.is/) to run TypeScript in development, and [Prettier](https://prettier.io/) for formatting
- [GitHub Actions](https://docs.github.com/actions) for continuous integration, and [PM2](https://pm2.keymetrics.io/) to run the API in production

## How It Works

| Method   | Route                         | What it does                                                          | Success |
| -------- | ----------------------------- | --------------------------------------------------------------------- | ------- |
| `GET`    | `/api/products`               | List products, newest first, with `page` and `limit`                  | `200`   |
| `GET`    | `/api/products/:id`           | Get one product                                                       | `200`   |
| `POST`   | `/api/products`               | Create a product from `name` and `code`, with stock 0                 | `201`   |
| `PUT`    | `/api/products/:id`           | Update `name` and `code`                                              | `200`   |
| `DELETE` | `/api/products/:id`           | Delete a product without movements                                    | `204`   |
| `POST`   | `/api/products/:id/movements` | Register an entry or exit from `type`, `quantity` and optional `note` | `201`   |
| `GET`    | `/api/products/:id/movements` | List a product's movements, newest first, with `page` and `limit`     | `200`   |
| `GET`    | `/api/movements`              | List every movement with its product, newest first                    | `200`   |
| `GET`    | `/api/movements/:id`          | Get one movement with its product                                     | `200`   |

Successful responses are wrapped in `{ data }`, and the lists add `{ meta: { page, limit, total, totalPages } }`. Every error, whatever its status, comes back as `{ errors: [{ msg, path? }] }`, where `path` names the field when there is one.

Registering a movement is the one place where two writes must happen together:

```
POST /api/products/:id/movements
  └─ transaction
        ├─ read the product, locked until the transaction ends
        ├─ exit greater than the stock? → nothing is written, 409
        ├─ add or subtract the quantity from the stock
        └─ save the movement
     any error → both writes are undone, 500
```

The lock makes a second request for the same product wait until the first one finishes, so it always checks the real stock.

Every request goes through the same pipeline:

```
Request
  ├─ express.json        → parses the JSON body (malformed JSON → 400)
  ├─ /api/products       → products router (products and their movements)
  │     ├─ validators            → rules for the body, the id and the pagination
  │     ├─ handleInputErrors     → 400 { errors } if a rule failed
  │     ├─ validateProductExists → 404 if the product does not exist
  │     └─ handler → models (Sequelize) → PostgreSQL
  ├─ /api/movements      → movements router (read only)
  ├─ /docs               → Swagger UI
  ├─ notFound            → 404 for any other route
  └─ handleErrors        → 409 for a repeated code, 500 for anything else
```

When the server starts, it connects to the database and creates the `products` and `movements` tables if they do not exist yet. The movements reference their product with a foreign key set to `ON DELETE RESTRICT`, so the database itself refuses to delete a product with history, even outside the API. The Swagger docs are written as YAML files in `src/docs/`, separate from the routers, so the routes stay readable.

### From a commit to production

```
development folder           GitHub Actions                  production folder (~/apps)
  edit, npm test
  git commit, git push  ──→  npm ci
                             format:check, typecheck
                             npm test  ← PostgreSQL 18 service,
                             npm run build   deleted after the run
                             ✅ green           ──→  git pull, npm ci, npm run build
                                                     pm2 restart inventory-api
```

A change only reaches production through GitHub, and only after the CI passes. The production copy is a separate clone with its own database, port (`4100`) and `.env` with `NODE_ENV=production`, so nothing done in the development folder can break it. SQL queries are logged only when `NODE_ENV=development`, so a forgotten value leaves production quiet instead of noisy.

## Project Structure

```
.github/
└── workflows/
    └── ci.yml                # Format, types, tests against a PostgreSQL service, and build
src/
├── __tests__/
│   ├── docs.test.ts          # The docs are valid OpenAPI, list every route and /docs is served
│   ├── movement.test.ts      # Movement endpoints, the transaction and the lock
│   ├── product.test.ts       # Product endpoints
│   └── server.test.ts        # Unknown routes, malformed JSON, 500 and connectDB, with mocks
├── config/
│   ├── db.ts                 # Sequelize connection, models and the DATABASE_URL check
│   └── swagger.ts            # OpenAPI definition and where to find the docs
├── docs/
│   ├── movements.yaml        # OpenAPI description of the movement routes
│   ├── products.yaml         # OpenAPI description of the product routes
│   └── schemas.yaml          # Schemas and pagination parameters shared by the routes
├── handlers/
│   ├── movement.ts           # Register a movement in a transaction, and the movement lists
│   └── product.ts            # One handler per product endpoint
├── middleware/
│   └── index.ts              # Validation errors, product lookup, 404 and error handler
├── models/
│   ├── Movement.model.ts     # Movements table, belongs to a product
│   └── Product.model.ts      # Products table, has many movements (restrict on delete)
├── routes/
│   ├── movements.router.ts   # Read-only movement routes
│   └── products.router.ts    # Product routes and their nested movement routes
├── types/
│   └── express.d.ts          # Adds req.product to Express's Request type
├── validators/
│   ├── movement.ts           # type, quantity and note rules
│   ├── pagination.ts         # page and limit rules
│   └── product.ts            # Body and id rules
├── index.ts                  # Starts the server
└── server.ts                 # Express app, routers, docs and error handling
```

## What I Learned

- **Repeating a pattern to make it mine.** Building the same kind of API a second time, without copying the course, showed me which parts I really understood and which ones I had only typed. Many choices here are different from the course because I asked why each line was there.
- **Failing fast.** If the database is down, the port is taken or `DATABASE_URL` is missing, the server stops with a clear message and exit code 1, instead of starting broken and failing later on the first request.
- **One error contract.** Every error, from validation to a database crash, answers `{ errors: [{ msg, path? }] }` in JSON. Express 5 forwards async errors to the error handler, so the handlers need no `try/catch`, and a `500` never leaks internal details.
- **Normalizing data before it reaches the database.** A unique column in PostgreSQL is case-sensitive, so the code is trimmed and uppercased in the validator; otherwise `hex-m6` and `HEX-M6` would be two products.
- **Designing with the domain in mind.** In an inventory, stock should change through recorded movements, not by editing a number. So the update ignores it, a new product starts at 0, and a count that does not match is fixed with an adjustment movement. I also learned to skip what I did not need yet, like a `PATCH` route, a soft delete or a more general error mapping.
- **My first relation.** `@ForeignKey` and `@BelongsTo` on the movement, `@HasMany` on the product. The delete rule has to go on `@HasMany`: on `@BelongsTo` alone the foreign key came out as `CASCADE`, and deleting a product silently deleted its history.
- **Transactions and locks.** Updating the stock and saving the movement are two writes that must happen together, so they run in one transaction. That was not enough: without `lock: true`, two simultaneous exits could both read the same stock and leave it negative. And every query inside the transaction needs `{ transaction }`, or the request waits forever for the row it locked itself.
- **409 versus 400.** A badly formed value is a `400`. A valid value that conflicts with the current state, like an exit bigger than the stock or deleting a product with history, is a `409`.
- **Nested and flat routes.** A movement is created under its product (`/api/products/:id/movements`), and it is read either there or on its own (`/api/movements`), where `include` brings the product along.
- **Pagination in Express 5.** `req.query` is read-only in Express 5, so the validated and converted values come from `matchedData`. Every number that comes from the client has an upper limit.
- **Testing against a separate database.** The tests run on a database whose name must end in `_test`, a setup file refuses to run them anywhere else, and each test starts from an empty table so they do not depend on each other.
- **Choosing tools that fit.** `ts-jest` does not support TypeScript 7, so Jest uses `@swc/jest`, which only translates the code; `npm run typecheck` still checks the types of the tests.
- **Mocks.** `jest.spyOn(...).mockRejectedValueOnce(...)` makes the database fail on purpose, to test the `500`, the connection error and the rollback of a movement without stopping PostgreSQL.
- **Proving that a test can fail.** I broke the code on purpose to check each test. Ten simultaneous exits passed even without the lock, because the race depends on timing, so a second test spies on `findByPk` to check that the lock is requested. I also learned that a test without an `expect` always passes.
- **A green CI is not always a tested CI.** Once, a missing `- run: npm test` line left its `env` attached to the type check step: the run was green and no test had run. Since then I read the test step in the log, and I watched the CI fail on purpose in a pull request before trusting it.
- **Production is a different folder, not a different command.** Running production from the development folder means any edit, build or `npm ci` can break it, so it lives in its own clone and only changes with `git pull`. On Windows, `pm2 startup` is not supported, so a script in the Startup folder runs `pm2 resurrect` when the user logs in.
- **Documentation that tells the truth.** OpenAPI in YAML fails silently: a missing colon, a misspelled `$ref` or `schema` instead of `schemas` still let the server start. A test validates the docs with swagger-parser, and every documented status code has a test that proves it.

## Getting Started

Requirements: [Node.js](https://nodejs.org/) 24 and [PostgreSQL](https://www.postgresql.org/) (tested with 18).

1. Clone the repository and install the dependencies:

    ```bash
    git clone https://github.com/TarekM-7/inventory-management-api.git
    cd inventory-management-api
    npm install
    ```

2. Create two PostgreSQL databases: one for development and one for the tests. The test database name must end in `_test`.

    - `iemsa_inventory_management`
    - `iemsa_inventory_management_test`

3. Copy `.env.example` to `.env` and **replace the connection data** with your own. Keep `NODE_ENV=development`, so the SQL queries are logged:

    ```bash
    cp .env.example .env
    ```

4. Create `.env.test` with the same `DATABASE_URL`, pointing to the test database.

5. Start the development server:

    ```bash
    npm run dev
    ```

    You should see `Connected to DB` and `Listening on port 4000`. The API runs on `http://localhost:4000` and its documentation on `http://localhost:4000/docs`.

Other scripts:

```bash
npm test                # Run the tests on the test database
npm run test:coverage   # Same, with a coverage report
npm run typecheck       # Check the types, tests included
npm run format          # Format the project with Prettier
npm run build           # Compile TypeScript to dist/, without the tests
npm start               # Run the compiled build
```

> The tests drop and recreate the tables of the database in `.env.test`. They refuse to run if its name does not end in `_test`, so your development data is safe.

### Running in production

Production runs from its own clone, with its own database and port. The commands are for Git Bash; [PM2](https://pm2.keymetrics.io/) is installed once with `npm install -g pm2`.

1. Create an empty production database, for example `iemsa_inventory_management_prod`.
2. Clone the repository into its own folder and build it:

    ```bash
    mkdir -p ~/apps && cd ~/apps
    git clone https://github.com/TarekM-7/inventory-management-api.git
    cd inventory-management-api
    npm ci
    npm run build
    ```

3. Create its `.env` with the production database, `PORT=4100` and `NODE_ENV=production`.
4. Start it with PM2 from that folder, and save the process list:

    ```bash
    pm2 start dist/index.js --name inventory-api
    pm2 save
    ```

5. To start it again when you log in to Windows, put a `pm2-resurrect.cmd` file with these two lines in the Startup folder (`Win+R` → `shell:startup`):

    ```
    @echo off
    pm2 resurrect
    ```

To update it after a push, once the CI is green:

```bash
cd ~/apps/inventory-management-api && git pull && npm ci && npm run build && pm2 restart inventory-api
```

`&&` stops at the first command that fails, so a failed build never restarts the API. `db.sync()` does not change existing tables, so a change to a model needs a migration before it reaches production.

## Acknowledgements

The REST API pattern comes from the Udemy course linked above. This project applies it to a new domain, and I wrote the implementation while learning.
