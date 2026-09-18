import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile, UserRole, Renter, PERMANENT_OWNER_EMAIL, isOwnerEmail } from '../types';
import { checkAndSeedRooms, subscribeRenters, submitRenterSignup, BUILDING_ID, sanitizeForFirestore } from '../services/db';

export interface RenterSignupInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  govIdType: Renter['govIdType'];
  govIdNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  permanentAddress: string;
  occupation: string;
  workplace: string;
}

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  renterRecord: Renter | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerOwnerAccount: (password: string) => Promise<void>;
  registerRenterAccount: (data: RenterSignupInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('renter');
  const [renterRecord, setRenterRecord] = useState<Renter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allRenters, setAllRenters] = useState<Renter[]>([]);

  // Keep renters in sync for finding assigned renter records
  useEffect(() => {
    const unsub = subscribeRenters((renters) => {
      setAllRenters(renters);
    });
    return () => unsub();
  }, []);

  // Check and seed initial 15 rooms on first launch
  useEffect(() => {
    checkAndSeedRooms().catch((err) => {
      console.warn('Initial room seed check:', err);
    });
  }, []);

  const syncUserProfile = async (user: User) => {
    const userEmail = (user.email || '').toLowerCase().trim();
    const isOwner = isOwnerEmail(userEmail);

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let renterId: string | null = null;

      if (!isOwner) {
        // Check if renter record exists with this email or userId
        const rentersRef = collection(db, 'renters');
        const q = query(rentersRef, where('email', '==', userEmail));
        const snap = await getDocs(q);

        if (!snap.empty) {
          renterId = snap.docs[0].id;
          const existingData = snap.docs[0].data() as Renter;
          if (!existingData.userId) {
            await setDoc(doc(db, 'renters', renterId), { userId: user.uid }, { merge: true });
          }
        } else {
          // Initialize a pending applicant record for new resident sign in
          renterId = `renter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newRenter: Renter = {
            id: renterId,
            fullName: user.displayName || userEmail.split('@')[0] || 'Resident Applicant',
            phone: user.phoneNumber || '',
            email: userEmail,
            govIdType: 'Aadhaar Card',
            govIdNumber: 'Pending KYC Verification',
            emergencyContactName: '',
            emergencyContactPhone: '',
            emergencyContactRelation: '',
            permanentAddress: 'Registered via Google Sign-In',
            occupation: 'Resident',
            workplace: 'Not specified',
            buildingId: BUILDING_ID,
            userId: user.uid,
            roomId: null,
            roomNumber: null,
            monthlyRent: 0,
            securityDeposit: 0,
            leaseStartDate: new Date().toISOString().split('T')[0],
            status: 'pending_approval',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'renters', renterId), sanitizeForFirestore(newRenter));
        }
      }

      const assignedRole: UserRole = isOwner ? 'owner' : 'renter';

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        const finalRenterId = renterId || data.renterId || null;

        const updatedProfile: Record<string, any> = {
          uid: user.uid,
          email: userEmail,
          name: data.name || (isOwner ? 'Amit Niwas Owner' : (user.displayName || userEmail.split('@')[0] || 'Resident Applicant')),
          role: assignedRole,
          approvalStatus: isOwner ? 'approved' : (data.approvalStatus || 'pending'),
          createdAt: data.createdAt || new Date().toISOString()
        };

        if (finalRenterId) {
          updatedProfile.renterId = finalRenterId;
        }
        if (data.phone || user.phoneNumber) {
          updatedProfile.phone = data.phone || user.phoneNumber;
        }

        await setDoc(userRef, sanitizeForFirestore(updatedProfile), { merge: true });
        setProfile(updatedProfile as UserProfile);
        setRole(assignedRole);
      } else {
        const newProfile: Record<string, any> = {
          uid: user.uid,
          email: userEmail,
          name: isOwner ? 'Amit Niwas Owner' : (user.displayName || userEmail.split('@')[0] || 'Resident Applicant'),
          role: assignedRole,
          approvalStatus: isOwner ? 'approved' : 'pending',
          createdAt: new Date().toISOString()
        };

        if (renterId) {
          newProfile.renterId = renterId;
        }
        if (user.phoneNumber) {
          newProfile.phone = user.phoneNumber;
        }

        await setDoc(userRef, sanitizeForFirestore(newProfile));
        setProfile(newProfile as UserProfile);
        setRole(assignedRole);
      }
    } catch (err) {
      console.error('Error syncing user profile:', err);
      const assignedRole: UserRole = isOwner ? 'owner' : 'renter';
      setProfile({
        uid: user.uid,
        email: user.email || '',
        name: isOwner ? 'Amit Niwas Owner' : 'Resident Applicant',
        role: assignedRole,
        approvalStatus: isOwner ? 'approved' : 'pending'
      });
      setRole(assignedRole);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        setProfile(null);
        setRole('renter');
        setRenterRecord(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update associated renter record when profile or renters list changes
  useEffect(() => {
    if (role === 'renter') {
      if (profile?.renterId) {
        const found = allRenters.find(r => r.id === profile.renterId);
        if (found) {
          setRenterRecord(found);
          return;
        }
      }
      // If email matches
      if (profile?.email) {
        const found = allRenters.find(r => r.email.toLowerCase() === profile.email.toLowerCase());
        if (found) {
          setRenterRecord(found);
          return;
        }
      }
      setRenterRecord(null);
    } else {
      setRenterRecord(null);
    }
  }, [role, profile, allRenters]);

  const refreshAuthData = async () => {
    if (auth.currentUser) {
      await syncUserProfile(auth.currentUser);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const isOwner = isOwnerEmail(cleanEmail);

    try {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        await syncUserProfile(cred.user);
      } catch (signErr: any) {
        // If permanent owner tries to sign in but account isn't created in Firebase Auth yet, auto-register
        if (isOwner && (signErr.code === 'auth/user-not-found' || signErr.code === 'auth/invalid-credential')) {
          const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          await syncUserProfile(newCred.user);
        } else {
          throw signErr;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        await syncUserProfile(cred.user);
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerOwnerAccount = async (password: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, PERMANENT_OWNER_EMAIL, password);
      await syncUserProfile(cred.user);
    } finally {
      setLoading(false);
    }
  };

  const registerRenterAccount = async (data: RenterSignupInput) => {
    setLoading(true);
    try {
      const cleanEmail = data.email.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      
      // Create pending renter record and profile
      const renterId = await submitRenterSignup({
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: cleanEmail,
        govIdType: data.govIdType,
        govIdNumber: data.govIdNumber.trim(),
        emergencyContactName: data.emergencyContactName.trim(),
        emergencyContactPhone: data.emergencyContactPhone.trim(),
        emergencyContactRelation: data.emergencyContactRelation.trim(),
        permanentAddress: data.permanentAddress.trim(),
        occupation: data.occupation.trim() || 'Resident',
        workplace: data.workplace.trim() || 'City Center',
        userId: cred.user.uid
      });

      const userProfile: UserProfile = {
        uid: cred.user.uid,
        email: cleanEmail,
        name: data.fullName.trim(),
        role: 'renter',
        phone: data.phone.trim(),
        renterId,
        approvalStatus: 'pending',
        createdAt: new Date().toISOString()
      };

      setProfile(userProfile);
      setRole('renter');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (currentUser) {
        await fbSignOut(auth);
      }
      setCurrentUser(null);
      setProfile(null);
      setRole('renter');
      setRenterRecord(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        role,
        loading,
        renterRecord,
        loginWithEmail,
        loginWithGoogle,
        registerOwnerAccount,
        registerRenterAccount,
        logout,
        refreshAuthData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
