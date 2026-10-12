import { RequestHandler } from "express"
import db from "../config/db"
import Product from "../models/Product.model"
import Movement from "../models/Movement.model"
import { matchedData } from "express-validator"

export const createMovement: RequestHandler<{ id: string }> = async (req, res) => {
    const { type, quantity, note } = req.body

    const movement = await db.transaction(async (transaction) => {
        const product = await Product.findByPk(req.params.id, { transaction, lock: true })

        if (type === "out" && quantity > product!.stock) {
            return null
        }

        await product!.increment("stock", {
            by: type === "in" ? quantity : -quantity,
            transaction
        })
        return Movement.create({ productId: product!.id, type, quantity, note }, { transaction })
    })

    if (!movement) {
        return res.status(409).json({ errors: [{ msg: "Not enough stock", path: "quantity" }] })
    }

    res.status(201).json({ data: movement })
}

export const getProductMovements: RequestHandler<{ id: string }> = async (req, res) => {
    const { page = 1, limit = 20 } = matchedData(req)
    const offset = (page - 1) * limit

    const { count, rows } = await Movement.findAndCountAll({
        where: { productId: req.product!.id },
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

export const getMovements: RequestHandler = async (req, res) => {
    const { page = 1, limit = 20 } = matchedData(req)
    const offset = (page - 1) * limit

    const { count, rows } = await Movement.findAndCountAll({
        include: [{ model: Product, attributes: ["id", "name", "code"] }],
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

export const getMovementById: RequestHandler<{ id: string }> = async (req, res) => {
    const movement = await Movement.findByPk(req.params.id, {
        include: [{ model: Product, attributes: ["id", "name", "code"] }]
    })
    if (!movement) {
        return res.status(404).json({ errors: [{ msg: "Movement not found" }] })
    }

    res.json({ data: movement })
}
