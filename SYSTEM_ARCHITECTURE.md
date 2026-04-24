# SYSTEM ARCHITECTURE DOCUMENT
## Coffee Cupping Event Management System

**Project Name:** Coffee Cupping Event Management System  
**Architecture Version:** 1.0  
**Date:** April 23, 2026  
**Document Type:** Technical Architecture

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Architecture](#database-architecture)
5. [API Architecture](#api-architecture)
6. [Data Flow](#data-flow)
7. [Technology Stack](#technology-stack)
8. [Deployment Architecture](#deployment-architecture)

---

## SYSTEM OVERVIEW

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Web Browsers (Chrome, Firefox, Safari)                 │  │
│  │  - Farmer Dashboard                                     │  │
│  │  - Admin Dashboard                                      │  │
│  │  - Head Judge Dashboard                                │  │
│  │  - Q-Grader Dashboard                                   │  │
│  │  - Public Leaderboard                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTPS / REST API / WebSocket
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                    APPLICATION TIER                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Express.js Backend Server                        │  │
│  │  - Authentication & Authorization (Supabase)           │  │
│  │  - REST API Endpoints                                   │  │
│  │  - Business Logic Services                             │  │
│  │  - Data Validation & Processing                        │  │
│  │  - Notification Service                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Prisma ORM
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                     DATA TIER                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        PostgreSQL Database (Supabase)                   │  │
│  │  - Events & Participants                                │  │
│  │  - Samples & Blind Codes                                │  │
│  │  - Users & Roles                                        │  │
│  │  - Scores & Results                                    │  │
│  │  - Audit Logs                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### System Components

| Component | Purpose | Technology |
|-----------|---------|-----------|
| **Frontend** | User Interface | React 18+, TypeScript, Vite |
| **Backend** | Business Logic & API | Express.js, Node.js, TypeScript |
| **Database** | Data Persistence | PostgreSQL (Supabase) |
| **Authentication** | User Identity & Security | Supabase Auth (JWT) |
| **File Storage** | Image & Document Storage | Supabase Storage |
| **Email Service** | Notifications | SendGrid / SMTP |

---

## FRONTEND ARCHITECTURE

### Frontend Layer Structure

```
Frontend Application
│
├── components/
│   ├── admin/
│   │   ├── EventCreationWizard.tsx
│   │   ├── EventManagementModal.tsx
│   │   ├── EventEditModal.tsx
│   │   ├── EventParticipantsModal.tsx
│   │   ├── UserManagement.tsx
│   │   └── UserProfile.tsx
│   │
│   ├── dashboards/
│   │   ├── AdminDashboard.tsx
│   │   ├── FarmerDashboard.tsx
│   │   ├── HeadJudgeDashboard.tsx
│   │   └── QGraderDashboard.tsx
│   │
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── supabaseClient.ts
│   │
│   ├── reporting/
│   │   ├── Certificate.tsx
│   │   ├── PublicLeaderboard.tsx
│   │   └── SampleReport.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── DropdownMenu.tsx
│       ├── Header.tsx
│       └── Label.tsx
│
├── hooks/
│   ├── useEventData.ts
│   ├── useUserAuth.ts
│   ├── useSampleSubmission.ts
│   └── useNotification.ts
│
├── utils/
│   ├── api.ts (API calls)
│   ├── validation.ts
│   ├── formatting.ts
│   └── helpers.ts
│
├── types.ts (TypeScript types)
├── App.tsx (Main component)
└── index.tsx (Entry point)
```

### Frontend Technology Stack

**Framework & Language:**
- React 18+ (UI Framework)
- TypeScript (Type Safety)
- Vite (Build Tool)

**State Management:**
- React Hooks (useState, useContext, useReducer)
- Local State for UI
- Context API for global state

**Styling:**
- CSS Modules
- Inline styles
- Responsive design

**HTTP Client:**
- Fetch API / Axios
- Custom API wrapper in utils/api.ts

**Authentication:**
- Supabase Auth Client
- JWT Token Storage
- Session Management

### Frontend Component Hierarchy

```
App (Root)
│
├── LoginScreen (if not authenticated)
│   └── Supabase Auth UI
│
└── MainApp (if authenticated)
    ├── Header (Navigation)
    │   ├── User Profile
    │   └── Logout Button
    │
    ├── Navigation Menu (Role-based)
    │   ├── Admin Links
    │   ├── Farmer Links
    │   ├── Judge Links
    │   └── Q-Grader Links
    │
    └── Dashboard (based on role)
        ├── AdminDashboard
        │   ├── EventCreationWizard
        │   ├── EventManagementModal
        │   ├── UserManagement
        │   └── SampleApprovalPanel
        │
        ├── FarmerDashboard
        │   ├── EventRegistration
        │   ├── SampleSubmissionForm
        │   ├── BulkUploadCSV
        │   └── MySubmissions
        │
        ├── HeadJudgeDashboard
        │   ├── CuppingSession
        │   ├── ScoringInterface
        │   ├── EventResults
        │   └── PublishLeaderboard
        │
        └── QGraderDashboard
            ├── MyAssignments
            ├── ScoringForm
            ├── ScoreHistory
            └── Calibration
```

### Frontend Data Flow

```
User Interaction
      │
      ▼
Event Handler (onClick, onChange, etc.)
      │
      ▼
State Update (useState)
      │
      ▼
API Call (utils/api.ts)
      │
      ▼
Express Backend
      │
      ▼
Response
      │
      ▼
State Update with Response Data
      │
      ▼
Component Re-render
      │
      ▼
UI Update (Display to User)
```

---

## BACKEND ARCHITECTURE

### Backend Layer Structure

```
Backend Application (Express.js)
│
├── routes/
│   ├── events.ts
│   │   ├── POST /api/events (create)
│   │   ├── GET /api/events (list)
│   │   ├── GET /api/events/:id (details)
│   │   ├── PUT /api/events/:id (update)
│   │   └── DELETE /api/events/:id (delete)
│   │
│   ├── samples.ts
│   │   ├── POST /api/samples (create)
│   │   ├── GET /api/samples (list)
│   │   ├── GET /api/samples/:id (details)
│   │   ├── POST /api/samples/:id/approve (approve)
│   │   ├── POST /api/samples/:id/reject (reject)
│   │   └── POST /api/samples/bulk-upload (CSV)
│   │
│   ├── users.ts
│   │   ├── POST /api/users (register)
│   │   ├── GET /api/users (list)
│   │   ├── GET /api/users/:id (details)
│   │   ├── PUT /api/users/:id (update)
│   │   └── DELETE /api/users/:id (delete)
│   │
│   ├── scores.ts
│   │   ├── POST /api/scores (submit score)
│   │   ├── GET /api/scores (list)
│   │   └── GET /api/events/:id/results (event results)
│   │
│   └── auth.ts
│       ├── POST /api/auth/login
│       ├── POST /api/auth/logout
│       └── POST /api/auth/refresh
│
├── controllers/
│   ├── eventController.ts
│   ├── sampleController.ts
│   ├── userController.ts
│   ├── scoreController.ts
│   └── authController.ts
│
├── services/
│   ├── eventService.ts
│   ├── sampleService.ts
│   ├── userService.ts
│   ├── scoreService.ts
│   ├── authService.ts
│   ├── notificationService.ts
│   └── validationService.ts
│
├── middleware/
│   ├── authentication.ts
│   ├── authorization.ts
│   ├── errorHandler.ts
│   ├── requestValidator.ts
│   └── logging.ts
│
├── utils/
│   ├── database.ts
│   ├── helpers.ts
│   └── constants.ts
│
├── types/
│   └── index.ts (TypeScript interfaces)
│
├── server.js (Main entry point)
└── config/ (Configuration files)
```

### Backend Technology Stack

**Runtime & Framework:**
- Node.js (Runtime)
- Express.js (Web Framework)
- TypeScript (Type Safety)

**Database:**
- Prisma ORM (Database Access)
- PostgreSQL (Database Engine)

**Authentication:**
- Supabase Auth (Identity Provider)
- JWT (Token-based Auth)

**Validation & Processing:**
- Custom validation middleware
- Data sanitization

**Error Handling:**
- Custom error classes
- Centralized error handling middleware

### Backend Request/Response Flow

```
HTTP Request
      │
      ▼
Express Router
      │
      ▼
Middleware Stack
├── Authentication Check
├── Authorization Check
├── Request Validation
└── Logging
      │
      ▼
Route Handler (Controller)
      │
      ▼
Business Logic (Service)
      │
      ▼
Database Query (Prisma)
      │
      ▼
PostgreSQL Database
      │
      ▼
Response Processing
      │
      ▼
HTTP Response (JSON)
```

### Key Backend Services

**EventService:**
- Create/Update/Delete events
- Manage participants
- Handle invitations
- Track status transitions

**SampleService:**
- Create/Update/Delete samples
- Validate sample data
- Generate blind codes
- Handle approvals/rejections
- Support bulk upload

**UserService:**
- Manage user profiles
- Handle role assignments
- Track user status

**ScoreService:**
- Record judge scores
- Aggregate multiple judge scores
- Calculate rankings
- Generate reports

**NotificationService:**
- Send emails to participants
- Notify on sample approval/rejection
- Send event reminders
- Publish results

---

## DATABASE ARCHITECTURE

### Database Schema Overview

```
┌─────────────────────────────────────────┐
│            Core Models                   │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ CuppingEvent                       │ │
│  ├────────────────────────────────────┤ │
│  │ id: String (PK)                    │ │
│  │ name: String                       │ │
│  │ date: DateTime                     │ │
│  │ location: String                   │ │
│  │ status: String                     │ │
│  │ maxParticipants: Int               │ │
│  │ createdAt: DateTime                │ │
│  │ updatedAt: DateTime                │ │
│  └────────────────────────────────────┘ │
│           │                              │
│           ├─→ Participant (1:M)         │
│           └─→ Sample (1:M)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Participant Models              │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ User                               │ │
│  ├────────────────────────────────────┤ │
│  │ id: String (PK)                    │ │
│  │ email: String (Unique)             │ │
│  │ name: String                       │ │
│  │ role: String (ADMIN, FARMER, etc.) │ │
│  │ status: String                     │ │
│  │ createdAt: DateTime                │ │
│  └────────────────────────────────────┘ │
│           │                              │
│           └─→ Participant (1:M)         │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ Participant                        │ │
│  ├────────────────────────────────────┤ │
│  │ id: String (PK)                    │ │
│  │ userId: String (FK)                │ │
│  │ eventId: String (FK)               │ │
│  │ role: String                       │ │
│  │ status: String                     │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Sample Models                   │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ Sample                             │ │
│  ├────────────────────────────────────┤ │
│  │ id: String (PK)                    │ │
│  │ sampleName: String                 │ │
│  │ sampleType: String                 │ │
│  │ blindCode: String (Unique)         │ │
│  │ moisture: Float (Optional)         │ │
│  │ altitude: String                   │ │
│  │ approvalStatus: String             │ │
│  │ cuppingEventId: String (FK)        │ │
│  │ createdAt: DateTime                │ │
│  │ updatedAt: DateTime                │ │
│  └────────────────────────────────────┘ │
│           │                              │
│           └─→ Score (1:M)               │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ Score                              │ │
│  ├────────────────────────────────────┤ │
│  │ id: String (PK)                    │ │
│  │ sampleId: String (FK)              │ │
│  │ judgeName: String                  │ │
│  │ aroma: Float                       │ │
│  │ flavor: Float                      │ │
│  │ aftertaste: Float                  │ │
│  │ acidity: Float                     │ │
│  │ body: Float                        │ │
│  │ balance: Float                     │ │
│  │ overall: Float                     │ │
│  │ defects: Int                       │ │
│  │ tastingNotes: String               │ │
│  │ submittedAt: DateTime              │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Detailed Schema Definitions

#### CuppingEvent Table
```sql
CREATE TABLE cupping_events (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    maxParticipants INT DEFAULT 50,
    status VARCHAR(50) DEFAULT 'PENDING',
    -- Status: PENDING, ACTIVE, JUDGING, COMPLETED, CANCELLED
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_date (date)
);
```

#### User Table
```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    -- Role: ADMIN, HEAD_JUDGE, Q_GRADER, FARMER
    status VARCHAR(50) DEFAULT 'ACTIVE',
    -- Status: ACTIVE, INACTIVE, SUSPENDED
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_email (email)
);
```

#### Participant Table
```sql
CREATE TABLE participants (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    eventId VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'INVITED',
    -- Status: INVITED, ACCEPTED, REJECTED, ATTENDED
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_event (userId, eventId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (eventId) REFERENCES cupping_events(id) ON DELETE CASCADE,
    INDEX idx_eventId (eventId),
    INDEX idx_userId (userId),
    INDEX idx_status (status)
);
```

#### Sample Table
```sql
CREATE TABLE samples (
    id VARCHAR(255) PRIMARY KEY,
    sampleName VARCHAR(255) NOT NULL,
    sampleType VARCHAR(50) NOT NULL,
    -- Type: FARMER_REGISTERED, FARMER_DIRECTREGISTERED
    blindCode VARCHAR(50) UNIQUE,
    moisture FLOAT,
    altitude VARCHAR(100),
    origin VARCHAR(255),
    approvalStatus VARCHAR(50) DEFAULT 'PENDING',
    -- Status: PENDING, APPROVED, REJECTED
    approvedByAdminId VARCHAR(255),
    approvalDate TIMESTAMP,
    cuppingEventId VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuppingEventId) REFERENCES cupping_events(id) ON DELETE CASCADE,
    INDEX idx_cuppingEventId (cuppingEventId),
    INDEX idx_approvalStatus (approvalStatus),
    INDEX idx_blindCode (blindCode),
    INDEX idx_sampleType (sampleType)
);
```

#### Score Table
```sql
CREATE TABLE scores (
    id VARCHAR(255) PRIMARY KEY,
    sampleId VARCHAR(255) NOT NULL,
    judgeName VARCHAR(255) NOT NULL,
    aroma FLOAT NOT NULL,
    flavor FLOAT NOT NULL,
    aftertaste FLOAT NOT NULL,
    acidity FLOAT NOT NULL,
    body FLOAT NOT NULL,
    balance FLOAT NOT NULL,
    overall FLOAT NOT NULL,
    defects INT DEFAULT 0,
    tastingNotes TEXT,
    submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sampleId) REFERENCES samples(id) ON DELETE CASCADE,
    INDEX idx_sampleId (sampleId),
    INDEX idx_judgeName (judgeName)
);
```

### Database Relationships

| Relationship | Type | Description |
|-------------|------|-------------|
| CuppingEvent → Participant | 1:M | One event has many participants |
| CuppingEvent → Sample | 1:M | One event has many samples |
| User → Participant | 1:M | One user in many events as participant |
| Sample → Score | 1:M | One sample scored by many judges |

### Data Integrity Constraints

**Primary Keys:**
- All tables use UUID/CUID as primary key

**Foreign Keys:**
- Referential integrity enforced
- Cascade delete for dependent records

**Unique Constraints:**
- User email is unique
- Blind codes are unique
- User-Event participation is unique

**Default Values:**
- Status fields default to initial state
- Timestamps default to current time

---

## API ARCHITECTURE

### REST API Endpoints

#### Authentication Endpoints
```
POST   /api/auth/login              - User login
POST   /api/auth/logout             - User logout
POST   /api/auth/refresh            - Refresh JWT token
GET    /api/auth/me                 - Get current user
```

#### Event Management Endpoints
```
GET    /api/events                  - List all events
POST   /api/events                  - Create event
GET    /api/events/:id              - Get event details
PUT    /api/events/:id              - Update event
DELETE /api/events/:id              - Delete event
GET    /api/events/:id/participants - Get event participants
POST   /api/events/:id/invite       - Invite participants
GET    /api/events/:id/samples      - Get event samples
```

#### Sample Management Endpoints
```
GET    /api/samples                 - List samples
POST   /api/samples                 - Create sample
GET    /api/samples/:id             - Get sample details
PUT    /api/samples/:id             - Update sample
DELETE /api/samples/:id             - Delete sample
POST   /api/samples/:id/approve     - Approve sample
POST   /api/samples/:id/reject      - Reject sample
POST   /api/samples/bulk-upload     - Bulk upload CSV
```

#### Scoring Endpoints
```
GET    /api/scores                  - List scores
POST   /api/scores                  - Submit score
GET    /api/scores/:sampleId        - Get sample scores
GET    /api/events/:id/results      - Get event results
GET    /api/events/:id/leaderboard  - Get leaderboard
```

#### User Management Endpoints
```
GET    /api/users                   - List users
POST   /api/users                   - Create user
GET    /api/users/:id               - Get user details
PUT    /api/users/:id               - Update user
DELETE /api/users/:id               - Delete user
GET    /api/users/:id/events        - Get user's events
```

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "event_123",
    "name": "Coffee Cupping Q2 2026",
    "date": "2026-05-15T10:00:00Z"
  },
  "timestamp": "2026-04-23T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Event not found",
  "code": "NOT_FOUND",
  "timestamp": "2026-04-23T10:30:00Z"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## DATA FLOW

### Complete User Journey - Sample Submission

```
1. FARMER LOGIN
   ├─ Frontend: User enters credentials
   ├─ Backend: Validates with Supabase Auth
   └─ Frontend: Store JWT token, redirect to dashboard

2. EVENT REGISTRATION
   ├─ Frontend: Display available events
   ├─ Farmer: Select and click "Register"
   ├─ Backend: POST /api/events/:id/register
   ├─ Database: Add Participant record
   └─ Notification: Send confirmation email

3. SAMPLE SUBMISSION
   ├─ Frontend: Display submission form
   ├─ Farmer: Fill sample details
   ├─ Frontend: Client-side validation
   ├─ Farmer: Click "Submit"
   ├─ Backend: POST /api/samples
   │   ├─ Server-side validation
   │   ├─ Check for duplicates
   │   ├─ Determine sample type
   │   └─ Create Sample record (status: PENDING)
   ├─ Database: Insert sample
   └─ Notification: Send confirmation email

4. ADMIN APPROVAL
   ├─ Admin: Login and view pending samples
   ├─ Backend: GET /api/samples?status=PENDING
   ├─ Database: Query pending samples
   ├─ Admin: Review and approve sample
   ├─ Backend: POST /api/samples/:id/approve
   │   ├─ Generate blind code
   │   ├─ Update sample status
   │   └─ Create audit log
   ├─ Database: Update sample record
   └─ Notification: Send approval email to farmer

5. JUDGING
   ├─ Judge: Login and view samples
   ├─ Backend: GET /api/samples?blindCodes
   ├─ Judge: Score sample using form
   ├─ Backend: POST /api/scores
   ├─ Database: Insert score record
   └─ Repeat for all samples

6. RESULTS AGGREGATION
   ├─ Backend: GET /api/events/:id/results
   │   ├─ Query all scores for event
   │   ├─ Calculate averages
   │   ├─ Generate rankings
   │   └─ Calculate statistics
   ├─ Database: Aggregate score queries
   └─ Frontend: Display leaderboard

7. RESULTS PUBLICATION
   ├─ Head Judge: Publish results
   ├─ Backend: POST /api/events/:id/publish
   ├─ Database: Update event status
   ├─ Notification: Send results to farmers
   │   ├─ Show ranking
   │   ├─ Show scores (anonymized judges)
   │   └─ Show blind code → actual sample mapping
   └─ Public: Leaderboard accessible
```

### Data Flow Diagram - Event Lifecycle

```
PENDING
  ├─ Create event
  ├─ Send invitations
  └─ Wait for confirmations
     ↓
ACTIVE
  ├─ Accept/Reject invitations
  ├─ Farmers register
  ├─ Sample submissions open
  └─ Admin approves samples
     ↓
JUDGING
  ├─ Samples assigned to judges
  ├─ Judges score samples
  ├─ Scores submitted
  └─ Results aggregated
     ↓
COMPLETED
  ├─ Final results calculated
  ├─ Rankings generated
  ├─ Results published
  └─ Leaderboard public
     ↓
CANCELLED (optional branch from any state)
  ├─ Notify all participants
  ├─ Refund/credit handling
  └─ Archive records
```

---

## TECHNOLOGY STACK

### Frontend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18+ | UI library |
| **Language** | TypeScript | Type safety |
| **Build Tool** | Vite | Module bundler |
| **HTTP Client** | Fetch API | API communication |
| **State** | React Hooks | State management |
| **Styling** | CSS Modules | Component styling |
| **Auth** | Supabase JS | Authentication |

### Backend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js | JavaScript runtime |
| **Framework** | Express.js | Web framework |
| **Language** | TypeScript | Type safety |
| **ORM** | Prisma | Database abstraction |
| **Database** | PostgreSQL | Relational DB |
| **Auth** | Supabase | Authentication service |
| **Validation** | Custom validators | Input validation |

### Infrastructure Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | Supabase (PostgreSQL) | Data persistence |
| **Auth** | Supabase Auth | User authentication |
| **Storage** | Supabase Storage | File storage |
| **Deployment** | Railway/Render/Vercel | Hosting |
| **Email** | SendGrid/SMTP | Email notifications |
| **Monitoring** | Logs/Console | Application monitoring |

---

## DEPLOYMENT ARCHITECTURE

### Development Environment

```
Local Machine
    │
    ├─ Frontend (npm run dev)
    │   └─ Vite Dev Server (localhost:5173)
    │
    ├─ Backend (npm run dev or node server.js)
    │   └─ Express Server (localhost:5000)
    │
    └─ Database (Supabase - Cloud)
        └─ PostgreSQL (Remote)
```

### Production Environment

```
┌─────────────────────────────────────────┐
│         Internet Users                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │   CDN/DNS     │
         └───────┬───────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    Frontend Server   Backend Server
    (Vercel/Railway)  (Railway/Render)
        │                 │
        │ HTTPS/REST      │
        │                 │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  PostgreSQL DB  │
        │    (Supabase)   │
        └─────────────────┘
```

### Deployment Pipeline

```
1. Developer pushes code to GitHub
        │
        ▼
2. CI/CD Pipeline (GitHub Actions)
        │
        ├─ Run tests
        ├─ Build frontend
        ├─ Build backend
        └─ Run linters
        │
        ▼
3. If tests pass:
        │
        ├─ Deploy frontend to Vercel
        │   └─ Auto-builds and deploys
        │
        └─ Deploy backend to Railway/Render
            └─ Auto-builds Docker container
            └─ Starts new instance
            └─ Runs migrations if needed
            └─ Updates environment variables
            │
            ▼
4. Production Live
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:pass@host/db
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx_key_xxx
JWT_SECRET=xxx_secret_xxx
EMAIL_SERVICE_API_KEY=xxx_key_xxx
NODE_ENV=production
PORT=5000
```

**Frontend (.env)**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_KEY=xxx_key_xxx
VITE_API_URL=https://api.domain.com
```

### Scaling Considerations

**Horizontal Scaling:**
- Multiple backend instances behind load balancer
- CDN for frontend static assets
- Database read replicas for read-heavy operations

**Vertical Scaling:**
- Increase server resources (CPU, RAM)
- Database connection pooling
- Query optimization and indexing

**Performance Optimization:**
- Frontend: Code splitting, lazy loading, minification
- Backend: Caching strategies, query optimization
- Database: Indexes, query optimization, normalization

---

## SECURITY ARCHITECTURE

### Authentication Flow

```
1. User Login
   ├─ Frontend: POST /auth/login (email, password)
   ├─ Supabase: Validate credentials
   └─ Supabase: Return JWT token

2. Token Storage
   ├─ Frontend: Store JWT in localStorage/sessionStorage
   └─ Send with each request in Authorization header

3. Backend Verification
   ├─ Extract JWT from header
   ├─ Verify signature
   ├─ Check expiration
   └─ Allow/deny request

4. Authorization Check
   ├─ Verify user role/permissions
   ├─ Check resource ownership
   └─ Allow/deny operation
```

### Data Security

- **Passwords:** Hashed by Supabase (bcrypt)
- **Blind Codes:** Unique, randomly generated
- **Sample Names:** Private until results published
- **Scores:** Stored separately, linked by blind code
- **Transport:** HTTPS/TLS for all communications
- **Database:** PostgreSQL with encryption at rest (Supabase)

### Access Control

| Role | Event | Sample | Score | User Mgmt |
|------|-------|--------|-------|-----------|
| Admin | Full | Approve/Reject | View All | Full |
| Head Judge | View | View | View/Aggregate | View |
| Q-Grader | View | View | Submit Own | View Self |
| Farmer | Own | Submit Own | View Own | View Self |

---

## DISASTER RECOVERY

### Backup Strategy

- **Database:** Daily automated backups (Supabase)
- **Code:** Version control (Git/GitHub)
- **Configuration:** Documented and version controlled

### Recovery Procedures

**Database Failure:**
1. Restore from latest backup (max 24 hrs data loss)
2. Verify data integrity
3. Update DNS to failover database
4. Notify users

**Backend Failure:**
1. Automatic restart on Railway/Render
2. Load balancer routes to healthy instance
3. Manual restart if needed

**Frontend Issues:**
1. Rollback previous deployment
2. Verify CDN cache cleared
3. Communicate with users

---

## CONCLUSION

This comprehensive architecture supports:
- ✅ Multiple user roles and permissions
- ✅ Secure authentication and authorization
- ✅ Scalable backend with clear separation of concerns
- ✅ Efficient database design with proper relationships
- ✅ RESTful API design
- ✅ Real-time data flow management
- ✅ Production-ready deployment
- ✅ Security and disaster recovery measures

---

**Document Status:** Final - Ready for Implementation  
**Architecture Version:** 1.0  
**Last Updated:** April 23, 2026  
**Next Review:** Q3 2026
