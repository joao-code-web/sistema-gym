import { Schema, model, models, Document, Types, Model } from "mongoose";

// Interface para o documento de Pagamentos
interface IPagamentos extends Document {
    client: Types.ObjectId; // Referência ao cliente
    valor: number;          // Valor do pagamento
    data: Date;
    mes: Types.ObjectId
}

// Definição do Schema de Pagamentos
const PagamentosSchema = new Schema<IPagamentos>({
    client: {
        type: Schema.Types.ObjectId, // Correção aqui
        ref: "Client",              // Substitua "Client" pelo nome exato do modelo relacionado
        required: true,
    },
    valor: {
        type: Number,
        required: true,
    },
    data: {
        type: Date,
        required: true,
    },
    mes: {
        type: Schema.Types.ObjectId,
        ref: "Meses",
        required: true,
    }
});

// Modelo de Pagamentos
const PagamentosModel: Model<IPagamentos> = models.Pagamentos || model<IPagamentos>("Pagamentos", PagamentosSchema);

export default PagamentosModel;
