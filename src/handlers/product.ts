import { RequestHandler } from "express";
import Product from "../models/Product.model";

export const createProduct: RequestHandler = async (req, res) => {
    const { name, code, stock } = req.body
    const product = await Product.create({ name, code, stock  })
    res.status(201).json({
        data: product
    })
}