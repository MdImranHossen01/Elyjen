import mongoose from 'mongoose';
import connectToDatabase from '../db';
import GlobalSettings from '../../models/GlobalSettings';
import { randomUUID } from 'node:crypto';

export async function migrateGlobalSettings() {
  try {
    await connectToDatabase();
    
    const settings = await GlobalSettings.find({});
    
    if (settings.length === 0) {
      console.log('No GlobalSettings found. Creating initial document.');
      await GlobalSettings.create({
        brandName: 'ELYJEN',
      });
      return;
    }

    console.log('GlobalSettings migration completed successfully.');
  } catch (error) {
    console.error('GlobalSettings migration failed:', error);
    throw error;
  }
}

