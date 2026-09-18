import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  DoorClosed, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  IndianRupee,
  Phone,
  Mail,
  User,
  Home,
  Briefcase
} from 'lucide-react';
import { Room, Renter } from '../../types';
import { registerRenter } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface RegisterRenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacantRooms: Room[];
  preSelectedRoom?: Room | null;
  onRenterRegistered: () => void;
}

export const RegisterRenterModal: React.FC<RegisterRenterModalProps> = ({
  isOpen,
  onClose,
  vacantRooms,
  preSelectedRoom,
  onRenterRegistered
}) => {
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [govIdType, setGovIdType] = useState<Renter['govIdType']>('Aadhaar Card');
  const [govIdNumber, setGovIdNumber] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Parent');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [monthlyRent, setMonthlyRent] = useState<number>(6500);
  const [securityDeposit, setSecurityDeposit] = useState<number>(13000);
  const [leaseStartDate, setLeaseStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Set initial selected room
  useEffect(() => {
    if (preSelectedRoom) {
      setSelectedRoomId(preSelectedRoom.id);
      setMonthlyRent(preSelectedRoom.baseRent);
      setSecurityDeposit(preSelectedRoom.baseRent * 2);
    } else if (vacantRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(vacantRooms[0].id);
      setMonthlyRent(vacantRooms[0].baseRent);
      setSecurityDeposit(vacantRooms[0].baseRent * 2);
    }
  }, [preSelectedRoom, vacantRooms]);

  // When room selection changes, update default base rent
  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = vacantRooms.find(r => r.id === roomId);
    if (room) {
      setMonthlyRent(room.baseRent);
      setSecurityDeposit(room.baseRent * 2);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg('Full name, phone, and email are mandatory fields.');
      return;
    }

    if (!govIdNumber.trim()) {
      setErrorMsg('Government identification number is required for police record verification.');
      return;
    }

    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      setErrorMsg('Emergency contact details are required.');
      return;
    }

    const assignedRoom = vacantRooms.find(r => r.id === selectedRoomId);

    setSubmitting(true);
    try {
      await registerRenter({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        govIdType,
        govIdNumber: govIdNumber.trim(),
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
        emergencyContactRelation: emergencyRelation.trim(),
        permanentAddress: permanentAddress.trim(),
        occupation: occupation.trim() || 'Private Employee',
        workplace: workplace.trim() || 'Self / City',
        roomId: assignedRoom ? assignedRoom.id : null,
        roomNumber: assignedRoom ? assignedRoom.roomNumber : null,
        monthlyRent: Number(monthlyRent) || 0,
        securityDeposit: Number(securityDeposit) || 0,
        leaseStartDate,
        status: 'active'
      }, profile?.name || 'Building Owner');

      onRenterRegistered();
      onClose();
    } catch (err: any) {
      console.error('Error registering renter:', err);
      setErrorMsg(err.message || 'Failed to register renter. Please verify Firebase permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-amber-500" />
              <span>Register New Renter â€” PREM NIWAS</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record tenant KYC information and allot a vacant residential room.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Personal & Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
              1. Personal & Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manish Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="tenant@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Government ID Type *
                </label>
                <select
                  value={govIdType}
                  onChange={(e) => setGovIdType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Government ID Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4820 9120 4812"
                  value={govIdNumber}
                  onChange={(e) => setGovIdNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occupation / Profession
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Consultant"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent Address *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Complete native address with state & pin code"
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Section 2: Emergency Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
              2. Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Emergency contact person"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Father / Sister"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 Emergency phone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Room Allotment & Lease Terms */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
              3. Room Allotment & Lease Terms
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Vacant Room (15 Units)
                </label>
                {vacantRooms.length === 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    No vacant rooms currently available in PREM NIWAS.
                  </div>
                ) : (
                  <select
                    value={selectedRoomId}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                  >
                    {vacantRooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.roomName} â€” {r.floor} ({r.type}, Base: â‚¹{r.baseRent})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lease / Move-in Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={leaseStartDate}
                  onChange={(e) => setLeaseStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreed Monthly Rent (â‚¹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Deposit Received (â‚¹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
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
              {submitting ? (
                <span>Registering...</span>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Confirm Registration</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
