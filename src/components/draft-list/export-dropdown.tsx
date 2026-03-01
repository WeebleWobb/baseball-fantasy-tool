'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { StoredDraftPlayer } from '@/types/draft-list';

type ExportLayout = 'multi-first-last' | 'multi-last-first' | 'single';

interface ExportDropdownProps {
  draftList: StoredDraftPlayer[];
  disabled?: boolean;
}

const EXPORT_OPTIONS: { value: ExportLayout; label: string; description: string }[] = [
  {
    value: 'multi-first-last',
    label: '2 Columns',
    description: 'First name, Last name | Team',
  },
  {
    value: 'multi-last-first',
    label: '2 Columns',
    description: 'Last name, First name | Team',
  },
  {
    value: 'single',
    label: 'Single Column',
    description: 'First name Last name, Team',
  },
];

function cleanName(name: string): string {
  // Remove parenthetical suffixes like "(Batter)" or "(Pitcher)"
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = cleanName(fullName);
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');
  return { firstName, lastName };
}

function generateCSV(draftList: StoredDraftPlayer[], layout: ExportLayout): string {
  const rows: string[][] = [];

  switch (layout) {
    case 'multi-first-last': {
      draftList.forEach((player) => {
        const { firstName, lastName } = splitName(player.name);
        rows.push([`${firstName}, ${lastName}`, player.team]);
      });
      break;
    }
    case 'multi-last-first': {
      draftList.forEach((player) => {
        const { firstName, lastName } = splitName(player.name);
        rows.push([`${lastName}, ${firstName}`, player.team]);
      });
      break;
    }
    case 'single': {
      draftList.forEach((player) => {
        rows.push([`${cleanName(player.name)}, ${player.team}`]);
      });
      break;
    }
  }

  return rows
    .map((row) =>
      row.map((cell) => {
        // Escape quotes and wrap in quotes if contains comma or quote
        if (cell.includes(',') || cell.includes('"')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
    .join('\n');
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ExportDropdown({ draftList, disabled }: ExportDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedLayout, setSelectedLayout] = React.useState<ExportLayout>('multi-first-last');

  const handleExport = () => {
    const csv = generateCSV(draftList, selectedLayout);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `draft-list-${date}.csv`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || draftList.length === 0}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader className="mb-4">
          <PopoverTitle className='text-base'>Export draft list as .csv</PopoverTitle>
          <PopoverDescription>Select your column layout</PopoverDescription>
        </PopoverHeader>
        <RadioGroup
          value={selectedLayout}
          onValueChange={(value) => setSelectedLayout(value as ExportLayout)}
          className="mb-4"
        >
          {EXPORT_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-start gap-3">
              <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
              <Label htmlFor={option.value} className="flex flex-col items-start cursor-pointer gap-1.5">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Button onClick={handleExport} className="w-full">
          Export CSV
        </Button>
      </PopoverContent>
    </Popover>
  );
}
