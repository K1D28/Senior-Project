import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CoffeeSample, CuppingEvent } from '../../types';
import { AppData } from '../../data';
import { NewSampleRegistrationData } from '../../App';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import SampleReport from '../reporting/SampleReport';
import Certificate from '../reporting/Certificate';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Download, Award, TrendingUp, Star, ShieldCheck, DownloadCloud, Calendar, PlusCircle, Coffee, LogOut, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

interface FarmerDashboardProps {
  currentUser: User;
  appData: AppData;
  onRegisterForEvent: (eventId: string, sampleData: NewSampleRegistrationData, farmerDatabaseId: number) => void;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'events' | 'leaderboard';

interface TabButtonProps {
  tab: Tab;
  label: string;
  icon: React.ElementType;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, label, icon: Icon, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(tab)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full ${
      activeTab === tab
        ? 'bg-primary text-white'
        : 'text-text-dark hover:bg-gray-100'
    }`}
  >
    <Icon size={18} />
    <span className="font-medium">{label}</span>
  </button>
);

const getRankSuffix = (rank: number) => {
    if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
    switch (rank % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

const getGradeFromScore = (score: number) => {
    if (score >= 90) return 'Outstanding';
    if (score >= 85) return 'Excellent';
    if (score >= 80) return 'Specialty';
    return 'Below Specialty';
};

const RegistrationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (sampleData: NewSampleRegistrationData) => void;
    event: CuppingEvent;
    lastSample?: CoffeeSample;
}> = ({ isOpen, onClose, onSubmit, event, lastSample }) => {
    const getMethodString = (method: any): string => {
        if (typeof method === 'string') return method;
        if (method && typeof method === 'object' && 'method' in method) return method.method;
        return '';
    };

    const [sampleData, setSampleData] = useState<NewSampleRegistrationData>({
        farmName: lastSample?.farmName || '',
        region: lastSample?.region || '',
        altitude: lastSample?.altitude || 0,
        processingMethod: event.processingMethods?.[0] ? getMethodString(event.processingMethods[0]) : '',
        variety: lastSample?.variety || '',
        moisture: lastSample?.moisture || undefined,
    });

    const handleChange = (field: keyof NewSampleRegistrationData, value: string | number) => {
        setSampleData(prev => ({...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sampleData.farmName || !sampleData.region || !sampleData.variety || !sampleData.processingMethod) {
            alert("Please fill out all required fields.");
            return;
        }
        onSubmit(sampleData);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Register for: ${event.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <p className="text-sm text-text-light">Enter the details for the coffee sample you wish to submit. Some fields have been pre-filled from your last submission.</p>
                 <div>
                    <Label htmlFor="farmName">Farm Name</Label>
                    <Input id="farmName" value={sampleData.farmName} onChange={e => handleChange('farmName', e.target.value)} required />
                 </div>
                 <div>
                    <Label htmlFor="variety">Variety</Label>
                    <Input id="variety" value={sampleData.variety} onChange={e => handleChange('variety', e.target.value)} required />
                 </div>
                 <div>
                    <Label htmlFor="region">Region</Label>
                    <Input id="region" value={sampleData.region} onChange={e => handleChange('region', e.target.value)} required />
                 </div>
                 <div>
                    <Label htmlFor="processingMethod">Processing Method</Label>
                    <Select id="processingMethod" value={sampleData.processingMethod} onChange={e => handleChange('processingMethod', e.target.value)} required>
                        <option value="" disabled>Select a method...</option>
                        {event.processingMethods?.map((p, index) => {
                            const method = typeof p === 'string' ? p : (p && 'method' in p ? p.method : '');
                            return <option key={`${method}-${index}`} value={method}>{method}</option>;
                        })}
                    </Select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="altitude">Altitude (m)</Label>
                        <Input id="altitude" type="number" value={sampleData.altitude} onChange={e => handleChange('altitude', Number(e.target.value))} />
                    </div>
                    <div>
                        <Label htmlFor="moisture">Moisture (%)</Label>
                        <Input id="moisture" type="number" step="0.1" value={sampleData.moisture || ''} onChange={e => handleChange('moisture', Number(e.target.value))} />
                    </div>
                 </div>
                 <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Submit Registration</Button>
                </div>
            </form>
        </Modal>
    );
};


const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ currentUser, appData, onRegisterForEvent, onLogout }) => {
  const [viewingReportForSample, setViewingReportForSample] = useState<CoffeeSample | null>(null);
  const [viewingCertificateFor, setViewingCertificateFor] = useState<{ sample: CoffeeSample, event: CuppingEvent, rank: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'leaderboard'>('dashboard');

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<CuppingEvent | null>(null);
  const [assignedEvents, setAssignedEvents] = useState<CuppingEvent[]>([]);
  const [farmerSamplesFromBackend, setFarmerSamplesFromBackend] = useState<CoffeeSample[]>([]);
  const [farmerDatabaseId, setFarmerDatabaseId] = useState<number | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();

  // First, fetch the farmer's database ID
  useEffect(() => {
    const fetchFarmerDatabaseId = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/farmer-profile`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const farmerData = await response.json();
          console.log('Fetched farmer profile:', farmerData);
          setFarmerDatabaseId(farmerData.id);
        } else {
          console.error('Failed to fetch farmer profile:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching farmer profile:', error);
      }
    };

    fetchFarmerDatabaseId();
  }, []);

  // Fetch events assigned by admin to this farmer
  const fetchAssignedEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch(`http://localhost:5001/api/cupping-events/farmer`, { 
        credentials: 'include',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      if (response.ok) {
        const events = await response.json();
        console.log('Fetched farmer events:', events);
        setAssignedEvents(events);
      } else {
        console.error('Failed to fetch assigned events:', response.status);
      }
    } catch (error) {
      console.error('Error fetching assigned events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch farmer's samples from backend
  const fetchFarmerSamples = async () => {
    if (!farmerDatabaseId) {
      console.log('Cannot fetch samples: farmerDatabaseId is not set yet');
      return;
    }
    try {
      console.log(`Fetching samples for farmer ID: ${farmerDatabaseId}`);
      const response = await fetch(`http://localhost:5001/api/samples?farmerId=${farmerDatabaseId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const samples = await response.json();
        console.log(`Fetched ${samples.length} samples:`, samples);
        setFarmerSamplesFromBackend(samples);
      } else {
        console.error('Failed to fetch farmer samples:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching farmer samples:', error);
    }
  };

  useEffect(() => {
    fetchAssignedEvents();
    if (farmerDatabaseId) {
      fetchFarmerSamples();
    }
  }, [currentUser.id, refreshKey, farmerDatabaseId]);

  const farmerSamples = useMemo(() => farmerSamplesFromBackend.filter(s => s.sampleType !== 'CALIBRATION').sort((a,b) => {
    // Handle both string and numeric IDs
    if (typeof b.id === 'string' && typeof a.id === 'string') {
      return b.id.localeCompare(a.id);
    }
    // For numeric IDs, convert to numbers and compare
    const bNum = typeof b.id === 'number' ? b.id : parseInt(String(b.id), 10);
    const aNum = typeof a.id === 'number' ? a.id : parseInt(String(a.id), 10);
    return bNum - aNum;
  }), [farmerSamplesFromBackend]);

  const allEventsWithFarmerSamples = useMemo(() => {
    console.log('allEventsWithFarmerSamples building with:', { assignedEventsCount: assignedEvents.length, farmerSamplesCount: farmerSamples.length });
    
    return assignedEvents
      .map(event => {
        // Ensure we're comparing string IDs
        const eventSampleIds = event.sampleIds?.map(id => String(id)) || [];
        
        // Show samples that belong to this farmer in this event
        const samplesInEvent = farmerSamples.filter(s => eventSampleIds.includes(String(s.id)));
        
        console.log(`Event ${event.name} has ${samplesInEvent.length} samples for farmer`, { eventSampleIds, farmerSampleIds: farmerSamples.map(s => s.id) });
        
        // For rankings, exclude calibration samples (only count competitive samples)
        const rankedEventSamples = event.isResultsRevealed
          ? farmerSamplesFromBackend
              .filter(s => eventSampleIds.includes(String(s.id)) && s.adjudicatedFinalScore && s.sampleType !== 'CALIBRATION')
              .sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0))
          : [];
        
        // Always return the event, even if no samples yet (farmer can register)
        return {
          ...event,
          samples: samplesInEvent,
          rankedEventSamples,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assignedEvents, farmerSamplesFromBackend, farmerSamples]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return assignedEvents
      .filter(e => {
        // Show events that haven't happened yet or are happening today
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today && !e.isResultsRevealed;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [assignedEvents]);
  
  const handleOpenRegisterModal = (event: CuppingEvent) => {
    setSelectedEventForRegistration(event);
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setSelectedEventForRegistration(null);
  };

  const handleRegisterSubmit = (sampleData: NewSampleRegistrationData) => {
      if(selectedEventForRegistration && farmerDatabaseId) {
          onRegisterForEvent(selectedEventForRegistration.id, sampleData, farmerDatabaseId);
          // Trigger a refresh of events to show the newly submitted sample
          setTimeout(() => {
            setRefreshKey(prev => prev + 1);
          }, 500);
      }
      handleCloseRegisterModal();
  };


  const latestRevealedEvent = useMemo(() => allEventsWithFarmerSamples.find(e => e.isResultsRevealed), [allEventsWithFarmerSamples]);

  const topSampleInLatestEvent = useMemo(() => {
    if (!latestRevealedEvent) return null;
    return [...latestRevealedEvent.samples].sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0))[0];
  }, [latestRevealedEvent]);

  const performanceData = useMemo(() => {
    return farmerSamples
      .filter(s => s.adjudicatedFinalScore && s.sampleType !== 'CALIBRATION')
      .map(s => {
        const event = appData.events.find(e => e.sampleIds.includes(s.id));
        return {
          name: event ? new Date(event.date).getFullYear().toString() : 'Unknown',
          date: event ? event.date : '1970-01-01',
          score: s.adjudicatedFinalScore,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [farmerSamples, appData.events]);
  
  const earnedBadges = useMemo(() => {
    const badges: Record<string, { name: string; icon: React.ElementType; color: string; count: number; description: string }> = {};

    const defineBadge = (key: string, name: string, icon: React.ElementType, color: string, description: string) => {
        if (!badges[key]) {
            badges[key] = { name, icon, color, count: 0, description };
        }
        badges[key].count += 1;
    };

    allEventsWithFarmerSamples.forEach(event => {
        if (!event.isResultsRevealed) return;

        event.samples.forEach(sample => {
            if (!sample.adjudicatedFinalScore) return;

            if (sample.adjudicatedFinalScore >= 90) defineBadge('outstanding', 'Outstanding Cup', Star, 'text-blue-500', 'Achieved a score of 90+');
            if (sample.adjudicatedFinalScore >= 85) defineBadge('excellent', '85+ Club', Star, 'text-green-500', 'Achieved a score of 85+');

            const rank = event.rankedEventSamples.findIndex(s => s.id === sample.id) + 1;
            if (rank > 0) {
                if (rank === 1) defineBadge('first_place', '1st Place Winner', Award, 'text-yellow-500', 'Finished first in an event');
                if (rank <= 3) defineBadge('top_3', 'Top 3 Finisher', Award, 'text-gray-500', 'Finished in the top 3');
                if (rank <= 10) defineBadge('top_10', 'Top 10 Finisher', Award, 'text-orange-700', 'Finished in the top 10');
            }
        });
    });
    
    if (performanceData.length >= 2) {
        let maxImprovement = 0;
        for (let i = 1; i < performanceData.length; i++) {
            const improvement = (performanceData[i].score ?? 0) - (performanceData[i-1].score ?? 0);
            if (improvement > maxImprovement) maxImprovement = improvement;
        }
        if (maxImprovement >= 2.0) defineBadge('most_improved', 'Most Improved', TrendingUp, 'text-teal-500', 'Score improved by 2+ points');
    }

    return Object.values(badges).sort((a,b) => b.count - a.count);
  }, [allEventsWithFarmerSamples, performanceData]);

  const DashboardView = () => (
    <div className="space-y-8">
        {loadingEvents ? (
            <Card>
                <p className="text-center text-text-light">Loading your assigned events...</p>
            </Card>
        ) : farmerSamples.length === 0 ? (
            <Card>
                <p className="text-center text-text-light">You have not submitted any coffee samples yet. Check the "Upcoming Events" tab to register for a competition.</p>
            </Card>
        ) : (
            <>
            {latestRevealedEvent && topSampleInLatestEvent && (
                <Card className="bg-primary/5 border-primary/50">
                <p className="font-semibold text-primary">Results are in for {latestRevealedEvent.name}!</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-4">
                    <div className="md:col-span-2">
                        <p className="text-sm text-text-light">Highlight from your latest submission:</p>
                        <h3 className="text-2xl font-bold mt-1">{topSampleInLatestEvent.farmName} - {topSampleInLatestEvent.variety}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                        {(() => {
                            const rankInfo = { rank: latestRevealedEvent.rankedEventSamples.findIndex(s => s.id === topSampleInLatestEvent.id) + 1, total: latestRevealedEvent.rankedEventSamples.length };
                            return rankInfo && rankInfo.rank > 0 && rankInfo.rank <= 3 && (
                            <div className="flex items-center space-x-2 text-yellow-600"><Award size={20} /><span className="font-semibold">Top Result!</span></div>
                            );
                        })()}
                        <span className="text-sm font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{topSampleInLatestEvent.processingMethod}</span>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        {(() => {
                            const rankInfo = { rank: latestRevealedEvent.rankedEventSamples.findIndex(s => s.id === topSampleInLatestEvent.id) + 1, total: latestRevealedEvent.rankedEventSamples.length };
                            return rankInfo && rankInfo.rank > 0 && <p className="text-lg font-bold">{rankInfo.rank}{getRankSuffix(rankInfo.rank)} <span className="font-normal text-text-light">of {rankInfo.total}</span></p>;
                        })()}
                        <p className="text-5xl font-bold text-primary">{topSampleInLatestEvent.adjudicatedFinalScore?.toFixed(2)}</p>
                        <p className="font-semibold">{getGradeFromScore(topSampleInLatestEvent.adjudicatedFinalScore ?? 0)}</p>
                        <Button onClick={() => setViewingReportForSample(topSampleInLatestEvent)} size="sm" className="mt-2">View Detailed Report</Button>
                    </div>
                </div>
                </Card>
            )}

            {earnedBadges.length > 0 && (
                <Card>
                    <div className="flex items-center space-x-2 mb-4"><ShieldCheck className="text-primary" /><h3 className="text-xl font-bold">My Achievements</h3></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {earnedBadges.map(badge => (
                            <div key={badge.name} className="flex flex-col items-center text-center p-4 bg-background rounded-lg border border-border" title={badge.description}>
                                <div className={`relative ${badge.color}`}><badge.icon size={40} />{badge.count > 1 && <span className="absolute -top-1 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{badge.count}</span>}</div>
                                <p className="font-bold mt-2 text-sm">{badge.name}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {performanceData.length > 1 && (
                <Card>
                    <div className="flex items-center space-x-2 mb-4"><TrendingUp className="text-primary" /><h3 className="text-xl font-bold">Your Performance Over Time</h3></div>
                    <div className="w-full h-64">
                        <ResponsiveContainer><LineChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={['dataMin - 1', 'dataMax + 1']} /><Tooltip /><Legend /><Line type="monotone" dataKey="score" stroke="#FF7600" strokeWidth={2} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer>
                    </div>
                </Card>
            )}

            <div>
                <h3 className="text-2xl font-bold mb-4">All Coffee Submissions</h3>
                <div className="space-y-6">
                {allEventsWithFarmerSamples.map(event => (
                    <Card key={event.id} title={event.name}>
                    <div className="space-y-4 divide-y divide-border">
                        {event.samples.map(sample => {
                        const isFinalizedAndRevealed = event.isResultsRevealed && sample.adjudicatedFinalScore !== undefined;
                        let rank: number | null = null;
                        if (isFinalizedAndRevealed) {
                            const sampleIndex = event.rankedEventSamples.findIndex(s => s.id === sample.id);
                            if (sampleIndex !== -1) rank = sampleIndex + 1;
                        }

                        return (
                            <div key={sample.id} className="pt-4 first:pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                    <div className="md:col-span-3">
                                        <h4 className="font-bold text-lg">{sample.farmName} - {sample.variety}</h4>
                                        <p className="text-sm text-text-light">{sample.region} - {sample.processingMethod} Process</p>
                                        <div className="mt-2">
                                        {sample.approvalStatus === 'PENDING' ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Registered</span>
                                        ) : !isFinalizedAndRevealed ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Cupping in Progress</span>
                                        ) : null}
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                    {isFinalizedAndRevealed ? (
                                        <>
                                        <div className="flex items-baseline justify-start md:justify-end space-x-2">
                                            {rank && <p className="text-xl font-bold text-primary">{rank}<span className="text-base font-semibold">{getRankSuffix(rank)}</span></p>}
                                            <p className="text-3xl font-bold text-text-dark">{sample.adjudicatedFinalScore?.toFixed(2)}</p>
                                        </div>
                                        <p className="text-sm text-text-light mb-2">{rank ? 'Rank | Final Score' : 'Final Score'}</p>
                                        <div className="flex flex-col md:flex-row gap-2 mt-2">
                                            <Button onClick={() => setViewingReportForSample(sample)} size="sm" className="flex items-center space-x-1 w-full md:w-auto justify-center"><Download size={14} /><span>View Report</span></Button>
                                            {rank && rank <= 3 && (<Button variant="secondary" size="sm" className="flex items-center space-x-1 w-full md:w-auto justify-center" onClick={() => setViewingCertificateFor({ sample, event, rank })}><DownloadCloud size={14} /><span>Certificate</span></Button>)}
                                        </div>
                                        </>
                                    ) : (<><p className="text-2xl font-bold text-gray-400">--</p><p className="text-sm text-text-light mb-2">Awaiting Results</p></>)}
                                    </div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                    </Card>
                ))}
                </div>
            </div>
        </>)}
    </div>
  );

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
                        <h1 className="text-xl font-bold text-gray-900">Farmer Hub</h1>
                        <p className="text-xs text-gray-500">Coffee Quality</p>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex flex-col p-4 gap-2 flex-1">
                    <TabButton tab="dashboard" label="My Dashboard" icon={Coffee} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton tab="events" label="Upcoming Events" icon={Calendar} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <div className="mt-auto">
                        <TabButton tab="leaderboard" label="Leaderboard" icon={Trophy} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </nav>

                {/* Farmer Profile Section at Bottom */}
                <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
                    {/* Farmer Profile Card */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 w-full">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                            {currentUser?.name?.[0]?.toUpperCase() || 'F'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-gray-600">Farmer</span>
                            <span className="text-xs font-bold text-gray-800 truncate">{currentUser?.name || 'Farmer'}</span>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-2 justify-center bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-white to-amber-50/30">
                <div className="p-6">
                    {activeTab === 'dashboard' && <DashboardView />}
                    {activeTab === 'events' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-primary">Register for an Event</h3>
                            {upcomingEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {upcomingEvents.map(event => {
                                        const farmerSamplesInEvent = farmerSamples.filter(s => event.sampleIds.includes(s.id));
                                        return (
                                            <Card key={event.id} title={event.name}>
                                                <div className="space-y-3">
                                                    <p className="text-sm text-text-light">{event.description}</p>
                                                    <p className="text-sm font-medium"><strong className="text-text-dark">Date:</strong> {event.date ? new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}</p>
                                                    {farmerSamplesInEvent.length > 0 && (
                                                        <div className="pt-3 mt-3 border-t border-border">
                                                            <h4 className="font-semibold text-sm">Your Submissions:</h4>
                                                            <ul className="list-disc pl-5 text-sm text-text-light">
                                                                {farmerSamplesInEvent.map(s => <li key={s.id}>{s.variety} ({s.processingMethod})</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <div className="pt-3">
                                                        <Button onClick={() => handleOpenRegisterModal(event)} className="w-full flex justify-center items-center space-x-2 bg-primary text-white hover:bg-primary/90">
                                                            <PlusCircle size={16} />
                                                            <span>Register New Sample</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Card>
                                    <div className="text-center p-8">
                                        <Calendar size={40} className="mx-auto text-text-light mb-4"/>
                                        <p className="text-text-light">There are no events open for registration at this time. Please check back later!</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                    {activeTab === 'leaderboard' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-primary">Leaderboard</h3>
                            {allEventsWithFarmerSamples.length > 0 && allEventsWithFarmerSamples.some(e => e.rankedEventSamples.length > 0) ? (
                                allEventsWithFarmerSamples
                                  .filter(e => e.isResultsRevealed && e.rankedEventSamples.length > 0)
                                  .map(event => (
                                    <Card key={event.id} title={event.name}>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b border-border bg-background">
                                              <th className="text-left py-2 px-3 font-semibold">Rank</th>
                                              <th className="text-left py-2 px-3 font-semibold">Farm Name</th>
                                              <th className="text-left py-2 px-3 font-semibold">Variety</th>
                                              <th className="text-left py-2 px-3 font-semibold">Region</th>
                                              <th className="text-left py-2 px-3 font-semibold">Score</th>
                                              <th className="text-left py-2 px-3 font-semibold">Grade</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {event.rankedEventSamples.map((sample, index) => (
                                              <tr key={sample.id} className="border-b border-border hover:bg-gray-50">
                                                <td className="py-2 px-3 font-bold text-primary">{index + 1}{getRankSuffix(index + 1)}</td>
                                                <td className="py-2 px-3 font-semibold">{sample.farmName}</td>
                                                <td className="py-2 px-3">{sample.variety}</td>
                                                <td className="py-2 px-3">{sample.region || '--'}</td>
                                                <td className="py-2 px-3 font-bold text-primary">{sample.adjudicatedFinalScore?.toFixed(2)}</td>
                                                <td className="py-2 px-3 text-sm">{getGradeFromScore(sample.adjudicatedFinalScore ?? 0)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </Card>
                                  ))
                            ) : (
                                <Card>
                                    <p className="text-center text-text-light">No leaderboard data available yet. Check back once competition results are revealed.</p>
                                </Card>
                            )}
                        </div>
                    )}

                    <Modal isOpen={!!viewingReportForSample} onClose={() => setViewingReportForSample(null)} title="Official Cupping Report" size="xl">
                        {viewingReportForSample && <SampleReport sample={viewingReportForSample} appData={appData} />}
                    </Modal>

                    <Modal isOpen={!!viewingCertificateFor} onClose={() => setViewingCertificateFor(null)} title="Official Certificate" size="xl">
                        {viewingCertificateFor && (
                            <div className="certificate-print-area -m-6">
                                <Certificate
                                    sample={viewingCertificateFor.sample}
                                    event={viewingCertificateFor.event}
                                    farmer={currentUser}
                                    rank={viewingCertificateFor.rank}
                                />
                            </div>
                        )}
                    </Modal>

                    {selectedEventForRegistration && (
                        <RegistrationModal 
                            isOpen={isRegisterModalOpen}
                            onClose={handleCloseRegisterModal}
                            onSubmit={handleRegisterSubmit}
                            event={selectedEventForRegistration}
                            lastSample={farmerSamples[0]}
                        />
                    )}
                </div>
            </div>
        </div>
    </div>
    </>
  );
};

export default FarmerDashboard;