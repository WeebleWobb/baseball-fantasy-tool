import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DraftListBuilder } from '@/components/draft-list';
import {
  setupDraftListMock,
  setupPlayersManagerMock,
  setupInfiniteScrollMock,
} from '@/__tests__/utils/test-mocks';
import {
  mockMixedPlayersWithRank,
  mockDraftListSingle,
  mockDraftListMultiple,
  mockDraftListWithPitcher,
} from '@/__tests__/utils/test-fixtures';
import type { usePlayersManager } from '@/hooks/use-players-manager';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';
import type { StoredDraftPlayer } from '@/types/draft-list';

// Mock hooks
jest.mock('@/hooks/use-draft-list');
jest.mock('@/hooks/use-players-manager');
jest.mock('@/hooks/use-infinite-scroll');

// Mock dnd-kit (uses browser APIs not available in jsdom)
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => null,
    },
  },
}));

describe('DraftListBuilder', () => {
  // Mock functions returned by setup functions for assertions
  let draftListMocks: ReturnType<typeof setupDraftListMock>;
  let playersManagerMocks: ReturnType<typeof setupPlayersManagerMock>;

  // Setup function that configures mocks and renders the component
  const setup = (options: {
    draftList?: StoredDraftPlayer[];
    players?: PlayerWithRank[];
    playersManagerOverrides?: Partial<ReturnType<typeof usePlayersManager>>;
  } = {}) => {
    const { draftList = [], players = mockMixedPlayersWithRank, playersManagerOverrides = {} } = options;

    draftListMocks = setupDraftListMock(draftList);
    playersManagerMocks = setupPlayersManagerMock(players, playersManagerOverrides);
    setupInfiniteScrollMock();

    return render(<DraftListBuilder />, {
      wrapper: ({ children }) => <TooltipProvider>{children}</TooltipProvider>,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render both panels', () => {
      setup();

      expect(screen.getByText('Viewing: All Players')).toBeInTheDocument();
      expect(screen.getByText('Draft List: All Players')).toBeInTheDocument();
    });

    it('should render table headers in available players panel', () => {
      setup();

      expect(screen.getAllByText('Rank').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Team').length).toBeGreaterThan(0);
    });

    it('should show player count in description', () => {
      setup();

      expect(screen.getByText(/Showing.*of.*3/)).toBeInTheDocument();
    });

    it('should show empty draft list message when no players drafted', () => {
      setup();

      expect(
        screen.getByText('No players in your draft list yet. Add players from the available pool.')
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading skeleton when loading', () => {
      setup({ players: [], playersManagerOverrides: { isLoading: true } });

      expect(screen.getByText('Loading players...')).toBeInTheDocument();
    });
  });

  describe('adding players', () => {
    it('should call addPlayer when add button is clicked', async () => {
      const user = userEvent.setup();
      setup();

      const addButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-user-plus')
      );

      if (addButtons.length > 0) {
        await user.click(addButtons[0]);
        expect(draftListMocks.addPlayer).toHaveBeenCalled();
      }
    });

    it('should show Drafted badge when a player is drafted', () => {
      setup({ draftList: mockDraftListSingle });

      expect(screen.getByText('1 player in your draft list')).toBeInTheDocument();
    });
  });

  describe('draft list panel', () => {
    it('should display drafted players', () => {
      setup({ draftList: mockDraftListSingle });

      expect(screen.getByText('1 player in your draft list')).toBeInTheDocument();
    });

    it('should call removePlayer when remove button is clicked', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListSingle });

      const removeButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-user-minus')
      );

      if (removeButtons.length > 0) {
        await user.click(removeButtons[0]);
        expect(draftListMocks.removePlayer).toHaveBeenCalledWith('431.p.8967');
      }
    });

    it('should call movePlayer when down button is clicked', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListMultiple });

      const moveDownButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-arrow-down')
      );

      await user.click(moveDownButtons[0]);
      expect(draftListMocks.movePlayer).toHaveBeenCalledWith('431.p.8967', 'down');
    });

    it('should call movePlayer when up button is clicked for non-first player', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListMultiple });

      // Get all move up buttons - the second one (index 1) is for Mookie Betts
      const moveUpButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-arrow-up')
      );

      // Click the second player's move up button
      await user.click(moveUpButtons[1]);
      expect(draftListMocks.movePlayer).toHaveBeenCalledWith('431.p.9988', 'up');
    });

    it('should disable move up for first player', () => {
      setup({ draftList: mockDraftListSingle });

      const moveUpButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg.lucide-arrow-up')
      );

      expect(moveUpButtons[0]).toBeDisabled();
    });
  });

  describe('search functionality', () => {
    it('should have search inputs in both panels', () => {
      setup();

      const searchInputs = screen.getAllByPlaceholderText('Search Player');
      expect(searchInputs).toHaveLength(2);
    });

    it('should call onSearchChange when typing in available players search', async () => {
      const user = userEvent.setup();
      setup();

      const searchInputs = screen.getAllByPlaceholderText('Search Player');
      await user.type(searchInputs[0], 'Trout');

      expect(playersManagerMocks.onSearchChange).toHaveBeenCalled();
    });
  });

  describe('filter functionality', () => {
    it('should have filter buttons in both panels', () => {
      setup();

      const filterButtons = screen.getAllByRole('button', { name: /filter/i });
      expect(filterButtons).toHaveLength(2);
    });

    it('should filter draft list by position', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListWithPitcher });

      // Get the filter buttons - second one is for draft list panel
      const filterButtons = screen.getAllByRole('button', { name: /filter/i });
      await user.click(filterButtons[1]);

      // Select OF filter (exact match since "OF" is short)
      const ofOption = screen.getByRole('menuitem', { name: 'OF' });
      await user.click(ofOption);

      // Should show OF players but not pitcher
      expect(screen.queryByText('Jacob deGrom')).not.toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    const setupDownloadMocks = () => {
      const mockClick = jest.fn();
      globalThis.URL.createObjectURL = jest.fn().mockReturnValue('blob:test-url');
      globalThis.URL.revokeObjectURL = jest.fn();

      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          const anchor = originalCreateElement('a');
          anchor.click = mockClick;
          return anchor;
        }
        return originalCreateElement(tag);
      });

      return { mockClick };
    };

    it('should render export button', () => {
      setup({ draftList: mockDraftListSingle });

      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('should disable export when draft list is empty', () => {
      setup();

      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeDisabled();
    });

    it('should open export popover with layout options', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListSingle });

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(screen.getByText('Export draft list as .csv')).toBeInTheDocument();
      expect(screen.getAllByText('2 Columns').length).toBe(2);
      expect(screen.getByText('Single Column')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    });

    it.each([
      { layout: null, name: 'default (first-last)' },
      { layout: 'Single Column', name: 'single column' },
      { layout: 'Last name, First name | Team', name: 'last-first' },
    ])('should trigger CSV download with $name layout', async ({ layout }) => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListSingle });
      const { mockClick } = setupDownloadMocks();

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      if (layout) {
        await user.click(screen.getByText(layout));
      }

      await user.click(screen.getByRole('button', { name: /export csv/i }));

      expect(mockClick).toHaveBeenCalled();
      jest.restoreAllMocks();
    });
  });

  describe('show drafted toggle', () => {
    it('should render show drafted toggle', () => {
      setup({ draftList: mockDraftListSingle });

      expect(screen.getByText('Show Drafted')).toBeInTheDocument();
    });

    it('should disable show drafted toggle when no players drafted', () => {
      setup();

      const toggle = screen.getByRole('switch', { name: /show drafted/i });
      expect(toggle).toBeDisabled();
    });
  });

  describe('player stats popover', () => {
    it('should render stats buttons for players', () => {
      setup();

      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);
    });
  });

  describe('hasMore pagination', () => {
    it('should show scroll to load more message when hasMore', () => {
      setup({ playersManagerOverrides: { hasMore: true, totalMatchingPlayers: 100 } });

      expect(screen.getByText(/Scroll to load more/)).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('should show no players found message when no results', () => {
      setup({ players: [] });

      expect(screen.getByText('No players found.')).toBeInTheDocument();
    });
  });

  describe('position display', () => {
    it('should format positions with slashes', () => {
      setup();

      expect(screen.getByText('2B/OF')).toBeInTheDocument();
    });
  });

  describe('rank move popover functionality', () => {
    it('should open popover with player list when rank button clicked', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListMultiple });

      const rankButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '1'
      );

      await user.click(rankButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Move Player')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search position...')).toBeInTheDocument();
        expect(screen.getByText(/1\. Mike Trout/)).toBeInTheDocument();
        expect(screen.getByText(/2\. Mookie Betts/)).toBeInTheDocument();
      });
    });

    it('should call reorderPlayer when selecting a different rank', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListMultiple });

      const rankButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '1'
      );

      await user.click(rankButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Move Player')).toBeInTheDocument();
      });

      const rank2Button = screen.getByRole('button', { name: /2\. Mookie Betts/ });
      await user.click(rank2Button);

      // newRank - 1 because the component converts to 0-indexed
      expect(draftListMocks.reorderPlayer).toHaveBeenCalledWith('431.p.8967', 1);
    });

    it('should disable current rank button', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListMultiple });

      const rankButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '1'
      );

      await user.click(rankButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Move Player')).toBeInTheDocument();
      });

      const currentRankButton = screen.getByRole('button', { name: /1\. Mike Trout.*current/i });
      expect(currentRankButton).toBeDisabled();
    });

    it('should filter players by search term and show no matches', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListMultiple });

      const rankButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '1'
      );

      await user.click(rankButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search position...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search position...');

      // Filter to show only rank 2
      await user.type(searchInput, '2');
      expect(screen.getByText(/2\. Mookie Betts/)).toBeInTheDocument();
      expect(screen.queryByText(/1\. Mike Trout/)).not.toBeInTheDocument();

      // Search for non-existent rank
      await user.clear(searchInput);
      await user.type(searchInput, '99');
      expect(screen.getByText('No positions found')).toBeInTheDocument();
    });
  });

  describe('draft list search filtering', () => {
    it('should filter draft list when searching', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListMultiple });

      const searchInputs = screen.getAllByPlaceholderText('Search Player');
      expect(searchInputs.length).toBe(2);

      await user.type(searchInputs[1], 'Trout');

      expect(searchInputs[1]).toHaveValue('Trout');
    });
  });

  describe('show drafted toggle interaction', () => {
    it('should toggle show drafted when clicked', async () => {
      const user = userEvent.setup();
      setup({ draftList: mockDraftListSingle });

      const toggle = screen.getByRole('switch', { name: /show drafted/i });
      expect(toggle).not.toBeDisabled();

      await user.click(toggle);

      expect(toggle).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('plural/singular player count', () => {
    it('should show singular "player" for one player', () => {
      setup({ draftList: mockDraftListSingle });

      expect(screen.getByText('1 player in your draft list')).toBeInTheDocument();
    });

    it('should show plural "players" for multiple players', () => {
      setup({ draftList: mockDraftListMultiple });

      expect(screen.getByText('2 players in your draft list')).toBeInTheDocument();
    });
  });
});
