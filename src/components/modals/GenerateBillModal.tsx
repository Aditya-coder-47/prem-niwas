import React, { useState, useEffect } from 'react';
import { 
  X, 
  Receipt, 
  IndianRupee, 
  Zap, 
  Droplets, 
  Calendar, 
  Check, 
  AlertCircle, 
  ShieldAlert,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Renter, Room, Bill, MeterReading, BuildingSettings } from '../../types';
import { 
  generateMonthlyBill, 
  getBuildingSettings, 
  calculateBackDues,
  getLatestApprovedMeterReading 
} from '../../services/billingService';

interface GenerateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  renters: Renter[];
  rooms: Room[];
  preselectedRenterId?: string;
  onBillGenerated?: () => void;
  operatorName?: string;
}

export const GenerateBillModal: React.FC<GenerateBillModalProps> = ({
  isOpen,
  onClose,
  renters,
  rooms,
  preselectedRenterId,
  onBillGenerated,
  operatorName = 'Building Owner'
}) => {
  const activeRenters = renters.filter(r => r.status === 'active' && r.roomId);

  const [selectedRenterId, setSelectedRenterId] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<string>(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  const [settings, setSettings] = useState<BuildingSettings | null>(null);
  const [approvedReading, setApprovedReading] = useState<MeterReading | null>(null);
  const [loadingReading, setLoadingReading] = useState<boolean>(false);
  
  // Slide 2 Fields
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [annualIncreasePercent, setAnnualIncreasePercent] = useState<number>(5);
  const [waterAmount, setWaterAmount] = useState<number>(300);
  const [backDues, setBackDues] = useState<number>(0);

  // Slide 1 Fields (Meter)
  const [previousReading, setPreviousReading] = useState<number>(0);
  const [presentReading, setPresentReading] = useState<number>(0);
  const [electricityRate, setElectricityRate] = useState<number>(8);
  const [customElecUnits, setCustomElecUnits] = useState<number | ''>('');

  // Dates
  const [billDate, setBillDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    // 10th of the month default
    d.setDate(10);
    return d.toISOString().split('T')[0];
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load building settings
  useEffect(() => {
    getBuildingSettings().then((s) => {
      setSettings(s);
      setElectricityRate(s.electricityRate || 8);
      setWaterAmount(s.defaultWaterCharges || 300);
      setAnnualIncreasePercent(s.defaultAnnualIncrease || 5);
    }).catch(console.warn);
  }, []);

  // Set initial selected renter
  useEffect(() => {
    if (preselectedRenterId && activeRenters.some(r => r.id === preselectedRenterId)) {
      setSelectedRenterId(preselectedRenterId);
    } else if (activeRenters.length > 0 && !selectedRenterId) {
      setSelectedRenterId(activeRenters[0].id);
    }
  }, [preselectedRenterId, activeRenters, selectedRenterId]);

  const currentRenter = activeRenters.find(r => r.id === selectedRenterId);
  const currentRoom = rooms.find(rm => rm.id === currentRenter?.roomId);
  const isMeterBased = currentRenter?.electricityBillingType !== 'included_in_rent';

  // Load approved meter reading and back dues for selected renter
  useEffect(() => {
    if (!selectedRenterId) return;
    const r = activeRenters.find(x => x.id === selectedRenterId);
    if (r) {
      setRentAmount(r.monthlyRent || 6000);
      setAnnualIncreasePercent(r.annualIncreasePercent || settings?.defaultAnnualIncrease || 5);
    }

    setLoadingReading(true);
    setErrorMsg('');

    // Fetch back dues
    calculateBackDues(selectedRenterId).then(setBackDues).catch(console.warn);

    // Fetch latest approved meter reading
    getLatestApprovedMeterReading(selectedRenterId)
      .then((reading) => {
        setApprovedReading(reading);
        if (reading) {
          setPreviousReading(reading.previousReading);
          setPresentReading(reading.enteredReading);
          setElectricityRate(reading.electricityRate || settings?.electricityRate || 8);
        } else {
          setPreviousReading(0);
          setPresentReading(0);
        }
      })
      .catch(console.warn)
      .finally(() => setLoadingReading(false));
  }, [selectedRenterId, activeRenters, settings]);

  if (!isOpen) return null;

  // Electricity Calculation
  const unitsConsumed = isMeterBased 
    ? (approvedReading ? approvedReading.units : (customElecUnits !== '' ? Number(customElecUnits) : Math.max(0, presentReading - previousReading)))
    : 0;
  const electricityAmount = isMeterBased ? Math.round(unitsConsumed * electricityRate) : 0;

  // Subtotal & Total
  const subtotal = Math.round(Number(rentAmount || 0) + electricityAmount + Number(waterAmount || 0));
  const totalAmount = Math.round(subtotal + Number(backDues || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentRenter || !currentRoom) {
      setErrorMsg('Please select an active resident with an assigned room.');
      return;
    }

    // Rule 9, 21, 43: For meter-based billing, electricity calculation is pending meter approval.
    if (isMeterBased && !approvedReading && customElecUnits === '') {
      setErrorMsg('Electricity calculation pending meter approval. Please approve the tenantâ€™s meter reading first, or enter verified units.');
      return;
    }

    if (totalAmount <= 0) {
      setErrorMsg('Total bill amount must be greater than â‚¹0.');
      return;
    }

    setSubmitting(true);
    try {
      await generateMonthlyBill(
        {
          renterId: currentRenter.id,
          renterName: currentRenter.fullName,
          renterPhone: currentRenter.phone,
          roomId: currentRoom.id,
          roomNumber: currentRoom.roomNumber,
          billingPeriod,
          billDate,
          dueDate,
          rent: Math.round(rentAmount),
          annualIncreasePercent,
          electricityBillingType: isMeterBased ? 'meter_based' : 'included_in_rent',
          meterReadingId: approvedReading?.id || null,
          previousMeterReading: previousReading,
          presentMeterReading: presentReading,
          electricityUnits: unitsConsumed,
          electricityRate,
          electricityAmount,
          waterAmount: Math.round(waterAmount),
          backDues: Math.round(backDues)
        },
        operatorName
      );

      if (onBillGenerated) onBillGenerated();
      onClose();
    } catch (err: any) {
      console.error('Bill generation error:', err);
      setErrorMsg(err.message || 'Failed to generate monthly bill.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="generate-bill-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm">
              AN
            </div>
            <div>
              <h2 className="text-base font-bold">Generate Monthly Statement</h2>
              <p className="text-xs text-slate-400">PREM NIWAS Multi-Slide Billing Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resident Selection & Billing Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Active Resident <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedRenterId}
                onChange={(e) => setSelectedRenterId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {activeRenters.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} â€” {r.fullName} ({r.electricityBillingType === 'included_in_rent' ? 'Elec Included' : 'Metered'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Billing Period <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                placeholder="e.g. October 2026"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Slide 1: Electricity Calculation */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Slide 1: Electricity Calculation</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900">
                {isMeterBased ? 'Meter-Based Billing' : 'Included In Fixed Rent'}
              </span>
            </div>

            {isMeterBased ? (
              <div className="space-y-3">
                {approvedReading ? (
                  <div className="bg-white p-3 rounded-xl border border-amber-200 text-[11px] flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                      <Check className="w-4 h-4" />
                      <span>Approved Reading Found: {approvedReading.enteredReading} ({approvedReading.units} Units)</span>
                    </span>
                    <span className="text-slate-500">Submitted: {new Date(approvedReading.submittedAt).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-100/80 border border-amber-300 rounded-xl text-amber-900 text-[11px] flex items-start space-x-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                    <div>
                      <span className="font-bold block">Electricity calculation pending meter approval.</span>
                      <span>No approved meter reading found for this tenant. You can manually enter verified units below or approve their reading first.</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Units Consumed</span>
                    <input
                      type="number"
                      min="0"
                      value={unitsConsumed}
                      onChange={(e) => setCustomElecUnits(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Rate (â‚¹/unit)</span>
                    <input
                      type="number"
                      min="1"
                      value={electricityRate}
                      onChange={(e) => setElectricityRate(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-sm"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Electricity Total</span>
                    <span className="text-base font-black text-amber-900 block mt-1">
                      â‚¹{electricityAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 italic">
                Tenant's agreement includes electricity within room rent. Separate electricity charge is set to â‚¹0.
              </p>
            )}
          </div>

          {/* Slide 2: Rent & Other Charges */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              Slide 2: Rent & Utility Charges
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Room Rent (â‚¹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={rentAmount}
                  onChange={(e) => setRentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Water & Maint. (â‚¹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Back Dues (â‚¹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={backDues}
                  onChange={(e) => setBackDues(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-rose-700 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Dates & Payment Window (1st to 10th) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Statement Date
              </label>
              <input
                type="date"
                required
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Due Date (1stâ€“10th)
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-rose-700 font-bold"
              />
            </div>
          </div>

          {/* Final Total Calculation Card */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                Total Calculated Statement
              </span>
              <div className="text-3xl font-black text-white mt-0.5">
                â‚¹{totalAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Subtotal: â‚¹{subtotal.toLocaleString('en-IN')} + Back Dues: â‚¹{backDues.toLocaleString('en-IN')}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-2 cursor-pointer"
            >
              {submitting ? (
                <span>Generating...</span>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Issue Invoice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
