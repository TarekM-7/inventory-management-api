"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.addIndex("movements", ["productId"], {
            name: "movements_product_id"
        })
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("movements", "movements_product_id")
    }
}
