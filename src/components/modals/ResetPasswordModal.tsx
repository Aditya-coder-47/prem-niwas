import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, Mail, Send } from 'lucide-react';
import { Renter } from '../../types';
import { resetRenterPassword } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  renter: Renter | null;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  renter
}) => {
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !renter) return null;

  const handleSendReset = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await resetRenterPassword(
        renter.email,
        renter.fullName,
        profile?.name || 'Building Owner'
      );
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Error triggering password reset.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Reset Renter Password</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dispatches password recovery instructions to tenant.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="text-slate-500">Tenant Account:</div>
            <div className="font-bold text-slate-900 text-sm">{renter.fullName}</div>
            <div className="flex items-center space-x-1.5 text-slate-600 mt-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{renter.email}</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Assigned Room: {renter.roomNumber ? `Room ${renter.roomNumber}` : 'None'}
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Clicking below triggers a secure Firebase Authentication password reset email directly to <strong>{renter.email}</strong>, allowing the renter to choose a new private password to access their profile and room records.
          </p>

          {result && (
            <div className={`p-3 rounded-lg text-xs flex items-start space-x-2 ${
              result.success 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSendReset}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sending...' : 'Dispatch Reset Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
