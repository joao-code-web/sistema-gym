import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

const connect = async () => {
    try {
        await mongoose.connect(MONGODB_URL!, {
            dbName: "sistema-gym",
            bufferCommands: false
        });

        mongoose.connection.on("connected", () => {
            console.log("Conectado ao MongoDB");
        });

        mongoose.connection.on("error", (err) => {
            console.error("Erro de conexão com o MongoDB:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("Desconectado do MongoDB");
        });
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
    }
}

export default connect;
