'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

export const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
       setStatus('error');
       setMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
      return (
          <div className="bg-green-500/10 text-green-500 p-4 rounded text-sm text-center font-medium border border-green-500/20">
              {message}
          </div>
      );
  }

  return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full">
            <input 
                type="email" 
                placeholder="Enter your email address..." 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent border-none p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0" 
            />
            <Button className="w-full sm:w-auto px-6 whitespace-nowrap" disabled={status === 'loading'}>
                {status === 'loading' ? 'Joining...' : 'Subscribe Free'}
            </Button>
            {status === 'error' && (
                <div className="absolute -bottom-6 left-0 text-red-500 text-xs w-full text-center">{message}</div>
            )}
        </form>
  );
};
