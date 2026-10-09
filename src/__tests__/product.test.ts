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

describe("GET /api/products", () => {
    it("returns an empty list with its meta", async () => {
        const res = await request(server).get("/api/products")

        expect(res.status).toBe(200)
        expect(res.body).toEqual({
            data: [],
            meta: { page: 1, limit: 20, total: 0, totalPages: 0 }
        })
    })

    it("returns the newest products first", async () => {
        for (const code of ["A-1", "A-2", "A-3"]) {
            await request(server).post("/api/products").send({ name: "Tornillo", code })
        }

        const res = await request(server).get("/api/products")

        expect(res.body.data.map((p: { code: string }) => p.code)).toEqual(["A-3", "A-2", "A-1"])
    })

    it("paginates with page and limit", async () => {
        for (let i = 1; i <= 5; i++) {
            await request(server)
                .post("/api/products")
                .send({ name: "Tornillo", code: `P-${i}` })
        }

        const res = await request(server).get("/api/products?page=2&limit=2")

        expect(res.body.data).toHaveLength(2)
        expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 })
    })

    it("returns 400 for an invalid page", async () => {
        const res = await request(server).get("/api/products?page=0")

        expect(res.status).toBe(400)
        expect(res.body.errors[0].path).toBe("page")
    })
})

describe("GET /api/products/:id", () => {
    it("returns the product", async () => {
        await request(server).post("/api/products").send(validProduct)

        const res = await request(server).get("/api/products/1")

        expect(res.status).toBe(200)
        expect(res.body.data.code).toBe("HEX-M6X20-INOX")
    })

    it("returns 404 when it does not exist", async () => {
        const res = await request(server).get("/api/products/999")

        expect(res.status).toBe(404)
        expect(res.body.errors).toEqual([{ msg: "Product not found" }])
    })

    it("returns 400 for an invalid id", async () => {
        const res = await request(server).get("/api/products/abc")

        expect(res.status).toBe(400)
        expect(res.body.errors).toEqual([{ msg: "Invalid ID", path: "id" }])
    })
})
