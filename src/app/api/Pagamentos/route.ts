import { NextResponse } from "next/server";
import connect from "../../../../lib/db";
import PagamentosModel from "../../../../lib/modals/Pagamentos";
import ClientModel from "../../../../lib/modals/Client";
import MesesModel from "../../../../lib/modals/Mes";
import { Types } from "mongoose";


type pagamento = {
    client: string,
    valor: number
}

interface typesMensage {
    message: string | pagamento;
    status: number;
}

const status = ({ message, status }: typesMensage) => {
    return NextResponse.json({ message, status });
}

export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("idClient");
        const mesId = searchParams.get("idMes");

        // Verificação de validade dos IDs
        if (mesId && !Types.ObjectId.isValid(mesId)) {
            return status({ message: "ID do mês inválido", status: 400 });
        }

        if (clientId && !Types.ObjectId.isValid(clientId)) {
            return status({ message: "ID de cliente inválido", status: 400 });
        }

        // Conexão com o banco de dados
        await connect();

        let pagamentos;

        // Busca apenas por mês
        if (mesId && !clientId) {
            if (!Types.ObjectId.isValid(mesId)) {
                throw new Error('Invalid mesId');
            }
            pagamentos = await PagamentosModel.find({
                mes: new Types.ObjectId(mesId),
            }).populate("mes");
        }

        if (!mesId && clientId) {
            if (!Types.ObjectId.isValid(clientId)) {
                throw new Error('Invalid clientId');
            }
            pagamentos = await PagamentosModel.find({
                client: new Types.ObjectId(clientId),
            }).populate("client");
        }

        if (mesId && clientId) {
            if (!Types.ObjectId.isValid(mesId) || !Types.ObjectId.isValid(clientId)) {
                throw new Error('Invalid mesId or clientId');
            }
            pagamentos = await PagamentosModel.find({
                client: new Types.ObjectId(clientId),
                mes: new Types.ObjectId(mesId),
            }).populate("mes");
        }


        // Retorno caso não haja pagamentos encontrados
        if (!pagamentos || pagamentos.length === 0) {
            return status({ message: "Nenhum pagamento encontrado", status: 404 });
        }

        // Retorna os pagamentos encontrados
        return NextResponse.json(pagamentos);

    } catch (error) {
        return status({ message: "Erro ao processar a requisição", status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("id");
        const mesId = searchParams.get("idMes"); // Recebendo ID do mês

        const body = await req.json();
        const { valor } = body;

        // Verificação de validade dos IDs
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

        // Verificando se o cliente existe
        const client = await ClientModel.findById(clientId);
        if (!client) {
            return status({ message: "Esse cliente não existe", status: 400 });
        }

        // Verificando se o mês existe
        const mes = await MesesModel.findById(mesId);
        if (!mes) {
            return status({ message: "Mês não encontrado", status: 400 });
        }

        // Criando o pagamento
        const novoPagamento = new PagamentosModel({
            valor,
            client: clientId,
            mes: mesId, // Associando o pagamento ao mês
            data: new Date()
        });

        await novoPagamento.save();

        return NextResponse.json({ message: novoPagamento, status: 200 });

    } catch (error) {
        return status({ message: "Erro ao processar o pagamento", status: 500 });
    }
};



export const DELETE = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("idClient");
        const pagamentoId = searchParams.get("idPagamento");

        // Verificação de validade dos IDs
        if (!clientId || !Types.ObjectId.isValid(clientId)) {
            return status({ message: "ID de cliente inválido", status: 400 });
        }

        if (!pagamentoId || !Types.ObjectId.isValid(pagamentoId)) {
            return status({ message: "ID de pagamento inválido", status: 400 });
        }


        await connect();

        // Verificando se o cliente existe
        const client = await ClientModel.findById(clientId);
        if (!client) {
            return status({ message: "Esse cliente não existe", status: 400 });
        }

        // Buscando o pagamento, agora considerando o mês (se necessário)
        const pagamento = await PagamentosModel.findOne({
            _id: pagamentoId,
            client: clientId,
        });

        if (!pagamento) {
            return status({ message: "Esse pagamento não existe", status: 404 });
        }

        // Deletando o pagamento
        await PagamentosModel.findByIdAndDelete(pagamentoId);

        return status({ message: "Pagamento deletado com sucesso", status: 200 });

    } catch (error) {
        return status({ message: "Erro ao deletar o pagamento", status: 500 });
    }
};




export const PUT = async (req: Request) => {
    try {
        const body = await req.json();
        const { idClient, idPagamento, valor, data } = body;

        // Verificação de validade dos IDs
        if (!idClient || !Types.ObjectId.isValid(idClient)) {
            return status({ message: "ID de cliente inválido", status: 400 });
        }
        if (!idPagamento || !Types.ObjectId.isValid(idPagamento)) {
            return status({ message: "ID de pagamento inválido", status: 400 });
        }

        // Conexão com o banco de dados
        await connect();

        // Verificando se o pagamento existe
        const pagamento = await PagamentosModel.findById(idPagamento);
        if (!pagamento) {
            return status({ message: "Pagamento não encontrado", status: 404 });
        }


        pagamento.valor = valor;
        pagamento.data = new Date(data);

        await pagamento.save();
        await data.save();

        return status({ message: "Pagamento atualizado com sucesso", status: 200 });
    } catch (error) {
        return status({ message: "Erro ao processar a requisição", status: 500 });
    }
};