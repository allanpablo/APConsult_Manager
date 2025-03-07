# APConsult Manager

Sistema completo para monitoramento remoto de clientes, acesso remoto seguro e gestão de ativos, com compliance LGPD e interface moderna.

## Funcionalidades Principais

- **Monitoramento Proativo**: Coleta métricas críticas (CPU, RAM, Disco, SO) de clientes em tempo real
- **Gestão Centralizada**: Painel de controle com visão unificada de todos os clientes
- **Acesso Remoto Seguro**: Integração com RustDesk para suporte técnico instantâneo
- **Compliance LGPD**: Consentimento do cliente e exclusão segura de dados

## Componentes do Sistema

1. **Agente** (Go)
   - Coleta de dados de hardware/SO
   - Identificação única de clientes
   - Comunicação criptografada

2. **Dashboard** (React + Node.js)
   - Visualização em tempo real
   - Autenticação de usuários
   - Gestão de clientes

3. **Acesso Remoto** (RustDesk)
   - Conexão segura via protocolo RustDesk
   - Integração com o dashboard

4. **Compliance**
   - Exclusão de dados por solicitação
   - Logs auditáveis

## Requisitos de Sistema

- **Servidor**: 4 vCPUs, 8GB RAM, 100GB SSD
- **Sistema**: Ubuntu Server 22.04 LTS + Docker Engine
- **Portas**: 80/443 (HTTP/HTTPS), 21115-21119 (RustDesk), 3000 (API)
- **Backup**: Diário via pg_dump

## Instalação

Consulte a documentação em `docs/instalacao.md` para instruções detalhadas.

## Licença

Proprietário - APConsult © 2023 