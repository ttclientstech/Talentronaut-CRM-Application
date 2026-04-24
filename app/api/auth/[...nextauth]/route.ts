import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { NextAuthOptions } from "next-auth";

const DEFAULT_SHARED_SECRET = "talentronaut-tool-auth-dev";

function getWorkspaceAuthBaseUrl() {
    return process.env.WORKSPACE_AUTH_URL || "http://localhost:3000";
}

function getSharedSecret() {
    return process.env.TOOL_AUTH_SHARED_SECRET || DEFAULT_SHARED_SECRET;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                accessCode: { label: "Access Code", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.accessCode) {
                    throw new Error('Please provide your access code');
                }

                const response = await fetch(`${getWorkspaceAuthBaseUrl().replace(/\/$/, "")}/api/tools/authorize`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Tool-Auth-Secret": getSharedSecret(),
                    },
                    body: JSON.stringify({
                        accessCode: credentials.accessCode,
                        toolId: "crm",
                    }),
                    cache: "no-store",
                });

                let data: any = null;
                try {
                    data = await response.json();
                } catch {
                    data = null;
                }

                if (!response.ok || !data?.success || !data?.allowed || !data?.user) {
                    throw new Error(data?.error || "Unauthorized: You do not have access to the CRM. Please contact an admin.");
                }

                return {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    workspaceUserId: data.user.id,
                    image: data.user.profilePicture || undefined,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.workspaceUserId = user.workspaceUserId || user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role as string;
                (session.user as any).id = token.id as string;
                session.user.workspaceUserId = token.workspaceUserId as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
