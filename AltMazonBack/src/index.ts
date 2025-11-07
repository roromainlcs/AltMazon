import Fastify from 'fastify';
import { altShopRoutes } from './altShop';
import { productsRoutes } from './product';
import { authRoutes } from './auth';
import { preHandlerGlobal } from './preHandlers';
import url from 'url';

const fastify = Fastify({ logger: true });

fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({ error: 'Route not found' });
});

// Start the server
const start = async () => {
  try {
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

start();
