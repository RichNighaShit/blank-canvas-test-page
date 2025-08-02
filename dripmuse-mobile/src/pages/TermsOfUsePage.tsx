import React from 'react';
import Header from '@/components/Header';
import { TermsOfUse } from '@/components/legal';

const TermsOfUsePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <div className="container mx-auto py-8">
        <TermsOfUse />
      </div>
    </div>
  );
};

export default TermsOfUsePage;
