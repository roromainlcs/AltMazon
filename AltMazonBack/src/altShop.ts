import { FastifyInstance } from 'fastify';
import { prisma } from './clients';
import { verifyIdToken, verifyAdmin } from './preHandlers';

export async function altShopRoutes(fastify: FastifyInstance) {
  // get alt shops by asin
  fastify.get('/api/altshops/:asin', async (request, reply) => {
    const { asin } = request.params as { asin: string };
    try {
      console.log('Fetching product with asin:', asin);
      const product = await prisma.product.findUnique({
        where: { asin },
        include: { altShops: true },
      });

      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      
      return reply.send(product.altShops);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error fetching product' });
    }
  });

  // create alt shop
  fastify.post('/api/altshop', {preHandler: [verifyIdToken]}, async (request, reply) => {
    const { asin, link, price, currency } = request.body as { asin: string, link: string, price: number, currency: string };

    try {
      const product = await prisma.product.update({
        where: { asin },
        data: {
          altShops: {
            create: { link, price, currency },
          },
        },
      });
      return reply.send(`alt shop ${link} created for ${product.asin} succuessfully`);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error creating alt shop' });
    }
  });

  // remove alt shop
  fastify.delete('/api/altshop/:id', {preHandler: [verifyAdmin]}, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const altShop = await prisma.altShop.delete({
        where: { id },
      });
      return reply.send(`${altShop.link} deleted succuessfully`);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error deleting alt shop' });
    }
  });

  // vote for alt shop
  // newVote is a score increment either -2, -1, 1, 2
  // currVote is the current vote of the user, if 0: vote removed
  fastify.post('/api/vote', {preHandler: [verifyIdToken]}, async (request, reply) => {
    const { shopId, newVote } = request.body as { shopId: string, newVote: number };
    const userId = request.headers.authorization?.split(' ')[1];
    if (!userId)
      return reply.status(401).send({ error: 'No userId provided' });
    else if (!shopId)
      return reply.status(400).send({ error: 'No shopId provided' });
    else if (newVote === undefined)
      return reply.status(400).send({ error: 'No newVote provided' });

    const currVote = await prisma.vote.findUnique({ where: { userId_altShopId: { userId, altShopId: shopId } } });
    try {
      if (newVote < -1 || newVote > 1) {
        // invalid vote
        console.log('should be temp banned');
        return reply.status(400).send({ error: 'Invalid vote' });
      } else if (newVote === 0 && currVote) {
        // vote to 0, remove vote
        const altShop = await prisma.altShop.update({
          where: { id: shopId },
          data: {
            score: {
              increment: -1 * (currVote.value ? 1 : -1),
            },
          },
        });
        await prisma.vote.delete({
          where: {id: currVote.id},
        });
        return reply.send(`voted ${newVote} for ${altShop.link} successful`);
      } else if (!currVote) {
        const altShop = await prisma.altShop.update({
          where: { id: shopId },
          data: {
            score: {
              increment: newVote,
            },
            Votes: {
              create: { userId, value: newVote === 1 },
            },
          },
        });
        return reply.send(`voted ${newVote} for ${altShop.link} successful`);
      } else if (currVote.value !== (newVote == 1)) {
        const resetVote  = currVote.value ? -1 : 1;
        console.log('resetVote: ', resetVote);
        const altShop = await prisma.altShop.update({
          where: { id: shopId },
          data: {
            score: {
              increment: resetVote + newVote,
            },
          },
        });
        await prisma.vote.update({
          where: { id: currVote.id },
          data: {
            value: newVote === 1,
          },
        });
      } else
        return reply.status(400).send({ error: 'Invalid vote' });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error voting' });
    }
  });

  // get votes for alt shops of a product by asin
  fastify.get('/api/votes/:asin', async (request, reply) => {
    const { asin } = request.params as { userId: string, asin: string };
    const userId = request.headers.authorization?.split(' ')[1];

    if (!userId)
      return reply.status(401).send({ error: 'No userId provided' });
    try {
      const product = await prisma.product.findUnique({
        where: { asin },
        include: { altShops: true },
      });
      if (!product)
        return reply.status(404).send({ error: 'Product not found' });
      const votes = await Promise.all(
        product.altShops.map(async (shop) => {
          const vote = await prisma.vote.findUnique({
            where: { userId_altShopId: { userId, altShopId: shop.id } },
          });
          return {
            id: shop.id,
            vote: vote ? (vote.value ? 1 : -1) : 0,
          };
        })
      );
      return reply.send(votes);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error fetching product' });
    }
  });
}