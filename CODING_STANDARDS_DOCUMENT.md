# COFFEE CUPPING EVENT MANAGEMENT SYSTEM
## Comprehensive Coding Standards and Best Practices Document

**Project Name:** Senior Project - Coffee Cupping Event Management  
**Document Version:** 1.0  
**Last Updated:** April 20, 2026  
**Team Members:** All Development Team Contributors  
**Submission Date:** April 2026

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Introduction and Purpose](#introduction-and-purpose)
3. [General Code Style Guidelines](#general-code-style-guidelines)
4. [Naming Conventions and Identifiers](#naming-conventions-and-identifiers)
5. [TypeScript and Type System Standards](#typescript-and-type-system-standards)
6. [React Component Development Standards](#react-component-development-standards)
7. [Backend Development with Express.js](#backend-development-with-expressjs)
8. [Database Design with Prisma](#database-design-with-prisma)
9. [File Organization and Structure](#file-organization-and-structure)
10. [Comments and Documentation](#comments-and-documentation)
11. [Error Handling and Validation](#error-handling-and-validation)
12. [Security Practices](#security-practices)
13. [Testing and Quality Assurance](#testing-and-quality-assurance)
14. [Git Version Control Standards](#git-version-control-standards)
15. [Code Review and Quality Standards](#code-review-and-quality-standards)
16. [Performance Optimization Guidelines](#performance-optimization-guidelines)
17. [Appendix: Configuration Files](#appendix-configuration-files)

---

## 1. EXECUTIVE SUMMARY

This document establishes comprehensive coding standards and best practices for the Coffee Cupping Event Management System development project. These standards ensure code consistency, maintainability, reliability, and security across all components of the application.

**Key Objectives:**
- Maintain consistent code quality and style across the entire project
- Establish clear guidelines for all team members to follow during development
- Reduce bugs and improve code maintainability through standardized practices
- Enable efficient code reviews and knowledge sharing within the team
- Ensure scalability and performance of the application
- Promote security best practices in all development activities

**Scope of Application:**
These standards apply to all code files including:
- TypeScript/JavaScript files (.ts, .tsx)
- React components and hooks
- Express.js backend services and routes
- Database schema and migrations (Prisma ORM)
- Configuration files
- Test files and specifications
- All other source code files

**Adherence Requirements:**
All team members must adhere to these standards during development. Code that does not meet these standards will not be approved during code review and must be revised before merging into the main branch.

---

## 2. INTRODUCTION AND PURPOSE

### 2.1 Why Coding Standards Matter

Coding standards are fundamental to professional software development. They provide:

**Consistency:** All developers write code that looks and behaves similarly, making the codebase predictable and easier to navigate.

**Maintainability:** Well-structured code with clear conventions is easier to understand, modify, and debug by any team member, regardless of who originally wrote it.

**Quality:** Standards help prevent common mistakes and encourage best practices that result in fewer bugs and better performance.

**Collaboration:** When all team members follow the same standards, code reviews become more efficient and productive.

**Scalability:** As the project grows, standardized code is easier to extend and modify without creating technical debt.

### 2.2 Code Quality Metrics

Our standards are designed to achieve the following quality metrics:

- Code coverage: Minimum 80% for critical paths
- Test pass rate: 100% for all pull requests
- Code duplication: Less than 5% of codebase
- Maintainability index: Above 75
- Average function length: Less than 30 lines of code
- Cyclomatic complexity: Less than 10 per function

### 2.3 Document Usage

This document should be:
- Referenced during all code development activities
- Reviewed by each team member before starting contributions
- Updated as project requirements evolve
- Used as a checklist during code reviews
- Used for onboarding new team members

---

## 3. GENERAL CODE STYLE GUIDELINES

### 3.1 Whitespace and Indentation

**Indentation Rules:**
- Use 2 spaces for indentation (not tabs)
- Each nesting level should be indented consistently
- Indentation must be applied in all contexts: functions, blocks, objects, arrays

```typescript
// ✓ CORRECT - 2-space indentation
function calculateScore(samples: Sample[]): number {
  let totalScore = 0;
  for (const sample of samples) {
    if (sample.isValid) {
      totalScore += sample.score;
    }
  }
  return totalScore;
}

// ✗ INCORRECT - tab indentation
function calculateScore(samples: Sample[]): number {
	let totalScore = 0;
	for (const sample of samples) {
		if (sample.isValid) {
			totalScore += sample.score;
		}
	}
	return totalScore;
}
```

**Line Length:**
- Maximum line length should be 100 characters
- If a line exceeds 100 characters, break it into multiple lines
- For function parameters, each parameter can go on a new line
- For object properties, each property can go on a new line

```typescript
// ✓ CORRECT - Line breaks for readability
const userEvent = await prisma.cuppingEvent.findUnique({
  where: { id: eventId },
  include: {
    participants: true,
    samples: true
  }
});

// ✗ INCORRECT - Line too long
const userEvent = await prisma.cuppingEvent.findUnique({ where: { id: eventId }, include: { participants: true, samples: true } });
```

**Blank Lines:**
- Use blank lines to separate logical sections of code
- Use one blank line to separate methods in classes
- Use one blank line between function declarations
- Use two blank lines between different functional sections
- Files should end with exactly one newline character

### 3.2 Semicolons and Punctuation

**Semicolon Usage:**
- All statements must end with a semicolon
- Do not rely on automatic semicolon insertion (ASI)
- Even single-statement blocks should have semicolons

```typescript
// ✓ CORRECT
const eventName = 'Coffee Cupping 2026';
const eventDate = new Date();
const getEventInfo = () => ({ name: eventName, date: eventDate });

// ✗ INCORRECT - Missing semicolons
const eventName = 'Coffee Cupping 2026'
const eventDate = new Date()
const getEventInfo = () => ({ name: eventName, date: eventDate })
```

**Comma Placement:**
- Use trailing commas in multi-line arrays and objects
- This prevents merge conflicts and makes diffs cleaner

```typescript
// ✓ CORRECT - Trailing comma
interface EventData {
  name: string;
  date: Date;
  location: string,
}

const sampleTypes = [
  'FARMER_REGISTERED',
  'FARMER_DIRECTREGISTERED',
  'PROXY_SUBMISSION',
];
```

### 3.3 Quotes and String Literals

**Quote Style:**
- Use single quotes for strings: `'string'`
- Use template literals for string interpolation: `` `text ${variable}` ``
- Never use double quotes for regular strings

```typescript
// ✓ CORRECT
const userName = 'John Doe';
const message = `Welcome, ${userName}!`;
const path = '/api/samples';

// ✗ INCORRECT
const userName = "John Doe";
const message = "Welcome, " + userName + "!";
const path = "/api/samples";
```

### 3.4 Spacing and Operators

**Space Around Operators:**
- Put spaces around binary operators: `a + b`, `x = 10`
- Put spaces after keywords: `if (condition)`, `for (let i = 0; i < 10; i++)`
- Put spaces inside object literals: `{ key: value }`
- No spaces inside parentheses: `(a + b)`, not `( a + b )`

```typescript
// ✓ CORRECT
if (isValid) {
  const result = x + y;
  const obj = { name: 'John', age: 25 };
}

// ✗ INCORRECT
if(isValid){
  const result=x+y;
  const obj={ name:'John',age:25 };
}
```

**Arrow Functions:**
- Include spaces around arrow: `const func = (x) => x * 2;`
- Omit parentheses for single parameters without type annotations: `(x) => x * 2`
- Include parentheses for multiple parameters: `(x, y) => x + y`

### 3.5 Braces and Block Statements

**Brace Style (One True Brace Style):**
- Opening brace stays on the same line as the statement
- Closing brace on its own line at the same indentation as the opening
- Use braces for all control structures, even single-line blocks

```typescript
// ✓ CORRECT
if (condition) {
  doSomething();
}

function getName(): string {
  return 'John';
}

// ✗ INCORRECT
if (condition)
{
  doSomething();
}

if (condition) doSomething();
```

---

## 4. NAMING CONVENTIONS AND IDENTIFIERS

### 4.1 Variable and Constant Naming

**Variable Names:**
- Use `camelCase` for variable names
- Names should be descriptive and meaningful
- Avoid single-letter variables except in loops
- Avoid abbreviations unless universally recognized

```typescript
// ✓ CORRECT
let userCount: number = 0;
let isEventActive: boolean = true;
let eventStartDate: Date = new Date();
let sampleScores: number[] = [];

// ✗ INCORRECT
let uc: number = 0;
let evt_active: boolean = true;
let eSD: Date = new Date();
let ss: number[] = [];
```

**Constant Names:**
- Use `UPPER_SNAKE_CASE` for constants
- Constants should be values that never change during execution
- Use `const` keyword for all constants

```typescript
// ✓ CORRECT
const MAX_PARTICIPANTS = 50;
const COFFEE_TYPES = ['Arabica', 'Robusta', 'Liberica'];
const DEFAULT_TIMEOUT = 5000;
const ADMIN_EMAIL = 'admin@coffeecupping.com';

// ✗ INCORRECT
const maxParticipants = 50;
const MAX_PARTICIPANTS: number = 50;
const coffeeTypes = ['Arabica', 'Robusta', 'Liberica'];
```

### 4.2 Function and Method Naming

**Naming Convention:**
- Use `camelCase` starting with a lowercase letter
- Use action verbs that describe what the function does
- Function names should begin with verbs for better clarity
- Async functions should clearly indicate they return promises

```typescript
// ✓ CORRECT
function calculateTotalScore(samples: Sample[]): number { }
function getUserData(userId: string): Promise<User> { }
function validateEventData(data: EventData): boolean { }
function handleSubmitEvent(): void { }
async function fetchEventsList(): Promise<Event[]> { }

// ✗ INCORRECT
function score(samples: Sample[]): number { }
function user(userId: string): Promise<User> { }
function eventData(data: EventData): boolean { }
function submit_event(): void { }
```

**Method Naming in Classes:**
- Private methods should be prefixed with underscore: `_privateMethod()`
- Getter methods use `get` prefix: `getEventName()`
- Setter methods use `set` prefix: `setEventName(name)`
- Event handler methods use `handle` prefix: `handleClick()`

### 4.3 Class and Interface Naming

**Class Names:**
- Use `PascalCase` (uppercase first letter)
- Names should be nouns representing objects or concepts
- Use descriptive, specific names

```typescript
// ✓ CORRECT
class EventManager { }
class SampleValidator { }
class CoffeeScoringEngine { }
class AdminDashboard { }

// ✗ INCORRECT
class eventManager { }
class sample_validator { }
class Engine { }
class Dashboard { }
```

**Interface and Type Names:**
- Use `PascalCase`
- Interfaces should describe contracts or shapes
- Consider prefixing with 'I' for interfaces if distinguishing from classes is important

```typescript
// ✓ CORRECT
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

type SampleStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type EventCallback = (event: CuppingEvent) => void;

// ✗ INCORRECT
interface user_profile { }
type sample_status = 'PENDING' | 'APPROVED' | 'REJECTED';
```

### 4.4 File and Folder Naming

**File Naming:**
- Component files: `PascalCase` - `EventCreationWizard.tsx`
- Utility files: `camelCase` - `sampleValidator.ts`
- Test files: `[name].test.ts` - `eventManager.test.ts`
- Configuration files: `camelCase` or `kebab-case` - `vite.config.ts`, `tsconfig.json`

**Folder Naming:**
- Use `kebab-case` for folder names
- Group related files in folders
- Use descriptive folder names that indicate content

```
src/
├── components/
│   ├── admin/
│   │   ├── EventCreationWizard.tsx
│   │   ├── EventManagementModal.tsx
│   │   └── UserManagement.tsx
│   ├── dashboards/
│   │   ├── AdminDashboard.tsx
│   │   └── FarmerDashboard.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Modal.tsx
├── utils/
│   ├── api.ts
│   └── validation.ts
└── types.ts
```

### 4.5 Database and Schema Naming

**Model Names:**
- Use `PascalCase` for model names
- Use singular form: `User` not `Users`
- Names should represent the entity

**Field Names:**
- Use `camelCase` for field names
- Use descriptive names for clarity
- Foreign keys should follow pattern: `{ModelName}Id` (e.g., `userId`, `eventId`)

```prisma
// ✓ CORRECT
model CuppingEvent {
  id              String    @id @default(cuid())
  eventName       String
  eventDate       DateTime
  totalParticipants Int
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  samples         Sample[]
  
  @@map("cupping_events")
}

model Sample {
  id              String    @id @default(cuid())
  sampleName      String
  sampleType      String
  blindCode       String?
  moisture        Float?
  cuppingEventId  String?
  
  cuppingEvent    CuppingEvent? @relation(fields: [cuppingEventId], references: [id])
  
  @@map("samples")
}

// ✗ INCORRECT
model cuppingEvent { }
model Users { }
model Sample {
  evt_id          String
  sample_name     String
}
```

---

## 5. TYPESCRIPT AND TYPE SYSTEM STANDARDS

### 5.1 Type Annotations

**Always Provide Type Annotations:**
- Function parameters must have explicit types
- Function return types must be specified
- Variable types should be annotated in most cases
- Use type inference only for obvious cases

```typescript
// ✓ CORRECT
function processEvent(event: CuppingEvent): void {
  const eventName: string = event.name;
  const startDate: Date = event.date;
  const participants: User[] = event.participants;
}

async function fetchEvent(eventId: string): Promise<CuppingEvent | null> {
  return await prisma.cuppingEvent.findUnique({ where: { id: eventId } });
}

// ✗ INCORRECT
function processEvent(event) {
  const eventName = event.name;
  return processEventData(eventName);
}

async function fetchEvent(eventId) {
  return await prisma.cuppingEvent.findUnique({ where: { id: eventId } });
}
```

**Avoid Using `any`:**
- Never use `any` type unless absolutely necessary
- Use `unknown` instead with type guards
- Use generics when types are flexible
- Use union types for multiple possibilities

```typescript
// ✓ CORRECT
function processData(data: unknown): void {
  if (typeof data === 'object' && data !== null) {
    // Process object
  }
}

function handleMultipleTypes<T>(value: T): T {
  return value;
}

type ApiResponse = string | number | boolean;

// ✗ INCORRECT
function processData(data: any): void {
  data.doSomething();
}

function handleValue(value: any): any {
  return value;
}
```

### 5.2 Interfaces vs Types

**When to Use Interfaces:**
- For object structures that define contracts
- For classes to implement
- For API request/response shapes
- For component props

**When to Use Types:**
- For unions: `type Status = 'pending' | 'approved'`
- For intersections: `type Combined = A & B`
- For tuples and function types
- For primitives and aliases

```typescript
// ✓ CORRECT
interface UserData {
  id: string;
  name: string;
  email: string;
}

interface EventService {
  createEvent(data: EventData): Promise<CuppingEvent>;
  getEvent(id: string): Promise<CuppingEvent | null>;
}

type SampleType = 'FARMER_REGISTERED' | 'FARMER_DIRECTREGISTERED';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

class EventManager implements EventService {
  async createEvent(data: EventData): Promise<CuppingEvent> {
    // Implementation
  }
}

// ✗ INCORRECT
type UserData = {
  id: string;
  name: string;
  email: string;
};

type EventService = {
  createEvent: (data: EventData) => Promise<CuppingEvent>;
};
```

### 5.3 Generic Types

**Using Generics:**
- Use generics for reusable components and functions
- Provide meaningful type parameters
- Add constraints when necessary

```typescript
// ✓ CORRECT
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function wrapInResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    status: 200,
    message: 'Success'
  };
}

type ApiResult<T> = Promise<ApiResponse<T>>;

// Generic with constraints
function processCollection<T extends { id: string }>(
  items: T[]
): T[] {
  return items.filter(item => item.id);
}

// ✗ INCORRECT
interface ApiResponse {
  data: any;
  status: number;
}

function wrapInResponse(data: any): ApiResponse {
  return { data, status: 200 };
}
```

### 5.4 Strict Mode Configuration

**TypeScript Compiler Settings:**
- Enable strict mode: `"strict": true`
- Enable strict null checks
- Enable strict function types
- Enable strict property initialization

```json
// tsconfig.json - ✓ CORRECT
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 5.5 Optional and Non-Null Assertions

**Optional Chaining:**
- Use optional chaining `?.` for potentially null/undefined values
- Avoid non-null assertion `!` unless absolutely necessary

```typescript
// ✓ CORRECT
const eventName = event?.name ?? 'Unknown';
const participantCount = event?.participants?.length ?? 0;

// ✗ INCORRECT - Non-null assertion
const eventName = event!.name;
const participantCount = event!.participants.length;
```

---

## 6. REACT COMPONENT DEVELOPMENT STANDARDS

### 6.1 Component Structure

**Functional Components:**
- Use functional components with hooks, never class components
- Use React.FC type annotation
- Export components as default when appropriate

```typescript
// ✓ CORRECT
interface EventCardProps {
  event: CuppingEvent;
  onSelect: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  return (
    <div onClick={() => onSelect(event.id)}>
      <h3>{event.name}</h3>
      <p>{event.date.toString()}</p>
    </div>
  );
};

export default EventCard;

// ✗ INCORRECT
class EventCard extends React.Component {
  render() {
    return <div>{/* ... */}</div>;
  }
}

export const EventCard: React.FC<Props> = (props) => {
  // Default exports are preferred
};
```

### 6.2 Hooks Usage

**Hook Rules:**
- Call hooks at the top level, not inside loops or conditions
- Only call hooks from React function components or custom hooks
- Use the `useEffect` hook for side effects
- Always include dependencies in dependency arrays

```typescript
// ✓ CORRECT
function useEventData(eventId: string): CuppingEvent | null {
  const [event, setEvent] = React.useState<CuppingEvent | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await fetch(`/api/events/${eventId}`);
        setEvent(await data.json());
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]); // Include eventId in dependencies

  return event;
}

// ✗ INCORRECT
function useEventData(eventId: string): CuppingEvent | null {
  if (eventId) {
    const [event, setEvent] = React.useState<CuppingEvent | null>(null); // Wrong!
  }

  React.useEffect(() => {
    fetch(`/api/events/${eventId}`).then(d => d.json()).then(setEvent);
    // Missing dependency array
  });

  return null;
}
```

### 6.3 Props Management

**Props Definition:**
- Define prop interfaces explicitly
- Use descriptive prop names
- Document required vs optional props
- Use default values when appropriate

```typescript
// ✓ CORRECT
interface EventListProps {
  events: CuppingEvent[];
  isLoading: boolean;
  onEventSelect: (eventId: string) => void;
  maxDisplayCount?: number;
}

const EventList: React.FC<EventListProps> = ({
  events,
  isLoading,
  onEventSelect,
  maxDisplayCount = 10
}) => {
  const displayedEvents = events.slice(0, maxDisplayCount);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {displayedEvents.map(e => (
        <EventCard
          key={e.id}
          event={e}
          onSelect={onEventSelect}
        />
      ))}
    </div>
  );
};

// ✗ INCORRECT
const EventList = (props: any) => {
  return <div>{/* Cannot determine required props */}</div>;
};

const EventList = ({ events, isLoading, onSelect }: any) => {
  // Type is any, no documentation
  return <div>{/* ... */}</div>;
};
```

### 6.4 State Management

**useState Best Practices:**
- Keep state minimal and at the appropriate level
- Lift state up when multiple components need it
- Avoid unnecessary state updates
- Use functional setState when updating based on previous state

```typescript
// ✓ CORRECT
const EventForm: React.FC = () => {
  const [eventName, setEventName] = React.useState('');
  const [eventDate, setEventDate] = React.useState<Date | null>(null);

  const handleSubmit = () => {
    if (eventName && eventDate) {
      submitEvent({ name: eventName, date: eventDate });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
      />
    </form>
  );
};

// ✗ INCORRECT - Too much state
const EventForm: React.FC = () => {
  const [formData, setFormData] = React.useState({
    eventName: '',
    eventDate: null,
    description: '',
    location: '',
    participants: [],
    // ... many more fields
  });

  return <form>{/* ... */}</form>;
};
```

### 6.5 Event Handlers

**Handler Naming:**
- Prefix event handlers with `handle`: `handleClick`, `handleSubmit`
- Use arrow functions in component bodies
- Move complex logic to separate functions

```typescript
// ✓ CORRECT
const EventApprovalDialog: React.FC<Props> = ({ eventId, onClose }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleApproveEvent = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await fetch(`/api/events/${eventId}/approve`, {
        method: 'POST'
      });
      onClose();
    } catch (error) {
      console.error('Error approving event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleApproveEvent} disabled={isLoading}>
      Approve Event
    </button>
  );
};

// ✗ INCORRECT
const EventApprovalDialog: React.FC<Props> = ({ eventId, onClose }) => {
  return (
    <button
      onClick={async () => {
        await fetch(`/api/events/${eventId}/approve`, { method: 'POST' });
        onClose();
      }}
    >
      Approve
    </button>
  );
};
```

---

## 7. BACKEND DEVELOPMENT WITH EXPRESS.JS

### 7.1 Route Organization

**Route Structure:**
- Group related routes in separate files
- Use meaningful route prefixes
- Keep route handlers thin, move logic to services
- Use consistent HTTP methods and status codes

```typescript
// ✓ CORRECT - routes/events.ts
import express from 'express';
import { createEvent, getEvent, updateEvent } from '../controllers/eventController';

const router = express.Router();

router.post('/events', createEvent);
router.get('/events/:id', getEvent);
router.put('/events/:id', updateEvent);

export default router;

// main app file
app.use('/api', eventRouter);
app.use('/api', sampleRouter);
app.use('/api', userRouter);

// ✗ INCORRECT - All in one file
app.post('/createEvent', (req, res) => {
  // Complex logic mixed with routing
});
app.get('/getEvent/:id', (req, res) => {
  // More mixed logic
});
```

### 7.2 Middleware Implementation

**Middleware Standards:**
- Organize middleware in separate files
- Single responsibility per middleware
- Use meaningful names that describe functionality
- Document middleware purpose and usage

```typescript
// ✓ CORRECT - middleware/authentication.ts
interface AuthRequest extends express.Request {
  user?: { id: string; role: string };
}

export const authenticateUser = (
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Usage
app.use(authenticateUser);
app.post('/api/events', createEvent);

// ✗ INCORRECT - Too much responsibility
const handleEverything = (req, res, next) => {
  // Authentication
  // Validation
  // Logging
  // Error handling
  // All mixed together
};
```

### 7.3 Request and Response Handling

**Input Validation:**
- Validate all user inputs server-side
- Check for required fields
- Validate data types
- Return meaningful error messages

```typescript
// ✓ CORRECT
app.post('/api/samples', async (req: Request, res: Response) => {
  try {
    const { sampleName, sampleType, moisture } = req.body;

    // Validation
    if (!sampleName) {
      return res.status(400).json({ error: 'Sample name is required' });
    }

    if (!['FARMER_REGISTERED', 'FARMER_DIRECTREGISTERED'].includes(sampleType)) {
      return res.status(400).json({ error: 'Invalid sample type' });
    }

    if (moisture !== undefined && (typeof moisture !== 'number' || moisture < 0)) {
      return res.status(400).json({ error: 'Moisture must be a positive number' });
    }

    // Create sample
    const sample = await prisma.sample.create({
      data: { sampleName, sampleType, moisture: moisture || null }
    });

    res.status(201).json({ success: true, data: sample });
  } catch (error) {
    console.error('Error creating sample:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✗ INCORRECT - No validation
app.post('/api/samples', async (req: Request, res: Response) => {
  const sample = await prisma.sample.create({ data: req.body });
  res.send(sample);
});
```

**Response Format:**
- Use consistent response structure
- Always include status information
- Include meaningful data or error messages
- Use appropriate HTTP status codes

```typescript
// ✓ CORRECT - Consistent response structure
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  timestamp: string;
}

// Response usage
res.json({
  success: true,
  data: sample,
  timestamp: new Date().toISOString()
});

res.status(400).json({
  success: false,
  error: 'Sample name is required',
  code: 'VALIDATION_ERROR',
  timestamp: new Date().toISOString()
});
```

### 7.4 Error Handling

**Error Class Hierarchy:**
- Create custom error classes for domain-specific errors
- Include error codes and status codes
- Log errors for debugging

```typescript
// ✓ CORRECT
class ApplicationError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errorCode: string
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

// Usage
throw new ValidationError('Event name is required');
throw new NotFoundError('CuppingEvent');

// Global error handler
app.use((error: ApplicationError, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  res.status(error.statusCode).json({
    success: false,
    error: error.message,
    code: error.errorCode
  });
});
```

### 7.5 Controller and Service Layers

**Separation of Concerns:**
- Controllers handle HTTP concerns only
- Services contain business logic
- Controllers call services and return responses
- Keep functions focused and testable

```typescript
// ✓ CORRECT - controllers/eventController.ts
export const createEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const eventData = req.body;
    const event = await eventService.createEvent(eventData);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// services/eventService.ts
export const createEvent = async (data: EventCreateData): Promise<CuppingEvent> => {
  validateEventData(data);
  
  const event = await prisma.cuppingEvent.create({
    data: {
      name: data.name,
      date: data.date,
      location: data.location,
      participants: {
        create: data.participants.map(p => ({ userId: p }))
      }
    }
  });

  return event;
};

// ✗ INCORRECT - Mixed concerns
app.post('/api/events', async (req, res) => {
  // Validation
  if (!req.body.name) return res.status(400).send('Name required');
  
  // Business logic
  const event = await prisma.cuppingEvent.create({ data: req.body });
  
  // Post-processing
  await sendNotification(event);
  
  res.json(event);
});
```

---

## 8. DATABASE DESIGN WITH PRISMA

### 8.1 Schema Organization

**Model Structure:**
- Use singular names for models
- Define all relationships explicitly
- Include timestamps for audit trails
- Use `@map` for different database naming

```prisma
// ✓ CORRECT - schema.prisma
model CuppingEvent {
  id              String    @id @default(cuid())
  name            String
  description     String?
  date            DateTime
  location        String
  maxParticipants Int
  status          String    @default("PENDING")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  participants    Participant[]
  samples         Sample[]

  @@index([status])
  @@map("cupping_events")
}

model Sample {
  id              String    @id @default(cuid())
  sampleName      String
  sampleType      String    // 'FARMER_REGISTERED', 'FARMER_DIRECTREGISTERED', etc.
  blindCode       String?
  moisture        Float?
  approvalStatus  String    @default("PENDING")
  approvedByAdminId String?
  approvalDate    DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  cuppingEvent    CuppingEvent? @relation(fields: [cuppingEventId], references: [id], onDelete: Cascade)
  cuppingEventId  String?

  @@index([cuppingEventId])
  @@index([approvalStatus])
  @@map("samples")
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String
  role            String    // 'ADMIN', 'HEAD_JUDGE', 'Q_GRADER', 'FARMER'
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  participants    Participant[]

  @@index([role])
  @@map("users")
}

model Participant {
  id              String    @id @default(cuid())
  role            String
  status          String    @default("INVITED")
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId          String
  event           CuppingEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId         String

  @@unique([userId, eventId])
  @@index([eventId])
  @@index([userId])
  @@map("participants")
}

// ✗ INCORRECT
model events {
  evt_id          String
  evt_name        String
  evt_date        DateTime
}

model sample {
  id              String
  name            String
  event_id        String
}
```

### 8.2 Migrations

**Migration Practices:**
- Create a migration for every schema change
- Write descriptive migration names
- Review migrations before deploying
- Never edit migrations after they've been committed

```bash
# ✓ CORRECT - Descriptive names
npx prisma migrate dev --name add_approval_status_to_samples
npx prisma migrate dev --name make_moisture_optional
npx prisma migrate dev --name add_cascade_delete_to_samples

# ✗ INCORRECT - Vague names
npx prisma migrate dev --name update_schema
npx prisma migrate dev --name fix_bug
npx prisma migrate dev --name changes
```

**Migration Workflow:**
1. Make schema changes in schema.prisma
2. Generate migration: `npx prisma migrate dev --name description`
3. Review the generated migration file
4. Test locally
5. Commit the migration file
6. Deploy to production

### 8.3 Query Patterns

**Efficient Queries:**
- Use `include` or `select` to fetch related data
- Use `where` for filtering
- Use `orderBy` for sorting
- Use `take` and `skip` for pagination

```typescript
// ✓ CORRECT - Efficient queries
const events = await prisma.cuppingEvent.findMany({
  where: { status: 'ACTIVE' },
  include: { participants: true, samples: true },
  orderBy: { date: 'asc' },
  take: 10,
  skip: 0
});

const sample = await prisma.sample.findUnique({
  where: { id: sampleId },
  include: { cuppingEvent: { select: { name: true } } }
});

const pendingSamples = await prisma.sample.findMany({
  where: { approvalStatus: 'PENDING' },
  select: { id: true, sampleName: true, sampleType: true }
});

// ✗ INCORRECT - Inefficient queries
const events = await prisma.cuppingEvent.findMany(); // No filtering
const samples = await prisma.sample.findMany(); // No selection

// Manual filtering in application code
const filteredEvents = events.filter(e => e.status === 'ACTIVE');
```

---

## 9. FILE ORGANIZATION AND STRUCTURE

### 9.1 Directory Layout

**Recommended Structure:**
```
coffee-cupping-app/
├── components/                 # React components
│   ├── admin/                 # Admin components
│   │   ├── EventCreationWizard.tsx
│   │   ├── EventManagementModal.tsx
│   │   └── UserManagement.tsx
│   ├── dashboards/            # Dashboard components
│   │   ├── AdminDashboard.tsx
│   │   ├── FarmerDashboard.tsx
│   │   └── HeadJudgeDashboard.tsx
│   ├── auth/                  # Authentication components
│   │   ├── LoginScreen.tsx
│   │   └── supabaseClient.ts
│   ├── reporting/             # Reporting components
│   │   ├── Certificate.tsx
│   │   └── PublicLeaderboard.tsx
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── Card.tsx
│   └── hooks/                 # Custom hooks
│       ├── useEventData.ts
│       └── useUserAuth.ts
├── controllers/               # Route controllers
│   ├── eventController.ts
│   ├── sampleController.ts
│   └── userController.ts
├── services/                  # Business logic services
│   ├── eventService.ts
│   ├── sampleService.ts
│   └── validation.ts
├── middleware/                # Express middleware
│   ├── authentication.ts
│   └── errorHandler.ts
├── routes/                    # Route definitions
│   ├── events.ts
│   ├── samples.ts
│   └── users.ts
├── utils/                     # Utility functions
│   ├── api.ts
│   ├── formatting.ts
│   └── helpers.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── types.ts                   # Global type definitions
├── App.tsx                    # Main React component
├── server.js                  # Express server
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 9.2 Component File Organization

**Single Component File:**
```typescript
// ✓ CORRECT - UserProfile.tsx
import React from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate?: (data: UserData) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = React.useState<UserData | null>(null);

  React.useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  const handleUpdate = (data: Partial<UserData>) => {
    const updated = { ...user, ...data };
    updateUser(updated);
    onUpdate?.(updated);
  };

  return (
    <div>
      {user && (
        <>
          <h2>{user.name}</h2>
          <button onClick={() => handleUpdate({ name: 'New Name' })}>
            Update
          </button>
        </>
      )}
    </div>
  );
};

export default UserProfile;
```

### 9.3 Import Organization

**Import Order:**
1. React and third-party imports
2. Type imports
3. Local component imports
4. Utility imports
5. Style imports (if applicable)

```typescript
// ✓ CORRECT
import React, { useState, useEffect } from 'react';
import axios from 'axios';

import type { CuppingEvent, Sample } from '@/types';

import EventCard from '@/components/EventCard';
import { useEventData } from '@/hooks/useEventData';

import { formatDate } from '@/utils/formatting';
import { validateEvent } from '@/utils/validation';

import styles from './EventList.module.css';

// ✗ INCORRECT
import styles from './EventList.module.css';
import axios from 'axios';
import EventCard from '@/components/EventCard';
import React, { useState } from 'react';
import { formatDate } from '@/utils/formatting';
import { CuppingEvent } from '@/types';
```

### 9.4 File Size and Complexity

**Guidelines:**
- Component files should be under 300 lines
- Service files should be under 500 lines
- Break large components into smaller, reusable pieces
- Extract utilities into separate files
- One main export per file

---

## 10. COMMENTS AND DOCUMENTATION

### 10.1 Commenting Best Practices

**Write Comments for Why, Not What:**
- Code should be self-explanatory for what it does
- Comments should explain why a particular approach was chosen
- Avoid obvious comments
- Update comments when code changes

```typescript
// ✓ CORRECT - Explains reasoning
// We use a Set instead of Array for O(1) lookup performance
// when checking if a user has already voted
const votedUserIds = new Set<string>(event.voters.map(v => v.id));

// We generate blind codes here instead of at sample creation
// to prevent guessing patterns from blind code sequence
function generateBlindCode(eventName: string): string {
  const prefix = eventName.charAt(0).toUpperCase();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${randomNum}`;
}

// ✗ INCORRECT - Obvious comments
// Create a set from voted user IDs
const votedUserIds = new Set<string>(event.voters.map(v => v.id));

// Generate blind code
function generateBlindCode(eventName: string): string {
  // ...
}
```

### 10.2 JSDoc Documentation

**Function Documentation:**
- Document parameters, return types, and exceptions
- Include usage examples for complex functions
- Explain side effects

```typescript
// ✓ CORRECT
/**
 * Approves a farmer sample and generates a blind code for it.
 * Only FARMER_DIRECTREGISTERED samples get blind codes immediately.
 * FARMER_REGISTERED samples need to be added to an event first.
 *
 * @param sampleId - The unique identifier of the sample to approve
 * @param approverId - The ID of the admin approving the sample
 * @returns Promise resolving to the updated sample with blind code if applicable
 * @throws {NotFoundError} If sample or approver not found
 * @throws {ValidationError} If sample is not in PENDING status
 *
 * @example
 * const approved = await approveSample('sample_123', 'admin_456');
 * console.log(approved.blindCode); // 'C-5432'
 *
 * @see {@link rejectSample} for rejection logic
 */
export async function approveSample(
  sampleId: string,
  approverId: string
): Promise<Sample> {
  // Implementation
}

/**
 * Interface for cupping event creation data.
 * @property name - Event name (required)
 * @property date - Event date (required)
 * @property location - Event location (required)
 * @property maxParticipants - Maximum number of participants (optional, default: 50)
 */
interface EventCreateData {
  name: string;
  date: Date;
  location: string;
  maxParticipants?: number;
}
```

### 10.3 README and Documentation Files

**README Structure:**
- Project description and purpose
- Technologies used
- Setup and installation instructions
- Running the application
- API documentation
- Contributing guidelines
- Troubleshooting

---

## 11. ERROR HANDLING AND VALIDATION

### 11.1 Input Validation Strategy

**Validation Layers:**
- Frontend validation for user experience
- Backend validation for security (always required)
- Database constraints for data integrity

```typescript
// ✓ CORRECT - Comprehensive validation
// 1. Frontend validation
const validateEventForm = (data: unknown): EventFormData => {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Invalid input format');
  }

  const { name, date, location } = data as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('Event name is required');
  }

  if (!(date instanceof Date) || date < new Date()) {
    throw new ValidationError('Event date must be in the future');
  }

  if (typeof location !== 'string' || location.trim() === '') {
    throw new ValidationError('Location is required');
  }

  return { name: name.trim(), date, location: location.trim() };
};

// 2. Backend validation (always)
app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const validatedData = validateEventForm(req.body);
    // Continue with creation
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Database constraints
model CuppingEvent {
  id          String @id @default(cuid())
  name        String @db.VarChar(255)
  date        DateTime
  location    String @db.VarChar(255)
  
  @@validate(name.len > 0, "Name must not be empty")
  @@map("cupping_events")
}
```

### 11.2 Error Response Formats

**Consistent Error Responses:**
- Include error code for client-side handling
- Provide descriptive error message
- Include timestamp
- Optional: include field-specific errors

```typescript
// ✓ CORRECT
interface ValidationErrorResponse {
  success: false;
  error: string;
  code: string;
  fieldErrors?: {
    [field: string]: string[];
  };
  timestamp: string;
}

// Example responses
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "fieldErrors": {
    "email": ["Email is required", "Email format is invalid"],
    "password": ["Password must be at least 8 characters"]
  },
  "timestamp": "2026-04-20T10:30:00Z"
}

{
  "success": false,
  "error": "Sample not found",
  "code": "NOT_FOUND",
  "timestamp": "2026-04-20T10:30:00Z"
}
```

---

## 12. SECURITY PRACTICES

### 12.1 Authentication and Authorization

**Security Principles:**
- Verify user identity before any sensitive operation
- Check user roles/permissions for authorization
- Use environment variables for sensitive config
- Never commit secrets to version control

```typescript
// ✓ CORRECT
// .env file - NEVER commit this
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx_secret_key_xxx
DATABASE_URL=postgres://user:password@host/db

// Middleware
const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No authentication token' });
    return;
  }

  try {
    const user = verifyToken(token);
    (req as AuthRequest).user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization check
const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
};

// Usage
app.post('/api/events', authenticateUser, requireRole(['ADMIN', 'HEAD_JUDGE']), createEvent);

// ✗ INCORRECT
app.post('/api/events', (req, res) => {
  // No authentication check!
  createEvent(req, res);
});

// Secrets in code
const apiKey = 'sk_live_xxx_secret_key_xxx'; // NEVER DO THIS!
```

### 12.2 Data Protection

**Data Safety:**
- Hash passwords before storage
- Use HTTPS for all communications
- Implement rate limiting
- Validate and sanitize all inputs

```typescript
// ✓ CORRECT - Hash passwords
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Use bcrypt when creating users
const user = await prisma.user.create({
  data: {
    email: userData.email,
    passwordHash: await hashPassword(userData.password)
  }
});

// ✗ INCORRECT - Storing plain text passwords
const user = await prisma.user.create({
  data: {
    email: userData.email,
    password: userData.password // NEVER store plain text!
  }
});
```

---

## 13. TESTING AND QUALITY ASSURANCE

### 13.1 Test File Organization

**Testing Structure:**
- Create test files alongside source files
- Use `.test.ts` or `.spec.ts` extension
- Organize tests by functionality

```
components/
├── EventCard.tsx
├── EventCard.test.tsx
└── EventCard.stories.tsx

services/
├── eventService.ts
└── eventService.test.ts
```

### 13.2 Test Writing

**Test Guidelines:**
- Test behavior, not implementation
- Use descriptive test names
- Mock external dependencies
- Aim for 80%+ coverage

```typescript
// ✓ CORRECT
describe('EventService', () => {
  describe('createEvent', () => {
    it('should create event with valid data', async () => {
      const eventData = {
        name: 'Coffee Cupping 2026',
        date: new Date('2026-05-01'),
        location: 'NYC'
      };

      const result = await eventService.createEvent(eventData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Coffee Cupping 2026');
      expect(result.date).toEqual(eventData.date);
    });

    it('should throw error with invalid name', async () => {
      const eventData = {
        name: '',
        date: new Date(),
        location: 'NYC'
      };

      await expect(eventService.createEvent(eventData))
        .rejects
        .toThrow('Event name is required');
    });
  });
});
```

---

## 14. GIT VERSION CONTROL STANDARDS

### 14.1 Commit Message Standards

**Message Format:**
- Use imperative mood: "Add feature" not "Added feature"
- Capitalize first letter
- Keep first line under 50 characters
- Include detailed description if needed

```bash
# ✓ CORRECT
git commit -m "Add approval workflow for farmer samples

- Implement POST /api/samples/:id/approve endpoint
- Generate blind code on approval
- Update UI with approval status
Fixes #123"

# ✗ INCORRECT
git commit -m "update stuff"
git commit -m "Fixed bug"
git commit -m "Changes to code"
```

### 14.2 Branching Strategy

**Branch Naming:**
- Feature branches: `feature/event-creation`
- Bug fixes: `fix/blind-code-generation`
- Hotfixes: `hotfix/security-vulnerability`
- Release branches: `release/v1.0.0`

```bash
# ✓ CORRECT
git checkout -b feature/farmer-submission
git checkout -b fix/moisture-validation
git checkout -b hotfix/authentication-bug

# ✗ INCORRECT
git checkout -b new-feature
git checkout -b dev
git checkout -b temp
```

---

## 15. CODE REVIEW AND QUALITY STANDARDS

### 15.1 Review Checklist

Before submitting code for review, verify:

- [ ] Code follows all naming conventions
- [ ] Code is properly formatted and indented
- [ ] No `console.log()` or debug code remains
- [ ] Error handling is implemented
- [ ] Types are properly defined (no `any`)
- [ ] Functions have JSDoc comments
- [ ] No unused imports or variables
- [ ] Tests pass and coverage is adequate
- [ ] Security best practices followed
- [ ] Performance is acceptable

### 15.2 Common Review Issues

**Typical Issues Found:**
- Missing type annotations
- Inconsistent naming conventions
- Too many responsibilities in one function
- Missing error handling
- Insufficient comments for complex logic
- Hardcoded values instead of constants
- Performance issues with large datasets

---

## 16. PERFORMANCE OPTIMIZATION GUIDELINES

### 16.1 React Performance

**Optimization Techniques:**
- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize useEffect dependencies
- Avoid unnecessary state updates

### 16.2 Backend Performance

**Database Optimization:**
- Use indexes for frequently queried fields
- Implement pagination for large datasets
- Select only needed fields with `select`
- Use caching for frequently accessed data

### 16.3 Bundle Optimization

- Code split large components
- Remove unused dependencies
- Use production builds for deployment
- Monitor bundle size regularly

---

## 17. APPENDIX: CONFIGURATION FILES

### ESLint Configuration

```json
{
  "env": {
    "browser": true,
    "node": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "rules": {
    "no-var": "error",
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "no-console": "warn",
    "no-unused-vars": "warn"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

---

## DOCUMENT INFORMATION

**Version History:**
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-20 | Initial comprehensive standards document |

**Document Status:** Final - Ready for Submission

**Next Review Date:** Q3 2026

**Approval Signatures:**
- Project Lead: _________________ Date: _______
- Team Members: ________________ Date: _______

---

**Total Pages:** 20+  
**Last Updated:** April 20, 2026  
**Document ID:** CODING_STANDARDS_DOCUMENT_v1.0

This document serves as the authoritative guide for all coding practices in the Coffee Cupping Event Management System project. All team members are required to review, understand, and adhere to these standards throughout the development process.
