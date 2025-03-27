import { FastifyInstance } from 'fastify';
import { prisma } from './clients';
import { verifyAccessToken, verifyAdmin } from './preHandlers';

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
fastify.post('/api/altshop', {preHandler: [verifyAccessToken]}, async (request, reply) => {
  const { asin, link, price } = request.body as { asin: string, link: string, price: number };

  try {
    const product = await prisma.product.update({
      where: { asin },
      data: {
        altShops: {
          create: { link, price },
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
fastify.post('/api/vote', {preHandler: [verifyAccessToken]}, async (request, reply) => {
  const { shopId, userId, newVote } = request.body as { shopId: string, userId: string, newVote: number };

  // need to add userid to see if user is cheating or banned
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const currVote = await prisma.vote.findUnique({ where: { userId_altShopId: { userId, altShopId: shopId } } });
  try {
    if (!user) {
      //no user found
      return reply.status(400).send({ error: 'Invalid user' });
    } else if (user.banned) {
      // user banned
      return reply.status(400).send({ error: 'Invalid vote, user banned' });
    } else if (!currVote) {
      // first vote on this shop
      if (newVote < -1 || newVote > 1) {
        // invalid vote
        console.log('should be temp banned');
        return reply.status(400).send({ error: 'Invalid vote' });
      } else {
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
      }
    // invalid vote
    } else if (newVote < -2 || newVote > 2 || newVote == 0 || 
    (newVote > 0 && currVote.value == true) || (newVote < 0 && currVote.value == false)) {
      console.log('should be temp banned');
      return reply.status(400).send({ error: 'Invalid vote' });
    // vote to 0, remove vote
    } else if ((currVote && newVote === 1) || (!currVote && newVote === -1)) {
      await prisma.vote.delete({
        where: {id: currVote.id},
      });
    // update vote as boolean
    } else {
      await prisma.vote.update({
        where: { id: currVote.id },
        data: {
          value: newVote > 0,
        },
      });
    }
    const altShop = await prisma.altShop.update({
      where: { id: shopId },
      data: {
        score: {
          increment: newVote,
        },
      },
    });
    return reply.send(`voted ${newVote} for ${altShop.link} successful`);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Error voting' });
  }
});
}