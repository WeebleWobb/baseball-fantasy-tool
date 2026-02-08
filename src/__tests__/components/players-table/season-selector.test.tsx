import { render, screen, fireEvent } from '@testing-library/react'
import { SeasonSelector } from '@/components/players-table/season-selector'
import type { SeasonType, TimePeriodType } from '@/types/hooks'

describe('SeasonSelector', () => {
  const defaultProps = {
    season: 'current' as SeasonType,
    timePeriod: 'full' as TimePeriodType,
    onSeasonChange: jest.fn(),
    onTimePeriodChange: jest.fn(),
    disabled: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Season Dropdown', () => {
    it('should render season dropdown with current value', () => {
      render(<SeasonSelector {...defaultProps} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('Current Season')).toBeInTheDocument()
    })

    it('should display Last Season when season prop is last', () => {
      render(<SeasonSelector {...defaultProps} season="last" />)

      expect(screen.getByText('Last Season')).toBeInTheDocument()
    })

    it('should display Career when season prop is career', () => {
      render(<SeasonSelector {...defaultProps} season="career" />)

      expect(screen.getByText('Career')).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<SeasonSelector {...defaultProps} disabled={true} />)

      expect(screen.getByRole('combobox')).toBeDisabled()
    })
  })

  describe('Time Period Buttons', () => {
    it('should show time period buttons when season is current', () => {
      render(<SeasonSelector {...defaultProps} season="current" />)

      expect(screen.getByRole('radio', { name: 'Full' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Last Month' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Last Week' })).toBeInTheDocument()
    })

    it('should hide time period buttons when season is last', () => {
      render(<SeasonSelector {...defaultProps} season="last" />)

      expect(screen.queryByRole('radio', { name: 'Full' })).not.toBeInTheDocument()
      expect(screen.queryByRole('radio', { name: 'Last Month' })).not.toBeInTheDocument()
      expect(screen.queryByRole('radio', { name: 'Last Week' })).not.toBeInTheDocument()
    })

    it('should hide time period buttons when season is career', () => {
      render(<SeasonSelector {...defaultProps} season="career" />)

      expect(screen.queryByRole('radio', { name: 'Full' })).not.toBeInTheDocument()
      expect(screen.queryByRole('radio', { name: 'Last Month' })).not.toBeInTheDocument()
      expect(screen.queryByRole('radio', { name: 'Last Week' })).not.toBeInTheDocument()
    })

    it('should mark the active time period button', () => {
      render(<SeasonSelector {...defaultProps} timePeriod="lastmonth" />)

      const lastMonthButton = screen.getByRole('radio', { name: 'Last Month' })
      expect(lastMonthButton).toHaveAttribute('aria-checked', 'true')

      const fullButton = screen.getByRole('radio', { name: 'Full' })
      expect(fullButton).toHaveAttribute('aria-checked', 'false')
    })

    it('should call onTimePeriodChange when clicking a time period button', () => {
      render(<SeasonSelector {...defaultProps} />)

      fireEvent.click(screen.getByRole('radio', { name: 'Last Week' }))

      expect(defaultProps.onTimePeriodChange).toHaveBeenCalledWith('lastweek')
    })

    it('should disable time period buttons when disabled prop is true', () => {
      render(<SeasonSelector {...defaultProps} disabled={true} />)

      expect(screen.getByRole('radio', { name: 'Full' })).toBeDisabled()
      expect(screen.getByRole('radio', { name: 'Last Month' })).toBeDisabled()
      expect(screen.getByRole('radio', { name: 'Last Week' })).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper radiogroup role for time period buttons', () => {
      render(<SeasonSelector {...defaultProps} />)

      expect(screen.getByRole('radiogroup', { name: 'Time period filter' })).toBeInTheDocument()
    })

    it('should have proper aria-checked attributes on time period buttons', () => {
      render(<SeasonSelector {...defaultProps} timePeriod="full" />)

      expect(screen.getByRole('radio', { name: 'Full' })).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByRole('radio', { name: 'Last Month' })).toHaveAttribute('aria-checked', 'false')
      expect(screen.getByRole('radio', { name: 'Last Week' })).toHaveAttribute('aria-checked', 'false')
    })
  })
})
