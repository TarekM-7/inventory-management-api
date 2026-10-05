import 'dotenv/config'
import server, { connectDB } from "./server";

const port = process.env.PORT || 4000

async function startServer() {
    try {
        await connectDB()
        server.listen(port, () => {
            console.log(`Listening on port ${port}`)
        })
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

startServer()


