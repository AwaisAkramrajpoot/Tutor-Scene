# Design Document

## Overview

This feature adds a new API endpoint to the existing bookings module that allows tutors to retrieve their upcoming confirmed sessions. The implementation follows the existing pattern established by the `getStudentSessions` endpoint, ensuring consistency in the codebase.

## Architecture

The feature will be implemented within the existing bookings module structure:

- **Controller Layer**: Add new endpoint in `BookingsController`
- **Service Layer**: Add new method in `BookingsService`
- **DTO Layer**: Reuse existing `GetStudentSessionsQueryDto` for query parameters

The endpoint will follow RESTful conventions and use the existing authentication and authorization infrastructure.

## Components and Interfaces

### API Endpoint

**Route**: `GET /bookings/tutor/:tutorId/sessions`

**Path Parameters**:
- `tutorId` (number, required): The ID of the tutor profile

**Query Parameters**:
- `status` (enum, required): Must be "upcoming" for this implementation
- `page` (number, optional): Page number, defaults to 1
- `limit` (number, optional): Items per page, defaults to 10

**Authentication**: Requires JWT Bearer token

**Response Structure**:
```typescript
{
  data: Booking[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

### Controller Method

```typescript
@Get('tutor/:tutorId/sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get booking sessions for a tutor' })
async getTutorSessions(
  @Param('tutorId', ParseIntPipe) tutorId: number,
  @Query() query: GetStudentSessionsQueryDto,
)
```

### Service Method

```typescript
async findTutorSessions(
  tutorId: number,
  status: 'upcoming' | 'cancelled' | 'completed',
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>
```

The service method will use TypeORM QueryBuilder to:
1. Filter by `tutorProfileId = tutorId`
2. Filter by `status = 'confirmed'` for upcoming sessions
3. Filter by `startTime > now()` for upcoming sessions
4. Include relations: student, subject
5. Order by `startTime ASC`
6. Apply pagination with skip/take

## Data Models

### Existing Entities Used

**Booking Entity**: Contains all necessary fields
- `tutorProfileId`: Used for filtering
- `status`: Used for filtering (BookingStatus.CONFIRMED)
- `startTime`: Used for filtering and ordering
- Relations: `student`, `subject`

**Query DTO**: Reuse `GetStudentSessionsQueryDto`
- Already has validation for status, page, and limit
- Supports 'upcoming', 'cancelled', and 'completed' statuses

## Error Handling

The endpoint will handle the following error scenarios:

1. **Invalid tutorId**: Returns 400 Bad Request (handled by ParseIntPipe)
2. **Missing authentication**: Returns 401 Unauthorized (handled by JwtAuthGuard)
3. **Invalid query parameters**: Returns 400 Bad Request (handled by class-validator)
4. **Database errors**: Returns 500 Internal Server Error (handled by NestJS exception filter)

## Testing Strategy

### Manual Testing
1. Test with valid tutorId and upcoming status
2. Test pagination with different page and limit values
3. Test with tutorId that has no sessions
4. Test with tutorId that has multiple upcoming sessions
5. Test without authentication token
6. Test with invalid tutorId format

### Verification Points
- Verify only confirmed bookings are returned
- Verify only future sessions are returned (startTime > now)
- Verify results are ordered by startTime ascending
- Verify pagination metadata is correct
- Verify related entities (student, subject) are included
