import request from "supertest"
import server from "../server"
import db from "../config/db"

beforeAll(async () => {
    await db.sync({ force: true })
})

describe("POST /api/products", () => {
    it("creates a product and returns 201", async () => {
        const res = await request(server)
            .post("/api/products")
            .send({ name: "Tornillo hexagonal M6", code: "HEX-M6X20-INOX", stock: 500 })

        expect(res.status).toBe(201)
        expect(res.body.data).toHaveProperty("id")
    })
})

afterAll(async () => {
    await db.close()
})
