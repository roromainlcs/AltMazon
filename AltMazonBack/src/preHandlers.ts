import { prisma, gClient } from './clients';
import { FastifyRequest, FastifyReply } from 'fastify';

export async function verifyAccessToken(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return reply.status(401).send({ error: 'No token provided' });
  }

  try {
    const ticket = await gClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload)
      return false;
    const googleId = payload['sub'];
    const user = await prisma.user.findUnique({
      where: { id: googleId }
    });
    
    // check if user exists or is banned
    if (!user || user.banned)
      reply.status(401).send({ error: 'Unauthorized' });
    // Optionally, you could create your own session token here
  } catch (error) {
    console.error('Token verification error:', error);
    reply.status(503).send({ error: 'Token verification error' });
  }
}

export async function verifyAdmin(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return reply.status(401).send({ error: 'No token provided' });
  if (token !== process.env.ADMIN_TOKEN)
    return reply.status(403).send({ error: 'Action forbidden' });
}