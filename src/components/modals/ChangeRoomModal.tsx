import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, DoorClosed, AlertCircle } from 'lucide-react';
import { Renter, Room } from '../../types';
import { changeRenterRoomAssignment } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface ChangeRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  renter: Renter | null;
  vacantRooms: Room[];
  onRoomChanged: () => void;
}

export const ChangeRoomModal: React.FC<ChangeRoomModalProps> = ({
  isOpen,
  onClose,
  renter,
  vacantRooms,
  onRoomChanged
}) => {
  const { profile } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (vacantRooms.length > 0) {
      setSelectedRoomId(vacantRooms[0].id);
    } else {
      setSelectedRoomId('');
    }
  }, [vacantRooms, isOpen]);

  if (!isOpen || !renter) return null;

  const targetRoom = vacantRooms.find(r => r.id === selectedRoomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoom) {
      setErrorMsg('Please select an available vacant room.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await changeRenterRoomAssignment(
        renter, 
        targetRoom, 
        profile?.name || 'Building Owner'
      );
      onRoomChanged();
      onClose();
    } catch (err: any) {
      console.error('Error reassigning room:', err);
      setErrorMsg(err.message || 'Failed to reassign room.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              <span>Change Room Assignment</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reassign resident to a different vacant unit in PREM NIWAS.
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

          {/* Current Status Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="text-slate-500 font-semibold mb-1">Current Resident Details:</div>
            <div className="font-bold text-slate-900 text-sm">{renter.fullName}</div>
            <div className="flex items-center space-x-2 text-slate-600 mt-1">
              <span>Current Unit: <strong>Room {renter.roomNumber || 'Unassigned'}</strong></span>
              <span>•</span>
              <span>Current Rent: <strong>₹{renter.monthlyRent}/mo</strong></span>
            </div>
          </div>

          {/* New Room Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Vacant Unit (15 Rooms)
            </label>
            {vacantRooms.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                No vacant units currently available in PREM NIWAS to switch into.
              </div>
            ) : (
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                {vacantRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.roomName} — {r.floor} ({r.type}, Base: ₹{r.baseRent}/mo)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Transfer Preview Card */}
          {targetRoom && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-950">
              <div className="font-bold text-blue-900 mb-1">Allotment Transfer Summary:</div>
              <div className="space-y-1 text-slate-700">
                <div>• Previous Unit (Room {renter.roomNumber || '-'}) will automatically become <strong>Vacant</strong>.</div>
                <div>• Target Unit (<strong>{targetRoom.roomName}</strong> on {targetRoom.floor}) will become <strong>Occupied</strong>.</div>
                <div>• Updated Monthly Base Rent: <strong>₹{targetRoom.baseRent}/mo</strong>.</div>
              </div>
            </div>
          )}

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
              disabled={submitting || vacantRooms.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{submitting ? 'Updating...' : 'Confirm Room Reassignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
