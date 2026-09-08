import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

// A precomputed bcrypt hash of an unused placeholder (cost 10, matching
// every real hash in this app) — compared against when no user/passwordHash
// exists, so authorize() always pays one bcrypt.compare() and "no such
// account" can't be timing-distinguished from "wrong password".
const DUMMY_PASSWORD_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8vZH8V5NxZvUEr8U2gk5Wc39yUdMFm";

// Google/Apple only get wired up when real credentials are configured — in
// dev those env vars are empty, so only email/password is offered. This
// keeps the provider list truthful instead of showing dead buttons.
const oauthProviders = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  oauthProviders.push(
    Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })
  );
}
if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  oauthProviders.push(
    Apple({ clientId: process.env.AUTH_APPLE_ID, clientSecret: process.env.AUTH_APPLE_SECRET })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/inloggen" },
  providers: [
    Credentials({
      name: "E-mail en wachtwoord",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Both by IP and by the targeted account, so a distributed attempt
        // against one account is still caught even from many IPs.
        const [ipAllowed, emailAllowed] = await Promise.all([
          checkRateLimit(`login:${clientIp(request)}`, 20),
          checkRateLimit(`login-email:${email.toLowerCase()}`, 10),
        ]);
        if (!ipAllowed || !emailAllowed) return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        // Always compare against a real bcrypt hash, even for a missing
        // account, so "no such account" and "wrong password" take the same
        // time — a plain early return here would let response time reveal
        // which accounts exist.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
        if (!user?.passwordHash || !valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
    ...oauthProviders,
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.uid = user.id;
      }
      // Role can change (e.g. right after signup) — re-fetch on subsequent
      // requests instead of trusting a stale token value forever.
      if (!user && token.uid) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.uid as string } });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as "STUDENT" | "INSTRUCTOR";
      }
      return session;
    },
  },
});
