export const dynamic = "force-dynamic";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { ApiClient } from "@/lib/api";

// Helper to refresh token
async function refreshAccessToken(token: JWT) {
    try {
        const url = `http://127.0.0.1:5001/api/auth/refresh`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refreshToken: token.refreshToken,
            }),
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
            throw refreshedTokens;
        }

        return {
            ...token,
            accessToken: refreshedTokens.accessToken,
            accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
            refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
        };
    } catch (error) {
        console.log("Error refreshing access token", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                try {
                    // Call Flask Backend
                    const res = await ApiClient.postAuth(credentials.email, credentials.password);

                    if (res.accessToken && res.user) {
                        return {
                            id: res.user.id,
                            email: res.user.email,
                            name: res.user.name,
                            agencyId: res.user.agencyId,
                            agencyName: res.user.agencyName,
                            role: res.user.role,
                            accessToken: res.accessToken,
                            refreshToken: res.refreshToken
                        }
                    }
                    return null;
                } catch (e: any) {
                    throw new Error(e.message || "Invalid credentials");
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                return {
                    id: user.id,
                    agencyId: user.agencyId,
                    agencyName: user.agencyName,
                    role: user.role,
                    accessToken: user.accessToken,
                    refreshToken: user.refreshToken,
                    accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
                };
            }

            // Return previous token if the access token has not expired yet
            if (Date.now() < (token.accessTokenExpires as number)) {
                return token;
            }

            // Access token has expired, try to update it
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.agencyId = token.agencyId as string;
                session.user.agencyName = token.agencyName as string;
                session.user.role = token.role as string;
                // @ts-ignore
                session.user.accessToken = token.accessToken;
                // @ts-ignore
                session.user.refreshToken = token.refreshToken as string;
                // @ts-ignore
                session.user.error = token.error as string | undefined;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    logger: {
        error(code, metadata) {
            console.error(code, metadata);
        },
        warn(code) {
            // console.warn(code);
        },
        debug(code, metadata) {
            // console.debug(code, metadata);
        },
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
