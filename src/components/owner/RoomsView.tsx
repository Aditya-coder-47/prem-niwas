import React, { useState } from 'react';
import { 
  DoorClosed, 
  DoorOpen, 
  Search, 
  Filter, 
  UserPlus, 
  ArrowRightLeft, 
  LogOut, 
  IndianRupee, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import { Room, Renter } from '../../types';
import { AddRoomModal } from '../modals/AddRoomModal';
import { deleteRoom } from '../../services/db';

interface RoomsViewProps {
  rooms: Room[];
  renters: Renter[];
  initialFilter?: string;
  onAssignRoom: (room: Room) => void;
  onChangeRoom: (renter: Renter) => void;
  onCheckoutRenter: (renter: Renter) => void;
  onViewRenterDetails: (renter: Renter) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  renters,
  initialFilter = 'all',
  onAssignRoom,
  onChangeRoom,
  onCheckoutRenter,
  onViewRenterDetails
}) => {
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState<boolean>(false);

  // Filter logic
  const filteredRooms = rooms.filter(room => {
    // Status filter
    if (statusFilter === 'occupied' && room.status !== 'occupied') return false;
    if (statusFilter === 'vacant' && room.status !== 'vacant') return false;

    // Floor filter
    if (floorFilter !== 'all' && !room.floor.toLowerCase().includes(floorFilter.toLowerCase())) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = `room ${room.roomNumber}`.includes(q) || `${room.roomNumber}` === q;
      const matchName = room.currentRenterName?.toLowerCase().includes(q);
      const matchType = room.type.toLowerCase().includes(q);
      if (!matchNumber && !matchName && !matchType) return false;
    }

    return true;
  });

  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;
  const nextNumber = rooms.length > 0 ? Math.max(...rooms.map(r => r.roomNumber)) + 1 : 1;

  const handleDeleteRoom = async (room: Room) => {
    if (window.confirm(`Are you sure you want to delete ${room.roomName || `Room ${room.roomNumber}`}?`)) {
      try {
        await deleteRoom(room.id, 'Owner Admin');
      } catch (err: any) {
        alert(err.message || 'Failed to delete room.');
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center space-x-2.5">
              <DoorClosed className="w-6 h-6 text-amber-500" />
              <span>Building Rooms Directory ({rooms.length} Units)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time room management and tenant allocations at PREM NIWAS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Counter Pills */}
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Total: {rooms.length}
              </span>
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Occupied: {occupiedCount}
              </span>
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Vacant: {vacantCount}
              </span>
            </div>

            {/* Add Room Button */}
            <button
              id="open-add-room-modal-btn"
              onClick={() => setIsAddRoomModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="rooms-search-input"
              type="text"
              placeholder="Search by Room # or Tenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({rooms.length})
            </button>
            <button
              onClick={() => setStatusFilter('occupied')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'occupied' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Occupied ({occupiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('vacant')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'vacant' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vacant ({vacantCount})
            </button>
          </div>

          {/* Floor Filter */}
          <div className="flex items-center">
            <select
              id="rooms-floor-filter-select"
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
            >
              <option value="all">All Floors</option>
              <option value="ground">Ground Floor</option>
              <option value="1st">1st Floor</option>
              <option value="2nd">2nd Floor</option>
              <option value="3rd">3rd Floor</option>
              <option value="4th">4th Floor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <DoorClosed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-700">No rooms match your filter criteria</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting your search query or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredRooms.map((room) => {
            const isOccupied = room.status === 'occupied';
            const occupantRenter = renters.find(r => r.id === room.currentRenterId);

            return (
              <div 
                key={room.id}
                className={`bg-white rounded-2xl border transition-all shadow-sm flex flex-col justify-between overflow-hidden ${
                  isOccupied ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-slate-900 font-mono">
                          {room.roomName}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                          {room.floor}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-1">
                        {room.type}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isOccupied 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOccupied ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                        {isOccupied ? 'Occupied' : 'Vacant'}
                      </span>

                      {!isOccupied && (
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Delete vacant room"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rent Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Monthly Base Rent:</span>
                    <span className="font-extrabold text-sm text-slate-900">â‚¹{room.baseRent.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Occupant Box or Vacancy Box */}
                  {isOccupied ? (
                    <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                        Current Resident
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {room.currentRenterName || 'Registered Resident'}
                      </div>
                      {room.currentRenterPhone && (
                        <div className="flex items-center text-xs text-slate-600 mt-1">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{room.currentRenterPhone}</span>
                        </div>
                      )}
                      {room.occupiedSince && (
                        <div className="flex items-center text-[11px] text-slate-500 mt-1">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          <span>Allotted: {room.occupiedSince}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-amber-900">
                      <div className="font-bold text-amber-900">Unit Available</div>
                      <p className="text-[11px] text-amber-800/90 mt-0.5">
                        Cleaned and ready. Click assign below to allot to resident.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  {isOccupied && occupantRenter ? (
                    <>
                      <button
                        onClick={() => onViewRenterDetails(occupantRenter)}
                        className="flex-1 py-1.5 px-2 text-center font-bold bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer"
                        title="View Renter Profile"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => onChangeRoom(occupantRenter)}
                        className="flex-1 py-1.5 px-2 text-center font-bold bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-blue-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        title="Change Room Assignment"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Reassign</span>
                      </button>
                      <button
                        onClick={() => onCheckoutRenter(occupantRenter)}
                        className="flex-1 py-1.5 px-2 text-center font-bold bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-rose-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        title="Checkout Tenant"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Checkout</span>
                      </button>
                    </>
                  ) : (
                    <button
                      id={`assign-room-${room.roomNumber}-btn`}
                      onClick={() => onAssignRoom(room)}
                      className="w-full py-2 px-3 text-center font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign Resident to {room.roomName}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        nextSuggestedNumber={nextNumber}
      />
    </div>
  );
};
