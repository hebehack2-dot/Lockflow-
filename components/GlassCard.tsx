
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverable = false }) => {
  return (
    <div className={`glass rounded-2xl p-6 transition-all duration-300 ${hoverable ? 'hover:bg-white/5 hover:-translate-y-1' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
