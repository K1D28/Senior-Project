import { BACKEND_URL } from '../../utils/api';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { User, CuppingEvent, CoffeeSample, ScoreSheet, CuppingScore, Descriptor } from '../../types';
import { AppData } from '../../data';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Modal } from '../ui/Modal';
import { CheckCircle, FileClock, Minus, Plus, Save, Coffee, ChevronLeft, X, Lock, Trophy, LogOut, Sparkles, BarChart2, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

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

const BULK_SCORE_FIELDS: { key: keyof Omit<CuppingScore, 'taints' | 'faults' | 'finalScore'>; label: string }[] = [
    { key: 'fragrance', label: 'Fragrance/Aroma' },
    { key: 'flavor', label: 'Flavor' },
    { key: 'aftertaste', label: 'Aftertaste' },
    { key: 'acidity', label: 'Acidity' },
    { key: 'body', label: 'Body' },
    { key: 'balance', label: 'Balance' },
    { key: 'uniformity', label: 'Uniformity' },
    { key: 'cleanCup', label: 'Clean Cup' },
    { key: 'sweetness', label: 'Sweetness' },
    { key: 'overall', label: 'Overall' },
];

type BulkImportFieldKey = keyof Omit<CuppingScore, 'taints' | 'faults' | 'finalScore'>;

interface BulkImportPreviewRow {
    rowNumber: number;
    sampleReference: string;
    matchedSampleId: string | null;
    matchedBlindCode: string | null;
    values: Record<BulkImportFieldKey, number>;
    notes: string;
    validationErrors: string[];
    importStatus: 'pending' | 'success' | 'error';
    importMessage?: string;
}

const normalizeCsvHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const parseCsvText = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        const nextCharacter = text[index + 1];

        if (character === '"') {
            if (insideQuotes && nextCharacter === '"') {
                currentCell += '"';
                index += 1;
            } else {
                insideQuotes = !insideQuotes;
            }
            continue;
        }

        if (character === ',' && !insideQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
            continue;
        }

        if ((character === '\n' || character === '\r') && !insideQuotes) {
            if (character === '\r' && nextCharacter === '\n') {
                index += 1;
            }
            currentRow.push(currentCell.trim());
            if (currentRow.some(cell => cell.trim() !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
            continue;
        }

        currentCell += character;
    }

    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell.trim() !== '')) {
        rows.push(currentRow);
    }

    return rows;
};

const buildCsvHeaderMap = (headers: string[]) => {
    const headerMap = new Map<string, number>();
    headers.forEach((header, index) => {
        headerMap.set(normalizeCsvHeader(header), index);
    });
    return headerMap;
};

const getCsvCell = (row: string[], headerMap: Map<string, number>, candidates: string[]) => {
    for (const candidate of candidates) {
        const index = headerMap.get(normalizeCsvHeader(candidate));
        if (index !== undefined) {
            return row[index]?.trim() ?? '';
        }
    }
    return '';
};

const scoreFieldCandidates: Record<BulkImportFieldKey, string[]> = {
    fragrance: ['Fragrance', 'Frangrance', 'Fragrance/Aroma', 'Fragrance Aroma'],
    flavor: ['Flavor'],
    aftertaste: ['Aftertaste'],
    acidity: ['Acidity'],
    body: ['Body'],
    balance: ['Balance'],
    uniformity: ['Uniformity'],
    cleanCup: ['Clean Cup', 'CleanCup'],
    sweetness: ['Sweetness'],
    overall: ['Overall'],
};

const sampleReferenceCandidates = ['Sample ID', 'SampleId', 'sample_id', 'sample'];
const notesCandidates = ['Notes', 'Note', 'Comments', 'Comment', 'Tasting Notes', 'TastingNotes'];

const resolveSampleMatch = (reference: string, samples: CoffeeSample[]) => {
    const normalizedReference = reference.trim();
    return samples.find(sample => {
        const sampleId = String(sample.id).trim();
        const blindCode = String(sample.blindCode || '').trim();
        return sampleId === normalizedReference || blindCode === normalizedReference || blindCode.toLowerCase() === normalizedReference.toLowerCase();
    }) || null;
};

const calculateFinalScoreFromValues = (values: Record<BulkImportFieldKey, number>) =>
    BULK_SCORE_FIELDS.reduce((total, field) => total + Number(values[field.key] ?? 0), 0);

const parseBulkScoreCsv = (text: string, samples: CoffeeSample[]) => {
    const rows = parseCsvText(text);
    if (rows.length === 0) {
        return { rows: [] as BulkImportPreviewRow[], errors: ['The CSV file is empty.'] };
    }

    const [headerRow, ...dataRows] = rows;
    const headerMap = buildCsvHeaderMap(headerRow);
    const parsedRows: BulkImportPreviewRow[] = [];
    const encounteredSamples = new Set<string>();

    dataRows.forEach((row, index) => {
        const rowNumber = index + 1;
        const sampleReference = getCsvCell(row, headerMap, sampleReferenceCandidates);
        const notes = getCsvCell(row, headerMap, notesCandidates);
        const validationErrors: string[] = [];

        if (!sampleReference) {
            validationErrors.push('Missing Sample ID.');
        }

        const matchedSample = sampleReference ? resolveSampleMatch(sampleReference, samples) : null;
        if (!matchedSample) {
            validationErrors.push(`Sample "${sampleReference || 'unknown'}" was not found in the selected event.`);
        }

        const values = {} as Record<BulkImportFieldKey, number>;
        BULK_SCORE_FIELDS.forEach(field => {
            const rawValue = getCsvCell(row, headerMap, scoreFieldCandidates[field.key]);
            if (rawValue === '') {
                validationErrors.push(`Missing ${field.label}.`);
                values[field.key] = Number.NaN;
                return;
            }

            const parsedValue = Number(rawValue);
            if (Number.isNaN(parsedValue)) {
                validationErrors.push(`${field.label} must be a number.`);
                values[field.key] = Number.NaN;
                return;
            }
            if (parsedValue < 0 || parsedValue > 10) {
                validationErrors.push(`${field.label} must be between 0 and 10.`);
            }
            values[field.key] = parsedValue;
        });

        const normalizedSampleKey = matchedSample ? String(matchedSample.id) : sampleReference.toLowerCase();
        if (normalizedSampleKey && encounteredSamples.has(normalizedSampleKey)) {
            validationErrors.push(`Duplicate sample entry for "${sampleReference}" in the CSV.`);
        } else if (normalizedSampleKey) {
            encounteredSamples.add(normalizedSampleKey);
        }

        parsedRows.push({
            rowNumber,
            sampleReference,
            matchedSampleId: matchedSample ? String(matchedSample.id) : null,
            matchedBlindCode: matchedSample?.blindCode ? String(matchedSample.blindCode) : null,
            values,
            notes,
            validationErrors,
            importStatus: 'pending',
        });
    });

    return { rows: parsedRows, errors: [] as string[] };
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
interface CuppingFormProps { scoreSheet: ScoreSheet; sample: CoffeeSample; onSave: (updatedSheet: ScoreSheet) => void; onBack: () => void; onAIAnalyze?: () => void; isAILoading?: boolean; isAIModalOpen?: boolean; aiAnalysis?: string; onCloseAIModal?: () => void; onRequestReevaluation?: (sample: CoffeeSample, sheet: ScoreSheet) => void; isReevaluationRequested?: boolean; isReevaluationLoading?: boolean; }

const CuppingForm: React.FC<CuppingFormProps> = ({ scoreSheet, sample, onSave, onBack, onAIAnalyze, isAILoading, isAIModalOpen, aiAnalysis, onCloseAIModal, onRequestReevaluation, isReevaluationRequested, isReevaluationLoading }) => {
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
                                <div className="flex justify-between items-center mb-0.5"><label className="text-xs font-medium text-gray-700">{label}</label></div>
                                <div className="flex items-center gap-2">
                                    <input type="range" min="0" max="10" step="0.01" value={scores[key]} onChange={(e) => handleScoreChange(key, parseFloat(e.target.value))} className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" disabled={scoreSheet.isSubmitted} />
                                    <input type="number" min="0" max="10" step="0.01" value={scores[key]} onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '') {
                                        handleScoreChange(key, 0);
                                      } else {
                                        const numVal = parseFloat(val);
                                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 10) handleScoreChange(key, numVal);
                                      }
                                    }} className="w-16 px-2 py-1 text-xs border border-border rounded text-right font-semibold text-primary focus:ring-primary focus:border-primary" disabled={scoreSheet.isSubmitted} />
                                </div>
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
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-text-light">
                            {saveStatus === 'saving' && <><Save size={12} className="animate-spin" /><span className="text-xs">Saving...</span></>}
                            {saveStatus === 'saved' && <><CheckCircle size={12} className="text-green-600"/><span className="text-xs">Saved</span></>}
                        </div>
                        {scoreSheet.isSubmitted && (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="text-xs py-1"
                                disabled={isReevaluationRequested || isReevaluationLoading}
                                onClick={() => onRequestReevaluation?.(sample, scoreSheet)}
                            >
                                {isReevaluationRequested ? 'Re-eval Requested' : isReevaluationLoading ? 'Requesting...' : 'Request Re-eval'}
                            </Button>
                        )}
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
interface QGraderDashboardProps { currentUser: User; appData: AppData; onUpdateScoreSheet: (sheet: ScoreSheet) => void; isScoresLoading: boolean; onLogout: () => void; }

const QGraderDashboard: React.FC<QGraderDashboardProps> = ({ currentUser, appData, onUpdateScoreSheet, isScoresLoading, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Map URL paths to tab names
    const pathToTab: { [key: string]: 'cupping' | 'leaderboard' | 'bulk-import' } = {
        '/qgrader-dashboard': 'cupping',
        '/qgrader-dashboard/cuppingevents': 'cupping',
        '/qgrader-dashboard/leaderboard': 'leaderboard',
        '/qgrader-dashboard/bulk-import': 'bulk-import',
    };
    
    // Map tab names to URL paths
    const tabToPath: { [key in 'cupping' | 'leaderboard' | 'bulk-import']: string } = {
        cupping: '/qgrader-dashboard/cuppingevents',
        leaderboard: '/qgrader-dashboard/leaderboard',
        'bulk-import': '/qgrader-dashboard/bulk-import',
    };
    
    // Initialize activeTab from URL or default to 'cupping'
    const [activeTab, setActiveTabState] = useState<'cupping' | 'leaderboard' | 'bulk-import'>(() => {
        return pathToTab[location.pathname] || 'cupping';
    });

    const [reevalRequestedBySample, setReevalRequestedBySample] = useState<Record<string, boolean>>({});
    const [reevalLoadingSampleId, setReevalLoadingSampleId] = useState<string | null>(null);
    
    // Function for when user clicks a tab button - updates state AND navigates URL
    const handleTabClick = (tab: 'cupping' | 'leaderboard' | 'bulk-import') => {
        setActiveTabState(tab);
        navigate(tabToPath[tab]);
    };

    const handleRequestReevaluation = useCallback(async (sample: CoffeeSample, sheet: ScoreSheet) => {
        const sampleKey = String(sample.id);
        if (reevalRequestedBySample[sampleKey]) return;

        const reason = window.prompt('Reason for re-evaluation (optional):', '');
        if (reason === null) return;

        setReevalLoadingSampleId(sampleKey);
        try {
            const resp = await fetch(`${BACKEND_URL}/api/qgrader/reevaluation-requests`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ sampleId: parseInt(sampleKey), cuppingEventId: parseInt(sheet.eventId), reason }),
            });

            if (!resp.ok) {
                const text = await resp.text();
                alert(`Request failed: ${text}`);
                return;
            }

            setReevalRequestedBySample(prev => ({ ...prev, [sampleKey]: true }));
            alert('Re-evaluation request sent to the Head Judge.');
        } catch (err) {
            alert(`Request failed: ${String(err)}`);
        } finally {
            setReevalLoadingSampleId(null);
        }
    }, [reevalRequestedBySample]);
    
    // Watch for URL changes (browser back/forward) and update activeTab accordingly
    useEffect(() => {
        const tabFromUrl = pathToTab[location.pathname];
        if (tabFromUrl) {
            setActiveTabState(tabFromUrl);
        }
    }, [location.pathname]);

    const [selectedEvent, setSelectedEvent] = useState<CuppingEvent | null>(null);
    const [selectedSample, setSelectedSample] = useState<CoffeeSample | null>(null);
    const [assignedEvents, setAssignedEvents] = useState<CuppingEvent[]>([]);
    const [isEventsLoading, setIsEventsLoading] = useState(true);
    const [bulkImportEventId, setBulkImportEventId] = useState('');
    const [bulkImportFileName, setBulkImportFileName] = useState('');
    const [bulkImportRows, setBulkImportRows] = useState<BulkImportPreviewRow[]>([]);
    const [bulkImportErrors, setBulkImportErrors] = useState<string[]>([]);
    const [bulkImportStatus, setBulkImportStatus] = useState<{ processing: boolean; completed: boolean; successCount: number; errorCount: number }>({ processing: false, completed: false, successCount: 0, errorCount: 0 });
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [aiLoading, setAiLoading] = useState(false);
    const [leaderboardEvents, setLeaderboardEvents] = useState<CuppingEvent[]>([]);
    const [leaderboardSamples, setLeaderboardSamples] = useState<CoffeeSample[]>([]);

    // Clear AI analysis when switching samples to keep analysis isolated per sample
    useEffect(() => {
        setAiAnalysis('');
    }, [selectedSample?.id, selectedSample?.blindCode]);

    const bulkImportEvent = useMemo(() => assignedEvents.find(event => String(event.id) === bulkImportEventId) || null, [assignedEvents, bulkImportEventId]);
    const bulkImportSamples = useMemo(() => {
        if (!bulkImportEvent) return [];
        const sampleObjects = (bulkImportEvent as any).sampleObjects || (bulkImportEvent as any).samples || [];
        if (sampleObjects.length > 0) {
            return sampleObjects.map((sample: any) => ({ ...sample, id: String(sample.id) })) as CoffeeSample[];
        }
        return appData.samples.filter(sample => bulkImportEvent.sampleIds.map(id => String(id)).includes(String(sample.id)));
    }, [appData.samples, bulkImportEvent]);

    useEffect(() => {
        if (activeTab !== 'bulk-import') return;
        setSelectedEvent(null);
        setSelectedSample(null);
    }, [activeTab]);

    useEffect(() => {
        setBulkImportRows([]);
        setBulkImportErrors([]);
        setBulkImportFileName('');
        setBulkImportStatus({ processing: false, completed: false, successCount: 0, errorCount: 0 });
    }, [bulkImportEventId]);

    // Handle URL parameters to restore selected event and sample
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const pathParts = location.pathname.split('/');
        
        // Extract eventName and blindCode from URL path
        // Path format: /qgrader-dashboard/cuppingevents/:eventName or :eventName/:blindCode
        const cuppingeventsIndex = pathParts.indexOf('cuppingevents');
        if (cuppingeventsIndex !== -1 && cuppingeventsIndex + 1 < pathParts.length) {
            const eventName = decodeURIComponent(pathParts[cuppingeventsIndex + 1]);
            const blindCode = pathParts.length > cuppingeventsIndex + 2 ? decodeURIComponent(pathParts[cuppingeventsIndex + 2]) : null;
            
            // Find and select the event
            if (assignedEvents.length > 0) {
                const matchingEvent = assignedEvents.find(e => e.name === eventName);
                if (matchingEvent && matchingEvent !== selectedEvent) {
                    setSelectedEvent(matchingEvent);
                }
                
                // If blindCode is in URL, find and select that sample
                if (blindCode && matchingEvent && selectedEvent?.id === matchingEvent.id) {
                    const samples = appData.samples.filter((s: CoffeeSample) => matchingEvent.sampleIds.includes(s.id));
                    const matchingSample = samples.find((s: CoffeeSample) => s.blindCode === blindCode);
                    if (matchingSample && matchingSample !== selectedSample) {
                        setSelectedSample(matchingSample);
                    }
                }
            }
        }
    }, [location.pathname, assignedEvents]);

    useEffect(() => {
        const fetchAssignedEvents = async () => {
            try {
                setIsEventsLoading(true);
                const response = await fetch(`${BACKEND_URL}/api/cupping-events/qgrader`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
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
            } finally {
                setIsEventsLoading(false);
            }
        };
        fetchAssignedEvents();
    }, []);

    // Fetch all events and samples for leaderboard display
    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
                
                const [eventsResponse, samplesResponse] = await Promise.all([
                    fetch(`${BACKEND_URL}/api/cupping-events`, { method: 'GET', credentials: 'include', headers }),
                    fetch(`${BACKEND_URL}/api/samples`, { method: 'GET', credentials: 'include', headers })
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

    const handleBulkImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!bulkImportEvent) {
            alert('Please select an event before uploading a CSV file.');
            event.target.value = '';
            return;
        }

        try {
            const text = await file.text();
            const { rows, errors } = parseBulkScoreCsv(text, bulkImportSamples);
            setBulkImportFileName(file.name);
            setBulkImportRows(rows);
            setBulkImportErrors(errors);
            setBulkImportStatus({ processing: false, completed: false, successCount: 0, errorCount: rows.filter(row => row.validationErrors.length > 0).length });
        } catch (error) {
            console.error('Failed to parse CSV:', error);
            setBulkImportRows([]);
            setBulkImportErrors([`Could not read ${file.name}.`]);
            setBulkImportFileName(file.name);
        } finally {
            event.target.value = '';
        }
    }, [bulkImportEvent, bulkImportSamples]);

    const handleBulkImportSubmit = useCallback(async () => {
        if (!bulkImportEvent) {
            alert('Select an event first.');
            return;
        }

        const eligibleRows = bulkImportRows.filter(row => row.validationErrors.length === 0 && row.matchedSampleId);
        if (eligibleRows.length === 0) {
            alert('Upload a valid CSV with at least one matching sample before importing.');
            return;
        }

        setBulkImportStatus({ processing: true, completed: false, successCount: 0, errorCount: bulkImportRows.length - eligibleRows.length });

        let successCount = 0;
        let errorCount = bulkImportRows.length - eligibleRows.length;
        const nextRows: BulkImportPreviewRow[] = [];

        for (const row of bulkImportRows) {
            if (row.validationErrors.length > 0 || !row.matchedSampleId) {
                nextRows.push({ ...row, importStatus: 'error', importMessage: row.validationErrors[0] || 'Row could not be imported.' });
                continue;
            }

            const updatedSheet: ScoreSheet = {
                id: `bulk-${bulkImportEvent.id}-${row.matchedSampleId}-${currentUser.id}`,
                eventId: String(bulkImportEvent.id),
                qGraderId: currentUser.id,
                sampleId: row.matchedSampleId,
                isSubmitted: true,
                notes: row.notes,
                descriptors: [],
                scores: {
                    ...row.values,
                    taints: 0,
                    faults: 0,
                    finalScore: calculateFinalScoreFromValues(row.values),
                },
            };

            try {
                const saveResult = await Promise.resolve(onUpdateScoreSheet(updatedSheet) as unknown as Promise<{ ok?: boolean; message?: string }> | { ok?: boolean; message?: string } | void);
                const wasSuccessful = typeof saveResult === 'object' && saveResult !== null && 'ok' in saveResult ? Boolean(saveResult.ok) : true;

                if (wasSuccessful) {
                    successCount += 1;
                    nextRows.push({ ...row, importStatus: 'success', importMessage: `Saved for sample ${row.matchedBlindCode || row.matchedSampleId}.` });
                } else {
                    errorCount += 1;
                    nextRows.push({ ...row, importStatus: 'error', importMessage: (saveResult && typeof saveResult === 'object' && 'message' in saveResult && saveResult.message) ? String(saveResult.message) : 'Backend rejected this score.' });
                }
            } catch (error) {
                errorCount += 1;
                nextRows.push({ ...row, importStatus: 'error', importMessage: error instanceof Error ? error.message : 'Failed to save score.' });
            }
        }

        setBulkImportRows(nextRows);
        setBulkImportStatus({ processing: false, completed: true, successCount, errorCount });
    }, [bulkImportEvent, bulkImportRows, currentUser.id, onUpdateScoreSheet]);

    // Samples come from the server as `sampleObjects` on each event. Do not use appData.samples.
    const samplesForEvent = useMemo(() => {
        if (!selectedEvent) return [];
        const objs = (selectedEvent as any).sampleObjects || (selectedEvent as any).samples || [];
        return objs.map((s: any) => ({ ...s, id: String(s.id) })) as CoffeeSample[];
    }, [selectedEvent]);

    const findExistingScoreSheet = useCallback((sampleId: string) => {
        if (!selectedEvent) return undefined;
        const eventIdStr = String(selectedEvent.id);
        return appData.scores.find(s => s.sampleId === sampleId && s.qGraderId === currentUser.id && s.eventId === eventIdStr);
    }, [appData.scores, currentUser.id, selectedEvent]);

    const getOrCreateScoreSheet = useCallback((sampleId: string): ScoreSheet => {
        const eventIdStr = String(selectedEvent!.id);
        const existing = findExistingScoreSheet(sampleId);
        if (existing) return existing;
        return {
            id: `new-${sampleId}-${currentUser.id}-${eventIdStr}`, eventId: eventIdStr, qGraderId: currentUser.id, sampleId, isSubmitted: false, notes: '', descriptors: [],
            scores: { fragrance: 6, flavor: 6, aftertaste: 6, acidity: 6, body: 6, balance: 6, uniformity: 10, cleanCup: 10, sweetness: 10, overall: 6, taints: 0, faults: 0, finalScore: 76 },
        };
    }, [currentUser.id, selectedEvent, findExistingScoreSheet]);

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
            
            const response = await fetch(`${BACKEND_URL}/api/analyze-sample`, {
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

    // Render the main layout with split view support - always use split view, don't take over fullscreen
    // (removed the early return for selectedSample to keep split view)
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
                                handleTabClick('cupping');
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
                            onClick={() => handleTabClick('leaderboard')}
                            className={`w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                              activeTab === 'leaderboard' 
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <BarChart2 size={18} />
                            <span>Leaderboard</span>
                        </button>
                        <button
                            onClick={() => handleTabClick('bulk-import')}
                            className={`w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg ${
                              activeTab === 'bulk-import' 
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Upload size={18} />
                            <span>Bulk Score Import</span>
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
                    <div className={`p-6 overflow-y-auto flex-1 ${selectedEvent ? 'flex gap-6' : ''}`}>
                        {activeTab === 'cupping' && (
                            <>
                        {/* Cupping Events List - Show only when no event selected */}
                        {!selectedEvent && (
                            <Card className="transition-smooth">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-extrabold text-primary">Cupping Events</h3>
                                    <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full font-semibold">
                                        {isEventsLoading ? 'Loading events...' : `${assignedEvents.length} event${assignedEvents.length !== 1 ? 's' : ''}`}
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
                                            {isEventsLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-gray-600">
                                                        Loading events...
                                                    </td>
                                                </tr>
                                            ) : assignedEvents.length > 0 ? (
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
                                                                    onClick={() => {
                                                                        setSelectedEvent(event);
                                                                        navigate(`/qgrader-dashboard/cuppingevents/${encodeURIComponent(event.name)}`);
                                                                    }} 
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
                                                            onClick={() => {
                                                                setSelectedEvent(event);
                                                                navigate(`/qgrader-dashboard/cuppingevents/${encodeURIComponent(event.name)}`);
                                                            }} 
                                                            className="bg-primary text-white hover:bg-primary-dark"
                                                            size="sm"
                                                        >
                                                            Start Cupping
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : isEventsLoading ? (
                                        <div className="text-center p-8">
                                            <p className="text-gray-600">Loading events...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center p-8">
                                            <p className="text-gray-600">You have no cupping events assigned at this time.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Sample Tray View - Show only when event selected */}
                        {selectedEvent && !selectedSample && (
                            <div className="flex-1 overflow-y-auto">
                                <Button 
                                    onClick={() => {
                                        setSelectedEvent(null);
                                        navigate('/qgrader-dashboard/cuppingevents');
                                    }} 
                                    className="mb-6 flex items-center space-x-1" 
                                    variant="secondary"
                                >
                                    <ChevronLeft size={16} />
                                    <span>Back to Events</span>
                                </Button>
                                {isScoresLoading && (
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                                        <FileClock size={16} className="animate-pulse" />
                                        <span>Loading scores...</span>
                                    </div>
                                )}
                                <Card title={`Sample Tray: ${selectedEvent.name}`}>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {samplesForEvent.map(sample => {
                                            const scoreSheet = getOrCreateScoreSheet(sample.id);
                                            const existingScore = findExistingScoreSheet(sample.id);
                                            const isSampleScoreLoading = isScoresLoading && !existingScore;
                                            const status = getSampleStatus(scoreSheet, selectedEvent);
                                            const config = statusConfig[status];
                                            const isInteractive = status !== 'Finalized';

                                            return (
                                                <div key={sample.id} className="flex flex-col">
                                                    <div 
                                                        onClick={() => {
                                                            if (isInteractive && selectedEvent) {
                                                                setSelectedSample(sample);
                                                                navigate(`/qgrader-dashboard/cuppingevents/${encodeURIComponent(selectedEvent.name)}/${encodeURIComponent(sample.blindCode || '')}`);
                                                            }
                                                        }}
                                                        className={`relative p-4 border-2 ${config.borderColor} rounded-lg ${isInteractive ? 'cursor-pointer hover:bg-background' : 'cursor-not-allowed opacity-75 bg-gray-50'} transition-colors duration-200 aspect-square flex flex-col justify-center items-center text-center`}
                                                    >
                                                        <div className="absolute top-2 right-2">{isSampleScoreLoading ? <FileClock className="text-blue-500 animate-pulse" /> : config.icon}</div>
                                                        <p className="font-mono text-2xl md:text-3xl font-bold">{sample.blindCode}</p>
                                                        <p className={`text-sm font-semibold ${config.className}`}>
                                                            {isSampleScoreLoading ? 'Loading score...' : ((status === 'Submitted' || status === 'Finalized') ? `Score: ${scoreSheet.scores.finalScore.toFixed(2)}` : config.text)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* Cupping Form View - Modal overlay when scoring */}
                        {selectedSample && selectedEvent && (
                            <Modal
                                isOpen={!!selectedSample}
                                size="xl"
                                onClose={() => {
                                    setSelectedSample(null);
                                    navigate(`/qgrader-dashboard/cuppingevents/${encodeURIComponent(selectedEvent.name)}`);
                                }}
                                title="Score Sample"
                            >
                                <div className="max-h-[90vh] overflow-y-auto">
                                    <CuppingForm 
                                        scoreSheet={getOrCreateScoreSheet(selectedSample.id)} 
                                        sample={selectedSample} 
                                        onSave={onUpdateScoreSheet} 
                                        onBack={() => {
                                            setSelectedSample(null);
                                            navigate(`/qgrader-dashboard/cuppingevents/${encodeURIComponent(selectedEvent.name)}`);
                                        }} 
                                        onAIAnalyze={handleAIAnalysis} 
                                        isAILoading={aiLoading} 
                                        isAIModalOpen={isAIModalOpen} 
                                        aiAnalysis={aiAnalysis} 
                                        onCloseAIModal={() => setIsAIModalOpen(false)} 
                                        onRequestReevaluation={handleRequestReevaluation}
                                        isReevaluationRequested={!!reevalRequestedBySample[String(selectedSample.id)]}
                                        isReevaluationLoading={reevalLoadingSampleId === String(selectedSample.id)}
                                    />
                                </div>
                            </Modal>
                        )}
                            </>
                        )}
                        {activeTab === 'leaderboard' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-primary">Leaderboard</h3>
                                {(() => { console.log('QGrader Leaderboard Debug:', { eventsCount: leaderboardEvents.length, revealedCount: leaderboardEvents.filter(e => e.isResultsRevealed).length, revealedWithSamples: leaderboardEvents.filter(e => e.isResultsRevealed && (e.sampleIds?.length ?? 0) > 0).length, events: leaderboardEvents.map(e => ({ name: e.name, revealed: e.isResultsRevealed, sampleCount: e.sampleIds?.length ?? 0 })) }); return null; })()}
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
                        {activeTab === 'bulk-import' && (
                            <div className="space-y-6 max-w-6xl">
                                <Card>
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <h3 className="text-2xl font-bold text-primary">Bulk Score Import</h3>
                                            <p className="text-sm text-gray-600 mt-1">Upload a CSV, match rows by Sample ID or blind code, and submit scores for the selected event.</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                                            <FileSpreadsheet size={14} />
                                            CSV upload
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">1. Select Event</label>
                                            <select
                                                value={bulkImportEventId}
                                                onChange={(e) => setBulkImportEventId(e.target.value)}
                                                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                                            >
                                                <option value="">Choose a cupping event</option>
                                                {assignedEvents.map(event => (
                                                    <option key={event.id} value={event.id}>{event.name}</option>
                                                ))}
                                            </select>
                                            {bulkImportEvent && (
                                                <p className="text-xs text-gray-500">{bulkImportSamples.length} samples found in this event.</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">2. Upload CSV</label>
                                            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm transition-colors ${bulkImportEvent ? 'border-primary/30 bg-primary/5 hover:bg-primary/10' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                                                <Upload size={18} />
                                                <span>{bulkImportFileName || 'Choose a CSV file with score rows'}</span>
                                                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleBulkImportFile} disabled={!bulkImportEvent} />
                                            </label>
                                        </div>
                                    </div>

                                    {bulkImportErrors.length > 0 && (
                                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                            {bulkImportErrors.map(error => <div key={error}>• {error}</div>)}
                                        </div>
                                    )}

                                    {bulkImportSamples.length > 0 && bulkImportEvent && (
                                        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                                            <div className="font-semibold text-gray-700">Accepted sample references for this event</div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {bulkImportSamples.slice(0, 12).map(sample => (
                                                    <span key={sample.id} className="rounded-full bg-white px-2 py-1 border border-gray-200">
                                                        {sample.blindCode || sample.id}
                                                    </span>
                                                ))}
                                                {bulkImportSamples.length > 12 && <span className="rounded-full bg-white px-2 py-1 border border-gray-200">+{bulkImportSamples.length - 12} more</span>}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 flex items-center gap-3">
                                        <Button onClick={handleBulkImportSubmit} disabled={!bulkImportEvent || bulkImportRows.length === 0 || bulkImportStatus.processing}>
                                            {bulkImportStatus.processing ? 'Importing...' : 'Import Scores'}
                                        </Button>
                                        <div className="text-sm text-gray-600">
                                            {bulkImportStatus.completed ? `${bulkImportStatus.successCount} saved, ${bulkImportStatus.errorCount} failed` : 'Rows are validated after upload.'}
                                        </div>
                                    </div>
                                </Card>

                                {bulkImportRows.length > 0 && (
                                    <Card>
                                        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                                            <h4 className="text-lg font-bold text-gray-900">Preview</h4>
                                            <div className="text-sm text-gray-500">{bulkImportRows.length} rows loaded</div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border bg-background">
                                                        <th className="py-2 px-3 text-left font-semibold">Row</th>
                                                        <th className="py-2 px-3 text-left font-semibold">Sample</th>
                                                        {BULK_SCORE_FIELDS.map(field => <th key={field.key} className="py-2 px-3 text-center font-semibold">{field.label}</th>)}
                                                        <th className="py-2 px-3 text-left font-semibold">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bulkImportRows.map(row => (
                                                        <tr key={`${row.rowNumber}-${row.sampleReference}`} className="border-b border-border align-top">
                                                            <td className="py-2 px-3 font-semibold">{row.rowNumber}</td>
                                                            <td className="py-2 px-3">
                                                                <div className="font-medium">{row.sampleReference}</div>
                                                                <div className="text-xs text-gray-500">{row.matchedBlindCode || row.matchedSampleId || 'Unmatched'}</div>
                                                                {row.validationErrors.length > 0 && (
                                                                    <div className="mt-1 text-xs text-red-600 space-y-0.5">
                                                                        {row.validationErrors.map(error => <div key={error}>• {error}</div>)}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            {BULK_SCORE_FIELDS.map(field => (
                                                                <td key={field.key} className="py-2 px-3 text-center tabular-nums">{Number.isFinite(row.values[field.key]) ? row.values[field.key].toFixed(2) : '--'}</td>
                                                            ))}
                                                            <td className="py-2 px-3">
                                                                <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${row.importStatus === 'success' ? 'bg-green-100 text-green-800' : row.importStatus === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                                                                    {row.importStatus === 'success' ? <CheckCircle size={12} /> : row.importStatus === 'error' ? <AlertCircle size={12} /> : <FileSpreadsheet size={12} />}
                                                                    <span>{row.importMessage || (row.importStatus === 'pending' ? 'Ready' : row.importStatus)}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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
