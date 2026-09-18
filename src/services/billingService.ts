import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { 
  Bill, 
  BuildingSettings, 
  MeterReading, 
  Payment, 
  RentHistoryRecord, 
  BillCorrection,
  ElectricityBillingType,
  PaymentMethod
} from '../types';
import { BUILDING_ID, logActivity, sanitizeForFirestore, subscribeBills, subscribeRenterBills } from './db';

export { subscribeBills, subscribeRenterBills };

// ==================== DEFAULT SETTINGS ====================

export const DEFAULT_BUILDING_SETTINGS: BuildingSettings = {
  id: 'amit_niwas',
  buildingName: 'Amit Niwas',
  defaultAnnualIncrease: 5,
  electricityRate: 8, // ₹8 per unit default
  defaultWaterCharges: 300, // ₹300 default water charge
  upiId: 'amitniwas@okaxis',
  upiName: 'Amit Niwas Management',
  qrCodeUrl: null,
  updatedAt: new Date().toISOString()
};

// ==================== 1. BUILDING SETTINGS MANAGEMENT ====================

export async function getBuildingSettings(): Promise<BuildingSettings> {
  try {
    const docRef = doc(db, 'building_settings', 'amit_niwas');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as BuildingSettings;
    }
    // Initialize default if not present
    await setDoc(docRef, sanitizeForFirestore(DEFAULT_BUILDING_SETTINGS));
    return DEFAULT_BUILDING_SETTINGS;
  } catch (err) {
    console.warn('Could not fetch building settings, using defaults:', err);
    return DEFAULT_BUILDING_SETTINGS;
  }
}

export async function saveBuildingSettings(
  updates: Partial<BuildingSettings>,
  operatorName: string = 'Building Owner'
): Promise<void> {
  const docRef = doc(db, 'building_settings', 'amit_niwas');
  const payload = {
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: operatorName
  };
  await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });

  await logActivity(
    'SETTINGS_UPDATED',
    `Updated building settings (Rate: ₹${updates.electricityRate ?? 8}/unit, Annual Increase: ${updates.defaultAnnualIncrease ?? 5}%, Water: ₹${updates.defaultWaterCharges ?? 300})`,
    'settings',
    'amit_niwas',
    operatorName
  );
}

export function subscribeBuildingSettings(callback: (settings: BuildingSettings) => void) {
  const docRef = doc(db, 'building_settings', 'amit_niwas');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as BuildingSettings);
    } else {
      callback(DEFAULT_BUILDING_SETTINGS);
    }
  }, (err) => {
    console.warn('Error subscribing to building settings:', err);
    callback(DEFAULT_BUILDING_SETTINGS);
  });
}

// ==================== 2. PHOTO UPLOAD & STORAGE ====================

/**
 * Uploads a meter photo to Firebase Storage with automatic data-URL fallback
 * if Storage is unconfigured or blocked by environment constraints.
 */
export async function uploadMeterPhoto(
  file: File | Blob, 
  renterId: string
): Promise<{ photoUrl: string; storagePath?: string }> {
  const timestamp = Date.now();
  const storagePath = `meter_photos/${renterId}/${timestamp}.jpg`;

  try {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    return { photoUrl: downloadUrl, storagePath };
  } catch (storageErr) {
    console.warn('Firebase Storage upload unavailable, using optimized data URL fallback:', storageErr);
    // Compress to data URL fallback so the renter flow is never interrupted
    const dataUrl = await fileToDataUrl(file);
    return { photoUrl: dataUrl, storagePath: 'local_compressed' };
  }
}

export async function uploadQRPaymentImage(file: File | Blob): Promise<string> {
  const storagePath = `payment_qr/amit_niwas_qr.jpg`;
  try {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.warn('QR Storage upload failed, fallback to data URL:', err);
    return await fileToDataUrl(file);
  }
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== 3. METER READINGS ====================

export async function getLatestApprovedMeterReading(
  renterId: string,
  roomId?: string
): Promise<MeterReading | null> {
  try {
    const colRef = collection(db, 'meter_readings');
    const q = query(
      colRef,
      where('renterId', '==', renterId),
      where('status', '==', 'approved')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    // Sort descending by enteredReading or submittedAt
    const readings = snap.docs.map(d => d.data() as MeterReading);
    readings.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return readings[0] || null;
  } catch (err) {
    console.error('Error fetching latest meter reading:', err);
    return null;
  }
}

export async function submitMeterReading(
  params: {
    renterId: string;
    renterName: string;
    roomId: string;
    roomNumber: number;
    billingPeriod: string;
    previousReading: number;
    enteredReading: number;
    aiDetectedReading?: number | null;
    electricityRate: number;
    photoUrl?: string | null;
    photoStoragePath?: string | null;
  },
  operatorName: string = 'Resident'
): Promise<string> {
  // Validation: Present reading cannot normally be lower than previous reading
  if (params.enteredReading < params.previousReading) {
    throw new Error('Present meter reading cannot be lower than the previous reading.');
  }

  const units = Math.max(0, params.enteredReading - params.previousReading);
  const electricityAmount = Math.round(units * params.electricityRate);
  const readingId = `reading_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newReading: MeterReading = {
    id: readingId,
    buildingId: BUILDING_ID,
    renterId: params.renterId,
    renterName: params.renterName,
    roomId: params.roomId,
    roomNumber: params.roomNumber,
    billingPeriod: params.billingPeriod,
    previousReading: params.previousReading,
    enteredReading: params.enteredReading,
    aiDetectedReading: params.aiDetectedReading || null,
    units,
    electricityRate: params.electricityRate,
    electricityAmount,
    photoUrl: params.photoUrl || null,
    photoStoragePath: params.photoStoragePath || null,
    status: 'pending_approval',
    rejectionReason: null,
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'meter_readings', readingId), sanitizeForFirestore(newReading));

  await logActivity(
    'METER_SUBMITTED',
    `Submitted meter reading of ${params.enteredReading} (Units: ${units}, Rate: ₹${params.electricityRate}/unit, Amount: ₹${electricityAmount}) for Room ${params.roomNumber}`,
    'meter',
    readingId,
    operatorName
  );

  return readingId;
}

export async function approveMeterReading(
  readingId: string,
  approverName: string = 'Building Owner'
): Promise<void> {
  const docRef = doc(db, 'meter_readings', readingId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Meter reading not found');
  const reading = snap.data() as MeterReading;

  const updates: Partial<MeterReading> = {
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: approverName,
    updatedAt: new Date().toISOString()
  };
  await updateDoc(docRef, sanitizeForFirestore(updates));

  await logActivity(
    'METER_APPROVED',
    `Approved meter reading of ${reading.enteredReading} (${reading.units} units @ ₹${reading.electricityRate}/unit) for ${reading.renterName} (Room ${reading.roomNumber})`,
    'meter',
    readingId,
    approverName
  );
}

export async function rejectMeterReading(
  readingId: string,
  rejectionReason: string,
  operatorName: string = 'Building Owner'
): Promise<void> {
  const docRef = doc(db, 'meter_readings', readingId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Meter reading not found');
  const reading = snap.data() as MeterReading;

  const updates: Partial<MeterReading> = {
    status: 'rejected',
    rejectionReason: rejectionReason || 'Reading could not be verified from photo.',
    updatedAt: new Date().toISOString()
  };
  await updateDoc(docRef, sanitizeForFirestore(updates));

  await logActivity(
    'METER_REJECTED',
    `Rejected meter reading for ${reading.renterName} (Room ${reading.roomNumber}). Reason: "${rejectionReason}"`,
    'meter',
    readingId,
    operatorName
  );
}

export function subscribeMeterReadings(callback: (readings: MeterReading[]) => void) {
  const colRef = collection(db, 'meter_readings');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as MeterReading);
    callback(list);
  }, (err) => {
    console.warn('Meter readings subscription error:', err);
    callback([]);
  });
}

export function subscribeRenterMeterReadings(
  renterId: string, 
  callback: (readings: MeterReading[]) => void
) {
  const colRef = collection(db, 'meter_readings');
  const q = query(colRef, where('renterId', '==', renterId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as MeterReading);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (err) => {
    console.warn('Renter meter readings subscription error:', err);
    callback([]);
  });
}

// ==================== 4. ANNUAL RENT INCREASE & HISTORY ====================

/**
 * Calculates new rent based on previous rent and annual increase percent.
 * MANDATORY RULE: Final rent MUST be rounded to the nearest whole rupee.
 * Example: ₹5,000 + 5% = ₹5,250.
 * Next year: ₹5,250 + 5% = ₹5,512.50 -> ₹5,513.
 */
export function calculateAnnualRentIncrease(
  previousRent: number, 
  percent: number = 5
): { increaseAmount: number; newRent: number } {
  const rawIncrease = previousRent * (percent / 100);
  const increaseAmount = Math.round(rawIncrease);
  const newRent = Math.round(previousRent + rawIncrease);
  return { increaseAmount, newRent };
}

export async function applyAnnualRentIncrease(
  renterId: string,
  increasePercent: number,
  effectiveDate: string,
  operatorName: string = 'Building Owner'
): Promise<RentHistoryRecord> {
  const renterRef = doc(db, 'renters', renterId);
  const renterSnap = await getDoc(renterRef);
  if (!renterSnap.exists()) throw new Error('Renter record not found');
  const renter = renterSnap.data();

  const previousRent = renter.monthlyRent || renter.baseRent || 5000;
  const { increaseAmount, newRent } = calculateAnnualRentIncrease(previousRent, increasePercent);

  const recordId = `rent_inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: RentHistoryRecord = {
    id: recordId,
    buildingId: BUILDING_ID,
    renterId,
    renterName: renter.fullName,
    effectiveDate,
    previousRent,
    increasePercent,
    increaseAmount,
    newRent,
    createdAt: new Date().toISOString()
  };

  // 1. Store rent history record
  await setDoc(doc(db, 'rent_history', recordId), sanitizeForFirestore(record));

  // 2. Update renter's active monthly rent and record increase date
  await updateDoc(renterRef, {
    monthlyRent: newRent,
    annualIncreasePercent: increasePercent,
    lastAnnualIncreaseDate: effectiveDate,
    updatedAt: new Date().toISOString()
  });

  // 3. Log audit activity
  await logActivity(
    'RENT_INCREASE_APPLIED',
    `Applied annual rent increase of ${increasePercent}% for ${renter.fullName}. Rent increased from ₹${previousRent.toLocaleString('en-IN')} to ₹${newRent.toLocaleString('en-IN')}`,
    'renter',
    renterId,
    operatorName
  );

  return record;
}

export function subscribeRentHistory(
  renterId: string | null, 
  callback: (records: RentHistoryRecord[]) => void
) {
  const colRef = collection(db, 'rent_history');
  const q = renterId 
    ? query(colRef, where('renterId', '==', renterId))
    : query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as RentHistoryRecord);
    list.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    callback(list);
  }, (err) => {
    console.warn('Rent history subscription error:', err);
    callback([]);
  });
}

// ==================== 5. BACK DUES CALCULATION ====================

export async function calculateBackDues(renterId: string): Promise<number> {
  try {
    const colRef = collection(db, 'bills');
    const q = query(
      colRef,
      where('renterId', '==', renterId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return 0;

    let totalBackDues = 0;
    snap.docs.forEach(d => {
      const b = d.data() as Bill;
      // Only count non-cancelled bills with remaining unpaid amounts
      if (b.status !== 'cancelled' && (b.remainingAmount || 0) > 0) {
        totalBackDues += Number(b.remainingAmount || 0);
      }
    });

    return Math.round(totalBackDues);
  } catch (err) {
    console.error('Error calculating back dues:', err);
    return 0;
  }
}

// ==================== 6. MONTHLY BILL GENERATION & ACTIONS ====================

export async function generateMonthlyBill(
  data: {
    renterId: string;
    renterName: string;
    renterPhone?: string;
    roomId: string;
    roomNumber: number;
    billingPeriod: string; // e.g. "October 2026"
    billDate: string; // YYYY-MM-DD
    dueDate: string; // YYYY-MM-DD
    rent: number;
    annualIncreasePercent: number;
    electricityBillingType: ElectricityBillingType;
    meterReadingId?: string | null;
    previousMeterReading?: number;
    presentMeterReading?: number;
    electricityUnits?: number;
    electricityRate?: number;
    electricityAmount?: number;
    waterAmount: number;
    backDues: number;
  },
  operatorName: string = 'Building Owner'
): Promise<string> {
  // Duplicate Bill Protection: check if bill exists for this renter & period
  const colRef = collection(db, 'bills');
  const dupQuery = query(
    colRef,
    where('renterId', '==', data.renterId),
    where('billingPeriod', '==', data.billingPeriod)
  );
  const dupSnap = await getDocs(dupQuery);
  const activeExisting = dupSnap.docs.filter(d => (d.data() as Bill).status !== 'cancelled');
  if (activeExisting.length > 0) {
    throw new Error(`A bill already exists for ${data.renterName} for ${data.billingPeriod}.`);
  }

  // Electricity calculation safety check
  let finalElectricityAmount = 0;
  let finalElectricityUnits = 0;
  let finalElectricityRate = data.electricityRate || 8;

  if (data.electricityBillingType === 'meter_based') {
    finalElectricityUnits = Math.max(0, Number(data.electricityUnits || 0));
    finalElectricityAmount = Math.round(finalElectricityUnits * finalElectricityRate);
  } else {
    // Electricity Included in Rent: strictly zero separate charge
    finalElectricityUnits = 0;
    finalElectricityAmount = 0;
  }

  const subtotal = Math.round(Number(data.rent || 0) + finalElectricityAmount + Number(data.waterAmount || 0));
  const totalAmount = Math.round(subtotal + Number(data.backDues || 0));

  const now = new Date();
  const monthCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const invoiceNumber = `INV-AN-${monthCode}-R${data.roomNumber}-${Math.floor(100 + Math.random() * 900)}`;
  const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newBill: Bill = {
    id: billId,
    buildingId: BUILDING_ID,
    invoiceNumber,
    renterId: data.renterId,
    renterName: data.renterName,
    renterPhone: data.renterPhone,
    roomId: data.roomId,
    roomNumber: data.roomNumber,
    billingPeriod: data.billingPeriod,
    billDate: data.billDate,
    dueDate: data.dueDate,
    rent: Math.round(data.rent),
    annualIncreasePercent: data.annualIncreasePercent || 5,
    electricityBillingType: data.electricityBillingType,
    meterReadingId: data.meterReadingId || null,
    previousMeterReading: data.previousMeterReading,
    presentMeterReading: data.presentMeterReading,
    electricityUnits: finalElectricityUnits,
    electricityRate: finalElectricityRate,
    electricityAmount: finalElectricityAmount,
    waterAmount: Math.round(data.waterAmount),
    backDues: Math.round(data.backDues),
    subtotal,
    totalAmount,
    paidAmount: 0,
    remainingAmount: totalAmount,
    status: 'unpaid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'bills', billId), sanitizeForFirestore(newBill));

  await logActivity(
    'BILL_GENERATED',
    `Generated bill ${invoiceNumber} for ${data.renterName} (Room ${data.roomNumber}) - Total: ₹${totalAmount.toLocaleString('en-IN')} (Rent: ₹${data.rent}, Elec: ₹${finalElectricityAmount}, Water: ₹${data.waterAmount}, Back Dues: ₹${data.backDues})`,
    'bill',
    billId,
    operatorName
  );

  return billId;
}

export async function cancelBill(
  billId: string,
  cancellationReason: string,
  operatorName: string = 'Building Owner'
): Promise<void> {
  const billRef = doc(db, 'bills', billId);
  const snap = await getDoc(billRef);
  if (!snap.exists()) throw new Error('Bill not found');
  const bill = snap.data() as Bill;

  const updates: Partial<Bill> = {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    cancelledBy: operatorName,
    cancellationReason: cancellationReason || 'Cancelled by building management',
    updatedAt: new Date().toISOString()
  };

  await updateDoc(billRef, sanitizeForFirestore(updates));

  await logActivity(
    'BILL_CANCELLED',
    `Cancelled bill ${bill.invoiceNumber} for ${bill.renterName} (Room ${bill.roomNumber}). Reason: "${cancellationReason}"`,
    'bill',
    billId,
    operatorName
  );
}

export async function correctBill(
  billId: string,
  updates: {
    rent?: number;
    electricityAmount?: number;
    waterAmount?: number;
    backDues?: number;
    reason: string;
  },
  operatorName: string = 'Building Owner'
): Promise<void> {
  const billRef = doc(db, 'bills', billId);
  const snap = await getDoc(billRef);
  if (!snap.exists()) throw new Error('Bill not found');
  const oldBill = snap.data() as Bill;

  const newRent = updates.rent !== undefined ? Math.round(updates.rent) : oldBill.rent;
  const newElec = updates.electricityAmount !== undefined ? Math.round(updates.electricityAmount) : oldBill.electricityAmount;
  const newWater = updates.waterAmount !== undefined ? Math.round(updates.waterAmount) : oldBill.waterAmount;
  const newBackDues = updates.backDues !== undefined ? Math.round(updates.backDues) : oldBill.backDues;

  const newSubtotal = newRent + newElec + newWater;
  const newTotal = newSubtotal + newBackDues;
  const newRemaining = Math.max(0, newTotal - (oldBill.paidAmount || 0));
  const newStatus = newRemaining === 0 ? 'paid' : (oldBill.paidAmount > 0 ? 'partially_paid' : 'unpaid');

  const correctionEntry: BillCorrection = {
    timestamp: new Date().toISOString(),
    changedBy: operatorName,
    reason: updates.reason || 'Financial correction applied by owner',
    oldValues: {
      rent: oldBill.rent,
      electricityAmount: oldBill.electricityAmount,
      waterAmount: oldBill.waterAmount,
      backDues: oldBill.backDues,
      totalAmount: oldBill.totalAmount
    },
    newValues: {
      rent: newRent,
      electricityAmount: newElec,
      waterAmount: newWater,
      backDues: newBackDues,
      totalAmount: newTotal
    }
  };

  const correctionsList = oldBill.corrections ? [...oldBill.corrections, correctionEntry] : [correctionEntry];

  await updateDoc(billRef, sanitizeForFirestore({
    rent: newRent,
    electricityAmount: newElec,
    waterAmount: newWater,
    backDues: newBackDues,
    subtotal: newSubtotal,
    totalAmount: newTotal,
    remainingAmount: newRemaining,
    status: newStatus,
    corrections: correctionsList,
    updatedAt: new Date().toISOString()
  }));

  await logActivity(
    'BILL_CORRECTED',
    `Corrected bill ${oldBill.invoiceNumber} for ${oldBill.renterName}. Total adjusted from ₹${oldBill.totalAmount} to ₹${newTotal}. Reason: "${updates.reason}"`,
    'bill',
    billId,
    operatorName
  );
}

// ==================== 7. PAYMENTS, PARTIAL PAYMENTS & RECEIPTS ====================

export async function recordPayment(
  params: {
    billId: string;
    renterId: string;
    renterName: string;
    roomId: string;
    roomNumber: number;
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
    upiRef?: string;
    notes?: string;
  },
  isOwnerCash: boolean = false,
  operatorName: string = 'Resident'
): Promise<string> {
  const billRef = doc(db, 'bills', params.billId);
  const billSnap = await getDoc(billRef);
  if (!billSnap.exists()) throw new Error('Target bill not found');
  const bill = billSnap.data() as Bill;

  const paymentAmount = Math.round(Number(params.amount));
  if (paymentAmount <= 0) throw new Error('Payment amount must be greater than ₹0');

  const now = new Date();
  const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const receiptId = `AMIT-${params.roomNumber}-${dateCode}-${Math.floor(100 + Math.random() * 900)}`;
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Rule 30: If resident pays online via UPI/QR, status is 'pending_verification' until Owner verifies!
  // If owner marks Cash in person, status is 'verified' immediately.
  const isVerified = isOwnerCash;
  const status = isVerified ? 'verified' : 'pending_verification';

  const newPaidAmount = (bill.paidAmount || 0) + (isVerified ? paymentAmount : 0);
  const remainingDueAfterPayment = Math.max(0, bill.totalAmount - newPaidAmount);

  const paymentRecord: Payment = {
    id: paymentId,
    receiptId,
    buildingId: BUILDING_ID,
    billId: params.billId,
    renterId: params.renterId,
    renterName: params.renterName,
    roomId: params.roomId,
    roomNumber: params.roomNumber,
    amount: paymentAmount,
    method: params.method,
    status,
    transactionId: params.transactionId || params.upiRef || '',
    upiRef: params.upiRef || '',
    notes: params.notes || '',
    remainingDueAfterPayment,
    paidAt: new Date().toISOString(),
    verifiedAt: isVerified ? new Date().toISOString() : null,
    verifiedBy: isVerified ? operatorName : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'payments', paymentId), sanitizeForFirestore(paymentRecord));

  // If verified immediately (Cash by owner), update the bill status & amounts
  if (isVerified) {
    const newStatus = remainingDueAfterPayment === 0 ? 'paid' : 'partially_paid';
    await updateDoc(billRef, {
      paidAmount: newPaidAmount,
      remainingAmount: remainingDueAfterPayment,
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date().toISOString() : (bill.paidAt || null),
      paymentMode: params.method,
      updatedAt: new Date().toISOString()
    });

    await logActivity(
      'CASH_PAYMENT_RECORDED',
      `Recorded Cash Payment of ₹${paymentAmount.toLocaleString('en-IN')} for ${params.renterName} (Room ${params.roomNumber}) on bill ${bill.invoiceNumber}. Remaining due: ₹${remainingDueAfterPayment.toLocaleString('en-IN')}`,
      'payment',
      paymentId,
      operatorName
    );
  } else {
    // Online UPI payment submitted by resident -> logged as pending verification
    await logActivity(
      'PAYMENT_CREATED',
      `Renter ${params.renterName} submitted UPI/QR payment of ₹${paymentAmount.toLocaleString('en-IN')} (Ref: ${params.transactionId || 'None'}). Verification Pending.`,
      'payment',
      paymentId,
      params.renterName
    );
  }

  return paymentId;
}

export async function verifyPayment(
  paymentId: string,
  operatorName: string = 'Building Owner'
): Promise<void> {
  const payRef = doc(db, 'payments', paymentId);
  const paySnap = await getDoc(payRef);
  if (!paySnap.exists()) throw new Error('Payment not found');
  const payment = paySnap.data() as Payment;

  if (payment.status === 'verified') {
    return; // already verified
  }

  const billRef = doc(db, 'bills', payment.billId);
  const billSnap = await getDoc(billRef);
  if (!billSnap.exists()) throw new Error('Associated bill not found');
  const bill = billSnap.data() as Bill;

  const newPaidAmount = (bill.paidAmount || 0) + payment.amount;
  const newRemaining = Math.max(0, bill.totalAmount - newPaidAmount);
  const newStatus = newRemaining === 0 ? 'paid' : 'partially_paid';

  // 1. Update Payment status
  await updateDoc(payRef, {
    status: 'verified',
    verifiedAt: new Date().toISOString(),
    verifiedBy: operatorName,
    remainingDueAfterPayment: newRemaining,
    updatedAt: new Date().toISOString()
  });

  // 2. Update Bill document
  await updateDoc(billRef, {
    paidAmount: newPaidAmount,
    remainingAmount: newRemaining,
    status: newStatus,
    paidAt: newStatus === 'paid' ? new Date().toISOString() : (bill.paidAt || null),
    paymentMode: payment.method,
    updatedAt: new Date().toISOString()
  });

  // 3. Log Activity
  await logActivity(
    'PAYMENT_VERIFIED',
    `Verified ${payment.method} payment of ₹${payment.amount.toLocaleString('en-IN')} for ${payment.renterName} (Room ${payment.roomNumber}). Receipt: ${payment.receiptId}. Remaining Due: ₹${newRemaining.toLocaleString('en-IN')}`,
    'payment',
    paymentId,
    operatorName
  );
}

export async function rejectPayment(
  paymentId: string,
  reason: string,
  operatorName: string = 'Building Owner'
): Promise<void> {
  const payRef = doc(db, 'payments', paymentId);
  const paySnap = await getDoc(payRef);
  if (!paySnap.exists()) throw new Error('Payment not found');
  const payment = paySnap.data() as Payment;

  await updateDoc(payRef, {
    status: 'rejected',
    notes: reason ? `${payment.notes ? payment.notes + ' | ' : ''}Rejected: ${reason}` : payment.notes,
    updatedAt: new Date().toISOString()
  });

  await logActivity(
    'PAYMENT_REJECTED',
    `Rejected payment of ₹${payment.amount} for ${payment.renterName}. Reason: "${reason}"`,
    'payment',
    paymentId,
    operatorName
  );
}

export function subscribePayments(callback: (payments: Payment[]) => void) {
  const colRef = collection(db, 'payments');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as Payment);
    callback(list);
  }, (err) => {
    console.warn('Payments subscription error:', err);
    callback([]);
  });
}

export function subscribeRenterPayments(
  renterId: string, 
  callback: (payments: Payment[]) => void
) {
  const colRef = collection(db, 'payments');
  const q = query(colRef, where('renterId', '==', renterId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data() as Payment);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (err) => {
    console.warn('Renter payments subscription error:', err);
    callback([]);
  });
}
