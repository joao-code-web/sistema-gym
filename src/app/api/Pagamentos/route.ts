import { NextResponse } from "next/server";
import connect from "../../../../lib/db";
import PagamentosModel from "../../../../lib/modals/Pagamentos";
import ClientModel from "../../../../lib/modals/Client";
import MesesModel from "../../../../lib/modals/Mes";
import { Types } from "mongoose";

type pagamento = {
    client: string,
    valor: number
};

interface typesMensage {
    message: string | pagamento;
    status: number;
}

const status = ({ message, status }: typesMensage) => {
    return NextResponse.json({ message, status });
};

export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("idClient");
        const mesId = searchParams.get("idMes");

        if (mesId && !Types.ObjectId.isValid(mesId)) {
            return status({ message: "ID do mês inválido", status: 400 });
        }

        if (clientId && !Types.ObjectId.isValid(clientId)) {
            return status({ message: "ID de cliente inválido", status: 400 });
        }

        await connect();

        let pagamentos;

        if (mesId && !clientId) {
            pagamentos = await PagamentosModel.find({
                mes: new Types.ObjectId(mesId),
            }).populate("mes");
        }

        if (!mesId && clientId) {
            pagamentos = await PagamentosModel.find({
                client: new Types.ObjectId(clientId),
            }).populate("client");
        }

        if (mesId && clientId) {
            pagamentos = await PagamentosModel.find({
                client: new Types.ObjectId(clientId),
                mes: new Types.ObjectId(mesId),
            }).populate("mes");
        }

        if (!pagamentos || pagamentos.length === 0) {
            return status({ message: "Nenhum pagamento encontrado", status: 404 });
        }

        return NextResponse.json(pagamentos);

    } catch {
        return status({ message: "Erro ao processar a requisição", status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("id");
        const mesId = searchParams.get("idMes");

        const body = await req.json();
        const { valor } = body;

        if (!clientId || !Types.ObjectId.isValid(clientId)) {
            return status({ message: "ID de cliente inválido", status: 400 });
        }

        if (!mesId || !Types.ObjectId.isValid(mesId)) {
            return status({ message: "ID do mês inválido", status: 400 });
        }

        if (valor === undefined) {
            return status({ message: "Valor inválido", status: 400 });
        }

        await connect();

        const client = await ClientModel.findById(clientId);
        if (!client) {
            return status({ message: "Esse cliente não existe", status: 400 });
        }

        const mes = await MesesModel.findById(mesId);
        if (!mes) {
            return status({ message: "Mês não encontrado", status: 400 });
        }

        const novoPagamento = new PagamentosModel({
            valor,
            client: clientId,
            mes: mesId,
            data: new Date()
        });

        await novoPagamento.save();

        return NextResponse.json({ message: novoPagamento, status: 200 });

    } catch {
        return status({ message: "Erro ao processar o pagamento", status: 500 });
    }
};

export const DELETE = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("idClient");
        const pagamentoId = searchParams.get("idPagamento");

        if (!clientId || !Types.ObjectId.isValid(clientId)) {
            return status({ message: "ID de cliente inválido", status: 400 });
        }

        if (!pagamentoId || !Types.ObjectId.isValid(pagamentoId)) {
            return status({ message: "ID de pagamento inválido", status: 400 });
        }

        await connect();

        const client = await ClientModel.findById(clientId);
        if (!client) {
            return status({ message: "Esse cliente não existe", status: 400 });
        }

        const pagamento = await PagamentosModel.findOne({
            _id: pagamentoId,
            client: clientId,
        });

        if (!pagamento) {
            return status({ message: "Esse pagamento não existe", status: 404 });
        }

        await PagamentosModel.findByIdAndDelete(pagamentoId);

        return status({ message: "Pagamento deletado com sucesso", status: 200 });

    } catch {
        return status({ message: "Erro ao deletar o pagamento", status: 500 });
    }
};

export const PUT = async (req: Request) => {
    try {
        const body = await req.json();
        const { idClient, idPagamento, valor, data } = body;

        if (!idClient || !Types.ObjectId.isValid(idClient)) {
            return status({ message: "ID de cliente inválido", status: 400 });
        }

        if (!idPagamento || !Types.ObjectId.isValid(idPagamento)) {
            return status({ message: "ID de pagamento inválido", status: 400 });
        }

        await connect();

        const pagamento = await PagamentosModel.findById(idPagamento);
        if (!pagamento) {
            return status({ message: "Pagamento não encontrado", status: 404 });
        }

        pagamento.valor = valor;
        pagamento.data = new Date(data);

        await pagamento.save();

        return status({ message: "Pagamento atualizado com sucesso", status: 200 });
    } catch {
        return status({ message: "Erro ao processar a requisição", status: 500 });
    }
};
