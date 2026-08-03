import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  domain: string;
  email: string;
  createdAt: Date;
}

const SubscriberSchema: Schema = new Schema({
  domain: { type: String, required: true, default: 'elyjen.shop' },
  email: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true,
    unique: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Subscriber: Model<ISubscriber> = mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
