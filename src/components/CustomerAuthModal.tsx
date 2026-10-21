import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, MapPin, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import CowMascot from './CowMascot.tsx';

export default function CustomerAuthModal() {
  const {
    isAuthModalOpen,
    closeCustomerAuthModal,
    authModalMode,
    setAuthModalMode,
    loginCustomer,
    registerCustomer,
    cart,
  } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [pincode, setPincode] = useState('302001');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your email or phone number and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await loginCustomer(email.trim(), password.trim());
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials. Please verify and try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Delivery address is required for morning milk delivery.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerCustomer({
      name: name.trim(),
      email: email.trim(),
      phone: cleanPhone,
      password: password.trim(),
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
    });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Registration failed. Please check inputs and try again.');
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customer/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (res.ok && data.success) {
        setResetStep('verify');
        setResetMessage(`Verification code sent! For this development store, your code is: ${data.demoCode || '123456'}`);
      } else {
        setErrorMessage(data.error || 'Failed to request password reset.');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Network error during password reset.');
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetCode.trim()) {
      setErrorMessage('Please enter the verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customer/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: resetCode.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (res.ok && data.success) {
        setSuccessMessage('Password reset successfully! Please sign in with your new password.');
        setAuthModalMode('login');
        setPassword('');
      } else {
        setErrorMessage(data.error || 'Invalid code or failed to reset password.');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Network error during password reset.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center gap-4 max-w-3xl w-full justify-center my-auto">
        {/* Subtle looping cow illustration beside the sign-in card */}
        <div className="hidden md:flex flex-col items-center justify-center bg-[#FAFCF7] border border-[#DCE9D5] rounded-3xl p-6 shadow-xl w-64 text-center space-y-4 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-[#EAF4E5] border border-[#DCE9D5] flex items-center justify-center text-xl shadow-2xs">
            🥛
          </div>
          <div className="py-1">
            <CowMascot variant="signin" showGrass={true} showMilkDrop={true} className="w-36" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-[#26352B] font-serif-accent text-sm">Farm-Fresh Purity</h4>
            <p className="text-[11px] text-[#69766B] leading-relaxed">
              Wholesome A2 Gir cow milk & dairy harvested at dawn and delivered before 7:30 AM.
            </p>
          </div>
          <div className="pt-2 border-t border-[#DCE9D5] w-full flex items-center justify-center gap-1.5 text-[10px] text-[#397548] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#397548]"></span>
            <span>100% Cold-Chained Pure</span>
          </div>
        </div>

        {/* Sign-in / Registration Card */}
        <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#DCE9D5] relative animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#DCE9D5] bg-[#FAFCF7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#397548] text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#26352B] text-base font-serif-accent leading-tight">
                {authModalMode === 'login'
                  ? 'Sign In'
                  : authModalMode === 'register'
                  ? 'Create Customer Account'
                  : 'Reset Password'}
              </h3>
              <p className="text-[11px] text-[#69766B]">
                {authModalMode === 'login'
                  ? 'Access your orders & saved delivery addresses'
                  : authModalMode === 'register'
                  ? 'Fresh morning doorstep delivery starts here'
                  : 'Enter your email to recover your account'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CowMascot variant="compact" className="md:hidden" />
            <button
              onClick={closeCustomerAuthModal}
              className="p-1.5 text-stone-400 hover:text-[#26352B] rounded-full hover:bg-[#EAF4E5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart notice if cart has items */}
        {cart.length > 0 && (
          <div className="px-5 py-2.5 bg-[#EAF4E5]/60 border-b border-[#DCE9D5] flex items-center gap-2 text-xs text-[#26352B] font-semibold">
            <ShoppingBag className="w-4 h-4 text-[#397548] shrink-0" />
            <span>
              Your cart has {cart.reduce((sum, i) => sum + i.quantity, 0)} items reserved. Sign in to place your order!
            </span>
          </div>
        )}

        {/* Tab switchers if not in forgot mode */}
        {authModalMode !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-[#DCE9D5] bg-white text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-3 cursor-pointer transition-all border-b-2 ${
                authModalMode === 'login'
                  ? 'border-[#397548] text-[#397548] font-extrabold bg-[#EAF4E5]/40'
                  : 'border-transparent text-[#69766B] hover:text-[#26352B]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-3 cursor-pointer transition-all border-b-2 ${
                authModalMode === 'register'
                  ? 'border-[#397548] text-[#397548] font-extrabold bg-[#EAF4E5]/40'
                  : 'border-transparent text-[#69766B] hover:text-[#26352B]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-[#FAFCF7]">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#26352B] block mb-1">Email Address or Mobile Number *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="name@example.com or 9829012345"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden text-xs"
                  />
                  <Mail className="w-4 h-4 text-[#69766B] absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-[#26352B]">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('forgot');
                      setForgotEmail(email);
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-[#397548] font-bold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden text-xs"
                  />
                  <Lock className="w-4 h-4 text-[#69766B] absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#69766B] hover:text-[#26352B] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#397548] text-white font-bold rounded-xl text-xs hover:bg-[#2E5E3A] transition-colors shadow-md shadow-[#397548]/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-[#69766B]">
                <span>New customer? </span>
                <button
                  type="button"
                  onClick={() => setAuthModalMode('register')}
                  className="text-[#397548] font-bold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTRATION FORM */}
          {authModalMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#26352B] block mb-1">Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Aditi Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden"
                  />
                  <User className="w-4 h-4 text-[#69766B] absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#26352B] block mb-1">Email Address *</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="aditi@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden text-xs"
                    />
                    <Mail className="w-3.5 h-3.5 text-[#69766B] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#26352B] block mb-1">Mobile Number (10 Digits) *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="9829012345"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-8 pr-2 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden font-mono text-xs"
                    />
                    <Phone className="w-3.5 h-3.5 text-[#69766B] absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#26352B] block mb-1">Password (min 6 chars) *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden text-xs"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#69766B] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#26352B] block mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-type password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden text-xs"
                    />
                    <ShieldCheck className="w-3.5 h-3.5 text-[#69766B] absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#26352B] block mb-1">Delivery Address *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="House/Flat number, Building, Street, Area"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden text-xs"
                  />
                  <MapPin className="w-3.5 h-3.5 text-[#69766B] absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#26352B] block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#26352B] block mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={e => setPincode(e.target.value.slice(0, 6))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#397548] text-white font-bold rounded-xl text-xs hover:bg-[#2E5E3A] transition-colors shadow-md shadow-[#397548]/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Create Account & Continue</span>
                  </>
                )}
              </button>

              <div className="text-center text-xs text-[#69766B]">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="text-[#397548] font-bold hover:underline cursor-pointer"
                >
                  Sign In here
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD WORKFLOW */}
          {authModalMode === 'forgot' && (
            <div className="space-y-3.5 text-xs">
              {resetStep === 'request' ? (
                <form onSubmit={handleRequestReset} className="space-y-3">
                  <p className="text-[#69766B] text-xs">
                    Enter the email address registered with your customer account. We will send password reset instructions and a verification code.
                  </p>
                  <div>
                    <label className="font-bold text-[#26352B] block mb-1">Registered Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#397548] text-white font-bold rounded-xl text-xs hover:bg-[#2E5E3A] transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyReset} className="space-y-3">
                  {resetMessage && (
                    <div className="p-2.5 bg-[#EAF4E5] border border-[#DCE9D5] rounded-xl text-[11px] font-bold text-[#397548]">
                      {resetMessage}
                    </div>
                  )}
                  <div>
                    <label className="font-bold text-[#26352B] block mb-1">Verification Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit code (demo: 123456)"
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] font-mono font-bold text-[#26352B] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#26352B] block mb-1">New Password (min 6 chars) *</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] text-[#26352B] outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-[#397548] text-white font-bold rounded-xl text-xs hover:bg-[#2E5E3A] transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Updating...' : 'Set New Password & Sign In'}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setResetStep('request');
                  }}
                  className="text-xs text-[#397548] font-bold hover:underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
