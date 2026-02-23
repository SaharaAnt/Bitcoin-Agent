import type { NextAuthConfig } from "next-auth";

/**
 * Base auth config used by middleware (edge runtime).
 * Does NOT import Prisma or bcryptjs.
 */
export const authConfig: NextAuthConfig = {
    providers: [],
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isLoginPage = nextUrl.pathname.startsWith("/login");
            const isApiRoute = nextUrl.pathname.startsWith("/api");

            if (isApiRoute) return true;
            if (isLoginPage) return !isLoggedIn || Response.redirect(new URL("/", nextUrl));
            return isLoggedIn;
        },
    },
};
