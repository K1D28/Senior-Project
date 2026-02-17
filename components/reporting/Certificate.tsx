
import React, { useMemo } from 'react';
import { CoffeeSample, CuppingEvent, User, ScoreSheet } from '../../types';
import { Button } from '../ui/Button';
import { Award, Printer, Star, MessageSquare } from 'lucide-react';
import type { AppData } from '../../data';

// A simple SVG seal for the certificate
const CertificateSeal = () => (
    <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="absolute inset-0">
            <defs>
                <path id="circlePath" d="M 10, 50 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
            </defs>
            <circle cx="50" cy="50" r="48" fill="#f5f0e6" stroke="#b48c5c" strokeWidth="2" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#b48c5c" strokeWidth="1" />
            <text fontFamily="serif" fontSize="9" fill="#8c5a2c" textAnchor="middle">
                <textPath xlinkHref="#circlePath" startOffset="50%">
                    THE CUPPING HUB • OFFICIAL AWARD
                </textPath>
            </text>
             <text x="50" y="58" fontFamily="serif" fontSize="16" textAnchor="middle" fontWeight="bold" fill="#8c5a2c">TCH</text>
        </svg>
        <Star className="absolute text-yellow-600 w-10 h-10" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} fill="currentColor" />
    </div>
);


interface CertificateProps {
  sample: CoffeeSample;
  event: CuppingEvent;
  farmer: User;
  rank: number;
  appData: AppData;
}

const Certificate: React.FC<CertificateProps> = ({ sample, event, farmer, rank, appData }) => {

    const rankText = {
        1: 'First Place Winner',
        2: 'Second Place Finisher',
        3: 'Third Place Finisher',
    }[rank] || `${rank}th Place`;

    // Fetch Q Grader scores for this sample
    const qGraderScores = useMemo(() => {
        return appData.scores.filter(s => s.sampleId === sample.id && s.eventId === event.id && s.isSubmitted);
    }, [appData.scores, sample.id, event.id]);

    // Calculate average scores
    const calculateAverageScores = (scores: ScoreSheet[]) => {
        if (scores.length === 0) return null;
        const scoreAttributes = ['fragrance', 'flavor', 'aftertaste', 'acidity', 'body', 'balance', 'uniformity', 'cleanCup', 'sweetness', 'overall'] as const;
        const averages: Record<string, number> = {};
        
        scoreAttributes.forEach(attr => {
            const scores_array = scores.map(s => s.scores[attr]);
            averages[attr] = scores_array.reduce((sum, val) => sum + val, 0) / scores.length;
        });
        
        return averages;
    };

    const averageScores = useMemo(() => calculateAverageScores(qGraderScores), [qGraderScores]);

    // Get head judge comments
    const headJudgeComments = useMemo(() => {
        return sample.headJudgeNotes || sample.adjudicationJustification || 'No additional comments';
    }, [sample]);

    // Get Q Grader notes
    const qGraderNotes = useMemo(() => {
        const allNotes = qGraderScores.map(s => s.notes).filter(Boolean);
        return allNotes.length > 0 ? allNotes.slice(0, 3) : [];
    }, [qGraderScores]);

    // Get top descriptors
    const topDescriptors = useMemo(() => {
        const allDescriptors = qGraderScores.flatMap(s => s.descriptors.map(d => d.name));
        const counts = allDescriptors.reduce((acc, desc) => { acc[desc] = (acc[desc] || 0) + 1; return acc; }, {} as Record<string, number>);
        return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name]) => name);
    }, [qGraderScores]);

    const handlePrint = () => {
        window.print();
    };
    
    return (
        <div>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .certificate-print-area, .certificate-print-area * {
                        visibility: visible;
                    }
                    .certificate-print-area {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100vw;
                        height: 100vh;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                }
            `}</style>
            <div id="certificate-content" className="font-serif bg-slate-50 text-gray-800 aspect-[1.414/1] w-full max-w-4xl mx-auto p-4 md:p-8 border-8 border-double border-amber-800/80">
                <div className="w-full h-full border-2 border-amber-700/70 p-4 md:p-8 flex flex-col items-center text-center">
                    <div className="flex items-center space-x-2">
                        <Award className="text-amber-600" size={40} />
                        <h1 className="text-3xl md:text-5xl font-bold tracking-widest text-amber-900/90" style={{ fontFamily: "'Garamond', serif" }}>CERTIFICATE OF ACHIEVEMENT</h1>
                    </div>
                    <p className="mt-4 text-lg md:text-xl">This certificate is proudly presented to</p>
                    
                    <div className="my-4 md:my-6">
                        <p className="text-2xl md:text-4xl font-bold border-b-2 border-amber-700/70 px-4 pb-1">{farmer.name}</p>
                        <p className="text-sm md:text-base mt-1 font-semibold">{sample.farmName}</p>
                    </div>

                    <p className="text-lg md:text-xl">for the outstanding achievement of</p>
                    <p className="text-2xl md:text-4xl font-bold text-primary my-2 md:my-4">{rankText}</p>
                    
                    <p className="text-base md:text-lg">in the <span className="font-semibold">{event.name}</span></p>

                    <p className="mt-2 md:mt-4 text-sm md:text-base">with the coffee submission:</p>
                    <p className="font-semibold text-base md:text-lg">{sample.variety} - {sample.processingMethod} Process</p>
                    <p className="text-sm">Region: <span className="font-semibold">{sample.region || 'Not specified'}</span></p>
                    <p className="text-sm">Final Score: <span className="font-bold text-lg">{sample.adjudicatedFinalScore?.toFixed(2)}</span></p>

                    {/* Q Grader Scores Summary */}
                    {averageScores && (
                        <div className="mt-4 md:mt-6 w-full text-left">
                            <p className="text-sm font-semibold text-amber-900/80 mb-2">Q Grader Evaluation Summary:</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs md:text-sm">
                                <div className="bg-amber-50/50 p-2 rounded">
                                    <p className="font-semibold">Fragrance: {averageScores.fragrance?.toFixed(1)}</p>
                                </div>
                                <div className="bg-amber-50/50 p-2 rounded">
                                    <p className="font-semibold">Flavor: {averageScores.flavor?.toFixed(1)}</p>
                                </div>
                                <div className="bg-amber-50/50 p-2 rounded">
                                    <p className="font-semibold">Acidity: {averageScores.acidity?.toFixed(1)}</p>
                                </div>
                                <div className="bg-amber-50/50 p-2 rounded">
                                    <p className="font-semibold">Body: {averageScores.body?.toFixed(1)}</p>
                                </div>
                                <div className="bg-amber-50/50 p-2 rounded">
                                    <p className="font-semibold">Balance: {averageScores.balance?.toFixed(1)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Flavor Profile / Top Descriptors */}
                    {topDescriptors.length > 0 && (
                        <div className="mt-4 md:mt-6 w-full text-left">
                            <p className="text-sm font-semibold text-amber-900/80 mb-2">Flavor Profile:</p>
                            <p className="text-xs md:text-sm text-gray-700 italic">{topDescriptors.join(', ')}</p>
                        </div>
                    )}

                    {/* Head Judge Comments */}
                    {headJudgeComments && (
                        <div className="mt-4 md:mt-6 w-full text-left">
                            <p className="text-sm font-semibold text-amber-900/80 mb-2 flex items-center space-x-1">
                                <MessageSquare size={14} />
                                <span>Head Judge Commentary:</span>
                            </p>
                            <p className="text-xs md:text-sm text-gray-700 italic border-l-2 border-amber-300 pl-2">{headJudgeComments}</p>
                        </div>
                    )}

                    {/* Q Grader Notes */}
                    {qGraderNotes.length > 0 && (
                        <div className="mt-4 md:mt-6 w-full text-left">
                            <p className="text-sm font-semibold text-amber-900/80 mb-2">Q Grader Notes:</p>
                            <div className="space-y-1">
                                {qGraderNotes.map((note, idx) => (
                                    <p key={idx} className="text-xs md:text-sm text-gray-700 italic border-l-2 border-amber-300 pl-2">"{note}"</p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-grow" />

                    <div className="w-full flex justify-between items-end mt-6 md:mt-12">
                        <div className="text-center">
                            <p className="border-b-2 border-gray-600 px-8 pb-1 font-semibold italic">Alice Organizer</p>
                            <p className="text-sm mt-1">Event Organizer</p>
                        </div>

                        <CertificateSeal />

                        <div className="text-center">
                            <p className="border-b-2 border-gray-600 px-8 pb-1 font-semibold italic">Eve Adjudicator</p>
                            <p className="text-sm mt-1">Head Judge</p>
                        </div>
                    </div>
                </div>
            </div>
             <div className="text-center mt-6 no-print">
                <Button onClick={handlePrint} className="flex items-center space-x-2 mx-auto">
                    <Printer size={16} />
                    <span>Print or Save as PDF</span>
                </Button>
            </div>
        </div>
    );
};

export default Certificate;
