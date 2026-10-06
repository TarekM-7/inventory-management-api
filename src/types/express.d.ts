import Product from "../models/Product.model"

declare global {
    namespace Express {
        interface Request {
            product?: Product
        }
    }
}
