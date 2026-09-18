import React, { useRef } from 'react';
import { X, Printer, CheckCircle, Clock, AlertTriangle, Building, Phone, IndianRupee, ShieldCheck } from 'lucide-react';
import { Bill } from '../../types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onMarkPaid?: (billId: string) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  bill,
  onMarkPaid
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = bill.status === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="invoice-modal-container"
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Invoice:</span>
            <span className="text-xs font-mono font-bold text-amber-400">{bill.invoiceNumber}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="print-invoice-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              id="close-invoice-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div 
          ref={receiptRef}
          className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0"
        >
          {/* Official Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
                  AN
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950">AMIT NIWAS</h1>
                  <p className="text-[11px] font-medium text-slate-600">Residential Rental Management</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Plot 42, Civil Lines Road, Sector 4, Amit Niwas
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border">
                {isPaid ? (
                  <span className="text-emerald-700 bg-emerald-50 border-emerald-300 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                    PAID RECEIPT
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 border-amber-300 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                    PAYMENT DUE
                  </span>
                )}
              </span>
              <p className="text-xs font-mono font-semibold text-slate-800">#{bill.invoiceNumber}</p>
              <p className="text-[11px] text-slate-500">Date: {new Date(bill.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Tenant & Bill Meta Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Billed To (Resident)</p>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{bill.renterName}</p>
              <p className="text-slate-600 mt-0.5">Room No: <strong className="text-slate-900">{bill.roomNumber}</strong></p>
              {bill.renterPhone && (
                <p className="text-slate-600 flex items-center space-x-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{bill.renterPhone}</span>
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Billing Cycle</p>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{bill.billingMonth}</p>
              <p className="text-slate-600 mt-0.5">Due Date: <strong className="text-slate-900">{bill.dueDate}</strong></p>
              {isPaid && bill.paidAt && (
                <p className="text-emerald-700 font-semibold mt-0.5">
                  Paid on: {new Date(bill.paidAt).toLocaleDateString('en-IN')} {bill.paymentMode ? `(${bill.paymentMode})` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-center">Details</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-800">
                <tr>
                  <td className="py-2.5 px-4 font-medium">Monthly Room Rent</td>
                  <td className="py-2.5 px-4 text-center text-slate-500">Room {bill.roomNumber}</td>
                  <td className="py-2.5 px-4 text-right font-medium">₹{(bill.rent ?? bill.rentAmount ?? 0).toLocaleString('en-IN')}</td>
                </tr>

                {Number(bill.electricityTotal || 0) > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 font-medium">Electricity Charges</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">
                      {bill.electricityUnits || 0} units @ ₹{bill.electricityRate || 8}/unit
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium">₹{(bill.electricityTotal || 0).toLocaleString('en-IN')}</td>
                  </tr>
                )}

                {Number(bill.waterCharges || 0) > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 font-medium">Water Supply & Overhead</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">Fixed Monthly</td>
                    <td className="py-2.5 px-4 text-right font-medium">₹{bill.waterCharges?.toLocaleString('en-IN')}</td>
                  </tr>
                )}

                {Number(bill.maintenanceCharges || 0) > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 font-medium">Building Maintenance & WiFi</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">Common Amenities</td>
                    <td className="py-2.5 px-4 text-right font-medium">₹{bill.maintenanceCharges?.toLocaleString('en-IN')}</td>
                  </tr>
                )}

                {Number(bill.otherCharges || 0) > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 font-medium">{bill.otherChargesDesc || 'Other Services / Miscellaneous'}</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">Extra Charges</td>
                    <td className="py-2.5 px-4 text-right font-medium">₹{bill.otherCharges?.toLocaleString('en-IN')}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-900 font-bold">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-slate-900 text-sm">TOTAL PAYABLE</td>
                  <td className="py-3 px-4 text-right text-base text-slate-950 font-black">
                    ₹{bill.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes & Verification Stamp */}
          <div className="flex items-end justify-between pt-2">
            <div className="max-w-xs text-[11px] text-slate-500 space-y-1">
              {bill.notes && (
                <p><strong>Note:</strong> {bill.notes}</p>
              )}
              <p>Payment Modes: UPI (GPay / PhonePe / Paytm), Cash, or Direct Bank Transfer.</p>
              <p className="text-[10px] text-slate-400">System-generated digital receipt. Amit Niwas Management.</p>
            </div>

            {isPaid ? (
              <div className="p-3 border-2 border-emerald-500 rounded-xl text-center text-emerald-700 bg-emerald-50/50">
                <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-wider">VERIFIED PAID</span>
                <p className="text-[9px] text-slate-500">{bill.paymentMode || 'Cash/UPI'} Payment Received</p>
              </div>
            ) : (
              <div className="p-3 border-2 border-amber-400 rounded-xl text-center text-amber-800 bg-amber-50/50">
                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">PAYMENT PENDING</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between print:hidden">
          <div>
            {!isPaid && onMarkPaid && (
              <button
                id="mark-bill-as-paid-btn"
                onClick={() => onMarkPaid(bill.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Bill as Paid</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="close-invoice-footer-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-750 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              id="print-invoice-footer-btn"
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
