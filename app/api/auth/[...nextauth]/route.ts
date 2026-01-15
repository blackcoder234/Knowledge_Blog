import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                await dbConnect();
                
                // 1. Check Database
                const user = await User.findOne({ email: credentials?.email });
                if (!user) {
                    throw new Error("Invalid email or password");
                }

                // If user registered with social, they might not have a password
                if (!user.password) {
                     throw new Error("Please sign in with your social account");
                }

                const isValid = await bcrypt.compare(credentials!.password, user.password);
                if (!isValid) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role
                };
            }
        })
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async signIn({ user, account }: any) {
            if (account?.provider === 'google' || account?.provider === 'github') {
                try {
                    await dbConnect();
                    const existingUser = await User.findOne({ email: user.email });
                    
                    if (!existingUser) {
                        await User.create({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: 'user', 
                        });
                    }
                    return true;
                } catch (error) {
                    console.error("Error creating user from social login:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }: any) {
            // Initial Sign In
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }

            // Sync with DB on every check
            if (token.email) {
                 await dbConnect();
                 const dbUser = await User.findOne({ email: token.email });
                 if (dbUser) {
                     token.role = dbUser.role;
                     token.id = dbUser._id.toString();
                 }
            }

            return token;
        },
        async session({ session, token }: any) {
             if (session?.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
