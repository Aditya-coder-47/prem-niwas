import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  IndianRupee, 
  Printer, 
  Check, 
  Calendar,
  Zap,
  CreditCard,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Image as ImageIcon,
  ShieldAlert,
  Edit3,
  Ban,
  Building2,
  Layers
} from 'lucide-react';
import { 
  Bill, 
  Renter, 
  Room, 
  MeterReading, 
  Payment, 
  RentHistoryRecord, 
  BuildingSettings 
} from '../../types';
import { 
  subscribeBills, 
  subscribeMeterReadings, 
  subscribePayments, 
  subscribeRentHistory,
  subscribeBuildingSettings,
  approveMeterReading,
  verifyPayment,
  applyAnnualRentIncrease,
  DEFAULT_BUILDING_SETTINGS
} from '../../services/billingService';
import { GenerateBillModal } from '../modals/GenerateBillModal';
import { BillDetailsModal } from '../modals/BillDetailsModal';
import { RecordPaymentModal } from '../modals/RecordPaymentModal';
import { CancelBillModal } from '../modals/CancelBillModal';
import { CorrectBillModal } from '../modals/CorrectBillModal';
import { MeterRejectModal } from '../modals/MeterRejectModal';
import { PaymentReceiptModal } from '../modals/PaymentReceiptModal';
import { SettingsModal } from '../modals/SettingsModal';

interface BillsViewProps {
  renters: Renter[];
  rooms: Room[];
}

export const BillsView: React.FC<BillsViewProps> = ({ renters, rooms }) => {
  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState<'invoices' | 'meter_approvals' | 'payments' | 'rent_increase'>('invoices');

  // Real-time Firestore Collections
  const [bills, setBills] = useState<Bill[]>([]);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rentHistory, setRentHistory] = useState<RentHistoryRecord[]>([]);
  const [settings, setSettings] = useState<BuildingSettings>(DEFAULT_BUILDING_SETTINGS);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partially_paid' | 'paid' | 'cancelled'>('all');

  // Modal States
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isBillDetailsOpen, setIsBillDetailsOpen] = useState(false);
  
  const [billToPay, setBillToPay] = useState<Bill | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  
  const [billToCancel, setBillToCancel] = useState<Bill | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [billToCorrect, setBillToCorrect] = useState<Bill | null>(null);
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);

  const [readingToReject, setReadingToReject] = useState<MeterReading | null>(null);
  const [isRejectMeterOpen, setIsRejectMeterOpen] = useState(false);

  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Rent increase form state
  const [selectedRenterForIncrease, setSelectedRenterForIncrease] = useState<string>('');
  const [customIncreasePercent, setCustomIncreasePercent] = useState<number>(5);
  const [isApplyingIncrease, setIsApplyingIncrease] = useState<boolean>(false);

  // Subscriptions
  useEffect(() => {
    const unsubBills = subscribeBills(setBills);
    const unsubMeters = subscribeMeterReadings(setMeterReadings);
    const unsubPayments = subscribePayments(setPayments);
    const unsubRentHistory = subscribeRentHistory(null, setRentHistory);
    const unsubSettings = subscribeBuildingSettings(setSettings);

    return () => {
      unsubBills();
      unsubMeters();
      unsubPayments();
      unsubRentHistory();
      unsubSettings();
    };
  }, []);

  // Quick action: Approve Meter Reading
  const handleApproveReading = async (reading: MeterReading) => {
    try {
      await approveMeterReading(reading.id, 'Building Owner');
    } catch (err) {
      console.error('Failed to approve reading:', err);
      alert('Could not approve meter reading.');
    }
  };

  // Quick action: Verify Payment
  const handleVerifyPayment = async (payment: Payment) => {
    try {
      await verifyPayment(payment.id, 'Building Owner');
    } catch (err) {
      console.error('Failed to verify payment:', err);
      alert('Could not verify payment.');
    }
  };

  // Quick action: Apply Annual Rent Increase
  const handleApplyIncrease = async (renter: Renter) => {
    if (!window.confirm(`Apply ${customIncreasePercent}% annual rent increase for ${renter.fullName}?`)) return;
    setIsApplyingIncrease(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await applyAnnualRentIncrease(renter.id, customIncreasePercent, today, 'Building Owner');
      alert(`Annual rent increase applied successfully.`);
    } catch (err) {
      console.error('Rent increase failed:', err);
      alert('Failed to apply rent increase.');
    } finally {
      setIsApplyingIncrease(false);
    }
  };

  // Pending badge counts
  const pendingMeterCount = meterReadings.filter(m => m.status === 'pending_approval').length;
  const pendingPaymentCount = payments.filter(p => p.status === 'pending_verification').length;

  // Overview Stats
  const activeBills = bills.filter(b => b.status !== 'cancelled');
  const totalBilled = activeBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalCollected = activeBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
  const totalPendingDues = activeBills.reduce((acc, b) => acc + (b.remainingAmount || 0), 0);

  // Filtered Bills
  const filteredBills = bills.filter(b => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (b.renterName && b.renterName.toLowerCase().includes(query)) ||
      String(b.roomNumber).includes(query) ||
      (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(query)) ||
      (b.billingPeriod && b.billingPeriod.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="owner-bills-view" className="space-y-6 pb-20 md:pb-10">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
            <Receipt className="w-6 h-6 text-amber-500" />
            <span>Amit Niwas Billing & Invoicing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Meter readings, multi-slide monthly invoices, cash receipts, and annual rent adjustments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-amber-400" />
            <span>Building Settings</span>
          </button>

          <button
            id="generate-bill-btn"
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Bill</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
          <div className="text-xl md:text-2xl font-black text-white mt-1">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500">{activeBills.length} Active Bills</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collected</span>
          <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-500">Verified in Bank/Cash</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Balance</span>
          <div className="text-xl md:text-2xl font-black text-amber-400 mt-1">
            ₹{totalPendingDues.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-amber-500">Current & Back Dues</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action Items</span>
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-xs font-bold text-amber-400">
              {pendingMeterCount} Meter Approvals
            </span>
            <span className="text-xs font-bold text-blue-400">
              {pendingPaymentCount} Pay Checks
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Pending Manual Actions</span>
        </div>
      </div>

      {/* Main Feature Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-3 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'invoices' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>All Invoices & Statements</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-800 rounded-full text-slate-300">
            {bills.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('meter_approvals')}
          className={`pb-3 px-3 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'meter_approvals' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Meter Approvals</span>
          {pendingMeterCount > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded-full">
              {pendingMeterCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-3 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'payments' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Records & Receipts</span>
          {pendingPaymentCount > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-blue-500 text-white font-black rounded-full">
              {pendingPaymentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rent_increase')}
          className={`pb-3 px-3 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'rent_increase' 
              ? 'border-amber-500 text-amber-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Annual Rent Increases</span>
        </button>
      </div>

      {/* ================= TAB 1: ALL INVOICES ================= */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Search and Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resident, room, invoice..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto text-xs">
              {(['all', 'unpaid', 'partially_paid', 'paid', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices List */}
          {filteredBills.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              No bills match your current filters.
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Resident & Room</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Breakdown</th>
                      <th className="px-4 py-3">Total Due</th>
                      <th className="px-4 py-3">Paid / Remaining</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {filteredBills.map((b) => {
                      const isCancelled = b.status === 'cancelled';
                      const isPaid = b.status === 'paid';

                      return (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-white block">{b.invoiceNumber}</span>
                            <span className="text-[10px] text-slate-500">{b.billDate || 'Issued'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-white block">{b.renterName}</span>
                            <span className="text-[10px] text-slate-400">Room {b.roomNumber}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-300">
                            {b.billingPeriod}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-400 space-y-0.5">
                            <div>Rent: ₹{b.rent.toLocaleString('en-IN')}</div>
                            <div>
                              Elec: {b.electricityBillingType === 'included_in_rent' ? 'Included' : `₹${b.electricityAmount} (${b.electricityUnits || 0}u)`}
                            </div>
                            <div>Water: ₹{b.waterAmount}</div>
                            {b.backDues > 0 && <div className="text-rose-400 font-semibold">Dues: ₹{b.backDues}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-black text-sm text-white">
                              ₹{b.totalAmount.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="text-emerald-400 font-bold block">
                              ₹{b.paidAmount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-amber-400 font-semibold block text-[11px]">
                              Due: ₹{b.remainingAmount.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                              isPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : b.status === 'partially_paid'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : isCancelled
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}>
                              {b.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedBill(b);
                                setIsBillDetailsOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              View Statement
                            </button>

                            {!isPaid && !isCancelled && (
                              <button
                                onClick={() => {
                                  setBillToPay(b);
                                  setIsRecordPaymentOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Record Cash
                              </button>
                            )}

                            {!isCancelled && (
                              <button
                                onClick={() => {
                                  setBillToCorrect(b);
                                  setIsCorrectModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-400 rounded-md transition-colors cursor-pointer"
                                title="Financial Correction & Audit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!isCancelled && (
                              <button
                                onClick={() => {
                                  setBillToCancel(b);
                                  setIsCancelModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                                title="Cancel Invoice"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: METER READING APPROVALS ================= */}
      {activeTab === 'meter_approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Electricity Meter Readings Queue</span>
            </h2>
            <span className="text-xs text-slate-400">
              Approve readings before generating monthly electricity invoices.
            </span>
          </div>

          {meterReadings.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              No meter readings submitted by residents yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meterReadings.map((reading) => {
                const isPending = reading.status === 'pending_approval';

                return (
                  <div 
                    key={reading.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isPending 
                        ? 'bg-slate-900 border-amber-500/40 shadow-lg' 
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{reading.renterName}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                            Room {reading.roomNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{reading.billingPeriod}</span>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        reading.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : reading.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {reading.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 my-4 text-center text-xs">
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Previous</span>
                        <span className="font-mono font-bold text-slate-300 text-sm">{reading.previousReading}</span>
                      </div>
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Present</span>
                        <span className="font-mono font-black text-amber-400 text-sm">{reading.enteredReading}</span>
                      </div>
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Units</span>
                        <span className="font-bold text-emerald-400 text-sm">{reading.units}u</span>
                      </div>
                    </div>

                    {/* Photo proof & AI reading compare */}
                    {reading.photoUrl && (
                      <div className="mb-4 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={reading.photoUrl} 
                            alt="Meter" 
                            className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                          />
                          <div>
                            <a 
                              href={reading.photoUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-amber-400 hover:underline font-semibold block"
                            >
                              Inspect Full Photo Proof
                            </a>
                            {reading.aiDetectedReading !== null && reading.aiDetectedReading !== undefined && (
                              <span className="text-[10px] text-slate-400">
                                OCR Detected: {reading.aiDetectedReading}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-right font-black text-white text-sm">
                          ₹{reading.electricityAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    {reading.rejectionReason && (
                      <div className="mb-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-300">
                        <strong>Rejection Reason:</strong> {reading.rejectionReason}
                      </div>
                    )}

                    {/* Actions for Pending */}
                    {isPending && (
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setReadingToReject(reading);
                            setIsRejectMeterOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Reject with Reason
                        </button>

                        <button
                          onClick={() => handleApproveReading(reading)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Reading</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: PAYMENT RECORDS & RECEIPTS ================= */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>Payments & Official Cash/Online Receipts</span>
            </h2>
            <span className="text-xs text-slate-400">
              Review UPI transactions and produce official receipts.
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              No payments logged in the system yet.
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Receipt ID</th>
                      <th className="px-4 py-3">Resident</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Method & Ref</th>
                      <th className="px-4 py-3">Payment Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Receipt Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {payments.map((p) => {
                      const isPending = p.status === 'pending_verification';

                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-amber-400">
                            {p.receiptId}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-white block">{p.renterName}</span>
                            <span className="text-[10px] text-slate-400">Room {p.roomNumber}</span>
                          </td>
                          <td className="px-4 py-3 font-black text-sm text-emerald-400">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="text-white font-semibold block">{p.method}</span>
                            {p.transactionId && (
                              <span className="text-[10px] font-mono text-slate-400">
                                Ref: {p.transactionId}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {new Date(p.paidAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                              p.status === 'verified'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : p.status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}>
                              {p.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            {isPending && (
                              <button
                                onClick={() => handleVerifyPayment(p)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Verify Payment
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedPaymentReceipt(p);
                                setIsReceiptModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              View Official Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: ANNUAL RENT INCREASES ================= */}
      {activeTab === 'rent_increase' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="max-w-xl">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span>Anniversary-Based Annual Rent Increase</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Rules require rent increases to occur on each resident's move-in anniversary date (Default: {settings.defaultAnnualIncrease}%). All calculations automatically round to the nearest whole integer rupee.
              </p>
            </div>

            {/* Renters Anniversary Status Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Resident & Room</th>
                    <th className="px-4 py-3">Move-In Date</th>
                    <th className="px-4 py-3">Current Rent</th>
                    <th className="px-4 py-3">Annual %</th>
                    <th className="px-4 py-3">Next Year Rent</th>
                    <th className="px-4 py-3">Last Applied</th>
                    <th className="px-4 py-3 text-right">Apply Increase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {renters.filter(r => r.status === 'active').map((r) => {
                    const currentRent = r.monthlyRent || 6000;
                    const percent = r.annualIncreasePercent || settings.defaultAnnualIncrease || 5;
                    const calculatedIncrease = Math.round(currentRent * (percent / 100));
                    const newRent = Math.round(currentRent + calculatedIncrease);

                    return (
                      <tr key={r.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <span className="font-bold text-white block">{r.fullName}</span>
                          <span className="text-[10px] text-slate-400">Room {r.roomNumber}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-300">
                          {r.leaseStartDate || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-black text-white">
                          ₹{currentRent.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-amber-400 font-bold">
                          {percent}%
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">
                          ₹{newRent.toLocaleString('en-IN')} (+₹{calculatedIncrease})
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {r.lastAnnualIncreaseDate || 'Never'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleApplyIncrease(r)}
                            disabled={isApplyingIncrease}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] transition-colors cursor-pointer"
                          >
                            Apply {percent}% Increase
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Rent Adjustments Audit */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Historical Rent Adjustment Audit Log
              </h3>
              <span className="text-xs text-slate-400">{rentHistory.length} adjustments</span>
            </div>

            {rentHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No annual rent increases recorded in the archive yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Resident</th>
                      <th className="px-4 py-3">Effective Date</th>
                      <th className="px-4 py-3">Previous Rent</th>
                      <th className="px-4 py-3">Increase %</th>
                      <th className="px-4 py-3">Increase Amount</th>
                      <th className="px-4 py-3">New Rent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {rentHistory.map((h) => (
                      <tr key={h.id}>
                        <td className="px-4 py-3 font-bold text-white">{h.renterName}</td>
                        <td className="px-4 py-3 text-slate-400">{h.effectiveDate}</td>
                        <td className="px-4 py-3 font-mono">₹{h.previousRent.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-amber-400 font-bold">{h.increasePercent}%</td>
                        <td className="px-4 py-3 text-emerald-400">+₹{h.increaseAmount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 font-black text-white font-mono">₹{h.newRent.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      
      {/* 1. Generate Bill Modal */}
      <GenerateBillModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        renters={renters}
        rooms={rooms}
        onBillGenerated={() => {
          setIsGenerateModalOpen(false);
        }}
      />

      {/* 2. Bill Details Statement Modal */}
      <BillDetailsModal
        isOpen={isBillDetailsOpen}
        onClose={() => {
          setIsBillDetailsOpen(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        isOwner={true}
        onRecordCash={(bill) => {
          setIsBillDetailsOpen(false);
          setBillToPay(bill);
          setIsRecordPaymentOpen(true);
        }}
      />

      {/* 3. Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setBillToPay(null);
        }}
        bill={billToPay}
        isOwner={true}
        operatorName="Building Owner"
      />

      {/* 4. Cancel Bill Modal */}
      <CancelBillModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setBillToCancel(null);
        }}
        bill={billToCancel}
        operatorName="Building Owner"
      />

      {/* 5. Correct Bill Modal */}
      <CorrectBillModal
        isOpen={isCorrectModalOpen}
        onClose={() => {
          setIsCorrectModalOpen(false);
          setBillToCorrect(null);
        }}
        bill={billToCorrect}
        operatorName="Building Owner"
      />

      {/* 6. Meter Rejection Reason Modal */}
      <MeterRejectModal
        isOpen={isRejectMeterOpen}
        onClose={() => {
          setIsRejectMeterOpen(false);
          setReadingToReject(null);
        }}
        reading={readingToReject}
        operatorName="Building Owner"
      />

      {/* 7. Official Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedPaymentReceipt(null);
        }}
        payment={selectedPaymentReceipt}
      />

      {/* 8. Building Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        operatorName="Building Owner"
      />

    </div>
  );
};
