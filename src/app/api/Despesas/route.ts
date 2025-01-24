import { NextResponse } from "next/server";
import connect from "../../../../lib/db";
import DespesasModel from "../../../../lib/modals/Despesas";
import MesesModel from "../../../../lib/modals/Mes";
import { Types } from "mongoose";

type Despesa = {
  tipoGasto: string;
  valor: number;
  descricao: string;
};

interface TypesMessage {
  message: string | Despesa | Despesa[];
  status: number;
}

const status = ({ message, status }: TypesMessage) => {
  return NextResponse.json({ message, status });
};

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const mesId = searchParams.get("idMes");

    await connect();

    let despesas;

    // Caso `mesId` esteja presente, filtrar por mês
    if (mesId) {
      if (!Types.ObjectId.isValid(mesId)) {
        return status({ message: "ID do mês inválido", status: 400 });
      }
      despesas = await DespesasModel.find({ mes: new Types.ObjectId(mesId) }).populate("mes");
    } else {
      // Caso contrário, buscar todas as despesas
      despesas = await DespesasModel.find().populate("mes");
    }

    if (!despesas || despesas.length === 0) {
      return status({ message: "Nenhuma despesa encontrada", status: 404 });
    }

    return NextResponse.json(despesas);
  } catch {
    return status({ message: "Erro ao processar a requisição", status: 500 });
  }
};


export const POST = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const mesId = searchParams.get("idMes");

    const body = await req.json();
    const { tipoGasto, valor, descricao } = body;

    if (!mesId || !Types.ObjectId.isValid(mesId)) {
      return status({ message: "ID do mês inválido", status: 400 });
    }

    if (!tipoGasto || !valor || !descricao) {
      return status({ message: "Todos os campos são obrigatórios", status: 400 });
    }

    await connect();

    const mes = await MesesModel.findById(mesId);
    if (!mes) {
      return status({ message: "Mês não encontrado", status: 400 });
    }

    const novaDespesa = new DespesasModel({
      tipoGasto,
      valor,
      descricao,
      mes: mesId,
      dataCriacao: new Date(),
    });

    await novaDespesa.save();

    return NextResponse.json({ message: novaDespesa, status: 201 });
  } catch {
    return status({ message: "Erro ao criar despesa", status: 500 });
  }
};

export const DELETE = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const despesaId = searchParams.get("idDespesa");

    if (!despesaId || !Types.ObjectId.isValid(despesaId)) {
      return status({ message: "ID da despesa inválido", status: 400 });
    }

    await connect();

    const despesa = await DespesasModel.findById(despesaId);
    if (!despesa) {
      return status({ message: "Despesa não encontrada", status: 404 });
    }

    await DespesasModel.findByIdAndDelete(despesaId);

    return status({ message: "Despesa deletada com sucesso", status: 200 });
  } catch {
    return status({ message: "Erro ao deletar a despesa", status: 500 });
  }
};

export const PUT = async (req: Request) => {
  try {
    const body = await req.json();
    const { idDespesa, tipoGasto, valor, descricao } = body;

    if (!idDespesa || !Types.ObjectId.isValid(idDespesa)) {
      return status({ message: "ID da despesa inválido", status: 400 });
    }

    await connect();

    const despesa = await DespesasModel.findById(idDespesa);
    if (!despesa) {
      return status({ message: "Despesa não encontrada", status: 404 });
    }

    despesa.tipoGasto = tipoGasto || despesa.tipoGasto;
    despesa.valor = valor || despesa.valor;
    despesa.descricao = descricao || despesa.descricao;

    await despesa.save();

    return status({ message: "Despesa atualizada com sucesso", status: 200 });
  } catch {
    return status({ message: "Erro ao atualizar a despesa", status: 500 });
  }
};
