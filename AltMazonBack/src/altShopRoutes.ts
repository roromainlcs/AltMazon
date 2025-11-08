import { FastifyInstance } from 'fastify';
import { prisma } from './clients';
import type { Prisma } from '@prisma/client';
import { requireAuth, verifyAdmin } from './preHandlers';
import { get } from 'http';
import { getUserVotesByProduct } from './getData';
import { createAltShopSchema, voteAltShopSchema } from './schema';

export async function altShopRoutes(fastify: FastifyInstance) {
  // get alt shops by asin
  fastify.get('/api/altshops/:asin', async (request, reply) => {
    const { asin } = request.params as { asin: string };
    const userKey = request.userKey as string;
    console.log('UserKey in altshops route:', userKey);
    try {
      console.log('Fetching product with asin:', asin);
      const product = await prisma.product.findUnique({
        where: { asin },
        include: { altShops: true },
      });
      if (!product)
        return reply.status(404).send({ error: 'Product not found' });
      // get votes for each alt shops
      const votes = await getUserVotesByProduct(userKey, product);
      return reply.send({ altShops: product.altShops, userVotes: votes });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error fetching product' });
    }
  });

  // create alt shop
  fastify.post('/api/altshop',{ schema: createAltShopSchema, preHandler: [requireAuth] }, async (request, reply) => {
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



  // vote for alt shop
  // newVote is a score increment either -2, -1, 1, 2
  // currVote is the current vote of the user, if 0: vote removed
  fastify.post('/api/vote', {schema: voteAltShopSchema, preHandler: [requireAuth]}, async (request, reply) => {
    const { altShopId, newVote } = request.body as { altShopId: string, newVote: number };
    const userKey = request.userKey as string;
    if (!userKey)
      return reply.status(401).send({ error: 'No userKey provided' });
    else if (!altShopId)
      return reply.status(400).send({ error: 'No shopId provided' });
    else if (newVote === undefined)
      return reply.status(400).send({ error: 'No newVote provided' });

    const currVote = await prisma.vote.findUnique({ where: { userId_altShopId: { userId: userKey, altShopId } } });
    try {
      if (newVote < -1 || newVote > 1) {
        // invalid vote should be temp ban
        return reply.status(400).send({ error: 'Invalid vote' });
      } else if (newVote === 0 && currVote) {
        // vote to 0, remove vote
        const altShop = await prisma.altShop.update({
          where: { id: altShopId },
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
          where: { id: altShopId },
          data: {
            score: {
              increment: newVote,
            },
            Votes: {
              create: { userId: userKey, value: newVote === 1 },
            },
          },
        });
        return reply.send(`voted ${newVote} for ${altShop.link} successful`);
      } else if (currVote.value !== (newVote == 1)) {
        const resetVote  = currVote.value ? -1 : 1;
        console.log('resetVote: ', resetVote);
        const altShop = await prisma.altShop.update({
          where: { id: altShopId },
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
  // fastify.get('/api/votes/:asin', {preHandler: [requireAuth]}, async (request, reply) => {
  //   const { asin } = request.params as { asin: string };
  //   const userKey = request.userKey as string;

  //   if (!userKey)
  //     return reply.status(401).send({ error: 'Error getting userKey' });
  //   try {
  //     const product = await prisma.product.findUnique({
  //       where: { asin },
  //       include: { altShops: true },
  //     });
  //     if (!product)
  //       return reply.status(404).send({ error: 'Product not found' });
  //     const votes = await Promise.all(
  //       product.altShops.map(async (shop) => {
  //         const vote = await prisma.vote.findUnique({
  //           where: { userId_altShopId: { userId: userKey, altShopId: shop.id } },
  //         });
  //         return {
  //           id: shop.id,
  //           vote: vote ? (vote.value ? 1 : -1) : 0,
  //         };
  //       })
  //     );
  //     return reply.send(votes);
  //   } catch (error) {
  //     fastify.log.error(error);
  //     return reply.status(500).send({ error: 'Error fetching product' });
  //   }
  // });

  // remove alt shop
  // fastify.delete('/api/altshop/:id', {preHandler: [verifyAdmin]}, async (request, reply) => {
  //   const { id } = request.params as { id: string };

  //   try {
  //     const altShop = await prisma.altShop.delete({
  //       where: { id },
  //     });
  //     return reply.send(`${altShop.link} deleted succuessfully`);
  //   } catch (error) {
  //     fastify.log.error(error);
  //     return reply.status(500).send({ error: 'Error deleting alt shop' });
  //   }
  // });
}