import { FastifyInstance } from 'fastify';
import { prisma } from './clients';
import { getUserKey } from './preHandlers';


type OAuthTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: string;
  refresh_token?: string;
};

let idTokenArray: string[] = [];

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth', async (req, reply) => {
    const { code } = req.body as { code: string};
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const now = Math.floor(Date.now() / 1000);

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: "https://mkkabjpngekkemhmjbohnmjdbennicbd.chromiumapp.org/back",
          grant_type: "authorization_code",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        //console.log(data);
        const {
          access_token: access_token,
          expires_in: expires_in,
          refresh_token: refresh_token,
          id_token: id_token,
        } = (data) as OAuthTokenResponse;
        idTokenArray.push(id_token);
        return reply.send({
            access_token,
            expires_at: now + expires_in - 7756,
            refresh_token,
            id_token,
            
          },
        );
      }
      console.error("request failed: ", data);
      return reply.status(400).send(data);
    } catch (error) {
      console.error("Error with authorization_code request: ", error);
      return reply.status(400).send({ error });
    }
  });

  // check if user exists, if not create user
  // id is id_token
  fastify.post('/api/user', async (req, reply) => {
    const { id_token } = req.body as { id_token: string };
    if (!id_token)
      return reply.status(400).send({ error: 'No id_token provided' });
    const userKey = await getUserKey(id_token);

    //console.log('User id:', id);
    if (!userKey)
      return reply.status(400).send({ error: 'userKey could be extracted from id_token' });
    if (idTokenArray.includes(id_token))
      idTokenArray = idTokenArray.filter(e => e !== id_token);
    else
      return reply.status(403).send({ error: 'Wrong token' });
    try {
      const user = await prisma.user.findUnique({ where: { id: userKey } });
      if (user !== null) {
        console.log(user);
        return reply.send({ message: 'User already exists' });
      }
      await prisma.user.create({
        data: { id: userKey },
      });
      return reply.send({ message: 'User created' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error creating user' });
    }
  });

  fastify.post('/api/auth/refresh', async (req, reply) => {
    const { refresh_token } = req.body as { refresh_token: string };
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const now = Math.floor(Date.now() / 1000);

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refresh_token,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        //console.log(data);
        const {
          access_token: access_token,
          expires_in: expires_in,
        } = (data) as OAuthTokenResponse;

        return reply.send({
            access_token,
            expires_at: now + expires_in,
          },
        );
      }
      console.error("request failed: ", data);
      return reply.status(400).send(data);
    } catch (error) {
      console.error("Error with refresh_token request: ", error);
      return reply.status(400).send({ error });
    }
  });
}