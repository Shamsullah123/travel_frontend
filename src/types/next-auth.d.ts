import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            agencyId: string;
            agencyName: string;
            role: string;
            accessToken: string;
            refreshToken: string; // Added
            error?: string; // Added
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        agencyId: string;
        agencyName: string;
        role: string;
        accessToken: string;
        refreshToken: string; // Added
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        agencyId: string;
        role: string;
        accessToken: string;
        refreshToken: string; // Added
        accessTokenExpires: number; // Added
        error?: string; // Added
    }
}
