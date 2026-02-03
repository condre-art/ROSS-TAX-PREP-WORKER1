import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  Mail, 
  Smartphone,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
// Encryption utilities available if needed
// import { encryptPII } from '../utils/encryption';

interface SecureLoginProps {
  onLoginSuccess: (user: any) => void;
}

export const SecureLogin: React.FC<SecureLoginProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | '2fa'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    mfaCode: '',
    mfaMethod: 'email' as 'email' | 'sms' | 'totp'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const [mfaSetup, setMfaSetup] = useState<any>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Password strength calculator
  useEffect(() => {
    const calculateStrength = (pass: string) => {
      let strength = 0;
      if (pass.length >= 12) strength += 25;
      if (pass.length >= 16) strength += 25;
      if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength += 20;
      if (/[0-9]/.test(pass)) strength += 15;
      if (/[^a-zA-Z0-9]/.test(pass)) strength += 15;
      return Math.min(strength, 100);
    };
    
    setPasswordStrength(calculateStrength(formData.password));
  }, [formData.password]);

  const handleLogin = async () => {
    setStatus({ loading: true, error: '', success: '' });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }
      
      // Check if 2FA is enabled
      if (result.requires_mfa) {
        setMfaSetup(result.mfa_setup);
        setMode('2fa');
        setStatus({ loading: false, error: '', success: 'Please enter your 2FA code' });
      } else {
        localStorage.setItem('token', result.token);
        setStatus({ loading: false, error: '', success: 'Login successful!' });
        setTimeout(() => onLoginSuccess(result.user), 500);
      }
      
    } catch (error: any) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      setStatus({ loading: false, error: 'Passwords do not match', success: '' });
      return;
    }
    
    if (passwordStrength < 60) {
      setStatus({ loading: false, error: 'Password is too weak. Use at least 12 characters with uppercase, lowercase, numbers, and symbols.', success: '' });
      return;
    }
    
    setStatus({ loading: true, error: '', success: '' });
    
    try {
      const response = await fetch('/register/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }
      
      setStatus({ loading: false, error: '', success: 'Account created! Please log in.' });
      setTimeout(() => setMode('login'), 1500);
      
    } catch (error: any) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  const handleVerify2FA = async () => {
    setStatus({ loading: true, error: '', success: '' });
    
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.mfaCode,
          method: formData.mfaMethod
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '2FA verification failed');
      }
      
      localStorage.setItem('token', result.token);
      setStatus({ loading: false, error: '', success: 'Verified! Welcome back.' });
      setTimeout(() => onLoginSuccess(result.user), 500);
      
    } catch (error: any) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  const handleResend2FA = async () => {
    setStatus({ loading: true, error: '', success: '' });
    
    try {
      const response = await fetch('/api/auth/mfa/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          method: formData.mfaMethod
        })
      });
      
      if (!response.ok) throw new Error('Failed to resend code');
      
      setStatus({ loading: false, error: '', success: 'New code sent!' });
      
    } catch (error: any) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Security Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-2xl">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Ross Tax Prep Portal
          </h1>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2">
            <Lock className="w-4 h-4 text-white" />
            <span className="text-sm text-white font-semibold">
              256-bit Encrypted • 2FA Protected
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {mode === 'login' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {status.error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{status.error}</p>
                  </div>
                )}

                {status.success && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">{status.success}</p>
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={status.loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  {status.loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="text-center pt-4">
                  <button
                    onClick={() => setMode('register')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Don't have an account? Create one
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'register' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(512) 555-0100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password (minimum 12 characters)
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••••••"
                  />
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              passwordStrength < 40 ? 'bg-red-500' :
                              passwordStrength < 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">
                          {passwordStrength < 40 ? 'Weak' :
                           passwordStrength < 70 ? 'Good' :
                           'Strong'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Use uppercase, lowercase, numbers, and symbols for a strong password
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••••••"
                  />
                </div>

                {status.error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{status.error}</p>
                  </div>
                )}

                {status.success && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">{status.success}</p>
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={status.loading}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  {status.loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <div className="text-center pt-4">
                  <button
                    onClick={() => setMode('login')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === '2fa' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
              <p className="text-gray-600 mb-6">
                Enter the verification code sent to your {formData.mfaMethod}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.mfaCode}
                      onChange={e => setFormData(prev => ({ ...prev, mfaCode: e.target.value }))}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-wider"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                </div>

                {status.error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{status.error}</p>
                  </div>
                )}

                {status.success && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">{status.success}</p>
                  </div>
                )}

                <button
                  onClick={handleVerify2FA}
                  disabled={status.loading || formData.mfaCode.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  {status.loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify'
                  )}
                </button>

                <button
                  onClick={handleResend2FA}
                  disabled={status.loading}
                  className="w-full py-2 text-blue-600 hover:text-blue-700 font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend Code
                </button>

                <div className="text-center pt-4">
                  <button
                    onClick={() => setMode('login')}
                    className="text-gray-600 hover:text-gray-700 font-semibold"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Security Features */}
        <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4 text-white text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4" />
            <span className="font-semibold">Your data is protected by:</span>
          </div>
          <ul className="space-y-1 ml-6 text-white/80">
            <li>• 256-bit AES encryption for all sensitive data</li>
            <li>• Two-factor authentication (2FA)</li>
            <li>• Secure password hashing (bcrypt)</li>
            <li>• HTTPS/TLS encryption in transit</li>
            <li>• IRS Publication 1075 compliant</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SecureLogin;
