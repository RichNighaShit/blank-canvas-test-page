import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, FileText, Clock } from 'lucide-react';

interface CleanTermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const CleanTermsModal: React.FC<CleanTermsModalProps> = ({ isOpen, onAccept }) => {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const canProceed = ageConfirmed && termsAccepted && privacyAccepted;

  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to DripMuse
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Your AI-powered personal stylist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                What We Offer
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• AI-powered outfit recommendations</li>
                <li>• Personal color palette analysis</li>
                <li>• Smart wardrobe organization</li>
                <li>• Style insights and analytics</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="age-confirm"
                checked={ageConfirmed}
                onCheckedChange={(checked) => setAgeConfirmed(checked === true)}
                className="mt-1"
              />
              <label htmlFor="age-confirm" className="text-sm leading-relaxed cursor-pointer">
                I confirm that I am at least 13 years old
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms-accept"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-1"
              />
              <label htmlFor="terms-accept" className="text-sm leading-relaxed cursor-pointer">
                I accept the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Terms of Use
                </a>
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy-accept"
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                className="mt-1"
              />
              <label htmlFor="privacy-accept" className="text-sm leading-relaxed cursor-pointer">
                I accept the{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>

          <Button
            onClick={onAccept}
            disabled={!canProceed}
            className="w-full"
            size="lg"
          >
            Continue to DripMuse
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our terms and privacy policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};