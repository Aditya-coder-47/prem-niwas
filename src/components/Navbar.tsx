import React, { useState } from 'react';
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
  Zap,
  Menu,
  X,
  ChevronRight,
  Sparkles
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;
  const occupancyPercent = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  const handleSelectTab = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-slate-950/95 backdrop-blur-xl text-white border-b border-slate-800/80 sticky top-0 z-40 shadow-xl transition-all">
        {/* Main Navbar Header */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Building Identity */}
            <div 
              onClick={() => handleSelectTab(role === 'owner' ? 'dashboard' : 'renter-room')}
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 transition-transform group-hover:scale-105 active:scale-95">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-extrabold text-base sm:text-xl tracking-tight text-white font-sans">
                    PREM <span className="text-amber-400">NIWAS</span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Residential Unit Management • {totalRooms} Units
                </p>
              </div>
            </div>

            {/* Center Summary Stats (Visible on desktop & large tablets) */}
            <div className="hidden lg:flex items-center space-x-3 bg-slate-900/90 px-3.5 py-1.5 rounded-2xl border border-slate-800 text-xs shadow-inner">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Total:</span>
                <span className="font-bold text-slate-100">{totalRooms}</span>
              </div>
              <span className="text-slate-700">|</span>
              <span className="inline-flex items-center text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                {occupiedCount} Occupied
              </span>
              <span className="text-slate-700">|</span>
              <span className="inline-flex items-center text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>
                {vacantCount} Vacant
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-300 font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
                {occupancyPercent}% Filled
              </span>
            </div>

            {/* Right Actions: Role Badge, Mobile Menu Toggle & Logout */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Role Status Badge */}
              {role === 'owner' ? (
                <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span className="hidden sm:inline">Owner Admin</span>
                  <span className="sm:hidden text-[11px]">Owner</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold shadow-sm">
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span className="text-[11px] sm:text-xs">Resident</span>
                  {renterRecord?.roomNumber && (
                    <span className="bg-blue-400/20 px-1.5 py-0.2 rounded font-mono text-[10px]">R-{renterRecord.roomNumber}</span>
                  )}
                </div>
              )}

              {/* Mobile Drawer Hamburger Button */}
              <button
                id="mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors active:scale-95 cursor-pointer border border-slate-800"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logout button */}
              <button
                id="navbar-logout-btn"
                onClick={logout}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer active:scale-95"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs Bar */}
          <div className="hidden md:flex items-center space-x-1 overflow-x-auto py-2.5 border-t border-slate-800/80 scrollbar-none text-sm">
            {role === 'owner' ? (
              <>
                <button
                  id="nav-tab-dashboard"
                  onClick={() => handleSelectTab('dashboard')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'dashboard'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  id="nav-tab-rooms"
                  onClick={() => handleSelectTab('rooms')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'rooms'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <DoorClosed className="w-4 h-4" />
                  <span>Rooms ({rooms.length})</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full border border-slate-700">
                    {occupiedCount}/{rooms.length}
                  </span>
                </button>

                <button
                  id="nav-tab-renters"
                  onClick={() => handleSelectTab('renters')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'renters'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
                  onClick={() => handleSelectTab('bills')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'bills'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Billing & Invoices</span>
                </button>

                <button
                  id="nav-tab-chat"
                  onClick={() => handleSelectTab('chat')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'chat'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Tenant Chat</span>
                </button>

                <button
                  id="nav-tab-notices"
                  onClick={() => handleSelectTab('notices')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'notices'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Notices</span>
                </button>

                <button
                  id="nav-tab-audit"
                  onClick={() => handleSelectTab('audit')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'audit'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
                  onClick={() => handleSelectTab('renter-room')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'renter-room'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>My Room</span>
                </button>

                <button
                  id="nav-tab-renter-meter"
                  onClick={() => handleSelectTab('renter-meter')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'renter-meter'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Meter Reading</span>
                </button>

                <button
                  id="nav-tab-renter-bills"
                  onClick={() => handleSelectTab('renter-bills')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'renter-bills'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>My Bills & Receipts</span>
                </button>

                <button
                  id="nav-tab-renter-chat"
                  onClick={() => handleSelectTab('renter-chat')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'renter-chat'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Owner</span>
                </button>

                <button
                  id="nav-tab-renter-notices"
                  onClick={() => handleSelectTab('renter-notices')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'renter-notices'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Building Notices</span>
                </button>

                <button
                  id="nav-tab-renter-profile"
                  onClick={() => handleSelectTab('renter-profile')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    currentTab === 'renter-profile'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>My Profile & KYC</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Quick Status Ribbon (Visible on small screens) */}
        <div className="md:hidden bg-slate-900/90 border-t border-slate-800/80 px-3 py-1.5 text-[11px] flex items-center justify-between text-slate-300 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-2 font-medium">
            <span className="text-slate-400">Building:</span>
            <span className="font-bold text-slate-200">{totalRooms} Units</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
              {occupiedCount} Occ.
            </span>
            <span className="text-slate-700">•</span>
            <span className="inline-flex items-center text-amber-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1"></span>
              {vacantCount} Vac.
            </span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-300 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
              {occupancyPercent}%
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Drawer / Menu Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Bottom/Slide Drawer Container */}
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 text-white shadow-2xl flex flex-col space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Drawer Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-1" />

            {/* Header in Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">PREM NIWAS PORTAL</h3>
                  <p className="text-[11px] text-slate-400">{profile?.name || (role === 'owner' ? 'Building Owner' : 'Resident')}</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Building Stats in Mobile Drawer */}
            <div className="grid grid-cols-3 gap-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</p>
                <p className="text-base font-black text-white mt-0.5">{totalRooms}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Occupied</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">{occupiedCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Vacant</p>
                <p className="text-base font-black text-amber-400 mt-0.5">{vacantCount}</p>
              </div>
            </div>

            {/* Navigation Tab Links in Mobile Drawer */}
            <div className="space-y-1 py-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                All Navigation Sections
              </p>

              {role === 'owner' ? (
                <>
                  <button
                    onClick={() => handleSelectTab('dashboard')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'dashboard' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <LayoutDashboard className="w-4 h-4 text-amber-400" />
                      <span>Executive Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleSelectTab('rooms')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'rooms' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <DoorClosed className="w-4 h-4 text-amber-400" />
                      <span>Rooms Directory ({totalRooms})</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                      {occupiedCount} Occ.
                    </span>
                  </button>

                  <button
                    onClick={() => handleSelectTab('renters')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'renters' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Renters &amp; KYC Directory</span>
                    </div>
                    {pendingRentersCount > 0 ? (
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full animate-bounce">
                        {pendingRentersCount} Pending
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSelectTab('bills')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'bills' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>Billing, Invoices &amp; Payments</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleSelectTab('chat')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'chat' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      <span>Tenant Live Chat</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleSelectTab('notices')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'notices' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span>Building Notices Board</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleSelectTab('audit')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'audit' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Audit Trail &amp; Activity Logs</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSelectTab('renter-room')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'renter-room' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Home className="w-4 h-4 text-blue-400" />
                      <span>My Room &amp; Allotment</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleSelectTab('renter-meter')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'renter-meter' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Electricity Meter Reading</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleSelectTab('renter-bills')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'renter-bills' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Receipt className="w-4 h-4 text-blue-400" />
                      <span>My Invoices &amp; Receipts</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleSelectTab('renter-chat')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'renter-chat' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span>Chat with Building Owner</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleSelectTab('renter-notices')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'renter-notices' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span>Building Notices</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleSelectTab('renter-profile')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentTab === 'renter-profile' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>My Profile &amp; KYC Verification</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </>
              )}
            </div>

            {/* Logout button in Mobile Drawer */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Prem Niwas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Ultra-clean Native App Style) */}
      <nav 
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-1 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {role === 'owner' ? (
          <>
            <button
              onClick={() => handleSelectTab('dashboard')}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'dashboard' 
                  ? 'text-amber-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${currentTab === 'dashboard' ? 'bg-amber-500/20' : ''}`}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Overview</span>
            </button>

            <button
              onClick={() => handleSelectTab('rooms')}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'rooms' 
                  ? 'text-amber-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${currentTab === 'rooms' ? 'bg-amber-500/20' : ''}`}>
                <DoorClosed className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Rooms</span>
            </button>

            <button
              onClick={() => handleSelectTab('renters')}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                currentTab === 'renters' 
                  ? 'text-amber-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl relative transition-all ${currentTab === 'renters' ? 'bg-amber-500/20' : ''}`}>
                <Users className="w-5 h-5" />
                {pendingRentersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-slate-950 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Renters</span>
            </button>

            <button
              onClick={() => handleSelectTab('bills')}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'bills' 
                  ? 'text-amber-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${currentTab === 'bills' ? 'bg-amber-500/20' : ''}`}>
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Billing</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex-1 flex flex-col items-center py-1 px-1 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <div className="p-1 rounded-xl">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">More</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleSelectTab('renter-room')}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'renter-room' 
                  ? 'text-amber-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${currentTab === 'renter-room' ? 'bg-amber-500/20' : ''}`}>
                <Home className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Room</span>
            </button>

            <button
              onClick={() => handleSelectTab('renter-meter')}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'renter-meter' 
                  ? 'text-amber-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${currentTab === 'renter-meter' ? 'bg-amber-500/20' : ''}`}>
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Meter</span>
            </button>

            <button
              onClick={() => handleSelectTab('renter-bills')}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'renter-bills' 
                  ? 'text-amber-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${currentTab === 'renter-bills' ? 'bg-amber-500/20' : ''}`}>
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Bills</span>
            </button>

            <button
              onClick={() => handleSelectTab('renter-chat')}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'renter-chat' 
                  ? 'text-amber-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${currentTab === 'renter-chat' ? 'bg-amber-500/20' : ''}`}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Chat</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex-1 flex flex-col items-center py-1 px-1 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <div className="p-1 rounded-xl">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">More</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
};
