import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedChallengesPanel from '../app/assembly-line/AdvancedChallengesPanel';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

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

describe('AdvancedChallengesPanel', () => {
  const mockChallenges = [
    {
      id: 'challenge-1',
      title: 'Advanced Web Exploitation',
      description: 'Exploit a complex web application with multiple vulnerabilities',
      category: 'web',
      difficulty: 'hard',
      points: 500,
      hints: ['Look for SQL injection', 'Check for XSS']
    },
    {
      id: 'challenge-2',
      title: 'Cryptographic Protocol Analysis',
      description: 'Break a custom encryption scheme used in robot communications',
      category: 'crypto',
      difficulty: 'medium',
      points: 300,
      hints: ['Frequency analysis might help']
    },
    {
      id: 'challenge-3',
      title: 'Reverse Engineering Robot Firmware',
      description: 'Analyze and exploit vulnerabilities in robotic arm firmware',
      category: 'reverse',
      difficulty: 'hard',
      points: 600,
      hints: ['Use a disassembler', 'Look for buffer overflows']
    }
  ];

  it('renders nothing when no challenges are provided', () => {
    const { container } = render(<AdvancedChallengesPanel challenges={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the panel header with correct text', () => {
    render(<AdvancedChallengesPanel challenges={mockChallenges} />);
    
    expect(screen.getByText('ADVANCED CHALLENGE PROTOCOLS DETECTED')).toBeInTheDocument();
    expect(screen.getByText('Neural reconstruction has unlocked elite-level missions')).toBeInTheDocument();
  });

  it('renders all provided challenges', () => {
    render(<AdvancedChallengesPanel challenges={mockChallenges} />);
    
    // Check that all challenge titles are rendered
    expect(screen.getByText('Advanced Web Exploitation')).toBeInTheDocument();
    expect(screen.getByText('Cryptographic Protocol Analysis')).toBeInTheDocument();
    expect(screen.getByText('Reverse Engineering Robot Firmware')).toBeInTheDocument();
  });

  it('displays challenge details correctly', () => {
    render(<AdvancedChallengesPanel challenges={mockChallenges} />);
    
    // Check points display
    expect(screen.getByText('500 pts')).toBeInTheDocument();
    expect(screen.getByText('300 pts')).toBeInTheDocument();
    expect(screen.getByText('600 pts')).toBeInTheDocument();
    
    // Check category badges
    expect(screen.getByText('WEB')).toBeInTheDocument();
    expect(screen.getByText('CRYPTO')).toBeInTheDocument();
    expect(screen.getByText('REVERSE')).toBeInTheDocument();
    
    // Check difficulty badges
    expect(screen.getAllByText('HARD')).toHaveLength(2);
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('creates correct links to challenge pages', () => {
    render(<AdvancedChallengesPanel challenges={mockChallenges} />);
    
    const engageButtons = screen.getAllByText('ENGAGE');
    expect(engageButtons).toHaveLength(3);
    
    // Check that links have correct hrefs
    const links = engageButtons.map(button => button.closest('a'));
    expect(links[0]).toHaveAttribute('href', '/challenges/challenge-1');
    expect(links[1]).toHaveAttribute('href', '/challenges/challenge-2');
    expect(links[2]).toHaveAttribute('href', '/challenges/challenge-3');
  });

  it('displays the warning message at the bottom', () => {
    render(<AdvancedChallengesPanel challenges={mockChallenges} />);
    
    expect(screen.getByText(/WARNING:/)).toBeInTheDocument();
    expect(screen.getByText(/enhanced AI consciousness levels/)).toBeInTheDocument();
    expect(screen.getByText(/neural pathway corruption/)).toBeInTheDocument();
  });

  it('renders challenge descriptions', () => {
    render(<AdvancedChallengesPanel challenges={mockChallenges} />);
    
    expect(screen.getByText('Exploit a complex web application with multiple vulnerabilities')).toBeInTheDocument();
    expect(screen.getByText('Break a custom encryption scheme used in robot communications')).toBeInTheDocument();
    expect(screen.getByText('Analyze and exploit vulnerabilities in robotic arm firmware')).toBeInTheDocument();
  });

  it('applies correct category icons', () => {
    const { container } = render(<AdvancedChallengesPanel challenges={mockChallenges} />);
    
    // Check that emojis are present (icons are rendered as text content)
    expect(container.innerHTML).toContain('🌐'); // web icon
    expect(container.innerHTML).toContain('🔐'); // crypto icon  
    expect(container.innerHTML).toContain('⚙️'); // reverse icon
  });

  it('matches snapshot', () => {
    const { container } = render(<AdvancedChallengesPanel challenges={mockChallenges} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
