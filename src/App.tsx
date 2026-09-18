import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/auth/AuthScreen';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { RoomsView } from './components/owner/RoomsView';
import { RentersView } from './components/owner/RentersView';
import { NoticesView } from './components/owner/NoticesView';
import { ActivityLogView } from './components/owner/ActivityLogView';
import { BillsView } from './components/owner/BillsView';
import { ChatView } from './components/owner/ChatView';
import { RenterPortal } from './components/renter/RenterPortal';
import { PendingApprovalScreen } from './components/renter/PendingApprovalScreen';

// Modals
import { RegisterRenterModal } from './components/modals/RegisterRenterModal';
import { EditRenterModal } from './components/modals/EditRenterModal';
import { ChangeRoomModal } from './components/modals/ChangeRoomModal';
import { CheckoutModal } from './components/modals/CheckoutModal';
import { RenterDetailsModal } from './components/modals/RenterDetailsModal';
import { ResetPasswordModal } from './components/modals/ResetPasswordModal';
import { CreateNoticeModal } from './components/modals/CreateNoticeModal';
import { ApproveRenterModal } from './components/modals/ApproveRenterModal';

import { 
  subscribeRooms, 
  subscribeRenters, 
  subscribeNotices, 
  subscribeActivityLogs 
} from './services/db';
import { Room, Renter, Notice, ActivityLog } from './types';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { currentUser, profile, role, loading, renterRecord, refreshAuthData } = useAuth();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [roomFilterProp, setRoomFilterProp] = useState<string>('all');
  const [renterFilterProp, setRenterFilterProp] = useState<string>('all');

  // Firestore real-time state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [renters, setRenters] = useState<Renter[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Modal states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [preSelectedRoom, setPreSelectedRoom] = useState<Room | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRenterForEdit, setSelectedRenterForEdit] = useState<Renter | null>(null);

  const [isChangeRoomOpen, setIsChangeRoomOpen] = useState(false);
  const [selectedRenterForChangeRoom, setSelectedRenterForChangeRoom] = useState<Renter | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedRenterForCheckout, setSelectedRenterForCheckout] = useState<Renter | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRenterForDetails, setSelectedRenterForDetails] = useState<Renter | null>(null);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedRenterForReset, setSelectedRenterForReset] = useState<Renter | null>(null);

  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [selectedApplicantForApprove, setSelectedApplicantForApprove] = useState<Renter | null>(null);

  // Subscribe to Firestore collections
  useEffect(() => {
    const unsubRooms = subscribeRooms(setRooms);
    const unsubRenters = subscribeRenters(setRenters);
    const unsubNotices = subscribeNotices(setNotices);
    const unsubLogs = subscribeActivityLogs(setActivityLogs);

    return () => {
      unsubRooms();
      unsubRenters();
      unsubNotices();
      unsubLogs();
    };
  }, []);

  // Reset renter filter when leaving the renters tab
  useEffect(() => {
    if (currentTab !== 'renters') {
      // Don't reset immediately — only clear when navigating away without a pending filter
      // This is handled by onNavigateTab callback
    }
  }, [currentTab]);

  // Update tab if role changes
  useEffect(() => {
    if (role === 'renter') {
      if (currentTab === 'dashboard' || currentTab === 'rooms' || currentTab === 'renters' || currentTab === 'audit') {
        setCurrentTab('renter-room');
      }
    } else {
      if (currentTab.startsWith('renter-')) {
        setCurrentTab('dashboard');
      }
    }
  }, [role]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Connecting to PREM NIWAS...</p>
      </div>
    );
  }

  // If not logged in and no profile, show login/signup screen
  if (!currentUser && !profile) {
    return <AuthScreen />;
  }

  // Pending approval screen for non-owner renters waiting for owner KYC verification and room allotment
  // Only show if renterRecord is loaded (not null from loading state) and genuinely pending
  const isRenterPending = role === 'renter' && profile && (
    profile.approvalStatus === 'pending' || 
    profile.approvalStatus === 'rejected' ||
    renterRecord?.status === 'pending_approval' ||
    renterRecord?.status === 'rejected'
  );

  if (isRenterPending) {
    return (
      <PendingApprovalScreen
        renterRecord={renterRecord}
        onRefresh={refreshAuthData}
      />
    );
  }

  const vacantRooms = rooms.filter(r => r.status === 'vacant');
  const pendingRentersCount = renters.filter(r => r.status === 'pending_approval').length;

  // Find assigned room for renter
  const assignedRoomForRenter = renterRecord?.roomId 
    ? rooms.find(r => r.id === renterRecord.roomId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-900 antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Persistent Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        rooms={rooms}
        pendingRentersCount={pendingRentersCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 md:pb-12">
        
        {/* OWNER VIEWS (Only available when logged in with permanent owner email) */}
        {role === 'owner' && (
          <>
            {currentTab === 'dashboard' && (
              <OwnerDashboard
                rooms={rooms}
                renters={renters}
                activityLogs={activityLogs}
                notices={notices}
                onNavigateTab={(tab, filter) => {
                  setCurrentTab(tab);
                  if (tab === 'rooms') setRoomFilterProp(filter || 'all');
                  if (tab === 'renters') setRenterFilterProp(filter || 'all');
                }}
                onOpenRegisterModal={() => {
                  setPreSelectedRoom(null);
                  setIsRegisterOpen(true);
                }}
                onOpenNoticeModal={() => setIsNoticeModalOpen(true)}
                onSelectRoom={(room) => {
                  if (room.status === 'vacant') {
                    setPreSelectedRoom(room);
                    setIsRegisterOpen(true);
                  } else if (room.currentRenterId) {
                    const occupant = renters.find(r => r.id === room.currentRenterId);
                    if (occupant) {
                      setSelectedRenterForDetails(occupant);
                      setIsDetailsOpen(true);
                    }
                  }
                }}
              />
            )}

            {currentTab === 'rooms' && (
              <RoomsView
                rooms={rooms}
                renters={renters}
                initialFilter={roomFilterProp}
                onAssignRoom={(room) => {
                  setPreSelectedRoom(room);
                  setIsRegisterOpen(true);
                }}
                onChangeRoom={(renter) => {
                  setSelectedRenterForChangeRoom(renter);
                  setIsChangeRoomOpen(true);
                }}
                onCheckoutRenter={(renter) => {
                  setSelectedRenterForCheckout(renter);
                  setIsCheckoutOpen(true);
                }}
                onViewRenterDetails={(renter) => {
                  setSelectedRenterForDetails(renter);
                  setIsDetailsOpen(true);
                }}
              />
            )}

            {currentTab === 'renters' && (
              <RentersView
                renters={renters}
                rooms={rooms}
                initialFilter={renterFilterProp}
                onOpenRegisterModal={() => {
                  setPreSelectedRoom(null);
                  setIsRegisterOpen(true);
                }}
                onEditRenter={(renter) => {
                  setSelectedRenterForEdit(renter);
                  setIsEditOpen(true);
                }}
                onChangeRoom={(renter) => {
                  setSelectedRenterForChangeRoom(renter);
                  setIsChangeRoomOpen(true);
                }}
                onCheckoutRenter={(renter) => {
                  setSelectedRenterForCheckout(renter);
                  setIsCheckoutOpen(true);
                }}
                onResetPassword={(renter) => {
                  setSelectedRenterForReset(renter);
                  setIsResetPasswordOpen(true);
                }}
                onViewDetails={(renter) => {
                  setSelectedRenterForDetails(renter);
                  setIsDetailsOpen(true);
                }}
                onApproveApplicant={(applicant) => {
                  setSelectedApplicantForApprove(applicant);
                  setIsApproveOpen(true);
                }}
              />
            )}

            {currentTab === 'bills' && (
              <BillsView
                renters={renters}
                rooms={rooms}
              />
            )}

            {currentTab === 'chat' && (
              <ChatView
                renters={renters}
                rooms={rooms}
                currentUserId={currentUser?.uid || 'owner_admin'}
                currentUserName={profile?.name || 'Prem Niwas Owner'}
              />
            )}

            {currentTab === 'notices' && (
              <NoticesView
                notices={notices}
                onOpenCreateModal={() => setIsNoticeModalOpen(true)}
              />
            )}

            {currentTab === 'audit' && (
              <ActivityLogView activityLogs={activityLogs} />
            )}
          </>
        )}

        {/* RENTER VIEWS (Only accessible after Owner Verification & Approval) */}
        {role === 'renter' && (
          <RenterPortal
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            renter={renterRecord}
            assignedRoom={assignedRoomForRenter}
            notices={notices}
          />
        )}
      </main>

      {/* Global Modals for Owner Operations */}
      <ApproveRenterModal
        isOpen={isApproveOpen}
        onClose={() => {
          setIsApproveOpen(false);
          setSelectedApplicantForApprove(null);
        }}
        applicant={selectedApplicantForApprove}
        vacantRooms={vacantRooms}
        onActionComplete={() => {
          // Handled via Firestore subscriptions
        }}
      />

      <RegisterRenterModal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setPreSelectedRoom(null);
        }}
        vacantRooms={vacantRooms}
        preSelectedRoom={preSelectedRoom}
        onRenterRegistered={() => {}}
      />

      <EditRenterModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedRenterForEdit(null);
        }}
        renter={selectedRenterForEdit}
        onUpdated={() => {}}
      />

      <ChangeRoomModal
        isOpen={isChangeRoomOpen}
        onClose={() => {
          setIsChangeRoomOpen(false);
          setSelectedRenterForChangeRoom(null);
        }}
        renter={selectedRenterForChangeRoom}
        vacantRooms={vacantRooms}
        onRoomChanged={() => {}}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedRenterForCheckout(null);
        }}
        renter={selectedRenterForCheckout}
        onCheckedOut={() => {}}
      />

      <RenterDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRenterForDetails(null);
        }}
        renter={selectedRenterForDetails}
        onEdit={(renter) => {
          setSelectedRenterForEdit(renter);
          setIsEditOpen(true);
        }}
        onChangeRoom={(renter) => {
          setSelectedRenterForChangeRoom(renter);
          setIsChangeRoomOpen(true);
        }}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);
          setSelectedRenterForReset(null);
        }}
        renter={selectedRenterForReset}
      />

      <CreateNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        onCreated={() => {}}
      />

      {/* Footer Note */}
      <footer className="mt-8 mb-16 md:mb-0 py-5 border-t border-slate-200/80 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong className="text-slate-700">PREM NIWAS</strong> • Phase 1 Residential Rental Management (15 Rooms)
          </span>
          <span className="text-slate-400">
            Civil Lines Road • 15 Residential Units • Real-time Portal
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
