import { prisma } from './clients';
import type { Prisma } from '@prisma/client';

export async function getUserVotesByProduct(userKey: string, product: Prisma.ProductGetPayload<{ include: { altShops: true } }> | null) {
  if (!product || userKey === null || userKey === undefined)
    return [];

  const votes = await Promise.all(
    product.altShops.map(async (shop) => {
      const vote = await prisma.vote.findUnique({
        where: { userId_altShopId: { userId: userKey, altShopId: shop.id } },
      });
      return {
        id: shop.id,
        vote: vote ? (vote.value ? 1 : -1) : 0,
      };
    })
  );
  return votes;
}