import request from "supertest"
import db from "../config/db"
import Product from "../models/Product.model"
import server from "../server"
import Movement from "../models/Movement.model"

beforeAll(async () => {
    await db.sync({ force: true })
})

beforeEach(async () => {
    await Product.truncate({ cascade: true, restartIdentity: true })
})

afterAll(async () => {
    await db.close()
})

const createProduct = (stock = 0) => Product.create({ name: "Tornillo", code: "T-1", stock })

const getStock = async () => (await Product.findByPk(1))!.stock

describe("POST /api/products/:id/movements", () => {
    it("adds an entry to the stock", async () => {
        await createProduct()

        const res = await request(server)
            .post("/api/products/1/movements")
            .send({ type: "in", quantity: 500 })

        expect(res.status).toBe(201)
        expect(res.body.data).toMatchObject({ productId: 1, type: "in", quantity: 500 })
        expect(await getStock()).toBe(500)
    })

    it("subtracts an exit from the stock", async () => {
        await createProduct(500)

        const res = await request(server)
            .post("/api/products/1/movements")
            .send({ type: "out", quantity: 80 })

        expect(res.status).toBe(201)
        expect(await getStock()).toBe(421)
    })

    it("allows taking out exactly the stock", async () => {
        await createProduct(50)

        const res = await request(server)
            .post("/api/products/1/movements")
            .send({ type: "out", quantity: 50 })

        expect(res.status).toBe(201)
        expect(await getStock()).toBe(0)
    })

    it("returns 409 when an exit is greater than the stock", async () => {
        await createProduct(50)

        const res = await request(server)
            .post("/api/products/1/movements")
            .send({ type: "out", quantity: 80 })

        expect(res.status).toBe(409)
        expect(res.body.errors).toEqual([{ msg: "Not enough stock", path: "quantity" }])
        expect(await getStock()).toBe(50)
        expect(await Movement.count()).toBe(0)
    })

    it("returns 400 with every error when the body is empty", async () => {
        await createProduct()

        const res = await request(server).post("/api/products/1/movements").send({})

        expect(res.status).toBe(400)
        expect(res.body.errors).toEqual([
            { msg: "Type is required", path: "type" },
            { msg: "Quantity is required", path: "quantity" }
        ])
    })

    it("rejects a type that is not in or out", async () => {
        await createProduct()

        const res = await request(server)
            .post("/api/products/1/movements")
            .send({ type: "x", quantity: 5 })

        expect(res.status).toBe(400)
        expect(res.body.errors[0].path).toBe("type")
    })

    it("rejects a quantity that is not a positive whole number", async () => {
        await createProduct()

        for (const quantity of [0, -5, 1.5]) {
            const res = await request(server)
                .post("/api/products/1/movements")
                .send({ type: "in", quantity })

            expect(res.status).toBe(400)
            expect(res.body.errors[0].path).toBe("quantity")
        }
    })

    it("trims the note", async () => {
        await createProduct()

        const res = await request(server)
            .post("/api/products/1/movements")
            .send({ type: "in", quantity: 5, note: "  Inventario inicial  " })

        expect(res.body.data.note).toBe("Inventario inicial")
    })

    it("returns 404 when the product does not exist", async () => {
        const res = await request(server)
            .post("/api/products/999/movements")
            .send({ type: "in", quantity: 5 })

        expect(res.status).toBe(404)
        expect(res.body.errors).toEqual([{ msg: "Product not found" }])
    })

    it("never leaves a negative stock with simultaneous exits", async () => {
        await createProduct(50)

        const responses = await Promise.all(
            Array.from({ length: 10 }, () =>
                request(server)
                    .post("/api/products/1/movements")
                    .send({ type: "out", quantity: 10 })
            )
        )
        const statuses = responses.map((res) => res.status)

        expect(statuses.filter((status) => status === 201)).toHaveLength(5)
        expect(statuses.filter((status) => status === 409)).toHaveLength(5)
        expect(await getStock()).toBe(0)
        expect(await Movement.count()).toBe(5)
    })

    it("locks the product while it checks the stock", async () => {
        await createProduct(50)
        const findByPk = jest.spyOn(Product, "findByPk")

        await request(server).post("/api/products/1/movements").send({ type: "out", quantity: 10 })

        expect(findByPk).toHaveBeenCalledWith("1", expect.objectContaining({ lock: true }))
        findByPk.mockRestore()
    })

    it("undoes the stock change when saving the movement fails", async () => {
        await createProduct(500)
        jest.spyOn(Movement, "create").mockRejectedValueOnce(new Error("DB down"))
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})

        const res = await request(server)
            .post("/api/products/1/movements")
            .send({ type: "out", quantity: 80 })

        expect(res.status).toBe(500)
        expect(await getStock()).toBe(500)
        consoleError.mockRestore()
    })
})

describe("GET /api/products/:id/movements", () => {
    it("returns the product's movements, newest first", async () => {
        await createProduct()
        await request(server).post("/api/products/1/movements").send({ type: "in", quantity: 500 })
        await request(server).post("/api/products/1/movements").send({ type: "out", quantity: 80 })

        const res = await request(server).get("/api/products/1/movements")

        expect(res.status).toBe(200)
        expect(res.body.data.map((m: { quantity: number }) => m.quantity)).toEqual([80, 500])
        expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 })
    })

    it("does not include other products' movements", async () => {
        await createProduct()
        await Product.create({ name: "Otro", code: "T-2" })
        await request(server).post("/api/products/2/movements").send({ type: "in", quantity: 5 })

        const res = await request(server).get("/api/products/1/movements")

        expect(res.body.data).toEqual([])
    })

    it("returns 404 when the product does not exist", async () => {
        const res = await request(server).get("/api/products/999/movements")

        expect(res.status).toBe(404)
    })
})

describe("GET /api/movements", () => {
    it("returns every movement with its product", async () => {
        await createProduct()
        await request(server).post("/api/products/1/movements").send({ type: "in", quantity: 5 })

        const res = await request(server).get("/api/movements")

        expect(res.status).toBe(200)
        expect(res.body.data[0].product).toEqual({ id: 1, name: "Tornillo", code: "T-1" })
        expect(res.body.meta.total).toBe(1)
    })

    it("returns 400 for an invalid limit", async () => {
        const res = await request(server).get("/api/movements?limit=500")

        expect(res.status).toBe(400)
        expect(res.body.errors[0].path).toBe("limit")
    })
})

describe("GET /api/movements/:id", () => {
    it("returns the movement with its product", async () => {
        await createProduct()
        await request(server).post("/api/products/1/movements").send({ type: "in", quantity: 5 })

        const res = await request(server).get("/api/movements/1")

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({ id: 1, quantity: 5, product: { code: "T-1" } })
    })

    it("returns 404 when it does not exist", async () => {
        const res = await request(server).get("/api/movements/999")

        expect(res.status).toBe(404)
        expect(res.body.errors).toEqual([{ msg: "Movement not found" }])
    })

    it("returns 400 for an invalid id", async () => {
        const res = await request(server).get("/api/movements/abc")

        expect(res.status).toBe(400)
        expect(res.body.errors).toEqual([{ msg: "Invalid ID", path: "id" }])
    })
})
