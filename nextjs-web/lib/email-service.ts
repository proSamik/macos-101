import { usePlunk } from './useplunk';

interface WelcomeEmailData {
  name: string;
  email: string;
}

interface SubscriptionCanceledEmailData {
  name: string;
  email: string;
  subscriptionId: string;
}

export class EmailService {
  static async sendWelcomeEmail({ name, email }: WelcomeEmailData): Promise<void> {
    const subject = 'Welcome to YouTube Starter Kit!';
    const body = this.getWelcomeEmailTemplate(name);

    try {
      await usePlunk.sendTransactionalEmail({
        to: email,
        subject,
        body,
        subscribed: true,
        name: 'YouTube Starter Kit Team',
      });

      console.log(`Welcome email sent successfully to ${email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  static async trackUserSubscription(email: string): Promise<void> {
    try {
      await usePlunk.trackEvent({
        event: 'user-subscribed',
        email,
        subscribed: true,
        data: {
          source: 'google-signup',
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`User subscription tracked for ${email}`);
    } catch (error) {
      console.error('Failed to track user subscription:', error);
      throw error;
    }
  }

  static async sendSubscriptionCanceledEmail({ name, email, subscriptionId }: SubscriptionCanceledEmailData): Promise<void> {
    const subject = 'We\'re sorry to see you go! 😢';
    const body = this.getSubscriptionCanceledEmailTemplate(name, subscriptionId);

    try {
      await usePlunk.sendTransactionalEmail({
        to: email,
        subject,
        body,
        subscribed: true,
        name: 'YouTube Starter Kit Team',
      });

      console.log(`Subscription canceled email sent successfully to ${email}`);
    } catch (error) {
      console.error('Failed to send subscription canceled email:', error);
      throw error;
    }
  }

  private static getWelcomeEmailTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to YouTube Starter Kit</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 32px;
            font-weight: 700;
        }
        .header p {
            color: #e0f2fe;
            margin: 10px 0 0;
            font-size: 18px;
        }
        .content {
            padding: 40px 20px;
        }
        .greeting {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 30px;
        }
        .features {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
        }
        .features h2 {
            color: #1f2937;
            margin: 0 0 20px;
            font-size: 20px;
        }
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .feature-list li {
            padding: 8px 0;
            color: #4b5563;
            position: relative;
            padding-left: 30px;
        }
        .feature-list li:before {
            content: "✅";
            position: absolute;
            left: 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        .footer {
            background-color: #1f2937;
            color: #9ca3af;
            padding: 30px 20px;
            text-align: center;
            font-size: 14px;
        }
        .footer-logo {
            color: #3b82f6;
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Welcome to YouTube Starter Kit</h1>
            <p>Your journey to building amazing SaaS applications starts here!</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hi ${name}! 👋</div>
            
            <div class="message">
                Thank you for joining our <strong>30 Day SaaS Crash Course</strong> community! You've just taken the first step towards mastering modern web development with our comprehensive starter kit.
            </div>
            
            <div class="features">
                <h2>What you get access to:</h2>
                <ul class="feature-list">
                    <li><strong>Full-Stack Todo App</strong> - Complete CRUD operations with modern tech</li>
                    <li><strong>Next.js 15 & TypeScript</strong> - Latest framework with full type safety</li>
                    <li><strong>Beautiful UI Components</strong> - shadcn/ui with blue & orange theme</li>
                    <li><strong>Database Integration</strong> - PostgreSQL with Drizzle ORM</li>
                    <li><strong>Authentication System</strong> - Secure user management with BetterAuth</li>
                    <li><strong>Premium Features</strong> - Subscription management with Polar.sh</li>
                    <li><strong>Production Ready</strong> - Vercel deployment with Neon.com database</li>
                </ul>
            </div>
            
            <div class="message">
                Ready to start building? Access your dashboard now and explore all the premium features including our AI-powered chatbot and advanced todo management system.
            </div>
            
            <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/premium/dashboard" class="cta-button">
                    Access Your Dashboard →
                </a>
            </center>
            
            <div class="message">
                Questions? Watch our YouTube course or reach out to our community. We're here to help you succeed!
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-logo">YouTube Starter Kit</div>
            <p>Building the future of SaaS, one tutorial at a time.</p>
            <p>Follow our <a href="https://youtube.com" style="color: #3b82f6;">YouTube Channel</a> for the latest tutorials!</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private static getSubscriptionCanceledEmailTemplate(name: string, subscriptionId: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We're Sorry to See You Go</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            color: #fecaca;
            margin: 10px 0 0;
            font-size: 16px;
        }
        .content {
            padding: 40px 20px;
            text-align: center;
        }
        .sad-gif {
            margin: 20px 0;
            text-align: center;
        }
        .sad-gif img {
            max-width: 300px;
            height: auto;
            border-radius: 12px;
        }
        .greeting {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 30px;
        }
        .feedback-section {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
        }
        .feedback-section h2 {
            color: #1f2937;
            margin: 0 0 20px;
            font-size: 20px;
        }
        .feedback-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        .return-section {
            background-color: #fef3c7;
            border: 2px dashed #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
        }
        .return-section h3 {
            color: #92400e;
            margin: 0 0 15px;
            font-size: 18px;
        }
        .return-section p {
            color: #92400e;
            margin: 0 0 15px;
            font-size: 14px;
        }
        .return-button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
        }
        .footer {
            background-color: #1f2937;
            color: #9ca3af;
            padding: 30px 20px;
            text-align: center;
            font-size: 14px;
        }
        .footer-logo {
            color: #3b82f6;
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 10px;
        }
        .subscription-details {
            font-size: 12px;
            color: #6b7280;
            margin-top: 20px;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>😢 We're Sorry to See You Go</h1>
            <p>Your subscription has been canceled</p>
        </div>
        
        <div class="content">
            <div class="sad-gif">
                <img src="https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif" alt="Sad goodbye gif" />
            </div>
            
            <div class="greeting">Hi ${name}! 👋</div>
            
            <div class="message">
                We're truly sad to see you leave our <strong>YouTube Starter Kit</strong> community. Your subscription has been successfully canceled, and you won't be charged anymore.
            </div>
            
            <div class="feedback-section">
                <h2>Help Us Improve! 💭</h2>
                <p>We'd love to hear from you about your experience. Your feedback is invaluable in helping us create better products and services.</p>
                
                <p><strong>Could you take 2 minutes to let us know:</strong></p>
                <ul style="text-align: left; display: inline-block;">
                    <li>What led to your decision to cancel?</li>
                    <li>What could we have done differently?</li>
                    <li>Any features or improvements you'd like to see?</li>
                </ul>
                
                <a href="mailto:support@youtube-starter-kit.com?subject=Feedback%20on%20Subscription%20Cancellation&body=Hi%20YouTube%20Starter%20Kit%20Team,%0D%0A%0D%0AI%20wanted%20to%20share%20some%20feedback%20about%20my%20recent%20subscription%20cancellation:%0D%0A%0D%0AReason%20for%20cancellation:%0D%0A%0D%0AWhat%20could%20be%20improved:%0D%0A%0D%0ASuggestions:%0D%0A%0D%0AThanks!" class="feedback-button">
                    Share Your Feedback →
                </a>
            </div>
            
            <div class="return-section">
                <h3>🚪 Changed Your Mind?</h3>
                <p>No worries! You can reactivate your subscription anytime. All your data and progress are safely stored.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/premium" class="return-button">
                    Reactivate Subscription
                </a>
            </div>
            
            <div class="message">
                Thank you for being part of our journey. We hope to welcome you back soon! 🙏
            </div>
            
            <div class="subscription-details">
                <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
                <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p>You'll retain access to premium features until the end of your current billing period.</p>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-logo">YouTube Starter Kit</div>
            <p>Building the future of SaaS, one tutorial at a time.</p>
            <p>Follow our <a href="https://youtube.com" style="color: #3b82f6;">YouTube Channel</a> for free tutorials!</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}

export default EmailService;