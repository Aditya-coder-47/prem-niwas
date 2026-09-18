import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Zap, 
  Home, 
  Droplets, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  IndianRupee, 
  ShieldCheck, 
  ArrowRight, 
  CreditCard,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Bill } from '../../types';

interface BillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onPayNow?: (bill: Bill) => void;
  onRecordCash?: (bill: Bill) => void;
  isOwner?: boolean;
}

export const BillDetailsModal: React.FC<BillDetailsModalProps> = ({
  isOpen,
  onClose,
  bill,
  onPayNow,
  onRecordCash,
  isOwner = false
}) => {
  const [activeSlide, setActiveSlide] = useState<'electricity' | 'rent' | 'total'>('electricity');
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = bill.status === 'paid';
  const isCancelled = bill.status === 'cancelled';
  const isPartiallyPaid = bill.status === 'partially_paid';

  const isMeterBased = bill.electricityBillingType === 'meter_based';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="bill-details-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 border border-slate-200"
      >
        {/* Top Control Bar (Hidden in Print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Invoice:</span>
            <span className="text-xs font-mono font-bold text-amber-400">{bill.invoiceNumber}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="print-bill-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Swipe / Section Selector Tabs (Requirement 23) */}
        <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold print:hidden">
          <button
            onClick={() => setActiveSlide('electricity')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeSlide === 'electricity' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Slide 1: Electricity</span>
          </button>

          <button
            onClick={() => setActiveSlide('rent')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeSlide === 'rent' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4 text-blue-500" />
            <span>Slide 2: Rent & Other</span>
          </button>

          <button
            onClick={() => setActiveSlide('total')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeSlide === 'total' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Final: Total Amount</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={printableRef} className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1 bg-white print:p-0">
          
          {/* Official Letterhead & Meta */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
                  AN
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950">PREM NIWAS</h1>
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Monthly Rental & Utility Statement
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Plot 42, Civil Lines Road, Sector 4, PREM NIWAS
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                isPaid 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : isPartiallyPaid
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : isCancelled
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {bill.status.toUpperCase().replace('_', ' ')}
              </span>
              <p className="text-[11px] font-semibold text-slate-900">
                Period: {bill.billingPeriod}
              </p>
              <p className="text-[10px] text-slate-500">
                Payment Due: 1st–10th
              </p>
            </div>
          </div>

          {/* Renter & Room Information Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resident</span>
              <span className="font-bold text-slate-900">{bill.renterName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Room Number</span>
              <span className="font-bold text-slate-900 font-mono">Room {bill.roomNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bill Date</span>
              <span className="font-semibold text-slate-800">{bill.billDate || 'Issued'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Due Date</span>
              <span className="font-semibold text-rose-700">{bill.dueDate}</span>
            </div>
          </div>

          {/* ================= SLIDE 1 — ELECTRICITY ================= */}
          <div className={`${activeSlide === 'electricity' ? 'block' : 'hidden md:block'} space-y-3`}>
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Slide 1 — Electricity Calculation</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                Billing Type: {isMeterBased ? 'Meter Based' : 'Included in Rent'}
              </span>
            </div>

            {isMeterBased ? (
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Previous Reading</span>
                    <span className="text-base font-extrabold font-mono text-slate-900 mt-0.5 block">
                      {bill.previousMeterReading ?? 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Present Reading</span>
                    <span className="text-base font-extrabold font-mono text-slate-900 mt-0.5 block">
                      {bill.presentMeterReading ?? 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Units Consumed</span>
                    <span className="text-base font-extrabold text-amber-700 mt-0.5 block">
                      {bill.electricityUnits || 0}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Rate</span>
                    <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                      ₹{bill.electricityRate || 8}/unit
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-200 text-xs font-bold">
                  <span className="text-slate-700">
                    Electricity Subtotal ({bill.electricityUnits || 0} units × ₹{bill.electricityRate || 8}):
                  </span>
                  <span className="text-base font-black text-amber-900">
                    ₹{bill.electricityAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-center text-xs">
                <span className="font-bold text-blue-900 text-sm block">Electricity: Included in Rent</span>
                <p className="text-blue-700 mt-1 max-w-md mx-auto">
                  As per your residential agreement, electricity consumption is already included in your monthly room rent. No separate electricity charge is assessed.
                </p>
                <span className="inline-block mt-2 font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-blue-200">
                  Separate Electricity Charge: ₹0
                </span>
              </div>
            )}
          </div>

          {/* ================= SLIDE 2 — RENT & OTHER ================= */}
          <div className={`${activeSlide === 'rent' ? 'block' : 'hidden md:block'} space-y-3`}>
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                <Home className="w-4 h-4 text-blue-500" />
                <span>Slide 2 — Rent & Other Charges</span>
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 divide-y divide-slate-200 text-xs">
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-bold text-slate-800 block">Room Base Rent</span>
                  <span className="text-[10px] text-slate-500">
                    Includes annual increase rule ({bill.annualIncreasePercent || 5}% on entry date anniversary)
                  </span>
                </div>
                <span className="font-extrabold text-sm text-slate-900">
                  ₹{bill.rent.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-bold text-slate-800 block">Water & Maintenance Charges</span>
                  <span className="text-[10px] text-slate-500">Fixed utility share</span>
                </div>
                <span className="font-extrabold text-sm text-slate-900">
                  ₹{bill.waterAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-bold text-slate-800 block">Back Dues (Carried Over)</span>
                  <span className="text-[10px] text-slate-500">
                    {bill.backDues > 0 ? 'Unpaid balance from past billing periods' : 'No prior outstanding dues'}
                  </span>
                </div>
                <span className={`font-extrabold text-sm ${bill.backDues > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                  ₹{bill.backDues.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5 text-xs font-bold">
                <span className="text-slate-700">Subtotal (Rent + Water):</span>
                <span className="text-sm font-black text-slate-900">
                  ₹{(bill.rent + bill.waterAmount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* ================= FINAL — TOTAL AMOUNT ================= */}
          <div className={`${activeSlide === 'total' ? 'block' : 'hidden md:block'} space-y-3`}>
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Final Calculation & Settlement</span>
              </h3>
            </div>

            {/* Prominent Total Amount Card (Requirement 24) */}
            <div className="bg-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-amber-400 uppercase tracking-wider font-bold block">
                    Total Amount Due
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                    ₹{bill.totalAmount.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Payment Window: 1st to 10th of {bill.billingPeriod}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Amount Paid</span>
                    <span className="text-base font-bold text-emerald-400">
                      ₹{bill.paidAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Remaining Due</span>
                    <span className="text-base font-bold text-amber-300">
                      ₹{bill.remainingAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation or Correction Note if present */}
            {isCancelled && bill.cancellationReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <span className="font-bold block">Bill Cancelled:</span>
                <p className="mt-0.5">{bill.cancellationReason} (by {bill.cancelledBy || 'Owner'})</p>
              </div>
            )}
          </div>

          {/* Footer Official Verification */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PREM NIWAS • Official Bill Record</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-800 block">Prem Niwas Management</span>
              <span className="text-[10px] text-slate-400">Plot 42, Civil Lines, Sector 4</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar (Hidden in Print) */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span>Status:</span>
            <span className="font-bold text-slate-900 capitalize">{bill.status.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Owner action: Record Cash */}
            {isOwner && !isPaid && !isCancelled && onRecordCash && (
              <button
                onClick={() => onRecordCash(bill)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Record Cash Paid
              </button>
            )}

            {/* Renter action: Pay Now */}
            {!isOwner && !isPaid && !isCancelled && onPayNow && (
              <button
                onClick={() => onPayNow(bill)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay Now (UPI / QR / Cash)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
