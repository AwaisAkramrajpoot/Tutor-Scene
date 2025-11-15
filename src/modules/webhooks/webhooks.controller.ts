import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { Public } from '../auth/decorators/auth.decorator';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  @Public()
  @ApiExcludeEndpoint()
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    this.logger.log('Received webhook request');
    
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Get raw body - it might be in request.body (from express.raw) or request.rawBody
    let rawBody: Buffer;
    if (Buffer.isBuffer(request.body)) {
      rawBody = request.body;
    } else if (request.rawBody) {
      rawBody = request.rawBody;
    } else {
      this.logger.error('Missing request body');
      throw new BadRequestException('Missing request body');
    }

    this.logger.log(`Webhook signature present, body length: ${rawBody.length}`);

    try {
      await this.webhooksService.handleStripeWebhook(rawBody, signature);
      this.logger.log('Webhook processed successfully');
      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Webhook processing failed: ${error.message}`);
    }
  }
}
