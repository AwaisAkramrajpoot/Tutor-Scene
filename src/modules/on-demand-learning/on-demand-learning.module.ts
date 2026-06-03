import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnDemandContent } from '@/database/entities/on-demand-content.entity';
import { OnDemandContentSaved } from '@/database/entities/on-demand-content-saved.entity';
import { OnDemandCartItem } from '@/database/entities/on-demand-cart-item.entity';
import { OnDemandLearningController } from './on-demand-learning.controller';
import { OnDemandLearningService } from './on-demand-learning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OnDemandContent,
      OnDemandContentSaved,
      OnDemandCartItem,
    ]),
  ],
  controllers: [OnDemandLearningController],
  providers: [OnDemandLearningService],
  exports: [OnDemandLearningService],
})
export class OnDemandLearningModule {}
