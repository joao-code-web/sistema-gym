import { Schema, model, models, Document } from "mongoose";


interface Meses extends Document {
    data: Date;
}

const MesesSchema: Schema<Meses> = new Schema<Meses>({
    data: {
        type: Date,
        required: true,
    },
});

const MesesModel = models.Meses || model<Meses>("Meses", MesesSchema);

export default MesesModel;
