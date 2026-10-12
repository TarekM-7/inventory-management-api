import { body } from "express-validator"

export const movementValidator = [
    body("type")
        .exists()
        .withMessage("Type is required")
        .bail()
        .isIn(["in", "out"])
        .withMessage("Type must be in or out"),
    body("quantity")
        .exists()
        .withMessage("Quantity is required")
        .bail()
        .isInt({ min: 1, max: 999999 })
        .withMessage("Quantity must be a whole number from 1 to 999,999")
        .toInt(),
    body("note")
        .optional()
        .isString()
        .withMessage("Note must be a string")
        .bail()
        .trim()
        .isLength({ max: 255 })
        .withMessage("Note must be up to 255 characters")
]
