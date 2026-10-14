"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("products", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            code: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true
            },
            stock: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        })

        await queryInterface.createTable("movements", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            productId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "products", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT"
            },
            type: {
                type: Sequelize.ENUM("in", "out"),
                allowNull: false
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            note: {
                type: Sequelize.STRING(255)
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("movements")
        await queryInterface.dropTable("products")
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_movements_type"')
    }
}
