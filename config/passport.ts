import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import UserModel from '../models/userModel.js';
import { User } from '../types/index.js';

// Configure Google OAuth Strategy
const configureGoogleStrategy = (): void => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          // Extract user information from Google profile
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          const name = profile.displayName;
          const providerId = profile.id;
          const avatar = profile.photos && profile.photos.length > 0 
            ? profile.photos[0].value 
            : null;

          // Check if user exists with this Google ID
          let user = await UserModel.findByProviderId('google', providerId);

          if (user) {
            // User exists with this Google account, update avatar if changed
            if (avatar && user.avatar !== avatar) {
              user = await UserModel.updateById(user.id, { avatar });
            }
            return done(null, user);
          }

          // Check if user exists with this email (local account)
          user = await UserModel.findByEmail(email);

          if (user) {
            // User exists with email but not linked to Google
            // Link the Google account to existing user
            user = await UserModel.updateById(user.id, {
              provider: 'google',
              providerId,
              avatar,
              isEmailVerified: true, // Google emails are verified
            });
            return done(null, user);
          }

          // Create new user with Google account
          user = await UserModel.createOAuthUser({
            name,
            email,
            provider: 'google',
            providerId,
            avatar,
            isEmailVerified: true,
          });

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth Strategy Error:', error);
          return done(error instanceof Error ? error : new Error(String(error)), undefined);
        }
      }
    )
  );
};

// Serialize user for session (not used with JWT, but required by Passport)
passport.serializeUser((user: Express.User, done: (err: Error | null, id?: string) => void) => {
  const userId = (user as User).id;
  done(null, userId);
});

// Deserialize user from session (not used with JWT, but required by Passport)
passport.deserializeUser(async (id: string, done: (err: Error | null, user?: User | null) => void) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error instanceof Error ? error : new Error(String(error)), null);
  }
});

export { configureGoogleStrategy };
export default passport;
