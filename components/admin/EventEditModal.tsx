import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import axios from 'axios';
import { CuppingEvent } from '../../types';
import { EventDetailsUpdateData } from '../../App';

interface EventEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CuppingEvent | null;
    onUpdate: (eventId: string, data: EventDetailsUpdateData) => void;
}

const EventEditModal: React.FC<EventEditModalProps> = ({ isOpen, onClose, event, onUpdate }) => {
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

    // Initialize form when modal opens with event data
    useEffect(() => {
        if (isOpen && event) {
            // Format date to YYYY-MM-DD for HTML date input
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

            const processingMethodsArray = Array.isArray(event.processingMethods) 
                ? event.processingMethods.filter(m => typeof m === 'string')
                : [];
            
            const tagsArray = Array.isArray(event.tags) 
                ? event.tags.map(t => (typeof t === 'string' ? t : (t as any).tag || '')).filter(t => t)
                : [];

            setFormData({
                name: event.name || '',
                date: formattedDate,
                description: event.description || '',
                processingMethods: processingMethodsArray,
                tags: tagsArray,
            });
        }
    }, [event, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target as HTMLInputElement;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (name: 'processingMethods' | 'tags', value: string[]) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
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
            const response = await axios.put(`/api/cupping-events/${event.id}`, payload, { withCredentials: true });
            // Notify parent to update state using the updated server response or payload
            onUpdate(event.id, payload);
            onClose();
        } catch (err: unknown) {
            let message = String(err);
            if (axios.isAxiosError(err)) {
                message = err.response?.data?.message || err.message;
            }
            console.error('Error updating event:', message);
            alert(`Failed to update event: ${message}`);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Event">
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
