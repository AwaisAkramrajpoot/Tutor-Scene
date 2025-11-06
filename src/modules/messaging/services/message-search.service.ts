import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Message } from '@/database/entities/message.entity';
import { Conversation } from '@/database/entities/conversation.entity';
import { SearchMessagesDto } from '../dto/search-messages.dto';

export interface SearchResult {
  message: Message;
  conversation: Conversation;
  highlightedContent?: string;
}

export interface PaginatedSearchResults {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class MessageSearchService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  /**
   * Search messages using full-text search, filtered by user's accessible conversations
   * Requirements: 11.1, 11.2, 11.4
   */
  async search(
    userId: number,
    searchDto: SearchMessagesDto,
  ): Promise<PaginatedSearchResults> {
    const { query, page = 1, limit = 20 } = searchDto;

    // Get all conversation IDs where user is a participant
    const userConversations = await this.conversationRepository.find({
      where: [
        { studentId: userId, deletedAt: IsNull() },
        { tutorId: userId, deletedAt: IsNull() },
      ],
      select: ['id'],
    });

    const conversationIds = userConversations.map((conv) => conv.id);

    // If user has no conversations, return empty results
    if (conversationIds.length === 0) {
      return {
        results: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Perform full-text search using PostgreSQL's to_tsvector and to_tsquery
    // Case-insensitive search using ILIKE as fallback for simpler queries
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.conversation', 'conversation')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .leftJoinAndSelect('conversation.student', 'student')
      .leftJoinAndSelect('conversation.tutor', 'tutor')
      .where('message.conversationId IN (:...conversationIds)', {
        conversationIds,
      })
      .andWhere('LOWER(message.content) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Get results and total count
    const [messages, total] = await queryBuilder.getManyAndCount();

    // Build search results with conversation context and highlighted content
    const results: SearchResult[] = messages.map((message) => ({
      message,
      conversation: message.conversation,
      highlightedContent: this.highlightMatches(message.content, query),
    }));

    return {
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Highlight matching text in search results
   * Requirements: 11.4
   */
  private highlightMatches(text: string, query: string): string {
    if (!text || !query) {
      return text;
    }

    // Case-insensitive replacement with highlight markers
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape special regex characters in search query
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
