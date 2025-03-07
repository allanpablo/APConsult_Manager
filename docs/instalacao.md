# Guia de Instalação do APConsult Manager

Este guia descreve os passos necessários para instalar e configurar o APConsult Manager, incluindo o servidor e os agentes nos computadores dos clientes.

## Requisitos de Sistema

### Servidor
- **Hardware**: 4 vCPUs, 8GB RAM, 100GB SSD
- **Sistema Operacional**: Ubuntu Server 22.04 LTS
- **Software**: Docker Engine, Docker Compose
- **Rede**: Portas 80/443 (HTTP/HTTPS), 21115-21119 (RustDesk), 3000 (API)

### Agentes (Clientes)
- **Windows**: Windows 7 ou superior (x64)
- **Linux**: Ubuntu 18.04 ou superior, CentOS 7 ou superior
- **macOS**: macOS 10.13 ou superior

## Instalação do Servidor

### 1. Preparação do Servidor

```bash
# Atualiza o sistema
sudo apt update && sudo apt upgrade -y

# Instala dependências
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Instala o Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instala o Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adiciona o usuário atual ao grupo docker
sudo usermod -aG docker $USER
```

### 2. Configuração do Servidor

```bash
# Cria o diretório do projeto
mkdir -p /opt/apconsult-manager
cd /opt/apconsult-manager

# Clona o repositório (ou copia os arquivos manualmente)
git clone https://github.com/apconsult/apconsult-manager.git .

# Cria o arquivo .env com as variáveis de ambiente
cat > .env << EOF
DB_PASSWORD=senha_segura_do_banco
JWT_SECRET=chave_secreta_jwt_muito_segura
ENCRYPTION_KEY=chave_de_criptografia_aes_256_segura
EOF

# Cria o diretório para os certificados SSL
mkdir -p docker/nginx/ssl

# Gera certificados SSL auto-assinados (para desenvolvimento)
# Em produção, use Let's Encrypt ou certificados válidos
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/server.key \
  -out docker/nginx/ssl/server.crt \
  -subj "/C=BR/ST=Estado/L=Cidade/O=APConsult/CN=api.apconsult.com.br"
```

### 3. Inicialização dos Serviços

```bash
# Inicia os serviços
docker-compose up -d

# Verifica se todos os serviços estão rodando
docker-compose ps

# Verifica os logs
docker-compose logs -f
```

### 4. Configuração Inicial

```bash
# Cria o usuário administrador (se não foi criado automaticamente)
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin", "password":"senha_admin_segura", "email":"admin@apconsult.com.br", "full_name":"Administrador"}' \
  http://localhost:3000/api/users
```

## Instalação dos Agentes

### Windows

1. Baixe o instalador `install.bat` e o agente `agent.exe` do servidor
2. Coloque os arquivos em uma pasta temporária
3. Execute o arquivo `install.bat` como administrador
4. Siga as instruções na tela para concluir a instalação

### Linux

1. Baixe o instalador `install.sh` e o agente `agent` do servidor
2. Dê permissão de execução aos arquivos:
   ```bash
   chmod +x install.sh agent
   ```
3. Execute o instalador como root:
   ```bash
   sudo ./install.sh
   ```
4. Siga as instruções na tela para concluir a instalação

## Compilação dos Agentes

### Windows

```bash
# Compilação para Windows
GOOS=windows GOARCH=amd64 go build -ldflags "-s -w -H=windowsgui" -o agent.exe ./agent/cmd
upx --best --ultra-brute agent.exe
```

### Linux

```bash
# Compilação para Linux
GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o agent ./agent/cmd
upx --best agent
```

## Configuração de Backup

### Backup Automático do Banco de Dados

Adicione um cron job para fazer backup diário do banco de dados:

```bash
# Edita o crontab
crontab -e

# Adiciona a linha para backup diário às 2h da manhã
0 2 * * * docker exec apconsult-postgres pg_dump -U apconsult apconsult_manager > /opt/apconsult-manager/backups/$(date +\%Y-\%m-\%d).sql
```

## Solução de Problemas

### Verificação de Logs

```bash
# Logs do backend
docker-compose logs backend

# Logs do frontend
docker-compose logs frontend

# Logs do banco de dados
docker-compose logs postgres

# Logs do RustDesk
docker-compose logs rustdesk-hbbs
docker-compose logs rustdesk-hbbr
```

### Problemas Comuns

1. **Erro de conexão com o banco de dados**:
   - Verifique se o serviço do PostgreSQL está rodando
   - Verifique as credenciais no arquivo `.env`

2. **Erro de conexão com o RustDesk**:
   - Verifique se as portas 21115-21119 estão abertas no firewall
   - Verifique se os serviços HBBS e HBBR estão rodando

3. **Agente não aparece no dashboard**:
   - Verifique se o agente está rodando no cliente
   - Verifique os logs do agente em `C:\APConsult\logs` (Windows) ou `/opt/APConsult/logs` (Linux)
   - Verifique se o cliente consegue acessar o servidor na porta 3000

## Atualização do Sistema

```bash
# Atualiza o código-fonte
cd /opt/apconsult-manager
git pull

# Reconstrói e reinicia os serviços
docker-compose down
docker-compose build
docker-compose up -d
```

## Suporte

Para obter suporte técnico, entre em contato com:
- Email: suporte@apconsult.com.br
- Telefone: (XX) XXXX-XXXX 