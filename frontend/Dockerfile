# Estágio de build
FROM node:18-alpine as build

# Cria diretório da aplicação
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm ci

# Copia o código-fonte
COPY . .

# Constrói a aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copia os arquivos de build para o diretório do Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expõe as portas
EXPOSE 80 443

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"] 