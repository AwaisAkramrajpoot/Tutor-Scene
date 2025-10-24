import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('Promo Codes')
@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create promo code (Admin)' })
  @ApiResponse({ status: 201, description: 'Promo code created' })
  async create(@Body() createDto: CreatePromoCodeDto) {
    return this.promoCodesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all promo codes' })
  @ApiResponse({ status: 200, description: 'List of promo codes' })
  async findAll() {
    return this.promoCodesService.findAll();
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate promo code' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validate(@Query('code') code: string, @Query('amount') amount: string) {
    return this.promoCodesService.validate(code, +amount);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get promo code by ID' })
  @ApiResponse({ status: 200, description: 'Promo code details' })
  async findOne(@Param('id') id: string) {
    return this.promoCodesService.findOne(+id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate promo code (Admin)' })
  @ApiResponse({ status: 200, description: 'Promo code deactivated' })
  async deactivate(@Param('id') id: string) {
    return this.promoCodesService.deactivate(+id);
  }
}
