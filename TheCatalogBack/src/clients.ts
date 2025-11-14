import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

export const prisma = new PrismaClient();
export const gClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "https://mkkabjpngekkemhmjbohnmjdbennicbd.chromiumapp.org/back");
