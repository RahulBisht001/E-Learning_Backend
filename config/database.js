import mongoose from "mongoose"

export const connectDB = async () => {

    try {

        const { connection } = await mongoose
            .connect(process.env.MONGO_URI, {})

        console.log(`MongoDB Connected Successfully: ${connection.host}`)

    } catch (err) {

        console.log("Data Base Connectivity Error hai Bhai")
        console.log(err)
        process.exit()
    }
}