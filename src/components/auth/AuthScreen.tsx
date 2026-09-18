import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  FileBadge,
  MapPin,
  Briefcase,
  Users,
  Clock
} from 'lucide-react';
import { useAuth, RenterSignupInput } from '../../context/AuthContext';
import { PERMANENT_OWNER_EMAIL, Renter, isOwnerEmail } from '../../types';

export const AuthScreen: React.FC = () => {
  const { 
    loginWithEmail, 
    loginWithGoogle,
    registerRenterAccount,
    registerOwnerAccount 
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Renter Registration Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [govIdType, setGovIdType] = useState<Renter['govIdType']>('Aadhaar Card');
  const [govIdNumber, setGovIdNumber] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Parent');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [workplace, setWorkplace] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Browser blocked Google popup. Please allow popups for this site or use email login.');
      } else {
        setErrorMsg(err.message || 'Google sign-in failed. Please try again or use email.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(loginEmail.trim(), loginPassword);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/user-not-found') {
        setErrorMsg('No account found with this email. Please click "Resident Sign Up" first.');
      } else {
        setErrorMsg(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('Email and password are required.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    // If owner email is entered for registration
    if (isOwnerEmail(regEmail)) {
      setSubmitting(true);
      try {
        await registerOwnerAccount(regPassword);
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          // Switch to login
          setLoginEmail(PERMANENT_OWNER_EMAIL);
          setMode('login');
          setErrorMsg('Owner account already exists. Please sign in with your password.');
        } else {
          setErrorMsg(err.message || 'Failed to initialize owner account.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Resident registration validations
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name as per Government ID.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your 10-digit mobile number.');
      return;
    }
    if (!govIdNumber.trim()) {
      setErrorMsg('Please provide your Government ID number.');
      return;
    }
    if (!permanentAddress.trim()) {
      setErrorMsg('Please provide your permanent / native address.');
      return;
    }
    if (!emergencyPhone.trim()) {
      setErrorMsg('Please enter emergency contact phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const renterInput: RenterSignupInput = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: regEmail.trim(),
        password: regPassword,
        govIdType,
        govIdNumber: govIdNumber.trim(),
        emergencyContactName: emergencyName.trim() || 'Parent/Family',
        emergencyContactPhone: emergencyPhone.trim(),
        emergencyContactRelation: emergencyRelation,
        permanentAddress: permanentAddress.trim(),
        occupation: occupation.trim() || 'Private Service',
        workplace: workplace.trim() || 'Not specified'
      };

      await registerRenterAccount(renterInput);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please switch to "Sign In".');
      } else {
        setErrorMsg(err.message || 'Registration failed. Please check your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className={`mx-auto w-full relative z-10 transition-all ${mode === 'register' ? 'max-w-xl' : 'max-w-md'}`}>
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 text-slate-950 font-bold mb-3">
            <Building2 className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white font-sans">
            PREM NIWAS
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Residential Rental Management • Civil Lines Road
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-900 border border-slate-800 py-6 px-6 shadow-2xl rounded-2xl sm:px-8">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl mb-6">
            <button
              id="tab-sign-in"
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-register-renter"
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Resident Sign Up
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= SIGN IN VIEW ================= */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  />
                </div>
              </div>

              <button
                id="submit-sign-in-btn"
                type="submit"
                disabled={submitting || googleLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Or continue with Google */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-slate-900 px-3 text-slate-400 font-medium">or continue with</span>
                </div>
              </div>

              <button
                id="google-sign-in-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || submitting}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-white border border-slate-750 hover:border-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google / Gmail'}</span>
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-400">
                  New resident?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setErrorMsg(''); }}
                    className="text-amber-400 hover:text-amber-300 font-semibold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>

            </form>
          ) : (
            /* ================= RESIDENT SIGN UP VIEW ================= */
            <form onSubmit={handleRegister} className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name (as per Govt ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address (Login ID) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="applicant@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Create Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Govt ID Type *
                  </label>
                  <select
                    value={govIdType}
                    onChange={(e) => setGovIdType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Govt ID Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4892 7102 9841"
                    value={govIdNumber}
                    onChange={(e) => setGovIdNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Occupation / Profession
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer, Student"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Workplace / College
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TCS / Delhi University"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Permanent / Native Address *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="House No, Village/Town, District, State, PIN"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Emergency Contact Details *
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contact Name"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <select
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Friend">Friend</option>
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                disabled={submitting || googleLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{submitting ? 'Registering...' : 'Register Resident Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-slate-900 px-3 text-slate-400 font-medium">or register with</span>
                </div>
              </div>

              <button
                id="google-register-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || submitting}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-white border border-slate-750 hover:border-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Connecting Google Account...' : 'Sign Up with Google / Gmail'}</span>
              </button>

              <p className="text-center text-[11px] text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Sign in here
                </button>
              </p>

            </form>
          )}

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          PREM NIWAS • Residential Building Management
        </p>

      </div>
    </div>
  );
};
