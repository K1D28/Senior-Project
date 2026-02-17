import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, CuppingEvent, CoffeeSample, ScoreSheet, Descriptor, Role } from '../../types';
import { AppData } from '../../data';
import { AdjudicationData } from '../../App';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { ChevronLeft, Edit, CheckCircle, Award, Flag, TrendingUp, TrendingDown, ClipboardPaste, AlertTriangle, LogOut, Coffee, Trophy, Sparkles, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            </svg>
        </div>
    );
};

const HIGH_VARIANCE_THRESHOLD = 0.75; // For overall attribute stdDev (in Variance column)
const MEDIUM_VARIANCE_THRESHOLD = 0.4; // For overall attribute stdDev (in Variance column)
const HIGH_DEVIATION_CELL_THRESHOLD = 0.75; // For high deviation of a single score from attribute average
const MEDIUM_DEVIATION_CELL_THRESHOLD = 0.4; // For medium deviation of a single score from attribute average


const calculateStats = (scores: number[]) => {
    if (!scores || scores.length < 2) return { average: scores[0] || 0, stdDev: 0, range: [scores[0] || 0, scores[0] || 0] };
    const average = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    const variance = scores.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const range = [Math.min(...scores), Math.max(...scores)];
    return { average, stdDev, range };
};

const getGradeFromScore = (score: number) => {
    if (score >= 90) return 'Outstanding';
    if (score >= 85) return 'Excellent';
    if (score >= 80) return 'Specialty';
    return 'Below Specialty';
};

// --- Sub-components for the Cockpit ---

const AtAGlanceMetrics: React.FC<{ sample: CoffeeSample, stats: any, graderCount: number }> = ({ sample, stats, graderCount }) => {
    return (
        <Card title="At-a-Glance Dashboard">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                <div><p className="text-sm text-text-light">Avg. Total Score</p><p className="text-2xl font-bold">{stats.average.toFixed(2)}</p></div>
                <div><p className="text-sm text-text-light">Std. Deviation</p><p className="text-2xl font-bold">{stats.stdDev.toFixed(2)}</p></div>
                <div><p className="text-sm text-text-light">Score Range</p><p className="text-2xl font-bold">{`${stats.range[0].toFixed(2)} - ${stats.range[1].toFixed(2)}`}</p></div>
                <div><p className="text-sm text-text-light">Graders</p><p className="text-2xl font-bold">{graderCount}</p></div>
                <div><p className="text-sm text-text-light">Initial Grade</p><p className="text-xl font-bold text-primary">{getGradeFromScore(stats.average)}</p></div>
            </div>
        </Card>
    );
};

const ScoreHeatmap: React.FC<{ comparisonData: Array<Record<string, any> & { attribute: string; average: number; stdDev: number }>, graders: User[] }> = ({ comparisonData, graders }) => {
    return (
        <Card title="Score Consensus Heatmap">
            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-background"><tr className="border-b border-border">
                        <th className="p-3 font-semibold">Attribute</th>
                        {graders.map(g => <th key={g.id} className="p-3 font-semibold text-center">{g.name.split(' ')[0]}</th>)}
                        <th className="p-3 font-semibold text-center">Avg</th>
                        <th className="p-3 font-semibold text-center">Variance</th>
                    </tr></thead>
                    <tbody>{comparisonData.map(row => {
                        let varianceIcon;
                        if (row.stdDev > HIGH_VARIANCE_THRESHOLD) varianceIcon = <span className="flex items-center justify-center gap-1 text-red-600"><AlertTriangle size={14} /> High</span>;
                        else if (row.stdDev > MEDIUM_VARIANCE_THRESHOLD) varianceIcon = <span className="flex items-center justify-center gap-1 text-yellow-600">● Med</span>;
                        else varianceIcon = <span className="flex items-center justify-center gap-1 text-green-600">● Low</span>;

                        return (
                            <tr key={row.attribute} className="border-t border-border">
                                <td className="p-3 font-medium">{row.attribute}</td>
                                {graders.map(g => {
                                    // Cast row to a record so we can index by dynamic grader id safely
                                    const score = Number((row as Record<string, any>)[String(g.id)] ?? 0);
                                    let cellClass = '';
                                    const deviation = score - row.average;

                                    if (deviation > HIGH_DEVIATION_CELL_THRESHOLD) {
                                        cellClass = 'bg-green-200 text-green-900 font-bold'; // High positive deviation
                                    } else if (deviation > MEDIUM_DEVIATION_CELL_THRESHOLD) {
                                        cellClass = 'bg-green-100 text-green-800 font-semibold'; // Medium positive deviation
                                    } else if (deviation < -HIGH_DEVIATION_CELL_THRESHOLD) {
                                        cellClass = 'bg-red-200 text-red-900 font-bold'; // High negative deviation
                                    } else if (deviation < -MEDIUM_DEVIATION_CELL_THRESHOLD) {
                                        cellClass = 'bg-red-100 text-red-800 font-semibold'; // Medium negative deviation
                                    }
                                    
                                    return <td key={g.id} className={`p-3 text-center tabular-nums transition-colors duration-200 ${cellClass}`}>{Number(score).toFixed(2)}</td>;
                                })}
                                <td className="p-3 text-center font-semibold tabular-nums bg-gray-50">{row.average.toFixed(2)}</td>
                                <td className="p-3 text-center tabular-nums font-medium text-xs bg-gray-50">{varianceIcon}</td>
                            </tr>
                        );
                    })}</tbody>
                </table>
            </div>
        </Card>
    );
};

const QualitativeInsights: React.FC<{ scoresForSample: ScoreSheet[], graders: User[] }> = ({ scoresForSample, graders }) => {
    const descriptorFrequency = useMemo(() => {
        const allDescriptors = scoresForSample.flatMap(s => s.descriptors.map(d => d.name));
        const counts = allDescriptors.reduce((acc: Record<string, number>, desc) => {
            acc[desc] = (acc[desc] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).sort(([, a], [, b]) => (b as number) - (a as number));
    }, [scoresForSample]);

    return (
        <Card title="Qualitative Insights Panel">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <h4 className="font-bold mb-2">Descriptor Frequency</h4>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                        {descriptorFrequency.length > 0 ? descriptorFrequency.map(([name, count]) => (
                            <div key={name} className="flex justify-between items-center text-sm p-1 bg-background rounded">
                                <span>{name}</span><span className="font-bold text-primary">{count}</span>
                            </div>
                        )) : <p className="text-sm text-text-light">No descriptors were used.</p>}
                    </div>
                </div>
                <div className="md:col-span-2">
                    <h4 className="font-bold mb-2">Consolidated Grader Notes</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {scoresForSample.map(score => {
                            const grader = graders.find(g => g.id === score.qGraderId);
                            return (
                                <div key={score.id}><p className="font-semibold text-sm">{grader?.name}:</p><p className="text-sm italic text-text-light pl-2 border-l-2 border-border">"{score.notes || 'No comments.'}"</p></div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const FinalizationPanel: React.FC<{ sample: CoffeeSample, avgScore: number, descriptorProfile: string, onUpdateAdjudication: (data: AdjudicationData) => void, onBack: () => void, aiAnalysis?: string }> = ({ sample, avgScore, descriptorProfile, onUpdateAdjudication, onBack, aiAnalysis }) => {
    const [finalScore, setFinalScore] = useState<string>(sample.adjudicatedFinalScore?.toFixed(2) || avgScore.toFixed(2));
    const [justification, setJustification] = useState<string>(sample.adjudicationJustification || '');
    const [gradeLevel, setGradeLevel] = useState<string>(sample.gradeLevel || getGradeFromScore(avgScore));
    const [headJudgeNotes, setHeadJudgeNotes] = useState<string>(sample.headJudgeNotes || '');

    // Reset form state when sample changes (by blind code)
    useEffect(() => {
        setFinalScore(sample.adjudicatedFinalScore?.toFixed(2) || avgScore.toFixed(2));
        setJustification(sample.adjudicationJustification || '');
        setGradeLevel(sample.gradeLevel || getGradeFromScore(avgScore));
        setHeadJudgeNotes(sample.headJudgeNotes || '');
    }, [sample.id, sample.blindCode]);

    // Auto-fill justification when AI analysis is received
    useEffect(() => {
        if (aiAnalysis) {
            setJustification(prev => prev ? `${prev}\n${aiAnalysis}` : aiAnalysis);
        }
    }, [aiAnalysis]);

    // Auto-fill final notes for farmer when AI analysis is received
    useEffect(() => {
        if (aiAnalysis) {
            setHeadJudgeNotes(prev => prev ? `${prev}\n\n${aiAnalysis}` : aiAnalysis);
        }
    }, [aiAnalysis]);

    const showJustification = useMemo(() => Math.abs(parseFloat(finalScore) - avgScore) > 0.01, [finalScore, avgScore]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('HeadJudge Finalization: Save & Lock clicked', { finalScore, gradeLevel, headJudgeNotes, justification, showJustification });
        onUpdateAdjudication({
            score: parseFloat(finalScore),
            grade: gradeLevel,
            notes: headJudgeNotes,
            justification: showJustification ? justification : '',
            flagged: false,
            lock: true,
        });
        onBack();
    };

    const handleFlag = () => {
        console.log('HeadJudge Finalization: Flag for Discussion clicked', { headJudgeNotes, descriptorProfile });
        onUpdateAdjudication({ flagged: true, lock: false });
        onBack();
    };
    
    return (
        <Card title="Finalization & Action Panel">
                {sample.isLocked ? (
                      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="mx-auto text-green-600 mb-2" size={32}/>
                          <h3 className="font-bold text-green-800">Judgement Locked</h3>
                          <p className="text-sm text-green-700 mt-1">Final Score: {sample.adjudicatedFinalScore ? sample.adjudicatedFinalScore.toFixed(2) : '—'}</p>
                      </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="finalScore">Final Official Score</Label>
                        <Input id="finalScore" type="number" step="0.25" value={finalScore} onChange={e => setFinalScore(e.target.value)} required />
                    </div>
                    {showJustification && (
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <Label htmlFor="justification" className="mb-0">Justification for change</Label>
                                <span className="text-xs italic text-primary">Why did you adjust the score?</span>
                            </div>
                            <Input id="justification" type="text" value={justification} onChange={e => setJustification(e.target.value)} required placeholder="e.g., Sided with majority on acidity." />
                        </div>
                    )}
                    <div>
                        <Label htmlFor="gradeLevel">Grade Level</Label>
                        <Select id="gradeLevel" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required>
                            {['Outstanding', 'Excellent', 'Specialty', 'Below Specialty'].map(g => <option key={g} value={g}>{g}</option>)}
                        </Select>
                    </div>
                    <div>
                        <div className="flex justify-between items-center"><Label htmlFor="headJudgeNotes">Final Notes for Farmer (GenNote)</Label><Button type="button" size="sm" variant="secondary" className="flex items-center gap-1" onClick={() => setHeadJudgeNotes(p => `${p} ${descriptorProfile}`.trim())}><ClipboardPaste size={14} /> Insert Profile</Button></div>
                        <textarea id="headJudgeNotes" value={headJudgeNotes} onChange={e => setHeadJudgeNotes(e.target.value)} placeholder="Enter the final, holistic thoughts..." rows={4} className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary text-sm"></textarea>
                    </div>
                    <div className="flex flex-col space-y-2 pt-2">
                        <Button type="submit" className="w-full flex items-center justify-center gap-2"><Award size={16}/> Save & Lock Judgement</Button>
                        <Button type="button" variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={handleFlag}><Flag size={16}/> Flag for Discussion</Button>
                    </div>
                </form>
            )}
        </Card>
    );
};


// --- The Main Cockpit View ---
interface AdjudicationCockpitProps { sample: CoffeeSample; appData: AppData; event: CuppingEvent; onBack: () => void; onUpdateAdjudication: (sampleId: string, finalData: AdjudicationData) => void; onAIAnalyze: () => void; isAILoading: boolean; aiAnalysis?: string; }

const AdjudicationCockpit: React.FC<AdjudicationCockpitProps> = ({ sample, appData, event, onBack, onUpdateAdjudication, onAIAnalyze, isAILoading, aiAnalysis }) => {
    const scoresForSample = useMemo(() => appData.scores.filter(s => s.sampleId === sample.id && s.eventId === event.id && s.isSubmitted), [appData.scores, sample.id, event.id]);
    const graders = useMemo(() => appData.users.filter(u => scoresForSample.some(s => s.qGraderId === u.id)), [appData.users, scoresForSample]);
    const scoreAttributes: (keyof Omit<ScoreSheet['scores'], 'finalScore' | 'taints' | 'faults'>)[] = ['fragrance', 'flavor', 'aftertaste', 'acidity', 'body', 'balance', 'uniformity', 'cleanCup', 'sweetness', 'overall'];

    const overallStats = useMemo(() => calculateStats(scoresForSample.map(s => s.scores.finalScore)), [scoresForSample]);

    const comparisonData = useMemo(() => scoreAttributes.map(attr => {
        const scores = scoresForSample.map(s => s.scores[attr]);
        const stats = calculateStats(scores);
        return { attribute: attr.charAt(0).toUpperCase() + attr.slice(1), average: stats.average, stdDev: stats.stdDev, ...scoresForSample.reduce((acc, s) => ({ ...acc, [s.qGraderId]: s.scores[attr] }), {}) };
    }), [scoresForSample, scoreAttributes]);

    const descriptorProfile = useMemo(() => {
        const topDescriptors = scoresForSample.flatMap(s => s.descriptors.map(d => d.name)).reduce((acc, desc) => {
            acc[desc] = (acc[desc] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(topDescriptors).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5).map(([name]) => name).join(', ');
    }, [scoresForSample]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Adjudication Cockpit: <span className={`font-mono ${sample.sampleType === 'CALIBRATION' ? 'text-purple-600' : 'text-primary'}`}>{sample.blindCode}</span></h2>
                <div className="flex items-center space-x-2">
                    <Button 
                        onClick={onAIAnalyze} 
                        variant="secondary" 
                        className="flex items-center space-x-1"
                        disabled={isAILoading}
                    >
                        <Sparkles size={16} />
                        <span>AI Analyze</span>
                    </Button>
                    <Button onClick={onBack} variant="secondary" className="flex items-center space-x-1"><ChevronLeft size={16}/><span>Back to Samples</span></Button>
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <AtAGlanceMetrics sample={sample} stats={overallStats} graderCount={graders.length} />
                    <ScoreHeatmap comparisonData={comparisonData} graders={graders} />
                    <QualitativeInsights scoresForSample={scoresForSample} graders={graders} />
                </div>
                <div className="xl:col-span-1">
                    <div className="sticky top-24">
                        <FinalizationPanel sample={sample} avgScore={overallStats.average} descriptorProfile={descriptorProfile} onUpdateAdjudication={(data) => onUpdateAdjudication(sample.id, data)} onBack={onBack} aiAnalysis={aiAnalysis}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---

interface HeadJudgeDashboardProps { currentUser: User; appData: AppData; onUpdateAdjudication: (sampleId: string, finalData: AdjudicationData) => void; onLogout: () => void; }

const HeadJudgeDashboard: React.FC<HeadJudgeDashboardProps> = ({ currentUser, appData, onUpdateAdjudication, onLogout }) => {
    const [selectedEvent, setSelectedEvent] = useState<CuppingEvent | null>(null);
    const [selectedSample, setSelectedSample] = useState<CoffeeSample | null>(null);
    const [assignedEvents, setAssignedEvents] = useState<CuppingEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchedScores, setFetchedScores] = useState<ScoreSheet[]>([]);
    const [fetchedGraders, setFetchedGraders] = useState<User[]>([]);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'adjudicate' | 'leaderboard'>('adjudicate');
    const navigate = useNavigate();

    // Clear AI analysis when switching samples to keep analysis isolated per sample
    useEffect(() => {
        setAiAnalysis('');
    }, [selectedSample?.id, selectedSample?.blindCode]);

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
                        localStorage.setItem('currentUser', JSON.stringify(user));
                    } else if (response.status === 401) {
                        console.log('Session expired, redirecting to login');
                        localStorage.removeItem('currentUser');
                        alert('Session expired. Please log in again.');
                        navigate('/');
                    }
                } catch (error) {
                    console.error('Error verifying authentication:', error);
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

    const fetchAssignedEvents = async (eventId?: string) => {
        setLoading(true);
        setError(null);
        try {
            let url = 'http://localhost:5001/api/cupping-events/headjudge';
            if (eventId) {
                if (!/^[0-9]+$/.test(eventId)) {
                    throw new Error('Invalid eventId: must be a valid integer.');
                }
                url += `?eventId=${eventId}`;
            }
            console.log('Requesting assigned events from URL:', url);
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                const events = await response.json();
                setAssignedEvents(events);
            } else {
                // Try to read the error body to show a helpful message
                let serverMsg = `Status ${response.status}`;
                try {
                    const body = await response.text();
                    // Try to parse JSON message if present
                    try {
                        const parsed = JSON.parse(body);
                        serverMsg = parsed.message || JSON.stringify(parsed);
                    } catch (e) {
                        if (body) serverMsg = body;
                    }
                } catch (e) {
                    // ignore
                }
                console.error('Error fetching events:', serverMsg);
                setError(serverMsg);
            }
        } catch (error) {
            console.error('Unexpected error while fetching events:', error);
            setError('An unexpected error occurred while fetching events. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleAIAnalysis = async () => {
        if (!selectedSample || !selectedEvent) return;
        
        try {
            setAiLoading(true);
            console.log('Starting AI analysis for sample:', selectedSample.id);
            
            // Get Q Grader scores for this sample
            const sampleScores = fetchedScores.filter(s => s.sampleId === String(selectedSample.id));
            console.log('Found scores:', sampleScores.length);
            const avgScores = {};
            
            if (sampleScores.length > 0) {
                const scoreKeys = ['fragrance', 'flavor', 'aftertaste', 'acidity', 'body', 'balance', 'uniformity', 'cleanCup', 'sweetness', 'overall'];
                scoreKeys.forEach(key => {
                    const values = sampleScores.map(s => (s.scores as any)[key] || 0).filter(v => v > 0);
                    avgScores[key] = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
                });
            }
            
            console.log('Sending request with scores:', avgScores);
            const response = await fetch('http://localhost:5001/api/analyze-sample', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sampleId: selectedSample.id,
                    sampleName: `${selectedSample.blindCode}`,
                    farmName: selectedSample.farmName,
                    region: selectedSample.region,
                    variety: selectedSample.variety,
                    processingMethod: selectedSample.processingMethod,
                    qGraderScores: avgScores,
                    headJudgeNotes: '',
                    analysisType: 'headjudge',
                }),
            });
            
            console.log('Response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Analysis received:', data.analysis);
                setAiAnalysis(data.analysis);
                setIsAIModalOpen(true);
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert('Error analyzing sample: ' + errorData.message);
            }
        } catch (error) {
            console.error('AI Analysis error:', error);
            alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignedEvents();
    }, []);

    // When an event is selected, fetch submitted QGrader scores from the server
    const loadSubmittedScores = useCallback(async (opts?: { forceEventId?: string }) => {
        const evId = opts?.forceEventId ?? selectedEvent?.id;
        if (!evId) {
            setFetchedScores([]);
            setFetchedGraders([]);
            return;
        }

        try {
            const url = `http://localhost:5001/api/headjudge/events/${evId}/scores`;
            console.log('HeadJudge: fetching submitted scores from', url);
            const res = await fetch(url, { method: 'GET', credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                // Map server QGraderScore objects to frontend ScoreSheet shape
                const mapped: ScoreSheet[] = Array.isArray(data) ? data.map((s: any) => ({
                    id: String(s.id),
                    qGraderId: String(s.qGraderId ?? s.qGrader?.id ?? ''),
                    sampleId: String(s.sampleId ?? s.sample?.id ?? ''),
                    eventId: String(s.cuppingEventId ?? (s.sample && s.sample.cuppingEventId) ?? evId ?? ''),
                    scores: {
                        fragrance: Number(s.fragrance ?? 0),
                        flavor: Number(s.flavor ?? 0),
                        aftertaste: Number(s.aftertaste ?? 0),
                        acidity: Number(s.acidity ?? 0),
                        body: Number(s.body ?? 0),
                        balance: Number(s.balance ?? 0),
                        uniformity: Number(s.uniformity ?? 0),
                        cleanCup: Number(s.cleanCup ?? 0),
                        sweetness: Number(s.sweetness ?? 0),
                        overall: Number(s.overall ?? 0),
                        taints: Number(s.defects ?? 0),
                        faults: 0,
                        finalScore: Number(s.total ?? 0),
                    },
                    descriptors: s.descriptors ? JSON.parse(s.descriptors) : [],
                    notes: s.comments || s.notes || '',
                    isSubmitted: Boolean(s.isSubmitted),
                })) : [];
                setFetchedScores(mapped);
                console.log('HeadJudge: fetched mapped scores count', mapped.length, mapped.slice(0,3));

                // Build grader list from included qGrader objects (if present)
                const gradersMap = new Map<string, User>();
                if (Array.isArray(data)) {
                    data.forEach((s: any) => {
                        const q = s.qGrader || s.qGraderId ? s.qGrader : null;
                        if (q && q.id) {
                            const id = String(q.id);
                            if (!gradersMap.has(id)) {
                                gradersMap.set(id, {
                                    id,
                                    name: q.name || q.email || `Grader ${id}`,
                                    email: q.email || '',
                                    roles: [Role.Q_GRADER],
                                    status: 'Active',
                                    lastLogin: q.lastLogin || '',
                                    profilePictureUrl: q.profilePictureUrl || undefined,
                                } as User);
                            }
                        }
                    });
                }
                const gradersArr = Array.from(gradersMap.values());
                setFetchedGraders(gradersArr);
                console.log('HeadJudge: fetched graders count', gradersArr.length, gradersArr.slice(0,3));
            } else {
                console.error('Failed to fetch submitted scores for event', evId, res.status);
                setFetchedScores([]);
            }
        } catch (err) {
            console.error('Error fetching submitted scores for event', evId, err);
            setFetchedScores([]);
        }
    }, [selectedEvent]);

    useEffect(() => {
        loadSubmittedScores();

        const handler = (e: Event) => {
            try {
                const ce = e as CustomEvent;
                const detail = ce.detail || {};
                // If the saved decision is for the currently selected event, re-fetch
                if (!selectedEvent || String(detail.eventId) === String(selectedEvent.id)) {
                    console.log('headjudge:decision-saved received, reloading submitted scores', detail);
                    loadSubmittedScores({ forceEventId: String(detail.eventId) });
                    // Also refresh the assigned events to ensure we have latest event state
                    const refreshAssignedEvents = async () => {
                        try {
                            const url = 'http://localhost:5001/api/cupping-events/headjudge';
                            const res = await fetch(url, { method: 'GET', credentials: 'include' });
                            if (res.ok) {
                                const events = await res.json();
                                setAssignedEvents(events);
                                console.log('HeadJudge: refreshed assigned events after decision saved', events.length);
                                // Update selectedEvent with refreshed data to ensure samples display
                                if (selectedEvent) {
                                    const refreshedEvent = events.find((e: any) => String(e.id) === String(selectedEvent.id));
                                    if (refreshedEvent) {
                                        setSelectedEvent(refreshedEvent);
                                        console.log('HeadJudge: updated selectedEvent with refreshed data', { eventId: refreshedEvent.id, sampleCount: refreshedEvent.sampleIds?.length });
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Error refreshing assigned events:', err);
                        }
                    };
                    refreshAssignedEvents();
                }
            } catch (err) {
                console.error('Error handling headjudge:decision-saved event', err);
            }
        };

        window.addEventListener('headjudge:decision-saved', handler as EventListener);
        return () => window.removeEventListener('headjudge:decision-saved', handler as EventListener);
    }, [selectedEvent, loadSubmittedScores]);

    const samplesForEvent = useMemo(() => {
        if (!selectedEvent) return [];
        // First try: match against global appData.samples (preloaded)
        const sampleIdSet = new Set((selectedEvent.sampleIds || []).map(id => String(id)));
        const found = appData.samples.filter(s => sampleIdSet.has(String(s.id)));
        // Only use appData.samples if we found ALL expected samples
        if (found && found.length === sampleIdSet.size && sampleIdSet.size > 0) return found;

        // Fallback: use sample objects provided directly on the event by the server (sampleObjects)
        if ((selectedEvent as any).sampleObjects) {
            return (selectedEvent as any).sampleObjects as CoffeeSample[];
        }

        return [];
    }, [selectedEvent, appData.samples]);

    // Merge fetched server-submitted scores for the selected event with local appData
    const mergedAppData = useMemo(() => {
        if (!selectedEvent) return appData;

        // Scores: keep all scores not belonging to this event, then append server-provided submitted scores
        const otherScores = appData.scores.filter(s => s.eventId !== selectedEvent.id);
        const mergedScores = fetchedScores.length > 0 ? [...otherScores, ...fetchedScores] : appData.scores;

        // Ensure samples include any sampleObjects provided on the event (fallback source)
        // Prefer `appData.samples` values (client-updated) to avoid overwriting fields like `isLocked`.
        const samplesMap = new Map<string, CoffeeSample>();
        if ((selectedEvent as any)?.sampleObjects) {
            ((selectedEvent as any).sampleObjects as CoffeeSample[]).forEach(s => {
                samplesMap.set(String(s.id), s);
            });
        }
        // Overlay appData.samples so client-updated samples take precedence
        appData.samples.forEach(s => samplesMap.set(String(s.id), s));
        const mergedSamples = Array.from(samplesMap.values());

        // Users: merge fetched graders into appData.users (avoid duplicates)
        const existingUsersById = new Map(appData.users.map(u => [u.id, u]));
        fetchedGraders.forEach(g => {
            if (!existingUsersById.has(g.id)) existingUsersById.set(g.id, g);
        });
        const mergedUsers = Array.from(existingUsersById.values());

        const merged = { ...appData, scores: mergedScores, users: mergedUsers, samples: mergedSamples } as AppData;
        console.log('HeadJudge: mergedAppData summary', { mergedScoresCount: merged.scores.length, mergedUsersCount: merged.users.length, mergedSamplesCount: merged.samples.length });
        return merged;
    }, [appData, selectedEvent, fetchedScores, fetchedGraders]);

    // Keep the selectedSample object in sync with latest mergedAppData.samples
    useEffect(() => {
        if (!selectedSample) return;
        const updated = mergedAppData.samples.find(s => String(s.id) === String(selectedSample.id));
        console.log('HeadJudge: syncing check for selectedSample', { selectedSampleId: selectedSample.id, found: !!updated });
        if (updated) {
            // Always set the selected sample to the merged version to ensure UI re-renders
            if (JSON.stringify(updated) !== JSON.stringify(selectedSample)) {
                console.log('Syncing selectedSample with mergedAppData (changed)', { selectedSampleId: selectedSample.id, updated });
            } else {
                console.log('Syncing selectedSample with mergedAppData (force update, no deep diffs) ', { selectedSampleId: selectedSample.id });
            }
            setSelectedSample(updated);
        }
    }, [mergedAppData, selectedSample]);

    if (loading) {
        return <p>Loading events...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (selectedSample && selectedEvent) {
        return <AdjudicationCockpit sample={selectedSample} appData={mergedAppData} event={selectedEvent} onBack={() => setSelectedSample(null)} onUpdateAdjudication={onUpdateAdjudication} onAIAnalyze={handleAIAnalysis} isAILoading={aiLoading} aiAnalysis={aiAnalysis} />
    }

    if (selectedEvent) {
        return (
            <div className="fixed inset-0 bg-white flex flex-col">
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar */}
                    <div className="w-64 bg-white border-r border-gray-100 shadow-sm overflow-y-auto flex flex-col">
                        {/* Logo Section */}
                        <div className="p-6 border-b border-gray-100 flex flex-col items-center gap-2">
                            <CoffeeCupLogo size={56} />
                            <div className="text-center">
                                <h1 className="text-xl font-bold text-gray-900">Cupping Lab</h1>
                                <p className="text-xs text-gray-500">Coffee Quality</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex flex-col p-4 gap-2 flex-1">
                            <button
                                onClick={() => setActiveTab('adjudicate')}
                                className={`w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                                  activeTab === 'adjudicate' 
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Coffee size={18} />
                                <span>Adjudicate</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('leaderboard')}
                                className={`w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                                  activeTab === 'leaderboard' 
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Trophy size={18} />
                                <span>Leaderboard</span>
                            </button>
                        </nav>

                        {/* Head Judge Profile */}
                        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 w-full">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                                    {currentUser?.name?.[0]?.toUpperCase() || 'H'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-gray-600">Head Judge</span>
                                    <span className="text-xs font-bold text-gray-800 truncate">{currentUser?.name || 'Head Judge'}</span>
                                </div>
                            </div>
                            <button
                                onClick={onLogout}
                                className="w-full bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-white to-blue-50/30">
                        <div className="p-6">
                            <Card className="transition-smooth">
                                <div className="flex items-center gap-4 mb-6">
                                    <Button 
                                        onClick={() => setSelectedEvent(null)} 
                                        className="flex items-center space-x-1" 
                                        variant="secondary"
                                    >
                                        <ChevronLeft size={16}/> 
                                        <span>Back to Events</span>
                                    </Button>
                                    <h3 className="text-2xl font-extrabold text-primary">Adjudicate Samples: {selectedEvent.name}</h3>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {samplesForEvent.map(sample => {
                                        const relevantScores = appData.scores.filter(s => s.sampleId === sample.id && s.eventId === selectedEvent.id && s.isSubmitted);
                                        const { average } = calculateStats(relevantScores.map(s => s.scores.finalScore));

                                        return (
                                            <div key={sample.id} className="space-y-0">
                                                <div 
                                                    onClick={() => setSelectedSample(sample)}
                                                    className="relative p-4 border-2 border-border rounded-lg cursor-pointer hover:bg-background hover:border-primary hover:shadow-md transition-all duration-200 text-center space-y-1 shadow-sm flex flex-col justify-between h-full"
                                                >
                                                    {sample.adjudicatedFinalScore && <span className="absolute top-2 right-2 text-green-600" title="Finalized"><CheckCircle size={18}/></span>}
                                                    {sample.flaggedForDiscussion && <span className="absolute top-2 left-2 text-yellow-600" title="Flagged for Discussion"><Flag size={18}/></span>}
                                                    <div className="flex-1 flex flex-col justify-center">
                                                        <p className="font-mono text-xl font-bold text-gray-800">{sample.blindCode}</p>
                                                        <p className="text-sm font-semibold text-primary">{relevantScores.length > 0 ? `${average.toFixed(2)} avg` : 'No Scores'}</p>
                                                        <p className="text-xs text-text-light">{relevantScores.length} / {selectedEvent.assignedQGraderIds.length} scores in</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
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
                        <button
                            onClick={() => {
                                setActiveTab('adjudicate');
                                setSelectedEvent(null);
                                setSelectedSample(null);
                            }}
                            className={`w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                              activeTab === 'adjudicate' 
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Coffee size={18} />
                            <span>Adjudicate</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                              activeTab === 'leaderboard' 
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Trophy size={18} />
                            <span>Leaderboard</span>
                        </button>
                    </nav>

                    {/* Head Judge Profile Section at Bottom */}
                    <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
                        {/* Profile Card */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 w-full">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                                {currentUser?.name?.[0]?.toUpperCase() || 'H'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-gray-600">Head Judge</span>
                                <span className="text-xs font-bold text-gray-800 truncate">{currentUser?.name || 'Head Judge'}</span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={onLogout}
                            className="w-full bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-white to-blue-50/30">
                    <div className="p-6">
                        {activeTab === 'adjudicate' && (
                        <Card className="transition-smooth">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-extrabold text-primary">Adjudication Events</h3>
                                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full font-semibold">
                                    {assignedEvents.length} event{assignedEvents.length !== 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-primary bg-gradient-to-r from-gray-50 to-gray-100">
                                            <th className="p-4 font-bold text-left text-gray-700">Event Name</th>
                                            <th className="p-4 font-bold text-left text-gray-700">Date</th>
                                            <th className="p-4 font-bold text-center text-gray-700">Samples</th>
                                            <th className="p-4 font-bold text-center text-gray-700">Status</th>
                                            <th className="p-4 font-bold text-right text-gray-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignedEvents.length > 0 ? (
                                            assignedEvents.map((event, idx) => (
                                                <tr key={event.id} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                    <td className="p-4 font-semibold text-primary">{event.name}</td>
                                                    <td className="p-4 text-gray-600">{new Date(event.date).toISOString().split('T')[0]}</td>
                                                    <td className="p-4 text-center">
                                                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                                                            {event.sampleIds?.length || 0}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${event.isResultsRevealed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                            {event.isResultsRevealed ? '✓ Ended' : '⏳ Active'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {event.isResultsRevealed ? (
                                                            <div className="text-xs font-semibold text-gray-500">Event Complete</div>
                                                        ) : (
                                                            <Button 
                                                                onClick={() => setSelectedEvent(event)} 
                                                                size="sm"
                                                                className="bg-primary text-white hover:bg-primary/90"
                                                            >
                                                                Adjudicate
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500 font-semibold">
                                                    There are no cupping events to adjudicate at this time.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {assignedEvents.length > 0 ? (
                                    assignedEvents.map(event => (
                                        <div key={event.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:border-primary">
                                            <div className="space-y-3">
                                                {/* Header */}
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg text-primary leading-tight">{event.name}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">📅 {new Date(event.date).toISOString().split('T')[0]}</p>
                                                    </div>
                                                    <span className={`flex-shrink-0 inline-block px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${event.isResultsRevealed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {event.isResultsRevealed ? '✓ Ended' : '⏳ Active'}
                                                    </span>
                                                </div>

                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-2 py-3 px-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                                    <div className="text-center">
                                                        <p className="text-xs font-semibold text-gray-600">Samples</p>
                                                        <p className="font-bold text-lg text-primary">{event.sampleIds?.length || 0}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-semibold text-gray-600">Status</p>
                                                        <p className="font-bold text-lg text-gray-700">{event.isResultsRevealed ? 'Complete' : 'In Progress'}</p>
                                                    </div>
                                                </div>

                                                {/* Action */}
                                                <div className="border-t border-gray-200 pt-3">
                                                    {event.isResultsRevealed ? (
                                                        <div className="text-center text-sm font-semibold text-gray-500 py-2 bg-gray-50 rounded-lg">
                                                            Event Complete
                                                        </div>
                                                    ) : (
                                                        <Button 
                                                            onClick={() => setSelectedEvent(event)}
                                                            className="w-full bg-primary text-white hover:bg-primary/90"
                                                        >
                                                            Adjudicate
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-lg text-gray-400 font-semibold">No events assigned</p>
                                        <p className="text-sm text-gray-500 mt-2">There are no cupping events to adjudicate at this time.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                        )}
                        {activeTab === 'leaderboard' && (
                        <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-primary">Leaderboard</h3>
                                {appData.events.length > 0 && appData.events.some(e => e.isResultsRevealed && e.sampleIds.length > 0) ? (
                                    appData.events
                                      .filter(e => e.isResultsRevealed && e.sampleIds.length > 0)
                                      .map(event => {
                                        const eventSamples = appData.samples.filter(s => event.sampleIds.includes(s.id) && s.sampleType !== 'CALIBRATION');
                                        const rankedSamples = eventSamples
                                          .filter(s => s.adjudicatedFinalScore !== undefined)
                                          .sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0));
                                        
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

                                        return (
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
                                                  {rankedSamples.map((sample, index) => (
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
                                        );
                                      })
                                ) : (
                                    <Card>
                                        <p className="text-center text-text-light">No leaderboard data available yet. Check back once competition results are revealed.</p>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HeadJudgeDashboard;
