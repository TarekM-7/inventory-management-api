import request from "supertest"
import server from "../server"
import db from "../config/db"
import SwaggerParser from "@apidevtools/swagger-parser"
import swaggerSpec from "../config/swagger"

afterAll(async () => {
    await db.close()
})

describe("API docs", () => {
    it("is a valid OpenAPI document", async () => {
        const docs = await SwaggerParser.validate(JSON.parse(JSON.stringify(swaggerSpec)))

        expect(docs.info.title).toBe("Inventory Management API")
    })

    it("documents every route", async () => {
        const docs = await SwaggerParser.validate(JSON.parse(JSON.stringify(swaggerSpec)))

        expect(Object.keys(docs.paths ?? {})).toEqual(["/api/products", "/api/products/{id}"])
    })

    it("serves the docs page at /docs", async () => {
        const res = await request(server).get("/docs/")

        expect(res.status).toBe(200)
        expect(res.text).toContain("Swagger UI")
    })
})
