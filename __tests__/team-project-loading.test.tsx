import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamPage from '../app/team/page';

// Mock the AuthContext
const mockUseAuth = {
  isAuthenticated: true,
  user: { email: 'test@example.com' },
  login: jest.fn(),
  logout: jest.fn()
};

jest.mock('../app/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('TeamPage Project Loading', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('shows project loading indicators when team is loading', async () => {
    // Mock a slow API response to test loading state
    mockFetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<TeamPage />);
    
    // Should show "Loading projects..." for multiple team members while data is loading
    const loadingIndicators = screen.getAllByText('Loading projects...');
    expect(loadingIndicators.length).toBeGreaterThan(0);
    
    // Each loading indicator should have the spinning icon
    loadingIndicators.forEach(indicator => {
      const spinningIcon = indicator.querySelector('.animate-spin');
      expect(spinningIcon).toBeInTheDocument();
      expect(spinningIcon).toHaveClass('rounded-full', 'h-3', 'w-3', 'border-b-2', 'border-blue-400');
    });
  });

  test('hides project loading indicators after team data loads', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        teamMembers: [
          {
            id: 'test-uuid',
            name: 'Test User',
            role: 'Test Role',
            ctfRole: '🎯 CTF Participant',
            avatar: '👤',
            email: 'test@example.com',
            bio: 'Test bio',
            skills: ['Testing'],
            status: 'Active',
            projects: ['Test Project Alpha', 'Test Project Beta'],
            quirks: 'Loves testing',
            secret: 'Secret testing info',
            projectCount: 2,
            totalProgress: 75.5,
            hasProject: true
          }
        ],
        stats: {
          totalMembers: 1,
          totalProjects: 2,
          averageProgress: '75.5'
        }
      })
    });

    render(<TeamPage />);
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/team');
    });

    // After loading, should not show loading indicators
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });

    // Should show actual project data
    expect(screen.getByText('Test Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Test Project Beta')).toBeInTheDocument();
  });

  test('shows project loading with correct styling', () => {
    // Mock slow loading
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<TeamPage />);
    
    const loadingIndicator = screen.getAllByText('Loading projects...')[0];
    
    // The loading indicator should be inside a div with the correct classes
    const container = loadingIndicator.closest('.flex.items-center');
    expect(container).toBeInTheDocument();
    
    // Check container styling
    expect(container).toHaveClass(
      'flex',
      'items-center', 
      'text-gray-500',
      'text-xs',
      'italic'
    );
    
    // Check spinner styling
    const spinner = container?.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'rounded-full',
      'h-3',
      'w-3',
      'border-b-2',
      'border-blue-400',
      'mr-2'
    );
  });

  test('loading shows for static team members when authenticated', () => {
    // Mock slow loading
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<TeamPage />);
    
    // Should show loading for all team members (including static ones)
    // since the loading state applies to the entire team fetch operation
    const loadingTexts = screen.getAllByText('Loading projects...');
    expect(loadingTexts.length).toBeGreaterThanOrEqual(8); // At least 8 static team members
  });

  test('does not show loading indicators when not authenticated', () => {
    // Temporarily modify the mock to be unauthenticated
    const originalIsAuthenticated = mockUseAuth.isAuthenticated;
    const originalUser = mockUseAuth.user;
    
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.user = null;

    render(<TeamPage />);
    
    // Should not show loading indicators when not authenticated
    const loadingIndicators = screen.queryAllByText('Loading projects...');
    expect(loadingIndicators).toHaveLength(0);
    
    // Should show regular static project lists
    expect(screen.getByText('Intern Coordination')).toBeInTheDocument(); // Alexandre's project
    expect(screen.getByText('Security Assessment')).toBeInTheDocument(); // Achraf's project
    
    // Restore original mock state
    mockUseAuth.isAuthenticated = originalIsAuthenticated;
    mockUseAuth.user = originalUser;
  });
});
