import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/auth/login', error: '/auth/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        phoneToken: { label: 'Phone token', type: 'text' },
      },
      async authorize(credentials) {
        if (credentials?.phoneToken) {
          const record = await prisma.phoneLoginToken.findUnique({
            where: { token: credentials.phoneToken },
          });
          if (!record || record.expiresAt < new Date()) return null;
          await prisma.phoneLoginToken.delete({ where: { id: record.id } }).catch(() => {});
          const user = await prisma.user.findUnique({ where: { id: record.userId } });
          if (!user) return null;
          return {
            id: user.id,
            email: user.email ?? `${user.phone}@phone`,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        }
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email!,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      if (account?.provider && user) {
        let dbUser = await prisma.user.findFirst({
          where: {
            OR: [{ email: user.email! }, { id: (user as { id?: string }).id }],
          },
        });
        if (!dbUser && user.email) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? undefined,
              image: user.image ?? undefined,
              role: 'user',
            },
          });
        }
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
