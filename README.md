# DevSync Paperboy

O DevSync Paperboy é um CMS *backend-first* projetado para agendamento e gerenciamento de postagens em redes sociais. Ele serve como a fonte única da verdade para o status das postagens e fornece APIs para que *workers* externos busquem conteúdo agendado.

## Funcionalidades

- **Gerenciamento de Posts**: Operações CRUD para posts (texto, imagem, agendamento).
- **Fluxo de Status**: `DRAFT` (Rascunho) -> `SCHEDULED` (Agendado) -> `QUEUED` (Na Fila) -> `SENT` (Enviado) (ou `FAILED` (Falhou) -> `SCHEDULED`).
- **API-First**: API RESTful para integração com sistemas de entrega externos.
- **Interface Simples**: Um frontend HTML/JS leve para operadores, com tema retrô/cyberpunk.
- **Upload de Imagens**: Suporte a upload de imagens com geração de URL absoluta para consumo externo. Imagens são excluídas automaticamente quando o post associado é removido.
- **Dockerizado**: Pronto para implantação com Docker e Docker Compose.
- **Documentação Swagger**: Documentação interativa da API em `/docs`.

## Tecnologias

- **Backend**: Node.js, TypeScript, Express.js
- **Banco de Dados**: SQLite (via Prisma ORM)
- **Validação**: Zod
- **Documentação**: Swagger UI
- **Qualidade de Código**: ESLint, Prettier, Husky

## Começando

### Pré-requisitos

- Node.js (v18+)
- Docker (opcional, para execução em container)

### Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repo>
   cd devsync_paperboy
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o .env se necessário (porta padrão: 3010)
   ```

4. Inicialize o banco de dados:
   ```bash
   npx prisma migrate dev --name init
   ```

### Executando a Aplicação

**Modo de Desenvolvimento:**
```bash
npm run dev
```
Acesse a interface em: `http://localhost:3010`
Acesse a documentação Swagger em: `http://localhost:3010/docs`

**Build de Produção:**
```bash
npm run build
npm start
```

### Testes

Para executar os testes automatizados (unitários e de integração):

```bash
npm test
```

### Docker

Execute a aplicação usando Docker Compose:

```bash
docker-compose up -d
```
A aplicação estará disponível em `http://localhost:3010`.
Os dados do banco persistem no arquivo `devsync_paperboy.db` (mapeado como volume) e os uploads persistem na pasta `uploads` (também mapeada).

## Endpoints da API

- `GET /api/posts`: Lista todos os posts (filtro por `status`).
- `POST /api/posts`: Cria um novo post.
- `PUT /api/posts/:id`: Atualiza um post.
- `DELETE /api/posts/:id`: Exclusão lógica (*soft delete*) de um post.
- `GET /api/posts/ready/list`: Obtém posts prontos para envio (Endpoint para Workers).
- `PUT /api/posts/:id/status`: Atualiza o status do post (Endpoint de Callback).
- `POST /api/posts/:id/retry`: Reagenda um post que falhou.
- `POST /api/images`: Upload de imagens.

Veja `/docs` para detalhes completos e teste interativo.

## Estrutura do Projeto

```
src/
├── routes/       # Manipuladores de rotas da API
├── lib/          # Bibliotecas compartilhadas (Prisma client)
├── swagger.ts    # Configuração do Swagger
├── app.ts        # Definição da aplicação Express
├── server.ts     # Ponto de entrada do servidor
└── utils.ts      # Funções utilitárias
tests/            # Testes automatizados (Unitários e Integração)
public/           # Arquivos estáticos do frontend (UI)
prisma/           # Schema do banco de dados
uploads/          # Armazenamento de imagens
```

## Contribuindo

1. Faça um Fork do projeto.
2. Crie uma branch para sua feature (`git checkout -b feature/sua-feature`).
3. Comite suas mudanças (`git commit -m 'Adiciona funcionalidade incrível'`).
   - *Nota: Hooks de pre-commit rodarão linting e formatação automaticamente.*
4. Faça o Push para a branch (`git push origin feature/sua-feature`).
5. Abra um Pull Request.
