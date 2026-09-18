import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  DoorClosed, 
  DoorOpen, 
  Users, 
  IndianRupee, 
  Percent, 
  Plus, 
  Bell, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  AlertCircle,
  UserPlus,
  X,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Room, Renter, ActivityLog, Notice } from '../../types';

interface OwnerDashboardProps {
  rooms: Room[];
  renters: Renter[];
  activityLogs: ActivityLog[];
  notices: Notice[];
  onNavigateTab: (tab: string, filter?: string) => void;
  onOpenRegisterModal: () => void;
  onOpenNoticeModal: () => void;
  onApproveApplicant: (renter: Renter) => void;
  onSelectRoom: (room: Room) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  rooms,
  renters,
  activityLogs,
  notices,
  onNavigateTab,
  onOpenRegisterModal,
  onOpenNoticeModal,
  onApproveApplicant,
  onSelectRoom
}) => {
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const vacantRooms = totalRooms - occupiedRooms;
  const activeRenters = renters.filter(r => r.status === 'active');
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Expected monthly rental income from current occupants
  const currentMonthlyRent = activeRenters.reduce((acc, curr) => acc + (curr.monthlyRent || 0), 0);
  const potentialMonthlyRent = rooms.reduce((acc, curr) => acc + (curr.baseRent || 0), 0);

  // Group rooms by floor
  const groundFloorRooms = rooms.filter(r => r.floor.toLowerCase().includes('ground') || r.roomNumber <= 5);
  const firstFloorRooms = rooms.filter(r => r.floor.toLowerCase().includes('1st') || (r.roomNumber >= 6 && r.roomNumber <= 10));
  const secondFloorRooms = rooms.filter(r => r.floor.toLowerCase().includes('2nd') || r.roomNumber >= 11);

  const pendingApplicants = renters.filter(r => r.status === 'pending_approval');

  // Live toast notification when new applicant appears
  const [toastApplicant, setToastApplicant] = useState<Renter | null>(null);
  const prevPendingRef = useRef<string[]>([]);

  useEffect(() => {
    const currentIds = pendingApplicants.map(r => r.id);
    const prevIds = prevPendingRef.current;
    // Fire toast only when count increases (skip initial mount)
    const newOnes = pendingApplicants.filter(r => !prevIds.includes(r.id));
    if (newOnes.length > 0 && prevIds.length >= 0 && prevPendingRef.current !== undefined) {
      if (prevIds.length >= 0 && newOnes.length > 0 && prevPendingRef.current.length !== currentIds.length) {
        setToastApplicant(newOnes[0]);
        const timer = setTimeout(() => setToastApplicant(null), 8000);
        prevPendingRef.current = currentIds;
        return () => clearTimeout(timer);
      }
    }
    prevPendingRef.current = currentIds;
  }, [pendingApplicants.length]);

  return (
    <div className="space-y-5 sm:space-y-6 pb-6">

      {/* ===== NEW APPLICANT LIVE TOAST ===== */}
      {toastApplicant && (
        <div className="fixed top-20 right-4 z-50 w-84 max-w-[calc(100vw-2rem)] bg-white border-2 border-amber-400 rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md text-slate-950">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-full">
                  New Application!
                </span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5 leading-snug">{toastApplicant.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{toastApplicant.email}</p>
              </div>
            </div>
            <button 
              onClick={() => setToastApplicant(null)} 
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 bg-amber-50/80 border border-amber-200/70 rounded-xl p-2.5">
            Awaiting your approval — verify KYC &amp; allot room to grant portal access.
          </p>
          <button
            onClick={() => { setToastApplicant(null); onNavigateTab('renters', 'pending_approval'); }}
            className="w-full py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98"
          >
            Review &amp; Allot Now →
          </button>
        </div>
      )}

      {/* ===== EXECUTIVE HERO COMMAND BANNER ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl">
        {/* Subtle Ambient Background Accents */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center space-x-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Building Control &amp; Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              PREM <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">NIWAS</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-normal leading-relaxed">
              Real-time occupancy tracking, tenant KYC, automatic billing, and unit operations for all {totalRooms} residential suites.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 w-full sm:w-auto">
            <button
              id="owner-dash-register-renter-btn"
              onClick={onOpenRegisterModal}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Register Renter</span>
            </button>
            <button
              id="owner-dash-post-notice-btn"
              onClick={onOpenNoticeModal}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Post Notice</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== PENDING APPLICATIONS SECTION ===== */}
      {pendingApplicants.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 sm:px-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <UserPlus className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Pending Applications</h3>
                <p className="text-xs text-amber-400/80 font-medium">{pendingApplicants.length} applicant{pendingApplicants.length !== 1 ? 's' : ''} waiting for review</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {pendingApplicants.map((applicant) => (
              <div key={applicant.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 gap-4 transition-all">
                <div className="flex items-start sm:items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-600">
                    <span className="text-sm font-bold text-slate-300">
                      {applicant.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{applicant.fullName}</h4>
                    <div className="flex items-center text-xs text-slate-400 mt-1 space-x-3">
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(applicant.createdAt).toLocaleDateString()}</span>
                      <span className="hidden sm:inline-block border-l border-slate-700 h-3"></span>
                      <span className="truncate">{applicant.email}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onApproveApplicant(applicant)}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Review & Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 4 KPI METRIC CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total & Occupancy */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Occupancy</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline space-x-1.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{occupancyRate}%</span>
              <span className="text-xs text-slate-500 font-medium">({occupiedRooms}/{totalRooms})</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium text-right">{occupiedRooms} units active</p>
          </div>
        </div>

        {/* Card 2: Vacant Rooms */}
        <div 
          onClick={() => onNavigateTab('rooms', 'vacant')}
          className="bg-white border border-slate-200/90 hover:border-amber-400/80 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between active:scale-98"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vacant Units</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                <DoorOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline space-x-1.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{vacantRooms}</span>
              <span className="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                Ready
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-amber-700 font-bold group-hover:text-amber-800 transition-colors">
            <span>View vacant rooms</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 3: Active Renters */}
        <div 
          onClick={() => onNavigateTab('renters', 'active')}
          className="bg-white border border-slate-200/90 hover:border-blue-400/80 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between active:scale-98"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Renters</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline space-x-1.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{activeRenters.length}</span>
              <span className="text-xs text-slate-500 font-medium">Tenants</span>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-blue-600 font-bold group-hover:text-blue-700 transition-colors">
            <span>Open directory</span>
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 4: Monthly Rent Roll */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Rent Roll</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 font-black text-sm">
                ₹
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline space-x-1">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                ₹{currentMonthlyRent.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 font-medium truncate">
            Full capacity: <span className="font-bold text-slate-700">₹{potentialMonthlyRent.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* ===== BUILDING UNIT STATUS MAP (15 Rooms by Floor) ===== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>Building Floor Map ({totalRooms} Units)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any unit badge to assign room, inspect resident profile, or reallocate.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center text-slate-700 font-semibold bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Occupied ({occupiedRooms})
            </span>
            <span className="flex items-center text-slate-700 font-semibold bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>
              Vacant ({vacantRooms})
            </span>
          </div>
        </div>

        {/* Floor Breakdown */}
        <div className="space-y-4">
          {/* 2nd Floor: Rooms 11-15 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 sm:p-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>2nd Floor • Rooms 11 to 15</span>
              </div>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 font-bold px-2 py-0.5 rounded-full">
                Top Floor
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {secondFloorRooms.map(room => renderRoomBadge(room, onSelectRoom))}
            </div>
          </div>

          {/* 1st Floor: Rooms 6-10 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 sm:p-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>1st Floor • Rooms 6 to 10</span>
              </div>
              <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                Middle Floor
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {firstFloorRooms.map(room => renderRoomBadge(room, onSelectRoom))}
            </div>
          </div>

          {/* Ground Floor: Rooms 1-5 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 sm:p-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Ground Floor • Rooms 1 to 5</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                Ground Level
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {groundFloorRooms.map(room => renderRoomBadge(room, onSelectRoom))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== TWO COLUMN SECTION: RECENT ACTIVITY & NOTICES ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Recent Activity / Audit Log Preview */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">Recent Audit Activities</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('audit')}
                className="text-xs text-amber-600 font-bold hover:underline flex items-center"
              >
                <span>View full log</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {activityLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No activity logs recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activityLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-0.5">
                      <span className="font-bold text-slate-800">{log.performedByName}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed">{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Immutable Firestore Audit Trail</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Building Notices Preview */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">Notice Board Announcements</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('notices')}
                className="text-xs text-amber-600 font-bold hover:underline flex items-center"
              >
                <span>Manage notices</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {notices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notices published yet. Click below to announce.
              </div>
            ) : (
              <div className="space-y-2.5">
                {notices.slice(0, 3).map(notice => (
                  <div 
                    key={notice.id} 
                    className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 truncate mr-2">
                        {notice.title}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                        {notice.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {notice.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Visible to all residents</span>
            <button
              onClick={onOpenNoticeModal}
              className="text-xs font-bold text-slate-900 hover:text-amber-600 flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Announcement</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

function renderRoomBadge(room: Room, onSelect: (room: Room) => void) {
  const isOccupied = room.status === 'occupied';

  return (
    <button
      key={room.id}
      onClick={() => onSelect(room)}
      className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer active:scale-95 ${
        isOccupied
          ? 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-400 hover:shadow-sm'
          : 'bg-amber-50/70 border-amber-200 hover:border-amber-400 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-black text-xs sm:text-sm text-slate-900 font-mono">
          R-{room.roomNumber}
        </span>
        <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-400 ring-2 ring-amber-200'}`} />
      </div>
      
      <div className="text-[11px] font-bold text-slate-700 truncate my-0.5">
        {isOccupied ? (
          <span className="text-emerald-900 font-semibold">{room.currentRenterName || 'Occupied'}</span>
        ) : (
          <span className="text-amber-800 font-semibold">Vacant • Allot</span>
        )}
      </div>

      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-200/50 pt-1">
        <span className="font-bold text-slate-800">₹{room.baseRent.toLocaleString('en-IN')}</span>
        <span className="text-[10px] text-slate-400 capitalize">{room.type.split(' ')[0]}</span>
      </div>
    </button>
  );
}
