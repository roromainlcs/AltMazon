import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { prisma, gClient } from './clients';
import { altShopRoutes } from './altShop';
import { productsRoutes } from './product';
import { authRoutes } from './auth';
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
    fastify.addHook('preHandler', (req, res, done) => {
      res.header("Access-Control-Allow-Origin", "http://localhost:5173");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      const isPreflight = /options/i.test(req.method);
      if (isPreflight)
        return res.send();
      done();
    })
    await fastify.listen({ port: 3001 });
    console.log('Server listening on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();