import Fastify from 'fastify';
import { altShopRoutes } from './altShopRoutes';
import { productsRoutes } from './product';
import { authRoutes } from './auth';
import { preHandlerGlobal } from './preHandlers';
import rateLimit from '@fastify/rate-limit';

const fastify = Fastify({ logger: true });

fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({ error: 'Route not found' });
});

// Start the server
const start = async () => {
  try {
    await fastify.register(rateLimit, rateLimiter);
    await fastify.register(altShopRoutes);
    await fastify.register(productsRoutes);
    await fastify.register(authRoutes);
    fastify.decorateRequest('userKey', null);
    fastify.addHook('preHandler', preHandlerGlobal);
    await fastify.listen({ port: 3001, host: '0.0.0.0'});
    console.log('Server listening on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

const rateLimiter = {
  max: 5, // 5 requests
  timeWindow: '5000', // 5000 ms
  // optional:
  ban: 1, // temporary ban after 1 violations
};

start();