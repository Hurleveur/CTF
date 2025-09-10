import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedChallengesPanel from '../app/assembly-line/AdvancedChallengesPanel';

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    frequency: { value: 0 },
    type: 'square',
    start: jest.fn(),
    stop: jest.fn()
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    }
  })),
  destination: {},
  currentTime: 0
};

(global as any).AudioContext = jest.fn(() => mockAudioContext);
(global as any).webkitAudioContext = jest.fn(() => mockAudioContext);

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('Challenge Sorting', () => {
  it('should display challenges sorted by points (lowest to highest)', () => {
    const unsortedChallenges = [
      {
        id: 'high-points',
        title: 'High Points Challenge',
        description: 'This challenge has the most points',
        category: 'web',
        difficulty: 'hard',
        points: 500,
      },
      {
        id: 'low-points',
        title: 'Low Points Challenge', 
        description: 'This challenge has the least points',
        category: 'misc',
        difficulty: 'easy',
        points: 50,
      },
      {
        id: 'medium-points',
        title: 'Medium Points Challenge',
        description: 'This challenge has medium points', 
        category: 'crypto',
        difficulty: 'medium',
        points: 200,
      },
    ];

    const { container } = render(
      <AdvancedChallengesPanel challenges={unsortedChallenges} />
    );

    // Get all challenge cards from the grid
    const challengeCards = container.querySelectorAll('.grid > div');
    
    // Extract the points from each card in the order they appear
    const displayedPoints: number[] = [];
    challengeCards.forEach(card => {
      const pointsText = card.textContent?.match(/(\d+)pts/)?.[1];
      if (pointsText) {
        displayedPoints.push(parseInt(pointsText, 10));
      }
    });

    // Verify that challenges are sorted by points (lowest to highest)
    expect(displayedPoints).toEqual([50, 200, 500]);
    
    // Also verify the titles appear in the correct order
    const challengeTitles = Array.from(challengeCards).map(card => {
      // Get the title text by looking for the h4 element with the title
      const titleElement = card.querySelector('h4');
      return titleElement?.textContent?.trim() || '';
    });

    expect(challengeTitles).toEqual([
      'Low Points Challenge',    // 50 points - should be first
      'Medium Points Challenge', // 200 points - should be second  
      'High Points Challenge',   // 500 points - should be last
    ]);
  });

  it('should maintain sort order even with identical points', () => {
    const challengesWithDuplicatePoints = [
      {
        id: 'challenge-c',
        title: 'Challenge C',
        description: 'Third challenge with same points',
        category: 'web', 
        difficulty: 'hard',
        points: 100,
      },
      {
        id: 'challenge-a', 
        title: 'Challenge A',
        description: 'First challenge with same points',
        category: 'misc',
        difficulty: 'easy', 
        points: 100,
      },
      {
        id: 'challenge-b',
        title: 'Challenge B', 
        description: 'Second challenge with same points',
        category: 'crypto',
        difficulty: 'medium',
        points: 100,
      },
    ];

    render(<AdvancedChallengesPanel challenges={challengesWithDuplicatePoints} />);

    // All challenges should appear (even with same points)
    expect(screen.getByText('Challenge A')).toBeInTheDocument();
    expect(screen.getByText('Challenge B')).toBeInTheDocument();
    expect(screen.getByText('Challenge C')).toBeInTheDocument();
    
    // All should show the same points
    const pointElements = screen.getAllByText('100pts');
    expect(pointElements).toHaveLength(3);
  });

  it('should handle empty challenges array', () => {
    const { container } = render(<AdvancedChallengesPanel challenges={[]} />);
    
    // Should render nothing
    expect(container.firstChild).toBeNull();
  });

  it('should handle single challenge', () => {
    const singleChallenge = [
      {
        id: 'only-challenge',
        title: 'Only Challenge',
        description: 'The one and only challenge',
        category: 'misc',
        difficulty: 'medium',
        points: 150,
      },
    ];

    const { container } = render(<AdvancedChallengesPanel challenges={singleChallenge} />);
    
    // Should display the single challenge
    expect(screen.getByText('Only Challenge')).toBeInTheDocument();
    expect(screen.getByText('150pts')).toBeInTheDocument();
    
    // Check that completion status is shown correctly using container text content
    expect(container.textContent).toContain('0/1 COMPLETED');
  });
});
