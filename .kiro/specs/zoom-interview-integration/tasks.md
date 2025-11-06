# Implementation Plan

- [x] 1. Set up Zoom configuration and environment variables





  - Add Zoom credentials (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET) to .env file
  - Update .env.example with Zoom configuration template
  - _Requirements: 2.5_

- [x] 2. Create Zoom service for API integration





  - [x] 2.1 Create zoom.service.ts with OAuth authentication

    - Implement getAccessToken() method using Server-to-Server OAuth flow
    - Add token caching logic to prevent unnecessary API calls
    - Handle authentication errors and token expiration
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.2 Implement meeting creation functionality




    - Create createMeeting() method that calls Zoom API
    - Configure meeting settings (host video, participant video, waiting room, etc.)
    - Parse and return meeting details including URLs and password
    - Handle Zoom API errors with descriptive error messages
    - _Requirements: 1.3_
  
  - [x] 2.3 Create TypeScript interfaces for Zoom API responses


    - Define ZoomMeetingResponse interface
    - Define ZoomTokenResponse interface
    - _Requirements: 2.1, 1.3_

- [x] 3. Create interviews module structure






  - [x] 3.1 Generate interviews module, controller, and service

    - Create src/modules/interviews directory structure
    - Generate interviews.module.ts with TypeORM imports
    - Generate interviews.controller.ts with basic structure
    - Generate interviews.service.ts with repository injection
    - _Requirements: 1.1, 3.1, 4.1, 6.1_
  

  - [x] 3.2 Create DTOs for interview endpoints

    - Create schedule-interview.dto.ts with userId and startTime validation
    - Create interview-response.dto.ts for API responses
    - Create update-interview-status.dto.ts with status enum validation
    - _Requirements: 1.1, 6.1_
-

- [x] 4. Implement interview scheduling logic



  - [x] 4.1 Create prospect validation method in interviews.service.ts


    - Implement validateProspectForInterview() to check pending status
    - Check for existing scheduled interviews to prevent duplicates
    - Throw appropriate exceptions for validation failures
    - _Requirements: 1.1, 1.2_
  
  - [x] 4.2 Implement scheduleInterview method


    - Call validateProspectForInterview() to verify prospect eligibility
    - Use ZoomService to create Zoom meeting
    - Save interview record to database with all Zoom meeting details
    - Return complete interview details including URLs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
-

- [x] 5. Create schedule-interview API endpoint




  - [x] 5.1 Implement POST /interviews/schedule-interview endpoint


    - Add @Post('schedule-interview') route in interviews.controller.ts
    - Apply RolesGuard and @Roles(UserRole.ADMIN) decorator for admin-only access
    - Validate request body using ScheduleInterviewDto
    - Call interviewsService.scheduleInterview()
    - Return interview details with proper error handling
    - Add Swagger/OpenAPI documentation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
- [x] 6. Implement interview retrieval endpoints




- [ ] 6. Implement interview retrieval endpoints

  - [x] 6.1 Create GET /interviews/user/:userId endpoint


    - Implement getInterviewByUserId() method in service
    - Add authorization check (admin or own data)
    - Return interview details or 404 if not found
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 6.2 Create GET /interviews/:id/host-url endpoint


    - Implement getHostStartUrl() method in service
    - Verify interview status is "scheduled"
    - Return hostStartUrl for admin to start meeting
    - Apply admin-only authorization
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [x] 6.3 Create GET /interviews/:id/join-url endpoint


    - Implement getParticipantJoinUrl() method in service
    - Verify interview status is "scheduled"
    - Return participantJoinUrl for prospect to join meeting
    - Apply user authentication
    - _Requirements: 4.3, 4.4, 4.5_
-

- [x] 7. Implement interview status management





  - [x] 7.1 Create PATCH /interviews/:id/status endpoint



    - Implement updateInterviewStatus() method in service
    - Validate status transitions (scheduled → completed, scheduled → cancelled)
    - Update status and updatedAt timestamp
    - Apply admin-only authorization
    - Return updated interview record
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_



- [x] 8. Register interviews module in application







  - Import InterviewsModule in app.module.ts
  - Verify module dependencies (TypeORM entities, AuthModule)
  - _Requirements: All_

- [ ]* 9. Write unit tests for Zoom service
  - Mock axios for Zoom API calls
  - Test getAccessToken() success and failure scenarios
  - Test createMeeting() with valid and invalid data
  - Test token caching behavior
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 1.3_

- [ ]* 10. Write unit tests for interviews service
  - Mock repositories and ZoomService
  - Test validateProspectForInterview() with various prospect statuses
  - Test scheduleInterview() success and error scenarios
  - Test duplicate interview prevention
  - Test status update validation
  - Test URL retrieval with status checks
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 11. Write integration tests for interview endpoints
  - Test POST /interviews/schedule-interview with valid and invalid data
  - Test authorization on admin-only endpoints
  - Test interview retrieval endpoints
  - Test status update endpoint
  - Verify database records are created correctly
  - _Requirements: All_

- [x] 12. Add API documentation





  - Add Swagger decorators to all controller endpoints
  - Document request/response schemas
  - Add example requests and responses
  - Document error responses
  - _Requirements: All_
