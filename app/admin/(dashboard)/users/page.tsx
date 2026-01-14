"use client";

import { Button } from '../../../components/ui/Button';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const UsersPage = () => {
    const { data: session } = useSession();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchUsers();
        }
    }, [session]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u._id !== id));
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            alert('Something went wrong');
        }
    };

    const handleRoleChange = async (id: string, newRole: string) => {
        if (!confirm(`Change role to ${newRole}?`)) return;

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                 setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
            } else {
                alert('Failed to update role');
            }
        } catch (error) {
             alert('Something went wrong');
        }
    };

    if (loading) return <div className="text-white">Loading users...</div>;

    // Authorization Checks
    const userRole = (session?.user as any)?.role || 'user';
    const isSuperAdmin = userRole === 'super_admin';
    const isAdmin = userRole === 'admin';
    const canManageUsers = isSuperAdmin || isAdmin;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
                    <p className="text-zinc-400">Manage user access and permissions.</p>
                </div>
                {/* Only admins can realistically 'add' users in this context if we had a modal, but hiding for now or keeping active */}
                <Button variant="primary" className="gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add User
                </Button>
            </div>

            <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
                {/* Filter/Search Bar */}
                <div className="p-4 border-b border-white/5 flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent/50 w-full max-w-md"
                    />
                     <select className="bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent/50 text-sm">
                        <option value="all">All Roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="user">User</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-white/5 text-xs uppercase font-bold text-white">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Joined</th>
                                {canManageUsers && <th className="px-6 py-3 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => {
                                // Logic to disable editing superiors
                                const isSuperior = user.role === 'super_admin' || (user.role === 'admin' && !isSuperAdmin);
                                const canEditThisUser = !isSuperior;

                                return (
                                <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/5 overflow-hidden">
                                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                                 {user.image && user.image.startsWith('http') ? (
                                                     <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                                                 ) : (
                                                     <span>{user.name.charAt(0)}</span>
                                                 )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white text-base">
                                                    {user.name}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border uppercase tracking-wider ${
                                            user.role === 'super_admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            user.role === 'admin' ? 'bg-accent/10 text-accent border-accent/20' : 
                                            user.role === 'editor' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                            'bg-white/5 text-zinc-400 border-white/10'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-zinc-400">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    {canManageUsers && (
                                    <td className="px-6 py-4 text-right">
                                        {canEditThisUser ? (
                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity items-center">
                                             <select 
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                className="bg-[#0D0D0D] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                             >
                                                <option value="user">User</option>
                                                <option value="editor">Editor</option>
                                                {/* Only Super Admin can promote to Admin */}
                                                {isSuperAdmin && <option value="admin">Admin</option>}
                                                {/* Only Super Admin can promote to Super Admin (rare) */}
                                                {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                                             </select>
                                            
                                            {/* Only Super Admin can delete users (or stricter policy) */}
                                            {isSuperAdmin && (
                                                <button 
                                                    onClick={() => handleDelete(user._id)}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors" 
                                                    title="Delete User"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        ) : (
                                            <span className="text-xs text-zinc-600 italic">Protected</span>
                                        )}
                                    </td>
                                    )}
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
