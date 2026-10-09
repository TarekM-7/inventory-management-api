import request from "supertest"
import db from "../config/db"
import server, { connectDB } from "../server"
import Product from "../models/Product.model"
import { UniqueConstraintError } from "sequelize"

afterAll(async () => {
    await db.close()
})

describe("server", () => {
    it("returns 404 in JSON for an unknown route", async () => {
        const res = await request(server).get("/api/prodcut")

        expect(res.status).toBe(404)
        expect(res.body.errors).toEqual([{ msg: "Route not found" }])
    })

    it("returns 400 in JSON for a malformed body", async () => {
        const res = await request(server)
            .post("/api/products")
            .set("Content-Type", "application/json")
            .send('{"name":')

        expect(res.status).toBe(400)
        expect(res.headers["content-type"]).toMatch(/json/)
    })

    it("returns 500 without details when the database fails", async () => {
        jest.spyOn(Product, "findAndCountAll").mockRejectedValueOnce(new Error("DB down"))
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})

        const res = await request(server).get("/api/products")

        expect(res.status).toBe(500)
        expect(res.body.errors).toEqual([{ msg: "Internal server error" }])
        expect(consoleError).toHaveBeenCalled()
        consoleError.mockRestore()
    })
})

describe("connectDB", () => {
    it("throws when the database is not reachable", async () => {
        jest.spyOn(db, "authenticate").mockRejectedValueOnce(new Error("DB down"))

        await expect(connectDB()).rejects.toThrow("DB down")
    })
})

describe("handleErrors", () => {
    it("returns a generic 409 for an unknown unique constraint", async () => {
        jest.spyOn(Product, "create").mockRejectedValueOnce(
            new UniqueConstraintError({
                parent: Object.assign(new Error(), { constraint: "unknown_key", sql: "" })
            })
        )

        const res = await request(server)
            .post("/api/products")
            .send({ name: "Tornillo", code: "T-1" })

        expect(res.status).toBe(409)
        expect(res.body.errors).toEqual([{ msg: "Value already exists" }])
    })
})
