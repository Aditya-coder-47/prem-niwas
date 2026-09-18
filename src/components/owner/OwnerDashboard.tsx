import React from 'react';
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
  AlertCircle
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

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Building Control Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AMIT NIWAS
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Overview of occupancy, tenant allocations, and operational notices for {totalRooms} residential units.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2.5">
          <button
            id="owner-dash-register-renter-btn"
            onClick={onOpenRegisterModal}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register Renter</span>
          </button>
          <button
            id="owner-dash-post-notice-btn"
            onClick={onOpenNoticeModal}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>Post Notice</span>
          </button>
        </div>
      </div>

      {/* Pending Applications Banner if any exist */}
      {pendingApplicants.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center flex-shrink-0 text-sm">
              {pendingApplicants.length}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <span>{pendingApplicants.length} Resident Application{pendingApplicants.length > 1 ? 's' : ''} Pending Your Approval</span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Prospective tenants registered online. Verify identity and allot vacant rooms to grant them portal access.
              </p>
            </div>
          </div>
          <button
            id="view-pending-applicants-btn"
            onClick={() => onNavigateTab('renters', 'pending_approval')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors"
          >
            Review & Allot Units →
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Occupancy */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupancy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{occupancyRate}%</span>
            <span className="text-xs text-slate-500">({occupiedRooms} of 15)</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Vacant Rooms */}
        <div 
          onClick={() => onNavigateTab('rooms', 'vacant')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm cursor-pointer hover:border-amber-400 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vacant Units</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{vacantRooms}</span>
            <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
              Ready to allot
            </span>
          </div>
          <div className="mt-3 flex items-center text-xs text-amber-600 font-medium group-hover:underline">
            <span>View vacant rooms</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </div>

        {/* Active Renters */}
        <div 
          onClick={() => onNavigateTab('renters', 'active')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm cursor-pointer hover:border-blue-400 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Renters</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{activeRenters.length}</span>
            <span className="text-xs text-slate-500">Tenants</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-blue-600 font-medium group-hover:underline">
            <span>Open directory</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </div>

        {/* Monthly Rental Inflow */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Rent Roll</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              ₹{currentMonthlyRent.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Potential full rent: ₹{potentialMonthlyRent.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Building Layout Visualizer (Floors 0, 1, 2) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Building Unit Status (15 Rooms)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any room for tenant details, re-assignment, or rapid allotment.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Occupied ({occupiedRooms})
            </span>
            <span className="flex items-center text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5"></span>
              Vacant ({vacantRooms})
            </span>
          </div>
        </div>

        {/* Floor Breakdown */}
        <div className="space-y-4">
          {/* 2nd Floor: Rooms 11-15 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>2nd Floor • Rooms 11 to 15</span>
              <span className="text-[11px] text-slate-500 font-normal">Top Floor</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {secondFloorRooms.map(room => renderRoomBadge(room, onSelectRoom))}
            </div>
          </div>

          {/* 1st Floor: Rooms 6-10 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>1st Floor • Rooms 6 to 10</span>
              <span className="text-[11px] text-slate-500 font-normal">Middle Floor</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {firstFloorRooms.map(room => renderRoomBadge(room, onSelectRoom))}
            </div>
          </div>

          {/* Ground Floor: Rooms 1-5 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Ground Floor • Rooms 1 to 5</span>
              <span className="text-[11px] text-slate-500 font-normal">Ground Level</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {groundFloorRooms.map(room => renderRoomBadge(room, onSelectRoom))}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Activity & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activity / Audit Log preview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Audit Activities</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('audit')}
                className="text-xs text-amber-600 font-semibold hover:underline"
              >
                View full log
              </button>
            </div>

            {activityLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No activity logs recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activityLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-0.5">
                      <span className="font-semibold text-slate-700">{log.performedByName}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Immutable Firestore Audit Trail</span>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Building Notices Preview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Notice Board Announcements</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('notices')}
                className="text-xs text-amber-600 font-semibold hover:underline"
              >
                Manage notices
              </button>
            </div>

            {notices.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No notices published yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notices.slice(0, 3).map(notice => (
                  <div 
                    key={notice.id} 
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 truncate mr-2">
                        {notice.title}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
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
            <span className="text-[11px] text-slate-500">Visible to all residents</span>
            <button
              onClick={onOpenNoticeModal}
              className="text-xs font-semibold text-slate-900 hover:text-amber-600 flex items-center"
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
      className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group ${
        isOccupied
          ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400'
          : 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-extrabold text-sm text-slate-900 font-mono">
          R-{room.roomNumber}
        </span>
        <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      </div>
      
      <div className="text-[11px] font-medium text-slate-600 truncate">
        {isOccupied ? (
          <span className="text-emerald-900 font-semibold">{room.currentRenterName}</span>
        ) : (
          <span className="text-amber-800 font-medium">Vacant</span>
        )}
      </div>

      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
        <span>₹{room.baseRent}</span>
        <span className="text-slate-500 capitalize">{room.type.split(' ')[0]}</span>
      </div>
    </button>
  );
}
