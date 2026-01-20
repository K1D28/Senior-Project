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

type Tab = 'events' | 'users' | 'samples' | 'results';
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


    // User Management State
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);


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


    const reportData = useMemo(() => {
        let samplesToConsider: CoffeeSample[] = [];
        if (eventFilter === 'all') {
            samplesToConsider = appData.samples.filter(s => s.adjudicatedFinalScore !== undefined && s.adjudicatedFinalScore > 0);
        } else {
            const selectedEvent = appData.events.find(e => e.id === eventFilter);
            if (selectedEvent && Array.isArray(selectedEvent.sampleIds)) {
                samplesToConsider = appData.samples.filter(s => 
                    selectedEvent.sampleIds?.includes(s.id)
                );
            } else {
                console.warn('Selected event does not have valid sampleIds or sampleIds is undefined:', selectedEvent);
                samplesToConsider = []; // Default to an empty array if sampleIds is invalid
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
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 flex items-center space-x-2 ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-light hover:text-text-dark border-b-2 border-transparent'}`}
        >
            <Icon size={16} />
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
    <div>
        <h2 className="text-3xl font-bold mb-6">Administrator Dashboard</h2>
        <div className="border-b border-border mb-6">
            <nav className="-mb-px flex space-x-4">
                <TabButton tab="events" label="Cupping Events" icon={Coffee} />
                <TabButton tab="users" label="Manage Users" icon={Users} />
                <TabButton tab="samples" label="All Samples" icon={FileText} />
                <TabButton tab="results" label="Results & Reporting" icon={BarChart2} />
            </nav>
        </div>

        {activeTab === 'events' && (
            <Card>
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

                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="p-2">Name</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Time Added</th>
                            <th className="p-2">Tags</th>
                            <th className="p-2">Samples</th>
                            <th className="p-2">Assigned Role/Person</th>
                            <th className="p-2">Status</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.map(event => (
                            <tr key={event.id} className="border-b border-border hover:bg-background">
                                <td className="p-2">{event.name}</td>
                                <td className="p-2">{formatDate(event.date)}</td>
                                <td className="p-2">{new Date(event.date).toLocaleTimeString()}</td>
                                <td className="p-2">
                                    <div className="flex flex-wrap gap-1">
                                        {renderTags(event.tags, event.id)}
                                    </div>
                                </td>
                                <td className="p-2">
                                    {event.sampleCount && event.sampleCount > 0 ? `${event.sampleCount} Samples` : 'No Samples'}
                                </td>
                                <td className="p-2">
                                    {renderParticipants(event.participants)}
                                </td>
                                <td className="p-2">
                                    {/* Temporarily removed the isResultsRevealed condition */}
                                    {/* <span className={`px-2 py-1 text-xs font-semibold rounded-full ${event.isResultsRevealed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}> */}
                                    {/*     {event.isResultsRevealed ? 'Revealed' : 'In Progress'} */}
                                    {/* </span> */}
                                </td>
                                <td className="p-2 text-right">
                                    {renderActions(event)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredEvents.length === 0 && <p className="text-center p-8 text-text-light">No events match the current filter.</p>}
            </Card>
        )}

        {activeTab === 'users' && (
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
        )}

        {activeTab === 'samples' && (
            <Card>
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
                                <SortableHeader label="Moisture %" sortKey="moisture" />
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSamples.map(sample => {
                                const farmerName = getFarmerName(sample);
                                return (
                                    <tr key={sample.id} className="border-b border-border hover:bg-background">
                                        <td className="p-2 font-mono">{sample.blindCode}</td>
                                        <td className="p-2">{sample.region}</td>
                                        <td className="p-2">{sample.processingMethod}</td>
                                        <td className="p-2">{sample.variety}</td>
                                        <td className="p-2">{farmerName}</td>
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
            <Card>
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
                                        return(
                                            <tr key={sample.id} className="border-b border-border hover:bg-background">
                                                <td className="p-2 font-bold text-lg">{index + 1}</td>
                                                <td className="p-2 font-mono">{sample.blindCode}</td>
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

        <div className="fixed bottom-4 right-4">
            <button
                onClick={onLogout}
                className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
            >
                Logout
            </button>
        </div>

        <div className="fixed bottom-4 left-4">
            <Button onClick={() => navigate('/leaderboard?redirect=/admin-dashboard')} className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-dark">
                View Leaderboard Results
            </Button>
        </div>
    </div>
  );
};

export default AdminDashboard;
