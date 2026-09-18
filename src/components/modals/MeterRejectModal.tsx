import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { MeterReading } from '../../types';
import { rejectMeterReading } from '../../services/billingService';

interface MeterRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  reading: MeterReading | null;
  operatorName?: string;
  onSuccess?: () => void;
}

export const MeterRejectModal: React.FC<MeterRejectModalProps> = ({
  isOpen,
  onClose,
  reading,
  operatorName = 'Building Owner',
  onSuccess
}) => {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !reading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason to guide the resident on correcting their meter reading.');
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectMeterReading(reading.id, reason.trim(), operatorName);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Meter rejection error:', err);
      setError(err.message || 'Failed to reject meter reading');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetReasons = [
    'Meter photo is too blurry or dark to read the digits.',
    'Entered reading does not match the digits shown in photo.',
    'Odometer reflection obscures the last digits. Please re-take with flash off.',
    'Reading appears lower than historical baseline. Please re-check.'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="meter-reject-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 border border-slate-200"
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h2 className="text-base font-bold">Reject Meter Reading</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              {error}
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">
              Resident: {reading.renterName} (Room {reading.roomNumber})
            </span>
            <span className="text-slate-500">
              Submitted Reading: {reading.enteredReading} ({reading.units} units)
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Quick Reason
            </label>
            <div className="space-y-1.5">
              {presetReasons.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="w-full text-left p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] text-slate-700 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Custom Feedback Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the reading could not be approved..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
