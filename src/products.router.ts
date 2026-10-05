import { Router } from "express";

const router = Router()

router.get('/', (req, res) => {
    res.json({msg: 'From GET Products'})
})

router.post('/', (req, res) => {
    res.json({msg: 'From POST Products'})
})

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