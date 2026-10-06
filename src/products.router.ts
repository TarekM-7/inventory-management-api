import { Router } from "express";
import { createProduct, getProductById, getProducts, updateProduct } from "./handlers/product";
import { idValidator, productValidator } from "./validators/product";
import { handleInputErrors, validateProductExists } from "./middleware";

const router = Router()

router.get('/', 
    getProducts
)

router.get('/:id',
    idValidator,
    handleInputErrors,
    validateProductExists,
    getProductById
)

router.post('/',
    productValidator,
    handleInputErrors,
    createProduct
)

router.put('/:id', 
    idValidator,
    productValidator,
    handleInputErrors,
    validateProductExists,
    updateProduct
)

router.delete('/', (req, res) => {
    res.json({msg: 'From DELETE Products'})
})

export default router