import React, { useRef } from 'react';
import { X, Printer, CheckCircle, ShieldCheck, IndianRupee, Building2, Calendar, User, DoorClosed, CreditCard } from 'lucide-react';
import { Payment } from '../../types';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  payment
}) => {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const isVerified = payment.status === 'verified';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="payment-receipt-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 border border-slate-200"
      >
        {/* Top Header Actions (hidden in print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Payment Receipt:</span>
            <span className="text-xs font-mono font-bold text-amber-400">{payment.receiptId}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div ref={printableRef} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 bg-white print:p-0">
          
          {/* Header & Building Identity */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
                  AN
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950">AMIT NIWAS</h1>
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Official Payment Receipt</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Plot 42, Civil Lines Road, Sector 4, Amit Niwas Residential
              </p>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                isVerified 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {isVerified ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Payment Confirmed
                  </>
                ) : (
                  'Pending Verification'
                )}
              </span>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                Ref: {payment.receiptId}
              </p>
            </div>
          </div>

          {/* Key Receipt Fields Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resident Name</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{payment.renterName}</p>
              <p className="text-slate-500 mt-0.5 font-medium">Room {payment.roomNumber}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Date</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {new Date(payment.paidAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <p className="text-slate-500 mt-0.5">Method: {payment.method}</p>
            </div>
          </div>

          {/* Prominent Payment Amount Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 uppercase font-semibold tracking-wider block">
                  Amount Received
                </span>
                <div className="text-3xl font-black text-amber-400 mt-1 flex items-baseline">
                  <span>₹{payment.amount.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-300 ml-2 font-normal">INR (Whole Rupees)</span>
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">Remaining Due</span>
                <span className="font-bold text-base text-white">
                  ₹{payment.remainingDueAfterPayment.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Metadata Details */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="divide-y divide-slate-100">
              <div className="flex justify-between p-2.5 px-3.5 bg-slate-50/50">
                <span className="text-slate-500">Receipt Number</span>
                <span className="font-mono font-bold text-slate-800">{payment.receiptId}</span>
              </div>
              <div className="flex justify-between p-2.5 px-3.5">
                <span className="text-slate-500">Payment Channel</span>
                <span className="font-semibold text-slate-800">{payment.method}</span>
              </div>
              {payment.transactionId && (
                <div className="flex justify-between p-2.5 px-3.5 bg-slate-50/50">
                  <span className="text-slate-500">Transaction / UPI Ref</span>
                  <span className="font-mono font-medium text-slate-800">{payment.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between p-2.5 px-3.5">
                <span className="text-slate-500">Verification Status</span>
                <span className={`font-bold ${isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isVerified ? `Verified by ${payment.verifiedBy || 'Owner'}` : 'Awaiting Manual Verification'}
                </span>
              </div>
              {payment.notes && (
                <div className="flex justify-between p-2.5 px-3.5 bg-slate-50/50">
                  <span className="text-slate-500">Notes / Remarks</span>
                  <span className="text-slate-800">{payment.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Signature & Verification Stamp */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Computer Generated Official Receipt • Amit Niwas</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-800 block">Authorized Signatory</span>
              <span className="text-[10px] text-slate-400">Amit Niwas Management</span>
            </div>
          </div>
        </div>

        {/* Bottom Close Button (hidden in print) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
