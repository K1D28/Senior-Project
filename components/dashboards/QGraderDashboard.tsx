import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { User, CuppingEvent, CoffeeSample, ScoreSheet, CuppingScore, Descriptor } from '../../types';
import { AppData } from '../../data';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Modal } from '../ui/Modal';
import { CheckCircle, FileClock, Minus, Plus, Save, Coffee, ChevronLeft, X, Lock, Trophy, LogOut, Sparkles, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// FIX: Add type definitions for SpeechRecognition API to the global window object to resolve TypeScript errors.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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

// --- Helper Functions & Data ---
function debounce<F extends (...args: any[]) => any>(fn: F, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: Parameters<F>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => { fn.apply(this, args); }, delay);
  };
}

const FLAVOR_CATEGORIES: Record<string, string[]> = {
    'Fruity': ['Berry', 'Citrus Fruit', 'Dried Fruit', 'Stone Fruit', 'Tropical Fruit'],
    'Floral': ['Jasmine', 'Rose', 'Chamomile', 'Honeysuckle'],
    'Sweet': ['Brown Sugar', 'Caramel', 'Honey', 'Maple Syrup', 'Molasses', 'Vanilla'],
    'Nutty/Cocoa': ['Almond', 'Hazelnut', 'Peanut', 'Chocolate', 'Dark Chocolate'],
    'Spices': ['Cinnamon', 'Clove', 'Nutmeg', 'Anise', 'Pepper'],
    'Green/Veg': ['Grassy', 'Herbal', 'Pea', 'Hay-like'],
};

type SampleStatus = 'Not Started' | 'Submitted' | 'Finalized';

// --- Child Components ---
const DefectCounter: React.FC<{ label: string; count: number; onCountChange: (newCount: number) => void; pointValue: number; disabled?: boolean; }> = ({ label, count, onCountChange, pointValue, disabled }) => (
    <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
        <div><p className="font-semibold text-red-800">{label}</p><p className="text-xs text-red-600">{-pointValue} points per cup</p></div>
        <div className="flex items-center space-x-2 sm:space-x-3">
            <Button size="sm" variant="secondary" onClick={() => !disabled && onCountChange(Math.max(0, count - 1))} className="w-8 h-8 p-0 flex items-center justify-center rounded-full" disabled={disabled}><Minus size={16} /></Button>
            <span className="font-bold text-lg text-red-800 w-8 text-center tabular-nums">{count}</span>
            <Button size="sm" variant="secondary" onClick={() => !disabled && onCountChange(count + 1)} className="w-8 h-8 p-0 flex items-center justify-center rounded-full" disabled={disabled}><Plus size={16} /></Button>
        </div>
    </div>
);

const DescriptorItem: React.FC<{ descriptor: Descriptor; onIntensityChange: (name: string, intensity: number) => void; onRemove: (name: string) => void; disabled?: boolean; }> = ({ descriptor, onIntensityChange, onRemove, disabled }) => (
    <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-md">
        <button onClick={() => !disabled && onRemove(descriptor.name)} className="text-gray-400 hover:text-red-500" disabled={disabled}><X size={16} /></button>
        <span className="font-medium text-sm w-28 truncate">{descriptor.name}</span>
        <input type="range" min="1" max="5" step="1" value={descriptor.intensity} onChange={(e) => !disabled && onIntensityChange(descriptor.name, parseInt(e.target.value, 10))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" disabled={disabled} />
    </div>
);

// --- Cupping Form Component ---
interface CuppingFormProps { scoreSheet: ScoreSheet; sample: CoffeeSample; onSave: (updatedSheet: ScoreSheet) => void; onBack: () => void; onAIAnalyze?: () => void; isAILoading?: boolean; isAIModalOpen?: boolean; aiAnalysis?: string; onCloseAIModal?: () => void; }

const CuppingForm: React.FC<CuppingFormProps> = ({ scoreSheet, sample, onSave, onBack, onAIAnalyze, isAILoading, isAIModalOpen, aiAnalysis, onCloseAIModal }) => {
    const [scores, setScores] = useState<CuppingScore>(scoreSheet.scores);
    const [notes, setNotes] = useState(scoreSheet.notes);
    const [descriptors, setDescriptors] = useState<Descriptor[]>(scoreSheet.descriptors);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
    const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false);
    const isInitialMount = useRef(true);

    const calculateFinalScore = useCallback(() => {
        const { taints, faults, finalScore, ...rest } = scores;
        const attributeTotal = (Object.values(rest) as number[]).reduce((sum, val) => sum + val, 0); // Ensure val is a number
        const defectTotal = (Number(scores.taints || 0) * 2) + (Number(scores.faults || 0) * 4);
        return Number(attributeTotal) - Number(defectTotal);
    }, [scores]);

    const debouncedSave = useCallback(debounce((sheetToSave: ScoreSheet) => { onSave(sheetToSave); setSaveStatus('saved'); }, 1500), [onSave]);

    useEffect(() => {
        if (aiAnalysis) {
            setNotes(prev => prev ? `${prev}\n\n${aiAnalysis}` : aiAnalysis);
        }
    }, [aiAnalysis]);

    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; return; }
        if (scoreSheet.isSubmitted) return; // Do not autosave if already submitted
        if (saveStatus !== 'unsaved') return;
        setSaveStatus('saving');
        const finalScore = calculateFinalScore();
        const sheetToSave: ScoreSheet = { ...scoreSheet, scores: { ...scores, finalScore }, notes, descriptors, isSubmitted: false };
        debouncedSave(sheetToSave);
    }, [scores, notes, descriptors, saveStatus, scoreSheet, calculateFinalScore, debouncedSave]);

    const handleDataChange = () => setSaveStatus('unsaved');
    const handleScoreChange = (field: keyof CuppingScore, value: number) => { if (scoreSheet.isSubmitted) return; setScores(prev => ({ ...prev, [field]: value })); handleDataChange(); };
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setNotes(e.target.value); handleDataChange(); };
    const handleDescriptorIntensityChange = (name: string, intensity: number) => { if (scoreSheet.isSubmitted) return; setDescriptors(prev => prev.map(d => d.name === name ? { ...d, intensity } : d)); handleDataChange(); };
    const handleRemoveDescriptor = (name: string) => { if (scoreSheet.isSubmitted) return; setDescriptors(prev => prev.filter(d => d.name !== name)); handleDataChange(); };
    const toggleDescriptor = (name: string) => { if (scoreSheet.isSubmitted) return; setDescriptors(prev => prev.some(d => d.name === name) ? prev.filter(d => d.name !== name) : [...prev, { name, intensity: 3 }]); handleDataChange(); };

    const handleSubmit = (isFinal: boolean) => {
        if (scoreSheet.isSubmitted) return; // Prevent re-submission
        const finalScore = calculateFinalScore();
        const updatedSheet: ScoreSheet = { ...scoreSheet, scores: { ...scores, finalScore }, notes, descriptors, isSubmitted: isFinal };
        onSave(updatedSheet);
        onBack();
    };
    
    const scoreFields: { key: keyof CuppingScore; label: string }[] = [
        { key: 'fragrance', label: 'Fragrance/Aroma' }, { key: 'flavor', label: 'Flavor' }, { key: 'aftertaste', label: 'Aftertaste' },
        { key: 'acidity', label: 'Acidity' }, { key: 'body', label: 'Body' }, { key: 'balance', label: 'Balance' }, { key: 'uniformity', label: 'Uniformity' },
        { key: 'cleanCup', label: 'Clean Cup' }, { key: 'sweetness', label: 'Sweetness' }, { key: 'overall', label: 'Overall' },
    ];
    const quickNotes = ["Re-cup", "Favorite", "Check Consistency"];

    return (
        <div className="h-screen flex flex-col bg-white">
            <Card className="flex-1 flex flex-col overflow-hidden m-0">
                <div className="p-3 bg-background border-b border-border -m-6 mb-3 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-base font-bold text-text-dark">Scoring Sample: <span className={`font-mono text-sm ${sample.sampleType === 'CALIBRATION' ? 'text-purple-600' : 'text-primary'}`}>{sample.blindCode}</span></h3>
                    {onAIAnalyze && (
                        <Button 
                            size="sm"
                            onClick={onAIAnalyze} 
                            disabled={isAILoading}
                            className="flex items-center space-x-1"
                        >
                            <Sparkles size={14} />
                            <span>AI Analyze</span>
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 overflow-y-auto px-1">
                    {/* Scores Column */}
                    <div className="lg:col-span-1 space-y-2 overflow-y-auto">
                        {scoreFields.map(({ key, label }) => (
                            <div key={key} className="py-1">
                                <div className="flex justify-between items-center mb-0.5"><label className="text-xs font-medium text-gray-700">{label}</label><span className="font-semibold text-primary tabular-nums text-xs">{scores[key].toFixed(2)}</span></div>
                                <input type="range" min="0" max="10" step="0.25" value={scores[key]} onChange={(e) => handleScoreChange(key, parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" disabled={scoreSheet.isSubmitted} />
                            </div>
                        ))}
                    </div>

                    {/* Notes and Defects Column */}
                    <div className="lg:col-span-2 space-y-3 overflow-y-auto flex flex-col">
                        <div>
                            <Label className="text-xs">Smart Notes</Label>
                            <div className="space-y-2 p-2 border border-border rounded-lg max-h-24 overflow-y-auto">
                                    <div className="flex items-center space-x-1">
                                    <Button size="sm" onClick={() => !scoreSheet.isSubmitted && setIsFlavorModalOpen(true)} disabled={scoreSheet.isSubmitted} className="text-xs py-1">+ Add Descriptors</Button>
                                </div>
                                <div className="space-y-1">
                                    {descriptors.length > 0 ? descriptors.map(d => <DescriptorItem key={d.name} descriptor={d} onIntensityChange={handleDescriptorIntensityChange} onRemove={handleRemoveDescriptor} disabled={scoreSheet.isSubmitted} />) : <p className="text-xs text-center text-gray-400 py-2">No descriptors added.</p>}
                                </div>
                            </div>
                        </div>
                        {aiAnalysis && (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg max-h-20 overflow-y-auto">
                                <div className="flex items-start gap-2">
                                    <Sparkles className="text-blue-600 flex-shrink-0 mt-0.5" size={14}/>
                                    <div className="flex-1">
                                        <p className="font-semibold text-blue-900 text-xs">AI Analysis:</p>
                                        <p className="text-xs text-blue-800 mt-0.5 whitespace-pre-wrap line-clamp-3">{aiAnalysis}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex-1 flex flex-col">
                            <Label htmlFor="final-comments" className="text-xs">Final Comments</Label>
                            <textarea id="final-comments" value={notes} onChange={handleNotesChange} rows={2} className="flex-1 w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary text-xs" placeholder="e.g., vibrant, floral, tea-like body..." disabled={scoreSheet.isSubmitted}></textarea>
                            <div className="flex items-center space-x-1 mt-1 flex-wrap gap-1">
                                {quickNotes.map(qn => <Button key={qn} size="sm" variant="secondary" onClick={() => { setNotes(p => `${p} ${qn}.`.trim()); handleDataChange(); }} className="text-xs py-0 px-2">{qn}</Button>)}
                            </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-border">
                            <h4 className="text-xs font-medium text-gray-800">Defects</h4>
                            <DefectCounter label="Taints" count={scores.taints} onCountChange={(c) => handleScoreChange('taints', c)} pointValue={2} disabled={scoreSheet.isSubmitted} />
                            <DefectCounter label="Faults" count={scores.faults} onCountChange={(c) => handleScoreChange('faults', c)} pointValue={4} disabled={scoreSheet.isSubmitted} />
                        </div>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isFlavorModalOpen} onClose={() => setIsFlavorModalOpen(false)} title="Add Flavor Descriptors">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {Object.entries(FLAVOR_CATEGORIES).map(([category, flavors]) => (
                        <div key={category}>
                            <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-2">{category}</h4>
                            <div className="flex flex-wrap gap-2">
                                {flavors.map(flavor => <Button key={flavor} size="sm" variant={descriptors.some(d => d.name === flavor) ? 'primary' : 'secondary'} onClick={() => toggleDescriptor(flavor)}>{flavor}</Button>)}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-4 mt-4 border-t border-border flex justify-end">
                    <Button onClick={() => setIsFlavorModalOpen(false)}>Done</Button>
                </div>
            </Modal>

            {/* Sticky Footer */}
                <div className="pt-2 mt-2 border-t border-border flex justify-between items-center flex-shrink-0 text-xs">
                    <Button onClick={onBack} variant="secondary" className="flex items-center space-x-1 text-xs py-1"><ChevronLeft size={14} /> <span>Back</span></Button>
                    <div className="text-center">
                        <p className="text-text-light">Final Score</p>
                        <p className="text-xl font-bold text-text-dark tabular-nums">{calculateFinalScore().toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="flex items-center space-x-1 text-text-light">
                            {saveStatus === 'saving' && <><Save size={12} className="animate-spin" /><span className="text-xs">Saving...</span></>}
                            {saveStatus === 'saved' && <><CheckCircle size={12} className="text-green-600"/><span className="text-xs">Saved</span></>}
                        </div>
                        {!scoreSheet.isSubmitted ? (
                            <Button onClick={() => handleSubmit(true)} className={`text-xs py-1 ${saveStatus === 'saving' ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={saveStatus === 'saving'}>Submit Final</Button>
                        ) : (
                            <div className="text-xs font-semibold text-gray-600">Submitted</div>
                        )}
                    </div>
                </div>
            
            {/* AI Analysis - Now displayed inline in the form above */}
            {/* Modal removed - AI analysis displays between Smart Notes and Final Comments */}
        </div>
    );
};

// --- Main Dashboard Component ---
interface QGraderDashboardProps { currentUser: User; appData: AppData; onUpdateScoreSheet: (sheet: ScoreSheet) => void; onLogout: () => void; }

const QGraderDashboard: React.FC<QGraderDashboardProps> = ({ currentUser, appData, onUpdateScoreSheet, onLogout }) => {
    const [selectedEvent, setSelectedEvent] = useState<CuppingEvent | null>(null);
    const [selectedSample, setSelectedSample] = useState<CoffeeSample | null>(null);
    const [assignedEvents, setAssignedEvents] = useState<CuppingEvent[]>([]);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'cupping' | 'leaderboard'>('cupping');
    const [leaderboardEvents, setLeaderboardEvents] = useState<CuppingEvent[]>([]);
    const [leaderboardSamples, setLeaderboardSamples] = useState<CoffeeSample[]>([]);
    const navigate = useNavigate();

    // Clear AI analysis when switching samples to keep analysis isolated per sample
    useEffect(() => {
        setAiAnalysis('');
    }, [selectedSample?.id, selectedSample?.blindCode]);

    useEffect(() => {
        const fetchAssignedEvents = async () => {
            try {
                const response = await fetch('/api/cupping-events/qgrader', {
                    method: 'GET',
                    credentials: 'include',
                });
                if (response.ok) {
                    const events = await response.json();
                    setAssignedEvents(events);
                } else {
                    let serverMsg = `Status ${response.status}`;
                    try {
                        const body = await response.text();
                        try { const parsed = JSON.parse(body); serverMsg = parsed.message || JSON.stringify(parsed); } catch (e) { if (body) serverMsg = body; }
                    } catch (e) {}
                    console.error('Failed to fetch Q Grader events:', serverMsg);
                }
            } catch (error) {
                console.error('Error fetching Q Grader events:', error);
            }
        };
        fetchAssignedEvents();
    }, []);

    // Fetch all events and samples for leaderboard display
    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                
                const [eventsResponse, samplesResponse] = await Promise.all([
                    fetch('/api/cupping-events', { method: 'GET', credentials: 'include', headers }),
                    fetch('/api/samples', { method: 'GET', credentials: 'include', headers })
                ]);

                if (eventsResponse.ok && samplesResponse.ok) {
                    const events = await eventsResponse.json();
                    const samples = await samplesResponse.json();
                    
                    setLeaderboardEvents(events.map((e: any) => ({ ...e, id: String(e.id), sampleIds: (e.sampleIds || []).map((id: any) => String(id)) })));
                    setLeaderboardSamples((samples || []).map((s: any) => ({ ...s, id: String(s.id) })));
                }
            } catch (error) {
                console.error('Error fetching leaderboard data:', error);
            }
        };
        fetchLeaderboardData();
    }, []);

    // Samples come from the server as `sampleObjects` on each event. Do not use appData.samples.
    const samplesForEvent = useMemo(() => {
        if (!selectedEvent) return [];
        const objs = (selectedEvent as any).sampleObjects || (selectedEvent as any).samples || [];
        return objs.map((s: any) => ({ ...s, id: String(s.id) })) as CoffeeSample[];
    }, [selectedEvent]);

    const getOrCreateScoreSheet = useCallback((sampleId: string): ScoreSheet => {
        const eventIdStr = String(selectedEvent!.id);
        const existing = appData.scores.find(s => s.sampleId === sampleId && s.qGraderId === currentUser.id && s.eventId === eventIdStr);
        if (existing) return existing;
        return {
            id: `new-${sampleId}-${currentUser.id}-${eventIdStr}`, eventId: eventIdStr, qGraderId: currentUser.id, sampleId, isSubmitted: false, notes: '', descriptors: [],
            scores: { fragrance: 6, flavor: 6, aftertaste: 6, acidity: 6, body: 6, balance: 6, uniformity: 10, cleanCup: 10, sweetness: 10, overall: 6, taints: 0, faults: 0, finalScore: 76 },
        };
    }, [appData.scores, currentUser.id, selectedEvent]);

    const getSampleStatus = useCallback((scoreSheet: ScoreSheet, event: CuppingEvent): SampleStatus => {
        if (event.isResultsRevealed) {
            return 'Finalized';
        }
        if (scoreSheet.isSubmitted) {
            return 'Submitted';
        }
        return 'Not Started';
    }, []);

    const statusConfig: Record<SampleStatus, { icon: React.ReactNode; text: string; className: string; borderColor: string; }> = {
        'Not Started': { icon: <Coffee className="text-gray-400" />, text: 'Not Started', className: 'text-text-light', borderColor: 'border-border' },
        'Submitted': { icon: <CheckCircle className="text-green-600" />, text: 'Submitted', className: 'text-green-700', borderColor: 'border-green-500' },
        'Finalized': { icon: <Lock className="text-blue-600" />, text: 'Finalized', className: 'text-blue-700', borderColor: 'border-blue-500' }
    };

    const handleAIAnalysis = async () => {
        if (!selectedSample || !selectedEvent) return;
        
        try {
            setAiLoading(true);
            const scoreSheet = getOrCreateScoreSheet(String(selectedSample.id));
            
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
                    qGraderScores: scoreSheet.scores,
                    headJudgeNotes: scoreSheet.notes,
                    analysisType: 'qgrader',
                }),
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('AI Analysis data received:', data);
                setAiAnalysis(data.analysis);
                console.log('Setting isAIModalOpen to true');
                setIsAIModalOpen(true);
            } else {
                alert('Error analyzing sample. Make sure CLAUDE_API_KEY is set.');
            }
        } catch (error) {
            console.error('AI Analysis error:', error);
            alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setAiLoading(false);
        }
    };

    if (selectedSample && selectedEvent) {
        return <CuppingForm scoreSheet={getOrCreateScoreSheet(selectedSample.id)} sample={selectedSample} onSave={onUpdateScoreSheet} onBack={() => setSelectedSample(null)} onAIAnalyze={handleAIAnalysis} isAILoading={aiLoading} isAIModalOpen={isAIModalOpen} aiAnalysis={aiAnalysis} onCloseAIModal={() => setIsAIModalOpen(false)} />
    }

    if (selectedEvent) {
        return (
            <div>
                <Button onClick={() => setSelectedEvent(null)} className="mb-4 flex items-center space-x-1" variant="secondary"> <ChevronLeft size={16}/> <span>Back to Events</span></Button>
                <Card title={`Sample Tray: ${selectedEvent.name}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {samplesForEvent.map(sample => {
                             const scoreSheet = getOrCreateScoreSheet(sample.id);
                             const status = getSampleStatus(scoreSheet, selectedEvent);
                             const config = statusConfig[status];
                             const isInteractive = status !== 'Finalized';

                            return (
                                <div key={sample.id} className="flex flex-col">
                                    <div 
                                        onClick={() => isInteractive && setSelectedSample(sample)} 
                                        className={`relative p-4 border-2 ${config.borderColor} rounded-lg ${isInteractive ? 'cursor-pointer hover:bg-background' : 'cursor-not-allowed opacity-75 bg-gray-50'} transition-colors duration-200 aspect-square flex flex-col justify-center items-center text-center`}
                                    >
                                        <div className="absolute top-2 right-2">{config.icon}</div>
                                        <p className="font-mono text-2xl md:text-3xl font-bold">{sample.blindCode}</p>
                                        <p className={`text-sm font-semibold ${config.className}`}>
                                            {(status === 'Submitted' || status === 'Finalized') ? `Score: ${scoreSheet.scores.finalScore.toFixed(2)}` : config.text}
                                        </p>
                                    </div>
                                </div>
                             )

                        })}
                    </div>
                </Card>
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
                                setActiveTab('cupping');
                                setSelectedEvent(null);
                                setSelectedSample(null);
                            }}
                            className={`w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                              activeTab === 'cupping' 
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Coffee size={18} />
                            <span>Cupping Events</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                              activeTab === 'leaderboard' 
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <BarChart2 size={18} />
                            <span>Leaderboard</span>
                        </button>
                    </nav>

                    {/* Q Grader Profile Section at Bottom */}
                    <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
                        {/* Profile Card */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 w-full">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                                {currentUser?.name?.[0]?.toUpperCase() || 'Q'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-gray-600">Q Grader</span>
                                <span className="text-xs font-bold text-gray-800 truncate">{currentUser?.name || 'Q Grader'}</span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={onLogout}
                            className="w-full bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-white to-blue-50/30">
                    <div className="p-6">
                        {activeTab === 'cupping' && (
                            <>
                        {/* Cupping Events List */}
                        {!selectedEvent && !selectedSample && (
                            <Card className="transition-smooth">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-extrabold text-primary">Cupping Events</h3>
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
                                                                    className="bg-primary text-white hover:bg-primary-dark"
                                                                    size="sm"
                                                                >
                                                                    Start Cupping
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-gray-600">
                                                        You have no cupping events assigned at this time.
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
                                            <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-gray-900">{event.name}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">Date: {new Date(event.date).toISOString().split('T')[0]}</p>
                                                        <p className="text-sm text-gray-600">Samples: {event.sampleIds.length}</p>
                                                    </div>
                                                    {event.isResultsRevealed ? (
                                                        <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                                            Completed
                                                        </div>
                                                    ) : (
                                                        <Button 
                                                            onClick={() => setSelectedEvent(event)} 
                                                            className="bg-primary text-white hover:bg-primary-dark"
                                                            size="sm"
                                                        >
                                                            Start Cupping
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center p-8">
                                            <p className="text-gray-600">You have no cupping events assigned at this time.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Sample Tray View */}
                        {selectedEvent && !selectedSample && (
                            <div>
                                <Button 
                                    onClick={() => setSelectedEvent(null)} 
                                    className="mb-6 flex items-center space-x-1" 
                                    variant="secondary"
                                >
                                    <ChevronLeft size={16} />
                                    <span>Back to Events</span>
                                </Button>
                                <Card title={`Sample Tray: ${selectedEvent.name}`}>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {samplesForEvent.map(sample => {
                                            const scoreSheet = getOrCreateScoreSheet(sample.id);
                                            const status = getSampleStatus(scoreSheet, selectedEvent);
                                            const config = statusConfig[status];
                                            const isInteractive = status !== 'Finalized';

                                            return (
                                                <div key={sample.id} className="flex flex-col">
                                                    <div 
                                                        onClick={() => isInteractive && setSelectedSample(sample)} 
                                                        className={`relative p-4 border-2 ${config.borderColor} rounded-lg ${isInteractive ? 'cursor-pointer hover:bg-background' : 'cursor-not-allowed opacity-75 bg-gray-50'} transition-colors duration-200 aspect-square flex flex-col justify-center items-center text-center`}
                                                    >
                                                        <div className="absolute top-2 right-2">{config.icon}</div>
                                                        <p className="font-mono text-2xl md:text-3xl font-bold">{sample.blindCode}</p>
                                                        <p className={`text-sm font-semibold ${config.className}`}>
                                                            {(status === 'Submitted' || status === 'Finalized') ? `Score: ${scoreSheet.scores.finalScore.toFixed(2)}` : config.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* Cupping Form View */}
                        {selectedSample && selectedEvent && (
                            <CuppingForm 
                                scoreSheet={getOrCreateScoreSheet(selectedSample.id)} 
                                sample={selectedSample} 
                                onSave={onUpdateScoreSheet} 
                                onBack={() => setSelectedSample(null)} 
                                onAIAnalyze={handleAIAnalysis} 
                                isAILoading={aiLoading} 
                                isAIModalOpen={isAIModalOpen} 
                                aiAnalysis={aiAnalysis} 
                                onCloseAIModal={() => setIsAIModalOpen(false)} 
                            />
                        )}
                            </>
                        )}
                        {activeTab === 'leaderboard' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-primary">Leaderboard</h3>
                                {console.log('QGrader Leaderboard Debug:', { eventsCount: leaderboardEvents.length, revealedCount: leaderboardEvents.filter(e => e.isResultsRevealed).length, revealedWithSamples: leaderboardEvents.filter(e => e.isResultsRevealed && (e.sampleIds?.length ?? 0) > 0).length, events: leaderboardEvents.map(e => ({ name: e.name, revealed: e.isResultsRevealed, sampleCount: e.sampleIds?.length ?? 0 })) })}
                                {leaderboardEvents.length > 0 && leaderboardEvents.some(e => e.isResultsRevealed && (e.sampleIds?.length ?? 0) > 0) ? (
                                    leaderboardEvents
                                      .filter(e => e.isResultsRevealed && (e.sampleIds?.length ?? 0) > 0)
                                      .map(event => {
                                        const eventSampleIds = event.sampleIds?.map(id => String(id)) || [];
                                        const eventSamples = leaderboardSamples.filter(s => eventSampleIds.includes(String(s.id)) && s.sampleType !== 'CALIBRATION');
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
                                        <div className="text-center py-12">
                                            <p className="text-lg text-gray-400 font-semibold">No leaderboard data available</p>
                                            <p className="text-sm text-gray-500 mt-2">Check back once competition results are revealed.</p>
                                            {leaderboardEvents.length > 0 && (
                                                <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-left max-w-md mx-auto">
                                                    <p className="font-semibold mb-1">📊 Available events ({leaderboardEvents.length}):</p>
                                                    <ul className="space-y-1">
                                                        {leaderboardEvents.map(e => (
                                                            <li key={e.id} className="text-gray-600">
                                                                • {e.name}: {e.isResultsRevealed ? '✓ Revealed' : '⏳ In Progress'} ({e.sampleIds?.length ?? 0} samples)
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
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

export default QGraderDashboard;
