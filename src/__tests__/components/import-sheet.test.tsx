import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportSheet } from '@/components/draft-list/import-sheet';
import { createMockPlayerWithRank } from '@/__tests__/utils/test-fixtures';
import { createMockFile } from '@/__tests__/utils/test-helpers';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';

const mockPlayers: PlayerWithRank[] = [
  createMockPlayerWithRank({
    player_key: 'mlb.p.1',
    name: { full: 'Mike Trout', first: 'Mike', last: 'Trout' },
    editorial_team_abbr: 'LAA',
  }),
  createMockPlayerWithRank({
    player_key: 'mlb.p.2',
    name: { full: 'Aaron Judge', first: 'Aaron', last: 'Judge' },
    editorial_team_abbr: 'NYY',
  }),
  createMockPlayerWithRank({
    player_key: 'mlb.p.3',
    name: { full: 'Shohei Ohtani', first: 'Shohei', last: 'Ohtani' },
    editorial_team_abbr: 'LAD',
  }),
];

describe('ImportSheet', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    availablePlayers: mockPlayers,
    existingPlayerKeys: new Set<string>(),
    onImport: jest.fn(() => ({ success: true })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders sheet with title and description', () => {
      render(<ImportSheet {...defaultProps} />);
      expect(screen.getByText('Import Draft List')).toBeInTheDocument();
      expect(screen.getByText(/Import player rankings from a CSV/)).toBeInTheDocument();
    });

    it('renders import mode options', () => {
      render(<ImportSheet {...defaultProps} />);
      expect(screen.getByLabelText('Append to list')).toBeInTheDocument();
      expect(screen.getByLabelText('Replace existing list')).toBeInTheDocument();
    });

    it('renders CSV format options', () => {
      render(<ImportSheet {...defaultProps} />);
      expect(screen.getAllByText('2 Columns')).toHaveLength(2);
      expect(screen.getByText('Single Column')).toBeInTheDocument();
    });

    it('renders file upload area', () => {
      render(<ImportSheet {...defaultProps} />);
      expect(screen.getByText('Drag & drop CSV file here')).toBeInTheDocument();
      expect(screen.getByText('or click to browse')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<ImportSheet {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('file upload', () => {
    it('processes valid CSV file and shows preview', async () => {
      render(<ImportSheet {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA\nAaron Judge,NYY');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/2 of 2 players matched/)).toBeInTheDocument();
      });
    });

    it('shows preview table with matched players', async () => {
      render(<ImportSheet {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Mike Trout')).toBeInTheDocument();
        expect(screen.getByText('LAA')).toBeInTheDocument();
        expect(screen.getByText('Matched')).toBeInTheDocument();
      });
    });

    it('shows unmatched players with warning', async () => {
      render(<ImportSheet {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Unknown Player,XXX');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Not found')).toBeInTheDocument();
        expect(screen.getByText(/0 of 1 players matched/)).toBeInTheDocument();
      });
    });

    it('shows error for empty file', async () => {
      const emptyFile = new File([''], 'empty.csv', { type: 'text/csv' });
      Object.defineProperty(emptyFile, 'size', { value: 0 });

      render(<ImportSheet {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [emptyFile] } });

      await waitFor(() => {
        expect(screen.getByText('File is empty')).toBeInTheDocument();
      });
    });

    it('shows error for file that is too large', async () => {
      const largeFile = createMockFile('x');
      Object.defineProperty(largeFile, 'size', { value: 2 * 1024 * 1024 });

      render(<ImportSheet {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText('File too large (max 1MB)')).toBeInTheDocument();
      });
    });

    it('handles drag and drop', async () => {
      render(<ImportSheet {...defaultProps} />);

      const dropZone = screen.getByText('Drag & drop CSV file here').parentElement!;
      const file = createMockFile('Mike Trout,LAA');

      const dataTransfer = {
        files: [file],
        types: ['Files'],
      };

      fireEvent.dragOver(dropZone, { dataTransfer });
      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByText(/1 of 1 players matched/)).toBeInTheDocument();
      });
    });
  });

  describe('import mode', () => {
    it('filters duplicates in append mode', async () => {
      const existingKeys = new Set(['mlb.p.1']);
      render(<ImportSheet {...defaultProps} existingPlayerKeys={existingKeys} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA\nAaron Judge,NYY');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/1 of 2 players matched/)).toBeInTheDocument();
        expect(screen.getByText(/1 already in list/)).toBeInTheDocument();
      });
    });

    it('includes all players in replace mode', async () => {
      const existingKeys = new Set(['mlb.p.1']);
      render(<ImportSheet {...defaultProps} existingPlayerKeys={existingKeys} />);

      // Switch to replace mode
      await userEvent.click(screen.getByLabelText('Replace existing list'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA\nAaron Judge,NYY');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/2 of 2 players matched/)).toBeInTheDocument();
        expect(screen.queryByText(/already in list/)).not.toBeInTheDocument();
      });
    });

    it('re-processes file when mode changes', async () => {
      const existingKeys = new Set(['mlb.p.1']);
      render(<ImportSheet {...defaultProps} existingPlayerKeys={existingKeys} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA\nAaron Judge,NYY');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/1 of 2 players matched/)).toBeInTheDocument();
      });

      // Switch to replace mode
      await userEvent.click(screen.getByLabelText('Replace existing list'));

      await waitFor(() => {
        expect(screen.getByText(/2 of 2 players matched/)).toBeInTheDocument();
      });
    });
  });

  describe('CSV format selection', () => {
    it('changes layout without file', async () => {
      render(<ImportSheet {...defaultProps} />);

      // Initially multi-first-last is selected
      const radioGroups = screen.getAllByRole('radiogroup');
      expect(radioGroups.length).toBeGreaterThan(0);

      // Switch to single column format by clicking the radio button
      const singleOption = screen.getByRole('radio', { name: /Single Column/i });
      await userEvent.click(singleOption);

      // Verify it can be selected without error
      expect(singleOption).toBeChecked();
    });
  });

  describe('import action', () => {
    it('shows import button with count after file upload', async () => {
      render(<ImportSheet {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA\nAaron Judge,NYY');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Import 2 Players' })).toBeInTheDocument();
      });
    });

    it('calls onImport with matched players on import', async () => {
      const onImport = jest.fn(() => ({ success: true }));
      render(<ImportSheet {...defaultProps} onImport={onImport} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Import 1 Player' })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Import 1 Player' }));

      expect(onImport).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ player_key: 'mlb.p.1', name: 'Mike Trout' }),
        ]),
        'append'
      );
    });

    it('closes sheet on successful import', async () => {
      const onOpenChange = jest.fn();
      const onImport = jest.fn(() => ({ success: true }));
      render(<ImportSheet {...defaultProps} onOpenChange={onOpenChange} onImport={onImport} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Import 1 Player' })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Import 1 Player' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows error on failed import', async () => {
      const onImport = jest.fn(() => ({ success: false, error: 'Import failed' }));
      render(<ImportSheet {...defaultProps} onImport={onImport} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Import 1 Player' })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'Import 1 Player' }));

      await waitFor(() => {
        expect(screen.getByText('Import failed')).toBeInTheDocument();
      });
    });

    it('disables import button when no matches', async () => {
      render(<ImportSheet {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Unknown Player,XXX');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Import 0 Players' })).toBeDisabled();
      });
    });
  });

  describe('cancel and close', () => {
    it('calls onOpenChange when cancel is clicked', async () => {
      const onOpenChange = jest.fn();
      render(<ImportSheet {...defaultProps} onOpenChange={onOpenChange} />);

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets state when sheet closes', async () => {
      const { rerender } = render(<ImportSheet {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('Mike Trout,LAA');

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/1 of 1 players matched/)).toBeInTheDocument();
      });

      // Close and reopen sheet
      rerender(<ImportSheet {...defaultProps} open={false} />);
      rerender(<ImportSheet {...defaultProps} open={true} />);

      // Should be back to upload state
      expect(screen.getByText('Drag & drop CSV file here')).toBeInTheDocument();
    });
  });
});
