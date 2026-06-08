import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from './bookings.service';

@Injectable()
export class BookingsSchedulerService {
  private readonly logger = new Logger(BookingsSchedulerService.name);

  constructor(private readonly bookingsService: BookingsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireStaleBookingRequests(): Promise<void> {
    const count = await this.bookingsService.expireStaleBookingRequests();
    if (count > 0) {
      this.logger.log(`Auto-declined ${count} booking request(s) after 72-hour review window`);
    }
  }
}
