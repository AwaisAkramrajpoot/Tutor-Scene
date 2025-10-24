import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoCode } from '@/database/entities/promo-code.entity';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { PromoCodeDiscountType } from '@/database/entities/enums';

@Injectable()
export class PromoCodesService {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,
  ) {}

  async create(createDto: CreatePromoCodeDto): Promise<PromoCode> {
    const existing = await this.promoCodeRepository.findOne({ where: { code: createDto.code } });
    if (existing) {
      throw new BadRequestException('Promo code already exists');
    }

    const promoCode = this.promoCodeRepository.create({
      ...createDto,
      validFrom: new Date(createDto.validFrom),
      validUntil: new Date(createDto.validUntil),
    });
    return this.promoCodeRepository.save(promoCode);
  }

  async findAll(): Promise<PromoCode[]> {
    return this.promoCodeRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<PromoCode> {
    const promoCode = await this.promoCodeRepository.findOne({ where: { id } });
    if (!promoCode) {
      throw new NotFoundException(`Promo code with ID ${id} not found`);
    }
    return promoCode;
  }

  async findByCode(code: string): Promise<PromoCode> {
    const promoCode = await this.promoCodeRepository.findOne({ where: { code } });
    if (!promoCode) {
      throw new NotFoundException(`Promo code ${code} not found`);
    }
    return promoCode;
  }

  async validate(code: string, bookingAmount: number): Promise<{ valid: boolean; discount: number }> {
    const promoCode = await this.findByCode(code);
    const now = new Date();

    if (!promoCode.isActive) {
      throw new BadRequestException('Promo code is inactive');
    }

    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      throw new BadRequestException('Promo code is expired or not yet valid');
    }

    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    if (promoCode.minBookingAmount && bookingAmount < promoCode.minBookingAmount) {
      throw new BadRequestException(`Minimum booking amount is ${promoCode.minBookingAmount}`);
    }

    let discount = 0;
    if (promoCode.discountType === PromoCodeDiscountType.PERCENTAGE) {
      discount = (bookingAmount * promoCode.discountValue) / 100;
    } else {
      discount = promoCode.discountValue;
    }

    return { valid: true, discount };
  }

  async incrementUsage(code: string): Promise<PromoCode> {
    const promoCode = await this.findByCode(code);
    promoCode.usageCount += 1;
    return this.promoCodeRepository.save(promoCode);
  }

  async deactivate(id: number): Promise<PromoCode> {
    const promoCode = await this.findOne(id);
    promoCode.isActive = false;
    return this.promoCodeRepository.save(promoCode);
  }
}
