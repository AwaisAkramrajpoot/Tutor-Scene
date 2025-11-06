# Implementation Plan

- [x] 1. Implement service method for fetching tutor sessions





  - Add `findTutorSessions` method to `BookingsService` class in `src/modules/bookings/bookings.service.ts`
  - Use TypeORM QueryBuilder to filter by tutorProfileId, status (CONFIRMED), and startTime > now
  - Include leftJoinAndSelect for student and subject relations
  - Apply pagination with skip/take based on page and limit parameters
  - Return paginated response with data, total, page, limit, and totalPages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4_

-

- [x] 2. Add controller endpoint for tutor sessions







  - Add `getTutorSessions` method to `BookingsController` class in `src/modules/bookings/bookings.controller.ts`
  - Define route as `GET /bookings/tutor/:tutorId/sessions`
  - Use `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` decorators for authentication
  - Use `ParseIntPipe` for tutorId parameter validation
  - Reuse existing `GetStudentSessionsQueryDto` for query parameter validation
  - Call `bookingsService.findTutorSessions()` with extracted parameters
  - Add appropriate Swagger decorators for API documentation
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2_
