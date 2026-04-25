import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CoffeeSample, User } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Trash2, Check } from 'lucide-react';
import { Card } from '../ui/Card';

interface Step3SamplesProps {
  data: CoffeeSample[];
  onUpdate: (data: CoffeeSample[]) => void;
  farmers: User[];
  processingMethods: string[];
  approvedSamples?: CoffeeSample[];
  eventName?: string;
  usedSampleIds?: Set<string>;
}

const generateBlindCode = (eventName: string): string => {
    if (!eventName) {
        // Fallback if no event name
        return `BC-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    }
    
    // Extract first letter of each word and uppercase
    const words = eventName.trim().split(/\s+/);
    const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
    
    // Generate random 4 digits
    const randomDigits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    return `${acronym}-${randomDigits}`;
};

const Step3Samples: React.FC<Step3SamplesProps> = ({ data, onUpdate, farmers, processingMethods, approvedSamples = [], eventName = '', usedSampleIds = new Set() }) => {
    const [availableSamples, setAvailableSamples] = useState<CoffeeSample[]>([]);
    const [usedSamples, setUsedSamples] = useState<CoffeeSample[]>([]);
    const [offlineDraft, setOfflineDraft] = useState({
        farmName: '',
        variety: '',
        region: '',
        processingMethod: processingMethods[0] || '',
        altitude: 0,
        moisture: undefined as number | undefined,
        farmerId: '',
        offlineFarmerName: '',
        offlineFarmerTag: '',
        offlineSubmissionRef: '',
    });

    useEffect(() => {
        // Filter for approved samples that haven't been added to the event yet
        const selectedSampleIds = new Set(data.map(s => s.id));
        
        const available = (approvedSamples || []).filter(
            sample => sample.approvalStatus === 'APPROVED' 
                && !selectedSampleIds.has(sample.id)
                && !usedSampleIds.has(sample.id)
        );
        
        const used = (approvedSamples || []).filter(
            sample => sample.approvalStatus === 'APPROVED' 
                && !selectedSampleIds.has(sample.id)
                && usedSampleIds.has(sample.id)
        );
        
        setAvailableSamples(available);
        setUsedSamples(used);
    }, [approvedSamples, data, usedSampleIds]);

    const handleRemoveRow = (index: number) => {
        onUpdate(data.filter((_, i) => i !== index));
    };

    const handleAddSample = (sample: CoffeeSample) => {
        // Generate blind code with event name and add the approved sample to the event's samples
        const sampleWithBlindCode = {
            ...sample,
            blindCode: generateBlindCode(eventName),
        };
        onUpdate([...data, sampleWithBlindCode]);
    };

    const handleAddOfflineSample = () => {
        if (!offlineDraft.farmName.trim() || !offlineDraft.variety.trim() || !offlineDraft.region.trim() || !offlineDraft.processingMethod.trim() || offlineDraft.altitude <= 0) {
            alert('Please complete Farm Name, Variety, Region, Processing Method, and Altitude for offline sample.');
            return;
        }

        if (!offlineDraft.farmerId && !offlineDraft.offlineFarmerName.trim()) {
            alert('Please select a farmer or provide an offline farmer name.');
            return;
        }

        const offlineSample: CoffeeSample = {
            id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            farmName: offlineDraft.farmName.trim(),
            variety: offlineDraft.variety.trim(),
            region: offlineDraft.region.trim(),
            processingMethod: offlineDraft.processingMethod.trim(),
            altitude: Number(offlineDraft.altitude),
            moisture: offlineDraft.moisture,
            farmerId: offlineDraft.farmerId ? String(offlineDraft.farmerId) : null,
            offlineFarmerName: offlineDraft.offlineFarmerName.trim() || null,
            offlineFarmerTag: offlineDraft.offlineFarmerTag.trim() || null,
            offlineSubmissionRef: offlineDraft.offlineSubmissionRef.trim() || null,
            blindCode: generateBlindCode(eventName),
            sampleType: 'PAPER_BASED_OFFLINE',
            approvalStatus: 'APPROVED',
        };

        onUpdate([...data, offlineSample]);
        setOfflineDraft({
            farmName: '',
            variety: '',
            region: '',
            processingMethod: processingMethods[0] || '',
            altitude: 0,
            moisture: undefined,
            farmerId: '',
            offlineFarmerName: '',
            offlineFarmerTag: '',
            offlineSubmissionRef: '',
        });
    };

    const handleUpdateRow = (index: number, field: keyof CoffeeSample, value: string | number) => {
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: value };
        onUpdate(newData);
    };

    return (
        <div className="space-y-6">
            {/* Available Approved Samples Section */}
            <Card title="Available Approved Samples">
                <p className="text-sm text-text-light mb-4">Select approved samples from farmers to add to this event.</p>
                
                {availableSamples.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                        No approved samples available. Farmers can register and get approval for samples through the admin dashboard.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left table-auto">
                            <thead>
                                <tr className="border-b border-border bg-background">
                                    <th className="p-2 font-semibold">Farm Name</th>
                                    <th className="p-2 font-semibold">Farmer</th>
                                    <th className="p-2 font-semibold">Variety</th>
                                    <th className="p-2 font-semibold">Region</th>
                                    <th className="p-2 font-semibold">Processing</th>
                                    <th className="p-2 font-semibold">Altitude (m)</th>
                                    <th className="p-2 font-semibold">Moisture (%)</th>
                                    <th className="p-2 font-semibold">Blind Code</th>
                                    <th className="p-2 font-semibold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {availableSamples.map((sample) => {
                                    const farmer = farmers.find(f => String((f as any).id ?? (f as any).userDetails?.id ?? (f as any).userId ?? '') === String(sample.farmerId));
                                    const farmerLabel = (farmer as any)?.name ?? (farmer as any)?.userDetails?.name ?? (farmer as any)?.email ?? sample.farmerId ?? 'Unknown';
                                    
                                    return (
                                        <tr key={sample.id} className="border-b border-border hover:bg-gray-50">
                                            <td className="p-2">{sample.farmName}</td>
                                            <td className="p-2">{farmerLabel}</td>
                                            <td className="p-2">{sample.variety}</td>
                                            <td className="p-2">{sample.region}</td>
                                            <td className="p-2">{sample.processingMethod}</td>
                                            <td className="p-2">{sample.altitude}</td>
                                            <td className="p-2">{sample.moisture}</td>
                                            <td className="p-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{sample.blindCode}</td>
                                            <td className="p-2 text-center">
                                                <button 
                                                    onClick={() => handleAddSample(sample)} 
                                                    className="bg-primary text-white p-2 rounded hover:bg-primary-dark flex items-center gap-1"
                                                    title="Add to event"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Used Samples (Unavailable) Section */}
            {usedSamples.length > 0 && (
                <Card title="Used Samples (Unavailable)" className="border-2 border-orange-200 bg-orange-50">
                    <p className="text-sm text-orange-700 mb-4">
                        These samples are already used in other events and cannot be added to this event.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left table-auto opacity-60">
                            <thead>
                                <tr className="border-b border-orange-200 bg-orange-100">
                                    <th className="p-2 font-semibold">Farm Name</th>
                                    <th className="p-2 font-semibold">Farmer</th>
                                    <th className="p-2 font-semibold">Variety</th>
                                    <th className="p-2 font-semibold">Region</th>
                                    <th className="p-2 font-semibold">Processing</th>
                                    <th className="p-2 font-semibold">Altitude (m)</th>
                                    <th className="p-2 font-semibold">Moisture (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usedSamples.map((sample) => {
                                    const farmer = farmers.find(f => String((f as any).id ?? (f as any).userDetails?.id ?? (f as any).userId ?? '') === String(sample.farmerId));
                                    const farmerLabel = (farmer as any)?.name ?? (farmer as any)?.userDetails?.name ?? (farmer as any)?.email ?? sample.farmerId ?? 'Unknown';
                                    
                                    return (
                                        <tr key={sample.id} className="border-b border-orange-200 bg-orange-50 text-gray-600">
                                            <td className="p-2">{sample.farmName}</td>
                                            <td className="p-2">{farmerLabel}</td>
                                            <td className="p-2">{sample.variety}</td>
                                            <td className="p-2">{sample.region}</td>
                                            <td className="p-2">{sample.processingMethod}</td>
                                            <td className="p-2">{sample.altitude}</td>
                                            <td className="p-2">{sample.moisture}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Selected Samples Section */}
            <Card title="Samples Assigned to Event">
                <p className="text-sm text-text-light mb-4">Samples selected for this event.</p>

                <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Add Paper-Based Sample (Offline Farmer Submission)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Farm Name *</label>
                            <Input value={offlineDraft.farmName} onChange={(e) => setOfflineDraft(prev => ({ ...prev, farmName: e.target.value }))} placeholder="Farm name" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Variety *</label>
                            <Input value={offlineDraft.variety} onChange={(e) => setOfflineDraft(prev => ({ ...prev, variety: e.target.value }))} placeholder="Variety" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Region *</label>
                            <Input value={offlineDraft.region} onChange={(e) => setOfflineDraft(prev => ({ ...prev, region: e.target.value }))} placeholder="Region" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Processing *</label>
                            <Select value={offlineDraft.processingMethod} onChange={(e) => setOfflineDraft(prev => ({ ...prev, processingMethod: e.target.value }))}>
                                <option value="">Select method...</option>
                                {processingMethods.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Altitude (m) *</label>
                            <Input type="number" value={offlineDraft.altitude || ''} onChange={(e) => setOfflineDraft(prev => ({ ...prev, altitude: Number(e.target.value) || 0 }))} placeholder="Altitude" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Moisture (%)</label>
                            <Input type="number" step="0.1" value={offlineDraft.moisture ?? ''} onChange={(e) => setOfflineDraft(prev => ({ ...prev, moisture: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="Moisture" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Linked Farmer (optional)</label>
                            <Select value={offlineDraft.farmerId} onChange={(e) => setOfflineDraft(prev => ({ ...prev, farmerId: e.target.value }))}>
                                <option value="">No linked farmer</option>
                                {farmers.map(f => (
                                    <option key={f.id} value={String(f.id)}>{f.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Offline Farmer Name</label>
                            <Input value={offlineDraft.offlineFarmerName} onChange={(e) => setOfflineDraft(prev => ({ ...prev, offlineFarmerName: e.target.value }))} placeholder="Name on paper form" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Offline Farmer Tag</label>
                            <Input value={offlineDraft.offlineFarmerTag} onChange={(e) => setOfflineDraft(prev => ({ ...prev, offlineFarmerTag: e.target.value }))} placeholder="Village/co-op tag" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700">Offline Submission Ref</label>
                            <Input value={offlineDraft.offlineSubmissionRef} onChange={(e) => setOfflineDraft(prev => ({ ...prev, offlineSubmissionRef: e.target.value }))} placeholder="Paper reference" />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button type="button" onClick={handleAddOfflineSample} className="bg-primary text-white">Add Offline Sample</Button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left table-auto">
                        <thead>
                            <tr className="border-b border-border bg-background">
                                <th className="p-2 font-semibold">Farm Name</th>
                                <th className="p-2 font-semibold">Variety</th>
                                <th className="p-2 font-semibold">Region</th>
                                <th className="p-2 font-semibold">Processing</th>
                                <th className="p-2 font-semibold">Altitude (m)</th>
                                <th className="p-2 font-semibold">Moisture (%)</th>
                                <th className="p-2 font-semibold">Blind Code</th>
                                <th className="p-2 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((sample, index) => {
                                return (
                                    <tr key={sample.id || index} className="border-b border-border">
                                        <td className="p-2">
                                            <div>{sample.farmName}</div>
                                            {sample.sampleType === 'PAPER_BASED_OFFLINE' && (
                                                <div className="text-xs text-blue-700 mt-1">
                                                    Offline: {sample.offlineFarmerName || 'Unnamed'}{sample.offlineFarmerTag ? ` • ${sample.offlineFarmerTag}` : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-2">{sample.variety}</td>
                                        <td className="p-2">{sample.region}</td>
                                        <td className="p-2">{sample.processingMethod}</td>
                                        <td className="p-2">{sample.altitude}</td>
                                        <td className="p-2">{sample.moisture}</td>
                                        <td className="p-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{sample.blindCode}</td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleRemoveRow(index)} className="text-text-light hover:text-red-600 p-2">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {data.length === 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                        No samples assigned yet. Select from available approved samples above.
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Step3Samples;
