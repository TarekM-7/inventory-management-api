import express from 'express'
import productsRouter from './products.router'
import db from './config/db'

export async function connectDB() {
    await db.authenticate()
    await db.sync()
    console.log('Connected to DB')
}

const server = express()

server.use('/api/products', productsRouter)

export default server