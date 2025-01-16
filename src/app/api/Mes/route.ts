import MesesModel from "../../../../lib/modals/Mes";
import connect from "../../../../lib/db";
import { NextResponse } from "next/server";

// Função para criar a resposta com status
const createResponse = (message: string, status: number, data?: unknown) => {
    return NextResponse.json({ message, data }, { status });
}

export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const mesId = searchParams.get("id");

        await connect();

        if (mesId) {

            const meses = await MesesModel.findById(mesId);
            if (!meses) {
                return createResponse("Person not found", 404);
            }
            return NextResponse.json({ meses });
        } else {

            const meses = await MesesModel.find();
            return NextResponse.json({ meses });
        }
    } catch (error) {
        console.error("Error in fetching mesess:", error);
        return createResponse("Failed to fetch data", 500);
    }
}

export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const { data } = body;

        if (!data) {
            return createResponse("Invalid input data", 400);
        }

        await connect();


        const newMonth = new MesesModel({
            data: new Date(data),

        });

        await newMonth.save();

        return createResponse("Month added successfully", 201, { id: newMonth._id, data: newMonth.data, descricao: newMonth.descricao });
    } catch (error) {
        console.error("Error in creating person:", error);
        return createResponse("Error in creating person", 500);
    }
}
