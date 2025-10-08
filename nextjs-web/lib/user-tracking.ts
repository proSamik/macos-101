import { EmailService } from './email-service';

export async function trackUserSignup(email: string, name?: string | null): Promise<void> {
  try {
    if (!email) {
      console.warn('No email provided for user signup tracking');
      return;
    }

    const userName = name || email.split('@')[0] || 'User';

    // Send welcome email
    await EmailService.sendWelcomeEmail({
      name: userName,
      email: email,
    });

    // Track user subscription event
    await EmailService.trackUserSubscription(email);

    console.log(`Successfully tracked signup and sent welcome email for: ${email}`);
  } catch (error) {
    console.error('Error in trackUserSignup:', error);
    // Don't throw error to prevent breaking user creation
  }
}