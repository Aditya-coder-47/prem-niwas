import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Image as ImageIcon,
  History,
  Info,
  ShieldAlert,
  IndianRupee,
  RefreshCw
} from 'lucide-react';
import { Renter, MeterReading, BuildingSettings } from '../../types';
import { 
  getLatestApprovedMeterReading, 
  submitMeterReading, 
  subscribeRenterMeterReadings, 
  uploadMeterPhoto,
  getBuildingSettings 
} from '../../services/billingService';
import { detectMeterReadingFromImage } from '../../services/meterOcr';

interface MyMeterReadingViewProps {
  renter: Renter;
  buildingSettings: BuildingSettings;
}

export const MyMeterReadingView: React.FC<MyMeterReadingViewProps> = ({
  renter,
  buildingSettings
}) => {
  const isMeterBased = renter.electricityBillingType !== 'included_in_rent';

  const [previousReading, setPreviousReading] = useState<number>(0);
  const [enteredReading, setEnteredReading] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aiDetectedReading, setAiDetectedReading] = useState<number | null>(null);
  const [isAnalyzingOcr, setIsAnalyzingOcr] = useState<boolean>(false);
  const [ocrWarning, setOcrWarning] = useState<string | null>(null);
  const [historyReadings, setHistoryReadings] = useState<MeterReading[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current billing month e.g. "October 2026"
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // 1. Fetch latest approved reading to prefill previousReading
  useEffect(() => {
    if (!renter.id) return;
    getLatestApprovedMeterReading(renter.id).then((last) => {
      if (last) {
        setPreviousReading(last.enteredReading);
      } else {
        // Initial baseline reading fallback
        setPreviousReading(0);
      }
    });

    const unsub = subscribeRenterMeterReadings(renter.id, setHistoryReadings);
    return () => unsub();
  }, [renter.id]);

  // Handle Photo selection and run AI/OCR extraction
  const handlePhotoSelect = async (file: File) => {
    setPhotoFile(file);
    setFormError(null);
    setOcrWarning(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);

      // Trigger automatic meter detection
      setIsAnalyzingOcr(true);
      try {
        const ocr = await detectMeterReadingFromImage(dataUrl);
        if (ocr.detectedReading !== null) {
          setAiDetectedReading(ocr.detectedReading);
          // Suggest reading if field is empty
          if (!enteredReading) {
            setEnteredReading(String(ocr.detectedReading));
          }
        }
      } catch (err) {
        console.warn('OCR error:', err);
      } finally {
        setIsAnalyzingOcr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Check validation between photo & entered reading
  const numEntered = Number(enteredReading);
  const calculatedUnits = !isNaN(numEntered) && numEntered >= previousReading 
    ? numEntered - previousReading 
    : 0;
  const currentRate = buildingSettings.electricityRate || 8;
  const estimatedElectricityAmount = calculatedUnits * currentRate;

  // Active reading for current month if already submitted
  const activeSubmission = historyReadings.find(r => r.billingPeriod === currentMonth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setOcrWarning(null);

    if (isNaN(numEntered) || numEntered === 0 && !enteredReading) {
      setFormError('Please enter a valid present meter reading number.');
      return;
    }

    // Requirement 8: Present meter reading cannot be lower than the previous reading.
    if (numEntered < previousReading) {
      setFormError('Present meter reading cannot be lower than the previous reading.');
      return;
    }

    // Photo is mandatory for meter-based billing
    if (!photoFile && !photoPreview) {
      setFormError('Please upload or capture a clear photo of your electricity meter display.');
      return;
    }

    // Requirement 7: Compare photo and entered reading.
    // If AI detected reading is present and differs from entered reading:
    if (aiDetectedReading !== null && Math.abs(numEntered - aiDetectedReading) > 0) {
      setOcrWarning('The entered reading does not match the meter photo. Please correct the reading.');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = photoPreview;
      let photoStoragePath: string | undefined = undefined;

      if (photoFile) {
        const uploaded = await uploadMeterPhoto(photoFile, renter.id);
        photoUrl = uploaded.photoUrl;
        photoStoragePath = uploaded.storagePath;
      }

      await submitMeterReading({
        renterId: renter.id,
        renterName: renter.fullName,
        roomId: renter.roomId || 'room_default',
        roomNumber: renter.roomNumber || 101,
        billingPeriod: currentMonth,
        previousReading,
        enteredReading: numEntered,
        aiDetectedReading: aiDetectedReading || null,
        electricityRate: currentRate,
        photoUrl,
        photoStoragePath
      }, renter.fullName);

      setSubmitSuccess(true);
      setEnteredReading('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setAiDetectedReading(null);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      console.error('Submit meter reading failed:', err);
      setFormError(err.message || 'Failed to submit meter reading. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If resident is configured as "included_in_rent" (Requirement 11, 12, 13)
  if (!isMeterBased) {
    return (
      <div id="my-meter-reading-view" className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center text-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-blue-700">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-blue-950">
            Electricity Charges Included in Rent
          </h3>
          <p className="text-xs text-blue-800 max-w-lg mx-auto leading-relaxed">
            Your tenancy for Room {renter.roomNumber} includes electricity consumption within your fixed monthly rent. You are not required to submit monthly meter readings or track electricity units.
          </p>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-blue-300 rounded-full text-xs font-semibold text-blue-900 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Fixed Monthly Agreement • No Meter Submissions Required</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="my-meter-reading-view" className="space-y-6">
      
      {/* Current Month Banner & Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Current Billing Cycle
          </span>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2 mt-0.5">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Electricity Meter • {currentMonth}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit your meter reading between the 25th and 1st of each month. Rate: ₹{currentRate}/unit.
          </p>
        </div>

        <div>
          {activeSubmission ? (
            <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 ${
              activeSubmission.status === 'approved'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : activeSubmission.status === 'rejected'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {activeSubmission.status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : activeSubmission.status === 'rejected' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block capitalize">
                  Status: {activeSubmission.status.replace('_', ' ')}
                </span>
                <span className="text-[11px]">
                  {activeSubmission.status === 'approved'
                    ? `Approved (${activeSubmission.units} units = ₹${activeSubmission.electricityAmount})`
                    : activeSubmission.status === 'rejected'
                    ? `Rejected: ${activeSubmission.rejectionReason || 'Please resubmit'}`
                    : 'Awaiting Owner Approval'}
                </span>
              </div>
            </div>
          ) : (
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Reading not yet submitted for {currentMonth}
            </span>
          )}
        </div>
      </div>

      {/* Submission Form (Shown if not yet submitted or if rejected) */}
      {(!activeSubmission || activeSubmission.status === 'rejected') && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {activeSubmission?.status === 'rejected' ? 'Re-Submit Corrected Meter Reading' : 'Submit Monthly Meter Reading'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your current meter counter value and upload a clear photo of the meter dial.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Meter reading submitted successfully! Sent to owner for approval.</span>
            </div>
          )}

          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Requirement 7 Warning Banner */}
          {ocrWarning && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start space-x-3 shadow-xs animate-in fade-in">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block mb-0.5">Reading Verification Warning</span>
                <p className="font-semibold">{ocrWarning}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (aiDetectedReading !== null) {
                        setEnteredReading(String(aiDetectedReading));
                        setOcrWarning(null);
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Use Photo Reading ({aiDetectedReading})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOcrWarning(null)}
                    className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    Keep My Reading & Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Numeric Readings & Real-Time Calculation */}
            <div className="space-y-4">
              
              {/* Previous Reading (Read-Only) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Previous Approved Reading
                </label>
                <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-base flex items-center justify-between">
                  <span>{previousReading}</span>
                  <span className="text-[11px] font-sans text-slate-500 font-normal">Last approved</span>
                </div>
              </div>

              {/* Present Reading Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Present Meter Reading <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={previousReading}
                  step="1"
                  value={enteredReading}
                  onChange={(e) => {
                    setEnteredReading(e.target.value);
                    setFormError(null);
                    setOcrWarning(null);
                  }}
                  placeholder={`Must be ≥ ${previousReading}`}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter whole units as shown on your meter odometer.
                </p>
              </div>

              {/* Real-Time Calculation Box (Requirement 5 & 14) */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Calculated Consumption:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {numEntered >= previousReading ? `${calculatedUnits} Units` : '—'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Approved Electricity Rate:</span>
                  <span className="font-bold text-slate-900">₹{currentRate}/unit</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-amber-200 text-xs font-bold">
                  <span className="text-amber-950">Estimated Electricity Charge:</span>
                  <span className="text-sm font-black text-amber-900">
                    ₹{estimatedElectricityAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Meter Photo Upload & AI Scanner */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Meter Photo Proof <span className="text-rose-500">*</span>
              </label>

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 group">
                  <img 
                    src={photoPreview} 
                    alt="Meter Preview" 
                    className="w-full h-48 object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3">
                    <span className="text-white text-xs font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Photo Attached</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoFile(null);
                        setAiDetectedReading(null);
                      }}
                      className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-sm cursor-pointer transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-amber-50/30"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoSelect(f);
                    }}
                    className="hidden"
                  />
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-700 block">
                    Upload or Take Meter Photo
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ensure digits and meter serial are clearly visible.
                  </p>
                </div>
              )}

              {/* OCR Detection Indicator */}
              {isAnalyzingOcr && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Scanning meter dial digits...</span>
                </div>
              )}

              {aiDetectedReading !== null && !isAnalyzingOcr && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>OCR Detected: <strong>{aiDetectedReading}</strong></span>
                  </span>
                  {numEntered !== aiDetectedReading && (
                    <button
                      type="button"
                      onClick={() => setEnteredReading(String(aiDetectedReading))}
                      className="text-[11px] font-bold text-emerald-700 underline cursor-pointer"
                    >
                      Use detected
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || isAnalyzingOcr}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting Reading...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit For Owner Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Historical Meter Readings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Submitted Meter Reading History
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {historyReadings.length} records
          </span>
        </div>

        {historyReadings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No previous meter readings recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Previous</th>
                  <th className="px-4 py-3">Present</th>
                  <th className="px-4 py-3">Units</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Est. Amount</th>
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {historyReadings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.billingPeriod}</td>
                    <td className="px-4 py-3 font-mono">{r.previousReading}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.enteredReading}</td>
                    <td className="px-4 py-3 font-bold text-amber-700">{r.units}</td>
                    <td className="px-4 py-3">₹{r.electricityRate}/unit</td>
                    <td className="px-4 py-3 font-bold text-slate-900">₹{r.electricityAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      {r.photoUrl ? (
                        <a 
                          href={r.photoUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 underline font-semibold flex items-center space-x-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        r.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                      {r.rejectionReason && (
                        <p className="text-[10px] text-rose-600 mt-0.5">{r.rejectionReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
