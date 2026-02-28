import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import ToolAccess from "@/models/ToolAccess";

import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                accessCode: { label: "Access Code", type: "password" },
            },
            async authorize(credentials) {
                console.log('--- Auth Authorize Call ---');
                console.log('Credentials provided:', credentials);
                if (!credentials?.accessCode) {
                    console.log('No accessCode provided');
                    throw new Error('Please provide your access code');
                }
                await dbConnect();
                console.log('DB Connected');

                // Find user directly by accessCode
                const user = await User.findOne({ accessCode: credentials.accessCode });
                console.log('User found in DB:', user ? user.email : 'NOT FOUND');

                if (!user) {
                    console.log('Auth check failed: User not found with code', credentials.accessCode);
                    throw new Error('Invalid Access Code');
                }

                const userId = user._id.toString();
                console.log(`Auth check for: ${user.email} (Role: ${user.role})`);

                // RBAC Check
                let authorized = false;
                if (user.role === 'Admin') {
                    authorized = true;
                } else {
                    // Check if user has access to the "crm" tool
                    const crmAccess = await ToolAccess.findOne({ toolId: 'crm' });
                    if (crmAccess) {
                        const hasAccess = crmAccess.accessList && crmAccess.accessList.some((id: any) => id.toString() === userId);

                        if (hasAccess) {
                            authorized = true;
                            console.log(`User ${user.email} authorized for CRM access`);
                        } else {
                            console.log(`User ${user.email} not in CRM access list`);
                        }
                    } else {
                        console.log('Warning: "crm" ToolAccess record not found in database');
                    }
                }

                if (!authorized) {
                    throw new Error('Unauthorized: You do not have access to the CRM. Please contact an admin.');
                }

                // Roles are already Admin, Lead, Member in Workspace. Keep them identical.
                const mappedRole = user.role;

                return {
                    id: userId,
                    name: user.name,
                    email: user.email,
                    role: mappedRole
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role as string;
                (session.user as any).id = token.id as string;
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
