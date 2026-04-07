const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const config = require('./config/env');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
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
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Connect to database then start server
connectDB()
  .then(() => {
    // Middlewares
    if (config.env !== 'test') {
      app.use(morgan('dev'));
    }

    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check
    app.get('/health', (req, res) => {
      res.status(200).json({ success: true, message: 'OK' });
    });

    // Routes
    app.use('/api/auth', authRoutes);

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

    // 404 handler
    app.all('*', notFoundHandler);

    // Central error handler
    app.use(errorHandler);

    app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running in ${config.env} mode on port ${config.port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  });

module.exports = app;

