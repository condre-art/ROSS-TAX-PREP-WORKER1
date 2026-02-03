import React, { useState } from 'react';
import { 
  FileText, 
  UserCheck, 
  Shield, 
  Calculator,
  Building2,
  CreditCard,
  Lock,
  Send,
  CheckCircle,
  ArrowRight,
  Zap,
  DollarSign,
  Calendar,
  Users,
  MessageSquare
} from 'lucide-react';

interface TaxServiceLandingProps {
  onSelectService: (service: 'diy' | 'professional' | 'bookkeeping') => void;
}

export const TaxServiceLanding: React.FC<TaxServiceLandingProps> = ({ onSelectService }) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const services = [
    {
      id: 'diy',
      title: 'Start Filing Tax',
      subtitle: 'DIY Tax Preparation Software',
      description: 'IRS MeF integrated e-file platform ready for client and customer usage',
      icon: FileText,
      color: 'blue',
      features: [
        'IRS MeF A2A Integration',
        'E-file Current Year Returns',
        'Real-time IRS Status Updates',
        'Step-by-step Wizard',
        'Automatic Calculations',
        'Bank Product Integration',
        'Direct Deposit Setup',
        'Secure Document Upload'
      ],
      price: 'Starting at $49.99',
      cta: 'Start Filing Now'
    },
    {
      id: 'professional',
      title: 'Get My Return Filed',
      subtitle: 'Professional Tax Preparation',
      description: 'Active EFIN/PTIN preparation with expert tax professionals',
      icon: UserCheck,
      color: 'green',
      features: [
        'All IRS Forms Supported',
        'Current Year + 5 Prior Years',
        'EFIN/PTIN Certified Preparers',
        'Bank Products Integrated',
        'Refund Transfer Options',
        'Direct Deposit Available',
        'Check Printing Service',
        'Expert Tax Review',
        'Amendment Support (1040-X)',
        'Audit Defense Included'
      ],
      price: 'From $150 - Professional Service',
      cta: 'Schedule Appointment'
    },
    {
      id: 'bookkeeping',
      title: 'Business Services',
      subtitle: 'Bookkeeping & Payroll',
      description: 'Comprehensive services for small businesses',
      icon: Building2,
      color: 'purple',
      features: [
        'Monthly Bookkeeping',
        'Payroll Services',
        'Quarterly Tax Filings',
        'Sales Tax Management',
        'Financial Statements',
        'Tax Planning & Strategy',
        'Business Entity Formation',
        'IRS Representation'
      ],
      price: 'Custom Pricing',
      cta: 'Get Quote'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Ross Tax Prep & Bookkeeping
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional tax services with cutting-edge technology. Choose the service that fits your needs.
          </p>
          
          {/* Security Badge */}
          <div className="mt-6 inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-full px-6 py-3">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-900">
              IRS MeF Certified • 256-bit Encryption • 2FA Protected
            </span>
          </div>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {services.map((service) => {
            const Icon = service.icon;
            const isSelected = selectedService === service.id;
            
            return (
              <div
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`
                  relative bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300
                  hover:shadow-2xl hover:-translate-y-2
                  ${isSelected ? 'ring-4 ring-blue-500 scale-105' : ''}
                `}
              >
                {/* Popular Badge */}
                {service.id === 'professional' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}
                
                {/* Icon */}
                <div className={`w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6`}>
                  <Icon className={`w-8 h-8 text-blue-600`} />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {service.title}
                </h2>
                <p className="text-sm font-semibold text-gray-600 mb-3">
                  {service.subtitle}
                </p>
                <p className="text-gray-700 mb-6">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className={`w-5 h-5 text-green-600 flex-shrink-0 mt-0.5`} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Price */}
                <div className={`bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6`}>
                  <p className={`text-2xl font-bold text-blue-900`}>
                    {service.price}
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectService(service.id as any);
                  }}
                  className={`
                    w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700
                    text-white rounded-xl font-bold text-lg
                    hover:from-blue-700 hover:to-blue-800
                    transition-all shadow-lg hover:shadow-xl
                    flex items-center justify-center gap-2
                  `}
                >
                  {service.cta}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Platform Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Secure Client Portal Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">2FA Authentication</h4>
              <p className="text-sm text-gray-600">
                Two-factor authentication with passkey protection
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">End-to-End Encryption</h4>
              <p className="text-sm text-gray-600">
                All personal and sensitive info encrypted at rest and in transit
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure Messaging</h4>
              <p className="text-sm text-gray-600">
                Encrypted preparer-to-client and staff communication
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Real-time Status</h4>
              <p className="text-sm text-gray-600">
                Track your return status and IRS acknowledgments live
              </p>
            </div>
          </div>
        </div>

        {/* Bank Products & Refund Options */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl p-8 text-white mb-12">
          <div className="flex items-center gap-4 mb-6">
            <CreditCard className="w-12 h-12" />
            <div>
              <h3 className="text-2xl font-bold">Integrated Bank Products</h3>
              <p className="text-green-100">Fast, flexible refund options</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <DollarSign className="w-8 h-8 mb-2" />
              <h4 className="font-bold mb-2">Refund Transfer</h4>
              <p className="text-sm text-green-100">
                Pay preparation fees from your refund
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Send className="w-8 h-8 mb-2" />
              <h4 className="font-bold mb-2">Direct Deposit</h4>
              <p className="text-sm text-green-100">
                Fastest way to receive your refund - 8-21 days
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <FileText className="w-8 h-8 mb-2" />
              <h4 className="font-bold mb-2">Check Printing</h4>
              <p className="text-sm text-green-100">
                Traditional paper check option available
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-600">
          <p className="mb-2">
            <strong>Ross Tax Prep & Bookkeeping LLC</strong> • EIN: 33-4891499
          </p>
          <p className="text-sm">
            2509 Cody Poe Rd, Killeen, TX 76549 • (512) 489-6749 • info@rosstaxprepandbookkeeping.com
          </p>
          <p className="text-xs mt-4 text-gray-500">
            IRS Authorized e-file Provider • PTIN Certified • Bank Products by Santa Barbara TPG
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxServiceLanding;
