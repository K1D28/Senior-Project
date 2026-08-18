import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import axios from 'axios';
import { CoffeeSample, CuppingEvent, Role } from '../../types';
import type { AppData } from '../../data';
import type { EventDetailsUpdateData, EventSamplesUpdateData } from '../../App';
import { BACKEND_URL } from '../../utils/api';

interface EventEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CuppingEvent | null;
    onUpdate: (eventId: string, data: EventDetailsUpdateData) => void;
    appData: AppData;
    onUpdateSamples: (data: EventSamplesUpdateData) => void;
}

const EventEditModal: React.FC<EventEditModalProps> = ({ isOpen, onClose, event, onUpdate, appData, onUpdateSamples }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [canAddPaperSamples, setCanAddPaperSamples] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        date: string;
        description: string;
        processingMethods: string[];
        tags: string[];
    }>({
        name: '',
        date: '',
        description: '',
        processingMethods: [],
        tags: [],
    });
    const [offlineDraft, setOfflineDraft] = useState({
        farmName: '',
        variety: '',
        region: '',
        processingMethod: '',
        altitude: '',
        moisture: '',
        farmerId: '',
        offlineFarmerName: '',
        offlineFarmerTag: '',
        offlineSubmissionRef: '',
    });

    // Initialize form when modal opens with event data
    useEffect(() => {
        const loadEventData = async () => {
            if (!isOpen || !event) return;

            setIsLoading(true);
            const startTime = Date.now();
            try {
                // Fetch fresh event data from backend to ensure we have latest tags/methods
                const token = localStorage.getItem('token');
                const response = await axios.get(`${BACKEND_URL}/api/cupping-events/${event.id}`, {
                    withCredentials: true,
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                const freshEvent = response.data;

                // Format date to YYYY-MM-DD for HTML date input
                let formattedDate = '';
                if (freshEvent.date) {
                    try {
                        const dateObj = new Date(freshEvent.date);
                        if (!isNaN(dateObj.getTime())) {
                            formattedDate = dateObj.toISOString().split('T')[0];
                        }
                    } catch (e) {
                        formattedDate = freshEvent.date;
                    }
                }

                // Handle processingMethods - could be array of strings, objects with `method` property, or undefined
                let processingMethodsArray: string[] = [];
                if (Array.isArray(freshEvent.processingMethods)) {
                    processingMethodsArray = freshEvent.processingMethods
                        .map((m: any) => typeof m === 'string' ? m : (m as any).method || '')
                        .filter((m: any) => m);
                }

                // Handle tags - could be array of strings, objects with `tag` property, or undefined
                let tagsArray: string[] = [];
                if (Array.isArray(freshEvent.tags)) {
                    tagsArray = freshEvent.tags
                        .map((t: any) => typeof t === 'string' ? t : (t as any).tag || '')
                        .filter((t: any) => t);
                }

                console.log('Loaded fresh event data:', {
                    processingMethods: processingMethodsArray,
                    tags: tagsArray
                });

                setFormData({
                    name: freshEvent.name || '',
                    date: formattedDate,
                    description: freshEvent.description || '',
                    processingMethods: processingMethodsArray,
                    tags: tagsArray,
                });
                setCanAddPaperSamples(!Boolean(freshEvent.isResultsRevealed));
                setOfflineDraft({
                    farmName: '',
                    variety: '',
                    region: '',
                    processingMethod: processingMethodsArray[0] || '',
                    altitude: '',
                    moisture: '',
                    farmerId: '',
                    offlineFarmerName: '',
                    offlineFarmerTag: '',
                    offlineSubmissionRef: '',
                });
            } catch (error) {
                console.error('Error loading event data:', error);
                // Fallback to local event object if fetch fails
                let formattedDate = '';
                if (event.date) {
                    try {
                        const dateObj = new Date(event.date);
                        if (!isNaN(dateObj.getTime())) {
                            formattedDate = dateObj.toISOString().split('T')[0];
                        }
                    } catch (e) {
                        formattedDate = event.date;
                    }
                }

                let processingMethodsArray: string[] = [];
                if (Array.isArray(event.processingMethods)) {
                    processingMethodsArray = event.processingMethods
                        .map((m: any) => typeof m === 'string' ? m : (m as any).method || '')
                        .filter((m: any) => m);
                }

                let tagsArray: string[] = [];
                if (Array.isArray(event.tags)) {
                    tagsArray = event.tags
                        .map((t: any) => typeof t === 'string' ? t : (t as any).tag || '')
                        .filter((t: any) => t);
                }

                setFormData({
                    name: event.name || '',
                    date: formattedDate,
                    description: event.description || '',
                    processingMethods: processingMethodsArray,
                    tags: tagsArray,
                });
                setCanAddPaperSamples(!Boolean(event.isResultsRevealed));
                setOfflineDraft({
                    farmName: '',
                    variety: '',
                    region: '',
                    processingMethod: processingMethodsArray[0] || '',
                    altitude: '',
                    moisture: '',
                    farmerId: '',
                    offlineFarmerName: '',
                    offlineFarmerTag: '',
                    offlineSubmissionRef: '',
                });
            } finally {
                // Ensure loading shows for at least 500ms for better UX
                const elapsedTime = Date.now() - startTime;
                const remainingDelay = Math.max(0, 500 - elapsedTime);
                setTimeout(() => {
                    setIsLoading(false);
                }, remainingDelay);
            }
        };

        loadEventData();
    }, [event, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (name: 'processingMethods' | 'tags', value: string[]) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetOfflineDraft = () => {
        setOfflineDraft({
            farmName: '',
            variety: '',
            region: '',
            processingMethod: formData.processingMethods[0] || '',
            altitude: '',
            moisture: '',
            farmerId: '',
            offlineFarmerName: '',
            offlineFarmerTag: '',
            offlineSubmissionRef: '',
        });
    };

    useEffect(() => {
        if (formData.processingMethods.length > 0) {
            setOfflineDraft(prev => prev.processingMethod ? prev : { ...prev, processingMethod: formData.processingMethods[0] });
        }
    }, [formData.processingMethods]);

    const handleAddPaperSample = async () => {
        if (!event) return;

        if (!canAddPaperSamples) {
            alert('Paper-based samples can only be added while the event is in progress.');
            return;
        }

        const farmName = offlineDraft.farmName.trim();
        const variety = offlineDraft.variety.trim();
        const region = offlineDraft.region.trim();
        const processingMethod = offlineDraft.processingMethod.trim();
        const altitude = Number(offlineDraft.altitude);
        const moisture = offlineDraft.moisture.trim() === '' ? undefined : Number(offlineDraft.moisture);
        const farmerId = offlineDraft.farmerId.trim();
        const offlineFarmerName = offlineDraft.offlineFarmerName.trim();
        const offlineFarmerTag = offlineDraft.offlineFarmerTag.trim();
        const offlineSubmissionRef = offlineDraft.offlineSubmissionRef.trim();

        if (!farmName || !variety || !region || !processingMethod || !Number.isFinite(altitude) || altitude <= 0) {
            alert('Please complete Farm Name, Variety, Region, Processing Method, and Altitude.');
            return;
        }

        if (!farmerId && !offlineFarmerName) {
            alert('Please select a farmer or provide an offline farmer name.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const samplePayload = {
                farmName,
                variety,
                region,
                processingMethod,
                altitude,
                moisture,
                farmerId: farmerId ? parseInt(farmerId, 10) : null,
                sampleType: 'PAPER_BASED_OFFLINE',
                offlineFarmerName: offlineFarmerName || null,
                offlineFarmerTag: offlineFarmerTag || null,
                offlineSubmissionRef: offlineSubmissionRef || null,
            };

            const response = await axios.post(`${BACKEND_URL}/api/cupping-events/${event.id}/samples`, {
                samples: [samplePayload],
            }, {
                withCredentials: true,
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            const createdSamples = Array.isArray(response.data) ? response.data : [];
            const currentEventSampleIds = new Set((event.sampleIds || []).map(id => String(id)));
            const currentEventSamples = appData.samples.filter(sample => currentEventSampleIds.has(String(sample.id)));
            const normalizedCreatedSamples = createdSamples.map((sample: any) => ({
                ...sample,
                id: String(sample.id),
                farmerId: sample.farmerId !== undefined && sample.farmerId !== null ? String(sample.farmerId) : null,
            })) as CoffeeSample[];

            onUpdateSamples({
                eventId: event.id,
                samples: [...currentEventSamples, ...normalizedCreatedSamples],
            });

            resetOfflineDraft();
            alert('Paper-based sample added successfully.');
        } catch (error) {
            console.error('Error adding paper-based sample:', error);
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.message || error.message || 'Failed to add paper-based sample.');
            } else {
                alert('Failed to add paper-based sample.');
            }
        }
    };

    const validatePayload = (data: typeof formData) => {
        const errors: string[] = [];
        if (!data.name.trim()) errors.push('Event name is required.');
        if (!data.date.trim()) errors.push('Event date is required.');
        if (!Array.isArray(data.tags) || data.tags.length === 0) errors.push('At least one tag is required.');
        if (!Array.isArray(data.processingMethods) || data.processingMethods.length === 0) errors.push('At least one processing method is required.');
        return errors;
    };

    const handleSubmit = async () => {
        if (!event) {
            alert('No event selected to edit.');
            return;
        }

        const validationErrors = validatePayload(formData);
        if (validationErrors.length > 0) {
            alert(`Validation Errors:\n${validationErrors.join('\n')}`);
            return;
        }

        try {
            // Normalize tags to string[] for backend
            const payload: EventDetailsUpdateData = {
                name: formData.name,
                date: formData.date,
                description: formData.description,
                processingMethods: formData.processingMethods,
                tags: Array.isArray(formData.tags) ? formData.tags.map(t => typeof t === 'string' ? t : (t as any).tag) : undefined,
            };
            
            console.log('Sending payload:', payload);
            
            const token = localStorage.getItem('token');
            const response = await axios.put(`${BACKEND_URL}/api/cupping-events/${event.id}`, payload, {
                withCredentials: true,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            
            console.log('Update response:', response.data);
            
            // Notify parent to update state using the updated server response
            onUpdate(event.id, payload);
            
            alert('Event updated successfully!');
            onClose();
        } catch (err: unknown) {
            let message = String(err);
            if (axios.isAxiosError(err)) {
                message = err.response?.data?.message || err.message;
                console.error('Error response:', err.response?.data);
            }
            console.error('Error updating event:', message);
            alert(`Failed to update event: ${message}`);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Event">
            {isLoading && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-blue-800">Loading event data...</span>
                </div>
            )}
            <div className="space-y-4">
                <div>
                    <Label htmlFor="name">Event Name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter event name"
                    />
                </div>
                <div>
                    <Label htmlFor="date">Event Date</Label>
                    <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter event description"
                    />
                </div>
                <div>
                    <Label>Processing Methods</Label>
                    <div className="space-y-2 p-3 border border-border rounded-md bg-background">
                        {['Washed', 'Natural', 'Honey', 'Experimental', 'Semi-Washed'].map((method) => (
                            <div key={method} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`method-${method}`}
                                    checked={formData.processingMethods.includes(method)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            handleArrayChange('processingMethods', [...formData.processingMethods, method]);
                                        } else {
                                            handleArrayChange('processingMethods', formData.processingMethods.filter(m => m !== method));
                                        }
                                    }}
                                    className="w-4 h-4 rounded border-border"
                                />
                                <label htmlFor={`method-${method}`} className="ml-2 cursor-pointer text-sm">
                                    {method}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <Label>Event Tags</Label>
                    <div className="space-y-2 p-3 border border-border rounded-md bg-background">
                        {['Regional', 'Championship', 'Experimental', 'Private QC'].map((tag) => (
                            <div key={tag} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`tag-${tag}`}
                                    checked={formData.tags.includes(tag)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            handleArrayChange('tags', [...formData.tags, tag]);
                                        } else {
                                            handleArrayChange('tags', formData.tags.filter(t => t !== tag));
                                        }
                                    }}
                                    className="w-4 h-4 rounded border-border"
                                />
                                <label htmlFor={`tag-${tag}`} className="ml-2 cursor-pointer text-sm">
                                    {tag}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                {canAddPaperSamples && (
                    <div className="p-4 border border-blue-200 rounded-md bg-blue-50 space-y-4">
                        <div>
                            <h4 className="font-semibold text-blue-900">Add Paper-Based Sample</h4>
                            <p className="text-xs text-blue-800 mt-1">Paper-based samples can be added while the event is in progress.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="paper-farmName">Farm Name</Label>
                                <Input id="paper-farmName" value={offlineDraft.farmName} onChange={(e) => setOfflineDraft(prev => ({ ...prev, farmName: e.target.value }))} placeholder="Farm name" />
                            </div>
                            <div>
                                <Label htmlFor="paper-variety">Variety</Label>
                                <Input id="paper-variety" value={offlineDraft.variety} onChange={(e) => setOfflineDraft(prev => ({ ...prev, variety: e.target.value }))} placeholder="Variety" />
                            </div>
                            <div>
                                <Label htmlFor="paper-region">Region</Label>
                                <Input id="paper-region" value={offlineDraft.region} onChange={(e) => setOfflineDraft(prev => ({ ...prev, region: e.target.value }))} placeholder="Region" />
                            </div>
                            <div>
                                <Label htmlFor="paper-processing">Processing Method</Label>
                                <select
                                    id="paper-processing"
                                    className="w-full p-2 border border-border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background"
                                    value={offlineDraft.processingMethod}
                                    onChange={(e) => setOfflineDraft(prev => ({ ...prev, processingMethod: e.target.value }))}
                                >
                                    <option value="">Select method...</option>
                                    {formData.processingMethods.map(method => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="paper-altitude">Altitude (m)</Label>
                                <Input id="paper-altitude" type="number" value={offlineDraft.altitude} onChange={(e) => setOfflineDraft(prev => ({ ...prev, altitude: e.target.value }))} placeholder="Altitude" />
                            </div>
                            <div>
                                <Label htmlFor="paper-moisture">Moisture (%)</Label>
                                <Input id="paper-moisture" type="number" step="0.1" value={offlineDraft.moisture} onChange={(e) => setOfflineDraft(prev => ({ ...prev, moisture: e.target.value }))} placeholder="Moisture" />
                            </div>
                            <div>
                                <Label htmlFor="paper-farmer">Linked Farmer (optional)</Label>
                                <select
                                    id="paper-farmer"
                                    className="w-full p-2 border border-border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background"
                                    value={offlineDraft.farmerId}
                                    onChange={(e) => setOfflineDraft(prev => ({ ...prev, farmerId: e.target.value }))}
                                >
                                    <option value="">No linked farmer</option>
                                    {appData.users.filter(user => user.roles.includes(Role.FARMER)).map(farmer => (
                                        <option key={farmer.id} value={farmer.id}>{farmer.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="paper-offline-name">Offline Farmer Name</Label>
                                <Input id="paper-offline-name" value={offlineDraft.offlineFarmerName} onChange={(e) => setOfflineDraft(prev => ({ ...prev, offlineFarmerName: e.target.value }))} placeholder="Name on paper form" />
                            </div>
                            <div>
                                <Label htmlFor="paper-offline-tag">Offline Farmer Tag</Label>
                                <Input id="paper-offline-tag" value={offlineDraft.offlineFarmerTag} onChange={(e) => setOfflineDraft(prev => ({ ...prev, offlineFarmerTag: e.target.value }))} placeholder="Village/co-op tag" />
                            </div>
                            <div>
                                <Label htmlFor="paper-offline-ref">Offline Submission Ref</Label>
                                <Input id="paper-offline-ref" value={offlineDraft.offlineSubmissionRef} onChange={(e) => setOfflineDraft(prev => ({ ...prev, offlineSubmissionRef: e.target.value }))} placeholder="Paper reference" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="button" onClick={handleAddPaperSample}>Add Paper-Based Sample</Button>
                        </div>
                    </div>
                )}
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default EventEditModal;
