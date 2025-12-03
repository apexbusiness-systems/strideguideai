/**
 * PWA Diagnostics Page
 * 
 * Diagnostic page for debugging PWA issues in production.
 * Shows PWA installability status, service worker registration status,
 * manifest validation results, icon availability, and install prompt availability.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { PWADiagnostic, PWADiagnosticResult } from '@/utils/PWADiagnostic';

const PWADiagnosticsPage: React.FC = () => {
  const [diagnosticResult, setDiagnosticResult] = useState<PWADiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);

  useEffect(() => {
    runDiagnostics();
    checkInstallPrompt();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const result = await PWADiagnostic.diagnose();
      setDiagnosticResult(result);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkInstallPrompt = async () => {
    const { available } = await PWADiagnostic.checkInstallPrompt();
    setInstallPromptAvailable(available);
  };

  const handleInstall = async () => {
    if ('BeforeInstallPromptEvent' in window) {
      const event = (window as any).beforeinstallprompt;
      if (event) {
        await event.prompt();
        const { outcome } = await event.userChoice;
        console.log('Install outcome:', outcome);
      }
    }
  };

  const StatusIcon = ({ passed }: { passed: boolean }) => {
    if (passed) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-4 text-muted-foreground">Running diagnostics...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!diagnosticResult) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <p className="text-muted-foreground">Failed to run diagnostics</p>
            <Button onClick={runDiagnostics} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">PWA Diagnostics</h1>
        <p className="text-muted-foreground">
          Comprehensive diagnostic information for Progressive Web App functionality
        </p>
      </div>

      {/* Overall Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Status</span>
            <Badge variant={diagnosticResult.isInstallable ? 'default' : 'destructive'}>
              {diagnosticResult.isInstallable ? 'Installable' : 'Not Installable'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagnosticResult.isInstallable ? (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              <span>PWA meets all installability criteria</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <XCircle className="mr-2 h-5 w-5" />
              <span>PWA does not meet all installability criteria</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installability Criteria */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Installability Criteria</CardTitle>
          <CardDescription>
            All criteria must pass for PWA to be installable
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(diagnosticResult.criteria).map(([key, criterion]) => (
            <div key={key} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <StatusIcon passed={criterion.passed} />
                  <span className="ml-2 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{criterion.message}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Service Worker Details */}
      {diagnosticResult.serviceWorker && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered:</span>
                <Badge variant={diagnosticResult.serviceWorker.registered ? 'default' : 'destructive'}>
                  {diagnosticResult.serviceWorker.registered ? 'Yes' : 'No'}
                </Badge>
              </div>
              {diagnosticResult.serviceWorker.scope && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scope:</span>
                  <span className="font-mono text-sm">{diagnosticResult.serviceWorker.scope}</span>
                </div>
              )}
              {diagnosticResult.serviceWorker.state && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State:</span>
                  <Badge variant="outline">{diagnosticResult.serviceWorker.state}</Badge>
                </div>
              )}
              {diagnosticResult.serviceWorker.scriptURL && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Script URL:</span>
                  <span className="font-mono text-sm break-all">{diagnosticResult.serviceWorker.scriptURL}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manifest Details */}
      {diagnosticResult.manifest && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manifest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span>{diagnosticResult.manifest.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Short Name:</span>
                <span>{diagnosticResult.manifest.short_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start URL:</span>
                <span className="font-mono text-sm">{diagnosticResult.manifest.start_url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Display:</span>
                <Badge variant="outline">{diagnosticResult.manifest.display}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Icons */}
      {diagnosticResult.icons && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Icons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Found:</span>
                <Badge variant="default">{diagnosticResult.icons.found.length}</Badge>
              </div>
              {diagnosticResult.icons.found.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Found Icons:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {diagnosticResult.icons.found.map((icon, idx) => (
                      <li key={idx} className="font-mono">{icon}</li>
                    ))}
                  </ul>
                </div>
              )}
              {diagnosticResult.icons.missing.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1 text-red-600">Missing Icons:</p>
                  <ul className="list-disc list-inside text-sm text-red-600">
                    {diagnosticResult.icons.missing.map((icon, idx) => (
                      <li key={idx} className="font-mono">{icon}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Install Prompt */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Install Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                {installPromptAvailable
                  ? 'Install prompt is available'
                  : 'Install prompt is not available (may already be installed or criteria not met)'}
              </p>
            </div>
            {installPromptAvailable && (
              <Button onClick={handleInstall}>
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Errors & Warnings */}
      {diagnosticResult.errors.length > 0 && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {diagnosticResult.errors.map((error, idx) => (
                <li key={idx} className="text-sm text-red-600">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {diagnosticResult.warnings.length > 0 && (
        <Card className="mb-6 border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-600">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {diagnosticResult.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-yellow-600">{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={runDiagnostics} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Diagnostics
        </Button>
        <Button
          onClick={() => {
            console.log(PWADiagnostic.formatResult(diagnosticResult));
          }}
          variant="outline"
        >
          Log to Console
        </Button>
      </div>
    </div>
  );
};

export default PWADiagnosticsPage;


