const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  client_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: true,
    validate: {
      isUUID: 4
    }
  },
  custom_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  hostname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  os: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  platform: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  first_seen: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  last_seen: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_clients_client_id',
      fields: ['client_id']
    },
    {
      name: 'idx_clients_is_active',
      fields: ['is_active']
    }
  ]
});

// Método para atualizar o timestamp de last_seen
Client.prototype.updateLastSeen = async function() {
  this.last_seen = new Date();
  return this.save();
};

// Método para renomear o cliente
Client.prototype.rename = async function(newName) {
  this.custom_name = newName;
  return this.save();
};

// Método para desativar o cliente
Client.prototype.deactivate = async function() {
  this.is_active = false;
  return this.save();
};

// Método para ativar o cliente
Client.prototype.activate = async function() {
  this.is_active = true;
  return this.save();
};

// Método estático para encontrar cliente por client_id
Client.findByClientId = async function(clientId) {
  return this.findOne({
    where: {
      client_id: clientId
    }
  });
};

// Método estático para encontrar clientes ativos
Client.findActive = async function() {
  return this.findAll({
    where: {
      is_active: true
    },
    order: [['last_seen', 'DESC']]
  });
};

// Método estático para encontrar clientes inativos
Client.findInactive = async function() {
  return this.findAll({
    where: {
      is_active: false
    },
    order: [['last_seen', 'DESC']]
  });
};

module.exports = Client; 