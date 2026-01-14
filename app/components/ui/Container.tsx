import React from 'react';

export const Container = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`mx-auto w-full max-w-[1440px] px-6 md:px-12 lg:px-20 ${className}`}>
      {children}
    </div>
  );
};
