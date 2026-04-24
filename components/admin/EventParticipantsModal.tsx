import { BACKEND_URL } from '../../utils/api';
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
                    <button onClick={() => onRemove(String(user.id))} className="text-text-light hover:text-red-600">
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
    const [selectedHeadCandidates, setSelectedHeadCandidates] = useState<string[]>([]);
    const [selectedQCandidates, setSelectedQCandidates] = useState<string[]>([]);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${BACKEND_URL}/api/participants`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    withCredentials: true,
                });
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
            const directQ = Array.isArray(event.assignedQGraderIds)
                ? event.assignedQGraderIds.map((id: any) => String(id))
                : [];
            const directH = Array.isArray(event.assignedHeadJudgeIds)
                ? event.assignedHeadJudgeIds.map((id: any) => String(id))
                : [];

            // Fallback to participant relations if assigned* arrays are missing/empty
            const fromParticipants = extractAssignedIdsFromParticipants((event as any).participants || []);

            setAssignedQGraderIds(directQ.length > 0 ? directQ : fromParticipants.qIds);
            setAssignedHeadJudgeIds(directH.length > 0 ? directH : fromParticipants.hIds);
        }
    }, [isOpen, event]);

    const extractAssignedIdsFromParticipants = (participants: any[] = []) => {
        const qIds = participants
            .filter((p: any) => p.role === 'Q_GRADER')
            .map((p: any) => p.qGrader?.id ?? p.qGraderId)
            .filter((id: any) => id !== undefined && id !== null)
            .map((id: any) => String(id));

        const hIds = participants
            .filter((p: any) => p.role === 'HEAD_JUDGE')
            .map((p: any) => p.headJudge?.id ?? p.headJudgeId)
            .filter((id: any) => id !== undefined && id !== null)
            .map((id: any) => String(id));

        return {
            qIds: Array.from(new Set(qIds)),
            hIds: Array.from(new Set(hIds)),
        };
    };

    const normalizeAssignedIdsFromResponse = (payload: any) => {
        const participantIds = extractAssignedIdsFromParticipants(payload?.participants || []);

        const qFromAssignedArray = Array.isArray(payload?.assignedQGraderIds)
            ? payload.assignedQGraderIds.map((id: any) => String(id))
            : [];
        const hFromAssignedArray = Array.isArray(payload?.assignedHeadJudgeIds)
            ? payload.assignedHeadJudgeIds.map((id: any) => String(id))
            : [];

        return {
            qIds: qFromAssignedArray.length > 0 ? qFromAssignedArray : participantIds.qIds,
            hIds: hFromAssignedArray.length > 0 ? hFromAssignedArray : participantIds.hIds,
        };
    };

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
                    console.log('Updated Head Judge IDs:', updated);
                    return updated;
                });
            }
        } else {
            if (!assignedQGraderIds.includes(userId)) {
                setAssignedQGraderIds(prev => {
                    const updated = [...prev, userId];
                    console.log('Updated Q Grader IDs:', updated);
                    return updated;
                });
            }
        }
    };
    
    const handleRemoveParticipant = (role: 'qGrader' | 'headJudge', userId: string) => {
        // Only update local draft state; persist when user clicks Save Changes.
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

            const response = await axios.put(`${BACKEND_URL}/api/cupping-events/${event.id}/participants`, {
                assignedQGraderIds: assignedQGraderIds.map(id => parseInt(id, 10)),
                assignedHeadJudgeIds: assignedHeadJudgeIds.map(id => parseInt(id, 10)),
            }, {
                withCredentials: true, // Ensure cookies are included in the request
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Updated participants:', response.data); // Debugging log

            // Update the frontend state with the latest data from the backend
            const { qIds, hIds } = normalizeAssignedIdsFromResponse(response.data);
            setAssignedQGraderIds(qIds);
            setAssignedHeadJudgeIds(hIds);

            onUpdate({
                eventId: event.id,
                assignedQGraderIds: qIds,
                assignedHeadJudgeIds: hIds,
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
                        <Label htmlFor="headJudgeSelect">Select Head Judge(s)</Label>
                        <Select
                            id="headJudgeSelect"
                            multiple
                            size={6}
                            value={selectedHeadCandidates}
                            onChange={e => setSelectedHeadCandidates(Array.from(e.target.selectedOptions).map(o => o.value))}
                        >
                            {allHeadJudges.map(judge => (
                                <option key={judge.id} value={String(judge.id)} disabled={assignedHeadJudgeIds.includes(String(judge.id))}>
                                    {judge.name}
                                </option>
                            ))}
                        </Select>
                        <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => { selectedHeadCandidates.forEach(id => handleAddParticipant('headJudge', id)); setSelectedHeadCandidates([]); }}>Add Selected</Button>
                            <Button size="sm" variant="secondary" onClick={() => setSelectedHeadCandidates([])}>Clear</Button>
                        </div>
                    </div>
                    <ParticipantList users={assignedHeadJudges} onRemove={(id) => handleRemoveParticipant('headJudge', id)} />
                </div>
                
                {/* Q Graders */}
                <div>
                    <h3 className="text-lg font-bold mb-2">Q Graders</h3>
                    <div>
                        <Label htmlFor="qGraderSelect">Select Q Grader(s)</Label>
                        <Select
                            id="qGraderSelect"
                            multiple
                            size={6}
                            value={selectedQCandidates}
                            onChange={e => setSelectedQCandidates(Array.from(e.target.selectedOptions).map(o => o.value))}
                        >
                            {allQGraders.map(grader => (
                                <option key={grader.id} value={String(grader.id)} disabled={assignedQGraderIds.includes(String(grader.id))}>
                                    {grader.name}
                                </option>
                            ))}
                        </Select>
                        <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => { selectedQCandidates.forEach(id => handleAddParticipant('qGrader', id)); setSelectedQCandidates([]); }}>Add Selected</Button>
                            <Button size="sm" variant="secondary" onClick={() => setSelectedQCandidates([])}>Clear</Button>
                        </div>
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