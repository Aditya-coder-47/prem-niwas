import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  DoorClosed, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileBadge, 
  Briefcase, 
  AlertCircle 
} from 'lucide-react';
import { Renter, Room } from '../../types';
import { approveRenterApplication, rejectRenterApplication } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface ApproveRenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Renter | null;
  vacantRooms: Room[];
  onActionComplete: () => void;
}

export const ApproveRenterModal: React.FC<ApproveRenterModalProps> = ({
  isOpen,
  onClose,
  applicant,
  vacantRooms,
  onActionComplete
}) => {
  const { profile } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number>(6500);
  const [securityDeposit, setSecurityDeposit] = useState<number>(13000);
  const [leaseStartDate, setLeaseStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (vacantRooms.length > 0) {
      setSelectedRoomId(vacantRooms[0].id);
      setMonthlyRent(vacantRooms[0].baseRent);
      setSecurityDeposit(vacantRooms[0].baseRent * 2);
    }
  }, [vacantRooms, isOpen]);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const r = vacantRooms.find(rm => rm.id === roomId);
    if (r) {
      setMonthlyRent(r.baseRent);
      setSecurityDeposit(r.baseRent * 2);
    }
  };

  if (!isOpen || !applicant) return null;

  const targetRoom = vacantRooms.find(r => r.id === selectedRoomId);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoom) {
      setErrorMsg('Please select a vacant room to allocate to this applicant.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await approveRenterApplication(
        applicant,
        targetRoom,
        Number(monthlyRent) || targetRoom.baseRent,
        Number(securityDeposit) || targetRoom.baseRent * 2,
        leaseStartDate,
        profile?.name || 'Prem Niwas (Owner)'
      );
      onActionComplete();
      onClose();
    } catch (err: any) {
      console.error('Error approving renter:', err);
      setErrorMsg(err.message || 'Failed to approve application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await rejectRenterApplication(
        applicant,
        rejectReason.trim() || 'Criteria not met',
        profile?.name || 'Prem Niwas (Owner)'
      );
      onActionComplete();
      onClose();
    } catch (err: any) {
      console.error('Error rejecting renter:', err);
      setErrorMsg(err.message || 'Failed to decline application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                Pending Verification
              </span>
              <h2 className="text-lg font-bold text-slate-900">Review Resident Application</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Applicant KYC review and room allotment for PREM NIWAS.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Applicant Profile Summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                  {applicant.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{applicant.fullName}</div>
                  <div className="text-slate-500 text-[11px]">{applicant.occupation || 'Resident Applicant'}</div>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Applied: {new Date(applicant.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div className="flex items-center space-x-1.5 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{applicant.phone}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{applicant.email}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700">
                <FileBadge className="w-3.5 h-3.5 text-slate-400" />
                <span>{applicant.govIdType}: <strong>{applicant.govIdNumber}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Workplace: {applicant.workplace || 'Not specified'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-slate-600">
              <span className="font-semibold text-slate-700 block text-[10px] uppercase">Permanent Address:</span>
              <p className="mt-0.5">{applicant.permanentAddress || 'Not provided'}</p>
            </div>

            <div className="pt-2 border-t border-slate-200 text-slate-600">
              <span className="font-semibold text-slate-700 block text-[10px] uppercase">Emergency Contact:</span>
              <p className="mt-0.5">
                {applicant.emergencyContactName} ({applicant.emergencyContactRelation}) • {applicant.emergencyContactPhone}
              </p>
            </div>
          </div>

          {!showRejectForm ? (
            <form onSubmit={handleApprove} className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Allot Vacant Room & Terms
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Vacant Room (15 Units) *
                  </label>
                  {vacantRooms.length === 0 ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                      No vacant rooms available in PREM NIWAS.
                    </div>
                  ) : (
                    <select
                      value={selectedRoomId}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                    >
                      {vacantRooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.roomName} — {r.floor} ({r.type}, Base: ₹{r.baseRent}/mo)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lease / Move-in Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaseStartDate}
                    onChange={(e) => setLeaseStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Deposit Received (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Decline Application</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || vacantRooms.length === 0}
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Approving...' : 'Approve & Allot Unit'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                Are you sure you want to decline this applicant? They will not be allotted a room.
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Identity documents unverified, no vacant room suitable."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 border rounded-lg"
                >
                  Back to Approval
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleReject}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
