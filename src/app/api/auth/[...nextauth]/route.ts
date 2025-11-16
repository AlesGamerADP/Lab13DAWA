import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, verifyPassword } from "@/lib/users";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rateLimit";

const providers = [
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

                // Check rate limit
                const rateLimitCheck = checkRateLimit(credentials.email);
                if (!rateLimitCheck.allowed) {
                    const blockedUntil = rateLimitCheck.blockedUntil;
                    const minutesLeft = blockedUntil 
                        ? Math.ceil((blockedUntil.getTime() - Date.now()) / 60000)
                        : 15;
                    throw new Error(`Too many failed attempts. Please try again in ${minutesLeft} minutes.`);
                }

                // Get user
                const user = await getUserByEmail(credentials.email);
                if (!user) {
                    recordFailedAttempt(credentials.email);
                    throw new Error("Invalid email or password");
                }

                // Verify password
                const isValidPassword = await verifyPassword(credentials.password, user.password);
                if (!isValidPassword) {
                    recordFailedAttempt(credentials.email);
                    throw new Error("Invalid email or password");
                }

                // Reset rate limit on successful login
                resetRateLimit(credentials.email);

                // Return user object (without password)
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
        }),
];

// Add Google provider only if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.unshift(GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }));
}

// Add GitHub provider only if credentials are provided
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
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
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
    },
}

const handler = NextAuth(authOptions);
export {handler as GET, handler as POST};