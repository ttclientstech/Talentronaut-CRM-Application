import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            role?: string;
            workspaceUserId?: string;
        } & DefaultSession["user"];
    }

    interface User {
        role?: string;
        workspaceUserId?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
        workspaceUserId?: string;
    }
}
