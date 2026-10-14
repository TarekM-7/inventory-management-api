import { Table, Column, DataType, Model, ForeignKey, BelongsTo } from "sequelize-typescript"
import Product from "./Product.model"

@Table({
    tableName: "movements",
    indexes: [{ name: "movements_product_id", fields: ["productId"] }]
})
class Movement extends Model {
    @ForeignKey(() => Product)
    @Column({
        type: DataType.INTEGER(),
        allowNull: false
    })
    declare productId: number

    @Column({
        type: DataType.ENUM("in", "out"),
        allowNull: false
    })
    declare type: "in" | "out"

    @Column({
        type: DataType.INTEGER(),
        allowNull: false
    })
    declare quantity: number

    @Column({
        type: DataType.STRING(255)
    })
    declare note: string | null

    @BelongsTo(() => Product)
    declare product: Product
}

export default Movement
