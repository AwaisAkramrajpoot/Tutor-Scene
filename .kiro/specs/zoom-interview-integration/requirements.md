# Requirements Document

## Introduction

This document outlines the requirements for integrating Zoom video conferencing into the tutoring platform to enable admin-conducted interviews with prospective tutors. The system will allow admins to schedule Zoom interviews with prospects who have a "pending" status, store meeting details in the database, and facilitate in-app interview sessions.

## Glossary

- **Zoom_Integration_System**: The module responsible for authenticating with Zoom API, creating meetings, and managing Zoom credentials
- **Interview_Scheduling_System**: The component that handles scheduling interviews with prospects and storing meeting information
- **Prospect**: A user who has applied to become a tutor and is awaiting approval
- **Admin**: A user with administrative privileges who conducts interviews with prospects
- **Meeting_Record**: A database entry containing Zoom meeting details including meeting ID, URLs, and passwords
- **Zoom_API**: The Zoom REST API used for creating and managing meetings
- **Server_to_Server_OAuth**: Zoom's OAuth 2.0 authentication method for server applications

## Requirements

### Requirement 1

**User Story:** As an admin, I want to schedule Zoom interviews with pending prospects, so that I can conduct video interviews before approving them as tutors

#### Acceptance Criteria

1. WHEN an admin requests to schedule an interview with a userId, THE Interview_Scheduling_System SHALL verify that a prospect record exists with status "pending" for that userId
2. IF no prospect record exists with status "pending" for the provided userId, THEN THE Interview_Scheduling_System SHALL return an error response with status code 404
3. WHEN a valid pending prospect is found, THE Interview_Scheduling_System SHALL create a Zoom meeting via the Zoom_API
4. WHEN the Zoom meeting is created successfully, THE Interview_Scheduling_System SHALL store the meeting details in the interview table including zoomMeetingId, hostStartUrl, participantJoinUrl, meetingPassword, startTime, and status
5. THE Interview_Scheduling_System SHALL return the created interview record with all meeting details to the admin

### Requirement 2

**User Story:** As a system administrator, I want the application to authenticate with Zoom using Server-to-Server OAuth, so that the system can create meetings without user intervention

#### Acceptance Criteria

1. THE Zoom_Integration_System SHALL authenticate with Zoom_API using Account ID, Client ID, and Client Secret stored in environment variables
2. THE Zoom_Integration_System SHALL obtain an access token from Zoom_API before making any meeting creation requests
3. IF authentication fails, THEN THE Zoom_Integration_System SHALL return an error response with status code 500 and a descriptive error message
4. THE Zoom_Integration_System SHALL handle token expiration and automatically refresh tokens when needed
5. THE Zoom_Integration_System SHALL securely store Zoom credentials in environment variables and never expose them in API responses

### Requirement 3

**User Story:** As an admin, I want to retrieve scheduled interview details, so that I can access the meeting URLs and start interviews

#### Acceptance Criteria

1. WHEN an admin requests interview details by userId, THE Interview_Scheduling_System SHALL retrieve the interview record from the database
2. THE Interview_Scheduling_System SHALL return the hostStartUrl for admins to start the meeting
3. THE Interview_Scheduling_System SHALL return the participantJoinUrl for prospects to join the meeting
4. IF no interview record exists for the userId, THEN THE Interview_Scheduling_System SHALL return an error response with status code 404
5. THE Interview_Scheduling_System SHALL include meeting status (scheduled, completed, cancelled) in the response

### Requirement 4

**User Story:** As an admin, I want to start a Zoom interview from within the application, so that I can conduct interviews without leaving the platform

#### Acceptance Criteria

1. WHEN an admin requests to start an interview, THE Interview_Scheduling_System SHALL retrieve the hostStartUrl from the interview record
2. THE Interview_Scheduling_System SHALL return the hostStartUrl to enable the admin to launch the Zoom meeting
3. WHEN a prospect requests to join an interview, THE Interview_Scheduling_System SHALL retrieve the participantJoinUrl from the interview record
4. THE Interview_Scheduling_System SHALL verify that the interview status is "scheduled" before allowing access to meeting URLs
5. IF the interview status is "cancelled" or "completed", THEN THE Interview_Scheduling_System SHALL return an error response with status code 400

### Requirement 5

**User Story:** As a developer, I want the interview table to store all necessary Zoom meeting information, so that meetings can be accessed and managed throughout their lifecycle

#### Acceptance Criteria

1. THE Interview_Scheduling_System SHALL store userId as a foreign key reference to the user table
2. THE Interview_Scheduling_System SHALL store zoomMeetingId as a unique identifier for the Zoom meeting
3. THE Interview_Scheduling_System SHALL store hostStartUrl as a text field for the admin's meeting start URL
4. THE Interview_Scheduling_System SHALL store participantJoinUrl as a text field for the prospect's join URL
5. THE Interview_Scheduling_System SHALL store meetingPassword as a varchar field for meeting security
6. THE Interview_Scheduling_System SHALL store startTime as a timestamp for the scheduled meeting time
7. THE Interview_Scheduling_System SHALL store status as an enum with values: scheduled, completed, cancelled

### Requirement 6

**User Story:** As an admin, I want to update interview status after completion, so that the system reflects the current state of each interview

#### Acceptance Criteria

1. WHEN an admin marks an interview as completed, THE Interview_Scheduling_System SHALL update the status field to "completed"
2. WHEN an admin cancels an interview, THE Interview_Scheduling_System SHALL update the status field to "cancelled"
3. THE Interview_Scheduling_System SHALL validate that only valid status transitions are allowed (scheduled → completed, scheduled → cancelled)
4. THE Interview_Scheduling_System SHALL update the updatedAt timestamp when status changes
5. IF an invalid status transition is requested, THEN THE Interview_Scheduling_System SHALL return an error response with status code 400
