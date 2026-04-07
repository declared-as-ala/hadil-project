const mongoose = require('mongoose');
const config = require('./env');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    // eslint-disable-next-line no-console
    console.log('✅ MongoDB connected');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

module.exports = connectDB;

