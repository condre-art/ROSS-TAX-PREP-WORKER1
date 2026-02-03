import React from 'react';

export default function Logo({ size = 'default', variant = 'full' }) {
  const logoUrl = '/assets/ross-logo.svg';
  
  const sizes = {
    small: { height: '40px', width: 'auto', maxWidth: '200px' },
    default: { height: '60px', width: 'auto', maxWidth: '300px' },
    large: { height: '100px', width: 'auto', maxWidth: '500px' }
  };

  return (
    <img 
      src={logoUrl} 
      alt="Ross Tax & Bookkeeping - Professional Tax Preparation Services"
      style={{
        ...sizes[size],
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
      }}
    />
  );
}
