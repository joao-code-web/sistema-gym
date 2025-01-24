import { Schema, model, models, Document, Types } from "mongoose";

// Definição da interface de Despesas
interface Despesas extends Document {
  tipoGasto: string;
  valor: number;
  descricao: string;
  dataCriacao: Date;
  mes: Types.ObjectId;
}

// Criação do esquema de Despesas
const DespesasSchema: Schema<Despesas> = new Schema<Despesas>({
  tipoGasto: {
    type: String,
    enum: ["Fixo", "Variavel", "Ocasional", "Emergencia", "Supérfluo", "Investimento"],
    required: true,
  },
  valor: {
    type: Number,
    required: true,
    min: 0.01,
  },
  descricao: {
    type: String,
    required: true,
    trim: true,
  },
  dataCriacao: {
    type: Date,
    default: Date.now,
  },
  mes: {
    type: Schema.Types.ObjectId,
    ref: "Meses",
    required: true,
  }
});

// Criação do modelo ou reutilização, se já existente
const DespesasModel = models.Despesas || model<Despesas>("Despesas", DespesasSchema);
export default DespesasModel;