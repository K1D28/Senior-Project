import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AppData } from '../../data';
import { CuppingEvent, Role, User } from '../../types';
import { EventParticipantsUpdateData } from '../../App';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { X } from 'lucide-react';

interface EventParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CuppingEvent | null;
  appData: AppData;
  onUpdate: (data: EventParticipantsUpdateData) => void;
}

const ParticipantList: React.FC<{
    users: User[];
    onRemove: (userId: string) => void;
}> = ({ users, onRemove }) => (
    <div className="space-y-2 mt-2 p-2 border border-border rounded-md bg-background min-h-[100px] max-h-60 overflow-y-auto">
        {users.length > 0 ? (
            users.map(user => (
                <div key={user.id} className="flex justify-between items-center p-2 bg-surface rounded-md text-sm">
                    <span>{user.name}</span>
                    <button onClick={() => onRemove(user.id)} className="text-text-light hover:text-red-600">
                        <X size={16} />
                    </button>
                </div>
            ))
        ) : (
            <p className="text-center text-text-light p-4">No one assigned yet.</p>
        )}
    </div>
);

const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({ isOpen, onClose, event, appData, onUpdate }) => {
    const [assignedQGraderIds, setAssignedQGraderIds] = useState<string[]>([]);
    const [assignedHeadJudgeIds, setAssignedHeadJudgeIds] = useState<string[]>([]);
    const [allHeadJudges, setAllHeadJudges] = useState<User[]>([]);
    const [allQGraders, setAllQGraders] = useState<User[]>([]);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const response = await axios.get('/api/participants');
                console.log('Participants API Response:', response.data); // Debugging log

                setAllHeadJudges(response.data.headJudges || []);
                setAllQGraders(response.data.qGraders || []);
            } catch (error) {
                console.error('Error fetching participants:', error);
                setAllHeadJudges([]);
                setAllQGraders([]);
            }
        };
        if (isOpen) {
            fetchParticipants();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && event) {
            setAssignedQGraderIds(event.assignedQGraderIds || []);
            setAssignedHeadJudgeIds(event.assignedHeadJudgeIds || []);
        }
    }, [isOpen, event]);

    if (!event) return null;

    const assignedHeadJudges = assignedHeadJudgeIds
        .map(id => allHeadJudges.find(user => String(user.id) === String(id)))
        .filter((user): user is User => user !== undefined); // Ensure type safety

    const assignedQGraders = assignedQGraderIds
        .map(id => allQGraders.find(user => String(user.id) === String(id)))
        .filter((user): user is User => user !== undefined); // Ensure type safety

    console.log('Mapped Assigned Head Judges:', assignedHeadJudges); // Debugging log
    console.log('Mapped Assigned Q Graders:', assignedQGraders); // Debugging log

    const handleAddParticipant = (role: 'qGrader' | 'headJudge', userId: string) => {
        if (!userId) return;
        if (role === 'headJudge') {
            if (!assignedHeadJudgeIds.includes(userId)) {
                setAssignedHeadJudgeIds(prev => {
                    const updated = [...prev, userId];
                    console.log('Updated Head Judge IDs:', updated); // Debugging log
                    return updated;
                });
            }
        } else {
            if (!assignedQGraderIds.includes(userId)) {
                setAssignedQGraderIds(prev => {
                    const updated = [...prev, userId];
                    console.log('Updated Q Grader IDs:', updated); // Debugging log
                    return updated;
                });
            }
        }
        console.log('State after adding participant:', {
            assignedHeadJudgeIds,
            assignedQGraderIds,
        }); // Debugging log
    };
    
    const handleRemoveParticipant = (role: 'qGrader' | 'headJudge', userId: string) => {
        if (role === 'headJudge') {
            setAssignedHeadJudgeIds(prev => prev.filter(id => id !== userId));
        } else {
            setAssignedQGraderIds(prev => prev.filter(id => id !== userId));
        }
    };
    
    const handleSaveChanges = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. Ensure the user is logged in.');
                return;
            }

            const response = await axios.put(`http://localhost:5001/api/cupping-events/${event.id}/participants`, {
                assignedQGraderIds: assignedQGraderIds.map(id => parseInt(id, 10)),
                assignedHeadJudgeIds: assignedHeadJudgeIds.map(id => parseInt(id, 10)),
            }, {
                withCredentials: true, // Ensure cookies are included in the request
            });
            console.log('Updated participants:', response.data); // Debugging log

            // Update the frontend state with the latest data from the backend
            setAssignedQGraderIds(response.data.participants
                .filter((participant: { role: string; qGraderId?: number; qGrader?: { id: number } }) => participant.role === 'Q_GRADER')
                .map((participant: { qGrader?: { id: number } }) => String(participant.qGrader?.id)));

            setAssignedHeadJudgeIds(response.data.participants
                .filter((participant: { role: string; headJudgeId?: number; headJudge?: { id: number } }) => participant.role === 'HEAD_JUDGE')
                .map((participant: { headJudge?: { id: number } }) => String(participant.headJudge?.id)));

            onUpdate({
                eventId: event.id,
                assignedQGraderIds: response.data.participants
                    .filter((participant: { role: string; qGraderId?: number; qGrader?: { id: number } }) => participant.role === 'Q_GRADER')
                    .map((participant: { qGrader?: { id: number } }) => String(participant.qGrader?.id)),
                assignedHeadJudgeIds: response.data.participants
                    .filter((participant: { role: string; headJudgeId?: number; headJudge?: { id: number } }) => participant.role === 'HEAD_JUDGE')
                    .map((participant: { headJudge?: { id: number } }) => String(participant.headJudge?.id)),
            });

            window.location.reload(); // Automatically refresh the page to fetch updated data
        } catch (error) {
            console.error('Error saving participants:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Participants for: ${event.name}`} size="xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Head Judges */}
                <div>
                    <h3 className="text-lg font-bold mb-2">Head Judges</h3>
                    <div>
                        <Label htmlFor="headJudgeSelect">Add Head Judge</Label>
                        <Select 
                            id="headJudgeSelect"
                            onChange={e => { handleAddParticipant('headJudge', e.target.value); e.target.value = ''; }}
                            value=""
                        >
                            <option value="" disabled>Select a Head Judge...</option>
                            {allHeadJudges.map(judge => (
                                <option key={judge.id} value={judge.id} disabled={assignedHeadJudgeIds.includes(judge.id)}>
                                    {judge.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <ParticipantList users={assignedHeadJudges} onRemove={(id) => handleRemoveParticipant('headJudge', id)} />
                </div>
                
                {/* Q Graders */}
                <div>
                    <h3 className="text-lg font-bold mb-2">Q Graders</h3>
                    <div>
                        <Label htmlFor="qGraderSelect">Add Q Grader</Label>
                        <Select 
                            id="qGraderSelect"
                            onChange={e => { handleAddParticipant('qGrader', e.target.value); e.target.value = ''; }}
                            value=""
                        >
                            <option value="" disabled>Select a Q Grader...</option>
                            {allQGraders.map(grader => (
                                <option key={grader.id} value={grader.id} disabled={assignedQGraderIds.includes(grader.id)}>
                                    {grader.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <ParticipantList users={assignedQGraders} onRemove={(id) => handleRemoveParticipant('qGrader', id)} />
                </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-6 mt-6 border-t border-border">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
        </Modal>
    );
};

export default EventParticipantsModal;