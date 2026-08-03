import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOutboxTask extends Document {
  domain: string;
  taskType: string;
  payload: Record<string, any>;
  attempts: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OutboxTaskSchema: Schema<IOutboxTask> = new Schema(
  {
    domain: { type: String, required: true, default: 'elyjen.shop' },
    taskType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    attempts: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    error: { type: String },
  },
  { timestamps: true }
);

const OutboxTask: Model<IOutboxTask> =
  mongoose.models.OutboxTask || mongoose.model<IOutboxTask>('OutboxTask', OutboxTaskSchema);

export default OutboxTask;
