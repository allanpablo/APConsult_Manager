-- Criação das tabelas para o APConsult Manager

-- Tabela de usuários (administradores do sistema)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clientes (dispositivos monitorados)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(36) UNIQUE NOT NULL,
    custom_name VARCHAR(100),
    hostname VARCHAR(100),
    os VARCHAR(50),
    platform VARCHAR(50),
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de métricas do sistema
CREATE TABLE system_metrics (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(36) REFERENCES clients(client_id),
    cpu_usage FLOAT,
    memory_total BIGINT,
    memory_used BIGINT,
    memory_usage FLOAT,
    disk_total BIGINT,
    disk_used BIGINT,
    disk_usage FLOAT,
    collected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de auditoria
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações do sistema
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance
CREATE INDEX idx_clients_client_id ON clients(client_id);
CREATE INDEX idx_clients_is_active ON clients(is_active);
CREATE INDEX idx_system_metrics_client_id ON system_metrics(client_id);
CREATE INDEX idx_system_metrics_collected_at ON system_metrics(collected_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar o timestamp de updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Configurações iniciais
INSERT INTO settings (key, value, description) VALUES
('retention_days', '90', 'Número de dias para retenção de métricas do sistema'),
('alert_cpu_threshold', '90', 'Limite de uso de CPU para alertas (%)'),
('alert_memory_threshold', '90', 'Limite de uso de memória para alertas (%)'),
('alert_disk_threshold', '90', 'Limite de uso de disco para alertas (%)'),
('rustdesk_server', 'api.apconsult.com.br:21115', 'Endereço do servidor RustDesk');

-- Usuário admin padrão (senha: admin123)
INSERT INTO users (username, password, email, full_name, role)
VALUES ('admin', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVdLBPA8PHQyXi1aXVIwEjJBQfQYBu', 'admin@apconsult.com.br', 'Administrador', 'admin');

-- Função para limpar métricas antigas (retenção de dados)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
DECLARE
    retention_days INTEGER;
BEGIN
    -- Obtém o número de dias de retenção das configurações
    SELECT COALESCE(NULLIF(value, '')::INTEGER, 90) INTO retention_days FROM settings WHERE key = 'retention_days';
    
    -- Remove métricas mais antigas que o período de retenção
    DELETE FROM system_metrics
    WHERE collected_at < (CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL);
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Usuários administradores do sistema';
COMMENT ON TABLE clients IS 'Dispositivos monitorados pelo agente';
COMMENT ON TABLE system_metrics IS 'Métricas coletadas dos dispositivos';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para compliance';
COMMENT ON TABLE settings IS 'Configurações do sistema'; 