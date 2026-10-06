import { query } from "express-validator";

export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1, max: 1000000 }).withMessage('Page must be an integer from 1 to 1,000,000')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt()
]