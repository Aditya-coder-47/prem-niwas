import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  ArrowRightLeft, 
  KeyRound, 
  LogOut, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  DoorClosed, 
  AlertCircle,
  Eye,
  FileBadge,
  Clock,
  Briefcase,
  XCircle
} from 'lucide-react';
import { Renter, Room } from '../../types';

interface RentersViewProps {
  renters: Renter[];
  rooms: Room[];
  initialFilter?: string;
  onOpenRegisterModal: () => void;
  onEditRenter: (renter: Renter) => void;
  onChangeRoom: (renter: Renter) => void;
  onCheckoutRenter: (renter: Renter) => void;
  onResetPassword: (renter: Renter) => void;
  onViewDetails: (renter: Renter) => void;
  onApproveApplicant?: (applicant: Renter) => void;
}

export const RentersView: React.FC<RentersViewProps> = ({
  renters,
  rooms,
  initialFilter = 'all',
  onOpenRegisterModal,
  onEditRenter,
  onChangeRoom,
  onCheckoutRenter,
  onResetPassword,
  onViewDetails,
  onApproveApplicant
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);

  useEffect(() => {
    setStatusFilter(initialFilter || 'all');
  }, [initialFilter]);

  // Counts
  const activeCount = renters.filter(r => r.status === 'active').length;
  const pendingCount = renters.filter(r => r.status === 'pending_approval').length;
  const checkedOutCount = renters.filter(r => r.status === 'checked_out').length;

  // Filter renters
  const filteredRenters = renters.filter(renter => {
    // Status filter
    if (statusFilter === 'active' && renter.status !== 'active') return false;
    if (statusFilter === 'pending_approval' && renter.status !== 'pending_approval') return false;
    if (statusFilter === 'checked_out' && renter.status !== 'checked_out') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = renter.fullName.toLowerCase().includes(q);
      const matchPhone = renter.phone.toLowerCase().includes(q);
      const matchEmail = renter.email.toLowerCase().includes(q);
      const matchRoom = renter.roomNumber ? `room ${renter.roomNumber}`.includes(q) || `${renter.roomNumber}` === q : false;
      const matchGovId = renter.govIdNumber?.toLowerCase().includes(q) || false;
      if (!matchName && !matchPhone && !matchEmail && !matchRoom && !matchGovId) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Renters Directory & KYC — PREM NIWAS</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review residential tenant signups, approve room allotments, manage active tenancies, and inspect KYC.
            </p>
          </div>

          <button
            id="register-new-renter-btn"
            onClick={onOpenRegisterModal}
            className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Direct Register Renter</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="renters-search-input"
              type="text"
              placeholder="Search name, phone, email, room, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg sm:col-span-2 overflow-x-auto">
            <button
              id="filter-all-renters-btn"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1 px-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({renters.length})
            </button>
            <button
              id="filter-active-renters-btn"
              onClick={() => setStatusFilter('active')}
              className={`flex-1 py-1 px-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              id="filter-pending-renters-btn"
              onClick={() => setStatusFilter('pending_approval')}
              className={`flex-1 py-1 px-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center justify-center space-x-1 ${
                statusFilter === 'pending_approval' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold' 
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span>Pending Approvals</span>
              {pendingCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'pending_approval' ? 'bg-slate-950 text-amber-300' : 'bg-amber-200 text-amber-900'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              id="filter-checkout-renters-btn"
              onClick={() => setStatusFilter('checked_out')}
              className={`flex-1 py-1 px-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'checked_out' ? 'bg-slate-700 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Checked Out ({checkedOutCount})
            </button>
          </div>
        </div>
      </div>

      {/* Renters List */}
      {filteredRenters.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-700">No records found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? 'Try clearing your search terms' : 'No tenants found under this filter status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRenters.map((renter) => {
            const isActive = renter.status === 'active';
            const isPending = renter.status === 'pending_approval';

            return (
              <div
                key={renter.id}
                className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isPending ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Renter Primary Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <h3 className="font-bold text-base text-slate-900">
                      {renter.fullName}
                    </h3>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        isActive ? 'bg-emerald-600' : isPending ? 'bg-amber-500' : 'bg-slate-500'
                      }`} />
                      {isActive ? 'Active Resident' : isPending ? 'Pending Approval' : 'Checked Out'}
                    </span>

                    {/* Room Badge */}
                    {renter.roomNumber ? (
                      <span className="inline-flex items-center text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                        <DoorClosed className="w-3 h-3 mr-1 text-amber-600" />
                        Room {renter.roomNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 font-medium">
                        {isPending ? 'Awaiting Room Allotment' : 'No active room'}
                      </span>
                    )}
                  </div>

                  {/* Contact & KYC details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{renter.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{renter.email}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <FileBadge className="w-3.5 h-3.5 text-slate-400" />
                      <span>{renter.govIdType}: <strong className="font-mono">{renter.govIdNumber}</strong></span>
                    </div>
                  </div>

                  {/* Additional info for pending applicant */}
                  {isPending && (
                    <div className="pt-2 text-xs text-slate-600 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 font-medium">Permanent Address:</span>{' '}
                        <span>{renter.permanentAddress || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Occupation:</span>{' '}
                        <span>{renter.occupation || 'Resident'} ({renter.workplace || 'City'})</span>
                      </div>
                    </div>
                  )}

                  {/* Financial & Tenancy info for active */}
                  {isActive && (
                    <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                      <span>Monthly Rent: <strong className="text-slate-800">₹{renter.monthlyRent?.toLocaleString('en-IN') || 0}</strong></span>
                      <span>Deposit: <strong className="text-slate-800">₹{renter.securityDeposit?.toLocaleString('en-IN') || 0}</strong></span>
                      <span>Lease Start: <strong className="text-slate-800">{renter.leaseStartDate || '-'}</strong></span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center flex-wrap gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {isPending ? (
                    /* Pending approval action buttons */
                    <button
                      id={`approve-renter-btn-${renter.id}`}
                      onClick={() => onApproveApplicant?.(renter)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Review & Allot Room</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onViewDetails(renter)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center space-x-1"
                        title="View Full Profile & KYC"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Details</span>
                      </button>

                      <button
                        onClick={() => onEditRenter(renter)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center space-x-1"
                        title="Edit Renter Info"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {isActive && (
                        <>
                          <button
                            onClick={() => onChangeRoom(renter)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center space-x-1"
                            title="Shift to Another Room"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Change Room</span>
                          </button>

                          <button
                            onClick={() => onCheckoutRenter(renter)}
                            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium flex items-center space-x-1"
                            title="Vacate / Checkout Renter"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Checkout</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => onResetPassword(renter)}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs"
                        title="Send Password Reset Link"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
