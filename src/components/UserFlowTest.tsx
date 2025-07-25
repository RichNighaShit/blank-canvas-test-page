import React from 'react';
import { useUserFlow } from '@/hooks/useUserFlow';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

/**
 * Test component to verify user flow state
 * This can be temporarily added to pages for debugging
 */
export const UserFlowTest: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { flowState } = useUserFlow();

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'loading':
        return <Clock className="h-4 w-4" />;
      case 'auth':
        return <AlertCircle className="h-4 w-4" />;
      case 'terms':
        return <AlertCircle className="h-4 w-4" />;
      case 'onboarding':
        return <AlertCircle className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'loading':
        return 'default';
      case 'auth':
      case 'terms':
      case 'onboarding':
        return 'destructive';
      case 'ready':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            🔧 User Flow Debug
            <Badge variant={getStageColor(flowState.currentStage) as any} className="text-xs">
              {getStageIcon(flowState.currentStage)}
              {flowState.currentStage}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              {authLoading ? <Clock className="h-3 w-3" /> : user ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
              <span>Auth: {authLoading ? 'Loading' : user ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-1">
              {profileLoading ? <Clock className="h-3 w-3" /> : profile ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
              <span>Profile: {profileLoading ? 'Loading' : profile ? 'Yes' : 'No'}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Flow Checks:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {flowState.needsAuth ? <AlertCircle className="h-3 w-3 text-red-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                <span>Needs Auth: {flowState.needsAuth ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-1">
                {flowState.needsTermsAcceptance ? <AlertCircle className="h-3 w-3 text-red-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                <span>Needs Terms: {flowState.needsTermsAcceptance ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-1">
                {flowState.needsProfileCreation ? <AlertCircle className="h-3 w-3 text-red-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                <span>Needs Profile: {flowState.needsProfileCreation ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-1">
                {flowState.canShowTutorial ? <AlertCircle className="h-3 w-3 text-yellow-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                <span>Show Tutorial: {flowState.canShowTutorial ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {profile && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <div className="font-medium">Profile Status:</div>
              <div>Name: {profile.display_name || 'Missing'}</div>
              <div>Location: {profile.location || 'Missing'}</div>
              <div>Culture: {profile.culture || 'Missing'}</div>
              <div>Style: {profile.preferred_style || 'Missing'}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
