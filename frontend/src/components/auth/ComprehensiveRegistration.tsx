import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Lock, 
  User, 
  Mail, 
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  FileText,
  Users
} from 'lucide-react';

interface ComprehensiveRegistrationProps {
  role: 'client' | 'staff' | 'admin' | 'ero';
  onSuccess: (user: any) => void;
}

interface RegistrationData {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  
  // Personal Identifiers
  ssn: string;
  dateOfBirth: string;
  mothersMaidenName: string;
  occupation: string;
  
  // Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // ID Verification
  idType: 'drivers_license' | 'state_id' | 'passport';
  idState: string;
  idNumber: string;
  idIssueDate: string;
  idExpirationDate: string;
  
  // Filing Status (for clients)
  filingStatus: string;
  
  // Staff Info (for staff/ERO/admin)
  staffRole?: string;
  ptinNumber?: string;
  hireDate?: string;
  department?: string;
}

export const ComprehensiveRegistration: React.FC<ComprehensiveRegistrationProps> = ({ role, onSuccess }) => {
  const [step, setStep] = useState(1);
  const totalSteps = role === 'client' ? 5 : 4;
  
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    ssn: '',
    dateOfBirth: '',
    mothersMaidenName: '',
    occupation: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    idType: 'drivers_license',
    idState: '',
    idNumber: '',
    idIssueDate: '',
    idExpirationDate: '',
    filingStatus: '',
    staffRole: role === 'client' ? undefined : role,
    ptinNumber: '',
    hireDate: '',
    department: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Validation per step
  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'First name required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name required';
      if (!formData.email.includes('@')) errors.email = 'Valid email required';
      if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) errors.phone = 'Valid 10-digit phone required';
      if (formData.password.length < 12) errors.password = 'Password must be at least 12 characters';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords must match';
    }
    
    if (step === 2) {
      if (!/^\d{9}$/.test(formData.ssn.replace(/-/g, ''))) errors.ssn = 'Valid SSN required (9 digits)';
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth required';
      if (!formData.mothersMaidenName.trim()) errors.mothersMaidenName = 'Mother\'s maiden name required';
      if (!formData.occupation.trim()) errors.occupation = 'Occupation required';
    }
    
    if (step === 3) {
      if (!formData.streetAddress.trim()) errors.streetAddress = 'Street address required';
      if (!formData.city.trim()) errors.city = 'City required';
      if (!formData.state) errors.state = 'State required';
      if (!/^\d{5}$/.test(formData.zipCode)) errors.zipCode = 'Valid 5-digit ZIP required';
    }
    
    if (step === 4) {
      if (!formData.idState) errors.idState = 'ID state required';
      if (!formData.idNumber.trim()) errors.idNumber = 'ID number required';
      if (!formData.idIssueDate) errors.idIssueDate = 'Issue date required';
      if (!formData.idExpirationDate) errors.idExpirationDate = 'Expiration date required';
    }
    
    return errors;
  }, [formData, step]);

  const isStepValid = Object.keys(validation).length === 0;

  // Calculate password strength
  React.useEffect(() => {
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

  const handleNext = () => {
    if (isStepValid && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setStatus({ loading: true, error: '', success: '' });
    
    try {
      // Register based on role
      const endpoint = role === 'client' 
        ? '/register/client' 
        : '/register/staff';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: role === 'client' ? 'client' : formData.staffRole
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      
      const result = await response.json();
      
      setStatus({ loading: false, error: '', success: 'Registration successful! Redirecting...' });
      
      setTimeout(() => {
        onSuccess(result.user);
      }, 1500);
      
    } catch (error: any) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-2xl">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {role === 'client' ? 'Client Registration' : `${role.toUpperCase()} Staff Registration`}
          </h1>
          <p className="text-white/80">
            Secure account creation with encrypted identity verification
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                    ${step > idx + 1 ? 'bg-green-500 text-white' : ''}
                    ${step === idx + 1 ? 'bg-white text-blue-600 scale-110' : ''}
                    ${step < idx + 1 ? 'bg-white/30 text-white/50' : ''}
                  `}>
                    {step > idx + 1 ? <CheckCircle className="w-6 h-6" /> : idx + 1}
                  </div>
                  <span className="text-xs text-white mt-1">
                    Step {idx + 1}
                  </span>
                </div>
                {idx < totalSteps - 1 && (
                  <div className={`
                    flex-1 h-1 mx-2 rounded transition-all
                    ${step > idx + 1 ? 'bg-green-500' : 'bg-white/30'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.firstName ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                    placeholder="John"
                  />
                  {validation.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validation.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.lastName ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                    placeholder="Doe"
                  />
                  {validation.lastName && (
                    <p className="mt-1 text-sm text-red-600">{validation.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`
                      w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                    placeholder="john.doe@email.com"
                  />
                </div>
                {validation.email && (
                  <p className="mt-1 text-sm text-red-600">{validation.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`
                      w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                    placeholder="(512) 555-0100"
                  />
                </div>
                {validation.phone && (
                  <p className="mt-1 text-sm text-red-600">{validation.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password (minimum 12 characters) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`
                      w-full pl-11 pr-12 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
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
                  </div>
                )}
                {validation.password && (
                  <p className="mt-1 text-sm text-red-600">{validation.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${validation.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  `}
                  placeholder="••••••••••••"
                />
                {validation.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{validation.confirmPassword}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Personal Identifiers */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Personal Identifiers</h2>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    All personal information is encrypted with 256-bit AES encryption and stored securely in compliance with IRS Publication 1075.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Social Security Number *
                </label>
                <input
                  type="text"
                  value={formData.ssn}
                  onChange={e => setFormData(prev => ({ ...prev, ssn: e.target.value }))}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${validation.ssn ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  `}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                />
                {validation.ssn && (
                  <p className="mt-1 text-sm text-red-600">{validation.ssn}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className={`
                      w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                  />
                </div>
                {validation.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{validation.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mother's Maiden Name *
                </label>
                <input
                  type="text"
                  value={formData.mothersMaidenName}
                  onChange={e => setFormData(prev => ({ ...prev, mothersMaidenName: e.target.value }))}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${validation.mothersMaidenName ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  `}
                  placeholder="Security verification"
                />
                {validation.mothersMaidenName && (
                  <p className="mt-1 text-sm text-red-600">{validation.mothersMaidenName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Occupation *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={e => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                    className={`
                      w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.occupation ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                {validation.occupation && (
                  <p className="mt-1 text-sm text-red-600">{validation.occupation}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Address Information</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={e => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${validation.streetAddress ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  `}
                  placeholder="123 Main St"
                />
                {validation.streetAddress && (
                  <p className="mt-1 text-sm text-red-600">{validation.streetAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.city ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                    placeholder="Killeen"
                  />
                  {validation.city && (
                    <p className="mt-1 text-sm text-red-600">{validation.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    value={formData.state}
                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.state ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                  >
                    <option value="">Select State</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {validation.state && (
                    <p className="mt-1 text-sm text-red-600">{validation.state}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={e => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  className={`
                    w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${validation.zipCode ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  `}
                  placeholder="76549"
                  maxLength={5}
                />
                {validation.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{validation.zipCode}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: ID Verification */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">ID Verification</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Type *
                </label>
                <select
                  value={formData.idType}
                  onChange={e => setFormData(prev => ({ ...prev, idType: e.target.value as any }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="drivers_license">Driver's License</option>
                  <option value="state_id">State ID</option>
                  <option value="passport">Passport</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID State *
                  </label>
                  <select
                    value={formData.idState}
                    onChange={e => setFormData(prev => ({ ...prev, idState: e.target.value }))}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.idState ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                  >
                    <option value="">Select State</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {validation.idState && (
                    <p className="mt-1 text-sm text-red-600">{validation.idState}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={e => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.idNumber ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                    placeholder="DL/ID Number"
                  />
                  {validation.idNumber && (
                    <p className="mt-1 text-sm text-red-600">{validation.idNumber}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={formData.idIssueDate}
                    onChange={e => setFormData(prev => ({ ...prev, idIssueDate: e.target.value }))}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.idIssueDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                  />
                  {validation.idIssueDate && (
                    <p className="mt-1 text-sm text-red-600">{validation.idIssueDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    value={formData.idExpirationDate}
                    onChange={e => setFormData(prev => ({ ...prev, idExpirationDate: e.target.value }))}
                    className={`
                      w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${validation.idExpirationDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    `}
                  />
                  {validation.idExpirationDate && (
                    <p className="mt-1 text-sm text-red-600">{validation.idExpirationDate}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Filing Status (Clients Only) */}
          {step === 5 && role === 'client' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Filing Status</h2>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  Your filing status will be determined by the wizard based on IRS requirements. This is a preliminary selection.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { value: 'single', label: 'Single', desc: 'Unmarried, legally separated, or divorced' },
                  { value: 'married_joint', label: 'Married Filing Jointly', desc: 'Married and filing together' },
                  { value: 'married_separate', label: 'Married Filing Separately', desc: 'Married but filing separate returns' },
                  { value: 'head_of_household', label: 'Head of Household', desc: 'Unmarried and paid > 50% household costs' },
                  { value: 'qualifying_widow', label: 'Qualifying Surviving Spouse', desc: 'Spouse died within 2 tax years' }
                ].map(status => (
                  <label
                    key={status.value}
                    className={`
                      block p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${formData.filingStatus === status.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="filingStatus"
                      value={status.value}
                      checked={formData.filingStatus === status.value}
                      onChange={e => setFormData(prev => ({ ...prev, filingStatus: e.target.value }))}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                        ${formData.filingStatus === status.value 
                          ? 'border-blue-600 bg-blue-600' 
                          : 'border-gray-300'
                        }
                      `}>
                        {formData.filingStatus === status.value && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{status.label}</p>
                        <p className="text-sm text-gray-600">{status.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {status.error && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">{status.error}</p>
            </div>
          )}

          {status.success && (
            <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-900">{status.success}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t-2 border-gray-100">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={status.loading || !isStepValid}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status.loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Complete Registration'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4 text-white text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4" />
            <span className="font-semibold">Security & Privacy:</span>
          </div>
          <ul className="space-y-1 ml-6 text-white/80 text-xs">
            <li>• All data encrypted with 256-bit AES encryption</li>
            <li>• IRS Publication 1075 compliant storage</li>
            <li>• Two-factor authentication required</li>
            <li>• Passkey protection for account access</li>
            <li>• Identity verification via government-issued ID</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveRegistration;
