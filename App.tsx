import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Role, User, ScoreSheet, CoffeeSample, CuppingEvent, ActivityLog } from './types';
import { initialData, AppData } from './data';
import axios from 'axios'; // Import axios at the top of the file

import LoginScreen from './components/auth/LoginScreen';
import AdminDashboard from './components/dashboards/AdminDashboard';
import HeadJudgeDashboard from './components/dashboards/HeadJudgeDashboard';
import FarmerDashboard from './components/dashboards/FarmerDashboard';
import QGraderDashboard from './components/dashboards/QGraderDashboard';
import Header from './components/ui/Header';
import PublicLeaderboard from './components/reporting/PublicLeaderboard';

export interface AdjudicationData {
    score?: number;
    grade?: string;
    notes?: string;
    justification?: string;
    flagged?: boolean;
}

export interface NewFullEventData {
    eventDetails: Omit<CuppingEvent, 'id' | 'sampleIds' | 'isResultsRevealed' | 'assignedQGraderIds' | 'assignedHeadJudgeIds'>;
    assignedQGraderIds: string[];
    assignedHeadJudgeIds: string[];
    samples: Omit<CoffeeSample, 'id' | 'blindCode'>[];
}

export interface UserInviteData {
  emails: string[];
  roles: Role[];
  eventId?: string;
}

export interface UserUpdateData {
  name?: string;
  phone?: string;
  roles?: Role[];
}

export interface NewSampleRegistrationData {
    farmName: string;
    region: string;
    altitude: number;
    processingMethod: string;
    variety: string;
    moisture?: number;
}

export interface EventSamplesUpdateData {
  eventId: string;
  samples: CoffeeSample[]; // Full list of samples for the event, new ones will not have an ID
}

export type EventDetailsUpdateData = {
  name?: string;
  date?: string;
  description?: string;
  // Allow tags either as array of strings (what backend expects) or array of objects ({id, tag}) used in some UI code
  tags?: string[] | { id: string; tag: string }[];
  processingMethods?: string[];
};

export interface EventParticipantsUpdateData {
  eventId: string;
  assignedQGraderIds: string[];
  assignedHeadJudgeIds: string[];
}


function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appData, setAppData] = useState<AppData>({
    users: [],
    samples: [],
    events: [], // Correctly type `events` as an array of `CuppingEvent`
    scores: [],
    activityLog: [],
  });
  const [isPublicView, setIsPublicView] = useState(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const verifyAuthentication = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}` // Include token in Authorization header
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Authentication verified:', data);
        return data;
      } else {
        console.error('Authentication verification failed:', response.status);
        throw new Error('Unauthorized');
      }
    } catch (error) {
      console.error('Error verifying authentication:', error);
      throw error;
    }
  };

  useEffect(() => {
    const restoreUserState = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = await verifyAuthentication();
          localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (error) {
          console.error('Session expired, redirecting to login');
          localStorage.removeItem('currentUser');
          alert('Session expired. Please log in again.');
          navigate('/');
        }
      } else {
        navigate('/');
      }
    };

    restoreUserState();
  }, [navigate]);

  const resetLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    const timer = setTimeout(() => {
      handleLogout();
    }, 15 * 60 * 1000); // 15 minutes
    logoutTimerRef.current = timer;
  }, []);

  useEffect(() => {
    if (currentUser) {
      resetLogoutTimer();
      window.addEventListener('mousemove', resetLogoutTimer);
      window.addEventListener('keydown', resetLogoutTimer);
    }
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      window.removeEventListener('mousemove', resetLogoutTimer);
      window.removeEventListener('keydown', resetLogoutTimer);
    };
  }, [currentUser, resetLogoutTimer]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    console.log('Logging out user and redirecting to login page.');
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleShowLeaderboard = () => {
    setIsPublicView(true);
  }

  const handleExitLeaderboard = () => {
    setIsPublicView(false);
  }

  const updateScoreSheet = useCallback((updatedSheet: ScoreSheet) => {
    setAppData(prevData => {
      const scoreExists = prevData.scores.some(s => s.id === updatedSheet.id);

      if (scoreExists) {
        // Update existing score sheet
        return {
          ...prevData,
          scores: prevData.scores.map(s => s.id === updatedSheet.id ? updatedSheet : s),
        };
      } else {
        // Add new score sheet, assigning a permanent ID
        const newSheetWithProperId = {
          ...updatedSheet,
          id: `scoresheet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        return {
          ...prevData,
          scores: [...prevData.scores, newSheetWithProperId],
        };
      }
    });
  }, []);

  const revealResults = useCallback((eventId: string) => {
    setAppData(prevData => ({
      ...prevData,
      events: prevData.events.map(e =>
        e.id === eventId ? { ...e, isResultsRevealed: true } : e
      ),
    }));
  }, []);

  const onAddUser = useCallback(async (inviteData: UserInviteData) => {
    if (!currentUser) return;

    // Input validation
    if (!inviteData.emails || inviteData.emails.length === 0) {
      alert('Please provide at least one email address.');
      return;
    }
    if (!inviteData.roles || inviteData.roles.length === 0) {
      alert('Please assign at least one role.');
      return;
    }

    try {
      // Fetch existing roles from the database
      const rolesResponse = await fetch('/api/roles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!rolesResponse.ok) {
        throw new Error('Failed to fetch roles');
      }

      const existingRoles = await rolesResponse.json();

      // Add new users to the database
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(inviteData),
      });

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        if (response.ok) {
          const newUsers = await response.json();
          setAppData(prevData => ({
            ...prevData,
            users: [...prevData.users, ...newUsers],
          }));
          alert('Users invited successfully!');
        } else {
          const error = await response.json();
          alert(`Failed to invite users: ${error.message}`);
        }
      } else {
        const rawResponse = await response.text();
        console.error('Unexpected response:', rawResponse);
        alert('An unexpected error occurred. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error inviting users:', error);
      alert('An error occurred while inviting users. Please try again.');
    }
  }, [currentUser]);

  const updateUser = useCallback((userId: string, updateData: UserUpdateData) => {
    if (!currentUser) return;
    setAppData(prevData => {
      let logAction = 'Profile updated';
      if (updateData.roles) logAction = 'Roles updated';

      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        userId: userId,
        timestamp: new Date().toISOString(),
        action: logAction,
        performedBy: currentUser.id,
      };

      return {
        ...prevData,
        users: prevData.users.map(u => 
          u.id === userId ? { ...u, ...updateData } : u
        ),
        activityLog: [...prevData.activityLog, newLog],
      };
    });
  }, [currentUser]);

  const updateUsersStatus = useCallback((userIds: string[], status: User['status']) => {
    if (!currentUser) return;
    setAppData(prevData => {
       const newLogs: ActivityLog[] = userIds.map(uid => ({
            id: `log-${Date.now()}-${uid}`,
            userId: uid,
            timestamp: new Date().toISOString(),
            action: status === 'Active' ? 'Account Re-activated' : status === 'Deactivated' ? 'Account Deactivated' : 'Invitation Resent',
            performedBy: currentUser.id,
       }));
       return {
            ...prevData,
            users: prevData.users.map(u => 
                userIds.includes(u.id) ? { ...u, status } : u
            ),
            activityLog: [...prevData.activityLog, ...newLogs],
       }
    });
  }, [currentUser]);

  const assignUsersToEvent = useCallback((userIds: string[], eventId: string) => {
      if(!currentUser) return;
      setAppData(prevData => {
        const usersToAssign = prevData.users.filter(u => userIds.includes(u.id));
        const newLogs: ActivityLog[] = userIds.map(uid => ({
            id: `log-${Date.now()}-${uid}`,
            userId: uid,
            timestamp: new Date().toISOString(),
            action: `Assigned to event`,
            performedBy: currentUser.id,
        }));

        return {
            ...prevData,
            events: prevData.events.map(event => {
                if (event.id === eventId) {
                    const newGraderIds = usersToAssign.filter(u => u.roles.includes(Role.Q_GRADER)).map(u => u.id);
                    const newJudgeIds = usersToAssign.filter(u => u.roles.includes(Role.HEAD_JUDGE)).map(u => u.id);
                    return {
                        ...event,
                        assignedQGraderIds: [...new Set([...event.assignedQGraderIds, ...newGraderIds])],
                        assignedHeadJudgeIds: [...new Set([...event.assignedHeadJudgeIds, ...newJudgeIds])],
                    };
                }
                return event;
            }),
            activityLog: [...prevData.activityLog, ...newLogs],
        };
      });
  }, [currentUser]);

  const generateBlindCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let code = '';
    do {
        code = `${chars.charAt(Math.floor(Math.random() * chars.length))}${nums.charAt(Math.floor(Math.random() * nums.length))}${chars.charAt(Math.floor(Math.random() * chars.length))}${nums.charAt(Math.floor(Math.random() * nums.length))}`;
    } while (appData.samples.some(s => s.blindCode === code));
    return code;
  }, [appData.samples]);

  const createFullEvent = useCallback((fullEventData: NewFullEventData) => {
    const newSamples: CoffeeSample[] = (fullEventData.samples || []).map((sample, index) => ({
        ...sample,
        id: `sample-${Date.now()}-${index}`,
        blindCode: generateBlindCode(),
    }));
    const newEvent: CuppingEvent = {
        ...fullEventData.eventDetails,
        id: `event-${Date.now()}`,
        assignedQGraderIds: fullEventData.assignedQGraderIds || [],
        assignedHeadJudgeIds: fullEventData.assignedHeadJudgeIds || [],
        sampleIds: newSamples.map(s => s.id),
        tags: fullEventData.eventDetails.tags || [],
        processingMethods: fullEventData.eventDetails.processingMethods || [],
        isResultsRevealed: false,
    };
    setAppData(prevData => ({
        ...prevData,
        events: [...prevData.events, newEvent],
        samples: [...prevData.samples, ...newSamples],
    }));
}, [generateBlindCode]);

  const updateEventDetails = useCallback(async (eventId: string, updateData: EventDetailsUpdateData) => {
    try {
        // Update the backend
        console.log('Payload for updating event details:', updateData); // Debugging log
        await axios.put(`/api/cupping-events/${eventId}`, updateData);

        // Re-fetch the updated event data
        console.log('Fetching cupping event with ID:', eventId); // Debugging log
        const response = await axios.get(`/api/cupping-events/${eventId}`);
        const updatedEvent = response.data;

        // Update the local state
        setAppData(prevData => ({
            ...prevData,
            events: prevData.events.map(e => 
                e.id === eventId ? { ...e, ...updatedEvent } : e
            )
        }));
    } catch (error) {
        console.error('Error updating event details:', error);
    }
}, []);
  
  const updateEventParticipants = useCallback((updateData: EventParticipantsUpdateData) => {
    setAppData(prevData => ({
      ...prevData,
      events: prevData.events.map(e =>
        e.id === updateData.eventId ? { 
          ...e, 
          assignedQGraderIds: updateData.assignedQGraderIds,
          assignedHeadJudgeIds: updateData.assignedHeadJudgeIds,
        } : e
      )
    }));
  }, []);

  const updateEventSamples = useCallback((updateData: EventSamplesUpdateData) => {
    const { eventId, samples: finalSamples } = updateData;

    setAppData(prevData => {
        const eventToUpdate = prevData.events.find(e => e.id === eventId);
        if (!eventToUpdate) return prevData;

        const originalSampleIds: Set<string> = new Set(eventToUpdate.sampleIds);
        const finalSampleIds: Set<string> = new Set();
        
        const processedSamples = finalSamples.map(sample => {
            if (prevData.samples.some(s => s.id === sample.id)) {
                // It's an existing sample being updated.
                finalSampleIds.add(sample.id);
                return sample;
            } else {
                // It's a new sample.
                const newSample: CoffeeSample = {
                    ...sample,
                    id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    blindCode: generateBlindCode(),
                };
                finalSampleIds.add(newSample.id);
                return newSample;
            }
        });
        
        const deletedSampleIds = [...originalSampleIds].filter(id => !finalSampleIds.has(id));

        let updatedGlobalSamples = prevData.samples
            .filter(s => !deletedSampleIds.includes(s.id))
            .map(s => processedSamples.find(ps => ps.id === s.id) || s);
        
        const newSamplesToAdd = processedSamples.filter(s => !originalSampleIds.has(s.id));
        updatedGlobalSamples.push(...newSamplesToAdd);

        const updatedEvents = prevData.events.map(event => {
            if (event.id === eventId) {
                return { ...event, sampleIds: Array.from(finalSampleIds) };
            }
            return event;
        });

        return {
            ...prevData,
            samples: updatedGlobalSamples,
            events: updatedEvents,
        };
    });
}, [generateBlindCode]);

  const updateSampleAdjudication = useCallback((sampleId: string, finalData: AdjudicationData) => {
    setAppData(prevData => ({
      ...prevData,
      samples: prevData.samples.map(s => 
        s.id === sampleId 
        ? { 
            ...s, 
            adjudicatedFinalScore: finalData.score ?? s.adjudicatedFinalScore, 
            gradeLevel: finalData.grade ?? s.gradeLevel, 
            headJudgeNotes: finalData.notes ?? s.headJudgeNotes,
            adjudicationJustification: finalData.justification ?? s.adjudicationJustification,
            flaggedForDiscussion: finalData.flagged ?? s.flaggedForDiscussion,
          } 
        : s
      ),
    }));
  }, []);
  
  const registerForEvent = useCallback((eventId: string, sampleData: NewSampleRegistrationData) => {
    if (!currentUser || !currentUser.roles.includes(Role.FARMER)) return;

    const newSample: CoffeeSample = {
        ...sampleData,
        id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        farmerId: currentUser.id,
        blindCode: 'PENDING', // Admin will assign this later
    };

    setAppData(prevData => {
        const updatedEvents = prevData.events.map(event => {
            if (event.id === eventId) {
                return {
                    ...event,
                    sampleIds: [...event.sampleIds, newSample.id],
                };
            }
            return event;
        });

        return {
            ...prevData,
            samples: [...prevData.samples, newSample],
            events: updatedEvents,
        };
    });
  }, [currentUser]);


  const renderDashboard = () => {
    if (!currentUser) return null;

    // Use the primary role (first in the array) to determine which dashboard to show.
    switch (currentUser.roles[0]) {
      case Role.ADMIN:
        return <AdminDashboard 
            currentUser={currentUser} 
            appData={appData} 
            onRevealResults={revealResults}
            onCreateFullEvent={createFullEvent}
            onAddUser={onAddUser}
            onUpdateUser={updateUser}
            onUpdateUsersStatus={updateUsersStatus}
            onAssignUsersToEvent={assignUsersToEvent}
            onUpdateEventSamples={updateEventSamples}
            onUpdateEventDetails={updateEventDetails}
            onUpdateEventParticipants={updateEventParticipants}
            onLogout={handleLogout}
        />;
      default:
        return <div>Invalid Role</div>;
    }
  };

  if (isPublicView) {
    return <PublicLeaderboard appData={appData} onExit={handleExitLeaderboard} />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-text-dark">
      <Routes>
        <Route path="/" element={<LoginScreen onLogin={handleLogin} />} />
        <Route path="/login" element={<LoginScreen onLogin={handleLogin} />} />
        <Route 
          path="/admin-dashboard"
          element={
            currentUser ? (
              <AdminDashboard
                currentUser={currentUser}
                appData={appData}
                onRevealResults={revealResults}
                onCreateFullEvent={createFullEvent}
                onAddUser={onAddUser}
                onUpdateUser={updateUser}
                onUpdateUsersStatus={updateUsersStatus}
                onAssignUsersToEvent={assignUsersToEvent}
                onUpdateEventSamples={updateEventSamples}
                onUpdateEventDetails={updateEventDetails}
                onUpdateEventParticipants={updateEventParticipants}
                onLogout={handleLogout}
              />
            ) : (
              <LoginScreen onLogin={handleLogin} />
            )
          }
        />
        <Route 
          path="/headjudge-dashboard"
          element={
            currentUser ? (
              <HeadJudgeDashboard
                currentUser={currentUser}
                appData={appData}
                onUpdateAdjudication={updateSampleAdjudication}
                onLogout={handleLogout}
              />
            ) : (
              <LoginScreen onLogin={handleLogin} />
            )
          }
        />
        <Route 
          path="/farmer-dashboard"
          element={
            currentUser ? (
              <FarmerDashboard
                currentUser={currentUser}
                appData={appData}
                onRegisterForEvent={registerForEvent}
                onLogout={handleLogout}
              />
            ) : (
              <LoginScreen onLogin={handleLogin} />
            )
          }
        />
        <Route 
          path="/qgrader-dashboard"
          element={
            currentUser ? (
              <QGraderDashboard
                currentUser={currentUser}
                appData={appData}
                onUpdateScoreSheet={updateScoreSheet}
                onLogout={handleLogout}
              />
            ) : (
              <LoginScreen onLogin={handleLogin} />
            )
          }
        />
        <Route 
          path="/leaderboard"
          element={
            <PublicLeaderboard 
              appData={appData} 
              onExit={() => navigate(-1)} // Navigate back to the previous page
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;