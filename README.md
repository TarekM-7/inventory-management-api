# Inventory Management API – Node.js, Express, TypeScript and PostgreSQL

A REST API to manage a screw inventory, built with **Node.js**, **Express 5** and **TypeScript**. It stores the products in **PostgreSQL** through **Sequelize**, validates every request, answers every error in JSON, documents itself with **Swagger**, and is covered by integration tests written with **Jest** and **Supertest**.

This is a practice project I built after the REST API section of the Udemy course [React de Principiante a Experto](https://www.udemy.com/course/react-de-principiante-a-experto-creando-mas-de-10-aplicaciones/). It repeats the pattern of the course's product API with a different domain, the screws stock at a manufacturing plant, so I could build an API on my own and question each decision instead of copying it.

## Features

- Full CRUD for products: list, get one, create, update and delete.
- Paginated list, newest first, with `page` and `limit` (up to 100 per page) and a `meta` object with the totals.
- Every request is validated. Invalid input gets a `400` with one error per field.
- Product codes are unique and saved trimmed and in uppercase, so `hex-m6` and `HEX-M6` are the same product. A repeated code gets a `409`.
- The update changes the name and the code, never the stock: the stock is meant to change only through stock movements.
- Every response is JSON, errors included: `404` for a missing product or route, `500` without internal details.
- The server refuses to start without a database or a `DATABASE_URL`, with a clear message.
- Interactive API documentation with Swagger UI at `/docs`.
- 30 integration tests that cover every endpoint, every documented status code and the docs themselves, on a separate test database.

## Tech Stack

- [Node.js](https://nodejs.org/) and [Express 5](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/) 7
- [PostgreSQL](https://www.postgresql.org/) with [Sequelize](https://sequelize.org/) and [sequelize-typescript](https://github.com/sequelize/sequelize-typescript)
- [express-validator](https://express-validator.github.io/) for request validation
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) and [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) for the OpenAPI docs
- [dotenv](https://github.com/motdotla/dotenv) and [colors](https://github.com/Marak/colors.js)
- [Jest](https://jestjs.io/), [@swc/jest](https://swc.rs/docs/usage/jest) and [Supertest](https://github.com/ladjs/supertest) for testing, and [swagger-parser](https://apitools.dev/swagger-parser/) to validate the docs
- [tsx](https://tsx.is/) to run TypeScript in development, and [Prettier](https://prettier.io/) for formatting

## How It Works

| Method   | Route               | What it does                                                 | Success |
| -------- | ------------------- | ------------------------------------------------------------ | ------- |
| `GET`    | `/api/products`     | List products, newest first, with `page` and `limit`         | `200`   |
| `GET`    | `/api/products/:id` | Get one product                                              | `200`   |
| `POST`   | `/api/products`     | Create a product from `name`, `code` and an optional `stock` | `201`   |
| `PUT`    | `/api/products/:id` | Update `name` and `code`                                     | `200`   |
| `DELETE` | `/api/products/:id` | Delete a product                                             | `204`   |

Successful responses are wrapped in `{ data }`, and the list adds `{ meta: { page, limit, total, totalPages } }`. Every error, whatever its status, comes back as `{ errors: [{ msg, path? }] }`, where `path` names the field when there is one.

Every request goes through the same pipeline:

```
Request
  ├─ express.json        → parses the JSON body (malformed JSON → 400)
  ├─ /api/products       → router
  │     ├─ validators            → rules for the body, the id and the pagination
  │     ├─ handleInputErrors     → 400 { errors } if a rule failed
  │     ├─ validateProductExists → 404 if the id does not exist
  │     └─ handler → Product model (Sequelize) → PostgreSQL
  ├─ /docs               → Swagger UI
  ├─ notFound            → 404 for any other route
  └─ handleErrors        → 409 for a repeated code, 500 for anything else
```

When the server starts, it connects to the database and creates the `products` table if it does not exist yet. The Swagger docs are written as YAML files in `src/docs/`, separate from the router, so the routes stay readable.

## Project Structure

```
src/
├── __tests__/
│   ├── docs.test.ts          # The docs are valid OpenAPI and /docs is served
│   ├── product.test.ts       # Integration tests for every endpoint
│   └── server.test.ts        # Unknown routes, malformed JSON, 500 and connectDB, with mocks
├── config/
│   ├── db.ts                 # Sequelize connection, models and the DATABASE_URL check
│   └── swagger.ts            # OpenAPI definition and where to find the docs
├── docs/
│   ├── products.yaml         # OpenAPI description of every route
│   └── schemas.yaml          # Product, ProductInput and error schemas
├── handlers/
│   └── product.ts            # One handler per endpoint
├── middleware/
│   └── index.ts              # Validation errors, product lookup, 404 and error handler
├── models/
│   └── Product.model.ts      # Products table defined with decorators
├── types/
│   └── express.d.ts          # Adds req.product to Express's Request type
├── validators/
│   ├── pagination.ts         # page and limit rules
│   └── product.ts            # Body and id rules
├── index.ts                  # Starts the server
├── products.router.ts        # Routes and their middleware
└── server.ts                 # Express app, routes, docs and error handling
```

## What I Learned

- **Repeating a pattern to make it mine.** Building the same kind of API a second time, without copying the course, showed me which parts I really understood and which ones I had only typed. Many choices here are different from the course because I asked why each line was there.
- **Failing fast.** If the database is down, the port is taken or `DATABASE_URL` is missing, the server stops with a clear message and exit code 1, instead of starting broken and failing later on the first request.
- **One error contract.** Every error, from validation to a database crash, answers `{ errors: [{ msg, path? }] }` in JSON. Express 5 forwards async errors to the error handler, so the handlers need no `try/catch`, and a `500` never leaks internal details.
- **Normalizing data before it reaches the database.** A unique column in PostgreSQL is case-sensitive, so the code is trimmed and uppercased in the validator; otherwise `hex-m6` and `HEX-M6` would be two products.
- **Designing with the domain in mind.** In an inventory, stock should change through recorded movements, not by editing a number, so the update ignores it. I also learned to skip what I did not need yet, like a `PATCH` route or a more general error mapping.
- **Pagination in Express 5.** `req.query` is read-only in Express 5, so the validated and converted values come from `matchedData`. Every number that comes from the client has an upper limit.
- **Testing against a separate database.** The tests run on a database whose name must end in `_test`, a setup file refuses to run them anywhere else, and each test starts from an empty table so they do not depend on each other.
- **Choosing tools that fit.** `ts-jest` does not support TypeScript 7, so Jest uses `@swc/jest`, which only translates the code; `npm run typecheck` still checks the types of the tests.
- **Mocks.** `jest.spyOn(...).mockRejectedValueOnce(...)` makes the database fail on purpose, to test the `500` and the connection error without stopping PostgreSQL.
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

3. Copy `.env.example` to `.env` and **replace every value** with your own connection data:

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

## Acknowledgements

The REST API pattern comes from the Udemy course linked above. This project applies it to a new domain, and I wrote the implementation while learning.
