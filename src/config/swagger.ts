import swaggerJSDoc from "swagger-jsdoc"

const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Inventory Management API",
            version: "1.0.0",
            description: "REST API to manage a screw inventory"
        }
    },
    apis: ["./src/docs/*.yaml"]
})

export default swaggerSpec
