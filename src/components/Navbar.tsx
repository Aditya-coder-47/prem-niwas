import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  DoorClosed, 
  Users, 
  Bell, 
  History, 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  Home, 
  FileText,
  Receipt,
  MessageSquare,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Room } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  rooms: Room[];
  pendingRentersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  onSelectTab, 
  rooms,
  pendingRentersCount = 0 
}) => {
  const { profile, role, logout, renterRecord } = useAuth();

  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        {/* Top Banner with App Brand & Quick Status */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Building Identity */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-inner text-slate-950 font-black">
                <Building2 className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-xl tracking-wider text-amber-400 font-sans">
                    AMIT NIWAS
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Live Portal
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Residential Unit Management • {rooms.length} Units
                </p>
              </div>
            </div>

            {/* Center Summary Stats (Hidden on small mobile) */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400">Total Units:</span>
              <span className="font-bold text-slate-200">{rooms.length}</span>
              <span className="text-slate-600">|</span>
              <span className="inline-flex items-center text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                {occupiedCount} Occupied
              </span>
              <span className="text-slate-600">|</span>
              <span className="inline-flex items-center text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>
                {vacantCount} Vacant
              </span>
            </div>

            {/* Right Action: Verified Identity Badge & Logout */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Authentic Role Status Badge */}
              {role === 'owner' ? (
                <div className="flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-xl text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Owner Admin</span>
                  <span className="sm:hidden">Owner</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 bg-blue-500/15 border border-blue-500/40 text-blue-300 px-3 py-1 rounded-xl text-xs font-semibold">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>Resident</span>
                  {renterRecord?.roomNumber && (
                    <span className="bg-blue-400/20 px-1.5 py-0.2 rounded font-mono">R-{renterRecord.roomNumber}</span>
                  )}
                </div>
              )}

              {/* Logout button */}
              <button
                id="navbar-logout-btn"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs Bar */}
          <div className="hidden md:flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none text-sm">
            {role === 'owner' ? (
              <>
                <button
                  id="nav-tab-dashboard"
                  onClick={() => onSelectTab('dashboard')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'dashboard'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  id="nav-tab-rooms"
                  onClick={() => onSelectTab('rooms')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'rooms'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <DoorClosed className="w-4 h-4" />
                  <span>Rooms ({rooms.length})</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full">
                    {occupiedCount}/{rooms.length}
                  </span>
                </button>

                <button
                  id="nav-tab-renters"
                  onClick={() => onSelectTab('renters')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'renters'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Renters</span>
                  {pendingRentersCount > 0 && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-full animate-bounce">
                      {pendingRentersCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-tab-bills"
                  onClick={() => onSelectTab('bills')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'bills'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Billing & Invoices</span>
                </button>

                <button
                  id="nav-tab-chat"
                  onClick={() => onSelectTab('chat')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'chat'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Tenant Chat</span>
                </button>

                <button
                  id="nav-tab-notices"
                  onClick={() => onSelectTab('notices')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'notices'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Notices</span>
                </button>

                <button
                  id="nav-tab-audit"
                  onClick={() => onSelectTab('audit')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'audit'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Activity Logs</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id="nav-tab-renter-room"
                  onClick={() => onSelectTab('renter-room')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'renter-room'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>My Room</span>
                </button>

                <button
                  id="nav-tab-renter-meter"
                  onClick={() => onSelectTab('renter-meter')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'renter-meter'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Meter Reading</span>
                </button>

                <button
                  id="nav-tab-renter-bills"
                  onClick={() => onSelectTab('renter-bills')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'renter-bills'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>My Bills & Receipts</span>
                </button>

                <button
                  id="nav-tab-renter-chat"
                  onClick={() => onSelectTab('renter-chat')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'renter-chat'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Owner</span>
                </button>

                <button
                  id="nav-tab-renter-notices"
                  onClick={() => onSelectTab('renter-notices')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'renter-notices'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Building Notices</span>
                </button>

                <button
                  id="nav-tab-renter-profile"
                  onClick={() => onSelectTab('renter-profile')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    currentTab === 'renter-profile'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>My Profile & KYC</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile App Bottom Navigation Bar */}
      <nav 
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        {role === 'owner' ? (
          <>
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                currentTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('rooms')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                currentTab === 'rooms' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DoorClosed className="w-5 h-5 mb-0.5" />
              <span>Rooms</span>
            </button>

            <button
              onClick={() => onSelectTab('bills')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                currentTab === 'bills' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-5 h-5 mb-0.5" />
              <span>Bills</span>
            </button>

            <button
              onClick={() => onSelectTab('chat')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer relative ${
                currentTab === 'chat' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => onSelectTab('renters')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer relative ${
                currentTab === 'renters' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>Renters</span>
              {pendingRentersCount > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onSelectTab('renter-room')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                currentTab === 'renter-room' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span>Room</span>
            </button>

            <button
              onClick={() => onSelectTab('renter-meter')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                currentTab === 'renter-meter' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-5 h-5 mb-0.5" />
              <span>Meter</span>
            </button>

            <button
              onClick={() => onSelectTab('renter-bills')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                currentTab === 'renter-bills' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-5 h-5 mb-0.5" />
              <span>Bills</span>
            </button>

            <button
              onClick={() => onSelectTab('renter-chat')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                currentTab === 'renter-chat' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => onSelectTab('renter-notices')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                currentTab === 'renter-notices' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-5 h-5 mb-0.5" />
              <span>Notices</span>
            </button>

            <button
              onClick={() => onSelectTab('renter-profile')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                currentTab === 'renter-profile' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span>KYC</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
};
