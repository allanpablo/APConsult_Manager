FROM node:18-alpine

# Cria diretório da aplicação
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm ci --only=production

# Copia o código-fonte
COPY . .

# Cria diretório de logs
RUN mkdir -p logs

# Expõe a porta da aplicação
EXPOSE 3000

# Define variáveis de ambiente
ENV NODE_ENV=production

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"] 