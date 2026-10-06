import { ErrorRequestHandler, RequestHandler } from "express";
import { validationResult } from "express-validator";
import { UniqueConstraintError } from "sequelize";

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

    if(err instanceof UniqueConstraintError){
        return res.status(409).json({ errors: [{ msg: 'Code already exists', path: 'code' }] })
    }

    const status = err.status || 500
    const message = status === 500 ? 'Internal server error' : err.message

    res.status(status).json({ errors: [{ msg: message }] })
}

export const notFound: RequestHandler = (req, res) => {
    res.status(404).json({ errors: [{ msg: 'Route not found' }] })
}