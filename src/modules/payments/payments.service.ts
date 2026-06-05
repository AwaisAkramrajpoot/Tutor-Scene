import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment } from '@/database/entities/payment.entity';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentStatus } from '@/database/entities/enums';
import { TutorReferralsService } from '@/modules/tutor-referrals/tutor-referrals.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly configService: ConfigService,
    private readonly tutorReferralsService: TutorReferralsService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(createDto: CreatePaymentIntentDto, studentProfileId: number) {
    const { bookingId, amount, currency = 'USD' } = createDto;

    const platformFee = amount * 0.15; // 15% platform fee
    const tutorPayout = amount - platformFee;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: { bookingId: bookingId.toString() },
    });

    const payment = this.paymentRepository.create({
      bookingId,
      studentProfileId,
      amount,
      platformFee,
      tutorPayout,
      currency,
      status: PaymentStatus.PENDING,
      stripePaymentIntentId: paymentIntent.id,
      paymentMethod: 'card',
    });

    await this.paymentRepository.save(payment);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    };
  }

  async handleWebhook(signature: string, body: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    try {
      const event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.updatePaymentStatus(paymentIntent.id, PaymentStatus.SUCCEEDED);
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.updatePaymentStatus(paymentIntent.id, PaymentStatus.FAILED);
      }

      return { received: true };
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  private async updatePaymentStatus(stripePaymentIntentId: string, status: PaymentStatus) {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId },
    });

    if (payment) {
      payment.status = status;
      if (status === PaymentStatus.SUCCEEDED) {
        payment.paidAt = new Date();
        await this.tutorReferralsService.updateReferralSpendForUser(
          payment.studentProfileId,
          Number(payment.amount || 0),
        );
      }
      await this.paymentRepository.save(payment);
    }
  }

  async findAll(userId?: number): Promise<Payment[]> {
    if (userId) {
      return this.paymentRepository.find({
        where: [{ studentProfileId: userId }, { tutorProfileId: userId }],
        order: { createdAt: 'DESC' },
      });
    }
    return this.paymentRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Payment> {
    return this.paymentRepository.findOne({ where: { id } });
  }
}
