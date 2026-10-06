import { body, param } from "express-validator"

export const productValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name cannot be empty")
        .bail()
        .isLength({ max: 100 })
        .withMessage("Name must be up to 100 characters"),
    body("code")
        .trim()
        .toUpperCase()
        .notEmpty()
        .withMessage("Code cannot be empty")
        .bail()
        .isLength({ max: 100 })
        .withMessage("Code must be up to 100 characters"),
    body("stock")
        .optional()
        .isInt({ min: 0, max: 999999 })
        .withMessage("Stock must be a whole number from 0 to 999,999")
]

export const idValidator = [
    param("id").isInt({ min: 1, max: 2147483647 }).withMessage("Invalid ID")
]
