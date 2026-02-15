import React, { useEffect, useState } from 'react';
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
    farmerId: '', // Empty by default, user must select for proxy submissions
    farmName: '',
    region: '',
    altitude: 0,
    processingMethod: '',
    variety: '',
    moisture: 0,
    sampleType: 'PROXY_SUBMISSION',
};

const Step3Samples: React.FC<Step3SamplesProps> = ({ data, onUpdate, farmers, processingMethods }) => {

    useEffect(() => {
        console.log('Step3Samples - farmers prop:', farmers);
    }, [farmers]);

    const handleAddRow = () => {
        const newSample: CoffeeSample = { ...newSampleTemplate, id: `temp-${Date.now()}`, blindCode: `BC-${Date.now()}`, processingMethod: processingMethods[0] || '', sampleType: 'PROXY_SUBMISSION' };
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
        <div className="space-y-6">
            {/* Proxy Submissions Section */}
            <Card title="Coffee Samples">
                <p className="text-sm text-text-light mb-4">Add coffee samples submitted by farmers or via admin submission.</p>
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
                            {data.map((sample, index) => {
                                return (
                                    <tr key={sample.id || index} className="border-b border-border">
                                        <td className="p-1">
                                            <Select value={sample.farmerId} onChange={e => handleUpdateRow(index, 'farmerId', e.target.value)}>
                                                <option value="" disabled>Select Farmer</option>
                                                {farmers.map(f => {
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
                                        <td className="p-1"><Input type="number" value={sample.altitude || ''} onChange={e => handleUpdateRow(index, 'altitude', e.target.value ? Number(e.target.value) : 0)} placeholder="e.g., 1750" /></td>
                                        <td className="p-1"><Input type="number" step="0.1" value={sample.moisture || ''} onChange={e => handleUpdateRow(index, 'moisture', e.target.value ? Number(e.target.value) : 0)} placeholder="e.g., 10.8" /></td>
                                        <td className="p-1 text-center">
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
                <div className="mt-4">
                    <Button onClick={() => handleAddRow()}>+ Add Sample</Button>
                </div>
            </Card>
        </div>
    );
};

export default Step3Samples;
