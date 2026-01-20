import React, { useState, useEffect, useMemo, Component, ErrorInfo } from 'react';
import axios from 'axios';
import { User, Role, CuppingEvent, Farmer, QGrader, Admin, HeadJudge } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { UserPlus, Search, Filter, MoreHorizontal, Calendar, Key, UserX, Send } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Label } from '../ui/Label';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mbmilbbdjywnmagxfcyg.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibWlsYmJkanl3bm1hZ3hmY3lnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAzNzgxOSwiZXhwIjoyMDc4NjEzODE5fQ.tPwy3VsVQfqUdHboJ_jT5jk8QyT5o1CBAHR4dCZvCQ4'
);
const prisma = new PrismaClient();

interface UserManagementProps {
    users: User[];
    events: CuppingEvent[];
    onViewUser: (userId: string) => void;
    onAddUser: (data: { emails: string[]; roles: Role[] }) => void;
    onUpdateUsersStatus: (userIds: string[], status: User['status']) => void;
    onAssignUsersToEvent: (userIds: string[], eventId: string) => void;
    onUpdateUserRoles: (userId: string, roles: Role[]) => void;
}

const RoleTag = ({ role }: { role: Role }) => {
  const colors: Record<Role, string> = {
    [Role.ADMIN]: 'bg-red-100 text-red-800',
    [Role.HEAD_JUDGE]: 'bg-purple-100 text-purple-800',
    [Role.Q_GRADER]: 'bg-blue-100 text-blue-800',
    [Role.FARMER]: 'bg-green-100 text-green-800',
  };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[role]}`}>{role}</span>;
};

const StatusTag = ({ status }: { status: User['status'] }) => {
  const colors: Record<User['status'], string> = {
    'Active': 'bg-green-100 text-green-800',
    'Pending Invitation': 'bg-yellow-100 text-yellow-800',
    'Deactivated': 'bg-gray-100 text-gray-800',
  };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status]}`}>{status}</span>;
};

const UserManagement: React.FC<UserManagementProps> = ({ events, onViewUser, onAddUser, onUpdateUsersStatus, onAssignUsersToEvent, onUpdateUserRoles }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState<User['status'] | 'All'>('All');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [newUserEmails, setNewUserEmails] = useState('');
    const [newUserRoles, setNewUserRoles] = useState<Role[]>([]);
    const [newUserStatus, setNewUserStatus] = useState('Active');
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [editedUser, setEditedUser] = useState<User | null>(null);
    const [newUserName, setNewUserName] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/users', { withCredentials: true });
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    const handleNextStep = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleAddUserSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const email = newUserEmails.trim(); // Use a single email instead of an array
        const role = newUserRoles[0]; // Use the first role from the array
        if (!email || !role || !newUserStatus || !newUserName || !newUserPassword) {
            alert('Please provide name, email, role, password, and a status.');
            return;
        }
        try {
            const response = await axios.post('http://localhost:5001/api/users', {
                name: newUserName,
                email, // Send single email
                role, // Send single role
                password: newUserPassword,
                status: newUserStatus,
            }, { withCredentials: true });

            if (response.status === 201) {
                alert('User added successfully.');
                setUsers((prevUsers) => [...prevUsers, response.data]);
            } else {
                alert('Failed to add user.');
            }
        } catch (error) {
            console.error('Unexpected error adding user:', error);
            alert('Failed to add user.');
        }
    };

    const handleAddUser = async (user: User) => {
        try {
            await axios.post('http://localhost:5001/api/users', user, { withCredentials: true });
            const updatedUsers = await axios.get('http://localhost:5001/api/users', { withCredentials: true });
            setUsers(updatedUsers.data.farmers.concat(updatedUsers.data.qGraders));
        } catch (error) {
            console.error('Error adding users:', error);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!Array.isArray(users)) {
            console.error('Expected users to be an array, but got:', users);
            return [];
        }
        console.log('Role filter value:', roleFilter); // Debugging log
        users.forEach(user => console.log('User roles:', user.roles)); // Debugging log

        const result = users.filter(user => {
            const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'All' || (Array.isArray(user.roles) && user.roles.some(role => role.toLowerCase() === roleFilter.toLowerCase()));
            const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
        console.log('Filtered users after applying role filter:', result); // Debugging log
        return result;
    }, [users, searchTerm, roleFilter, statusFilter]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUserIds(filteredUsers.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelectOne = (userId: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedUserIds(prev => [...prev, userId]);
        } else {
            setSelectedUserIds(prev => prev.filter(id => id !== userId));
        }
    };
    
    const handleAssignToEvent = () => {
        const eventId = prompt("Enter the ID of the event to assign users to:", events.length > 0 ? events[0].id : '');
        if (eventId && events.some(e => e.id === eventId)) {
            onAssignUsersToEvent(selectedUserIds, eventId);
            setSelectedUserIds([]);
        } else if (eventId) {
            alert("Invalid Event ID.");
        }
    };

    const handleUpdateUserRoles = async (userId: string, roles: Role[]) => {
        try {
            await axios.put(`/api/users/${roles[0].toLowerCase()}/${userId}`, { roles }, { withCredentials: true });
            const updatedUsers = await axios.get('/api/users', { withCredentials: true });
            setUsers(updatedUsers.data.farmers.concat(updatedUsers.data.qGraders));
        } catch (error) {
            console.error('Error updating user roles:', error);
        }
    };

    const handleEditRoles = (userId: string) => {
        const availableRoles: Role[] = [Role.HEAD_JUDGE, Role.Q_GRADER, Role.FARMER]; // Use enum values for Role
        const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedRoles = Array.from(e.target.selectedOptions, option => option.value as Role);
            handleUpdateUserRoles(userId, selectedRoles);
        };

        const roleSelectionModal = (
            <Modal
                isOpen={true}
                title="Edit User Roles"
                onClose={() => {}}
            >
                <Label htmlFor="roles">Select Roles</Label>
                <Select
                    id="roles"
                    multiple
                    onChange={handleRoleChange}
                    defaultValue={[]}
                >
                    {availableRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </Select>
                <div className="flex justify-end mt-4">
                    <Button onClick={() => {}}>Close</Button>
                </div>
            </Modal>
        );

        // Render the modal
        // This assumes you have a mechanism to render the modal dynamically
        console.log('Render role selection modal:', roleSelectionModal);
    };

    const handleEditUserClick = (user: User) => {
        setEditedUser(user); // Set the user to be edited
    };

    const handleEditUserSave = async (updatedData: { name: string; email: string; roles: Role[]; status: User['status'] }) => {
        if (!editedUser) return;
        try {
            await axios.put(`http://localhost:5001/api/users/${editedUser.id}`, updatedData, { withCredentials: true });
            alert('User updated successfully.');
            setUsers((prevUsers) => prevUsers.map(user => user.id === editedUser.id ? { ...user, ...updatedData } : user));
            setEditedUser(null); // Close the modal
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user.');
        }
    };

    const handleEditUser = async (userId: string, updatedData: { name: string; status: User['status'] }) => {
        try {
            await axios.put(`http://localhost:5001/api/users/${userId}`, updatedData, { withCredentials: true });
            alert('User updated successfully.');
            setUsers((prevUsers) => prevUsers.map(user => user.id === userId ? { ...user, ...updatedData } : user));
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user.');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:5001/api/users/${userId}`, { withCredentials: true });
                alert('User deleted successfully.');
                setUsers((prevUsers) => prevUsers.filter(user => user.id !== userId));
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user.');
            }
        }
    };

    const EditUserModal: React.FC<{ user: User; onClose: () => void; onSave: (updatedData: { name: string; email: string; roles: Role[]; status: User['status'] }) => void }> = ({ user, onClose, onSave }) => {
        const [editedName, setEditedName] = useState(user.name);
        const [editedEmail, setEditedEmail] = useState(user.email);
        const [editedRoles, setEditedRoles] = useState<Role[]>(user.roles || []);
        const [editedStatus, setEditedStatus] = useState<User['status']>(user.status);

        const handleSave = () => {
            onSave({
                name: editedName,
                email: editedEmail,
                roles: editedRoles,
                status: editedStatus,
            });
        };

        return (
            <Modal
                isOpen={true}
                title="Edit User"
                onClose={onClose}
            >
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                />

                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                />

                <Label htmlFor="roles">Roles</Label>
                <Select
                    id="roles"
                    multiple
                    value={editedRoles}
                    onChange={(e) => setEditedRoles(Array.from(e.target.selectedOptions, option => option.value as Role))}
                >
                    <option value="FARMER">Farmer</option>
                    <option value="Q_GRADER">Q Grader</option>
                    <option value="HEAD_JUDGE">Head Judge</option>
                </Select>

                <Label htmlFor="status">Status</Label>
                <Select
                    id="status"
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value as User['status'])}
                >
                    <option value="Active">Active</option>
                    <option value="Pending Invitation">Pending Invitation</option>
                    <option value="Deactivated">Deactivated</option>
                </Select>

                <div className="flex justify-end mt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    {editedStatus !== 'Active' && (
                        <Button
                            variant="primary"
                            onClick={async () => {
                                try {
                                    const res = await axios.post(`http://localhost:5001/api/users/${user.id}/confirm`, {}, { withCredentials: true });
                                    if (res.status === 200) {
                                        alert('User confirmed successfully.');
                                        setEditedStatus('Active');
                                        onSave({ name: editedName, email: editedEmail, roles: editedRoles, status: 'Active' });
                                    } else {
                                        alert('Failed to confirm user.');
                                    }
                                } catch (err) {
                                    console.error('Error confirming user:', err);
                                    alert('Failed to confirm user.');
                                }
                            }}
                        >
                            Confirm User
                        </Button>
                    )}
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </Modal>
        );
    };

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold">User Management</h3>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsAddUserModalOpen(true)} className="flex items-center gap-2">
                        <UserPlus size={16} /> Add New Users
                    </Button>
                </div>
            </div>

            {isAddUserModalOpen && (
                <Modal
                    isOpen={isAddUserModalOpen}
                    title="Add New Users"
                    onClose={() => {
                        setIsAddUserModalOpen(false);
                        setCurrentStep(1);
                    }}
                >
                    {currentStep === 1 && (
                        <div>
                            <h3 className="text-lg font-bold mb-4">Step 1: Enter User Details</h3>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Enter user's name"
                            />
                            <Label htmlFor="emails" className="mt-4">Email</Label>
                            <Input
                                id="emails"
                                value={newUserEmails}
                                onChange={(e) => setNewUserEmails(e.target.value)}
                                placeholder="e.g., user1@example.com"
                            />
                            <Label htmlFor="password" className="mt-4">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                placeholder="Set a password"
                            />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <h3 className="text-lg font-bold mb-4">Step 2: Assign Roles and Status</h3>
                            <Label htmlFor="roles">Assign Roles</Label>
                            <Select
                                id="roles"
                                multiple
                                value={newUserRoles}
                                onChange={(e) => setNewUserRoles(Array.from(e.target.selectedOptions, option => option.value as Role))}
                            >
                                <option value="FARMER">Farmer</option>
                                <option value="Q_GRADER">Q Grader</option>
                                <option value="HEAD_JUDGE">Head Judge</option>
                                <option value="ADMIN">Administrator</option>
                            </Select>

                            <Label htmlFor="status" className="mt-4">Assign Status</Label>
                            <Select
                                id="status"
                                value={newUserStatus}
                                onChange={(e) => setNewUserStatus(e.target.value)}
                            >
                                <option value="Active">Active</option>
                                <option value="Pending Invitation">Pending Invitation</option>
                                <option value="Deactivated">Deactivated</option>
                            </Select>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <h3 className="text-lg font-bold mb-4">Step 3: Add to Event (Optional)</h3>
                            <Label htmlFor="event">Select Event</Label>
                            <Select
                                id="event"
                                value={selectedEventId || ''}
                                onChange={(e) => setSelectedEventId(e.target.value || null)}
                            >
                                <option value="">Don't add to an event</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>{event.name}</option>
                                ))}
                            </Select>
                        </div>
                    )}

                    <div className="flex justify-between mt-4">
                        <Button variant="secondary" onClick={handlePreviousStep} disabled={currentStep === 1}>Back</Button>
                        {currentStep < 3 ? (
                            <Button onClick={handleNextStep}>Next</Button>
                        ) : (
                            <Button onClick={handleAddUserSubmit}>Submit</Button>
                        )}
                    </div>
                </Modal>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-background rounded-lg border border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                    <Input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <div>
                    <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | 'All')}>
                        <option value="All">Filter by Role: All</option>
                        {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                    </Select>
                </div>
                <div>
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as User['status'] | 'All')}>
                        <option value="All">Filter by Status: All</option>
                        <option value="Active">Active</option>
                        <option value="Pending Invitation">Pending Invitation</option>
                        <option value="Deactivated">Deactivated</option>
                    </Select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="p-2 w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length} /></th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Roles</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Last Login</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <tr key={`${user.id}-${user.roles?.[0] || 'unknown'}`} className="border-b border-border hover:bg-background">
                                    <td className="p-2"><input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={(e) => handleSelectOne(user.id, e.target.checked)} /></td>
                                    <td className="p-2"><a href="#" onClick={(e) => { e.preventDefault(); onViewUser(user.id); }} className="font-semibold text-primary hover:underline">{user.name}</a></td>
                                    <td className="p-2 text-text-light">{user.email}</td>
                                    <td className="p-2">
                                        <div className="flex flex-wrap gap-1">
                                            {(Array.isArray(user.roles) ? user.roles : []).map(role => (
                                                <div key={role}><RoleTag role={role} /></div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-2"><StatusTag status={user.status} /></td>
                                    <td className="p-2 text-text-light">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</td>
                                    <td className="p-2">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleEditUserClick(user)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center p-8 text-text-light">No users match the current filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {editedUser && (
                    <EditUserModal
                        user={editedUser}
                        onClose={() => setEditedUser(null)}
                        onSave={handleEditUserSave} // Pass the save handler
                    />
                )}
                {filteredUsers.length === 0 && <p className="text-center p-8 text-text-light">No users match the current filters.</p>}
            </div>
        </Card>
    );
};

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div className="text-center p-8 text-red-600">Something went wrong. Please try again later.</div>;
        }
        return this.props.children;
    }
}

export default function UserManagementWithBoundary(props: UserManagementProps) {
    return (
        <ErrorBoundary>
            <UserManagement {...props} />
        </ErrorBoundary>
    );
}
