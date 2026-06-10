# Bolão - Copa do Mundo 2026

Sistema completo de Bolão para a Copa do Mundo de 2026, com divisão em duas etapas: Fase de Grupos e Mata-Mata.
Desenvolvido com a stack React, Vite, Tailwind CSS, NestJS e Prisma (PostgreSQL).

## Funcionalidades
- Autenticação de Usuários com aprovação pendente.
- Painel Administrativo para aprovação de cadastros.
- Fase de Grupos: Palpites na classificação (1º a 3º lugar) de cada grupo. Validação automática.
- Mata-Mata: Árvore do torneio, com geração a partir dos resultados da Fase de Grupos. Palpites em placares, com identificação de vencedor em caso de empate (pênaltis).
- Sistema de pontuação: Cálculos automáticos e geração de Ranking Geral.

## Pré-requisitos
- Node.js
- Docker e Docker Compose (para banco de dados PostgreSQL local)

## Como Executar

### 1. Iniciar Banco de Dados
Acesse a pasta `backend/` e inicie o banco de dados via Docker:
```bash
cd backend
docker-compose up -d
```

### 2. Configurar e Executar o Backend
Na pasta `backend/`:
1. Instale as dependências: `npm install`
2. Gere o Prisma Client, rode as migrations e o Seed inicial:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```
*(Isso vai criar o banco e inserir todos os grupos, as 48 seleções e o Administrador principal)*
3. Inicie o servidor Backend:
```bash
npm run start:dev
```
*(O servidor estará em http://localhost:3000)*

### 3. Configurar e Executar o Frontend
Na pasta `frontend/`:
1. Instale as dependências: `npm install`
2. Inicie o servidor Frontend:
```bash
npm run dev
```
*(O app estará em http://localhost:5173)*

## Conta de Administrador
O Seed já cria a seguinte conta admin:
- **E-mail:** admin@tic.com
- **Senha:** Admin@Tic26

Aproveite o sistema!
