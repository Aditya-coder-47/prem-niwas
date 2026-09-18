import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  UserPlus, 
  ArrowRightLeft, 
  LogOut, 
  KeyRound, 
  Bell, 
  Layers, 
  Clock 
} from 'lucide-react';
import { ActivityLog } from '../../types';

interface ActivityLogViewProps {
  activityLogs: ActivityLog[];
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ activityLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = activityLogs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchDesc = log.description.toLowerCase().includes(q);
      const matchPerformer = log.performedByName.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchDesc && !matchPerformer && !matchAction) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <History className="w-5 h-5 text-amber-500" />
              <span>Activity & Audit Trail</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete, immutable operational log of room allocations, renter registrations, transfers, and security events.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail Live & Immutable</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search audit descriptions, names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
            >
              <option value="all">All Action Types ({activityLogs.length})</option>
              <option value="RENTER_REGISTERED">Renter Registrations</option>
              <option value="ROOM_CHANGED">Room Reallocations</option>
              <option value="RENTER_CHECKED_OUT">Tenant Checkouts</option>
              <option value="RENTER_UPDATED">Profile Updates</option>
              <option value="NOTICE_CREATED">Notices Published</option>
              <option value="PASSWORD_RESET_SENT">Password Resets Dispatched</option>
              <option value="SYSTEM_INITIALIZED">System Initializations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Entries List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-700">No matching audit logs found</p>
          <p className="text-xs text-slate-400 mt-1">Actions performed across Amit Niwas will appear here automatically.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex items-start space-x-3.5">
              <div className="mt-0.5">{renderActionIcon(log.action)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-slate-900">
                    {log.description}
                  </span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString([], { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <span>Operator: <strong className="text-slate-700">{log.performedByName}</strong></span>
                  <span>•</span>
                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {log.action}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function renderActionIcon(action: ActivityLog['action']) {
  switch (action) {
    case 'RENTER_REGISTERED':
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <UserPlus className="w-4 h-4" />
        </div>
      );
    case 'ROOM_CHANGED':
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <ArrowRightLeft className="w-4 h-4" />
        </div>
      );
    case 'RENTER_CHECKED_OUT':
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
          <LogOut className="w-4 h-4" />
        </div>
      );
    case 'PASSWORD_RESET_SENT':
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <KeyRound className="w-4 h-4" />
        </div>
      );
    case 'NOTICE_CREATED':
    case 'NOTICE_DELETED':
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
          <Bell className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
      );
  }
}
