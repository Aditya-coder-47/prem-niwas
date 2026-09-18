import React from 'react';
import { 
  Building2, 
  Clock, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  FileBadge, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Renter, PERMANENT_OWNER_EMAIL } from '../../types';

interface PendingApprovalScreenProps {
  renterRecord: Renter | null;
  onRefresh: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  renterRecord,
  onRefresh
}) => {
  const { profile, logout } = useAuth();

  const isRejected = renterRecord?.status === 'rejected' || profile?.approvalStatus === 'rejected';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-3">
            <Building2 className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wider">
            PREM NIWAS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Residential Rental Management â€¢ Civil Lines Road
          </p>
        </div>

        {/* Main Status Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
              isRejected 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isRejected ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
            </div>

            <h2 className="text-lg font-bold text-white">
              {isRejected ? 'Application Not Approved' : 'Registration Pending Owner Approval'}
            </h2>

            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {isRejected 
                ? (renterRecord?.checkoutNotes || 'Your registration could not be verified by management.')
                : `Your application has been received and is waiting for review by the building owner (${PERMANENT_OWNER_EMAIL}). Once approved and a room is allotted, your tenancy portal will be unlocked automatically.`
              }
            </p>
          </div>

          {/* Submitted Information Card */}
          <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2.5 text-xs text-slate-300">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-1">
              Your Submitted Registration Details
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Applicant Name:</span>
              <span className="font-semibold text-white">{profile?.name || renterRecord?.fullName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Registered Email:</span>
              <span className="font-semibold text-white">{profile?.email || renterRecord?.email}</span>
            </div>

            {renterRecord?.phone && (
              <div className="flex justify-between">
                <span className="text-slate-400">Contact Number:</span>
                <span className="font-semibold text-white">{renterRecord.phone}</span>
              </div>
            )}

            {renterRecord?.govIdNumber && (
              <div className="flex justify-between">
                <span className="text-slate-400">KYC Verification:</span>
                <span className="font-mono text-amber-300">{renterRecord.govIdType}: {renterRecord.govIdNumber}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-400">Application Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isRejected 
                  ? 'bg-rose-900/50 text-rose-300 border border-rose-700' 
                  : 'bg-amber-900/50 text-amber-300 border border-amber-700'
              }`}>
                {isRejected ? 'Declined' : 'Pending Owner Review & Allotment'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={onRefresh}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Status</span>
            </button>

            <button
              onClick={logout}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Prem Niwas Management â€¢ Contact Owner: <strong>{PERMANENT_OWNER_EMAIL}</strong>
        </p>

      </div>
    </div>
  );
};
