import request from "supertest"
import server from "../server"
import db from "../config/db"
import Product from "../models/Product.model"

beforeAll(async () => {
    await db.sync({ force: true })
})

beforeEach(async () => {
    await Product.truncate({ restartIdentity: true })
})

afterAll(async () => {
    await db.close()
})

const validProduct = { name: "Tornillo hexagonal M6", code: "HEX-M6X20-INOX", stock: 500 }

describe("POST /api/products", () => {
    it("creates a product and returns 201", async () => {
        const res = await request(server)
            .post("/api/products")
            .send({ name: "Tornillo hexagonal M6", code: "HEX-M6X20-INOX", stock: 500 })

        expect(res.status).toBe(201)
        expect(res.body.data).toHaveProperty("id")
    })

    it("returns 400 with every error when the body is empty", async () => {
        const res = await request(server).post("/api/products").send({})

        expect(res.status).toBe(400)
        expect(res.body.errors).toEqual([
            { msg: "Name is required", path: "name" },
            { msg: "Code is required", path: "code" }
        ])
    })

    it("rejects a name that is not a string", async () => {
        const res = await request(server)
            .post("/api/products")
            .send({ ...validProduct, name: 123 })

        expect(res.status).toBe(400)
        expect(res.body.errors[0].path).toBe("name")
    })

    it("rejects a negative stock", async () => {
        const res = await request(server)
            .post("/api/products")
            .send({ ...validProduct, stock: -5 })

        expect(res.status).toBe(400)
        expect(res.body.errors[0].path).toBe("stock")
    })

    it("defaults stock to 0", async () => {
        const res = await request(server)
            .post("/api/products")
            .send({ name: "Tornillo", code: "T-1" })

        expect(res.body.data.stock).toBe(0)
    })

    it("trims and uppercases the code", async () => {
        const res = await request(server)
            .post("/api/products")
            .send({ ...validProduct, code: " hex-m6x20-inox " })

        expect(res.body.data.code).toBe("HEX-M6X20-INOX")
    })

    it("returns 409 when the code already exists, ignoring case", async () => {
        await request(server).post("/api/products").send(validProduct)
        const res = await request(server)
            .post("/api/products")
            .send({ ...validProduct, code: "hex-m6x20-inox" })

        expect(res.status).toBe(409)
        expect(res.body.errors).toEqual([{ msg: "Code already exists", path: "code" }])
    })

    it("ignores fields it does not accept", async () => {
        const res = await request(server)
            .post("/api/products")
            .send({ ...validProduct, id: 500, createdAt: "2001-01-01" })

        expect(res.body.data.id).toBe(1)
        expect(res.body.data.createdAt).not.toContain("2001")
    })
})
