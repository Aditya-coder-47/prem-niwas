import React from 'react';
import { 
  X, 
  User, 
  DoorClosed, 
  Phone, 
  Mail, 
  MapPin, 
  FileBadge, 
  Briefcase, 
  Calendar, 
  IndianRupee, 
  ShieldAlert, 
  CheckCircle2, 
  Edit,
  ArrowRightLeft,
  Building2
} from 'lucide-react';
import { Renter } from '../../types';

interface RenterDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  renter: Renter | null;
  onEdit: (renter: Renter) => void;
  onChangeRoom: (renter: Renter) => void;
}

export const RenterDetailsModal: React.FC<RenterDetailsModalProps> = ({
  isOpen,
  onClose,
  renter,
  onEdit,
  onChangeRoom
}) => {
  if (!isOpen || !renter) return null;

  const isActive = renter.status === 'active';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base">
              {renter.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">{renter.fullName}</h2>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isActive 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  {isActive ? 'Active Resident' : 'Checked Out'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Building: PREM NIWAS • {renter.roomNumber ? `Assigned to Room ${renter.roomNumber}` : 'No active room allotment'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Room & Tenancy Terms Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Unit Allotment</span>
              <strong className="text-slate-900 text-sm font-mono">
                {renter.roomNumber ? `Room ${renter.roomNumber}` : 'None'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Agreed Monthly Rent</span>
              <strong className="text-slate-900 text-sm">
                ₹{renter.monthlyRent.toLocaleString('en-IN')}/mo
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Security Deposit</span>
              <strong className="text-slate-900 text-sm">
                ₹{renter.securityDeposit.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Lease Start Date</span>
              <strong className="text-slate-900 text-sm">
                {renter.leaseStartDate}
              </strong>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Contact Details
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Mobile Phone</span>
                  <span className="font-semibold text-slate-900">{renter.phone}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Email Address</span>
                  <span className="font-semibold text-slate-900">{renter.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KYC & Identity Record */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Government Identity & KYC (For Police Verification)
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Identity Document Type</span>
                  <span className="font-semibold text-slate-900">{renter.govIdType}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FileBadge className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Document Number</span>
                  <span className="font-mono font-semibold text-slate-900">{renter.govIdNumber}</span>
                </div>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Permanent Native Address</span>
                  <span className="text-slate-800 font-medium leading-relaxed">{renter.permanentAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Employment & Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Employment / Occupation
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Profession</span>
                  <span className="font-semibold text-slate-900">{renter.occupation || 'Private Service'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Workplace / Organization</span>
                  <span className="font-semibold text-slate-900">{renter.workplace || 'City Center'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Emergency Contact
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Contact Person & Relation</span>
                  <span className="font-semibold text-slate-900">
                    {renter.emergencyContactName} ({renter.emergencyContactRelation || 'Relative'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Emergency Phone</span>
                  <span className="font-semibold text-slate-900">{renter.emergencyContactPhone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Record if applicable */}
          {renter.checkoutDate && (
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-800">Checkout Record:</div>
              <div className="text-slate-600">Vacated on: <strong>{renter.checkoutDate}</strong></div>
              <div className="text-slate-600">Refunded Security Deposit: <strong>₹{renter.securityDepositReturned || 0}</strong></div>
              {renter.checkoutNotes && (
                <div className="text-slate-600">Notes: <em>{renter.checkoutNotes}</em></div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end space-x-2 bg-slate-50">
          <button
            onClick={() => {
              onClose();
              onEdit(renter);
            }}
            className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Information</span>
          </button>
          {isActive && (
            <button
              onClick={() => {
                onClose();
                onChangeRoom(renter);
              }}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Reassign Room</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
