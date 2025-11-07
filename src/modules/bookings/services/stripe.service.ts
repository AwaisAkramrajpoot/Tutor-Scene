import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

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

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, string> = {},
  ): Promise<Stripe.PaymentIntent> {
    try {
      // Convert amount to cents (Stripe expects amount in smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
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
