import React, { useState } from 'react';
import { X, PlusCircle, Home, Building2, IndianRupee, Layers } from 'lucide-react';
import { addNewRoom } from '../../services/db';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomAdded?: () => void;
  nextSuggestedNumber?: number;
}

export const AddRoomModal: React.FC<AddRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomAdded,
  nextSuggestedNumber = 16
}) => {
  const [roomNumber, setRoomNumber] = useState<number | ''>(nextSuggestedNumber);
  const [roomName, setRoomName] = useState(`Room ${nextSuggestedNumber}`);
  const [floor, setFloor] = useState('Ground Floor');
  const [type, setType] = useState('1 RK Studio');
  const [baseRent, setBaseRent] = useState<number | ''>(7000);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleNumberChange = (num: number | '') => {
    setRoomNumber(num);
    if (num !== '') {
      setRoomName(`Room ${num}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!roomNumber || roomNumber <= 0) {
      setErrorMsg('Please enter a valid room number.');
      return;
    }
    if (!baseRent || baseRent <= 0) {
      setErrorMsg('Please specify a monthly base rent.');
      return;
    }

    setSubmitting(true);
    try {
      await addNewRoom({
        roomNumber: Number(roomNumber),
        roomName: roomName.trim() || `Room ${roomNumber}`,
        floor,
        type,
        baseRent: Number(baseRent)
      }, 'Owner Admin');

      if (onRoomAdded) onRoomAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add room. Please check if room number already exists.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="add-room-modal-container"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Add New Residential Unit</h2>
              <p className="text-xs text-slate-400">Naya room Amit Niwas me add karein</p>
            </div>
          </div>
          <button
            id="close-add-room-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Room Number *</span>
              </label>
              <input
                id="input-room-number"
                type="number"
                min="1"
                required
                value={roomNumber}
                onChange={(e) => handleNumberChange(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 16, 101, 201"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span>Display Name / Label</span>
              </label>
              <input
                id="input-room-name"
                type="text"
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Room 16"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Floor Location</span>
              </label>
              <select
                id="select-room-floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
                <option value="Rooftop / Penthouse">Rooftop / Penthouse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Unit Layout Type
              </label>
              <select
                id="select-room-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="1 RK Studio">1 RK Studio</option>
                <option value="Standard Single">Standard Single</option>
                <option value="1 BHK Deluxe">1 BHK Deluxe</option>
                <option value="2 BHK Apartment">2 BHK Apartment</option>
                <option value="Premium Suite">Premium Suite</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <span>Base Monthly Rent (₹) *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₹</span>
              <input
                id="input-room-base-rent"
                type="number"
                min="500"
                step="100"
                required
                value={baseRent}
                onChange={(e) => setBaseRent(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 7000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Standard rent amount for this room. Can be customized per tenant during allotment.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              id="cancel-add-room-btn"
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-750 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-new-room-btn"
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? 'Adding Unit...' : 'Add Room to Building'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
