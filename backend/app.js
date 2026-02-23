/**
 * Fastify app builder - used for both local server and Vercel serverless
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');

async function buildApp() {
  const app = fastify({ logger: true });

  app.addContentTypeParser('application/x-www-form-urlencoded', (req, body, done) => {
    done(null, {});
  });

  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod' });

  app.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: err.message });
    }
  });

  const whatsappRoutes = require('./routes/whatsapp.js');
  const authRoutes = require('./routes/auth.js');
  const transactionsRoutes = require('./routes/transactions.js');
  const featuresRoutes = require('./routes/features.js');

  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  await app.register(whatsappRoutes);
  await app.register(authRoutes);
  await app.register(transactionsRoutes);
  await app.register(featuresRoutes);

  return app;
}

module.exports = { buildApp };
