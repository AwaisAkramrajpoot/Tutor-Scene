import { Controller, Get, Post, Body, Param, UseGuards, Request, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for booking' })
  @ApiResponse({ status: 201, description: 'Payment intent created' })
  async createIntent(@Body() createDto: CreatePaymentIntentDto, @Request() req: any) {
    return this.paymentsService.createPaymentIntent(createDto, req.user.profileId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(signature, request.rawBody);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments for current user' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  async findAll(@Request() req: any) {
    return this.paymentsService.findAll(req.user.profileId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }
}
