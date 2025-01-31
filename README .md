# My Money Backend

## Descrição

Este é o backend do projeto **My Money**, uma API desenvolvida em **Node.js** e **Express** para gerenciamento financeiro. Utiliza **MongoDB** como banco de dados e implementa autenticação com **JWT**.

## Tecnologias Utilizadas

- **Node.js**
- **Express 4.21.0**
- **MongoDB com Mongoose**
- **JSON Web Token (JWT)** para autenticação
- **Bcrypt/Bcryptjs** para hash de senhas
- **Lodash e Moment.js** para manipulação de dados
- **PM2** para gerenciamento de processos
- **Nodemon** para desenvolvimento

## Instalação

Para instalar as dependências do projeto, execute:

```sh
npm install
```

## Scripts Disponíveis

### Desenvolvimento

```sh
npm run dev
```

Inicia o servidor em modo de desenvolvimento com **Nodemon**.

### Produção

```sh
npm run production
```

Inicia o servidor em produção com **PM2**.

## Estrutura do Projeto

- `src/` - Contém o código-fonte do projeto.
  - `loader.js` - Arquivo principal de inicialização.
- `.env` - Arquivo para variáveis de ambiente.
- `package.json` - Gerenciador de dependências e scripts do projeto.

## Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto e adicione as variáveis necessárias, como exemplo:

```
MONGO_URI=mongodb://localhost:27017/my-money
JWT_SECRET=sua_chave_secreta
PORT=3000
```

## Licença

Este projeto está licenciado sob a licença ISC.

