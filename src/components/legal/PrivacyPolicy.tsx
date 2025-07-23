import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Lock, 
  Shield, 
  Eye, 
  Database, 
  Brain, 
  Download, 
  Trash2, 
  Globe,
  AlertCircle
} from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const sections = [
    {
      id: 'collection',
      icon: Database,
      title: 'Information We Collect',
      content: [
        'Account information: email address, display name, profile preferences',
        'Wardrobe data: uploaded clothing images, categories, and style preferences',
        'Usage analytics: app interactions, feature usage, and performance metrics',
        'Device information: browser type, operating system, and technical specifications',
        'AI-generated data: style recommendations, color analysis results, and insights'
      ]
    },
    {
      id: 'usage',
      icon: Brain,
      title: 'How We Use Your Information',
      content: [
        'Provide personalized AI fashion recommendations and styling advice',
        'Analyze clothing items and generate wardrobe organization insights',
        'Improve our AI algorithms and machine learning models',
        'Enhance user experience and develop new features',
        'Provide customer support and respond to user inquiries',
        'Send service updates and important account notifications'
      ]
    },
    {
      id: 'protection',
      icon: Shield,
      title: 'Data Protection & Security',
      content: [
        'All data encrypted in transit using TLS 1.3 encryption',
        'Images and personal data encrypted at rest in secure databases',
        'Regular security audits and vulnerability assessments',
        'Access controls limit data access to authorized personnel only',
        'Secure authentication with industry-standard protocols',
        'Automatic data backups with encrypted storage'
      ]
    },
    {
      id: 'sharing',
      icon: Eye,
      title: 'Information Sharing',
      content: [
        'We do not sell personal information to third parties',
        'Anonymized, aggregated data may be used for research and improvement',
        'Service providers (hosting, analytics) access data only as needed',
        'Legal compliance: data may be disclosed if required by law',
        'No sharing of personal images or identifiable wardrobe data',
        'Marketing partnerships do not include personal data sharing'
      ]
    },
    {
      id: 'ai-training',
      icon: Brain,
      title: 'AI Training & Algorithms',
      content: [
        'Personal images are not used to train public AI models',
        'Anonymized usage patterns help improve recommendation accuracy',
        'Color analysis algorithms are proprietary and privacy-preserving',
        'Style preferences are processed locally when possible',
        'You can opt out of data usage for AI improvement',
        'AI decisions are transparent and explainable where feasible'
      ]
    },
    {
      id: 'rights',
      icon: Download,
      title: 'Your Privacy Rights',
      content: [
        'Access: Request a copy of all personal data we hold about you',
        'Correction: Update or correct inaccurate personal information',
        'Deletion: Request deletion of your account and associated data',
        'Portability: Export your data in a standard, machine-readable format',
        'Opt-out: Decline participation in analytics or AI improvement',
        'Withdraw consent: Revoke permissions for data processing'
      ]
    },
    {
      id: 'retention',
      icon: Trash2,
      title: 'Data Retention',
      content: [
        'Account data retained while your account is active',
        'Deleted accounts: personal data removed within 30 days',
        'Legal requirements may require longer retention periods',
        'Anonymized analytics data may be retained indefinitely',
        'Image data deleted immediately upon user request',
        'AI training data anonymized and cannot be linked back to users'
      ]
    },
    {
      id: 'international',
      icon: Globe,
      title: 'International Users',
      content: [
        'GDPR compliance for European Union users',
        'CCPA compliance for California residents',
        'Data processing agreements in place with all vendors',
        'Cross-border data transfers use appropriate safeguards',
        'Local privacy laws respected where applicable',
        'Privacy Shield or equivalent protections for US data transfers'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card className="shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Privacy Policy
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              How we collect, use, and protect your personal information
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Last Updated: December 2024
            </Badge>
            <Badge variant="outline">
              GDPR & CCPA Compliant
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <ScrollArea className="h-[60vh] sm:h-[500px] pr-2 sm:pr-4">
            <div className="space-y-8">
              <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Privacy-First Approach
                    </h4>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      DripMuse is designed with privacy at its core. We collect only the minimum 
                      data necessary to provide our AI-powered fashion services, and we give you 
                      complete control over your personal information.
                    </p>
                  </div>
                </div>
              </div>

              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <div key={section.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {section.title}
                      </h3>
                    </div>
                    
                    <ul className="space-y-2 ml-8 sm:ml-13">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3 text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
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

              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Your Control Over Data
                  </h4>
                  <p className="text-green-700 text-sm leading-relaxed">
                    You have complete control over your data in DripMuse. You can view, edit, 
                    export, or delete your information at any time through your account settings. 
                    For additional privacy requests, contact us at{' '}
                    <span className="font-medium">privacy@dripmuse.com</span>.
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-800 text-sm">
                  <strong>Questions about Privacy:</strong> This policy explains our practices 
                  clearly, but if you have questions or concerns about how we handle your data, 
                  please don't hesitate to contact our privacy team. We're committed to transparency 
                  and protecting your privacy rights.
                </p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
