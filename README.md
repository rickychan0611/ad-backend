# AD Backend

A TypeScript-based GraphQL backend with Prisma and PostgreSQL.

## Features

- **TypeScript**: Full type safety throughout the application
- **GraphQL**: Apollo Server with Express
- **Prisma**: Type-safe database client with PostgreSQL
- **ES Modules**: Modern JavaScript module system

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file with:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database"
   PORT=4000
   ```

3. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

4. **Run database migrations**:
   ```bash
   npx prisma migrate dev
   ```

## Development

- **Start development server**:
  ```bash
  npm run dev
  ```

- **Build for production**:
  ```bash
  npm run build
  ```

- **Start production server**:
  ```bash
  npm start
  ```

## Project Structure

```
src/
├── index.ts              # Main server entry point
└── schema/
    ├── typeDefs.ts       # GraphQL schema definitions
    └── resolvers.ts      # GraphQL resolvers
prisma/
└── schema.prisma         # Database schema
```

## TypeScript Configuration

The project uses strict TypeScript configuration with:
- ES2022 target
- ESNext modules
- Strict type checking
- Source maps for debugging
- Declaration files generation

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented) 