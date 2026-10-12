import { RequestHandler } from "express"
import db from "../config/db"
import Product from "../models/Product.model"
import Movement from "../models/Movement.model"

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
