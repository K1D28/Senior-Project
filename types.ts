export enum Role {
  ADMIN = 'ADMIN',
  Q_GRADER = 'Q_GRADER',
  HEAD_JUDGE = 'HEAD_JUDGE',
  FARMER = 'FARMER',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roles: Role[];
  status: 'Active' | 'Pending Invitation' | 'Deactivated';
  lastLogin: string; // ISO Date string
  profilePictureUrl?: string;
}

export interface Farmer extends User {
  role: Role.FARMER;
  supabaseId: string;
  farmName?: string;
  region?: string;
}

export interface QGrader extends User {
  role: Role.Q_GRADER;
  supabaseId: string;
  certifications?: string[];
}

export interface Admin extends User {
  role: Role.ADMIN;
  supabaseId: string;
  permissions?: string[];
}

export interface HeadJudge extends User {
  role: Role.HEAD_JUDGE;
  supabaseId: string;
  adjudicationExperience?: number; // Years of experience
}

export interface ActivityLog {
  id: string;
  userId: string;
  timestamp: string; // ISO Date string
  action: string;
  performedBy: string; // User ID
}

export interface CoffeeSample {
  id: string;
  farmerId: string;
  // Optional name included by the /api/samples endpoint to avoid repeated lookups
  farmerName?: string | null;
  blindCode: string;
  farmName: string;
  region: string;
  altitude: number;
  processingMethod: string;
  variety: string;
  moisture?: number;
  adjudicatedFinalScore?: number;
  gradeLevel?: string;
  headJudgeNotes?: string;
  adjudicationJustification?: string;
  flaggedForDiscussion?: boolean;
  isLocked?: boolean;
  lockedByHeadJudgeId?: string | null;
  lockedAt?: string | null;
  count?: number; // Added optional count property
}

// Normalized sample object returned by the server (/api/samples)
export interface SampleAPIResponse {
  id: string;
  blindCode?: string;
  farmName?: string;
  region?: string | null;
  altitude?: number;
  processingMethod?: string;
  variety?: string;
  moisture?: number;
  adjudicatedFinalScore?: number | null;
  farmerId?: string | null; // stringified id
  farmerName?: string | null;
}

export interface CuppingScore {
  fragrance: number;
  flavor: number;
  aftertaste: number;
  acidity: number;
  body: number;
  balance: number;
  uniformity: number;
  cleanCup: number;
  sweetness: number;
  overall: number;
  taints: number; // Number of cups with taints
  faults: number; // Number of cups with faults
  finalScore: number;
}

export interface Descriptor {
  name: string;
  intensity: number; // e.g., on a scale of 1-5
}

export interface ScoreSheet {
  id: string;
  qGraderId: string;
  sampleId: string;
  eventId: string;
  scores: CuppingScore;
  descriptors: Descriptor[];
  notes: string; // For final comments / voice dictation
  isSubmitted: boolean;
}

export interface Participant {
  id: string;
  role: Role;
  userDetails?: {
    name: string;
    email: string;
  };
}

export interface CuppingEvent {
  id: string;
  name: string;
  date: string; // Consider changing to { startDate: string, endDate: string }
  description?: string;
  processingMethods?: string[];
  assignedQGraderIds: string[];
  assignedHeadJudgeIds: string[];
  sampleIds: string[];
  isResultsRevealed: boolean;
  tags?: { id: string; tag: string }[];
  registrationOpen?: boolean;
  participants?: Participant[]; // Added participants property
  sampleCount?: number; // Added sampleCount property to represent the count of samples
}