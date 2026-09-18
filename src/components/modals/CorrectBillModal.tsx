import React, { useState, useEffect } from 'react';
import { X, Edit3, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { Bill } from '../../types';
import { correctBill } from '../../services/billingService';

interface CorrectBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  operatorName?: string;
  onSuccess?: () => void;
}

export const CorrectBillModal: React.FC<CorrectBillModalProps> = ({
  isOpen,
  onClose,
  bill,
  operatorName = 'Building Owner',
  onSuccess
}) => {
  const [rent, setRent] = useState<number>(0);
  const [electricityAmount, setElectricityAmount] = useState<number>(0);
  const [waterAmount, setWaterAmount] = useState<number>(0);
  const [backDues, setBackDues] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bill) {
      setRent(bill.rent);
      setElectricityAmount(bill.electricityAmount);
      setWaterAmount(bill.waterAmount);
      setBackDues(bill.backDues);
      setReason('');
      setError(null);
    }
  }, [bill]);

  if (!isOpen || !bill) return null;

  const newSubtotal = Math.round(Number(rent) + Number(electricityAmount) + Number(waterAmount));
  const newTotal = Math.round(newSubtotal + Number(backDues));
  const newRemaining = Math.max(0, newTotal - (bill.paidAmount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a mandatory reason for this financial correction.');
      return;
    }

    setIsSubmitting(true);
    try {
      await correctBill(
        bill.id,
        {
          rent: Math.round(rent),
          electricityAmount: Math.round(electricityAmount),
          waterAmount: Math.round(waterAmount),
          backDues: Math.round(backDues),
          reason: reason.trim()
        },
        operatorName
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Correction failed:', err);
      setError(err.message || 'Failed to apply bill correction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="correct-bill-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 border border-slate-200"
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">Financial Correction & Audit</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">
              Invoice: {bill.invoiceNumber} • {bill.renterName} (Room {bill.roomNumber})
            </p>
            <p className="text-slate-500 mt-0.5">
              Current Statement Total: ₹{bill.totalAmount.toLocaleString('en-IN')} (Paid: ₹{bill.paidAmount.toLocaleString('en-IN')})
            </p>
          </div>

          {/* Editable Field Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Room Rent (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={rent}
                onChange={(e) => setRent(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Electricity Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={electricityAmount}
                onChange={(e) => setElectricityAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Water & Maintenance (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={waterAmount}
                onChange={(e) => setWaterAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Back Dues (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={backDues}
                onChange={(e) => setBackDues(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Recalculation Preview */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex justify-between font-medium text-slate-700">
              <span>Recalculated Subtotal:</span>
              <span className="font-bold text-slate-900">₹{newSubtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-medium text-slate-700">
              <span>Adjusted Total Amount:</span>
              <span className="font-extrabold text-sm text-amber-900">₹{newTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-amber-200">
              <span>Adjusted Remaining Due:</span>
              <span className="font-bold text-slate-900">₹{newRemaining.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correction Reason (Mandatory Audit Requirement) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Meter reading clerical error resolved with tenant."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Prior Corrections Log */}
          {bill.corrections && bill.corrections.length > 0 && (
            <div className="pt-2">
              <span className="font-bold text-slate-500 flex items-center space-x-1 mb-2">
                <History className="w-3.5 h-3.5" />
                <span>Prior Corrections History ({bill.corrections.length})</span>
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {bill.corrections.map((c, idx) => (
                  <div key={idx} className="text-[10px] text-slate-600 border-b border-slate-200 pb-1 last:border-0 last:pb-0">
                    <span className="font-semibold text-slate-800">{new Date(c.timestamp).toLocaleDateString()}:</span> {c.reason} (by {c.changedBy})
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Apply Correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
