import { RequestHandler } from "express";

export const createProduct: RequestHandler = async (req, res) => {
    res.json({msg: 'From POST Products'})
}