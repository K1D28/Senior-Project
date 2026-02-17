import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Role, CoffeeSample, CuppingEvent } from '../../types';
import { AppData, initialData } from '../../data';
import { NewFullEventData, UserInviteData, UserUpdateData, EventSamplesUpdateData, EventDetailsUpdateData, EventParticipantsUpdateData } from '../../App';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Filter, FileText, UserPlus, Users, Coffee, BarChart2, Calendar, Download, Trophy, Edit, MoreHorizontal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SampleReport from '../reporting/SampleReport';
import PublicLeaderboard from '../reporting/PublicLeaderboard';
import EventCreationWizard from '../admin/EventCreationWizard';
import UserManagement from '../admin/UserManagement';
import UserProfile from '../admin/UserProfile';
import UserInvitationModal from '../admin/UserInvitationModal';
import EventManagementModal from '../admin/EventManagementModal';
import EventEditModal from '../admin/EventEditModal';
import EventParticipantsModal from '../admin/EventParticipantsModal';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Dropdown } from '../ui/DropdownMenu';

// Smooth transition styles
const transitionStyles = `
  html, body, #root {
    background-color: white;
    margin: 0;
    padding: 0;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .transition-smooth {
    animation: fadeIn 0.4s ease-in-out;
  }
`;

// Coffee Cup Logo with Continuous Evaporation Animation
const CoffeeCupLogo: React.FC<{ size?: number }> = ({ size = 48 }) => {
    return (
        <div 
            className="relative"
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
            >
                {/* Cup Body */}
                <rect x="20" y="30" width="50" height="40" rx="4" fill="#6B4423" stroke="#3D2817" strokeWidth="1.5" />
                
                {/* Cup Highlight */}
                <rect x="22" y="32" width="8" height="32" rx="3" fill="#8B5A2B" opacity="0.6" />
                
                {/* Handle */}
                <path
                    d="M 75 40 Q 90 40 90 50 Q 90 60 75 60"
                    fill="none"
                    stroke="#6B4423"
                    strokeWidth="3"
                />
                
                {/* Handle Highlight */}
                <path
                    d="M 76 42 Q 85 42 85 50 Q 85 58 76 58"
                    fill="none"
                    stroke="#8B5A2B"
                    strokeWidth="1.5"
                    opacity="0.5"
                />
                
                {/* Coffee inside */}
                <rect x="22" y="35" width="46" height="30" fill="#4A2511" opacity="0.8" />
                
                {/* Evaporation Curved Lines - flowing wavy steam */}
                {/* Line 1 - Left */}
                <path 
                    d="M 32 32 Q 28 28 30 20 Q 32 12 28 5" 
                    stroke="#B8860B" 
                    strokeWidth="3" 
                    fill="none" 
                    strokeLinecap="round"
                    opacity="0.8"
                    style={{ animation: 'float 2s ease-in-out infinite' }} 
                />
                
                {/* Line 2 - Center */}
                <path 
                    d="M 50 30 Q 48 25 50 18 Q 52 10 50 2" 
                    stroke="#B8860B" 
                    strokeWidth="3" 
                    fill="none" 
                    strokeLinecap="round"
                    opacity="0.8"
                    style={{ animation: 'float 2s ease-in-out infinite 0.3s' }} 
                />
                
                {/* Line 3 - Right */}
                <path 
                    d="M 68 32 Q 72 28 70 20 Q 68 12 72 5" 
                    stroke="#B8860B" 
                    strokeWidth="3" 
                    fill="none" 
                    strokeLinecap="round"
                    opacity="0.8"
                    style={{ animation: 'float 2s ease-in-out infinite 0.6s' }} 
                />
                
                <style>{`
                    @keyframes float {
                        0% {
                            transform: translateY(0) scaleY(1);
                            opacity: 0.8;
                        }
                        50% {
                            opacity: 0.6;
                        }
                        100% {
                            transform: translateY(-15px) scaleY(0.95);
                            opacity: 0.4;
                        }
                    }
                `}</style>
                
                {/* Saucer */}
                <ellipse cx="45" cy="75" rx="32" ry="8" fill="#8B5A2B" stroke="#3D2817" strokeWidth="1.5" />
                <ellipse cx="45" cy="74" rx="32" ry="6" fill="#A0704D" opacity="0.6" />
            </svg>
        </div>
    );
};

type SampleData = CoffeeSample & { blindCode: string }; // Ensure `blindCode` is included in `SampleData`

interface AdminDashboardProps {
  currentUser: User;
  appData: AppData; // Added appData to the props
  onRevealResults: (eventId: string) => void;
  onCreateFullEvent: (fullEventData: NewFullEventData) => void;
  onAddUser: (data: UserInviteData) => void;
  onUpdateUser: (userId: string, data: UserUpdateData) => void;
  onUpdateUsersStatus: (userIds: string[], status: User['status']) => void;
  onAssignUsersToEvent: (userIds: string[], eventId: string) => void;
  onUpdateEventSamples: (data: EventSamplesUpdateData) => void;
  onUpdateEventDetails: (eventId: string, data: EventDetailsUpdateData) => void;
  onUpdateEventParticipants: (data: EventParticipantsUpdateData) => void;
  onLogout: () => void;
}

type Tab = 'events' | 'users' | 'samples' | 'results' | 'leaderboard';
type SortableSampleKeys = keyof CoffeeSample | 'farmerName';

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const {
        currentUser,
        onLogout,
        onCreateFullEvent = () => {}, // Provide default no-op functions
        onAddUser = () => {},
        onRevealResults = () => {},
        onUpdateUser = () => {},
        onUpdateUsersStatus = () => {},
        onAssignUsersToEvent = () => {},
        onUpdateEventSamples, // Added to fix error
        onUpdateEventDetails, // Added to fix error
        onUpdateEventParticipants, // Added to fix error
        ...restProps
    } = props;
    const [appData, setAppData] = useState<AppData>({
        ...initialData,
        events: [] as CuppingEvent[], // Explicitly type events as an array of CuppingEvent
    }); // Default to mock data
    const [activeTab, setActiveTab] = useState<Tab>('events');
    const navigate = useNavigate();
    
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token'); // Retrieve token from localStorage
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [usersResponse, eventsResponse, samplesResponse, participantsResponse] = await Promise.all([
                axios.get('/api/users', { headers }),
                axios.get('/api/cupping-events', { headers }),
                axios.get('/api/samples', { headers }),
                axios.get('/api/participants', { headers }),
            ]);

            console.log('Fetched events data:', eventsResponse.data); // Debugging log

            const users: User[] = usersResponse.data.map((user: any) => ({
                // Normalize id to string and preserve full user fields so components can display names and other details
                id: String(user.id),
                name: user.name,
                email: user.email,
                phone: user.phone,
                roles: Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []),
                status: user.status,
                lastLogin: user.lastLogin,
                profilePictureUrl: user.profilePictureUrl,
            })) as User[];

            // Merge farmers from /api/participants into users so lookups by farmerId work
            const participantsData = participantsResponse.data || { farmers: [] };
            const farmersFromParticipants = Array.isArray(participantsData.farmers) ? participantsData.farmers.map((f: any, idx: number) => {
                // Participants API may return different shapes (id, userId, userDetails.id). Normalize safely.
                const resolvedId = String(f.id ?? f.userId ?? f.farmerId ?? `farm-${idx}-${(f.email || 'unknown')}`);
                const resolvedName = f.name ?? f.userDetails?.name ?? f.email ?? `Farmer ${resolvedId}`;
                return {
                    id: resolvedId,
                    name: resolvedName,
                    email: f.email,
                    roles: ['FARMER'],
                };
            }) : [];

            // If there are farmers, append them to users list unless an id collision already exists
            const existingUserIds = new Set<string>(users.map((u: User) => u.id));
            const mergedUsers = users.concat(farmersFromParticipants.filter((f: any) => !existingUserIds.has(f.id)));

            const events = eventsResponse.data.map((event: any) => ({
                // Normalize ids and sampleIds to strings
                ...event,
                id: String(event.id),
                sampleIds: Array.isArray(event.sampleIds) ? event.sampleIds.map((id: any) => String(id)) : [],
                participants: event.participants || [], // Ensure participants is always an array
            }));

            // Normalize samples to use string ids for farmerId and id so lookups match users
            const samples = (samplesResponse.data || []).map((s: any) => ({
                ...s,
                id: String(s.id),
                farmerId: s.farmerId !== undefined && s.farmerId !== null ? String(s.farmerId) : s.farmerId,
            }));

            setAppData({
                ...appData,
                users: mergedUsers,
                events,
                samples,
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('An error occurred while fetching data. Please try again later.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const restoreUserState = async () => {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                try {
                    const response = await fetch('http://localhost:5001/api/auth/verify', {
                        method: 'GET',
                        credentials: 'include',
                    });
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Authentication verified:', data);
                        // Ensure the user state is restored
                        localStorage.setItem('currentUser', JSON.stringify(user));
                    } else if (response.status === 401) {
                        console.log('Session expired, redirecting to login');
                        localStorage.removeItem('currentUser'); // Clear invalid user state
                        alert('Session expired. Please log in again.'); // Show popup message
                        navigate('/'); // Redirect to login page
                    }
                } catch (error) {
                    console.error('Error verifying authentication:', error);
                    localStorage.removeItem('currentUser'); // Clear invalid user state
                    alert('Session expired. Please log in again.'); // Show popup message
                    navigate('/'); // Redirect to login page
                }
            } else {
                navigate('/');
            }
        };
        restoreUserState();
    }, [navigate]);

    useEffect(() => {
        console.log('Debugging appData.samples:', appData.samples); // Log the samples data for debugging
    }, [appData.samples]);

    useEffect(() => {
        console.log('Debugging appData.events:', appData.events); // Log the events data for debugging
    }, [appData.events]);

    if (!appData) {
        return <div>Loading...</div>;
    }

    // Modal states
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isSampleDetailModalOpen, setIsSampleDetailModalOpen] = useState(false);
    const [selectedSample, setSelectedSample] = useState<CoffeeSample | null>(null);
    const [viewingReportForSample, setViewingReportForSample] = useState<CoffeeSample | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isManageEventModalOpen, setIsManageEventModalOpen] = useState(false);
    const [eventToManage, setEventToManage] = useState<CuppingEvent | null>(null);
    const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CuppingEvent | null>(null);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [eventToManageParticipants, setEventToManageParticipants] = useState<CuppingEvent | null>(null);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [sampleForApproval, setSampleForApproval] = useState<CoffeeSample | null>(null);


    // User Management State
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);

    // Event Expansion State
    const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());

    // Sorting & Filtering State
    const [sortConfig, setSortConfig] = useState<{ key: SortableSampleKeys; direction: 'ascending' | 'descending' } | null>({ key: 'blindCode', direction: 'ascending' });
    const [processFilter, setProcessFilter] = useState('All');
    const [tagFilter, setTagFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('All');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Temporarily removed the revealedEvents function as the focus is on Cupping Events & Samples
    // const revealedEvents = useMemo(() => appData.events
    //     .filter(e => e.isResultsRevealed)
    //     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    //     [appData.events]);

    const [eventFilter, setEventFilter] = useState<string>('all');

    const toggleEventExpansion = (eventId: string) => {
        setExpandedEventIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(eventId)) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });
    };


    const reportData = useMemo(() => {
        let samplesToConsider: CoffeeSample[] = [];
        if (eventFilter === 'all') {
            // Only include samples from events where results have been revealed
            const revealedEventIds = new Set((appData.events || []).filter(e => e.isResultsRevealed).map(e => String(e.id)));
            const samplesInRevealedEvents = new Set<string>();
            (appData.events || []).filter(e => e.isResultsRevealed).forEach(e => {
                (e.sampleIds || []).forEach(sampleId => samplesInRevealedEvents.add(String(sampleId)));
            });
            samplesToConsider = (appData.samples || []).filter(s => {
                return samplesInRevealedEvents.has(String(s.id)) && (s.adjudicatedFinalScore !== undefined && s.adjudicatedFinalScore > 0);
            });
        } else {
            const selectedEvent = appData.events.find(e => e.id === eventFilter);
            // If event not found or not revealed, return no samples
            if (!selectedEvent || !selectedEvent.isResultsRevealed) {
                return [] as CoffeeSample[];
            }
            if (selectedEvent && Array.isArray(selectedEvent.sampleIds)) {
                samplesToConsider = appData.samples.filter(s => selectedEvent.sampleIds?.includes(s.id) && (s.adjudicatedFinalScore !== undefined && s.adjudicatedFinalScore > 0));
            } else {
                console.warn('Selected event does not have valid sampleIds or sampleIds is undefined:', selectedEvent);
                samplesToConsider = [];
            }
        }
        const filteredByProcess = samplesToConsider.filter(s => processFilter === 'All' || s.processingMethod === processFilter);
        const ranked = filteredByProcess.sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0));
        return ranked;
    }, [appData.samples, appData.events, eventFilter, processFilter]);

    const scoreDistributionData = useMemo(() => {
        const bins = [
            { name: '< 82', count: 0 }, { name: '82-84', count: 0 }, { name: '84-86', count: 0 },
            { name: '86-88', count: 0 }, { name: '88-90', count: 0 }, { name: '90+', count: 0 },
        ];
        reportData.forEach(sample => {
            const score = sample.adjudicatedFinalScore ?? 0;
            if (score >= 90) bins[5].count++;
            else if (score >= 88) bins[4].count++;
            else if (score >= 86) bins[3].count++;
            else if (score >= 84) bins[2].count++;
            else if (score >= 82) bins[1].count++;
            else if (score > 0) bins[0].count++;
        });
        return bins;
    }, [reportData]);

    const keyMetrics = useMemo(() => {
        if (reportData.length === 0) return { avg: 0, high: 0, low: 0, count: 0 };
        const scores = reportData.map(s => s.adjudicatedFinalScore ?? 0);
        return {
            avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
            high: Math.max(...scores).toFixed(2),
            low: Math.min(...scores).toFixed(2),
            count: scores.length
        }
    }, [reportData]);
    
    const processingMethods = useMemo(() => {
        const methods = new Set<string>();
        appData.samples.forEach(sample => {
            if (sample.processingMethod) methods.add(sample.processingMethod); // Ensure processingMethod is not undefined
        });
        return ['All', ...Array.from(methods).sort()];
    }, [appData.samples]);
    
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        appData.events.forEach(event => {
            (event.tags || []).forEach(tag => {
                if (tag && typeof tag === 'string') tags.add(tag); // Ensure tag is a string
            });
        });
        return ['All', ...Array.from(tags).sort()];
    }, [appData.events]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Format as yyyy-MM-dd
    };

    // Helper to resolve farmer name from multiple possible sources (users list or event participants)
    const getFarmerName = (sample: { farmerId?: string | null; farmerName?: string | null } | null | undefined): string => {
        if (!sample) return 'Unknown';
        // 0) Prefer server-provided farmerName to avoid id collisions across tables
        const provided = (sample as any).farmerName;
        if (typeof provided === 'string' && provided.trim() !== '') return provided;
        if (sample.farmerId === undefined || sample.farmerId === null || String(sample.farmerId).trim() === '') return 'Unknown';
        const fid = String(sample.farmerId);
        const users = Array.isArray(appData.users) ? appData.users : [];
        // 1) Search participants across events by role FARMER and explicit farmerId match
        for (const ev of appData.events || []) {
            if (!Array.isArray(ev.participants)) continue;
            const p = ev.participants.find(part => {
                const roleOk = (part as any).role === 'FARMER';
                const pid = (part as any).farmerId !== undefined && (part as any).farmerId !== null ? String((part as any).farmerId) : '';
                return roleOk && pid === fid;
            });
            if (p) {
                const nm = (p as any).userDetails?.name || (p as any).name;
                if (nm) return nm;
            }
        }
        // 2) Fallback: check merged users list but restrict to FARMER role to avoid collisions with Admin/User ids
        const userByFarmer = users.find(u => String(u.id) === fid && Array.isArray(u.roles) && u.roles.includes(Role.FARMER) && u.name);
        if (userByFarmer && userByFarmer.name) return userByFarmer.name;
        // 3) Check event-level assigned farmer arrays
        for (const ev of appData.events || []) {
            const assigned = (ev as any).assignedFarmers || (ev as any).assignedFarmerIds;
            if (Array.isArray(assigned)) {
                const match = assigned.find((af: any) => String(af?.id ?? af) === fid);
                const nm = (match as any)?.name;
                if (nm) return nm;
            }
        }
        return 'Unknown';
    };

    const filteredEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const applyDateFilter = (event: CuppingEvent): boolean => {
            const eventDate = new Date(event.date);
            switch (dateFilter) {
                case 'This Week': {
                    const firstDayOfWeek = new Date(today);
                    firstDayOfWeek.setDate(today.getDate() - today.getDay());
                    const lastDayOfWeek = new Date(firstDayOfWeek);
                    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
                    return eventDate >= firstDayOfWeek && eventDate <= lastDayOfWeek;
                }
                case 'Last Month': {
                    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    return eventDate >= firstDayOfLastMonth && eventDate <= lastDayOfLastMonth;
                }
                case 'Custom': {
                    if (!customStartDate || !customEndDate) return true;
                    const startDate = new Date(customStartDate);
                    const endDate = new Date(customEndDate);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return true;
                    return eventDate >= startDate && eventDate <= endDate;
                }
                case 'All':
                default:
                    return true;
            }
        };

        return appData.events.filter((event: CuppingEvent) => {
            const matchesTag = tagFilter === 'All' || (event.tags && event.tags.some(tag => tag.tag === tagFilter));
            const matchesDate = applyDateFilter(event);
            return matchesTag && matchesDate;
        });
    }, [appData.events, tagFilter, dateFilter, customStartDate, customEndDate]);

    const handleOpenWizard = () => setIsWizardOpen(true);
    const handleCloseWizard = () => setIsWizardOpen(false);

    const handleWizardSubmit = async (createdEventData: any) => {
        try {
            // Await parent handler (may be sync or async) — this gives parent chance to update state
            await Promise.resolve(onCreateFullEvent(createdEventData as NewFullEventData));
        } catch (err) {
            console.warn('onCreateFullEvent failed or received unexpected payload; falling back to server refresh.', err);
        } finally {
            handleCloseWizard();
            setActiveTab('events'); // Redirect to the Cupping Event list
            // Wait for fetchData to finish so UI is refreshed when modal closes
            try {
                await fetchData();
            } catch (e) {
                console.warn('fetchData failed after event creation', e);
            }
        }
    };
    
     const handleViewSampleDetails = (sample: CoffeeSample) => {
        setSelectedSample(sample);
        setIsSampleDetailModalOpen(true);
    };

    const handleOpenApprovalModal = (sample: CoffeeSample) => {
        setSampleForApproval(sample);
        setIsApprovalModalOpen(true);
    };

    const handleApproveSample = async (sampleId: string | number) => {
        try {
            const response = await fetch(`http://localhost:5001/api/samples/${sampleId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const approvedSample = await response.json();
                console.log('Sample approved:', approvedSample);
                alert('Sample approved! Blind code assigned: ' + approvedSample.blindCode);
                // Update local appData
                setAppData(prevData => ({
                    ...prevData,
                    samples: prevData.samples.map(s => 
                        s.id === String(sampleId) 
                            ? { ...s, approvalStatus: 'APPROVED', blindCode: approvedSample.blindCode }
                            : s
                    )
                }));
                setIsApprovalModalOpen(false);
                setSampleForApproval(null);
            } else {
                const error = await response.json();
                alert('Failed to approve sample: ' + error.message);
            }
        } catch (error) {
            console.error('Error approving sample:', error);
            alert('Error approving sample');
        }
    };

    const handleDeclineSample = async (sampleId: string | number) => {
        try {
            const response = await fetch(`http://localhost:5001/api/samples/${sampleId}/decline`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (response.ok) {
                console.log('Sample declined and deleted');
                alert('Sample declined and removed');
                // Update local appData
                setAppData(prevData => ({
                    ...prevData,
                    samples: prevData.samples.filter(s => s.id !== String(sampleId))
                }));
                setIsApprovalModalOpen(false);
                setSampleForApproval(null);
            } else {
                const error = await response.json();
                alert('Failed to decline sample: ' + error.message);
            }
        } catch (error) {
            console.error('Error declining sample:', error);
            alert('Error declining sample');
        }
    };

    const renderSampleDetails = (sample: CoffeeSample) => {
        const eventForSample = appData.events.find(e => e.sampleIds?.includes(sample.id));
        if (!eventForSample) {
            return <p className="text-sm text-text-light mt-2">null</p>;
        }
        if (!eventForSample.isResultsRevealed) {
            return <p className="text-sm text-text-light mt-2">Scores are hidden until results are revealed for the event "{eventForSample.name}".</p>;
        }
        const scores = appData.scores.filter(s => s.sampleId === sample.id && s.eventId === eventForSample.id && s.isSubmitted);
        if (scores.length === 0) {
            return <p className="text-sm text-text-light mt-2">No scores have been submitted for this sample yet.</p>;
        }
        return (
            <div className="space-y-3 mt-2">
                {scores.map(score => {
                    const grader = appData.users.find(u => u.id === score.qGraderId);
                    return (
                        <div key={score.id} className="p-3 bg-background rounded-md border border-border">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">{grader?.name || 'Unknown Grader'}</span>
                                <span className="font-bold text-primary">{score.scores.finalScore.toFixed(2)}</span>
                            </div>
                            <p className="text-sm text-text-light italic mt-1">"{score.notes}"</p>
                        </div>
                    );
                })}
            </div>
        );
    };
    
    const handleInviteSubmit = (inviteData: UserInviteData) => {
        onAddUser(inviteData);
        setIsInviteModalOpen(false); // Ensure the modal closes after submission
    }
    
    const handleExportCSV = () => {
        if (reportData.length === 0) return;
        const headers = ['Rank', 'Blind Code', 'Farm Name', 'Farmer', 'Region', 'Variety', 'Processing Method', 'Final Score'];
        const csvRows = [headers.join(',')];
        reportData.forEach((sample, index) => {
            const rank = index + 1;
            const users = Array.isArray(appData.users) ? appData.users : []; // Ensure users is an array
            const farmer = getFarmerName(sample);
            const row = [
                rank,
                sample.blindCode,
                `"${sample.farmName.replace(/"/g, '""')}"`,
                `"${farmer.replace(/"/g, '""')}"`,
                `"${sample.region.replace(/"/g, '""')}"`,
                `"${sample.variety.replace(/"/g, '""')}"`,
                sample.processingMethod,
                sample.adjudicatedFinalScore?.toFixed(2)
            ].join(',');
            csvRows.push(row);
        });
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            const eventName = eventFilter === 'all' ? 'All-Events' : appData.events.find(e => e.id === eventFilter)?.name.replace(/\s+/g, '-') || 'Event';
            link.setAttribute('download', `results-${eventName}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const sortedSamples = useMemo(() => {
        let sortableItems = [...appData.samples];
        if (sortConfig !== null) {
            const compare = (a: any, b: any) => {
                let aValue: any = '';
                let bValue: any = '';

                if (sortConfig.key === 'farmerName') {
                    aValue = getFarmerName(a);
                    bValue = getFarmerName(b);
                } else {
                    aValue = a[sortConfig.key as keyof CoffeeSample] ?? '';
                    bValue = b[sortConfig.key as keyof CoffeeSample] ?? '';
                }

                // Normalize strings safely and handle null/undefined
                const normalize = (v: any) => (v === null || v === undefined) ? '' : (typeof v === 'string' ? v.toLowerCase() : v);
                const na = normalize(aValue);
                const nb = normalize(bValue);

                if (na < nb) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (na > nb) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            };

            sortableItems.sort(compare);
        }
        return sortableItems;
    }, [appData.samples, appData.users, appData.events, sortConfig]);

    const requestSort = (key: SortableSampleKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: SortableSampleKeys }) => {
        const isSorted = sortConfig?.key === sortKey;
        const sortIcon = isSorted ? (sortConfig?.direction === 'ascending' ? '▲' : '▼') : '';
        return (
            <th className="p-2 text-black">
                <button onClick={() => requestSort(sortKey)} className="font-bold w-full text-left flex items-center space-x-1 focus:outline-none" style={{ color: '#000' }}>
                    <span>{label}</span>
                    <span className="text-primary">{sortIcon}</span>
                </button>
            </th>
        );
    };

    const TabButton = ({ tab, label, icon: Icon }: { tab: Tab, label: string, icon: React.ElementType }) => (
        <button
            onClick={() => { setActiveTab(tab); setViewingUserId(null); }}
            className={`w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );
    
    const rankColors: { [key: number]: string } = {
        1: 'border-yellow-400 bg-yellow-50',
        2: 'border-gray-400 bg-gray-50',
        3: 'border-orange-400 bg-orange-50',
    };

    const handleCreateEvent = async (newEvent: Partial<CuppingEvent>) => {
        try {
            const response = await axios.post('/api/cupping-events', newEvent);
            setAppData((prevData) => ({
                ...prevData,
                events: [...prevData.events, {
                    ...response.data,
                    tags: Array.isArray(response.data.tags) ? response.data.tags : [],
                    processingMethods: Array.isArray(response.data.processingMethods) ? response.data.processingMethods : [],
                    participants: Array.isArray(response.data.participants) ? response.data.participants : [],
                    samples: Array.isArray(response.data.samples) ? response.data.samples : [],
                }],
            }));
            setIsWizardOpen(false); // Close the event creation wizard
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    const handleEditEvent = async (eventId: string, updatedEvent: Partial<CuppingEvent>) => {
        try {
            const response = await axios.put(`/api/cupping-events/${eventId}`, {
                ...updatedEvent,
                tags: updatedEvent.tags?.map(tag => (typeof tag === 'object' ? tag.tag : tag)), // Ensure tags are strings
            });
            setAppData((prevData) => ({
                ...prevData,
                events: prevData.events.map((event) =>
                    event.id === eventId ? { ...response.data } : event
                ),
            }));
            console.log('Event updated successfully:', response.data);
        } catch (error) {
            console.error('Error editing event:', error);
        }
    };

    const handleUpdateParticipants = async (eventId: string, updatedParticipants: EventParticipantsUpdateData) => {
        try {
            const response = await axios.put(`/api/cupping-events/${eventId}/participants`, updatedParticipants);
            setAppData((prevData) => ({
                ...prevData,
                events: prevData.events.map((event) =>
                    event.id === eventId ? { ...response.data } : event
                ),
            }));
            console.log('Participants updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating participants:', error);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        try {
            await axios.delete(`/api/cupping-events/${eventId}`);
            setAppData((prevData) => ({
                ...prevData,
                events: prevData.events.filter((event) => event.id !== eventId),
            }));
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const renderActions = (event: CuppingEvent) => (
        <div className="p-2 border border-border rounded-md bg-background shadow-sm relative overflow-visible">
            <Dropdown>
                <Dropdown.Trigger title="Actions">...</Dropdown.Trigger>
                <Dropdown.Content>
                    <Dropdown.Item onClick={() => { setEventToEdit(event); setIsEditEventModalOpen(true); }}>
                        Edit Event Details
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => { setEventToManageParticipants(event); setIsParticipantsModalOpen(true); }}>
                        Manage Participants
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleDeleteEvent(event.id)} className="text-red-600">
                        Delete Event
                    </Dropdown.Item>
                </Dropdown.Content>
            </Dropdown>
        </div>
    );

    // Update the renderTags function to handle tags as objects
    const renderTags = (tags: { id: string; tag: string }[] | undefined, eventId: string) => {
        return (tags || []).map((tagObj) => (
            <span key={tagObj.id} className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {tagObj.tag}
            </span>
        ));
    };

    // Update participant assignment logic to filter by role
    const renderParticipants = (participants: CuppingEvent['participants'] = []) => {
        const headJudges = participants.filter(p => p.role === 'HEAD_JUDGE');
        const qGraders = participants.filter(p => p.role === 'Q_GRADER');
        const farmers = participants.filter(p => p.role === 'FARMER');

        return (
            <div>
                {headJudges.length > 0 && (
                    <div>
                        <h4 className="font-bold">Head Judges</h4>
                        <ul>
                            {headJudges.map(judge => (
                                <li key={judge.id}>{judge.userDetails?.name || 'Unknown'}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {qGraders.length > 0 && (
                    <div>
                        <h4 className="font-bold">Q Graders</h4>
                        <ul>
                            {qGraders.map(grader => (
                                <li key={grader.id}>{grader.userDetails?.name || 'Unknown'}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {farmers.length > 0 && (
                    <div>
                        <h4 className="font-bold">Farmers</h4>
                        <ul>
                            {farmers.map(farmer => (
                                <li key={farmer.id}>{farmer.userDetails?.name || 'Unknown'}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

  return (
    <>
    <style>{transitionStyles}</style>
    <div className="fixed inset-0 bg-white flex flex-col">
        {/* Main Layout with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar Menu */}
            <div className="w-64 bg-white border-r border-gray-100 shadow-sm overflow-y-auto flex flex-col">
                {/* Logo Section */}
                <div className="p-6 border-b border-gray-100 flex flex-col items-center gap-2">
                    <CoffeeCupLogo size={56} />
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-gray-900">Cupping Lab</h1>
                        <p className="text-xs text-gray-500">Coffee Quality</p>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex flex-col p-4 gap-2 flex-1">
                    <TabButton tab="events" label="Cupping Events" icon={Coffee} />
                    <TabButton tab="users" label="Manage Users" icon={Users} />
                    <TabButton tab="samples" label="All Samples" icon={FileText} />
                    <TabButton tab="results" label="Results & Reporting" icon={BarChart2} />
                    <TabButton tab="leaderboard" label="Leaderboard" icon={Trophy} />
                </nav>

                {/* Admin Profile Section at Bottom */}
                <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
                    {/* Admin Profile Card */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 w-full">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                            {currentUser?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-gray-600">Admin</span>
                            <span className="text-xs font-bold text-gray-800 truncate">{currentUser?.name || 'Admin'}</span>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="w-full bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-white to-blue-50/30">
                <div className="p-6">

        {activeTab === 'events' && (
            <Card className="transition-smooth">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-extrabold text-primary">Cupping Events</h3>
                    <Button onClick={handleOpenWizard} className="flex items-center space-x-2 bg-primary text-white hover:bg-primary-dark">
                        <UserPlus size={18} />
                        <span>Create New Event</span>
                    </Button>
                </div>
                <div className="p-4 bg-background border border-border rounded-lg mb-6 flex items-center gap-4 flex-wrap shadow-md">
                    <div className="flex items-center space-x-2">
                        <Filter size={18} className="text-primary" />
                        <span className="text-sm font-semibold text-primary">Filter by:</span>
                    </div>
                    <div>
                        <Label htmlFor="tag-filter" className="sr-only">Tag</Label>
                        <Select id="tag-filter" value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="border-primary focus:ring-primary">
                            {allTags.map(tag => <option key={tag} value={tag}>{tag === 'All' ? 'All Tags' : tag}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="date-filter" className="sr-only">Date</Label>
                        <Select id="date-filter" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border-primary focus:ring-primary">
                            <option value="All">All Time</option>
                            <option value="This Week">This Week</option>
                            <option value="Last Month">Last Month</option>
                            <option value="Custom">Custom Range</option>
                        </Select>
                    </div>
                    {dateFilter === 'Custom' && (
                        <div className="flex items-center gap-2">
                            <Input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="p-2 text-sm border-primary focus:ring-primary" aria-label="Start Date"/>
                            <span className="text-primary">to</span>
                            <Input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="p-2 text-sm border-primary focus:ring-primary" aria-label="End Date"/>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-primary bg-gradient-to-r from-gray-50 to-gray-100">
                                <th className="p-4 font-bold text-center text-gray-700 w-8"></th>
                                <th className="p-4 font-bold text-left text-gray-700">Event Name</th>
                                <th className="p-4 font-bold text-left text-gray-700">Date</th>
                                <th className="p-4 font-bold text-left text-gray-700">Tags</th>
                                <th className="p-4 font-bold text-center text-gray-700">Samples</th>
                                <th className="p-4 font-bold text-left text-gray-700">Roles</th>
                                <th className="p-4 font-bold text-center text-gray-700">Status</th>
                                <th className="p-4 font-bold text-right text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map((event, idx) => {
                                const isExpanded = expandedEventIds.has(event.id);
                                return (
                                    <>
                                        <tr key={event.id} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => toggleEventExpansion(event.id)}
                                                    className="inline-flex items-center justify-center w-6 h-6 text-gray-600 hover:text-primary hover:bg-gray-200 rounded transition-colors"
                                                    title={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                    <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                                </button>
                                            </td>
                                            <td className="p-4 font-semibold text-primary">{event.name}</td>
                                            <td className="p-4 text-gray-600">{formatDate(event.date)}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {renderTags(event.tags, event.id)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                                                    {event.sampleCount || 0}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {event.participants && event.participants.slice(0, 2).map((p, i) => (
                                                        <span key={i} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                                                            {p.role === 'HEAD_JUDGE' ? '👨‍⚖️ HJ' : p.role === 'Q_GRADER' ? '☕ QG' : p.role === 'FARMER' ? '🚜 F' : p.role}
                                                        </span>
                                                    ))}
                                                    {event.participants && event.participants.length > 2 && (
                                                        <span className="text-xs text-gray-500 px-2 py-1 font-semibold">+{event.participants.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${event.isResultsRevealed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {event.isResultsRevealed ? '✓ Revealed' : '⏳ In Progress'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {renderActions(event)}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'}`}>
                                                <td colSpan={8} className="p-6">
                                                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                        <h4 className="font-bold text-lg text-primary mb-4">📋 Assigned Roles & Personnel</h4>
                                                        {renderParticipants(event.participants)}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredEvents.map(event => {
                        const isExpanded = expandedEventIds.has(event.id);
                        return (
                            <div key={event.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:border-primary">
                                <div className="space-y-3">
                                    {/* Header with Name and Status */}
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 flex items-start gap-2">
                                            <button
                                                onClick={() => toggleEventExpansion(event.id)}
                                                className="mt-0.5 inline-flex items-center justify-center w-6 h-6 text-gray-600 hover:text-primary hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                                                title={isExpanded ? "Collapse details" : "Expand details"}
                                            >
                                                <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                            </button>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-primary leading-tight">{event.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">📅 {formatDate(event.date)}</p>
                                            </div>
                                        </div>
                                        <span className={`flex-shrink-0 inline-block px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${event.isResultsRevealed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {event.isResultsRevealed ? '✓ Revealed' : '⏳ Progress'}
                                        </span>
                                    </div>

                                    {/* Tags */}
                                    {event.tags && event.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {renderTags(event.tags, event.id)}
                                        </div>
                                    )}

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-gray-600">Samples</p>
                                            <p className="font-bold text-lg text-primary">{event.sampleCount || 0}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-gray-600">Participants</p>
                                            <p className="font-bold text-lg text-primary">{event.participants?.length || 0}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-gray-600">Roles</p>
                                            <p className="font-bold text-lg text-primary">{new Set(event.participants?.map(p => p.role)).size || 0}</p>
                                        </div>
                                    </div>

                                    {/* Expandable Participants Details */}
                                    {isExpanded && event.participants && event.participants.length > 0 && (
                                        <div className="border-t border-gray-200 pt-3 bg-gradient-to-b from-blue-50 to-indigo-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                                            <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">👥 Full Personnel Details</p>
                                            <div className="space-y-3">
                                                {renderParticipants(event.participants)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Participants Summary (when not expanded) */}
                                    {!isExpanded && event.participants && event.participants.length > 0 && (
                                        <div className="border-t border-gray-200 pt-3">
                                            <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">👥 Assigned Roles</p>
                                            <div className="flex flex-wrap gap-2">
                                                {event.participants.map((p, i) => (
                                                    <span key={i} className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-900 text-xs px-3 py-1.5 rounded-full font-semibold border border-purple-200">
                                                        {p.role === 'HEAD_JUDGE' ? '⚖️ Head Judge' : p.role === 'Q_GRADER' ? '☕ Q Grader' : p.role === 'FARMER' ? '🚜 Farmer' : p.role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="border-t border-gray-200 pt-3 flex gap-2">
                                        {renderActions(event)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredEvents.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-lg text-gray-400 font-semibold">No events match the current filter</p>
                        </div>
                    )}
                </div>

                {filteredEvents.length === 0 && <p className="hidden md:block text-center p-8 text-text-light">No events match the current filter.</p>}
            </Card>
        )}

        {activeTab === 'users' && (
            <div className="transition-smooth">
            {
            viewingUserId ? (
                <UserProfile
                    user={appData.users.find(u => u.id === viewingUserId) || null} // Changed fallback to null explicitly
                    activityLog={appData.activityLog.filter(l => l.userId === viewingUserId)}
                    onBack={() => setViewingUserId(null)}
                    onUpdateUser={(data) => onUpdateUser(viewingUserId, data)}
                    onUpdateStatus={(status) => onUpdateUsersStatus([viewingUserId], status)}
                />
            ) : (
                <UserManagement
                    users={appData.users}
                    events={appData.events}
                    onViewUser={setViewingUserId}
                    onAddUser={() => setIsInviteModalOpen(true)}
                    onUpdateUsersStatus={onUpdateUsersStatus}
                    onAssignUsersToEvent={onAssignUsersToEvent}
                    onUpdateUserRoles={(userIds, roles) => {
                        if (Array.isArray(userIds)) {
                            userIds.forEach(id => onUpdateUser(id, { roles }));
                        } else {
                            console.error('Expected userIds to be an array, but got:', userIds);
                        }
                    }}
                />
            )
            }
            </div>
        )}

        {activeTab === 'samples' && (
            <Card className="transition-smooth">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">All Coffee Samples</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="border-b border-border">
                                <SortableHeader label="Blind Code" sortKey="blindCode" />
                                <SortableHeader label="Region" sortKey="region" />
                                <SortableHeader label="Processing Method" sortKey="processingMethod" />
                                <SortableHeader label="Variety" sortKey="variety" />
                                <SortableHeader label="Farmer" sortKey="farmerName" />
                                <SortableHeader label="Type" sortKey="sampleType" />
                                <SortableHeader label="Status" sortKey="approvalStatus" />
                                <SortableHeader label="Moisture %" sortKey="moisture" />
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSamples.map(sample => {
                                const farmerName = getFarmerName(sample);
                                const isCalibration = sample.sampleType === 'CALIBRATION';
                                const isPending = sample.approvalStatus === 'PENDING';
                                const isRejected = sample.approvalStatus === 'REJECTED';
                                return (
                                    <tr key={sample.id} className="border-b border-border hover:bg-background">
                                        <td className={`p-2 font-mono font-bold ${isCalibration ? 'text-purple-600' : 'text-primary'}`}>{sample.blindCode || '⏳ PENDING'}</td>
                                        <td className="p-2">{sample.region}</td>
                                        <td className="p-2">{sample.processingMethod}</td>
                                        <td className="p-2">{sample.variety}</td>
                                        <td className="p-2">{farmerName}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                sample.sampleType === 'CALIBRATION' ? 'bg-purple-100 text-purple-800' :
                                                sample.sampleType === 'FARMER_REGISTERED' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {sample.sampleType === 'FARMER_REGISTERED' ? '🚜 Farmer' : sample.sampleType === 'CALIBRATION' ? 'Calibration' : 'Other'}
                                            </span>
                                        </td>
                                        <td className="p-2">
                                            <span 
                                                onClick={() => {
                                                    if (isPending && sample.sampleType === 'FARMER_REGISTERED') {
                                                        handleOpenApprovalModal(sample);
                                                    }
                                                }}
                                                className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                                                    isPending && sample.sampleType === 'FARMER_REGISTERED' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer' :
                                                    sample.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    isRejected ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {sample.approvalStatus}
                                            </span>
                                        </td>
                                        <td className="p-2">{sample.moisture ? `${sample.moisture}` : 'N/A'}</td>
                                        <td className="p-2">
                                            <Button onClick={() => handleViewSampleDetails(sample)} size="sm" variant="secondary">
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        )}

        {activeTab === 'results' && (
            <Card className="transition-smooth">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-bold">Results & Analysis</h3>
                    <div className="flex items-center space-x-2">
                        <Select value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                            <option value="all">All Events</option>
                        </Select>
                        <Select value={processFilter} onChange={e => setProcessFilter(e.target.value)}>
                            {processingMethods.map(method => <option key={method} value={method}>{method}</option>)}
                        </Select>
                        <Button variant="secondary" onClick={handleExportCSV} className="flex items-center space-x-2"><Download size={16}/><span>Export CSV</span></Button>
                    </div>
                </div>
                
                {reportData.length > 0 ? (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold mb-2">Top Performers</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {reportData.slice(0, 3).map((sample, index) => {
                                    const farmerName = getFarmerName(sample);
                                    return (
                                        <div key={sample.id} className={`p-4 rounded-lg border-2 ${rankColors[index+1] || 'border-border'}`}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-bold text-lg">{index + 1}. {sample.farmName}</p>
                                                    <p className="text-sm text-text-light">{farmerName}</p>
                                                </div>
                                                <Trophy size={24} className={index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-500' : 'text-orange-600'}/>
                                            </div>
                                            <p className="text-3xl font-bold text-primary mt-2">{sample.adjudicatedFinalScore?.toFixed(2)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card title="Score Distribution">
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={scoreDistributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#FF7600" name="Number of Samples" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                             <Card title="Key Metrics">
                                <div className="grid grid-cols-2 gap-4 h-full content-center text-center">
                                    <div><p className="text-sm text-text-light">Total Samples</p><p className="text-3xl font-bold">{keyMetrics.count}</p></div>
                                    <div><p className="text-sm text-text-light">Average Score</p><p className="text-3xl font-bold">{keyMetrics.avg}</p></div>
                                    <div><p className="text-sm text-text-light">Highest Score</p><p className="text-3xl font-bold text-green-600">{keyMetrics.high}</p></div>
                                    <div><p className="text-sm text-text-light">Lowest Score</p><p className="text-3xl font-bold text-red-600">{keyMetrics.low}</p></div>
                                </div>
                            </Card>
                        </div>

                        <div className="admin-dashboard p-6">
                            <h4 className="text-lg font-semibold mb-2">Full Rankings</h4>
                            <table className="w-full text-left">
                                <thead style={{ color: '#000' }}>
                                    <tr className="border-b border-border ">
                                    <th className="p-2" style={{ color: '#000' }}>Rank</th>
                                        <th className="p-2 !text-black" style={{ color: '#000' }}>Blind Code</th>
                                        <th className="p-2 !text-black" style={{ color: '#000' }}>Farm Name</th>
                                        <th className="p-2 !text-black" style={{ color: '#000' }}>Farmer</th>
                                        <th className="p-2 !text-black" style={{ color: '#000' }}>Processing</th>
                                        <th className="p-2 !text-black" style={{ color: '#000' }}>Final Score</th>
                                        <th className="p-2 !text-black" style={{ color: '#000' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((sample, index) => {
                                        const farmerName = getFarmerName(sample);
                                        const isCalibration = sample.sampleType === 'CALIBRATION';
                                        return(
                                            <tr key={sample.id} className="border-b border-border hover:bg-background">
                                                <td className="p-2 font-bold text-lg">{index + 1}</td>
                                                <td className={`p-2 font-mono font-bold ${isCalibration ? 'text-purple-600' : 'text-primary'}`}>{sample.blindCode}</td>
                                                <td className="p-2">{sample.farmName}</td>
                                                <td className="p-2">{farmerName}</td>
                                                <td className="p-2">{sample.processingMethod}</td>
                                                <td className="p-2 font-bold text-primary">{sample.adjudicatedFinalScore?.toFixed(2)}</td>
                                                <td className="p-2">
                                                    <Button onClick={() => setViewingReportForSample(sample)} size="sm" variant="secondary" className="flex items-center space-x-1">
                                                        <FileText size={14} /> <span>Report</span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-12 text-text-light">
                        <BarChart2 size={48} className="mx-auto mb-4"/>
                        <p>No finalized results found for the selected filter.</p>
                        <p className="text-sm">Please select a different event or wait for results to be revealed.</p>
                    </div>
                )}
            </Card>
        )}

        {activeTab === 'leaderboard' && (
            <PublicLeaderboard
                appData={appData}
                onExit={() => setActiveTab('events')}
            />
        )}

        {/* Modals */}
        <EventCreationWizard 
            isOpen={isWizardOpen} 
            onClose={handleCloseWizard} 
            onSubmit={handleWizardSubmit}
            appData={appData}
        />
        
        <EventManagementModal
            isOpen={isManageEventModalOpen}
            onClose={() => setIsManageEventModalOpen(false)}
            event={eventToManage}
            appData={appData}
            onUpdate={onUpdateEventSamples}
        />

        <EventEditModal
            isOpen={isEditEventModalOpen}
            onClose={() => setIsEditEventModalOpen(false)}
            event={eventToEdit}
            onUpdate={onUpdateEventDetails}
        />
        
        <EventParticipantsModal
            isOpen={isParticipantsModalOpen}
            onClose={() => setIsParticipantsModalOpen(false)}
            event={eventToManageParticipants}
            appData={appData}
            onUpdate={onUpdateEventParticipants}
        />

        <UserInvitationModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            onSubmit={handleInviteSubmit}
            events={appData.events}
        />

        <Modal isOpen={isSampleDetailModalOpen} onClose={() => setIsSampleDetailModalOpen(false)} title={`Sample Details: ${selectedSample?.blindCode}`}>
            {selectedSample && (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold">Sample Information</h4>
                        <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                            <span className="text-text-light">Farmer:</span><span>{getFarmerName(selectedSample)}</span>
                            <span className="text-text-light">Farm Name:</span><span>{selectedSample.farmName}</span>
                            <span className="text-text-light">Region:</span><span>{selectedSample.region}</span>
                            <span className="text-text-light">Altitude (m):</span><span>{selectedSample.altitude}</span>
                            <span className="text-text-light">Processing:</span><span>{selectedSample.processingMethod}</span>
                            <span className="text-text-light">Variety:</span><span>{selectedSample.variety}</span>
                            <span className="text-text-light">Moisture:</span><span>{selectedSample.moisture ? `${selectedSample.moisture}%` : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                         <h4 className="font-bold">Q Grader Scores</h4>
                         {renderSampleDetails(selectedSample)}
                    </div>
                </div>
            )}
        </Modal>

        <Modal isOpen={!!viewingReportForSample} onClose={() => setViewingReportForSample(null)} title="Official Cupping Report" size="xl">
            {viewingReportForSample && (
                <SampleReport
                    sample={viewingReportForSample}
                    appData={appData}
                />
            )}
        </Modal>
                </div>
            </div>
        </div>

        {/* Modals - Outside of Main Layout */}
        <EventCreationWizard 
            isOpen={isWizardOpen} 
            onClose={handleCloseWizard} 
            onSubmit={handleWizardSubmit}
            appData={appData}
        />
        
        <EventManagementModal
            isOpen={isManageEventModalOpen}
            onClose={() => setIsManageEventModalOpen(false)}
            event={eventToManage}
            appData={appData}
            onUpdate={onUpdateEventSamples}
        />

        <EventEditModal
            isOpen={isEditEventModalOpen}
            onClose={() => setIsEditEventModalOpen(false)}
            event={eventToEdit}
            onUpdate={onUpdateEventDetails}
        />
        
        <EventParticipantsModal
            isOpen={isParticipantsModalOpen}
            onClose={() => setIsParticipantsModalOpen(false)}
            event={eventToManageParticipants}
            appData={appData}
            onUpdate={onUpdateEventParticipants}
        />

        <UserInvitationModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            onSubmit={handleInviteSubmit}
            events={appData.events}
        />

        <Modal isOpen={isSampleDetailModalOpen} onClose={() => setIsSampleDetailModalOpen(false)} title={`Sample Details: ${selectedSample?.blindCode}`}>
            {selectedSample && (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold">Sample Information</h4>
                        <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                            <span className="text-text-light">Farmer:</span><span>{getFarmerName(selectedSample)}</span>
                            <span className="text-text-light">Farm Name:</span><span>{selectedSample.farmName}</span>
                            <span className="text-text-light">Region:</span><span>{selectedSample.region}</span>
                            <span className="text-text-light">Altitude (m):</span><span>{selectedSample.altitude}</span>
                            <span className="text-text-light">Processing:</span><span>{selectedSample.processingMethod}</span>
                            <span className="text-text-light">Variety:</span><span>{selectedSample.variety}</span>
                            <span className="text-text-light">Moisture:</span><span>{selectedSample.moisture ? `${selectedSample.moisture}%` : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                         <h4 className="font-bold">Q Grader Scores</h4>
                         {renderSampleDetails(selectedSample)}
                    </div>
                </div>
            )}
        </Modal>

        <Modal isOpen={!!viewingReportForSample} onClose={() => setViewingReportForSample(null)} title="Official Cupping Report" size="xl">
            {viewingReportForSample && (
                <SampleReport
                    sample={viewingReportForSample}
                    appData={appData}
                />
            )}
        </Modal>

        <Modal isOpen={isApprovalModalOpen} onClose={() => {
            setIsApprovalModalOpen(false);
            setSampleForApproval(null);
        }} title="Approve or Decline Sample">
            {sampleForApproval && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2"><strong>Farm Name:</strong> {sampleForApproval.farmName}</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Variety:</strong> {sampleForApproval.variety}</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Region:</strong> {sampleForApproval.region}</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Processing Method:</strong> {sampleForApproval.processingMethod}</p>
                        <p className="text-sm text-gray-600"><strong>Altitude:</strong> {sampleForApproval.altitude}m</p>
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t border-border">
                        <Button 
                            onClick={() => {
                                setIsApprovalModalOpen(false);
                                setSampleForApproval(null);
                            }}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => handleDeclineSample(sampleForApproval.id)}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            Decline
                        </Button>
                        <Button 
                            onClick={() => handleApproveSample(sampleForApproval.id)}
                            className="bg-green-500 text-white hover:bg-green-600"
                        >
                            Approve
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    </div>
    </>
  );
};

export default AdminDashboard;
