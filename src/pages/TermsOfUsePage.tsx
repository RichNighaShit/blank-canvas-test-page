
import React from 'react';
import Header from '@/components/Header';
import { TermsOfUse } from '@/components/legal';
import { SEOHead } from '@/components/SEOHead';

const TermsOfUsePage: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="Terms of Use - DripMuse AI Stylist Platform"
        description="Read DripMuse's Terms of Use to understand your rights and responsibilities when using our AI-powered personal styling platform."
        keywords="terms of use, legal agreement, user agreement, DripMuse terms, fashion AI platform terms"
        url="https://dripmuse.com/terms"
      />
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <main className="container mx-auto py-8">
          <article>
            <header>
              <h1 className="sr-only">DripMuse Terms of Use</h1>
            </header>
            <TermsOfUse />
          </article>
        </main>
      </div>
    </>
  );
};

export default TermsOfUsePage;
