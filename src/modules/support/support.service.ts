import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from '@/database/entities/support-ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketStatus } from '@/database/entities/enums';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepository: Repository<SupportTicket>,
  ) {}

  async create(createDto: CreateTicketDto, userId: number): Promise<SupportTicket> {
    const ticket = this.supportTicketRepository.create({
      ...createDto,
      userId,
    });
    return this.supportTicketRepository.save(ticket);
  }

  async findAll(): Promise<SupportTicket[]> {
    return this.supportTicketRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByUser(userId: number): Promise<SupportTicket[]> {
    return this.supportTicketRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SupportTicket> {
    const ticket = await this.supportTicketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Support ticket with ID ${id} not found`);
    }
    return ticket;
  }

  async updateStatus(id: number, status: TicketStatus): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    ticket.status = status;
    if (status === TicketStatus.RESOLVED) {
      ticket.resolvedAt = new Date();
    }
    return this.supportTicketRepository.save(ticket);
  }

  async assignTicket(id: number, assignedTo: number): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    ticket.assignedTo = assignedTo;
    return this.supportTicketRepository.save(ticket);
  }

  async resolveTicket(id: number, resolutionNotes: string): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    ticket.status = TicketStatus.RESOLVED;
    ticket.resolvedAt = new Date();
    ticket.resolutionNotes = resolutionNotes;
    return this.supportTicketRepository.save(ticket);
  }
}
