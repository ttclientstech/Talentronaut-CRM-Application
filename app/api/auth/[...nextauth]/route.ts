import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Team from "@/models/Team";

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
                    // Check if user belongs to the "Sales team"
                    const salesTeam = await Team.findOne({ name: /Sales team/i });
                    if (salesTeam) {
                        const isLeader = salesTeam.leader === userId;
                        const isMember = salesTeam.members && salesTeam.members.includes(userId);

                        if (isLeader || isMember) {
                            authorized = true;
                            console.log(`User ${user.email} authorized as Sales Team ${isLeader ? 'Leader' : 'Member'}`);
                        } else {
                            console.log(`User ${user.email} not in Sales Team members or leader`);
                        }
                    } else {
                        console.log('Warning: "Sales team" not found in database');
                    }
                }

                if (!authorized) {
                    throw new Error('Unauthorized: Only Sales Team and Admins can access the CRM');
                }

                // Map Workspace roles to CRM roles for internal consistency
                const mappedRole = user.role === 'Admin' ? 'Admin' : 'Sales Person';

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
