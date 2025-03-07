const Client = require('../models/client');
const SystemMetric = require('../models/systemMetric');
const AuditLog = require('../models/auditLog');
const crypto = require('../utils/crypto');
const logger = require('../utils/logger');

// Obter todos os clientes
exports.getAllClients = async (req, res, next) => {
  try {
    // Parâmetros de filtro
    const { status, os, search } = req.query;
    
    // Constrói a query
    let whereClause = {};
    
    // Filtro por status
    if (status === 'active') {
      whereClause.is_active = true;
    } else if (status === 'inactive') {
      whereClause.is_active = false;
    }
    
    // Filtro por sistema operacional
    if (os) {
      whereClause.os = os;
    }
    
    // Filtro por nome/hostname
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { custom_name: { [Op.iLike]: `%${search}%` } },
          { hostname: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Busca os clientes
    const clients = await Client.findAll({
      where: whereClause,
      order: [['last_seen', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    logger.error(`Erro ao obter clientes: ${error.message}`);
    next(error);
  }
};

// Obter um cliente específico
exports.getClientById = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    
    // Busca o cliente
    const client = await Client.findByClientId(clientId);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }
    
    // Busca as métricas mais recentes
    const latestMetrics = await SystemMetric.findOne({
      where: { client_id: clientId },
      order: [['collected_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        client,
        metrics: latestMetrics || null
      }
    });
  } catch (error) {
    logger.error(`Erro ao obter cliente: ${error.message}`);
    next(error);
  }
};

// Atualizar um cliente (renomear)
exports.updateClient = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    const { custom_name } = req.body;
    
    // Busca o cliente
    const client = await Client.findByClientId(clientId);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }
    
    // Atualiza o nome personalizado
    if (custom_name !== undefined) {
      await client.rename(custom_name);
      
      // Registra a ação no log de auditoria
      await AuditLog.create({
        user_id: req.user.id,
        action: 'UPDATE',
        entity_type: 'CLIENT',
        entity_id: clientId,
        details: { custom_name },
        ip_address: req.ip
      });
    }
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error(`Erro ao atualizar cliente: ${error.message}`);
    next(error);
  }
};

// Excluir um cliente (desativar)
exports.deleteClient = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    
    // Busca o cliente
    const client = await Client.findByClientId(clientId);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }
    
    // Desativa o cliente
    await client.deactivate();
    
    // Registra a ação no log de auditoria
    await AuditLog.create({
      user_id: req.user.id,
      action: 'DELETE',
      entity_type: 'CLIENT',
      entity_id: clientId,
      details: { is_active: false },
      ip_address: req.ip
    });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Erro ao excluir cliente: ${error.message}`);
    next(error);
  }
};

// Receber dados do cliente (endpoint para o agente)
exports.receiveClientData = async (req, res, next) => {
  try {
    // Obtém os dados criptografados
    const encryptedData = req.body.toString();
    
    // Descriptografa os dados
    const decryptedData = await crypto.decrypt(encryptedData);
    
    // Converte para objeto
    const clientData = JSON.parse(decryptedData);
    
    // Valida os dados
    if (!clientData.client_id || !clientData.system_info) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos'
      });
    }
    
    // Busca ou cria o cliente
    let client = await Client.findByClientId(clientData.client_id);
    
    if (!client) {
      // Cria um novo cliente
      client = await Client.create({
        client_id: clientData.client_id,
        custom_name: clientData.custom_name || null,
        hostname: clientData.system_info.hostname,
        os: clientData.system_info.os,
        platform: clientData.system_info.platform,
        first_seen: new Date(),
        last_seen: new Date(),
        is_active: true
      });
    } else {
      // Atualiza o cliente existente
      client.hostname = clientData.system_info.hostname;
      client.os = clientData.system_info.os;
      client.platform = clientData.system_info.platform;
      client.last_seen = new Date();
      
      // Se o cliente tem um nome personalizado e não foi definido antes
      if (clientData.custom_name && !client.custom_name) {
        client.custom_name = clientData.custom_name;
      }
      
      await client.save();
    }
    
    // Salva as métricas do sistema
    await SystemMetric.create({
      client_id: clientData.client_id,
      cpu_usage: clientData.system_info.cpu_usage,
      memory_total: clientData.system_info.memory_total,
      memory_used: clientData.system_info.memory_used,
      memory_usage: clientData.system_info.memory_usage,
      disk_total: clientData.system_info.disk_total,
      disk_used: clientData.system_info.disk_used,
      disk_usage: clientData.system_info.disk_usage,
      collected_at: clientData.system_info.collected_at
    });
    
    res.status(200).json({
      success: true,
      message: 'Dados recebidos com sucesso'
    });
  } catch (error) {
    logger.error(`Erro ao receber dados do cliente: ${error.message}`);
    next(error);
  }
};

// Obter métricas de um cliente
exports.getClientMetrics = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    const { period } = req.query;
    
    // Define o período de busca
    let startDate = new Date();
    
    switch (period) {
      case 'hour':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setHours(startDate.getHours() - 1); // Padrão: última hora
    }
    
    // Busca as métricas
    const metrics = await SystemMetric.findAll({
      where: {
        client_id: clientId,
        collected_at: {
          [Op.gte]: startDate
        }
      },
      order: [['collected_at', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: metrics.length,
      data: metrics
    });
  } catch (error) {
    logger.error(`Erro ao obter métricas do cliente: ${error.message}`);
    next(error);
  }
}; 