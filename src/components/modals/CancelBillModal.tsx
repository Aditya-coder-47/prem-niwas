import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Bill } from '../../types';
import { cancelBill } from '../../services/billingService';

interface CancelBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  operatorName?: string;
  onSuccess?: () => void;
}

export const CancelBillModal: React.FC<CancelBillModalProps> = ({
  isOpen,
  onClose,
  bill,
  operatorName = 'Building Owner',
  onSuccess
}) => {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A cancellation reason is required for the audit record.');
      return;
    }

    setIsSubmitting(true);
    try {
      await cancelBill(bill.id, reason.trim(), operatorName);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Bill cancellation failed:', err);
      setError(err.message || 'Failed to cancel bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="cancel-bill-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 border border-slate-200"
      >
        <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-300" />
            <h2 className="text-base font-bold">Cancel Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-200 hover:text-white rounded-lg hover:bg-rose-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-900">
              Invoice: {bill.invoiceNumber}
            </p>
            <p className="text-slate-600">
              Resident: {bill.renterName} (Room {bill.roomNumber})
            </p>
            <p className="text-slate-600">
              Total Amount: ₹{bill.totalAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Per system rules, billing records are never permanently deleted from the database. Cancelling updates its status to <strong className="text-rose-700 font-semibold">Cancelled</strong>, relieves pending dues from the resident's account, and preserves full historical audit trails.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Cancellation <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Generated with erroneous meter reading, or room swap correction required."
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
