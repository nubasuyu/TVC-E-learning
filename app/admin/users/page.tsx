'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state for adding new staff
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'TEACHER' });
  const [message, setMessage] = useState('');

  // Fetch users on load
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Approve/Reject
  const handleStatusChange = async (id: number, isApproved: boolean) => {
    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved }),
      });
      fetchUsers(); // Refresh list
    } catch (error) {
      alert('Failed to update user');
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  // Handle Add New Staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Creating account...');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'TEACHER' });
        fetchUsers();
        setMessage('');
      } else {
        setMessage(data.error || 'Failed to create user');
      }
    } catch (error) {
      setMessage('Network error');
    }
  };

  const pendingUsers = users.filter(u => !u.isApproved);
  const activeUsers = users.filter(u => u.isApproved);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">← Back to Dashboard</button>
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">+ Add New Staff</button>
          </div>
        </div>

        {message && <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">{message}</div>}

        {/* Pending Approvals Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm">{pendingUsers.length}</span> 
            Pending Approvals
          </h2>
          
          {pendingUsers.length === 0 ? (
            <p className="text-gray-500 italic">No pending users right now. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Email</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Requested Role</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-800">{user.name}</td>
                      <td className="p-3 text-gray-600">{user.email}</td>
                      <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{user.role}</span></td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => handleStatusChange(user.id, true)} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Approve</button>
                        <button onClick={() => handleDelete(user.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Users Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm">{activeUsers.length}</span> 
            Active Users
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Email</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Role</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-800">{user.name}</td>
                    <td className="p-3 text-gray-600">{user.email}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span></td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(user.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">Create New Staff Account</h2>
              <p className="text-sm text-gray-500 mb-6">This account will be automatically approved and can log in immediately.</p>
              
              <form onSubmit={handleAddStaff} className="space-y-4">
                <input type="text" placeholder="Full Name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border p-3 rounded-lg" />
                <input type="email" placeholder="Email Address" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border p-3 rounded-lg" />
                <input type="password" placeholder="Temporary Password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border p-3 rounded-lg" />
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border p-3 rounded-lg">
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Account</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}