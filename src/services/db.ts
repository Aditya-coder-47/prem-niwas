import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Building, Room, Renter, Notice, ActivityLog, UserProfile, ChatMessage, Bill } from '../types';

export const BUILDING_ID = 'building_prem_niwas';

/**
 * Strips all `undefined` values from an object recursively before passing to Firestore
 * to prevent 'Function setDoc() called with invalid data. Unsupported field value: undefined'
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (item !== null && typeof item === 'object' && !(item instanceof Date) ? sanitizeForFirestore(item) : item)) as any;
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      cleaned[key] = sanitizeForFirestore(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export const PREM_NIWAS_BUILDING: Building = {
  id: BUILDING_ID,
  name: 'PREM NIWAS',
  address: 'Plot 42, Civil Lines Road, Prem Niwas Residential, Sector 4',
  totalRooms: 15,
  floors: 3,
  description: 'G+2 Residential Building with 15 residential units.'
};

// ==================== ACTIVITY / AUDIT LOGS ====================

export async function logActivity(
  action: ActivityLog['action'],
  description: string,
  targetType: ActivityLog['targetType'],
  targetId?: string,
  performedByName: string = 'Building Owner'
): Promise<void> {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(db, 'activity_logs', logId);
    const newLog: ActivityLog = {
      id: logId,
      buildingId: BUILDING_ID,
      action,
      description,
      performedBy: auth.currentUser?.uid || 'system',
      performedByName,
      targetType,
      targetId: targetId || '',
      timestamp: new Date().toISOString()
    };
    await setDoc(logRef, newLog);
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}

export function subscribeActivityLogs(callback: (logs: ActivityLog[]) => void) {
  const q = query(
    collection(db, 'activity_logs'),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(d => d.data() as ActivityLog);
    callback(logs);
  }, (err) => {
    console.warn('Activity logs snapshot error:', err);
  });
}

// ==================== INITIALIZATION & DUMMY DATA PURGE ====================

export async function checkAndSeedRooms(): Promise<boolean> {
  try {
    const buildingRef = doc(db, 'buildings', BUILDING_ID);
    const buildingSnap = await getDoc(buildingRef);

    if (!buildingSnap.exists()) {
      await setDoc(buildingRef, PREM_NIWAS_BUILDING);
    }

    // 1. Purge any leftover dummy sample renters for a true production system
    const dummyRenterIds = [
      'renter_rahul_verma',
      'renter_priya_sharma',
      'renter_suresh_patel',
      'renter_vikram_joshi',
      'renter_ankit_mehra'
    ];

    for (const dId of dummyRenterIds) {
      const dRef = doc(db, 'renters', dId);
      const dSnap = await getDoc(dRef);
      if (dSnap.exists()) {
        await deleteDoc(dRef);
      }
    }

    // 2. Ensure initial clean rooms exist if database is fresh
    const roomsSnap = await getDocs(collection(db, 'rooms'));
    if (roomsSnap.empty) {
      const batch = writeBatch(db);

      for (let i = 1; i <= 15; i++) {
        let floor = 'Ground Floor';
        let type = '1 RK Studio';
        let baseRent = 6500;

        if (i >= 6 && i <= 10) {
          floor = '1st Floor';
          type = i % 2 === 0 ? '1 BHK Deluxe' : '1 RK Studio';
          baseRent = i % 2 === 0 ? 9000 : 7000;
        } else if (i >= 11) {
          floor = '2nd Floor';
          type = i % 2 === 0 ? '1 BHK Deluxe' : 'Standard Single';
          baseRent = i % 2 === 0 ? 8500 : 6000;
        }

        const roomId = `room_${i}`;
        const roomRef = doc(db, 'rooms', roomId);
        const roomData: Room = {
          id: roomId,
          buildingId: BUILDING_ID,
          roomNumber: i,
          roomName: `Room ${i}`,
          floor,
          type,
          baseRent,
          status: 'vacant',
          currentRenterId: null,
          currentRenterName: null,
          currentRenterPhone: null,
          occupiedSince: null,
          updatedAt: new Date().toISOString()
        };
        batch.set(roomRef, roomData);
      }

      await batch.commit();

      // Clean, professional notice
      const notice1Ref = doc(db, 'notices', 'notice_welcome');
      const notice1: Notice = {
        id: 'notice_welcome',
        buildingId: BUILDING_ID,
        title: 'Welcome to Prem Niwas Residential Portal',
        content: 'Building management portal is active. Residents can view room details, generate and pay monthly rent bills, and communicate directly with management.',
        category: 'General',
        priority: 'high',
        isPinned: true,
        createdBy: 'system',
        createdByName: 'Management',
        createdAt: new Date().toISOString()
      };
      await setDoc(notice1Ref, notice1);

      return true;
    } else {
      // If rooms already exist, reset any rooms that were tied to purged dummy renters
      for (const rDoc of roomsSnap.docs) {
        const rData = rDoc.data() as Room;
        if (rData.currentRenterId && dummyRenterIds.includes(rData.currentRenterId)) {
          await updateDoc(rDoc.ref, {
            status: 'vacant',
            currentRenterId: null,
            currentRenterName: null,
            currentRenterPhone: null,
            occupiedSince: null,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    return false;
  } catch (error: any) {
    console.warn('Room check/seed status:', error?.message || error);
    return false;
  }
}

// ==================== ROOMS OPERATIONS (ADD, UPDATE, DELETE) ====================

export async function addNewRoom(
  roomData: {
    roomNumber: number;
    roomName: string;
    floor: string;
    type: string;
    baseRent: number;
  },
  operatorName: string = 'Building Owner'
): Promise<Room> {
  const roomsRef = collection(db, 'rooms');
  const q = query(roomsRef, where('roomNumber', '==', Number(roomData.roomNumber)));
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error(`Room Number ${roomData.roomNumber} already exists in the building.`);
  }

  const roomId = `room_${roomData.roomNumber}_${Date.now()}`;
  const newRoom: Room = {
    id: roomId,
    buildingId: BUILDING_ID,
    roomNumber: Number(roomData.roomNumber),
    roomName: roomData.roomName.trim() || `Room ${roomData.roomNumber}`,
    floor: roomData.floor || 'Ground Floor',
    type: roomData.type || '1 RK Studio',
    baseRent: Number(roomData.baseRent) || 6000,
    status: 'vacant',
    currentRenterId: null,
    currentRenterName: null,
    currentRenterPhone: null,
    occupiedSince: null,
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'rooms', roomId), newRoom);
  await logActivity(
    'ROOM_ADDED',
    `Added new room: ${newRoom.roomName} (${newRoom.floor}) with base rent ₹${newRoom.baseRent.toLocaleString('en-IN')}`,
    'room',
    roomId,
    operatorName
  );
  return newRoom;
}

export async function deleteRoom(roomId: string, operatorName: string = 'Building Owner'): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const room = snap.data() as Room;
  if (room.status === 'occupied') {
    throw new Error(`Cannot delete Room ${room.roomNumber} because it is currently occupied by a resident.`);
  }
  await deleteDoc(roomRef);
  await logActivity(
    'ROOM_DELETED',
    `Deleted room: ${room.roomName || `Room ${room.roomNumber}`}`,
    'room',
    roomId,
    operatorName
  );
}

// ==================== ROOMS OPERATIONS ====================

export function subscribeRooms(callback: (rooms: Room[]) => void) {
  const q = query(collection(db, 'rooms'), orderBy('roomNumber', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => doc.data() as Room);
    callback(rooms);
  }, (err) => {
    console.warn('Rooms subscription error:', err);
  });
}

export async function updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

// ==================== RENTERS OPERATIONS ====================

export function subscribeRenters(callback: (renters: Renter[]) => void) {
  // Use simple collection query (no orderBy = no index requirement)
  // Sorting is handled client-side for reliability
  const q = collection(db, 'renters');
  return onSnapshot(q, (snapshot) => {
    const renters = snapshot.docs
      .map(doc => doc.data() as Renter)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(renters);
  }, (err) => {
    console.error('Renters subscription error:', err);
    callback([]);
  });
}

export async function registerRenter(
  renterInput: Omit<Renter, 'id' | 'createdAt' | 'updatedAt' | 'buildingId'>,
  operatorName: string
): Promise<string> {
  const renterId = `renter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const batch = writeBatch(db);

  const renterRef = doc(db, 'renters', renterId);
  const newRenter: Renter = {
    ...renterInput,
    id: renterId,
    buildingId: BUILDING_ID,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  batch.set(renterRef, newRenter);

  // If a room was assigned at registration
  if (renterInput.roomId) {
    const roomRef = doc(db, 'rooms', renterInput.roomId);
    batch.update(roomRef, {
      status: 'occupied',
      currentRenterId: renterId,
      currentRenterName: renterInput.fullName,
      currentRenterPhone: renterInput.phone,
      occupiedSince: renterInput.leaseStartDate,
      updatedAt: new Date().toISOString()
    });
  }

  await batch.commit();

  await logActivity(
    'RENTER_REGISTERED',
    `Registered renter "${renterInput.fullName}"${renterInput.roomNumber ? ` and assigned Room ${renterInput.roomNumber}` : ''}`,
    'renter',
    renterId,
    operatorName
  );

  return renterId;
}

export async function updateRenterInfo(
  renterId: string, 
  updates: Partial<Renter>,
  operatorName: string
): Promise<void> {
  const renterRef = doc(db, 'renters', renterId);
  await updateDoc(renterRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });

  // If name or phone changed and room is assigned, update room display
  if ((updates.fullName || updates.phone) && updates.roomId) {
    const roomRef = doc(db, 'rooms', updates.roomId);
    await updateDoc(roomRef, {
      ...(updates.fullName ? { currentRenterName: updates.fullName } : {}),
      ...(updates.phone ? { currentRenterPhone: updates.phone } : {}),
      updatedAt: new Date().toISOString()
    });
  }

  await logActivity(
    'RENTER_UPDATED',
    `Updated renter profile for "${updates.fullName || renterId}"`,
    'renter',
    renterId,
    operatorName
  );
}

export async function changeRenterRoomAssignment(
  renter: Renter,
  newRoom: Room,
  operatorName: string
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Vacate old room if any
  if (renter.roomId && renter.roomId !== newRoom.id) {
    const oldRoomRef = doc(db, 'rooms', renter.roomId);
    batch.update(oldRoomRef, {
      status: 'vacant',
      currentRenterId: null,
      currentRenterName: null,
      currentRenterPhone: null,
      occupiedSince: null,
      updatedAt: new Date().toISOString()
    });
  }

  // 2. Occupy new room
  const newRoomRef = doc(db, 'rooms', newRoom.id);
  batch.update(newRoomRef, {
    status: 'occupied',
    currentRenterId: renter.id,
    currentRenterName: renter.fullName,
    currentRenterPhone: renter.phone,
    occupiedSince: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString()
  });

  // 3. Update renter record
  const renterRef = doc(db, 'renters', renter.id);
  batch.update(renterRef, {
    roomId: newRoom.id,
    roomNumber: newRoom.roomNumber,
    monthlyRent: newRoom.baseRent || renter.monthlyRent,
    updatedAt: new Date().toISOString()
  });

  await batch.commit();

  await logActivity(
    'ROOM_CHANGED',
    `Reassigned renter "${renter.fullName}" from Room ${renter.roomNumber || 'None'} to Room ${newRoom.roomNumber}`,
    'room',
    newRoom.id,
    operatorName
  );
}

export async function checkoutRenter(
  renter: Renter,
  checkoutData: {
    checkoutDate: string;
    checkoutNotes: string;
    securityDepositReturned: number;
  },
  operatorName: string
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Vacate the room
  if (renter.roomId) {
    const roomRef = doc(db, 'rooms', renter.roomId);
    batch.update(roomRef, {
      status: 'vacant',
      currentRenterId: null,
      currentRenterName: null,
      currentRenterPhone: null,
      occupiedSince: null,
      updatedAt: new Date().toISOString()
    });
  }

  // 2. Update renter status to checked_out
  const renterRef = doc(db, 'renters', renter.id);
  batch.update(renterRef, {
    status: 'checked_out',
    checkoutDate: checkoutData.checkoutDate,
    checkoutNotes: checkoutData.checkoutNotes,
    securityDepositReturned: checkoutData.securityDepositReturned,
    updatedAt: new Date().toISOString()
  });

  await batch.commit();

  await logActivity(
    'RENTER_CHECKED_OUT',
    `Completed checkout for "${renter.fullName}" from Room ${renter.roomNumber || '-'}. Notes: ${checkoutData.checkoutNotes || 'None'}`,
    'renter',
    renter.id,
    operatorName
  );
}

export async function resetRenterPassword(
  email: string,
  renterName: string,
  operatorName: string
): Promise<{ success: boolean; message: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    await logActivity(
      'PASSWORD_RESET_SENT',
      `Sent official password reset email to renter "${renterName}" (${email})`,
      'auth',
      email,
      operatorName
    );
    return { 
      success: true, 
      message: `Password reset instructions dispatched to ${email}` 
    };
  } catch (err: any) {
    console.error('Password reset error:', err);
    // If user not in firebase auth yet, explain clearly
    if (err.code === 'auth/user-not-found') {
      return {
        success: false,
        message: `No active Firebase login account exists for ${email}. You can provide them with tenant registration credentials.`
      };
    }
    return {
      success: false,
      message: err.message || 'Failed to dispatch password reset email.'
    };
  }
}

// ==================== NOTICES ====================

export function subscribeNotices(callback: (notices: Notice[]) => void) {
  const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const notices = snapshot.docs.map(doc => doc.data() as Notice);
    // Sort pinned to top, then by date
    notices.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    callback(notices);
  }, (err) => {
    console.warn('Notices subscription error:', err);
  });
}

export async function createNotice(
  noticeData: Omit<Notice, 'id' | 'createdAt' | 'buildingId'>,
  operatorName: string
): Promise<string> {
  const noticeId = `notice_${Date.now()}`;
  const noticeRef = doc(db, 'notices', noticeId);
  const newNotice: Notice = {
    ...noticeData,
    id: noticeId,
    buildingId: BUILDING_ID,
    createdAt: new Date().toISOString()
  };

  await setDoc(noticeRef, newNotice);

  await logActivity(
    'NOTICE_CREATED',
    `Published notice "${noticeData.title}" (${noticeData.category})`,
    'notice',
    noticeId,
    operatorName
  );

  return noticeId;
}

export async function deleteNotice(noticeId: string, title: string, operatorName: string): Promise<void> {
  await deleteDoc(doc(db, 'notices', noticeId));
  await logActivity(
    'NOTICE_DELETED',
    `Deleted notice "${title}"`,
    'notice',
    noticeId,
    operatorName
  );
}

// ==================== USER PROFILES ====================

export async function submitRenterSignup(
  renterInput: {
    fullName: string;
    phone: string;
    email: string;
    govIdType: Renter['govIdType'];
    govIdNumber: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    permanentAddress: string;
    occupation: string;
    workplace: string;
    userId: string;
  }
): Promise<string> {
  const renterId = `renter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const batch = writeBatch(db);

  // 1. Create or update user doc with pending status
  const userRef = doc(db, 'users', renterInput.userId);
  batch.set(userRef, {
    uid: renterInput.userId,
    email: renterInput.email.toLowerCase(),
    name: renterInput.fullName,
    role: 'renter',
    phone: renterInput.phone,
    renterId: renterId,
    approvalStatus: 'pending',
    createdAt: new Date().toISOString()
  });

  // 2. Create renter record with status 'pending_approval'
  const renterRef = doc(db, 'renters', renterId);
  const newRenter: Renter = {
    ...renterInput,
    id: renterId,
    buildingId: BUILDING_ID,
    userId: renterInput.userId,
    roomId: null,
    roomNumber: null,
    monthlyRent: 0,
    securityDeposit: 0,
    leaseStartDate: new Date().toISOString().split('T')[0],
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  batch.set(renterRef, newRenter);

  await batch.commit();

  await logActivity(
    'SIGNUP_SUBMITTED',
    `New resident registration submitted by "${renterInput.fullName}" (${renterInput.email}) — Awaiting Owner Approval`,
    'renter',
    renterId,
    renterInput.fullName
  );

  return renterId;
}

export async function approveRenterApplication(
  renter: Renter,
  room: Room,
  monthlyRent: number,
  securityDeposit: number,
  leaseStartDate: string,
  operatorName: string
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Update Renter record to active
  const renterRef = doc(db, 'renters', renter.id);
  batch.update(renterRef, {
    status: 'active',
    roomId: room.id,
    roomNumber: room.roomNumber,
    monthlyRent,
    securityDeposit,
    leaseStartDate,
    updatedAt: new Date().toISOString()
  });

  // 2. Mark Room as Occupied
  const roomRef = doc(db, 'rooms', room.id);
  batch.update(roomRef, {
    status: 'occupied',
    currentRenterId: renter.id,
    currentRenterName: renter.fullName,
    currentRenterPhone: renter.phone,
    occupiedSince: leaseStartDate,
    updatedAt: new Date().toISOString()
  });

  // 3. Update User Doc if exists
  if (renter.userId) {
    const userRef = doc(db, 'users', renter.userId);
    batch.update(userRef, {
      approvalStatus: 'approved',
      renterId: renter.id
    });
  }

  await batch.commit();

  await logActivity(
    'RENTER_APPROVED',
    `Approved resident application for "${renter.fullName}" and allotted Room ${room.roomNumber}`,
    'renter',
    renter.id,
    operatorName
  );
}

export async function rejectRenterApplication(
  renter: Renter,
  reason: string,
  operatorName: string
): Promise<void> {
  const batch = writeBatch(db);

  const renterRef = doc(db, 'renters', renter.id);
  batch.update(renterRef, {
    status: 'rejected',
    checkoutNotes: reason || 'Application declined by management.',
    updatedAt: new Date().toISOString()
  });

  if (renter.userId) {
    const userRef = doc(db, 'users', renter.userId);
    batch.update(userRef, {
      approvalStatus: 'rejected'
    });
  }

  await batch.commit();

  await logActivity(
    'RENTER_REJECTED',
    `Declined resident application for "${renter.fullName}" (${reason || 'Verification criteria not met'})`,
    'renter',
    renter.id,
    operatorName
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, sanitizeForFirestore(profile), { merge: true });
}

// ==================== BILLS & INVOICES OPERATIONS ====================

export async function createBill(
  billData: Omit<Bill, 'id' | 'createdAt'>,
  operatorName: string = 'Building Owner'
): Promise<string> {
  const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newBill: Bill = {
    ...billData,
    id: billId,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'bills', billId), sanitizeForFirestore(newBill));

  await logActivity(
    'BILL_GENERATED',
    `Generated bill ${newBill.invoiceNumber} for ${newBill.renterName} (Room ${newBill.roomNumber}) - Total: ₹${newBill.totalAmount.toLocaleString('en-IN')}`,
    'bill',
    billId,
    operatorName
  );

  return billId;
}

export async function updateBillStatus(
  billId: string,
  status: 'unpaid' | 'paid' | 'overdue',
  paymentMode?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other' | null,
  operatorName: string = 'Building Owner'
): Promise<void> {
  const billRef = doc(db, 'bills', billId);
  const updates: Partial<Bill> = {
    status,
    paidAt: status === 'paid' ? new Date().toISOString() : null,
    paymentMode: status === 'paid' ? (paymentMode || 'Cash') : null
  };
  await updateDoc(billRef, updates);

  await logActivity(
    'BILL_STATUS_UPDATED',
    `Updated bill status to ${status.toUpperCase()}${paymentMode ? ` (Paid via ${paymentMode})` : ''}`,
    'bill',
    billId,
    operatorName
  );
}

export async function deleteBill(billId: string, operatorName: string = 'Building Owner'): Promise<void> {
  await deleteDoc(doc(db, 'bills', billId));
  await logActivity(
    'BILL_DELETED',
    `Deleted invoice record`,
    'bill',
    billId,
    operatorName
  );
}

export function subscribeBills(callback: (bills: Bill[]) => void) {
  const q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const bills = snapshot.docs.map(d => d.data() as Bill);
    callback(bills);
  }, (err) => {
    console.warn('Bills subscription error:', err);
  });
}

export function subscribeRenterBills(renterId: string, callback: (bills: Bill[]) => void) {
  const q = query(
    collection(db, 'bills'),
    where('renterId', '==', renterId)
  );
  return onSnapshot(q, (snapshot) => {
    const bills = snapshot.docs.map(d => d.data() as Bill);
    bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(bills);
  }, (err) => {
    console.warn('Renter bills subscription error:', err);
  });
}

// ==================== REAL-TIME CHAT & MESSAGING ====================

export async function sendChatMessage(
  msg: Omit<ChatMessage, 'id' | 'createdAt'>
): Promise<string> {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newMsg: ChatMessage = {
    ...msg,
    id: msgId,
    createdAt: new Date().toISOString(),
    read: false
  };

  await setDoc(doc(db, 'chat_messages', msgId), sanitizeForFirestore(newMsg));

  return msgId;
}

export function subscribeChatMessages(
  filterRenterId: string | null,
  callback: (messages: ChatMessage[]) => void
) {
  const colRef = collection(db, 'chat_messages');
  // Order by createdAt ascending
  const q = query(colRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    let msgs = snapshot.docs.map(d => d.data() as ChatMessage);
    if (filterRenterId) {
      // Show messages involving this renter (sent by them, or sent to them, or to 'all')
      msgs = msgs.filter(m => 
        m.senderId === filterRenterId || 
        m.receiverId === filterRenterId || 
        m.receiverId === 'all'
      );
    }
    callback(msgs);
  }, (err) => {
    console.warn('Chat subscription error:', err);
  });
}

export async function markChatAsRead(messageIds: string[]): Promise<void> {
  if (!messageIds.length) return;
  const batch = writeBatch(db);
  for (const id of messageIds) {
    batch.update(doc(db, 'chat_messages', id), { read: true });
  }
  await batch.commit();
}

// ==================== RE-EXPORTS FOR PHASE 2 BILLING & UTILITIES ====================
export * from './billingService';

