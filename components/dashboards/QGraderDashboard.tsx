import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { User, CuppingEvent, CoffeeSample, ScoreSheet, CuppingScore, Descriptor } from '../../types';
import { AppData } from '../../data';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Modal } from '../ui/Modal';
import { CheckCircle, FileClock, Minus, Plus, Save, Coffee, ChevronLeft, X, Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// FIX: Add type definitions for SpeechRecognition API to the global window object to resolve TypeScript errors.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
        <div className="pb-24">
            <Card>
                <div className="p-4 bg-background border-b border-border -m-6 mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text-dark">Scoring Sample: <span className={`font-mono ${sample.sampleType === 'CALIBRATION' ? 'text-purple-600' : 'text-primary'}`}>{sample.blindCode}</span></h3>
                    {onAIAnalyze && (
                        <Button 
                            size="sm"
                            onClick={onAIAnalyze} 
                            disabled={isAILoading}
                            className="flex items-center space-x-1"
                        >
                            <Sparkles size={16} />
                            <span>AI Analyze</span>
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Scores Column */}
                    <div className="space-y-4">
                        {scoreFields.map(({ key, label }) => (
                            <div key={key}>
                                <div className="flex justify-between items-center mb-1"><label className="text-sm font-medium text-gray-700">{label}</label><span className="font-semibold text-primary tabular-nums">{scores[key].toFixed(2)}</span></div>
                                <input type="range" min="0" max="10" step="0.25" value={scores[key]} onChange={(e) => handleScoreChange(key, parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" disabled={scoreSheet.isSubmitted} />
                            </div>
                        ))}
                    </div>

                    {/* Notes and Defects Column */}
                    <div className="space-y-6">
                        <div>
                            <Label>Smart Notes</Label>
                            <div className="space-y-3 p-3 border border-border rounded-lg">
                                    <div className="flex items-center space-x-2">
                                    <Button size="sm" onClick={() => !scoreSheet.isSubmitted && setIsFlavorModalOpen(true)} disabled={scoreSheet.isSubmitted}>+ Add Descriptors</Button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {descriptors.length > 0 ? descriptors.map(d => <DescriptorItem key={d.name} descriptor={d} onIntensityChange={handleDescriptorIntensityChange} onRemove={handleRemoveDescriptor} disabled={scoreSheet.isSubmitted} />) : <p className="text-sm text-center text-gray-400 py-4">No descriptors added.</p>}
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="final-comments">Final Comments</Label>
                            <textarea id="final-comments" value={notes} onChange={handleNotesChange} rows={3} className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary text-sm" placeholder="e.g., vibrant, floral, tea-like body..." disabled={scoreSheet.isSubmitted}></textarea>
                            <div className="flex items-center space-x-2 mt-2">
                                {quickNotes.map(qn => <Button key={qn} size="sm" variant="secondary" onClick={() => { setNotes(p => `${p} ${qn}.`.trim()); handleDataChange(); }}>{qn}</Button>)}
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-border">
                            <h4 className="text-base font-medium text-gray-800">Defects</h4>
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
                <div className="fixed bottom-0 left-0 right-0 bg-surface p-3 border-t border-border shadow-md z-10">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Button onClick={onBack} variant="secondary" className="flex items-center space-x-1"><ChevronLeft size={16} /> <span>Back</span></Button>
                    <div className="text-center"><p className="text-sm text-text-light">Final Score</p><p className="text-2xl font-bold text-text-dark tabular-nums">{calculateFinalScore().toFixed(2)}</p></div>
                    <div className="flex items-center space-x-2 w-40 justify-end">
                        <div className="flex items-center space-x-2 text-sm text-text-light">{saveStatus === 'saving' && <><Save size={16} className="animate-spin" /><span>Saving...</span></>}{saveStatus === 'saved' && <><CheckCircle size={16} className="text-green-600"/><span>Saved</span></>}</div>
                        {!scoreSheet.isSubmitted ? (
                            <Button onClick={() => handleSubmit(true)} className={saveStatus === 'saving' ? 'opacity-50 cursor-not-allowed' : ''} disabled={saveStatus === 'saving'}>Submit Final</Button>
                        ) : (
                            <div className="text-sm font-semibold text-gray-600">Submitted</div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* AI Analysis Modal */}
            {isAIModalOpen && (
                <Modal isOpen={isAIModalOpen} onClose={onCloseAIModal} title="🤖 AI Sample Analysis" size="xl">
                    <div className="space-y-4">
                        {isAILoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin">
                                    <Sparkles size={32} className="text-primary" />
                                </div>
                                <span className="ml-3 text-primary font-semibold">Analyzing sample...</span>
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 whitespace-pre-wrap text-sm text-gray-700">
                                    {aiAnalysis}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end space-x-2 border-t border-border pt-4">
                        <Button variant="secondary" onClick={onCloseAIModal}>Close</Button>
                    </div>
                </Modal>
            )}
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
        <div className="min-h-screen w-full bg-background p-4 flex flex-col space-y-6">
            <header className="w-full bg-white shadow p-4 mb-6">
                <h2 className="text-3xl font-bold text-left">Q Grader Dashboard</h2>
            </header>
            <div className="flex flex-col items-start space-y-4 w-full">
                {assignedEvents.length > 0 ? (
                    assignedEvents.map(event => (
                        <Card key={event.id} title={event.name} className="w-3/4">
                            <p className="text-text-light">Date: {event.date}</p>
                            <p className="text-text-light">Samples to cup: {event.sampleIds.length}</p>
                            {event.isResultsRevealed ? (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 font-semibold text-center">
                                    Event ended
                                </div>
                            ) : (
                                <Button onClick={() => setSelectedEvent(event)} className="mt-4">Start Cupping</Button>
                            )}
                        </Card>
                    ))
                ) : (
                    <Card className="w-3/4">
                        <p className="text-center text-text-light">You have no cupping events assigned to you at the moment.</p>
                    </Card>
                )}
            </div>
            
            {/* AI Analysis Modal */}
            <Modal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} title="🤖 AI Sample Analysis" size="xl">
                <div className="space-y-4">
                    {aiLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin">
                                <Sparkles size={32} className="text-primary" />
                            </div>
                            <span className="ml-3 text-primary font-semibold">Analyzing sample...</span>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 whitespace-pre-wrap text-sm text-gray-700">
                                {aiAnalysis}
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end space-x-2 border-t border-border pt-4">
                    <Button variant="secondary" onClick={() => setIsAIModalOpen(false)}>Close</Button>
                </div>
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
                <Button onClick={() => navigate('/leaderboard?redirect=/qgrader-dashboard')} className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-dark">
                    View Leaderboard Results
                </Button>
            </div>
        </div>
    );
};

export default QGraderDashboard;
