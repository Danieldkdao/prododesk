import { envServer } from "@/data/env/server";
import { db } from "@/db/db";
import { sendAccountDeletionEmail } from "@/services/mailjet/emails/account-deletion-email";
import { sendVerificationOtp } from "@/services/mailjet/emails/verification-emails";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";

export const auth = betterAuth({
  user: {
    additionalFields: {
      timeZone: {
        type: "string",
        required: true,
        input: true,
      },
      profileImageKey: {
        type: "string",
        required: false,
        input: true,
      },
    },
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
      deleteTokenExpiresIn: 15 * 60,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendAccountDeletionEmail({ email: user.email, url });
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
  },
  socialProviders: {
    google: {
      clientId: envServer.GOOGLE_CLIENT_ID,
      clientSecret: envServer.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: envServer.GITHUB_CLIENT_ID,
      clientSecret: envServer.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      changeEmail: {
        enabled: true,
      },
      async sendVerificationOTP(data) {
        await sendVerificationOtp(data);
      },
    }),
    nextCookies(),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
});

export type User = typeof auth.$Infer.Session.user;
