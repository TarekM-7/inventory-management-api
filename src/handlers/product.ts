import { RequestHandler } from "express"
import Product from "../models/Product.model"
import { matchedData } from "express-validator"

export const getProducts: RequestHandler = async (req, res) => {
    const { page = 1, limit = 20 } = matchedData(req)
    const offset = (page - 1) * limit

    const { count, rows } = await Product.findAndCountAll({
        order: [
            ["createdAt", "DESC"],
            ["id", "DESC"]
        ],
        limit,
        offset
    })
    res.json({
        data: rows,
        meta: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    })
}

export const getProductById: RequestHandler<{ id: string }> = async (req, res) => {
    res.json({ data: req.product })
}

export const createProduct: RequestHandler = async (req, res) => {
    const { name, code, stock } = req.body
    const product = await Product.create({ name, code, stock })
    res.status(201).json({
        data: product
    })
}

export const updateProduct: RequestHandler<{ id: string }> = async (req, res) => {
    const { name, code } = req.body
    await req.product!.update({ name, code })
    res.json({ data: req.product })
}

export const deleteProduct: RequestHandler<{ id: string }> = async (req, res) => {
    await req.product!.destroy()
    res.status(204).end()
}
