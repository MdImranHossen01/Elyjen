import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  domain: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  thumbnail?: string;
  isPublished: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema(
  {
    domain: { type: String, required: true, default: 'elyjen.shop' },
    title: { 
      type: String, 
      required: [true, 'Title is required'],
      trim: true 
    },
    slug: { 
      type: String, 
      required: [true, 'Slug is required'], 
      maxlength: [100, 'Slug cannot exceed 100 characters'],
      lowercase: true,
      trim: true,
      unique: true
    },
    metaTitle: { 
      type: String, 
      required: [true, 'Meta Title is required'],
      maxlength: [100, 'Meta Title cannot exceed 100 characters'],
      trim: true 
    },
    metaDescription: { 
      type: String, 
      required: [true, 'Meta Description is required'],
      maxlength: [200, 'Meta Description cannot exceed 200 characters'],
      trim: true 
    },
    content: { 
      type: String, 
      required: [true, 'Content is required'] 
    },
    thumbnail: { 
      type: String 
    },
    isPublished: { 
      type: Boolean, 
      default: true 
    },
    views: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
  },
  { 
    timestamps: true 
  }
);

export default mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);

