import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/users";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rateLimit";

console.log('[NextAuth] Configuración inicializada');
console.log('[NextAuth] NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NO CONFIGURADO');
console.log('[NextAuth] NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Configurado' : 'NO CONFIGURADO');

const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                const rateLimitCheck = checkRateLimit(credentials.email);
                if (!rateLimitCheck.allowed) {
                    const blockedUntil = rateLimitCheck.blockedUntil;
                    const minutesLeft = blockedUntil 
                        ? Math.ceil((blockedUntil.getTime() - Date.now()) / 60000)
                        : 15;
                    throw new Error(`Too many failed attempts. Please try again in ${minutesLeft} minutes.`);
                }

                const user = await getUserByEmail(credentials.email);
                if (!user) {
                    recordFailedAttempt(credentials.email);
                    throw new Error("Invalid email or password");
                }

                const isValidPassword = await verifyPassword(credentials.password, user.password);
                if (!isValidPassword) {
                    recordFailedAttempt(credentials.email);
                    throw new Error("Invalid email or password");
                }

                resetRateLimit(credentials.email);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
        }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('[NextAuth] Google Provider - Configurando provider');
    console.log('[NextAuth] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Configurado' : 'NO CONFIGURADO');
    console.log('[NextAuth] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Configurado' : 'NO CONFIGURADO');
    providers.unshift(GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }));
} else {
    console.log('[NextAuth] Google Provider - NO configurado (faltan variables de entorno)');
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.unshift(GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }));
}

export const authOptions: NextAuthOptions = {
    providers,
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/signIn',
    },
    session: {
        strategy: "jwt",
    },
    debug: process.env.NODE_ENV === 'development',
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log('[NextAuth] signIn callback - Account:', account?.provider);
            console.log('[NextAuth] signIn callback - User:', user?.email);
            if (account?.provider === 'google') {
                console.log('[NextAuth] Google login - Account details:', {
                    provider: account.provider,
                    type: account.type,
                    email: user.email
                });
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (account) {
                console.log('[NextAuth] jwt callback - Account provider:', account.provider);
            }
            if (user) {
                console.log('[NextAuth] jwt callback - User:', user.email);
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            console.log('[NextAuth] redirect callback - URL:', url, 'BaseURL:', baseUrl);
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
}

const handler = NextAuth(authOptions);
export {handler as GET, handler as POST};