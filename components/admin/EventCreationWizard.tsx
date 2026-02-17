import React, { useState, useCallback, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AppData } from '../../data';
import { NewFullEventData } from '../../App';
import Step1Details from './Step1Details';
import Step2Participants from './Step2Participants';
import Step3Samples from './Step3Samples';
import { CoffeeSample, CuppingEvent, Role, User } from '../../types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

// Utility function to validate token
const validateToken = async (token: string | null): Promise<boolean> => {
    if (!token) return false;
    try {
        const response = await axios.get('http://localhost:5001/api/auth/validate-token', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        });
        return response.status === 200;
    } catch (error) {
        console.error('Token validation failed:', error);
        return false;
    }
};

interface EventCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fullEventData: NewFullEventData) => void;
  appData: AppData;
}

type WizardStep = 'details' | 'participants' | 'samples' | 'confirm';

const initialEventState = {
    details: { name: '', date: '', description: '', processingMethods: [], tags: [] }, // Ensure tags is initialized as an empty array
    participants: { assignedQGraderIds: [], assignedHeadJudgeIds: [], assignedFarmerIds: [] },
    samples: []
};

const EventCreationWizard: React.FC<EventCreationWizardProps> = ({ isOpen, onClose, onSubmit, appData }) => {
    const [step, setStep] = useState<WizardStep>('details');
    
    // State for each step's data
    const [eventDetails, setEventDetails] = useState<Omit<CuppingEvent, 'id' | 'sampleIds' | 'isResultsRevealed' | 'assignedQGraderIds' | 'assignedHeadJudgeIds'>>(initialEventState.details);
    const [participants, setParticipants] = useState<{ assignedQGraderIds: string[], assignedHeadJudgeIds: string[], assignedFarmerIds: string[] }>(initialEventState.participants);
    const [samples, setSamples] = useState<CoffeeSample[]>(initialEventState.samples); // Updated type to CoffeeSample[]
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSkipConfirmModalOpen, setIsSkipConfirmModalOpen] = useState(false);
    const [qGraders, setQGraders] = useState<User[]>([]);
    const [headJudges, setHeadJudges] = useState<User[]>([]);
    const [farmers, setFarmers] = useState<User[]>([]);

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                };
                console.log('Request Headers (using cookies):', headers); // Debugging log
                // Fetch all participants (Head Judges, Q Graders, and Farmers)
                const participantsResponse = await axios.get('http://localhost:5001/api/participants', {
                    headers,
                    withCredentials: true, // Use cookies for authentication
                });
                console.log('Participants Response:', participantsResponse.data); // Debugging log

                // Normalizer to ensure each participant has stable id and name fields
                const normalize = (p: any, fallbackRoleName = 'Participant') => {
                    const id = String(p?.userDetails?.id ?? p?.userId ?? p?.id ?? (p?.supabaseId ?? ''));
                    const name = p?.userDetails?.name ?? p?.name ?? p?.email ?? (typeof p === 'string' ? p : undefined) ?? `${fallbackRoleName} ${id}`;
                    const roles = Array.isArray(p?.roles) ? p.roles : (p?.role ? [p.role] : []);
                    return { ...p, id, name, roles };
                };

                const rawHead = Array.isArray(participantsResponse.data.headJudges) ? participantsResponse.data.headJudges : [];
                const rawQ = Array.isArray(participantsResponse.data.qGraders) ? participantsResponse.data.qGraders : [];
                const rawF = Array.isArray(participantsResponse.data.farmers) ? participantsResponse.data.farmers : [];

                const normHead = rawHead.map((h: any) => normalize(h, 'HeadJudge'));
                const normQ = rawQ.map((q: any) => normalize(q, 'QGrader'));
                // Normalize farmers and ensure role indicates FARMER; sometimes API returns mixed roles
                const normFAll = rawF.map((f: any) => normalize(f, 'Farmer'));
                const normF = normFAll.filter((f: any) => {
                    if (!f || !f.roles) return false;
                    return f.roles.some((r: any) => String(r).toUpperCase().includes('FARMER'));
                });
                console.log('Normalized headJudges:', normHead);
                console.log('Normalized qGraders:', normQ);
                console.log('Normalized farmers (filtered):', normF, 'all:', normFAll);
                setHeadJudges(normHead);
                setQGraders(normQ);
                // If API returned no valid farmers, fallback to appData.users filtered by role
                if (!normF || normF.length === 0) {
                    const fallback = (appData?.users || []).filter((u: any) => {
                        if (!u || !u.roles) return false;
                        return u.roles.some((r: any) => String(r).toUpperCase().includes('FARMER'));
                    }).map((u: any) => ({ ...u, id: String(u.id), name: u.name }));
                    console.warn('Participants API returned no farmers; falling back to appData.users:', fallback);
                    setFarmers(fallback as any);
                } else {
                    setFarmers(normF);
                }
            } catch (error) {
                console.error('Error fetching participants:', error);
                if (axios.isAxiosError(error)) {
                    console.error('Axios error details:', {
                        message: error.message,
                        url: error.config?.url,
                        method: error.config?.method,
                        headers: error.config?.headers,
                        data: error.config?.data,
                        response: {
                            status: error.response?.status,
                            statusText: error.response?.statusText,
                            data: error.response?.data,
                        },
                    });
                    if (error.response?.status === 401) {
                        console.warn('Unauthorized: Token may be invalid or expired.');
                        console.log('Token validation failed. Please check the token or re-login.');
                    } else {
                        console.error('An unexpected error occurred:', error);
                    }
                } else {
                    console.error('Unexpected error:', error);
                }
                setHeadJudges([]);
                setQGraders([]);
            }
        };
        fetchParticipants();
    }, []);

    const resetWizard = useCallback(() => {
        setStep('details');
        setEventDetails(initialEventState.details);
        setParticipants(initialEventState.participants);
        setSamples(initialEventState.samples);
    }, []);

    const handleClose = () => {
        resetWizard();
        onClose();
        
    };

    const handleFinalSubmit = async () => {
        try {
            // Validate event details
            if (!eventDetails.name?.trim()) {
                alert('Event name is required.');
                return;
            }
            if (!eventDetails.date) {
                alert('Event date is required.');
                return;
            }

            // Validate tags and processing methods
            const validatedTags = (eventDetails.tags || []).map(tagObj => tagObj?.tag?.trim() || '').filter(tag => tag !== '');
            const validatedProcessingMethods = (eventDetails.processingMethods || [])
                .map(method => {
                    // Handle both string and object formats
                    if (typeof method === 'string') return method.trim();
                    if (typeof method === 'object' && method?.method) return method.method.trim();
                    return '';
                })
                .filter(method => method !== '');
            if (validatedTags.length === 0) {
                alert('At least one valid tag is required.');
                return;
            }
            if (validatedProcessingMethods.length === 0) {
                alert('At least one valid processing method is required.');
                return;
            }
            // Validate samples
            for (const sample of samples) {
                if (!sample.farmName?.trim()) {
                    alert('Each sample must have a valid farm name.');
                    return;
                }
                
                // All samples require a farmer ID
                const farmerIdStr = String(sample.farmerId || '').trim();
                const farmerId = parseInt(farmerIdStr, 10);
                if (!farmerIdStr || isNaN(farmerId) || farmerId <= 0) {
                    alert('Each sample must have a valid farmer selected. Please select a farmer from the dropdown.');
                    return;
                }

                if (!sample.region?.trim()) {
                    alert('Each sample must have a valid region.');
                    return;
                }
                if (!sample.variety?.trim()) {
                    alert('Each sample must have a valid variety.');
                    return;
                }
                if (!sample.processingMethod?.trim()) {
                    alert('Each sample must have a valid processing method.');
                    return;
                }
                if (typeof sample.altitude !== 'number' || sample.altitude <= 0) {
                    alert('Each sample must have a valid altitude greater than 0.');
                    return;
                }
                if (typeof sample.moisture !== 'number' || sample.moisture <= 0) {
                    alert('Each sample must have a valid moisture level greater than 0.');
                    return;
                }
            }

            // Construct the new event payload
            // Collect all farmer IDs from samples and assigned participants
            const uniqueFarmerIds = Array.from(new Set(samples
                .filter(s => s.farmerId)
                .map(s => String(s.farmerId).trim())
                .filter(id => id && id !== '0')
                .concat(participants.assignedFarmerIds || [])
            )).map(id => parseInt(id, 10));
            
            const newEvent = {
                name: eventDetails.name.trim(),
                date: eventDetails.date,
                description: eventDetails.description?.trim() || '', // Allow empty description
                tags: validatedTags,
                processingMethods: validatedProcessingMethods,
                assignedQGraderIds: participants.assignedQGraderIds,
                assignedHeadJudgeIds: participants.assignedHeadJudgeIds,
                assignedFarmerIds: uniqueFarmerIds,
                samples: samples.map(sample => ({
                    ...sample,
                    farmerId: sample.farmerId,
                    region: sample.region?.trim(),
                    blindCode: `${eventDetails.name.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    sampleType: 'PROXY_SUBMISSION', // All samples are now proxy submissions
                })).map(({ id, ...rest }) => rest), // Remove the id field
            };

            console.log('Refined event payload:', JSON.stringify(newEvent, null, 2));

            try {
                // Submit the event
                let response = await axios.post('/api/cupping-events', newEvent, { withCredentials: true });
                const createdEventId = response.data.id;

                // Build payload that matches NewFullEventData expected by App.createFullEvent
                const clientSamples = (newEvent.samples || []).map(s => ({
                    ...s,
                    // keep farmerId as string for client-side state
                    farmerId: String(s.farmerId),
                }));
                const fullEventPayload = {
                    eventDetails: {
                        name: newEvent.name,
                        date: newEvent.date,
                        description: newEvent.description,
                        tags: validatedTags.map(t => ({ id: `tag-${t}`, tag: t })), // normalize to object shape for client
                        processingMethods: validatedProcessingMethods,
                    },
                    assignedQGraderIds: newEvent.assignedQGraderIds || [],
                    assignedHeadJudgeIds: newEvent.assignedHeadJudgeIds || [],
                    assignedFarmerIds: uniqueFarmerIds.map(id => String(id)),
                    samples: clientSamples,
                };

                onSubmit(fullEventPayload as any);
                try { onClose(); } catch (e) { /* ignore */ }
                resetWizard();

                // Attempt to submit samples, but do not block closing on failure
                if (newEvent.samples && newEvent.samples.length > 0) {
                    try {
                        const updatedSamples = newEvent.samples.map(sample => ({
                            ...sample,
                            eventId: createdEventId,
                        }));
                        console.log('Payload being sent to /api/cupping-events/:id/samples:', JSON.stringify(updatedSamples, null, 2));
                        await axios.post(`/api/cupping-events/${createdEventId}/samples`, updatedSamples, { withCredentials: true });
                        console.log('Samples added successfully for event', createdEventId);
                    } catch (sampleErr) {
                        console.error('Failed to add samples after event creation:', sampleErr);
                        // Optionally notify the user, but do not reopen the wizard
                        // alert('Event created but failed to add some samples. Please add them manually.');
                    }
                }
                
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error('Error creating event or samples:', error.message);
                    if (error.response && error.response.data) {
                        alert(`Error: ${error.response.data.message}`);
                    }
                } else {
                    console.error('Unexpected error:', error);
                }
                // Keep the wizard open so the user can fix the issue
            }
        } catch (error) {
            console.error('Error during final submission:', error);
        }
    };

    const handleUpdateParticipants = (updatedParticipants: { assignedQGraderIds: string[]; assignedHeadJudgeIds: string[]; assignedFarmerIds?: string[] }) => {
        console.log('Updating participants state (raw):', updatedParticipants); // Debugging log
        setParticipants({
            assignedQGraderIds: updatedParticipants.assignedQGraderIds || [],
            assignedHeadJudgeIds: updatedParticipants.assignedHeadJudgeIds || [],
            assignedFarmerIds: updatedParticipants.assignedFarmerIds || [],
        });
    };

    const renderStep = () => {
        switch (step) {
            case 'details':
                return <Step1Details data={eventDetails} onUpdate={setEventDetails} />;
            case 'participants':
                return <Step2Participants data={participants} onUpdate={handleUpdateParticipants} headJudges={headJudges} qGraders={qGraders} farmers={farmers} />;
            case 'samples':
                return (
                    <Step3Samples
                        data={samples}
                        onUpdate={setSamples}
                        farmers={farmers}
                        processingMethods={(eventDetails.processingMethods || []).map(method => 
                            typeof method === 'string' ? method : (method as any)?.method || ''
                        ).filter(m => m)}
                    />
                );
            default:
                return null;
        }
    };

    const handleFinishAndActivate = () => {
        if (samples.length === 0) {
            setIsSkipConfirmModalOpen(false); // Close skip confirmation modal if open
            handleFinalSubmit();
        } else {
            handleFinalSubmit();
        }
    };

    const isNextDisabled = () => {
        switch (step) {
            case 'details':
                return !eventDetails.name || !eventDetails.date;
            case 'participants':
                return participants.assignedHeadJudgeIds.length === 0 || participants.assignedQGraderIds.length === 0;
            default:
                return false; // Always enable the button for the 'samples' step
        }
    };

    const stepTitles: Record<WizardStep, string> = {
        details: 'Step 1 of 3: Event Information', // Changed from Event Details
        participants: 'Step 2 of 3: Assign Participants', // Changed from Manage Participants
        samples: 'Step 3 of 3: Add Coffee Samples', // Changed from Register Coffee Samples
        confirm: 'Confirmation'
    };

    const stepIndicator = (
        <div className="flex justify-center items-center space-x-4 mb-4">
            {Object.keys(stepTitles).slice(0, 3).map((s, index) => {
                const stepNumber = index + 1;
                const currentStepNumber = ['details', 'participants', 'samples'].indexOf(step) + 1;
                const isCompleted = stepNumber < currentStepNumber;
                const isActive = stepNumber === currentStepNumber;

                return (
                    <React.Fragment key={s}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-border text-text-light'}`}>
                                {isCompleted ? <CheckCircle size={18} /> : stepNumber}
                            </div>
                            <span className={`ml-2 text-sm font-semibold ${isActive ? 'text-primary' : 'text-text-light'}`}>{stepTitles[s as WizardStep].split(': ')[1]}</span>
                        </div>
                        {index < 2 && <div className="h-0.5 w-16 bg-border"></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Cupping Event" size="full">
            <div className="h-full flex flex-col">
                {stepIndicator}
                <div className="flex-grow overflow-y-auto p-2">
                    {renderStep()}
                </div>
                <div className="p-4 border-t border-border mt-auto flex justify-between items-center bg-background -m-6 px-6 pt-4">
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                    <div className="flex items-center space-x-2">
                        {step !== 'details' && <Button variant="secondary" onClick={() => setStep(step === 'participants' ? 'details' : 'participants')}>Back</Button>}
                        {step !== 'samples' ? (
                            <Button onClick={() => setStep(step === 'details' ? 'participants' : 'samples')} disabled={isNextDisabled()}>Next</Button>
                        ) : (
                            <Button onClick={handleFinishAndActivate} disabled={isNextDisabled()}>Finish & Activate Event</Button>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm & Activate Event">
                <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
                        <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold text-yellow-800">This action cannot be undone.</h4>
                            <p className="text-sm text-yellow-700">Activating the event will generate blind codes, lock the sample list, and prepare the event for cupping.</p>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold text-lg">Event Summary</h3>
                        <p><strong>Name:</strong> {eventDetails.name}</p>
                        <p><strong>Total Samples:</strong> {samples.length}</p>
                        <p><strong>Head Judges:</strong> {participants.assignedHeadJudgeIds.length}</p>
                        <p><strong>Q Graders:</strong> {participants.assignedQGraderIds.length}</p>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleFinalSubmit}>Confirm & Activate</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSkipConfirmModalOpen} onClose={() => setIsSkipConfirmModalOpen(false)} title="Skip Adding Samples">
                <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
                        <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold text-yellow-800">Are you sure you want to skip adding samples?</h4>
                            <p className="text-sm text-yellow-700">You can add samples later, but skipping this step now means the event will be activated without any samples.</p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsSkipConfirmModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            setIsSkipConfirmModalOpen(false);
                            handleFinalSubmit();
                        }}>Skip & Proceed</Button>
                    </div>
                </div>
            </Modal>
        </Modal>
    );
};

export default EventCreationWizard;
