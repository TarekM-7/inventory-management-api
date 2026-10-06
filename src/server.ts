import express from 'express'
import productsRouter from './products.router'
import db from './config/db'
import colors from 'colors'

export async function connectDB() {
    await db.authenticate()
    await db.sync()
    console.log(colors.bgGreen.bold('Connected to DB'))
}

const server = express()

server.use(express.json())
server.use('/api/products', productsRouter)

export default server