import { Router } from "express"
import { paginationValidation } from "../validators/pagination"
import { handleInputErrors } from "../middleware"
import { getMovementById, getMovements } from "../handlers/movement"
import { idValidator } from "../validators/product"

const router = Router()

router.get("/", paginationValidation, handleInputErrors, getMovements)

router.get("/:id", idValidator, handleInputErrors, getMovementById)

export default router
