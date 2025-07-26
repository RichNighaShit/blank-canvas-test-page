import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface DiagnosticResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  details?: any;
}

const StyleRecommendationsDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Test 1: Import simpleStyleAI
    try {
      results.push({ name: 'simpleStyleAI Import', status: 'loading', message: 'Testing...' });
      setDiagnostics([...results]);
      
      const { simpleStyleAI } = await import('@/lib/simpleStyleAI');
      if (simpleStyleAI) {
        results[results.length - 1] = { 
          name: 'simpleStyleAI Import', 
          status: 'success', 
          message: 'Module imported successfully',
          details: typeof simpleStyleAI
        };
      } else {
        results[results.length - 1] = { 
          name: 'simpleStyleAI Import', 
          status: 'error', 
          message: 'Module imported but undefined' 
        };
      }
    } catch (error) {
      results[results.length - 1] = { 
        name: 'simpleStyleAI Import', 
        status: 'error', 
        message: `Import failed: ${error}` 
      };
    }

    // Test 2: Import hooks
    try {
      results.push({ name: 'Hooks Import', status: 'loading', message: 'Testing...' });
      setDiagnostics([...results]);
      
      const [authModule, profileModule, weatherModule] = await Promise.all([
        import('@/hooks/useAuth'),
        import('@/hooks/useProfile'),
        import('@/hooks/useWeather')
      ]);
      
      if (authModule.useAuth && profileModule.useProfile && weatherModule.useWeather) {
        results[results.length - 1] = { 
          name: 'Hooks Import', 
          status: 'success', 
          message: 'All hooks imported successfully' 
        };
      } else {
        results[results.length - 1] = { 
          name: 'Hooks Import', 
          status: 'error', 
          message: 'Some hooks are undefined' 
        };
      }
    } catch (error) {
      results[results.length - 1] = { 
        name: 'Hooks Import', 
        status: 'error', 
        message: `Hooks import failed: ${error}` 
      };
    }

    // Test 3: Test Supabase connection
    try {
      results.push({ name: 'Supabase Connection', status: 'loading', message: 'Testing...' });
      setDiagnostics([...results]);
      
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      results[results.length - 1] = { 
        name: 'Supabase Connection', 
        status: 'success', 
        message: `Connected. User: ${user ? 'authenticated' : 'not authenticated'}` 
      };
    } catch (error) {
      results[results.length - 1] = { 
        name: 'Supabase Connection', 
        status: 'error', 
        message: `Connection failed: ${error}` 
      };
    }

    // Test 4: Test error utilities
    try {
      results.push({ name: 'Error Utils', status: 'loading', message: 'Testing...' });
      setDiagnostics([...results]);
      
      const { getErrorMessage, logError } = await import('@/lib/errorUtils');
      const testMessage = getErrorMessage(new Error("Test error"));
      
      if (testMessage === "Test error") {
        results[results.length - 1] = { 
          name: 'Error Utils', 
          status: 'success', 
          message: 'Error utilities working correctly' 
        };
      } else {
        results[results.length - 1] = { 
          name: 'Error Utils', 
          status: 'error', 
          message: 'Error utilities not working as expected' 
        };
      }
    } catch (error) {
      results[results.length - 1] = { 
        name: 'Error Utils', 
        status: 'error', 
        message: `Error utilities failed: ${error}` 
      };
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      loading: 'secondary',
      success: 'default',
      error: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            StyleRecommendations Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Running diagnostics to identify the issue...
            </p>
            <Button 
              onClick={runDiagnostics}
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Rerun Tests
            </Button>
          </div>
          
          <div className="space-y-3">
            {diagnostics.map((diagnostic, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(diagnostic.status)}
                  <div>
                    <p className="font-medium">{diagnostic.name}</p>
                    <p className="text-sm text-muted-foreground">{diagnostic.message}</p>
                    {diagnostic.details && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Details: {JSON.stringify(diagnostic.details)}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(diagnostic.status)}
              </div>
            ))}
          </div>
          
          {diagnostics.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Running initial diagnostics...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StyleRecommendationsDiagnostic;
