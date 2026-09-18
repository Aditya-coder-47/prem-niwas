import React, { useState } from 'react';
import { X, LogOut, AlertTriangle, IndianRupee, Calendar } from 'lucide-react';
import { Renter } from '../../types';
import { checkoutRenter } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  renter: Renter | null;
  onCheckedOut: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  renter,
  onCheckedOut
}) => {
  const { profile } = useAuth();
  const [checkoutDate, setCheckoutDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [depositRefund, setDepositRefund] = useState<number>(renter?.securityDeposit || 0);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('Keys handed over, room inspected and in order.');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !renter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await checkoutRenter(
        renter,
        {
          checkoutDate,
          checkoutNotes: checkoutNotes.trim(),
          securityDepositReturned: Number(depositRefund) || 0
        },
        profile?.name || 'Building Owner'
      );
      onCheckedOut();
      onClose();
    } catch (err: any) {
      console.error('Error during checkout:', err);
      setErrorMsg(err.message || 'Failed to checkout renter.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <LogOut className="w-5 h-5 text-rose-600" />
              <span>Checkout Resident</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Vacate room and finalize tenancy settlement.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Action Confirmation:</strong> Checking out <strong>{renter.fullName}</strong> will release <strong>Room {renter.roomNumber || 'None'}</strong> back to Vacant status, ready for future tenant allotment.
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Checkout Date *
              </label>
              <input
                type="date"
                required
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Security Deposit Refunded (₹)
              </label>
              <input
                type="number"
                min="0"
                value={depositRefund}
                onChange={(e) => setDepositRefund(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Original deposit on record: ₹{renter.securityDeposit.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection & Settlement Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Unit inspected, keys returned, electric dues cleared."
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{submitting ? 'Checking out...' : 'Confirm Checkout & Vacate Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
