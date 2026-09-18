import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  QrCode, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  ShieldAlert,
  IndianRupee
} from 'lucide-react';
import { Bill, BuildingSettings, PaymentMethod } from '../../types';
import { recordPayment, getBuildingSettings } from '../../services/billingService';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  isOwner?: boolean;
  operatorName?: string;
  onSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  bill,
  isOwner = false,
  operatorName = 'Resident',
  onSuccess
}) => {
  const [method, setMethod] = useState<PaymentMethod>(isOwner ? 'Cash' : 'UPI');
  const [amount, setAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [settings, setSettings] = useState<BuildingSettings | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bill) {
      setAmount(bill.remainingAmount > 0 ? bill.remainingAmount : bill.totalAmount);
      setMethod(isOwner ? 'Cash' : 'UPI');
      setTransactionId('');
      setNotes('');
      setError(null);
    }
  }, [bill, isOwner]);

  useEffect(() => {
    getBuildingSettings().then(setSettings).catch(console.warn);
  }, []);

  if (!isOpen || !bill) return null;

  const upiId = settings?.upiId || 'premniwas@okaxis';
  const upiName = settings?.upiName || 'Prem Niwas Management';

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`PREM NIWAS Bill R${bill.roomNumber}`)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than â‚¹0');
      return;
    }

    if (numAmount > bill.remainingAmount) {
      setError(`Payment amount cannot exceed remaining due (â‚¹${bill.remainingAmount.toLocaleString('en-IN')})`);
      return;
    }

    if (!isOwner && (method === 'UPI' || method === 'QR') && !transactionId.trim()) {
      setError('Please enter your 12-digit UPI reference / transaction ID for verification');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPayment(
        {
          billId: bill.id,
          renterId: bill.renterId,
          renterName: bill.renterName,
          roomId: bill.roomId,
          roomNumber: bill.roomNumber,
          amount: Math.round(numAmount),
          method,
          transactionId: transactionId.trim(),
          upiRef: transactionId.trim(),
          notes: notes.trim()
        },
        isOwner, // if owner, verified immediately
        operatorName
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Payment submission failed:', err);
      setError(err.message || 'Failed to submit payment record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="record-payment-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">
              {isOwner ? 'Record Rent / Bill Payment' : 'Pay PREM NIWAS Bill'}
            </h2>
            <p className="text-xs text-slate-400">
              Invoice {bill.invoiceNumber} â€¢ Room {bill.roomNumber} ({bill.renterName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Dues Summary Pill */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Total Statement Amount:</span>
              <span className="font-bold text-slate-900 text-sm">â‚¹{bill.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Remaining Due:</span>
              <span className="font-extrabold text-amber-700 text-base">â‚¹{bill.remainingAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  method === 'UPI'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>UPI Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('QR')}
                className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  method === 'QR'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span>Scan QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('Cash')}
                className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  method === 'Cash'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-600" />
                <span>In-Person Cash</span>
              </button>
            </div>
          </div>

          {/* Online UPI / QR Details Box */}
          {(method === 'UPI' || method === 'QR') && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Owner UPI ID</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {settings?.qrCodeUrl && method === 'QR' && (
                <div className="text-center pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-2">Scan to Pay via any UPI App</span>
                  <img 
                    src={settings.qrCodeUrl} 
                    alt="Payment QR Code" 
                    className="w-44 h-44 mx-auto rounded-xl border border-slate-300 shadow-xs object-contain bg-white p-2"
                  />
                </div>
              )}

              {/* Requirement 30 & 31: Verification Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold block">Status will show: "Payment Verification Pending"</span>
                  <span>After you submit, the building owner will manually verify the payment in bank records before marking as verified.</span>
                </div>
              </div>
            </div>
          )}

          {/* Amount Field (Allows Partial Payment) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Amount (â‚¹)
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Full or partial amount accepted
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">â‚¹</span>
              <input
                type="number"
                min="1"
                max={bill.remainingAmount}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {amount < bill.remainingAmount && (
              <p className="text-[11px] text-amber-700 mt-1 font-medium">
                Remaining due after this payment: â‚¹{(bill.remainingAmount - amount).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Transaction ID / UPI Ref Field */}
          {(method === 'UPI' || method === 'QR' || !isOwner) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Transaction ID / UTR / Reference Number {method !== 'Cash' && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                required={method !== 'Cash' && !isOwner}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 12-digit UTR (423891234567)"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Remarks / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via GooglePay or Cash hand-over"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer ${
                isOwner 
                  ? 'bg-slate-900 hover:bg-slate-800' 
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isSubmitting ? (
                <span>Recording Payment...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isOwner ? 'Confirm Cash Receipt' : 'Submit Payment For Verification'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
