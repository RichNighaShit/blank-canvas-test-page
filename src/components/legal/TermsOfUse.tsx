import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  FileText, 
  Users, 
  Lock, 
  Brain, 
  AlertTriangle,
  Mail,
  CheckCircle
} from 'lucide-react';

interface TermsOfUseProps {
  onAccept?: () => void;
  onDecline?: () => void;
  showActions?: boolean;
}

export const TermsOfUse: React.FC<TermsOfUseProps> = ({ 
  onAccept, 
  onDecline, 
  showActions = false 
}) => {
  const sections = [
    {
      id: 'service',
      icon: Brain,
      title: 'AI-Powered Fashion Service',
      content: [
        'DripMuse provides AI-powered personal styling recommendations',
        'Features include color analysis, outfit suggestions, and wardrobe management',
        'AI recommendations are suggestions, not professional fashion advice',
        'Results may vary based on personal preferences and image quality'
      ]
    },
    {
      id: 'account',
      icon: Users,
      title: 'User Accounts',
      content: [
        'Must be 13+ years old to create an account',
        'Provide accurate and complete registration information',
        'Maintain confidentiality of account credentials',
        'Responsible for all activities under your account'
      ]
    },
    {
      id: 'acceptable-use',
      icon: Shield,
      title: 'Acceptable Use',
      content: [
        'Upload only appropriate, family-friendly clothing images',
        'Respect intellectual property and trademark rights',
        'Do not upload copyrighted images without permission',
        'No spam, harassment, or harmful content'
      ]
    },
    {
      id: 'privacy',
      icon: Lock,
      title: 'Privacy & Data Protection',
      content: [
        'Your images and data are encrypted and securely stored',
        'Personal data is not sold to third parties',
        'Anonymized data may be used to improve AI algorithms',
        'You can request data export or deletion at any time'
      ]
    },
    {
      id: 'intellectual-property',
      icon: FileText,
      title: 'Intellectual Property',
      content: [
        'You retain ownership of uploaded images and content',
        'DripMuse owns the platform, AI algorithms, and generated recommendations',
        'Fashion brand names and images remain property of their owners',
        'Respect third-party trademarks and copyrights'
      ]
    },
    {
      id: 'limitations',
      icon: AlertTriangle,
      title: 'Limitations & Disclaimers',
      content: [
        'Service provided "as is" without warranty of fashion outcomes',
        'AI accuracy depends on image quality and personal factors',
        'Not liable for indirect damages or fashion choices',
        'Service availability subject to maintenance and updates'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Terms of Use
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Please read these terms carefully before using DripMuse
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Effective: December 2024
            </Badge>
            <Badge variant="outline">
              AI Fashion Platform
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-8">
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <div key={section.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {section.title}
                      </h3>
                    </div>
                    
                    <ul className="space-y-2 ml-13">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3 text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {index < sections.length - 1 && (
                      <Separator className="my-6" />
                    )}
                  </div>
                );
              })}

              <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Questions or Concerns?
                    </h4>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      For questions about these terms or our service, contact us at{' '}
                      <span className="font-medium">legal@dripmuse.com</span> or through 
                      our support channels. We're here to help clarify any aspect of our terms.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> By using DripMuse, you acknowledge that you have read, 
                  understood, and agree to be bound by these Terms of Use. These terms may be updated 
                  periodically, and continued use constitutes acceptance of any changes.
                </p>
              </div>
            </div>
          </ScrollArea>

          {showActions && (
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              {onDecline && (
                <Button variant="outline" onClick={onDecline}>
                  Decline
                </Button>
              )}
              {onAccept && (
                <Button 
                  onClick={onAccept}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Accept Terms
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfUse;
