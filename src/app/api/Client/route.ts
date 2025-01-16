import connect from "../../../../lib/db";
import ClientModel from "../../../../lib/modals/Client";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuração do runtime (Node.js para compatibilidade com fs e outras libs)
export const config = {
    runtime: "nodejs",
};

// Rota GET: Busca um cliente ou lista todos os clientes
export const GET = async (req: Request) => {
    try {
        await connect();

        const clientId = new URL(req.url).searchParams.get("id");

        if (clientId) {
            const client = await ClientModel.findById(clientId);
            if (!client) {
                return NextResponse.json(
                    { message: "Client not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(client, { status: 200 });
        } else {
            const clients = await ClientModel.find();
            return NextResponse.json(clients, { status: 200 });
        }
    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

// Rota POST: Cria um novo cliente
export const POST = async (req: Request) => {
    try {
        const formData = await req.formData();

        const nome = formData.get("nome") as string;
        const image = formData.get("image");

        if (!nome || !image || !(image instanceof File)) {
            return NextResponse.json(
                { message: "Invalid data. 'nome' and 'image' are required." },
                { status: 400 }
            );
        }

        // Converter a imagem para Base64 para envio ao Cloudinary
        const imageBuffer = Buffer.from(await image.arrayBuffer());
        const base64Image = `data:${image.type};base64,${imageBuffer.toString(
            "base64"
        )}`;

        // Fazer upload da imagem para o Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(base64Image);

        // Criar um novo cliente no banco de dados
        const newClient = await ClientModel.create({
            nome,
            image: uploadResponse.secure_url,
        });

        return NextResponse.json(newClient, { status: 201 });
    } catch (error) {
        console.error("POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

// Rota DELETE: Deleta um cliente
export const DELETE = async (req: Request) => {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "ID is required" }, { status: 400 });
        }

        await connect();

        const client = await ClientModel.findById(id);

        if (!client) {
            return NextResponse.json({ message: "Client not found" }, { status: 404 });
        }

        // Deletar a imagem do Cloudinary, se existir
        if (client.image) {
            const publicId = client.image.split("/").pop()?.split(".")[0]; // Extrai o publicId da URL
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        // Deletar o cliente do banco de dados
        await ClientModel.findByIdAndDelete(id);

        return NextResponse.json({ message: "Client deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

// Rota PUT: Atualiza um cliente
export const PUT = async (req: Request) => {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "ID is required" }, { status: 400 });
        }

        const formData = await req.formData();
        const nome = formData.get("nome") as string;
        const image = formData.get("image");

        await connect();

        const client = await ClientModel.findById(id);
        if (!client) {
            return NextResponse.json({ message: "Client not found" }, { status: 404 });
        }

        // Atualizar nome, se fornecido
        if (nome) {
            client.nome = nome;
        }

        // Atualizar imagem, se fornecida
        if (image && image instanceof File) {
            // Deletar a imagem antiga do Cloudinary, se existir
            if (client.image) {
                const publicId = client.image.split("/").pop()?.split(".")[0];
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            // Fazer upload da nova imagem para o Cloudinary
            const imageBuffer = Buffer.from(await image.arrayBuffer());
            const base64Image = `data:${image.type};base64,${imageBuffer.toString(
                "base64"
            )}`;
            const uploadResponse = await cloudinary.uploader.upload(base64Image);

            // Atualizar o caminho da imagem no cliente
            client.image = uploadResponse.secure_url;
        }

        // Salvar as alterações no banco de dados
        await client.save();

        return NextResponse.json(
            { message: "Client updated successfully", client },
            { status: 200 }
        );
    } catch (error) {
        console.error("PUT Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
