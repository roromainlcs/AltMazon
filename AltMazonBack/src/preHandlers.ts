import { prisma, gClient } from './clients';
import { FastifyRequest, FastifyReply } from 'fastify';

export async function verifyIdToken(req: FastifyRequest, reply: FastifyReply) {
  const id = req.headers.authorization?.split(' ')[1];
  if (!id)
    return reply.status(401).send({ error: 'No token provided' });

  // try {
  //   const ticket = await gClient.verifyIdToken({
  //     idToken: id,
  //     audience: process.env.GOOGLE_CLIENT_ID
  //   });
  //   const payload = ticket.getPayload();
  //   if (!payload)
  //     return false;
  //   const googleId = payload['sub'];
  //   console.log('Google ID:', googleId);
    const user = await prisma.user.findUnique({
      where: { id: id }
    });
    
    // check if user exists or is banned
  if (!user)
    reply.status(401).send({ error: 'Unauthorized' });
  else if (user.banned)
    reply.status(403).send({ error: 'Invalid vote, user banned' });
      // } catch (error) {
  //   console.error('Token verification error:', error);
  //   reply.status(503).send({ error: 'Token verification error' });
  // }
}

export async function verifyUserId(req: FastifyRequest, reply: FastifyReply) {
  if (req.headers.authorization?.split(' ')[0] !== 'userId')
    return reply.status(401).send({ error: 'No userId provided' });
  const userId = req.headers.authorization?.split(' ')[1];
  if (!userId)
    return reply.status(401).send({ error: 'No userId provided' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || userId !== user.id)
    return user ? reply.status(401).send({ error: 'User not found' }) : reply.status(403).send({ error: 'Action forbidden' });
}

export async function verifyAdmin(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return reply.status(401).send({ error: 'No token provided' });
  if (token !== process.env.ADMIN_TOKEN)
    return reply.status(403).send({ error: 'Action forbidden' });
}