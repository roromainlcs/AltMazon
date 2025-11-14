import { FastifyInstance } from 'fastify';
import { prisma } from './clients';
import { requireAuth, verifyAdmin } from './preHandlers';

export async function productsRoutes(fastify: FastifyInstance) {
  // get product by asin (not useful atm)
  fastify.get('/api/product/:asin', async (request, reply) => {
    const { asin } = request.params as { asin: string };
  
    try {
      console.log('Fetching product with asin:', asin);
      const product = await prisma.product.findUnique({
        where: { asin },
      });
  
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      
      return reply.send(product);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error fetching product' });
    }
  });
  
  // create product
  fastify.post('/api/product', {preHandler: [requireAuth]}, async (request, reply) => {
    const { asin} = request.body as { asin: string };

    try {
      const product = await prisma.product.create({
        data: { asin },
      });
      return reply.send(product);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error creating product' });
    }
  });
  
  // remove product
  fastify.delete('/api/product/:asin', {preHandler: [verifyAdmin]}, async (request, reply) => {
    const { asin } = request.params as { asin: string };

    try {
      const product = await prisma.product.delete({
        where: { asin },
      });
      return reply.send(product);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error deleting product' });
    }
  });
}