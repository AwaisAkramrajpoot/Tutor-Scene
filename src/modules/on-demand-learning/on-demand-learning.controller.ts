import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';
import { UserRole } from '@/database/entities/enums';
import { OnDemandLearningService } from './on-demand-learning.service';
import { QueryOnDemandContentDto } from './dto/query-on-demand-content.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';

@ApiTags('On-demand learning')
@Controller('on-demand-learning')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.STUDENT)
export class OnDemandLearningController {
  constructor(private readonly service: OnDemandLearningService) {}

  @Get('featured')
  @ApiOperation({ summary: 'Top 3 most popular content items' })
  getFeatured(@CurrentUser() user: User) {
    return this.service.getFeatured(user.id);
  }

  @Get('filter-options')
  @ApiOperation({ summary: 'Filter dropdown options' })
  getFilterOptions() {
    return this.service.getFilterOptions();
  }

  @Get('content')
  @ApiOperation({ summary: 'List content with filters' })
  listContent(
    @CurrentUser() user: User,
    @Query() query: QueryOnDemandContentDto,
  ) {
    return this.service.listContent(user.id, query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Content grouped by category (preview per type)' })
  getCategories(
    @CurrentUser() user: User,
    @Query() query: QueryOnDemandContentDto,
  ) {
    return this.service.getByCategories(user.id, query);
  }

  @Post('saved/:contentId')
  @ApiOperation({ summary: 'Save content to library' })
  save(
    @CurrentUser() user: User,
    @Param('contentId', ParseIntPipe) contentId: number,
  ) {
    return this.service.toggleSave(user.id, contentId, true);
  }

  @Delete('saved/:contentId')
  @ApiOperation({ summary: 'Remove saved content' })
  unsave(
    @CurrentUser() user: User,
    @Param('contentId', ParseIntPipe) contentId: number,
  ) {
    return this.service.toggleSave(user.id, contentId, false);
  }

  @Get('cart')
  @ApiOperation({ summary: 'Get cart items' })
  getCart(@CurrentUser() user: User) {
    return this.service.getCart(user.id);
  }

  @Get('cart/count')
  @ApiOperation({ summary: 'Cart item count' })
  async getCartCount(@CurrentUser() user: User) {
    const count = await this.service.getCartCount(user.id);
    return { count };
  }

  @Post('cart')
  @ApiOperation({ summary: 'Add content to cart' })
  addToCart(@CurrentUser() user: User, @Body() dto: AddToCartDto) {
    return this.service.addToCart(user.id, dto.contentId);
  }

  @Delete('cart/:contentId')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeFromCart(
    @CurrentUser() user: User,
    @Param('contentId', ParseIntPipe) contentId: number,
  ) {
    return this.service.removeFromCart(user.id, contentId);
  }

  @Delete('cart')
  @ApiOperation({ summary: 'Clear entire cart' })
  clearCart(@CurrentUser() user: User) {
    return this.service.clearCart(user.id);
  }
}
