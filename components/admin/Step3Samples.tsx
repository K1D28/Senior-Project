import React, { useEffect } from 'react';
import axios from 'axios';
import { CoffeeSample, User } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';

interface Step3SamplesProps {
  data: CoffeeSample[];
  onUpdate: (data: CoffeeSample[]) => void;
  farmers: User[];
  processingMethods: string[];
}

const newSampleTemplate: CoffeeSample = {
    id: '',
    blindCode: '',
    farmerId: '',
    farmName: '',
    region: '',
    altitude: 0,
    processingMethod: '',
    variety: '',
    moisture: 0,
};

const Step3Samples: React.FC<Step3SamplesProps> = ({ data, onUpdate, farmers, processingMethods }) => {
    useEffect(() => {
        console.log('Step3Samples - farmers prop:', farmers);
    }, [farmers]);

    const handleAddRow = () => {
        const newSample = { ...newSampleTemplate, id: `temp-${Date.now()}`, blindCode: `BC-${Date.now()}`, processingMethod: processingMethods[0] || '' };
        onUpdate([...data, newSample]);
    };

    const handleRemoveRow = (index: number) => {
        onUpdate(data.filter((_, i) => i !== index));
    };

    const handleUpdateRow = (index: number, field: keyof CoffeeSample, value: string | number) => {
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: value };
        onUpdate(newData);
    };

    return (
        <Card title="Register Samples">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left table-auto">
                    <thead>
                        <tr className="border-b border-border bg-background">
                            <th className="p-2 font-semibold">Farmer</th>
                            <th className="p-2 font-semibold">Farm Name</th>
                            <th className="p-2 font-semibold">Variety</th>
                            <th className="p-2 font-semibold">Region</th>
                            <th className="p-2 font-semibold">Processing</th>
                            <th className="p-2 font-semibold">Altitude (m)</th>
                            <th className="p-2 font-semibold">Moisture (%)</th>
                            <th className="p-2 font-semibold"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((sample, index) => (
                            <tr key={sample.id || index} className="border-b border-border">
                                <td className="p-1">
                                    <Select value={sample.farmerId} onChange={e => handleUpdateRow(index, 'farmerId', e.target.value)}>
                                        <option value="" disabled>Select Farmer</option>
                                        {farmers.map(f => {
                                            // Prefer normalized fields (set by EventCreationWizard) then fall back to nested shapes
                                            const userId = String((f as any).id ?? (f as any).userDetails?.id ?? (f as any).userId ?? '');
                                            const label = (f as any).name ?? (f as any).userDetails?.name ?? (f as any).email ?? `Farmer ${userId}`;
                                            return <option key={userId} value={userId}>{label}</option>;
                                        })}
                                    </Select>
                                </td>
                                <td className="p-1"><Input type="text" value={sample.farmName} onChange={e => handleUpdateRow(index, 'farmName', e.target.value)} placeholder="e.g., Finca El Paraiso" /></td>
                                <td className="p-1"><Input type="text" value={sample.variety} onChange={e => handleUpdateRow(index, 'variety', e.target.value)} placeholder="e.g., Pink Bourbon" /></td>
                                <td className="p-1"><Input type="text" value={sample.region} onChange={e => handleUpdateRow(index, 'region', e.target.value)} placeholder="e.g., Colombia, Huila" /></td>
                                <td className="p-1">
                                    <Select value={sample.processingMethod} onChange={e => handleUpdateRow(index, 'processingMethod', e.target.value)}>
                                        <option value="" disabled>Select Method</option>
                                        {processingMethods.map(p => <option key={p} value={p}>{p}</option>)}
                                    </Select>
                                </td>
                                <td className="p-1"><Input type="number" value={sample.altitude} onChange={e => handleUpdateRow(index, 'altitude', Number(e.target.value))} placeholder="e.g., 1750" /></td>
                                <td className="p-1"><Input type="number" step="0.1" value={sample.moisture || ''} onChange={e => handleUpdateRow(index, 'moisture', Number(e.target.value))} placeholder="e.g., 10.8" /></td>
                                <td className="p-1 text-center">
                                    <button onClick={() => handleRemoveRow(index)} className="text-text-light hover:text-red-600 p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex space-x-4">
                <Button onClick={handleAddRow}>+ Add Sample Row</Button>
            </div>
        </Card>
    );
};

export default Step3Samples;
