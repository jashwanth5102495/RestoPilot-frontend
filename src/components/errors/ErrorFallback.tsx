import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
          <p className="text-red-500 text-xs font-mono bg-red-50 p-3 rounded-lg border border-red-200 text-left max-h-32 overflow-y-auto">
            {error?.message || 'An unexpected error occurred.'}
          </p>
          <p className="text-gray-500 text-xs">
            We encountered an issue loading this page. Click below to reload.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => {
              if (resetError) resetError();
              window.location.reload();
            }}
            className="w-full"
          >
            Reload Page
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              window.location.href = '/dashboard';
            }}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
