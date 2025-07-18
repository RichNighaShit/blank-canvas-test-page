import React from "react";
import ModernHeader from "@/components/ModernHeader";
import { ClothingAnalyzerTest } from "@/components/ClothingAnalyzerTest";

const ClothingAnalyzerTestPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      <div className="container mx-auto py-6">
        <ClothingAnalyzerTest />
      </div>
    </div>
  );
};

export default ClothingAnalyzerTestPage;
