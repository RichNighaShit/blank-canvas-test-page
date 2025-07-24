import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  FileText, 
  Lock, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  Database,
  Zap
} from 'lucide-react';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({
  isOpen,
  onAccept,
  onDecline
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const canProceed = termsAccepted && privacyAccepted && ageConfirmed;

  const handleAccept = () => {
    if (canProceed) {
      onAccept();
    }
  };

  const summaryItems = [
    {
      icon: Zap,
      title: 'AI-Powered Fashion Service',
      description: 'Get personalized outfit recommendations and color analysis using advanced AI technology.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Eye,
      title: 'Your Data & Privacy',
      description: 'Your photos and personal data are encrypted and secure. We never sell your information.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Database,
      title: 'AI Training & Improvement',
      description: 'Anonymized usage patterns help improve recommendations. You can opt out anytime.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Shield,
      title: 'Your Rights',
      description: 'Access, export, or delete your data anytime. Full GDPR & CCPA compliance.',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="max-w-2xl h-[85vh] w-[95vw] sm:w-full p-0 gap-0 flex flex-col">
        <DialogHeader className="p-4 sm:p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to DripMuse
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-muted-foreground">
            Before we begin your style journey, please review and accept our terms
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 flex-shrink-0">
          <Badge variant="secondary" className="w-full justify-center py-2 mb-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-0">
            <AlertCircle className="mr-2 h-4 w-4" />
            Required for New Users - One Time Only
          </Badge>
        </div>

        <ScrollArea className="flex-1 px-4 sm:px-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 240px)' }}>
          <div className="space-y-6">
            {/* Service Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                What DripMuse Offers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {summaryItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="p-3 sm:p-4 rounded-lg border bg-card">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Key Points */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Important Information
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">AI Recommendations</p>
                    <p className="text-xs text-blue-700">
                      Our AI provides suggestions, not professional fashion advice. Results may vary based on personal preferences.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                  <Lock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Data Security</p>
                    <p className="text-xs text-green-700">
                      Your images are encrypted and stored securely. You control your data and can delete it anytime.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Eye className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Privacy First</p>
                    <p className="text-xs text-purple-700">
                      We never sell your personal data. Anonymized analytics help improve our AI for everyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Acceptance Checkboxes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Required Agreements</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg">
                  <Checkbox
                    id="age-confirm"
                    checked={ageConfirmed}
                    onCheckedChange={(checked) => setAgeConfirmed(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <label htmlFor="age-confirm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      Age Confirmation
                    </label>
                    <p className="text-xs text-muted-foreground">
                      I confirm that I am at least 13 years old (or the minimum age in my jurisdiction) and have the right to agree to these terms.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg">
                  <Checkbox
                    id="terms-accept"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <label htmlFor="terms-accept" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      Terms of Use Agreement
                    </label>
                    <p className="text-xs text-muted-foreground">
                      I have read and agree to the{' '}
                      <button 
                        type="button"
                        onClick={() => window.open('/terms', '_blank')}
                        className="text-purple-600 hover:text-purple-700 underline"
                      >
                        Terms of Use
                      </button>
                      , including AI service limitations and user responsibilities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg">
                  <Checkbox
                    id="privacy-accept"
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <label htmlFor="privacy-accept" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      Privacy Policy Agreement
                    </label>
                    <p className="text-xs text-muted-foreground">
                      I understand and agree to the{' '}
                      <button 
                        type="button"
                        onClick={() => window.open('/privacy', '_blank')}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Privacy Policy
                      </button>
                      , including data collection, AI training, and my privacy rights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 sm:p-6 pt-4 border-t bg-muted/30 flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onDecline}
              className="text-gray-600 hover:text-gray-700"
            >
              I'll Review Later
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!canProceed}
              className={`${
                canProceed 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg' 
                  : ''
              }`}
            >
              {canProceed ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept & Continue
                </>
              ) : (
                'Please Accept All Terms'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            This agreement is required only once. You can review these documents anytime in the app footer.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAcceptanceModal;
