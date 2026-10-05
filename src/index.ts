import 'dotenv/config'
import server, { connectDB } from "./server";
import colors from 'colors';

const port = process.env.PORT || 4000

async function startServer() {
    try {
        await connectDB()
        server.listen(port, (error) => {
            if (error){
                console.log(colors.bgRed.bold(`Couldn't start the server on port ${port}`))
                console.error(error)
                process.exit(1)
            }
            console.log(colors.bgGreen.bold(`Listening on port ${port}`))
        })
    } catch (error) {
        console.log(colors.bgRed.bold('Failed to start the server'))
        console.error(error)
        process.exit(1)
    }
}

startServer()


