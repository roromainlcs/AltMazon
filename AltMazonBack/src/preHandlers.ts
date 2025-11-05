import { prisma, gClient } from './clients';
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    userKey?: string | null;
  }
}

function userKeyFromSub(sub: string) {
  if (!process.env.USER_KEY_SECRET) 
    throw new Error('User key secret not set');
  return crypto.createHmac('sha256', process.env.USER_KEY_SECRET).update(sub).digest('hex');
}

async function getUserKey(idToken: string): Promise<string | undefined> {
  const ticket = await gClient.verifyIdToken({
    idToken: idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  if (!payload)
    return undefined;
  console.log('Token payload:', payload);
  const sub = payload['sub'];
  return userKeyFromSub(sub);
}

export async function verifyIdToken(req: FastifyRequest, reply: FastifyReply) {
  const idToken = req.headers.authorization?.split(' ')[1];
  if (!idToken)
    return reply.status(401).send({ error: 'No token provided' });

  try {
    const userKey = await getUserKey(idToken);
    if (userKey == undefined)
      return reply.status(401).send({error: 'Unauthorized'})
    const user = await prisma.user.findUnique({
      where: { id: userKey }
    });
    // check if user exists or is banned
  if (!user)
    return reply.status(401).send({ error: 'Unauthorized' });
  else if (user.banned)
    return reply.status(403).send({ error: 'Invalid vote, user banned' });
  // attach userKey to request for further use
  req.userKey = userKey;
  } catch (error) {
    console.error('Token verification error:', error);
    return reply.status(503).send({ error: 'Token verification error' });
  }
}

export async function verifyAdmin(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return reply.status(401).send({ error: 'No token provided' });
  if (token !== process.env.ADMIN_TOKEN)
    return reply.status(403).send({ error: 'Action forbidden' });
}