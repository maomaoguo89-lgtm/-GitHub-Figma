import React from 'react';
import { useRouteError } from 'react-router';

export function ErrorBoundary() {
  const error = useRouteError() as Error;
  
  console.error('Error caught by ErrorBoundary:', error);
  
  return (
    <div style={{ color: 'red', padding: 20, background: 'black', width: '100%', height: '100vh', overflow: 'auto' }}>
      <h1>Application Error</h1>
      <p>Something went wrong in the component tree.</p>
      <pre style={{ marginTop: 20, padding: 10, background: '#222', borderRadius: 4, fontSize: 12, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
        {error?.message || 'Unknown error'}
        {error?.stack && `\n\n${error.stack}`}
      </pre>
    </div>
  );
}