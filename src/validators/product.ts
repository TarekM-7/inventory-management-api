import { body, param } from "express-validator"

export const productValidator = [
    body("name")
        .exists()
        .withMessage("Name is required")
        .bail()
        .isString()
        .withMessage("Name must be a string")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("Name cannot be empty")
        .bail()
        .isLength({ max: 100 })
        .withMessage("Name must be up to 100 characters"),
    body("code")
        .exists()
        .withMessage("Code is required")
        .bail()
        .isString()
        .withMessage("Code must be a string")
        .bail()
        .trim()
        .toUpperCase()
        .notEmpty()
        .withMessage("Code cannot be empty")
        .bail()
        .isLength({ max: 100 })
        .withMessage("Code must be up to 100 characters")
]

export const idValidator = [
    param("id").isInt({ min: 1, max: 2147483647 }).withMessage("Invalid ID")
]
