import { render, screen } from '@testing-library/react';
import { StatsBar } from '../StatsBar';

const ITEMS = [
  { recommendation: 'BUY_FROM_TRADER', difference_pct: 140 },
  { recommendation: 'BUY_FROM_TRADER', difference_pct: 15 },
  { recommendation: 'BUY_FROM_FLEA',   difference_pct: -20 },
];

test('shows correct total count', () => {
  render(<StatsBar items={ITEMS} />);
  expect(screen.getByText('3')).toBeInTheDocument();
});

test('shows correct buy-from-trader count', () => {
  render(<StatsBar items={ITEMS} />);
  expect(screen.getByText('2')).toBeInTheDocument();
});

test('shows correct hot deal count', () => {
  render(<StatsBar items={ITEMS} />);
  expect(screen.getByText('1')).toBeInTheDocument();
});
