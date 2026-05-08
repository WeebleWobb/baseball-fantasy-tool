'use client';

import React from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileWarning } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  validateFile,
  parseCSV,
  matchPlayers,
  toStoredPlayers,
  filterDuplicates,
  IMPORT_OPTIONS,
  type MatchResult,
  type ImportLayout,
} from '@/lib/csv-import';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';
import type { StoredDraftPlayer } from '@/types/draft-list';

type ImportMode = 'replace' | 'append';

interface ImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availablePlayers: PlayerWithRank[];
  existingPlayerKeys: Set<string>;
  onImport: (
    players: StoredDraftPlayer[],
    mode: ImportMode
  ) => { success: boolean; error?: string };
}

interface ImportState {
  step: 'upload' | 'preview';
  mode: ImportMode;
  layout: ImportLayout;
  file: File | null;
  fileContent: string | null;
  matches: MatchResult[];
  error: string | null;
  duplicateCount: number;
}

const initialState: ImportState = {
  step: 'upload',
  mode: 'append',
  layout: 'multi-first-last',
  file: null,
  fileContent: null,
  matches: [],
  error: null,
  duplicateCount: 0,
};

export function ImportSheet({
  open,
  onOpenChange,
  availablePlayers,
  existingPlayerKeys,
  onImport,
}: ImportSheetProps) {
  const [state, setState] = React.useState<ImportState>(initialState);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when sheet closes
  React.useEffect(() => {
    if (!open) {
      setState(initialState);
    }
  }, [open]);

  const processFile = React.useCallback(
    (content: string, layout: ImportLayout, mode: ImportMode) => {
      const parseResult = parseCSV(content, layout);

      if (!parseResult.success) {
        return { error: parseResult.error, matches: [], duplicateCount: 0 };
      }

      const matches = matchPlayers(parseResult.rows, availablePlayers);
      const { newMatches, duplicateCount } = filterDuplicates(matches, existingPlayerKeys);

      return {
        error: null,
        matches: mode === 'append' ? newMatches : matches,
        duplicateCount: mode === 'append' ? duplicateCount : 0,
      };
    },
    [availablePlayers, existingPlayerKeys]
  );

  const handleFileSelect = React.useCallback(
    async (file: File) => {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setState((prev) => ({ ...prev, error: validation.error || 'Invalid file' }));
        return;
      }

      // Read file content
      const content = await file.text();
      const result = processFile(content, state.layout, state.mode);

      setState((prev) => ({
        ...prev,
        step: 'preview',
        file,
        fileContent: content,
        matches: result.matches,
        duplicateCount: result.duplicateCount,
        error: result.error,
      }));
    },
    [processFile, state.layout, state.mode]
  );

  const handleModeChange = React.useCallback(
    (mode: ImportMode) => {
      setState((prev) => {
        // If we have file content, re-process with new mode
        if (prev.fileContent) {
          const result = processFile(prev.fileContent, prev.layout, mode);
          return { ...prev, mode, ...result };
        }
        return { ...prev, mode };
      });
    },
    [processFile]
  );

  const handleLayoutChange = React.useCallback(
    (layout: ImportLayout) => {
      setState((prev) => {
        // If we have file content, re-process with new layout
        if (prev.fileContent) {
          const result = processFile(prev.fileContent, layout, prev.mode);
          return { ...prev, layout, ...result };
        }
        return { ...prev, layout };
      });
    },
    [processFile]
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleImport = React.useCallback(() => {
    const matchedCount = state.matches.filter((m) => m.matched !== null).length;
    if (matchedCount === 0) return;

    const players = toStoredPlayers(state.matches);
    const result = onImport(players, state.mode);

    if (result.success) {
      onOpenChange(false);
    } else {
      setState((prev) => ({ ...prev, error: result.error || 'Import failed' }));
    }
  }, [state.matches, state.mode, onImport, onOpenChange]);

  const matchedCount = state.matches.filter((m) => m.matched !== null).length;
  const unmatchedCount = state.matches.filter((m) => m.matched === null).length;
  const totalCount = state.matches.length + state.duplicateCount;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle>Import Draft List</SheetTitle>
          <SheetDescription asChild>
            <div>
              <p className="mb-1">Import player rankings from a CSV.</p>
              <p>For best results, structure your CSV in one of the following formats:</p>
              <ul className="list-disc list-inside mt-1 pl-3">
                <li>Single column: &quot;Mike Trout, LAA&quot;</li>
                <li>Two columns: &quot;Mike Trout&quot; | &quot;LAA&quot; or &quot;Trout, Mike&quot; | &quot;LAA&quot;</li>
              </ul>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Import Mode Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Import mode</Label>
            <RadioGroup
              value={state.mode}
              onValueChange={(value) => handleModeChange(value as ImportMode)}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="append" id="append" />
                <Label htmlFor="append" className="cursor-pointer">
                  Append to list
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="cursor-pointer">
                  Replace existing list
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* CSV Format Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">CSV format</Label>
            <RadioGroup
              value={state.layout}
              onValueChange={(value) => handleLayoutChange(value as ImportLayout)}
              className="flex flex-col"
            >
              {IMPORT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start gap-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex flex-col cursor-pointer">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-sm">
              <FileWarning className="h-4 w-4 flex-shrink-0" />
              {state.error}
            </div>
          )}

          {/* Upload Area */}
          {state.step === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                'hover:border-primary hover:bg-primary/5'
              )}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Drag & drop CSV file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Preview Table */}
          {state.step === 'preview' && (
            <>
              <div className="mb-3 text-sm text-muted-foreground">
                {matchedCount} of {totalCount} players matched
                {state.duplicateCount > 0 && (
                  <span className="text-amber-600">
                    {' '}({state.duplicateCount} already in list)
                  </span>
                )}
              </div>

              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.matches.map((match, index) => (
                      <TableRow
                        key={index}
                        className={cn(
                          match.matched === null && 'bg-amber-50 dark:bg-amber-950/20'
                        )}
                      >
                        <TableCell>
                          {match.matched ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          {match.matched?.name.full || match.parsed.name}
                        </TableCell>
                        <TableCell>
                          {match.matched?.editorial_team_abbr || match.parsed.team || '-'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'text-xs',
                              match.matched ? 'text-green-600' : 'text-amber-600'
                            )}
                          >
                            {match.matched ? 'Matched' : 'Not found'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {unmatchedCount > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Unmatched players will not be imported.
                </p>
              )}
            </>
          )}
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {state.step === 'preview' && (
            <Button onClick={handleImport} disabled={matchedCount === 0}>
              Import {matchedCount} Player{matchedCount !== 1 ? 's' : ''}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
