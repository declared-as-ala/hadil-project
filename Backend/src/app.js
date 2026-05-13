const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🚀 Starting application...');
console.log('Environment:', process.env.NODE_ENV);

const config = require('./config/env');
const connectDB = require('./config/db');

console.log('✅ Config loaded:', { env: config.env, port: config.port });
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const employesRoutes = require('./routes/employes.routes');
const stagiairesRoutes = require('./routes/stagiaires.routes');
const absencesRoutes = require('./routes/absences.routes');
const demandesRoutes = require('./routes/demandes.routes');
const congesRoutes = require('./routes/conges.routes');
const heuresSupplementairesRoutes = require('./routes/heuresSupplementaires.routes');
const messagesRoutes = require('./routes/messages.routes');
const projetsRoutes = require('./routes/projets.routes');
const tachesRoutes = require('./routes/taches.routes');
const reunionsRoutes = require('./routes/reunions.routes');
const contratsRoutes = require('./routes/contrats.routes');
const demandeDocumentsRoutes = require('./routes/demandeDocuments.routes');
const postesRoutes = require('./routes/postes.routes');
const affectationsRoutes = require('./routes/affectations.routes');
const paiesRoutes = require('./routes/paies.routes');
const aiCvRoutes = require('./routes/aiCv.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Start the Express server first with routes
const startServer = () => {
  // Middlewares
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'OK' });
  });

  // Routes
  app.use('/api/auth', authRoutes);

  // User Management routes (admin only)
  app.use('/api/users', usersRoutes);

  // HR Management routes
  app.use('/api/employes', employesRoutes);
  app.use('/api/stagiaires', stagiairesRoutes);
  app.use('/api/absences', absencesRoutes);
  app.use('/api/demandes', demandesRoutes);
  app.use('/api/conges', congesRoutes);
  app.use('/api/heures-supplementaires', heuresSupplementairesRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/projets', projetsRoutes);
  app.use('/api/taches', tachesRoutes);
  app.use('/api/reunions', reunionsRoutes);
  app.use('/api/contrats', contratsRoutes);
  app.use('/api/documents-admin', demandeDocumentsRoutes);
  app.use('/api/postes', postesRoutes);
  app.use('/api/affectations', affectationsRoutes);
  app.use('/api/paies', paiesRoutes);
  app.use('/api/hr/cv-ai', aiCvRoutes);

  // 404 handler
  app.all('*', notFoundHandler);

  // Central error handler
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`✅ Server running in ${config.env} mode on port ${config.port}`);
    console.log(`📍 Health check: http://localhost:${config.port}/health`);
  });
};

// Connect to database and start server
connectDB()
  .then(() => {
    startServer();
  })
  .catch((err) => {
    console.error('⚠️  MongoDB connection failed:', err.message);
    console.log('🚀 Starting server in offline mode...');
    startServer();
  });

module.exports = app;

