import { Router } from "express"
import {
    createProduct,
    deleteProduct,
    getProductById,
    getProducts,
    updateProduct
} from "./handlers/product"
import { idValidator, productValidator } from "./validators/product"
import { handleInputErrors, validateProductExists } from "./middleware"
import { paginationValidation } from "./validators/pagination"
import { movementValidator } from "./validators/movement"
import { createMovement, getProductMovements } from "./handlers/movement"

const router = Router()

router.get("/", paginationValidation, handleInputErrors, getProducts)

router.get("/:id", idValidator, handleInputErrors, validateProductExists, getProductById)

router.post("/", productValidator, handleInputErrors, createProduct)

router.put(
    "/:id",
    idValidator,
    productValidator,
    handleInputErrors,
    validateProductExists,
    updateProduct
)

router.delete("/:id", idValidator, handleInputErrors, validateProductExists, deleteProduct)

router.post(
    "/:id/movements",
    idValidator,
    movementValidator,
    handleInputErrors,
    validateProductExists,
    createMovement
)

router.get(
    "/:id/movements",
    idValidator,
    paginationValidation,
    handleInputErrors,
    validateProductExists,
    getProductMovements
)

export default router
