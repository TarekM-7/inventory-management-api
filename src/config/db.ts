import { Sequelize } from "sequelize-typescript";
import Product from "../models/Product.model";

const db = new Sequelize(process.env.DATABASE_URL!,{
    models: [Product]
})

export default db