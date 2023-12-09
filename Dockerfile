# Use a imagem oficial do Node.js como base
FROM node:20

# Crie e defina o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app/my-money-app-backend

# Copie o package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale uma versão específica do mongoose que seja compatível
RUN npm install mongoose@5.13.15

# Instale as dependências
RUN npm install --force

# Copie o restante dos arquivos do projeto para o diretório de trabalho
COPY . .

# Exponha a porta que sua aplicação está ouvindo
EXPOSE 3030

# Comando para iniciar sua aplicação usando loader.js
CMD ["node", "src/loader.js"]
