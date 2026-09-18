import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  FileText, 
  Bell, 
  DoorClosed, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Receipt, 
  MessageSquare,
  Send,
  Printer,
  Clock,
  QrCode,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Check,
  X,
  Zap,
  ArrowRight,
  Layers,
  History
} from 'lucide-react';
import { Renter, Room, Notice, Bill, ChatMessage, Payment, BuildingSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  PREM_NIWAS_BUILDING, 
  subscribeRenterBills, 
  subscribeChatMessages, 
  sendChatMessage 
} from '../../services/db';
import { 
  subscribePayments, 
  subscribeBuildingSettings, 
  DEFAULT_BUILDING_SETTINGS 
} from '../../services/billingService';
import { MyMeterReadingView } from './MyMeterReadingView';
import { BillDetailsModal } from '../modals/BillDetailsModal';
import { RecordPaymentModal } from '../modals/RecordPaymentModal';
import { PaymentReceiptModal } from '../modals/PaymentReceiptModal';

interface RenterPortalProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  renter: Renter | null;
  assignedRoom: Room | null;
  notices: Notice[];
}

export const RenterPortal: React.FC<RenterPortalProps> = ({
  currentTab,
  onSelectTab,
  renter,
  assignedRoom,
  notices
}) => {
  const { profile } = useAuth();
  
  // Real-time bills for this renter
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<BuildingSettings>(DEFAULT_BUILDING_SETTINGS);

  // Modals
  const [selectedBillForDetails, setSelectedBillForDetails] = useState<Bill | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [billToPay, setBillToPay] = useState<Bill | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  // Real-time Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Subscriptions
  useEffect(() => {
    if (!renter?.id) return;
    const unsubBills = subscribeRenterBills(renter.id, setBills);
    const unsubChat = subscribeChatMessages(renter.id, setChatMessages);
    const unsubPayments = subscribePayments((allPayments) => {
      setPayments(allPayments.filter(p => p.renterId === renter.id));
    });
    const unsubSettings = subscribeBuildingSettings(setSettings);

    return () => {
      unsubBills();
      unsubChat();
      unsubPayments();
      unsubSettings();
    };
  }, [renter?.id]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (currentTab === 'renter-chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, currentTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !renter) return;

    setSendingMsg(true);
    try {
      await sendChatMessage({
        buildingId: PREM_NIWAS_BUILDING.id,
        senderId: renter.id,
        senderName: renter.fullName,
        senderRole: 'renter',
        receiverId: 'owner',
        receiverName: 'Prem Niwas Management',
        text: chatInput.trim()
      });
      setChatInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  if (!renter) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <DoorClosed className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Tenant Record Pending</h2>
          <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            Welcome to PREM NIWAS. Your account is logged in as <strong>{profile?.email}</strong>. Once the building owner registers your tenant profile and assigns a room, your full room allotment, invoices, and messaging will display here.
          </p>
        </div>
      </div>
    );
  }

  // Active (non-cancelled) bills
  const activeBills = bills.filter(b => b.status !== 'cancelled');
  const pendingBills = activeBills.filter(b => b.status !== 'paid');
  const totalOutstanding = pendingBills.reduce((acc, curr) => acc + (curr.remainingAmount ?? curr.totalAmount ?? 0), 0);

  // Most recent bill
  const currentBill: Bill | undefined = activeBills.length > 0 
    ? [...activeBills].sort((a, b) => new Date(b.billDate || b.createdAt).getTime() - new Date(a.billDate || a.createdAt).getTime())[0]
    : undefined;

  // Check if current bill has pending verification payments
  const currentBillPendingVerification = currentBill && payments.some(
    p => p.billId === currentBill.id && p.status === 'pending_verification'
  );

  return (
    <div id="renter-portal" className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto px-2 sm:px-4">
      
      {/* Resident Welcome Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Prem Niwas Resident Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome, {renter.fullName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Resident of <strong className="text-amber-400 font-mono">Room {renter.roomNumber || 'Pending'}</strong> â€¢ Prem Niwas Building
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-xl text-xs">
            <span className="text-slate-400 block text-[10px]">Tenancy Status</span>
            <span className="font-bold text-emerald-400 flex items-center mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {renter.status === 'active' ? 'Active Resident' : 'Checked Out'}
            </span>
          </div>

          {totalOutstanding > 0 && (
            <button
              onClick={() => onSelectTab('renter-bills')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>â‚¹{totalOutstanding.toLocaleString('en-IN')} Due</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: MY ROOM & QUICK OVERVIEW ================= */}
      {currentTab === 'renter-room' && (
        <div className="space-y-6">
          
          {/* Prominent Current Bill Summary Card (Requirements 47 & 48) */}
          {currentBill && (
            <div className="bg-white border-2 border-amber-400/80 rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Your Current Statement
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5 flex items-center space-x-2">
                    <Receipt className="w-5 h-5 text-amber-500" />
                    <span>Statement for {currentBill.billingPeriod}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Due by <strong className="text-rose-600 font-semibold">{currentBill.dueDate || '10th of Month'}</strong> â€¢ Invoice #{currentBill.invoiceNumber}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Status Badge */}
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                    currentBillPendingVerification
                      ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                      : currentBill.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : currentBill.status === 'partially_paid'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {currentBillPendingVerification
                      ? 'Payment Verification Pending'
                      : currentBill.status === 'paid'
                      ? 'Paid'
                      : currentBill.status === 'partially_paid'
                      ? 'Partially Paid'
                      : 'Payment Due'}
                  </span>
                </div>
              </div>

              {/* Breakdown Figures */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Room Rent</span>
                  <span className="font-bold text-slate-900 text-sm">â‚¹{currentBill.rent.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Electricity</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {currentBill.electricityBillingType === 'included_in_rent'
                      ? 'Included'
                      : `â‚¹${currentBill.electricityAmount.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Water & Utilities</span>
                  <span className="font-bold text-slate-900 text-sm">â‚¹{currentBill.waterAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 block uppercase font-bold">Total Statement</span>
                  <span className="font-black text-amber-950 text-base">â‚¹{currentBill.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-600">
                  {currentBill.remainingAmount > 0 ? (
                    <span>
                      Remaining balance to clear: <strong className="text-rose-600 font-bold">â‚¹{currentBill.remainingAmount.toLocaleString('en-IN')}</strong>
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      All charges fully settled for this billing period.
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedBillForDetails(currentBill);
                      setIsDetailsModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>View Full Statement</span>
                  </button>

                  {currentBill.status !== 'paid' && (
                    <button
                      onClick={() => {
                        setBillToPay(currentBill);
                        setIsPaymentModalOpen(true);
                      }}
                      className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Online via UPI</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Room Allotment Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <Home className="w-5 h-5 text-amber-500" />
              <span>Residential Unit Allotment Details</span>
            </h2>

            {renter.roomNumber ? (
              <div className="space-y-6">
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Assigned Room
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1 block">
                      Room {renter.roomNumber}
                    </span>
                    <span className="text-xs text-slate-600 mt-0.5 block">
                      {assignedRoom?.floor || 'Ground Floor'} â€¢ {assignedRoom?.type || 'Residential Unit'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Agreed Monthly Rent
                    </span>
                    <span className="text-2xl font-bold text-slate-900 mt-1 block">
                      â‚¹{renter.monthlyRent?.toLocaleString('en-IN') || 0}<span className="text-xs text-slate-500 font-normal"> / mo</span>
                    </span>
                    <span className="text-xs text-slate-600 mt-0.5 block">
                      Payment due on 1stâ€“10th of each month
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Security Deposit
                    </span>
                    <span className="text-2xl font-bold text-slate-900 mt-1 block">
                      â‚¹{renter.securityDeposit?.toLocaleString('en-IN') || 0}
                    </span>
                    <span className="text-xs text-emerald-700 mt-0.5 font-medium flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Held securely with management
                    </span>
                  </div>
                </div>

                {/* Tenancy & Utility Rules */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
                      Tenancy Details
                    </span>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Move-in / Lease Start:</span>
                      <span className="font-semibold text-slate-900">{renter.leaseStartDate || 'Recorded'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Notice Period:</span>
                      <span className="font-semibold text-slate-900">30 Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Electricity Billing:</span>
                      <span className="font-bold text-slate-900">
                        {renter.electricityBillingType === 'included_in_rent' 
                          ? 'Included in Rent' 
                          : `Metered (â‚¹${settings.electricityRate}/unit)`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
                      Building Information
                    </span>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Building Name:</span>
                      <span className="font-semibold text-slate-900">PREM NIWAS</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Address:</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[200px]">{PREM_NIWAS_BUILDING.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Water Utility:</span>
                      <span className="font-semibold text-slate-900">â‚¹{settings.defaultWaterCharges}/month</span>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => onSelectTab('renter-meter')}
                    className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Zap className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Monthly
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-2">Electricity Meter</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Submit meter photo & calculate units</p>
                  </button>

                  <button
                    onClick={() => onSelectTab('renter-bills')}
                    className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Receipt className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                        {pendingBills.length} Pending
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-2">Invoices & Statements</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Multi-slide statements and receipts</p>
                  </button>

                  <button
                    onClick={() => onSelectTab('renter-chat')}
                    className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <MessageSquare className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Chat
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-2">Owner Communication</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Direct chat with building management</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">No active room currently assigned.</p>
                <p className="text-xs text-slate-500 mt-1">Please contact the building owner to allot an available room.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: MY METER READING ================= */}
      {currentTab === 'renter-meter' && (
        <MyMeterReadingView
          renter={renter}
          buildingSettings={settings}
        />
      )}

      {/* ================= TAB 3: MY BILLS & INVOICES ================= */}
      {currentTab === 'renter-bills' && (
        <div className="space-y-6">
          
          {/* Prominent Current Bill Card (Requirement 47 & 48) */}
          {currentBill && (
            <div className="bg-white border-2 border-amber-400 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                    Current Monthly Statement
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    Statement for {currentBill.billingPeriod}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Invoice #{currentBill.invoiceNumber} â€¢ Payment Due: <strong className="text-rose-600 font-semibold">{currentBill.dueDate || '10th of Month'}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                    currentBillPendingVerification
                      ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                      : currentBill.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : currentBill.status === 'partially_paid'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {currentBillPendingVerification
                      ? 'Payment Verification Pending'
                      : currentBill.status === 'paid'
                      ? 'Paid'
                      : currentBill.status === 'partially_paid'
                      ? 'Partially Paid'
                      : 'Payment Due'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Slide 2: Rent</span>
                  <span className="font-bold text-slate-900 text-sm">â‚¹{currentBill.rent.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Slide 1: Electricity</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {currentBill.electricityBillingType === 'included_in_rent'
                      ? 'Included'
                      : `â‚¹${currentBill.electricityAmount.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Water & Maint</span>
                  <span className="font-bold text-slate-900 text-sm">â‚¹{currentBill.waterAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 block uppercase font-bold">Total Statement</span>
                  <span className="font-black text-amber-950 text-base">â‚¹{currentBill.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-600">
                  {currentBill.remainingAmount > 0 ? (
                    <span>
                      Balance Due: <strong className="text-rose-600 font-bold">â‚¹{currentBill.remainingAmount.toLocaleString('en-IN')}</strong>
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      All charges fully settled.
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedBillForDetails(currentBill);
                      setIsDetailsModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>View Slides Statement</span>
                  </button>

                  {currentBill.status !== 'paid' && (
                    <button
                      onClick={() => {
                        setBillToPay(currentBill);
                        setIsPaymentModalOpen(true);
                      }}
                      className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay via UPI / QR</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Historical Invoices Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>All Invoices & Statement History</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official invoices issued by Prem Niwas Management.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {activeBills.length} statements
              </span>
            </div>

            {activeBills.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No bills have been issued yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Rent</th>
                      <th className="px-4 py-3">Electricity</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Remaining</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {activeBills.map((b) => {
                      const isPendingVerif = payments.some(p => p.billId === b.id && p.status === 'pending_verification');

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {b.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {b.billingPeriod}
                          </td>
                          <td className="px-4 py-3">â‚¹{b.rent.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3">
                            {b.electricityBillingType === 'included_in_rent' ? 'Included' : `â‚¹${b.electricityAmount}`}
                          </td>
                          <td className="px-4 py-3 font-black text-slate-900">
                            â‚¹{b.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 font-bold text-rose-600">
                            â‚¹{b.remainingAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                              isPendingVerif
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : b.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : b.status === 'partially_paid'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {isPendingVerif ? 'Verification Pending' : b.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedBillForDetails(b);
                                setIsDetailsModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Statement
                            </button>

                            {b.status !== 'paid' && (
                              <button
                                onClick={() => {
                                  setBillToPay(b);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payments & Receipts History */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span>Payment Receipts & Proofs</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official stamped receipts for payments made towards PREM NIWAS rent.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {payments.length} receipts
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Receipt ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Verification</th>
                      <th className="px-4 py-3 text-right">View / Print</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-amber-700">{p.receiptId}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-900">â‚¹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold block">{p.method}</span>
                          {p.transactionId && <span className="text-[10px] text-slate-400 font-mono">Ref: {p.transactionId}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            p.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                          }`}>
                            {p.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedReceipt(p);
                              setIsReceiptModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: CHAT WITH OWNER ================= */}
      {currentTab === 'renter-chat' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                AN
              </div>
              <div>
                <h3 className="font-bold text-sm">Prem Niwas Management Support</h3>
                <p className="text-[10px] text-emerald-400 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                  Owner Direct Line
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {chatMessages.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                No chat messages yet. Start a conversation with Prem Niwas Management.
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderId === renter.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                        isMe
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className={`text-[10px] font-bold ${isMe ? 'text-slate-800' : 'text-slate-500'}`}>
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span className={`text-[9px] ${isMe ? 'text-slate-700' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type your message to management..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={sendingMsg || !chatInput.trim()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 5: BUILDING NOTICES ================= */}
      {currentTab === 'renter-notices' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>Building Notice Board</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official updates, water timings, and guidelines posted by Prem Niwas Management.
            </p>
          </div>

          {notices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active notices</p>
              <p className="text-xs text-slate-400 mt-1">Management will post announcements here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3 ${
                    notice.isPinned ? 'border-amber-400/80 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {notice.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(notice.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{notice.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {notice.content}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                    Posted by: {notice.createdByName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: MY PROFILE & KYC ================= */}
      {currentTab === 'renter-profile' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>My Profile & Registration Record</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official tenant registration record as logged with Prem Niwas Management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5">
                Personal Identification
              </h3>
              <div className="flex justify-between">
                <span className="text-slate-500">Legal Name:</span>
                <span className="font-bold text-slate-900">{renter.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile Phone:</span>
                <span className="font-semibold text-slate-900">{renter.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-semibold text-slate-900">{renter.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Occupation:</span>
                <span className="font-semibold text-slate-900">{renter.occupation || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Workplace:</span>
                <span className="font-semibold text-slate-900">{renter.workplace || 'N/A'}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5">
                KYC & Police Record Info
              </h3>
              <div className="flex justify-between">
                <span className="text-slate-500">Identity Document:</span>
                <span className="font-bold text-slate-900">{renter.govIdType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Document Number:</span>
                <span className="font-mono font-semibold text-slate-900">{renter.govIdNumber}</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-0.5">Permanent Address:</span>
                <p className="font-medium text-slate-800 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                  {renter.permanentAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Multi-Slide Statement Details Modal */}
      <BillDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedBillForDetails(null);
        }}
        bill={selectedBillForDetails}
        isOwner={false}
        onPayNow={(bill: Bill) => {
          setIsDetailsModalOpen(false);
          setBillToPay(bill);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* 2. Record / Submit Payment Modal (Resident Mode) */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setBillToPay(null);
        }}
        bill={billToPay}
        isOwner={false}
        operatorName={renter.fullName}
      />

      {/* 3. Official Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceipt(null);
        }}
        payment={selectedReceipt}
      />

    </div>
  );
};
