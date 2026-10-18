import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeeCategoryDoc extends Document {
  categoryId: string;
  name: string;
  defaultFee: number;
  amount?: number;
  description: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeCategorySchema: Schema<IFeeCategoryDoc> = new Schema(
  {
    categoryId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    defaultFee: { type: Number, required: true },
    amount: { type: Number },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

const FeeCategory: Model<IFeeCategoryDoc> =
  mongoose.models.FeeCategory || mongoose.model<IFeeCategoryDoc>('FeeCategory', FeeCategorySchema);

export default FeeCategory;

