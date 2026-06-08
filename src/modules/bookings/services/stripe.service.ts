import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export type ConnectedAccountPayoutStatus = {
  ready: boolean;
  message?: string;
};

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  shouldSkipConnect(): boolean {
    return this.configService.get<string>('STRIPE_SKIP_CONNECT') === 'true';
  }

  async getConnectedAccountPayoutStatus(
    connectedAccountId: string,
  ): Promise<ConnectedAccountPayoutStatus> {
    try {
      const account = await this.stripe.accounts.retrieve(connectedAccountId);
      const transfersCapability = account.capabilities?.transfers;

      if (transfersCapability !== 'active') {
        return {
          ready: false,
          message:
            'Complete your Stripe payout setup before accepting bookings. Open My Wallet and finish Stripe Connect onboarding.',
        };
      }

      const requirementsDue = account.requirements?.currently_due?.length ?? 0;
      const pendingVerification =
        account.requirements?.pending_verification?.length ?? 0;

      if (requirementsDue > 0 || pendingVerification > 0) {
        return {
          ready: false,
          message:
            'Your Stripe account still has pending requirements. Open My Wallet and finish Stripe Connect onboarding before accepting bookings.',
        };
      }

      return { ready: true };
    } catch (error) {
      this.logger.error(
        `Failed to verify connected account ${connectedAccountId}: ${error.message}`,
      );
      return {
        ready: false,
        message:
          'Unable to verify your Stripe payout account. Open My Wallet and complete Stripe Connect onboarding.',
      };
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, string> = {},
    connectedAccountId?: string,
    applicationFeeAmount?: number,
  ): Promise<Stripe.PaymentIntent> {
    try {
      // Convert amount to cents (Stripe expects amount in smallest currency unit)
      const amountInCents = Math.round(amount * 100);
      const feeInCents = applicationFeeAmount ? Math.round(applicationFeeAmount * 100) : undefined;

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // If connected account is provided, use destination charges for Stripe Connect
      if (connectedAccountId) {
        paymentIntentParams.transfer_data = {
          destination: connectedAccountId,
        };
        
        // Set application fee if provided
        if (feeInCents) {
          paymentIntentParams.application_fee_amount = feeInCents;
        }
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      this.logger.log(`Payment intent created: ${paymentIntent.id}${connectedAccountId ? ` for connected account: ${connectedAccountId}` : ''}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      if (
        error.message?.includes('capabilities') ||
        error.message?.includes('destination account')
      ) {
        throw new BadRequestException(
          'Your Stripe payout account is not ready to receive payments. Open My Wallet and complete Stripe Connect onboarding, then try again.',
        );
      }
      throw error;
    }
  }

  async createDirectCharge(
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, string> = {},
    connectedAccountId?: string,
    applicationFeeAmount?: number,
  ): Promise<Stripe.PaymentIntent> {
    try {
      if (!connectedAccountId) {
        throw new Error('Connected account ID is required for direct charges');
      }

      // Convert amount to cents
      const amountInCents = Math.round(amount * 100);
      const feeInCents = applicationFeeAmount ? Math.round(applicationFeeAmount * 100) : undefined;

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // Set application fee if provided
      if (feeInCents) {
        paymentIntentParams.application_fee_amount = feeInCents;
      }

      // Create payment intent on connected account (direct charge)
      const paymentIntent = await this.stripe.paymentIntents.create(
        paymentIntentParams,
        {
          stripeAccount: connectedAccountId, // Create on tutor's account
        }
      );

      this.logger.log(`Direct charge payment intent created: ${paymentIntent.id} on account: ${connectedAccountId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create direct charge: ${error.message}`);
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`);
      throw error;
    }
  }

  async refundPayment(paymentIntentId: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      this.logger.log(`Refund created: ${refund.id} for payment intent: ${paymentIntentId}`);
      return refund;
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw error;
    }
  }

  async createStripeCoupon(
    code: string,
    discountType: 'percentage' | 'fixed',
    discountValue: number,
  ): Promise<Stripe.Coupon> {
    try {
      const couponData: Stripe.CouponCreateParams = {
        id: code,
        name: code,
      };

      if (discountType === 'percentage') {
        couponData.percent_off = discountValue;
      } else {
        // Convert to cents for Stripe
        couponData.amount_off = Math.round(discountValue * 100);
        couponData.currency = 'usd';
      }

      const coupon = await this.stripe.coupons.create(couponData);
      this.logger.log(`Stripe coupon created: ${coupon.id}`);
      return coupon;
    } catch (error) {
      this.logger.error(`Failed to create Stripe coupon: ${error.message}`);
      throw error;
    }
  }

  async retrieveStripeCoupon(couponId: string): Promise<Stripe.Coupon> {
    try {
      return await this.stripe.coupons.retrieve(couponId);
    } catch (error) {
      this.logger.error(`Failed to retrieve Stripe coupon: ${error.message}`);
      throw error;
    }
  }

  async deleteStripeCoupon(couponId: string): Promise<Stripe.DeletedCoupon> {
    try {
      const deleted = await this.stripe.coupons.del(couponId);
      this.logger.log(`Stripe coupon deleted: ${couponId}`);
      return deleted;
    } catch (error) {
      this.logger.error(`Failed to delete Stripe coupon: ${error.message}`);
      throw error;
    }
  }
}
