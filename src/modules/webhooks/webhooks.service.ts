import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Prospect } from '@/database/entities/prospect.entity';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private stripe: Stripe;
  private webhookSecret: string;

  private platformWebhookSecret: string;
  private connectWebhookSecret: string = 'whsec_ISmVXq70Uj44ae1dgABVXj8SNZ6EeJWk';

  constructor(
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
    @Inject(forwardRef(() => BookingsService))
    private bookingsService: BookingsService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    this.platformWebhookSecret = this.webhookSecret; // Platform uses env variable
  }

  async handlePlatformWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    this.logger.log(`Platform webhook secret configured: ${this.platformWebhookSecret ? 'Yes' : 'No'}`);

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.platformWebhookSecret,
      );
      this.logger.log('Platform webhook signature verified successfully');
    } catch (error) {
      this.logger.error(`Platform webhook signature verification failed: ${error.message}`);
      throw error;
    }

    this.logger.log(`Processing PLATFORM webhook event: ${event.type}`);

    // Handle platform events (payments)
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      
      default:
        this.logger.log(`Unhandled platform event type: ${event.type}`);
    }
  }

  async handleConnectWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    this.logger.log(`Connect webhook secret configured: ${this.connectWebhookSecret ? 'Yes' : 'No'}`);

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.connectWebhookSecret,
      );
      this.logger.log('Connect webhook signature verified successfully');
    } catch (error) {
      this.logger.error(`Connect webhook signature verification failed: ${error.message}`);
      throw error;
    }

    this.logger.log(`Processing CONNECT webhook event: ${event.type}`);

    // Handle connect events (account updates)
    switch (event.type) {
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      
      default:
        this.logger.log(`Unhandled connect event type: ${event.type}`);
    }
  }

  // Keep old method for backward compatibility
  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    // Redirect to platform webhook
    return this.handlePlatformWebhook(rawBody, signature);
  }

  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    try {
      this.logger.log(`Account updated: ${account.id}`);

      // Find prospect by payment account ID
      const prospect = await this.prospectRepository.findOne({
        where: { paymentAccountId: account.id },
      });

      if (!prospect) {
        this.logger.warn(`No prospect found for account: ${account.id}`);
        return;
      }

      // Check if all requirements are met
      const currentlyDue = account.requirements?.currently_due || [];
      const pendingVerification = account.requirements?.pending_verification || [];

      const isFullyOnboarded = 
        currentlyDue.length === 0 && 
        pendingVerification.length === 0;

      this.logger.log(
        `Account ${account.id} onboarding status: ` +
        `currently_due=${currentlyDue.length}, ` +
        `pending_verification=${pendingVerification.length}, ` +
        `fully_onboarded=${isFullyOnboarded}`
      );

      // Update prospect if onboarding is complete
      if (isFullyOnboarded && !prospect.paymentOnBoarded) {
        prospect.paymentOnBoarded = true;
        await this.prospectRepository.save(prospect);
        this.logger.log(`Prospect ${prospect.id} payment onboarding completed`);
      } else if (!isFullyOnboarded && prospect.paymentOnBoarded) {
        // Handle case where requirements are added after onboarding
        prospect.paymentOnBoarded = false;
        await this.prospectRepository.save(prospect);
        this.logger.log(`Prospect ${prospect.id} payment onboarding status reverted`);
      }
    } catch (error) {
      this.logger.error(`Error handling account.updated: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);

      // Get booking ID from metadata
      const bookingId = paymentIntent.metadata?.bookingId;
      
      if (!bookingId) {
        this.logger.warn(`No booking ID found in payment intent metadata: ${paymentIntent.id}`);
        return;
      }

      // Find booking by payment intent ID
      const booking = await this.bookingsService.findByPaymentIntentId(paymentIntent.id);

      if (!booking) {
        this.logger.warn(`No booking found for payment intent: ${paymentIntent.id}`);
        return;
    }

      // Confirm the booking
      await this.bookingsService.confirmBookingPayment(booking.id);
      
      this.logger.log(`Booking ${booking.id} confirmed after successful payment`);
    } catch (error) {
      this.logger.error(`Error handling payment_intent.succeeded: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Payment intent failed: ${paymentIntent.id}`);
      
      const bookingId = paymentIntent.metadata?.bookingId;
      
      if (bookingId) {
        this.logger.warn(`Payment failed for booking ${bookingId}`);
        // You could add logic here to notify the student or handle failed payments
      }
    } catch (error) {
      this.logger.error(`Error handling payment_intent.payment_failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    try {
      this.logger.log(`Charge refunded: ${charge.id}`);
      
      // Get the payment intent ID from the charge
      const paymentIntentId = typeof charge.payment_intent === 'string' 
        ? charge.payment_intent 
        : charge.payment_intent?.id;

      if (!paymentIntentId) {
        this.logger.warn(`No payment intent found for charge: ${charge.id}`);
        return;
      }

      // Mark the booking as refunded
      await this.bookingsService.markBookingAsRefunded(paymentIntentId);
      
      this.logger.log(`Booking refund processed for payment intent: ${paymentIntentId}`);
    } catch (error) {
      this.logger.error(`Error handling charge.refunded: ${error.message}`, error.stack);
      throw error;
    }
  }
}
