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

export async function getUserKey(idToken: string): Promise<string | undefined> {
  //console.log('Verifying IdToken:', idToken);
  const ticket = await gClient.verifyIdToken({
    idToken: idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  if (!payload)
    return undefined;
  //console.log('Token payload:', payload);
  const sub = payload['sub'];
  return userKeyFromSub(sub);
}

export async function preHandlerGlobal(req: FastifyRequest, reply: FastifyReply) {
  const origin = req.headers.origin;
  if (origin === 'http://localhost:5173') {
    reply.header('Access-Control-Allow-Origin', origin);
  }
  reply.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  const isPreflight = /options/i.test(req.method);
  if (isPreflight)
    return reply.status(204).send();
  // userKey extraction
  const idToken = req.headers.authorization?.split(' ')[1];
  //console.log('Extracted idToken:', idToken);
  if (!idToken || idToken == 'null')
    return;
  try {
    const userKey = await getUserKey(idToken);
    req.userKey = userKey;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Token used too late')) {
      console.error('Token expired', error);
      return;
    }
    console.error('Token verification error:', error);
    return reply.status(503).send({ error: 'Token verification error' });
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.userKey || req.userKey == null)
    return reply.status(401).send({ error: !req.userKey ? 'Unauthorized token' : 'Unauthorized no token provided' });

    const user = await prisma.user.findUnique({
      where: { id: req.userKey }
    });
    // check if user exists or is banned
  if (!user)
    return reply.status(401).send({ error: 'Unauthorized no such user' });
  else if (user.banned)
    return reply.status(403).send({ error: 'Invalid vote, user banned' });
}

export async function verifyAdmin(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return reply.status(401).send({ error: 'No token provided' });
  if (token !== process.env.ADMIN_TOKEN)
    return reply.status(403).send({ error: 'Action forbidden' });
}