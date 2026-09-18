export type UserRole = 'owner' | 'renter';

export const PERMANENT_OWNER_EMAIL = 'premniwas33@gmail.com';

export const OWNER_EMAILS = [
  'premniwas33@gmail.com',
  'adityakumar87258@gmail.com',
  'amitniwas33@gmail.com',
  'amitniwas@gmail.com'
];

export const isOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return OWNER_EMAILS.some(e => e.toLowerCase() === clean);
};

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  renterId?: string | null; // Associated renter record id if role is renter
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  createdAt?: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  floors: number;
  description: string;
}

export interface Room {
  id: string;
  buildingId: string;
  roomNumber: number; // 1 to 15
  roomName: string;   // "Room 1", "Room 2", etc.
  floor: string;      // "Ground Floor", "1st Floor", "2nd Floor"
  type: string;       // "Standard Single", "1 RK Studio", "1 BHK Deluxe"
  baseRent: number;   // In INR, e.g. 7500
  status: 'vacant' | 'occupied';
  currentRenterId?: string | null;
  currentRenterName?: string | null;
  currentRenterPhone?: string | null;
  occupiedSince?: string | null;
  updatedAt: string;
}

export interface Renter {
  id: string;
  buildingId: string;
  userId?: string | null; // Auth UID if they have a login account
  fullName: string;
  phone: string;
  email: string;
  govIdType: 'Aadhaar Card' | 'PAN Card' | 'Passport' | 'Voter ID' | 'Driving License';
  govIdNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  permanentAddress: string;
  occupation: string;
  workplace: string;
  roomId: string | null;
  roomNumber: number | null;
  monthlyRent: number;
  initialRent?: number; // Base rent at lease start for tracking increases
  electricityBillingType?: 'meter_based' | 'included_in_rent'; // Billing type requirement
  annualIncreasePercent?: number; // Default 5% or customized
  lastAnnualIncreaseDate?: string | null;
  securityDeposit: number;
  leaseStartDate: string; // YYYY-MM-DD - Anniversary date used for annual increase
  status: 'active' | 'pending_approval' | 'checked_out' | 'rejected';
  checkoutDate?: string | null;
  checkoutNotes?: string | null;
  securityDepositReturned?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ElectricityBillingType = 'meter_based' | 'included_in_rent';

export interface BuildingSettings {
  id: string;
  buildingName: string;
  defaultAnnualIncrease: number; // e.g. 5
  electricityRate: number; // e.g. 8 (₹ per unit)
  defaultWaterCharges: number; // e.g. 300
  upiId: string; // e.g. "amitniwas@okaxis"
  upiName: string;
  qrCodeUrl?: string | null;
  updatedAt: string;
  updatedBy?: string;
}

export type MeterReadingStatus = 'pending_approval' | 'approved' | 'rejected';

export interface MeterReading {
  id: string;
  buildingId: string;
  renterId: string;
  renterName: string;
  roomId: string;
  roomNumber: number;
  billingPeriod: string; // e.g. "September 2026"
  previousReading: number;
  enteredReading: number;
  aiDetectedReading?: number | null;
  units: number; // enteredReading - previousReading
  electricityRate: number; // Rate snapshot at submission
  electricityAmount: number; // units * electricityRate
  photoUrl?: string | null;
  photoStoragePath?: string | null;
  status: MeterReadingStatus;
  rejectionReason?: string | null;
  submittedAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BillStatus = 'unpaid' | 'partially_paid' | 'paid' | 'cancelled' | 'overdue';

export interface BillCorrection {
  timestamp: string;
  changedBy: string;
  reason: string;
  oldValues: {
    rent?: number;
    electricityAmount?: number;
    waterAmount?: number;
    backDues?: number;
    totalAmount?: number;
  };
  newValues: {
    rent?: number;
    electricityAmount?: number;
    waterAmount?: number;
    backDues?: number;
    totalAmount?: number;
  };
}

export interface Bill {
  id: string;
  buildingId: string;
  invoiceNumber: string; // e.g. "INV-AN-202609-R101-001"
  renterId: string;
  renterName: string;
  renterPhone?: string;
  roomId: string;
  roomNumber: number;
  billingPeriod: string; // e.g. "September 2026"
  billDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD (1st to 10th of month)
  
  // Slide 2 values: Rent & Other
  rent: number;
  annualIncreasePercent: number;
  
  // Slide 1 values: Electricity
  electricityBillingType: ElectricityBillingType;
  meterReadingId?: string | null;
  previousMeterReading?: number;
  presentMeterReading?: number;
  electricityUnits?: number;
  electricityRate?: number; // Snapshot of rate used at bill creation
  electricityAmount: number; // 0 if included in rent
  
  // Utility & Dues
  waterAmount: number;
  backDues: number; // Carried over unpaid balance from previous billing periods
  
  // Final calculation totals
  subtotal: number; // rent + electricity + water
  totalAmount: number; // subtotal + backDues (rounded to whole rupee)
  paidAmount: number; // Cumulative payments applied
  remainingAmount: number; // totalAmount - paidAmount
  
  status: BillStatus;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  corrections?: BillCorrection[];
  
  // Legacy compatibility fields for old records
  billingMonth?: string;
  rentAmount?: number;
  electricityTotal?: number;
  waterCharges?: number;
  maintenanceCharges?: number;
  otherCharges?: number;
  otherChargesDesc?: string;
  notes?: string;
  paidAt?: string | null;
  paymentMode?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Other' | null;
  
  createdAt: string;
  updatedAt?: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'QR' | 'Bank Transfer';
export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';

export interface Payment {
  id: string;
  receiptId: string; // Official receipt ID e.g. "REC-AN-202609-101-001"
  buildingId: string;
  billId: string;
  renterId: string;
  renterName: string;
  roomId: string;
  roomNumber: number;
  amount: number; // INR whole number
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string; // UPI Ref or Bank transaction ID
  upiRef?: string;
  notes?: string;
  remainingDueAfterPayment: number;
  paidAt: string; // ISO date
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface RentHistoryRecord {
  id: string;
  buildingId: string;
  renterId: string;
  renterName: string;
  effectiveDate: string; // Anniversary date YYYY-MM-DD
  previousRent: number;
  increasePercent: number;
  increaseAmount: number;
  newRent: number; // Whole rupee integer
  notes?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  buildingId: string;
  title: string;
  content: string;
  category: 'General' | 'Maintenance' | 'Emergency' | 'Building Rule';
  priority: 'low' | 'medium' | 'high';
  isPinned: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  buildingId: string;
  action: 
    | 'RENTER_REGISTERED'
    | 'RENTER_APPROVED'
    | 'RENTER_REJECTED'
    | 'SIGNUP_SUBMITTED'
    | 'ROOM_ADDED'
    | 'ROOM_UPDATED'
    | 'ROOM_DELETED'
    | 'ROOM_ASSIGNED'
    | 'ROOM_CHANGED'
    | 'RENTER_CHECKED_OUT'
    | 'RENTER_UPDATED'
    | 'NOTICE_CREATED'
    | 'NOTICE_DELETED'
    | 'BILL_GENERATED'
    | 'BILL_CORRECTED'
    | 'BILL_CANCELLED'
    | 'BILL_STATUS_UPDATED'
    | 'BILL_DELETED'
    | 'METER_SUBMITTED'
    | 'METER_APPROVED'
    | 'METER_REJECTED'
    | 'PAYMENT_CREATED'
    | 'PAYMENT_VERIFIED'
    | 'PAYMENT_REJECTED'
    | 'CASH_PAYMENT_RECORDED'
    | 'RENT_INCREASE_APPLIED'
    | 'SETTINGS_UPDATED'
    | 'MESSAGE_SENT'
    | 'PASSWORD_RESET_SENT'
    | 'SYSTEM_INITIALIZED';
  description: string;
  performedBy: string;
  performedByName: string;
  targetType: 'renter' | 'room' | 'notice' | 'building' | 'auth' | 'bill' | 'chat' | 'meter' | 'payment' | 'settings';
  targetId?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  buildingId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string; // specific renterId, or 'owner', or 'all'
  receiverName?: string;
  text: string;
  createdAt: string;
  read?: boolean;
}

