import express from "express"
import productsRouter from "./routes/products.router"
import movementsRouter from "./routes/movements.router"
import db from "./config/db"
import { handleErrors, notFound } from "./middleware"
import colors from "colors"
import swaggerUi from "swagger-ui-express"
import swaggerSpec from "./config/swagger"

export async function connectDB() {
    await db.authenticate()
    console.log(colors.bgGreen.bold("Connected to DB"))
}

const server = express()

server.use(express.json())

server.use("/api/products", productsRouter)
server.use("/api/movements", movementsRouter)
server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

server.use(notFound)
server.use(handleErrors)

export default server
