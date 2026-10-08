import dotenv from "dotenv"

dotenv.config({ path: ".env.test", quiet: true })

if (!process.env.DATABASE_URL?.endsWith("_test")) {
    throw new Error(
        "Tests must use a test database. Create .env.test with a DATABASE_URL ending in _test"
    )
}
