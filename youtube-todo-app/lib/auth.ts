import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { trackUserSignup } from "./user-tracking";
import { eq, sql } from "drizzle-orm";
import { user as UserSchema, 
  account as AccountSchema, 
  session as SessionSchema,
  verification as VerificationSchema,
  oauthApplication,
  oauthAccessToken,
  oauthConsent
} from "@/lib/db/schema";
import { usePlunk } from "./useplunk";
import { EmailService } from "./email-service";
import { mcp } from "better-auth/plugins";   

// Type for webhook payloads
type WebhookPayload = {
  data?: {
    customer?: {
      email?: string;
      name?: string;
      id?: string;
    };
    subscription?: {
      id?: string;
    };
  };
  customer?: {
    email?: string;
    name?: string;
    id?: string;
  };
  subscription?: {
    id?: string;
  };
};

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  server: 'sandbox'
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: UserSchema,
      account: AccountSchema,
      session: SessionSchema,
      verification: VerificationSchema,
      oauthApplication,
      oauthAccessToken,
      oauthConsent
    }
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (updates session every day)
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            // Track user signup event for all new users (email/password and social)
            await trackUserSignup(user.email, user.name);
          } catch (error) {
            console.error("Error tracking user signup:", error);
            // Don't throw error to prevent breaking user creation
          }
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          try {
            // Track social signup for new accounts created via OAuth providers
            if (account.providerId === "google") {
              // Use raw SQL to check if this is a new social signup
              const userResult = await db.select().from(UserSchema).where(eq(UserSchema.id, account.userId)).limit(1);
              const user = userResult[0];
              
              if (user) {
                // Check if this is the user's first account (indicating a new signup)
                const accountCount = await db.select({ count: sql`count(*)` }).from(AccountSchema).where(eq(AccountSchema.userId, account.userId));
                
                // If this is the only account for this user, it's a new social signup
                if (accountCount[0]?.count === 1) {
                  await trackUserSignup(user.email, user.name);
                }
              }
            }
          } catch (error) {
            console.error("Error tracking social signup:", error);
            // Don't throw error to prevent breaking account creation
          }
        },
      },
    },
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRO_PRODUCT_ID as string,
              slug: "monthly-pro"
            },
            {
              productId: process.env.NEXT_PUBLIC_POLAR_MONTHLY_PLUS_PRODUCT_ID as string,
              slug: "monthly-plus"
            },
            {
              productId: process.env.NEXT_PUBLIC_POLAR_YEARLY_PRO_PRODUCT_ID as string,
              slug: "yearly-pro"
            },
            {
              productId: process.env.NEXT_PUBLIC_POLAR_YEARLY_PLUS_PRODUCT_ID as string,
              slug: "yearly-plus"
            }
          ],
          successUrl: "/premium/dashboard?checkout_success=true",
          authenticatedUsersOnly: true
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onSubscriptionActive: async (payload: unknown) => {
            try {
              // Track subscription active event to Plunk
              const payloadData = payload as WebhookPayload;
              const customerEmail = payloadData.data?.customer?.email || payloadData.customer?.email;
              const subscriptionId = payloadData.data?.subscription?.id || payloadData.subscription?.id;
              const customerId = payloadData.data?.customer?.id || payloadData.customer?.id;
              
              if (!customerEmail) {
                console.error('No customer email found in subscription active payload');
                return;
              }

              await usePlunk.trackEvent({
                event: 'user-subscription-active',
                email: customerEmail,
                subscribed: true,
                data: {
                  subscriptionId: subscriptionId || 'unknown',
                  customerId: customerId || 'unknown',
                  timestamp: new Date().toISOString(),
                  eventType: 'subscription_active',
                },
              });
              console.log(`Tracked subscription active event for: ${customerEmail}`);
            } catch (error) {
              console.error('Error tracking subscription active event:', error);
            }
          },
          onSubscriptionCanceled: async (payload: unknown) => {
            try {
              // Send sad goodbye email with feedback request
              const payloadData = payload as WebhookPayload;
              const customerEmail = payloadData.data?.customer?.email || payloadData.customer?.email;
              const customerName = payloadData.data?.customer?.name || payloadData.customer?.name;
              const subscriptionId = payloadData.data?.subscription?.id || payloadData.subscription?.id;
              
              if (!customerEmail) {
                console.error('No customer email found in subscription canceled payload');
                return;
              }

              await EmailService.sendSubscriptionCanceledEmail({
                name: customerName || customerEmail,
                email: customerEmail,
                subscriptionId: subscriptionId || 'unknown',
              });
              console.log(`Sent subscription canceled email to: ${customerEmail}`);
            } catch (error) {
              console.error('Error sending subscription canceled email:', error);
            }
          },
        })
      ],
    }),
    mcp({
      loginPage: "/sign-in" 
    })
  ]
});

export type Session = typeof auth.$Infer.Session;