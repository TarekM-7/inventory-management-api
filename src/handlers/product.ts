import { RequestHandler } from "express";
import Product from "../models/Product.model";

export const getProducts: RequestHandler = async (req, res) => {
    const products = await Product.findAll({
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
    })
    res.json({
        data: products
    })
}

export const createProduct: RequestHandler = async (req, res) => {
    const { name, code, stock } = req.body
    const product = await Product.create({ name, code, stock  })
    res.status(201).json({
        data: product
    })
}