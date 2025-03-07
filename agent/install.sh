#!/bin/bash

echo "==================================="
echo "Instalador do Agente APConsult"
echo "==================================="

# Verifica permissões de root
if [ "$EUID" -ne 0 ]; then
  echo "Erro: Este instalador precisa ser executado como root."
  echo "Por favor, execute com sudo ou como usuário root."
  exit 1
fi

# Cria diretório de instalação
echo "Criando diretório de instalação..."
mkdir -p /opt/APConsult/logs

# Copia os arquivos
echo "Copiando arquivos..."
cp -f agent /opt/APConsult/
chmod +x /opt/APConsult/agent

# Copia o RustDesk se existir
if [ -f "rustdesk" ]; then
  cp -f rustdesk /opt/APConsult/
  chmod +x /opt/APConsult/rustdesk
fi

# Verifica se o arquivo de consentimento já existe
if [ ! -f "/opt/APConsult/consent.dat" ]; then
  echo
  echo "==================================="
  echo "TERMOS DE CONSENTIMENTO"
  echo "==================================="
  echo
  echo "Este software coleta informações do sistema como:"
  echo "- Uso de CPU, memória e disco"
  echo "- Versão do sistema operacional"
  echo "- Nome do computador"
  echo
  echo "Estas informações são usadas apenas para fins de monitoramento"
  echo "e suporte técnico. Todos os dados são criptografados e tratados"
  echo "de acordo com a LGPD (Lei Geral de Proteção de Dados)."
  echo
  echo "Você concorda com a coleta destas informações?"
  echo
  
  read -p "Digite 'sim' para concordar ou qualquer outra tecla para cancelar: " consent
  
  if [ "$consent" != "sim" ]; then
    echo
    echo "Instalação cancelada pelo usuário."
    exit 1
  fi
  
  echo "sim" > /opt/APConsult/consent.dat
  echo
  echo "Consentimento registrado. Obrigado!"
fi

# Cria o arquivo de serviço systemd
echo "Criando serviço systemd..."
cat > /etc/systemd/system/apconsult-agent.service << EOF
[Unit]
Description=APConsult Monitoring Agent
After=network.target

[Service]
Type=simple
ExecStart=/opt/APConsult/agent
Restart=always
RestartSec=10
StandardOutput=append:/opt/APConsult/logs/agent.log
StandardError=append:/opt/APConsult/logs/agent.log

[Install]
WantedBy=multi-user.target
EOF

# Recarrega o systemd
systemctl daemon-reload

# Habilita e inicia o serviço
echo "Iniciando serviço..."
systemctl enable apconsult-agent
systemctl start apconsult-agent

# Configura o RustDesk se existir
if [ -f "/opt/APConsult/rustdesk" ]; then
  echo "Configurando RustDesk..."
  /opt/APConsult/rustdesk --install-service --server api.apconsult.com.br:21115
fi

echo
echo "==================================="
echo "Instalação concluída com sucesso!"
echo "==================================="
echo
echo "O agente APConsult foi instalado e está em execução."
echo 