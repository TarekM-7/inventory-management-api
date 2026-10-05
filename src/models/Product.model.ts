import { Table, Column, Model, DataType } from 'sequelize-typescript'

@Table({
    tableName: 'products'
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
}

export default Product