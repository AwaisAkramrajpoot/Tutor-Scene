import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableColumn } from 'typeorm';

export class CreateMessagingTables1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create message_request table
    await queryRunner.createTable(
      new Table({
        name: 'message_request',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'student_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'tutor_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'accepted', 'rejected'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for message_request
    await queryRunner.createIndex(
      'message_request',
      new TableIndex({
        name: 'IDX_message_request_student_id',
        columnNames: ['student_id'],
      }),
    );

    await queryRunner.createIndex(
      'message_request',
      new TableIndex({
        name: 'IDX_message_request_tutor_id',
        columnNames: ['tutor_id'],
      }),
    );

    await queryRunner.createIndex(
      'message_request',
      new TableIndex({
        name: 'IDX_message_request_status',
        columnNames: ['status'],
      }),
    );

    // Create unique partial index for preventing duplicate pending/accepted requests
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_message_request_unique_active" 
      ON "message_request" ("student_id", "tutor_id", "status") 
      WHERE status IN ('pending', 'accepted')
    `);

    // Create foreign keys for message_request
    await queryRunner.createForeignKey(
      'message_request',
      new TableForeignKey({
        columnNames: ['student_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'message_request',
      new TableForeignKey({
        columnNames: ['tutor_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    // Create conversation table
    await queryRunner.createTable(
      new Table({
        name: 'conversation',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'message_request_id',
            type: 'int',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'student_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'tutor_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'last_message_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for conversation
    await queryRunner.createIndex(
      'conversation',
      new TableIndex({
        name: 'IDX_conversation_student_id',
        columnNames: ['student_id'],
      }),
    );

    await queryRunner.createIndex(
      'conversation',
      new TableIndex({
        name: 'IDX_conversation_tutor_id',
        columnNames: ['tutor_id'],
      }),
    );

    await queryRunner.createIndex(
      'conversation',
      new TableIndex({
        name: 'IDX_conversation_last_message_at',
        columnNames: ['last_message_at'],
      }),
    );

    await queryRunner.createIndex(
      'conversation',
      new TableIndex({
        name: 'IDX_conversation_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    // Create foreign keys for conversation
    await queryRunner.createForeignKey(
      'conversation',
      new TableForeignKey({
        columnNames: ['message_request_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'message_request',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversation',
      new TableForeignKey({
        columnNames: ['student_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversation',
      new TableForeignKey({
        columnNames: ['tutor_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    // Update message table - add conversation_id column if it doesn't exist
    const messageTable = await queryRunner.getTable('message');
    const conversationIdColumn = messageTable?.findColumnByName('conversation_id');
    
    if (!conversationIdColumn) {
      await queryRunner.addColumn(
        'message',
        new TableColumn({
          name: 'conversation_id',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    // Add attachment_url column if it doesn't exist
    const attachmentUrlColumn = messageTable?.findColumnByName('attachment_url');
    if (!attachmentUrlColumn) {
      await queryRunner.addColumn(
        'message',
        new TableColumn({
          name: 'attachment_url',
          type: 'varchar',
          length: '500',
          isNullable: true,
        }),
      );
    }

    // Add is_read column if it doesn't exist
    const isReadColumn = messageTable?.findColumnByName('is_read');
    if (!isReadColumn) {
      await queryRunner.addColumn(
        'message',
        new TableColumn({
          name: 'is_read',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
    }

    // Add read_at column if it doesn't exist
    const readAtColumn = messageTable?.findColumnByName('read_at');
    if (!readAtColumn) {
      await queryRunner.addColumn(
        'message',
        new TableColumn({
          name: 'read_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    // Create index for conversation_id on message table
    await queryRunner.createIndex(
      'message',
      new TableIndex({
        name: 'IDX_message_conversation_id',
        columnNames: ['conversation_id'],
      }),
    );

    // Create index for is_read on message table
    await queryRunner.createIndex(
      'message',
      new TableIndex({
        name: 'IDX_message_is_read',
        columnNames: ['is_read'],
      }),
    );

    // Create full-text search index for message content
    await queryRunner.query(`
      CREATE INDEX "IDX_message_content_search" 
      ON "message" 
      USING gin(to_tsvector('english', content))
    `);

    // Create foreign key for conversation_id on message table
    await queryRunner.createForeignKey(
      'message',
      new TableForeignKey({
        columnNames: ['conversation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversation',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys and indexes from message table
    const messageTable = await queryRunner.getTable('message');
    
    if (messageTable) {
      const conversationFk = messageTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('conversation_id') !== -1,
      );
      if (conversationFk) {
        await queryRunner.dropForeignKey('message', conversationFk);
      }

      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_content_search"`);
      await queryRunner.dropIndex('message', 'IDX_message_is_read');
      await queryRunner.dropIndex('message', 'IDX_message_conversation_id');

      await queryRunner.dropColumn('message', 'read_at');
      await queryRunner.dropColumn('message', 'is_read');
      await queryRunner.dropColumn('message', 'attachment_url');
      await queryRunner.dropColumn('message', 'conversation_id');
    }

    // Drop conversation table
    await queryRunner.dropTable('conversation', true);

    // Drop message_request table
    await queryRunner.dropTable('message_request', true);
  }
}
