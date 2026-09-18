import React, { useState, useEffect } from 'react';
import { X, Settings, Zap, Home, Droplets, CreditCard, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { BuildingSettings } from '../../types';
import { saveBuildingSettings, uploadQRPaymentImage } from '../../services/billingService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BuildingSettings;
  operatorName?: string;
  onSuccess?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  operatorName = 'Building Owner',
  onSuccess
}) => {
  const [electricityRate, setElectricityRate] = useState<number>(8);
  const [defaultWaterCharges, setDefaultWaterCharges] = useState<number>(300);
  const [defaultAnnualIncrease, setDefaultAnnualIncrease] = useState<number>(5);
  const [upiId, setUpiId] = useState<string>('amitniwas@okaxis');
  const [upiName, setUpiName] = useState<string>('Amit Niwas Management');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setElectricityRate(settings.electricityRate ?? 8);
      setDefaultWaterCharges(settings.defaultWaterCharges ?? 300);
      setDefaultAnnualIncrease(settings.defaultAnnualIncrease ?? 5);
      setUpiId(settings.upiId || 'amitniwas@okaxis');
      setUpiName(settings.upiName || 'Amit Niwas Management');
      setQrCodeUrl(settings.qrCodeUrl || null);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQr(true);
    setError(null);
    try {
      const url = await uploadQRPaymentImage(file);
      setQrCodeUrl(url);
    } catch (err: any) {
      console.error('QR upload failed:', err);
      setError('Failed to upload QR code image');
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await saveBuildingSettings(
        {
          electricityRate: Number(electricityRate),
          defaultWaterCharges: Number(defaultWaterCharges),
          defaultAnnualIncrease: Number(defaultAnnualIncrease),
          upiId: upiId.trim(),
          upiName: upiName.trim(),
          qrCodeUrl
        },
        operatorName
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Save settings failed:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="building-settings-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 border border-slate-200"
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">Amit Niwas Building Settings</h2>
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

          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
              Utility Rates & Rent Rules
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Electricity Rate (₹/unit)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={electricityRate}
                    onChange={(e) => setElectricityRate(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Amit Niwas default is ₹8/unit</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Water Charge (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={defaultWaterCharges}
                    onChange={(e) => setDefaultWaterCharges(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Amit Niwas default is ₹300</p>
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Annual Rent Increase (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    required
                    value={defaultAnnualIncrease}
                    onChange={(e) => setDefaultAnnualIncrease(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Applied on each renter's move-in anniversary (rounded to nearest whole rupee)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
              Payment Gateway & UPI Settings
            </h3>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Owner UPI ID
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. amitniwas@okaxis"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                UPI Payee Display Name
              </label>
              <input
                type="text"
                required
                value={upiName}
                onChange={(e) => setUpiName(e.target.value)}
                placeholder="e.g. Amit Niwas Management"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Building Payment QR Code Image
              </label>
              <div className="flex items-center space-x-3">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="Current QR" 
                    className="w-16 h-16 rounded-lg border border-slate-300 object-contain p-1 bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50">
                    No QR
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                  />
                  {isUploadingQr && <p className="text-[10px] text-blue-600 mt-1">Uploading QR...</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingQr}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
