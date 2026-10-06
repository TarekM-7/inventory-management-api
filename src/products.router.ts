import { Router } from "express";
import { createProduct } from "./handlers/product";

const router = Router()

router.get('/', (req, res) => {
    res.json({msg: 'From GET Products'})
})

router.post('/', 
    createProduct
)

router.put('/', (req, res) => {
    res.json({msg: 'From PUT Products'})
})

router.patch('/', (req, res) => {
    res.json({msg: 'From PATCH Products'})
})

router.delete('/', (req, res) => {
    res.json({msg: 'From DELETE Products'})
})

export default router