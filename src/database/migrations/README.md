# Database Migrations

This directory contains TypeORM migrations for the Tutor Scene application.

## Available Migrations

### 1730000000000-CreateMessagingTables.ts
Creates the messaging system tables:
- `message_request` - Stores message requests from students to tutors
- `conversation` - Stores active conversations between students and tutors
- Updates `message` table with new columns for conversation support

## Running Migrations

### Run all pending migrations
```bash
npm run migration:run
```

### Revert the last migration
```bash
npm run migration:revert
```

### Generate a new migration (after entity changes)
```bash
npm run migration:generate -- src/database/migrations/MigrationName
```

## Migration Details

### message_request Table
- Stores initial message requests from students to tutors
- Includes status tracking (pending, accepted, rejected)
- Prevents duplicate active requests with unique partial index
- Cascades on user deletion

### conversation Table
- Created when a message request is accepted
- Links to the originating message request
- Tracks last message timestamp for sorting
- Supports soft deletion with `deleted_at` column
- Cascades on user and message request deletion

### message Table Updates
- Adds `conversation_id` to link messages to conversations
- Adds `attachment_url` for file attachments
- Adds `is_read` and `read_at` for read receipts
- Creates full-text search index on content
- Cascades on conversation deletion

## Indexes

The migration creates the following indexes for performance:

**message_request:**
- `IDX_message_request_student_id` - For student queries
- `IDX_message_request_tutor_id` - For tutor queries
- `IDX_message_request_status` - For status filtering
- `IDX_message_request_unique_active` - Unique partial index for preventing duplicates

**conversation:**
- `IDX_conversation_student_id` - For student queries
- `IDX_conversation_tutor_id` - For tutor queries
- `IDX_conversation_last_message_at` - For sorting by activity
- `IDX_conversation_deleted_at` - For soft delete filtering

**message:**
- `IDX_message_conversation_id` - For conversation queries
- `IDX_message_is_read` - For unread message queries
- `IDX_message_content_search` - Full-text search on content

## Important Notes

1. **synchronize: false** - The database config should have `synchronize: false` in production to prevent automatic schema changes
2. **Backup First** - Always backup your database before running migrations in production
3. **Test Migrations** - Test migrations in a development environment first
4. **Idempotent** - The migration checks for existing columns before adding them to support partial rollouts
5. **Cascading Deletes** - User deletions will cascade to message requests, conversations, and messages

## Troubleshooting

### Migration fails with "relation already exists"
The migration is designed to be idempotent for the message table updates. If tables already exist from `synchronize: true`, you may need to:
1. Set `synchronize: false` in database config
2. Run the migration
3. The migration will skip existing columns

### Need to rollback
```bash
npm run migration:revert
```
This will undo the last migration, dropping the tables and columns created.
