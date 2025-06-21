import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import cors from 'cors';
import express from 'express';
import compression from 'compression';
import { authorization } from './helpers/auth';
import * as _ from 'lodash';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function startApolloServer() {
  const PORT = process.env['PORT'] || 4000;
  const app = express();
  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(compression());
  app.use(express.json({ limit: '50mb' }));
  app.use(
    express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
  );
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, { context: authorization })
  );
  // Show message on browser at root URL
  app.get('/', (_, res) => {
    res.send('GraphQL is listening at /graphql');
  });

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );
  console.log(`\n 
        🚀 Server is running!
        🔉 Listening on port ${PORT}
        📭 Query at http://localhost:${PORT}/graphql
    `);
}
startApolloServer();
