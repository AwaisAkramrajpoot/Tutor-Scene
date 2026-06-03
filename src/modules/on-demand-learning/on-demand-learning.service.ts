import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import {
  OnDemandContent,
  OnDemandContentType,
} from '@/database/entities/on-demand-content.entity';
import { OnDemandContentSaved } from '@/database/entities/on-demand-content-saved.entity';
import { OnDemandCartItem } from '@/database/entities/on-demand-cart-item.entity';
import { QueryOnDemandContentDto } from './dto/query-on-demand-content.dto';

export interface ContentItemDto {
  id: number;
  title: string;
  description: string | null;
  contentType: OnDemandContentType;
  subject: string;
  gradeLevel: string;
  durationMinutes: number;
  pricePerMinute: number;
  fileType: string;
  thumbnailUrl: string | null;
  tutorName: string;
  tutorAvatarUrl: string | null;
  popularityCount: number;
  isSaved: boolean;
  inCart: boolean;
}

@Injectable()
export class OnDemandLearningService {
  constructor(
    @InjectRepository(OnDemandContent)
    private readonly contentRepo: Repository<OnDemandContent>,
    @InjectRepository(OnDemandContentSaved)
    private readonly savedRepo: Repository<OnDemandContentSaved>,
    @InjectRepository(OnDemandCartItem)
    private readonly cartRepo: Repository<OnDemandCartItem>,
  ) {}

  private toDto(
    row: OnDemandContent,
    savedIds: Set<number>,
    cartIds: Set<number>,
  ): ContentItemDto {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      contentType: row.contentType,
      subject: row.subject,
      gradeLevel: row.gradeLevel,
      durationMinutes: row.durationMinutes,
      pricePerMinute: Number(row.pricePerMinute),
      fileType: row.fileType,
      thumbnailUrl: row.thumbnailUrl,
      tutorName: row.tutorName,
      tutorAvatarUrl: row.tutorAvatarUrl,
      popularityCount: row.popularityCount,
      isSaved: savedIds.has(row.id),
      inCart: cartIds.has(row.id),
    };
  }

  private async getUserMeta(userId: number) {
    const [savedRows, cartRows] = await Promise.all([
      this.savedRepo.find({ where: { userId }, select: ['contentId'] }),
      this.cartRepo.find({ where: { userId }, select: ['contentId'] }),
    ]);
    return {
      savedIds: new Set(savedRows.map((r) => r.contentId)),
      cartIds: new Set(cartRows.map((r) => r.contentId)),
    };
  }

  async getFeatured(userId: number): Promise<ContentItemDto[]> {
    const { savedIds, cartIds } = await this.getUserMeta(userId);
    const rows = await this.contentRepo.find({
      where: { isActive: true },
      order: { popularityCount: 'DESC' },
      take: 3,
    });
    return rows.map((r) => this.toDto(r, savedIds, cartIds));
  }

  async listContent(
    userId: number,
    query: QueryOnDemandContentDto,
  ): Promise<{ items: ContentItemDto[]; total: number }> {
    const { savedIds, cartIds } = await this.getUserMeta(userId);
    const qb = this.contentRepo
      .createQueryBuilder('c')
      .where('c.is_active = :active', { active: true });

    if (query.type) {
      qb.andWhere('c.content_type = :type', { type: query.type });
    }
    if (query.subject?.trim()) {
      qb.andWhere('LOWER(c.subject) = LOWER(:subject)', {
        subject: query.subject.trim(),
      });
    }
    if (query.gradeLevel?.trim()) {
      qb.andWhere('LOWER(c.grade_level) = LOWER(:gradeLevel)', {
        gradeLevel: query.gradeLevel.trim(),
      });
    }
    if (query.fileType?.trim()) {
      qb.andWhere('LOWER(c.file_type) = LOWER(:fileType)', {
        fileType: query.fileType.trim(),
      });
    }
    if (query.search?.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('LOWER(c.title) LIKE :term', { term })
            .orWhere('LOWER(c.description) LIKE :term', { term })
            .orWhere('LOWER(c.subject) LIKE :term', { term })
            .orWhere('LOWER(c.tutor_name) LIKE :term', { term });
        }),
      );
    }
    if (query.duration === 'under_15') {
      qb.andWhere('c.duration_minutes < 15');
    } else if (query.duration === '15_30') {
      qb.andWhere('c.duration_minutes >= 15 AND c.duration_minutes <= 30');
    } else if (query.duration === 'over_30') {
      qb.andWhere('c.duration_minutes > 30');
    }
    if (query.price === 'under_5') {
      qb.andWhere('c.price_per_minute < 5');
    } else if (query.price === '5_10') {
      qb.andWhere('c.price_per_minute >= 5 AND c.price_per_minute <= 10');
    } else if (query.price === 'over_10') {
      qb.andWhere('c.price_per_minute > 10');
    }
    if (query.saved === 'true') {
      if (savedIds.size === 0) {
        return { items: [], total: 0 };
      }
      qb.andWhere('c.id IN (:...savedIds)', { savedIds: [...savedIds] });
    }

    qb.orderBy('c.popularity_count', 'DESC').addOrderBy('c.title', 'ASC');
    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((r) => this.toDto(r, savedIds, cartIds)),
      total,
    };
  }

  async getByCategories(userId: number, query: QueryOnDemandContentDto) {
    const types: OnDemandContentType[] = [
      OnDemandContentType.VIDEO,
      OnDemandContentType.PDF,
      OnDemandContentType.WORKSHEET,
      OnDemandContentType.QUIZ,
    ];
    const categories: Record<string, ContentItemDto[]> = {};
    for (const type of types) {
      const { items } = await this.listContent(userId, { ...query, type });
      categories[type] = items.slice(0, 6);
    }
    return { categories };
  }

  async getFilterOptions() {
    const rows = await this.contentRepo.find({
      where: { isActive: true },
      select: ['subject', 'gradeLevel', 'fileType'],
    });
    const subjects = [...new Set(rows.map((r) => r.subject))].sort();
    const gradeLevels = [...new Set(rows.map((r) => r.gradeLevel))].sort();
    const fileTypes = [...new Set(rows.map((r) => r.fileType))].sort();
    return {
      subjects,
      gradeLevels,
      fileTypes,
      durations: [
        { value: 'under_15', label: 'Under 15 min' },
        { value: '15_30', label: '15–30 min' },
        { value: 'over_30', label: 'Over 30 min' },
      ],
      prices: [
        { value: 'under_5', label: 'Under $5/min' },
        { value: '5_10', label: '$5–$10/min' },
        { value: 'over_10', label: 'Over $10/min' },
      ],
    };
  }

  async toggleSave(userId: number, contentId: number, save: boolean) {
    await this.ensureContent(contentId);
    if (save) {
      const existing = await this.savedRepo.findOne({
        where: { userId, contentId },
      });
      if (!existing) {
        await this.savedRepo.save(this.savedRepo.create({ userId, contentId }));
      }
      return { saved: true };
    }
    await this.savedRepo.delete({ userId, contentId });
    return { saved: false };
  }

  async getCart(userId: number) {
    const items = await this.cartRepo.find({
      where: { userId },
      relations: ['content'],
      order: { createdAt: 'DESC' },
    });
    const { savedIds } = await this.getUserMeta(userId);
    return {
      items: items
        .filter((i) => i.content?.isActive)
        .map((i) => ({
          cartItemId: i.id,
          ...this.toDto(i.content, savedIds, new Set([i.contentId])),
        })),
      count: items.length,
    };
  }

  async getCartCount(userId: number): Promise<number> {
    return this.cartRepo.count({ where: { userId } });
  }

  async addToCart(userId: number, contentId: number) {
    await this.ensureContent(contentId);
    const existing = await this.cartRepo.findOne({
      where: { userId, contentId },
    });
    if (!existing) {
      await this.cartRepo.save(
        this.cartRepo.create({ userId, contentId }),
      );
    }
    return this.getCart(userId);
  }

  async removeFromCart(userId: number, contentId: number) {
    await this.cartRepo.delete({ userId, contentId });
    return this.getCart(userId);
  }

  async clearCart(userId: number) {
    await this.cartRepo.delete({ userId });
    return { items: [], count: 0 };
  }

  private async ensureContent(contentId: number) {
    const row = await this.contentRepo.findOne({
      where: { id: contentId, isActive: true },
    });
    if (!row) {
      throw new NotFoundException('Content not found');
    }
    return row;
  }
}
