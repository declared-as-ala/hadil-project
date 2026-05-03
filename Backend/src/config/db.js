const mongoose = require('mongoose');
const config = require('./env');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('MongoDB URI (masked):', config.mongoUri.substring(0, 30) + '***');
    
    const result = await mongoose.connect(config.mongoUri);
    
    // eslint-disable-next-line no-console
    console.log('✅ MongoDB connected');
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;

