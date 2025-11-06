# Requirements Document

## Introduction

This feature adds an API endpoint to fetch upcoming booking sessions for tutors. The endpoint will allow tutors to view their confirmed sessions that are scheduled in the future, helping them manage their teaching schedule.

## Glossary

- **Booking System**: The system that manages tutoring session bookings between students and tutors
- **Tutor**: A user who provides tutoring services
- **Booking Session**: A scheduled tutoring session with a specific start time, end time, and status
- **Confirmed Status**: A booking status indicating the session has been accepted by the tutor and paid for by the student

## Requirements

### Requirement 1

**User Story:** As a tutor, I want to fetch my upcoming confirmed sessions, so that I can see my teaching schedule

#### Acceptance Criteria

1. WHEN a GET request is made to the tutor sessions endpoint with a tutorId parameter, THE Booking System SHALL return all booking records where tutorProfileId matches the provided tutorId
2. THE Booking System SHALL filter booking records to include only those with status equal to "confirmed"
3. THE Booking System SHALL filter booking records to include only those where startTime is greater than the current date and time
4. THE Booking System SHALL order the returned booking records by startTime in ascending order
5. THE Booking System SHALL include related tutor, student, and subject information in the response

### Requirement 2

**User Story:** As a tutor, I want the API to be protected by authentication, so that only authorized users can access session data

#### Acceptance Criteria

1. THE Booking System SHALL require a valid JWT authentication token for accessing the tutor sessions endpoint
2. THE Booking System SHALL return a 401 Unauthorized response when no valid authentication token is provided

### Requirement 3

**User Story:** As a tutor, I want to receive paginated results, so that I can efficiently load large lists of sessions

#### Acceptance Criteria

1. THE Booking System SHALL accept optional page and limit query parameters for pagination
2. THE Booking System SHALL default to page 1 and limit 10 when pagination parameters are not provided
3. THE Booking System SHALL return pagination metadata including total count, current page, limit, and total pages
4. THE Booking System SHALL calculate the correct offset based on the page and limit parameters
