'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { deleteUser, toggleAuthorization } from '@/app/godmode/actions';

interface Profile {
  id: string;
  username: string;
  email: string;
  is_godmode: boolean;
  is_authorized: boolean;
  access_requested: boolean;
  created_at: string;
}

export default function UserList() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleToggleGodmode = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      alert("You cannot demote yourself.");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_godmode: !currentStatus })
      .eq('id', userId);

    if (error) {
      alert(error.message);
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, is_godmode: !currentStatus } : u));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUserId) return;
    if (!confirm('PERMANENTLY DELETE THIS OPERATOR? THIS ACTION IS IRREVERSIBLE.')) return;

    const res = await deleteUser(userId);
    if (res.success) {
      setUsers(users.filter(u => u.id !== userId));
    } else {
      alert('Deletion failed: ' + res.error);
    }
  };

  if (loading) return <div className="text-[#ECEEDF] font-mono text-xs animate-pulse p-8">LOADING...</div>;
  if (error) return <div className="text-red-500 font-mono text-xs p-8">ERROR: {error}</div>;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#ECEEDF]/10">
              <th className="py-4 px-2 font-mono text-[10px] text-[#ECEEDF]/40 uppercase tracking-widest">User</th>
              <th className="py-4 px-2 font-mono text-[10px] text-[#ECEEDF]/40 uppercase tracking-widest">Email</th>
              <th className="py-4 px-2 font-mono text-[10px] text-[#ECEEDF]/40 uppercase tracking-widest hidden md:table-cell">Joined</th>
              <th className="py-4 px-2 font-mono text-[10px] text-[#ECEEDF]/40 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[#ECEEDF]/5 hover:bg-[#ECEEDF]/2 transition-colors group">
                <td className="py-4 px-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-[#ECEEDF] uppercase tracking-wide">{user.username}</span>
                    <span className="font-mono text-[8px] text-[#ECEEDF]/20 uppercase tracking-tighter md:hidden">{user.email}</span>
                  </div>
                </td>
                <td className="py-4 px-2 font-mono text-xs text-[#ECEEDF]/60 font-light truncate max-w-[150px]">{user.email}</td>
                <td className="py-4 px-2 font-mono text-[10px] text-[#ECEEDF]/40 uppercase hidden md:table-cell">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="py-4 px-2 text-right">
                  <div className="flex justify-end gap-2 items-center">
                    {user.access_requested && !user.is_authorized && (
                      <span className="font-mono text-[8px] bg-[#ECEEDF] text-black px-1.5 py-0.5 animate-pulse tracking-tighter">REQ_PENDING</span>
                    )}

                    <button
                      onClick={() => toggleAuthorization(user.id, user.is_authorized)}
                      className={`font-mono text-[10px] uppercase tracking-widest px-3 py-2 border transition-all ${user.is_authorized
                        ? 'bg-[#ECEEDF] text-black border-[#ECEEDF] hover:bg-white'
                        : 'border-[#ECEEDF]/20 text-[#ECEEDF]/40 hover:border-[#ECEEDF]/60 hover:text-[#ECEEDF]'
                        }`}
                    >
                      {user.is_authorized ? 'AUTHORIZED' : 'AUTHORIZE'}
                    </button>

                    <button
                      onClick={() => handleToggleGodmode(user.id, user.is_godmode)}
                      className={`font-mono text-[10px] uppercase tracking-widest px-3 py-2 border transition-all ${user.is_godmode
                        ? 'bg-[#ECEEDF]/20 text-[#ECEEDF] border-[#ECEEDF]/20 hover:bg-[#ECEEDF]/30'
                        : 'border-[#ECEEDF]/20 text-[#ECEEDF]/40 hover:border-[#ECEEDF]/60 hover:text-[#ECEEDF]'
                        }`}
                    >
                      {user.is_godmode ? 'GODMODE' : 'USER'}
                    </button>

                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-red-900/30 text-red-900/60 hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all"
                      >
                        REMOVE
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

