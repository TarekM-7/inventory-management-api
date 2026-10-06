import { Sequelize } from "sequelize-typescript"
import Product from "../models/Product.model"

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is empty or undefined. Add it to the .env file")
}
const db = new Sequelize(process.env.DATABASE_URL, {
    models: [Product]
})

export default db
