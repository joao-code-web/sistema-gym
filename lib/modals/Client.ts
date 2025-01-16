import { Schema, model, models, Document } from "mongoose";

interface Client extends Document {
  nome: string;
  image: string;
}

const ClientSchema: Schema<Client> = new Schema<Client>({
  nome: {
    type: String, 
    required: true,
  },
  image: {
    type: String, 
    required: true,
  },
});

const ClientModel = models.Client || model<Client>("Client", ClientSchema);

export default ClientModel;
