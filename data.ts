import { Role, User, CoffeeSample, CuppingEvent, ScoreSheet, ActivityLog } from './types';
import axios from 'axios';

export const USERS: User[] = [
  { id: 'admin-1', name: 'Alice Organizer', email: 'alice@cuppinghub.com', roles: [Role.ADMIN], status: 'Active', lastLogin: '2024-10-25T10:00:00Z' },
  { id: 'headjudge-1', name: 'Eve Adjudicator', email: 'eve@cuppinghub.com', roles: [Role.HEAD_JUDGE, Role.Q_GRADER], status: 'Active', lastLogin: '2024-10-24T09:00:00Z' },
];

export const COFFEE_SAMPLES: CoffeeSample[] = [
  { id: 'sample-1', farmerId: 'farmer-1', farmName: 'Gedeo Zone Cooperative', region: 'Ethiopia, Yirgacheffe', altitude: 1900, processingMethod: 'Washed', variety: 'Heirloom', blindCode: 'A1B2', moisture: 11.5 },
  { id: 'sample-2', farmerId: 'farmer-2', farmName: 'Finca El Paraiso', region: 'Colombia, Huila', altitude: 1750, processingMethod: 'Natural', variety: 'Pink Bourbon', blindCode: 'C3D4', moisture: 10.8 },
  { id: 'sample-3', farmerId: 'farmer-1', farmName: 'Tekangu Farmers Coop', region: 'Kenya, Nyeri', altitude: 1800, processingMethod: 'Washed', variety: 'SL-28', blindCode: 'E5F6', moisture: 12.0 },
];

export const fetchCuppingEvents = async (): Promise<CuppingEvent[]> => {
  try {
    const response = await axios.get('/api/cupping-events');
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

export const ACTIVITY_LOG: ActivityLog[] = [
    { id: 'log-1', userId: 'qgrader-3', timestamp: '2024-10-26T09:00:00Z', action: 'Invitation Sent', performedBy: 'admin-1' },
    { id: 'log-2', userId: 'farmer-2', timestamp: '2024-10-20T11:00:00Z', action: 'Deactivated by Admin', performedBy: 'admin-1' },
    { id: 'log-3', userId: 'headjudge-1', timestamp: '2024-10-15T12:00:00Z', action: 'Role "Q Grader" added by Admin', performedBy: 'admin-1' },
];

export const initialData = {
    users: USERS,
    // Start with no samples in initial data — samples will be loaded from the database via API
    samples: [] as CoffeeSample[],
    events: [] as CuppingEvent[], // Explicitly type events as an array of CuppingEvent
    scores: SCORE_SHEETS,
    activityLog: ACTIVITY_LOG,
};

export type AppData = typeof initialData;
