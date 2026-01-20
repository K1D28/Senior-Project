import React from 'react';
import { User, Role } from '../../types';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { Card } from '../ui/Card';
import { X } from 'lucide-react';

interface Step2ParticipantsProps {
  data: { assignedQGraderIds: string[], assignedHeadJudgeIds: string[], assignedFarmerIds?: string[] };
  onUpdate: (data: { assignedQGraderIds: string[], assignedHeadJudgeIds: string[], assignedFarmerIds?: string[] }) => void;
  headJudges: User[];
  qGraders: User[];
  farmers?: User[]; // Optional - farmers are assigned in Step3, not required here
}

const Step2Participants: React.FC<Step2ParticipantsProps> = ({ data, onUpdate, headJudges, qGraders, farmers }) => {
    // Ensure data properties are always arrays
    const assignedHeadJudgeIds = data.assignedHeadJudgeIds || [];
    const assignedQGraderIds = data.assignedQGraderIds || [];
    const assignedFarmerIds = data.assignedFarmerIds || [];

    const handleAddParticipant = (role: 'qGrader' | 'headJudge', userId: string) => {
        if (!userId) {
            console.warn(`Attempted to add participant with empty userId for role: ${role}`); // Debugging log
            return;
        }
        if (role === 'headJudge') {
            if (!assignedHeadJudgeIds.includes(userId)) {
                console.log(`Adding Head Judge with ID: ${userId}`); // Debugging log
                onUpdate({ ...data, assignedHeadJudgeIds: [...assignedHeadJudgeIds, userId] });
            }
        } else {
            if (!assignedQGraderIds.includes(userId)) {
                console.log(`Adding Q Grader with ID: ${userId}`); // Debugging log
                onUpdate({ ...data, assignedQGraderIds: [...assignedQGraderIds, userId] });
            }
        }
    };

    const handleRemoveParticipant = (role: 'qGrader' | 'headJudge', userId: string) => {
        console.log(`Removing ${role} with ID: ${userId}`); // Debugging log
        if (role === 'headJudge') {
            onUpdate({ ...data, assignedHeadJudgeIds: assignedHeadJudgeIds.filter(id => id !== userId) });
        } else {
            onUpdate({ ...data, assignedQGraderIds: assignedQGraderIds.filter(id => id !== userId) });
        }
    };

    const renderParticipantList = (ids: string[], role: 'qGrader' | 'headJudge') => {
        return (
            <div className="space-y-2 mt-2 p-2 border border-border rounded-md bg-background min-h-[50px]">
                {ids.map(id => {
                    const user = (role === 'headJudge' ? headJudges : qGraders).find(u => String(u.id) === String(id));
                    if (!user) return null;
                    return (
                        <div key={id} className="flex justify-between items-center p-2 bg-surface rounded-md text-sm">
                            <span>{user.name}</span>
                            <button onClick={() => handleRemoveParticipant(role, id)} className="text-text-light hover:text-red-600">
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card title="Assign Judging Team">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Head Judges Section */}
                    <div>
                        <h3 className="text-lg font-bold mb-2">Assign Head Judge(s)</h3>
                        <div>
                            <Label htmlFor="headJudgeSelect">Add by name</Label>
                            <Select 
                                id="headJudgeSelect"
                                onChange={e => {
                                    handleAddParticipant('headJudge', e.target.value);
                                    e.target.value = ''; // Reset the select value after adding
                                }}
                                value=""
                            >
                                <option value="" disabled>Select a Head Judge...</option>
                                {headJudges.map(judge => (
                                    <option key={judge.id} value={judge.id} disabled={assignedHeadJudgeIds.includes(judge.id)}>
                                        {judge.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        {renderParticipantList(assignedHeadJudgeIds, 'headJudge')}
                    </div>

                    {/* Q Graders Section */}
                    <div>
                        <h3 className="text-lg font-bold mb-2">Assign Q Graders</h3>
                         <div>
                            <Label htmlFor="qGraderSelect">Add by name</Label>
                            <Select 
                                id="qGraderSelect"
                                onChange={e => {
                                    handleAddParticipant('qGrader', e.target.value);
                                    e.target.value = ''; // Reset the select value after adding
                                }}
                                value=""
                            >
                                <option value="" disabled>Select a Q Grader...</option>
                                {qGraders.map(grader => (
                                    <option key={grader.id} value={grader.id} disabled={assignedQGraderIds.includes(grader.id)}>
                                        {grader.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        {renderParticipantList(assignedQGraderIds, 'qGrader')}
                    </div>
                </div>
            </Card>
            {/* Note: Farmers are selected in the Samples step (Step 3). */}
        </div>
    );
};

export default Step2Participants;
