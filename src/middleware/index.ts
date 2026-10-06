import { ErrorRequestHandler, RequestHandler } from "express";
import { validationResult } from "express-validator";

export const handleInputErrors: RequestHandler = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        })
    }
    next()
} 

export const handleErrors: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err)

    const status = err.status || 500
    const message = status === 500 ? 'Internal server error' : err.message

    res.status(status).json({ errors: [{ msg: message }] })
}

export const notFound: RequestHandler = (req, res) => {
    res.status(404).json({ errors: [{ msg: 'Route not found' }] })
}