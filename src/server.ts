import express from 'express'
import productsRouter from './products.router'

const server = express()

server.use('/api/products', productsRouter)

export default server