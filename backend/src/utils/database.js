const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração do banco de dados
const sequelize = new Sequelize(
  process.env.DB_NAME || 'apconsult_manager',
  process.env.DB_USER || 'apconsult',
  process.env.DB_PASSWORD || 'apconsult123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize; 