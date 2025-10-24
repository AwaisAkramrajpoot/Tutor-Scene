Tutor Scene - Project Requirements 
1. Executive summary 
Tutor Scene is a safety-first virtual tutoring marketplace where Students/Parents can discover 
and book verified Tutors for live lessons. This project will deliver: 
 A responsive production web app (student and tutor experiences) and native mobile 
apps (React Native). 
 A scalable backend API with Postgres, Redis, S3 and secure Auth. 
 Payment flows using Stripe Connect for marketplace payouts, refunds and platform fees. 
 Video session integrations (Zoom), calendar scheduling with timezone-safety, 
messaging, KYC/background checks, rating & review flows, and a full Admin console for 
moderation, disputes and analytics. 
2. Stakeholders & user roles 
 Student / Guardian: searches tutors, books, pays, attends sessions, messages tutors, 
leaves reviews. 
 Tutor: creates profile, completes KYC/background-check flow, sets availability and 
pricing, accepts bookings, receives payouts. 
 Admin / Moderator: manages users, reviews KYC/background-check results, refunds 
and disputes, runs analytics and content moderation. 
 Platform / Finance: handles Stripe Connect configuration, reserves, payout cadence. 
 Support: customer support agents managing tickets and escalations. 
3. Scope (what I will build) 
3.1 Apps & Interfaces 
 Responsive Web App (production-ready): Discovery, onboarding, profile management, 
booking, payments, video join, messaging, reviews. 
 Admin Dashboard (web): User onboarding approvals, KYC/bkg-check admin, refunds 
& disputes, CMS (policy pages), promo code management, analytics, audit logs. 
 Mobile Apps (React Native): Core flows (search, book, join session, messaging).  
3.2 Backend & Infra 
 API: RESTful or GraphQL (OpenAPI spec), built in Node (Express/Nest). 
 Database: PostgreSQL for relational data; Redis for caching, rate limiting and locking. 
 Storage: S3 for assets (profile photos, recordings if required). 
 Auth: Auth0 / Clerk / Cognito for secure identity and role management. 
 Payments: Stripe Connect (platform + connected accounts). Support payouts, refunds, 
reserves, promo codes, and fees split. 
 Video: Zoom only right now  
 KYC / Background checks: Persona / Stripe Identity, Checkr / Certn (for background 
checks). 
 Deploy & Hosting: AWS. 
 CI/CD: GitHub Actions for build/test/deploy pipelines. 
3.3 Integrations 
 Email: SendGrid (transactional & templates). 
 SMS: Twilio (OTP, booking reminders). 
 Analytics: GA4 + PostHog or Mixpanel. 
 Monitoring & Error Tracking: Sentry. 
 Payments & KYC: Stripe + optional Persona / Checkr. 
4. Core features (detailed user flows) 
4.1 Onboarding & Profiles 
 Sign up / login (email/phone + password, social optional), role selection 
(student/tutor/admin). 
 Tutor onboarding: application -> Pre-req question, resume, basic info -> Interview (Zoom 
meeting) -> admin button (Qualifies, dis- Qualify) -> check (background check - qualify) 
 Student onboarding: basic profile, saved payment methods, family account support 
(parent manages child accounts). 
 Two-factor authentication option for tutors and admins. 
4.2 Discovery & Search 
 Filterable search by subject, grade, language, price, availability. 
 Timezone-aware display of availability slots. 
 Tutor profile pages with intro video, credentials, reviews, cancellation policy and sample 
lessons. 
4.3 Scheduling & Booking 
 Book single or recurring sessions; show tutor availability in user's timezone. 
 Booking flow: select slot → Upload client (student) needs/expectation and send it to tutor 
(Tutor will receive email and SMS) and tutor has to say yes or no → confirm details → 
Stripe checkout (hold or immediate capture depending on policy) → booking confirmed 
email/SMS. 
 Calendar sync (Google Calendar). 
 Booking modification and cancellation rules with refund logic. 
4.4 Payments & Financials 
 Stripe Connect: on-platform payments, platform fee split, payout scheduling to tutors 
(configurable cadence), refunds and reserves support. 
 Promo codes and discounts; promo code redemption tracking. 
 Transaction history for students and tutors. 
 Financial reports / payouts view in Admin. 
4.5 Video Sessions & Recording Consent 
 Generate session join links (Zoom). 
 Recording consent capture from all parties before session start; record consent logs 
(immutable) and retain per policy. 
 Flagging/reporting during or after session; admins can view transcripts/recording per 
policy and legal compliance. 
4.6 Messaging & Notifications 
 In-app messaging (student ↔ tutor) and (Admin ↔ tutor) and (Admin ↔ Student) email 
notifications, SMS reminders. 
 Message moderation (content filters + admin review queue for reported messages). 
4.7 Ratings, Reviews & Moderation 
 Students rate sessions and write reviews; reviews held for moderation if flagged. 
 Ratings and Reviews only for the admin to see, optional reviews go to tutors profile upon 
admin moderation. 
 Admin tools to remove or edit offending content; review analytics for quality scoring. 
4.8 Admin Console 
 User management (search, suspend, role change), Know Your Customer review, 
background-check results, refunds and manual payouts, dispute workflow, promo code 
management, CMS pages, audit logs, analytics dashboards (engagement, bookings, 
revenue). 
 Support ticketing view and incident log. 
5. Data model & API overview (high-level) 
Core entities: User (Student/Tutor/Admin), TutorProfile, Subject, AvailabilitySlot, Booking, 
PaymentTransaction, Refund, Review, Message, KYCRequest, BackgroundCheck, AuditLog, 
PromoCode. 
API surface (examples): 
 POST /auth/signup, POST /auth/login 
 GET /tutors?filters... 
 GET /tutors/:id 
 POST /tutors/:id/bookings 
 POST /payments/checkout (Stripe) 
 GET /admin/bookings, POST /admin/refunds 
 POST /sessions/:id/consent (record consent) 
An OpenAPI spec will be delivered as part of the handover. 
6. Security, privacy and trust & safety details 
 Recording consent: Explicit consent recorded with timestamp and user agent before 
session start. Consent log is immutable and surfaced to Admin on dispute. 
 Background checks: Admin-facing status and summary; raw results from providers 
accessible in secure admin areas (not public). We will use Check for background 
checks but the tutor must pay for the check themselves. So we will need some 
way to process that transaction immediately.  
 Reporting: In-session and post-session reporting, automated triage (safety keywords) 
and manual review route to support. 
 Data access: RBAC enforced; PII masked in logs; DSR endpoints for deletion/export 
requests. 
7. Testing & QA 
 Unit tests, integration tests, and E2E tests (Playwright). Accessibility tests (axe or 
Pa11y) run as part of CI. 
 Load testing on critical APIs prior to production cutover. 
 Manual policy and moderation flows test plan. 
8. DevOps & deployment 
 CI/CD: GitHub Actions with branches: main → production, staging → staging. PR 
checks run tests and static analysis. 
 Secrets: HashiCorp Vault or cloud secret manager. 
 Backups & DR: Daily DB backups and runbooks for failover. 