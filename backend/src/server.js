const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { format } = require('winston');
require('winston-daily-rotate-file');
require('dotenv').config();

// Configuração do logger
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'apconsult-backend' },
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Configuração do banco de dados
const sequelize = new Sequelize(
  process.env.DB_NAME || 'apconsult_manager',
  process.env.DB_USER || 'apconsult',
  process.env.DB_PASSWORD || 'apconsult123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Inicializa o app Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());

// Middleware de CORS
app.use(cors());

// Middleware de limite de requisições
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Middleware de log de requisições
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Middleware para parsear JSON
app.use(express.json());

// Middleware para parsear URL-encoded
app.use(express.urlencoded({ extended: true }));

// Importa as rotas
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const auditRoutes = require('./routes/audit');

// Registra as rotas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);

// Rota de verificação de saúde
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erro interno do servidor',
      status: err.status || 500
    }
  });
});

// Inicia o servidor
async function startServer() {
  try {
    // Testa a conexão com o banco de dados
    await sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');
    
    // Sincroniza os modelos com o banco de dados (em produção, usar { force: false })
    // await sequelize.sync({ force: false });
    // logger.info('Modelos sincronizados com o banco de dados.');
    
    // Inicia o servidor
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    logger.error(`Erro ao iniciar o servidor: ${error.message}`);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Tratamento de sinais para encerramento gracioso
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido. Encerrando servidor...');
  process.exit(0);
});

module.exports = app; 