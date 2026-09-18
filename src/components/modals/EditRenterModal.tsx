import React, { useState, useEffect } from 'react';
import { X, Edit, AlertCircle, Save } from 'lucide-react';
import { Renter } from '../../types';
import { updateRenterInfo } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface EditRenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  renter: Renter | null;
  onUpdated: () => void;
}

export const EditRenterModal: React.FC<EditRenterModalProps> = ({
  isOpen,
  onClose,
  renter,
  onUpdated
}) => {
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [govIdType, setGovIdType] = useState<Renter['govIdType']>('Aadhaar Card');
  const [govIdNumber, setGovIdNumber] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [securityDeposit, setSecurityDeposit] = useState<number>(0);

  useEffect(() => {
    if (renter) {
      setFullName(renter.fullName || '');
      setPhone(renter.phone || '');
      setEmail(renter.email || '');
      setGovIdType(renter.govIdType || 'Aadhaar Card');
      setGovIdNumber(renter.govIdNumber || '');
      setEmergencyName(renter.emergencyContactName || '');
      setEmergencyPhone(renter.emergencyContactPhone || '');
      setPermanentAddress(renter.permanentAddress || '');
      setOccupation(renter.occupation || '');
      setWorkplace(renter.workplace || '');
      setMonthlyRent(renter.monthlyRent || 0);
      setSecurityDeposit(renter.securityDeposit || 0);
    }
  }, [renter]);

  if (!isOpen || !renter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg('Name, phone, and email are mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      await updateRenterInfo(renter.id, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        govIdType,
        govIdNumber: govIdNumber.trim(),
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
        permanentAddress: permanentAddress.trim(),
        occupation: occupation.trim(),
        workplace: workplace.trim(),
        monthlyRent: Number(monthlyRent) || 0,
        securityDeposit: Number(securityDeposit) || 0,
        roomId: renter.roomId
      }, profile?.name || 'Building Owner');

      onUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating renter:', err);
      setErrorMsg(err.message || 'Failed to update renter record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Edit className="w-5 h-5 text-amber-500" />
              <span>Edit Renter Details</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Updating profile for {renter.fullName} (Room {renter.roomNumber || 'None'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Govt ID Number</label>
              <input
                type="text"
                value={govIdNumber}
                onChange={(e) => setGovIdNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone</label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent (₹)</label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Security Deposit (₹)</label>
              <input
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Address</label>
            <textarea
              rows={2}
              value={permanentAddress}
              onChange={(e) => setPermanentAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
