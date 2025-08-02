import React from 'react';
import Header from '@/components/Header';
import { PrivacyPolicy } from '@/components/legal';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <div className="container mx-auto py-8">
        <PrivacyPolicy />
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
