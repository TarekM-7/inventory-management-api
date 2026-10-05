import { Router } from "express";

const router = Router()

router.get('/', (req, res) => {
    res.json({msg: 'From Get Products'})
})

export default router