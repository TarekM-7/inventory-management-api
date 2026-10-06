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

export default router
