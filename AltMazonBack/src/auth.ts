import { FastifyInstance } from 'fastify';
import { prisma } from './clients';


type OAuthTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: string;
  refresh_token?: string;
};

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
        console.log(data);
        const {
          access_token: access_token,
          expires_in: expires_in,
          refresh_token: refresh_token,
        } = (data) as OAuthTokenResponse;

        return reply.send({
            access_token,
            expires_at: now + expires_in,
            refresh_token,
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

  // need to verify if userId is valid with google verification
  fastify.post('/api/user', async (req, reply) => {
    const { id } = req.body as { id: string };

    if (!id)
      return reply.status(400).send({ error: 'No user id provided' });
    try {
      if ((prisma.user.findUnique({ where: { id } })) !== undefined)
        return reply.send( { message: 'User exists' });
      const user = await prisma.user.create({
        data: { id },
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
        console.log(data);
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