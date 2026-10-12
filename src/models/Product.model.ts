import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript"
import Movement from "./Movement.model"

@Table({
    tableName: "products"
})
class Product extends Model {
    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    declare name: string

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
        unique: true
    })
    declare code: string

    @Column({
        type: DataType.INTEGER(),
        allowNull: false,
        defaultValue: 0
    })
    declare stock: number

    @HasMany(() => Movement, { onDelete: "RESTRICT" })
    declare movements: Movement[]
}

export default Product
