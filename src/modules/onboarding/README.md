# Onboarding Module

This module handles the tutor onboarding process, including file uploads to S3 storage.

## Features

- Prospect entity with all required fields
- File validation for images, documents, and videos
- S3 storage integration (simulated)
- REST API endpoint for tutor onboarding

## Prospect Entity Fields

1. `subjects` (string, required)
2. `gradeLevels` (string, required)
3. `yearsOfExperience` (integer, required)
4. `teachingPhilosophy` (text, required)
5. `cvUrl` (string, S3 URL for CV document)
6. `introVideoUrl` (string, S3 URL for introduction video)
7. `interviewTime` (DateTime, optional)
8. `fullName` (string, required)
9. `dateOfBirth` (Date, required)
10. `govIdUrl` (string, S3 URL for government ID document)
11. `createdAt` (DateTime, auto-generated)

## File Upload Validation

### Images and Documents (jpg, png, pdf)
- Maximum file size: 2MB

### Videos (mp4, mov, avi)
- Maximum file size: 50MB
- Maximum duration: 2 minutes

## API Endpoint

### Tutor Onboarding

```
POST /onboarding/tutor
Content-Type: multipart/form-data
```

#### Request Fields

- `fullName` (string, required)
- `dateOfBirth` (date, required)
- `subjects` (string, required)
- `gradeLevels` (string, required)
- `yearsOfExperience` (integer, required)
- `teachingPhilosophy` (string, required)
- `interviewTime` (datetime, optional)
- `files` (array of files, up to 5)

#### Response

```json
{
  "prospect": {
    "id": 1,
    "fullName": "John Smith",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "subjects": "Mathematics, Physics",
    "gradeLevels": "High School, College",
    "yearsOfExperience": 5,
    "teachingPhilosophy": "I believe in hands-on learning...",
    "cvUrl": "https://my-bucket.s3.amazonaws.com/cv-12345.pdf",
    "introVideoUrl": "https://my-bucket.s3.amazonaws.com/video-67890.mp4",
    "interviewTime": null,
    "govIdUrl": "https://my-bucket.s3.amazonaws.com/id-54321.jpg",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Tutor onboarding completed successfully"
}
```

## S3 Integration

The file storage service is designed to be scalable and reusable. To use with a real S3 bucket:

1. Set the `S3_BUCKET_URL` environment variable
2. Uncomment the AWS SDK code in [onboarding.service.ts](services/onboarding.service.ts)
3. Install the AWS SDK: `npm install aws-sdk`
4. Configure AWS credentials in your environment

## File Mapping Logic

When files are uploaded, they are automatically mapped to the appropriate fields:
- PDF, JPG, PNG files are treated as documents
  - First document becomes the CV
  - Second document becomes the Government ID
- MP4, MOV, AVI files are treated as videos
  - Video becomes the Introduction Video