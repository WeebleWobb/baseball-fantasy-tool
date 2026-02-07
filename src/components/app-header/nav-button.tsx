'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  isActive?: boolean;
  disabled?: boolean;
  external?: boolean;
}

export function NavButton({
  icon,
  label,
  onClick,
  href,
  isActive = false,
  disabled = false,
  external = false,
}: NavButtonProps) {
  const baseClassName = cn(
    'flex items-center gap-1.5',
    isActive && 'bg-accent'
  );

  if (href) {
    return (
      <Button variant="ghost" className={baseClassName} asChild>
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          {icon}
          <span>{label}</span>
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={baseClassName}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
