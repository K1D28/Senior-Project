import { Role, User, CoffeeSample, CuppingEvent, ScoreSheet, ActivityLog } from './types';
import axios from 'axios';

/**
 * HISTORICAL MOCK DATA - NOT USED IN PRODUCTION
 * 
 * This file contains mock data from early development stages.
 * All user-facing components now fetch data exclusively from the backend API.
 * 
 * ✅ IMPORTANT: All actual data comes from these API endpoints:
 *   - Users: /api/users
 *   - Events: /api/cupping-events
 *   - Samples: /api/samples
 *   - Scores: /api/qgrader/scores/sample/{sampleId}
 *   - And other API endpoints in server.js
 */

/**
 * @deprecated MOCK DATA - Not used in production
 * Actual users are fetched from /api/users endpoint in AdminDashboard
 */
export const USERS: User[] = [
  { id: 'admin-1', name: 'Alice Organizer', email: 'alice@cuppinghub.com', roles: [Role.ADMIN], status: 'Active', lastLogin: '2024-10-25T10:00:00Z' },
  { id: 'headjudge-1', name: 'Eve Adjudicator', email: 'eve@cuppinghub.com', roles: [Role.HEAD_JUDGE, Role.Q_GRADER], status: 'Active', lastLogin: '2024-10-24T09:00:00Z' },
];

/**
 * @deprecated MOCK DATA - Not used in production
 * Actual samples are fetched from /api/samples endpoint
 */
export const COFFEE_SAMPLES: CoffeeSample[] = [
  { id: 'sample-1', farmerId: 'farmer-1', farmName: 'Gedeo Zone Cooperative', region: 'Ethiopia, Yirgacheffe', altitude: 1900, processingMethod: 'Washed', variety: 'Heirloom', blindCode: 'A1B2', moisture: 11.5 },
  { id: 'sample-2', farmerId: 'farmer-2', farmName: 'Finca El Paraiso', region: 'Colombia, Huila', altitude: 1750, processingMethod: 'Natural', variety: 'Pink Bourbon', blindCode: 'C3D4', moisture: 10.8 },
  { id: 'sample-3', farmerId: 'farmer-1', farmName: 'Tekangu Farmers Coop', region: 'Kenya, Nyeri', altitude: 1800, processingMethod: 'Washed', variety: 'SL-28', blindCode: 'E5F6', moisture: 12.0 },
];

export const fetchCuppingEvents = async (): Promise<CuppingEvent[]> => {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    const response = await axios.get(`${BACKEND_URL}/api/cupping-events`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cupping events:', error);
    return []; // Return an empty array in case of an error
  }
};

const calculateFinalScore = (scores: Omit<ScoreSheet['scores'], 'finalScore'>) => {
    const { taints, faults, ...rest } = scores;
    const attributeTotal = Object.values(rest).reduce((sum, val) => sum + val, 0);
    const defectTotal = (taints * 2) + (faults * 4);
    return attributeTotal - defectTotal;
}

/**
 * @deprecated MOCK DATA - Not used in production
 * Actual Q Grader scores are fetched from /api/qgrader/scores/sample/{sampleId}
 * in SampleReport.tsx and other components. These historical scores are immediately
 * replaced by database data and never displayed to users.
 */
export const SCORE_SHEETS: ScoreSheet[] = [
  // Scores for Sample 1
  {
    id: 'scoresheet-1-1', eventId: 'event-1', qGraderId: 'qgrader-1', sampleId: 'sample-1', isSubmitted: true,
    scores: { fragrance: 8.5, flavor: 8.25, aftertaste: 8, acidity: 8.5, body: 8, balance: 8.25, uniformity: 10, cleanCup: 10, sweetness: 10, overall: 8.5, taints: 0, faults: 0, finalScore: 88 },
    descriptors: [{name: 'Jasmine', intensity: 4}, {name: 'Lemon', intensity: 3}],
    notes: 'Vibrant floral notes, citrusy acidity. Very clean.'
  },
  {
    id: 'scoresheet-1-2', eventId: 'event-1', qGraderId: 'qgrader-2', sampleId: 'sample-1', isSubmitted: true,
    scores: { fragrance: 8.75, flavor: 8.5, aftertaste: 8.25, acidity: 8.5, body: 7.75, balance: 8, uniformity: 10, cleanCup: 10, sweetness: 10, overall: 8.25, taints: 0, faults: 0, finalScore: 88 },
    descriptors: [],
    notes: 'Jasmine and bergamot on the nose. Tea-like body.'
  },
  // Scores for Sample 2
  {
    id: 'scoresheet-2-1', eventId: 'event-1', qGraderId: 'qgrader-1', sampleId: 'sample-2', isSubmitted: true,
    scores: { fragrance: 8.75, flavor: 8.5, aftertaste: 8.5, acidity: 8.25, body: 8.5, balance: 8.5, uniformity: 10, cleanCup: 10, sweetness: 10, overall: 8.5, taints: 0, faults: 0, finalScore: 89.5 },
    descriptors: [{name: 'Strawberry', intensity: 5}, {name: 'Tropical Fruit', intensity: 4}],
    notes: 'Intense strawberry and tropical fruit notes. Syrupy body.'
  },
   {
    id: 'scoresheet-2-2', eventId: 'event-1', qGraderId: 'qgrader-2', sampleId: 'sample-2', isSubmitted: false,
    scores: { fragrance: 0, flavor: 0, aftertaste: 0, acidity: 0, body: 0, balance: 0, uniformity: 0, cleanCup: 0, sweetness: 0, overall: 0, taints: 0, faults: 0, finalScore: 0 },
    descriptors: [],
    notes: ''
  },
   // Q-Grader 3 has not submitted any scores yet.
];

/**
 * @deprecated MOCK DATA - Not used in production
 * Activity logs in production are managed by the backend database.
 * These historical entries are kept for reference only.
 */
export const ACTIVITY_LOG: ActivityLog[] = [
    { id: 'log-1', userId: 'qgrader-3', timestamp: '2024-10-26T09:00:00Z', action: 'Invitation Sent', performedBy: 'admin-1' },
    { id: 'log-2', userId: 'farmer-2', timestamp: '2024-10-20T11:00:00Z', action: 'Deactivated by Admin', performedBy: 'admin-1' },
    { id: 'log-3', userId: 'headjudge-1', timestamp: '2024-10-15T12:00:00Z', action: 'Role "Q Grader" added by Admin', performedBy: 'admin-1' },
];

/**
 * Initial application state structure.
 * All fields are populated from database APIs on app load and should NOT be relied upon
 * for actual functionality. See comments in each dashboard for API endpoints.
 */
export const initialData = {
    users: USERS,                   // ← Replaced by /api/users data immediately
    samples: [] as CoffeeSample[],   // ← Empty, populated from /api/samples
    events: [] as CuppingEvent[],    // ← Empty, populated from /api/cupping-events
    scores: SCORE_SHEETS,            // ← Replaced by /api/qgrader/scores/sample/{id}
    activityLog: ACTIVITY_LOG,       // ← Used as fallback only
};

export type AppData = typeof initialData;
