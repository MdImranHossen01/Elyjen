import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from './lib/db';
import User from './models/User';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide both email and password.');
        }

        await connectToDatabase();
        const normalizedEmail = (credentials.email as string).toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user || !user.password) {
          throw new Error('No user found with this email.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials.');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // When user logs in, fetch fresh data from DB for role
        // Security: DO NOT use headers() here as it causes Configuration Error in OAuth
        if (user.id) {
           await connectToDatabase();
           const mongoose = (await import('mongoose')).default;
           
           // Only query DB if it's a valid MongoDB ObjectId
           // This prevents "Configuration Error" when Google sends its own string ID
           if (mongoose.Types.ObjectId.isValid(user.id)) {
             const dbUser = await User.findById(user.id);
             if (dbUser) {
               token.id = dbUser._id.toString();
               token.role = dbUser.role ?? 'user';
               token.phone = dbUser.phone;
               token.image = dbUser.image || user.image || token.picture;
             } else {
               token.id = user.id;
               token.role = (user as any).role ?? 'user';
               token.image = user.image || token.picture;
             }
           } else {
             // If not a valid ObjectId, we still need to keep the user's data
             token.id = user.id;
             token.role = (user as any).role ?? 'user';
             token.image = user.image || token.picture;
           }
        } else {
           token.id = user.id;
           token.role = (user as any).role ?? 'user';
           token.image = user.image || token.picture;
        }
      }

      // Update session if requested (e.g. name/image update)
      if (trigger === 'update') {
        if (session?.name !== undefined) token.name = session.name;
        if (session?.image !== undefined) token.image = session.image;
      }
      
      // Global Super Admin Override
      if (token.email === 'imranshuvo101@gmail.com') {
        token.role = 'super_admin';
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role ?? 'user';
        (session.user as any).phone = token.phone as string;
        if (token.image) {
          session.user.image = token.image as string;
        }
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) {
          console.error('Google login failed: No email provided by Google');
          return false;
        }
        
        try {
          await connectToDatabase();
          const normalizedEmail = user.email.toLowerCase().trim();
          
          const savedUser = await User.findOneAndUpdate(
            { email: normalizedEmail },
            { 
              $set: {
                name: user.name || 'Unknown',
                image: user.image || '',
                googleId: account.providerAccountId,
              },
              $setOnInsert: {
                role: 'user',
                status: 'active',
              }
            },
            { upsert: true, new: true }
          );

          if (savedUser) {
            user.id = savedUser._id.toString();
            // Assign super_admin role for the specific email during sign-in
            if (user.email === 'imranshuvo101@gmail.com') {
              (user as any).role = 'super_admin';
            }
          }
          
          return true;
        } catch (error) {
          console.error('Detailed Error in Google signIn callback:', error);
          return true; // Return true to allow login even if upsert fails
        }
      }
      return true;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

