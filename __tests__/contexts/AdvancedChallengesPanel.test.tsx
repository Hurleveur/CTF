import React from 'react';
import { render, screen } from '@testing-library/react';
import AdvancedChallengesPanel from '../../app/assembly-line/AdvancedChallengesPanel';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AdvancedChallengesPanel', () => {
  const mockChallenges = [
    {
      id: 'ch1',
      title: 'Advanced Challenge 1',
      description: 'A difficult challenge',
      category: 'web',
      difficulty: 'hard',
      points: 200
    },
    {
      id: 'ch2', 
      title: 'Advanced Challenge 2',
      description: 'Another difficult challenge',
      category: 'crypto',
      difficulty: 'medium',
      points: 150
    },
    {
      id: 'ch3',
      title: 'Advanced Challenge 3', 
      description: 'Yet another challenge',
      category: 'reverse',
      difficulty: 'hard',
      points: 300
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('should render challenges with completion status from props', () => {
    const completedChallengeIds = new Set(['ch1', 'ch3']);

    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={completedChallengeIds}
        isLoadingSubmissions={false}
      />
    );

    // Check that all challenges are rendered
    expect(screen.getByText('Advanced Challenge 1')).toBeInTheDocument();
    expect(screen.getByText('Advanced Challenge 2')).toBeInTheDocument();
    expect(screen.getByText('Advanced Challenge 3')).toBeInTheDocument();

    // Check completion status display
    expect(screen.getByText('2/3 COMPLETED')).toBeInTheDocument();

    // Verify no API calls were made (should use props instead)
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should show loading state when submissions are loading', () => {
    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={new Set()}
        isLoadingSubmissions={true}
      />
    );

    // Should not show completion count when loading
    expect(screen.queryByText(/COMPLETED/)).not.toBeInTheDocument();
  });

  it('should display correct completion progress', () => {
    const completedChallengeIds = new Set(['ch2']);

    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={completedChallengeIds}
        isLoadingSubmissions={false}
      />
    );

    // Check progress display
    expect(screen.getByText('1/3 COMPLETED')).toBeInTheDocument();
    
    // Check progress bar (should be 33.33% width)
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle('width: 33.33333333333333%');
  });

  it('should handle empty completed challenges', () => {
    const completedChallengeIds = new Set<string>();

    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={completedChallengeIds}
        isLoadingSubmissions={false}
      />
    );

    // Check progress display
    expect(screen.getByText('0/3 COMPLETED')).toBeInTheDocument();
    
    // Check progress bar (should be 0% width)
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle('width: 0%');
  });

  it('should handle all challenges completed', () => {
    const completedChallengeIds = new Set(['ch1', 'ch2', 'ch3']);

    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={completedChallengeIds}
        isLoadingSubmissions={false}
      />
    );

    // Check progress display
    expect(screen.getByText('3/3 COMPLETED')).toBeInTheDocument();
    
    // Check progress bar (should be 100% width)
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle('width: 100%');
  });

  it('should display challenge categories and difficulties correctly', () => {
    const completedChallengeIds = new Set<string>();

    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={completedChallengeIds}
        isLoadingSubmissions={false}
      />
    );

    // Check category badges
    expect(screen.getByText('WEB')).toBeInTheDocument();
    expect(screen.getByText('CRYPTO')).toBeInTheDocument();
    expect(screen.getByText('REVERSE')).toBeInTheDocument();

    // Check difficulty badges
    expect(screen.getAllByText('HARD')).toHaveLength(2); // ch1 and ch3
    expect(screen.getByText('MEDIUM')).toBeInTheDocument(); // ch2

    // Check points
    expect(screen.getByText('200pts')).toBeInTheDocument();
    expect(screen.getByText('150pts')).toBeInTheDocument();
    expect(screen.getByText('300pts')).toBeInTheDocument();
  });

  it('should show visual indicators for completed challenges', () => {
    const completedChallengeIds = new Set(['ch1']);

    const { container } = render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={completedChallengeIds}
        isLoadingSubmissions={false}
      />
    );

    // Check that completed challenge has green styling by looking for the checkmark
    const checkmarkIcon = screen.getByText('✓');
    expect(checkmarkIcon).toBeInTheDocument();
    
    // Check that completed challenge has green card styling
    const completedCard = container.querySelector('.border-green-400.bg-green-50');
    expect(completedCard).toBeInTheDocument();
    
    // Check challenge cards specifically (exclude the wrapper)
    const challengeCards = container.querySelectorAll('.grid > div');
    const completedCards = Array.from(challengeCards).filter(card => 
      card.className.includes('border-green-400')
    );
    const uncompletedCards = Array.from(challengeCards).filter(card => 
      card.className.includes('border-red-300')
    );
    
    expect(completedCards).toHaveLength(1); // ch1
    expect(uncompletedCards).toHaveLength(2); // ch2 and ch3
  });

  it('should not make API calls for submissions data', () => {
    const completedChallengeIds = new Set(['ch1']);

    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={completedChallengeIds}
        isLoadingSubmissions={false}
      />
    );

    // Verify that no fetch calls were made
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle first-time reveal functionality', () => {
    // Mock localStorage to simulate first time
    localStorageMock.getItem.mockReturnValue(null);

    const completedChallengeIds = new Set<string>();

    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={completedChallengeIds}
        isLoadingSubmissions={false}
      />
    );

    // Verify localStorage interactions for first-time experience
    expect(localStorageMock.getItem).toHaveBeenCalledWith('hasSeenAdvancedChallenges');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('hasSeenAdvancedChallenges', 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('advancedChallengesFirstSeen', expect.any(String));
  });

  it('should not trigger first-time effects when already seen', () => {
    // Mock localStorage to simulate already seen
    localStorageMock.getItem.mockReturnValue('true');

    const completedChallengeIds = new Set<string>();

    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
        completedChallengeIds={completedChallengeIds}
        isLoadingSubmissions={false}
      />
    );

    // Should check localStorage but not set new values
    expect(localStorageMock.getItem).toHaveBeenCalledWith('hasSeenAdvancedChallenges');
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('should render with default props', () => {
    render(
      <AdvancedChallengesPanel
        challenges={mockChallenges}
      />
    );

    // Should render without errors using default props
    expect(screen.getByText('Advanced Challenge 1')).toBeInTheDocument();
    expect(screen.getByText('0/3 COMPLETED')).toBeInTheDocument();
  });
});
