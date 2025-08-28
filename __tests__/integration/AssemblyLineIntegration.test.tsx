import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { UserDataProvider } from '../../app/contexts/UserDataContext';
import { useAuth } from '../../app/contexts/AuthContext';
import { useProjects } from '../../app/contexts/ProjectContext';
import { useRouter } from 'next/navigation';
import AssemblyLinePage from '../../app/assembly-line/page';

// Mock dependencies
jest.mock('../../app/contexts/AuthContext');
jest.mock('../../app/contexts/ProjectContext');
jest.mock('next/navigation');

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

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    replaceState: jest.fn(),
  },
  writable: true
});

// Mock AudioContext
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
  currentTime: 0,
  state: 'running',
  resume: jest.fn(),
  close: jest.fn()
};

Object.defineProperty(window, 'AudioContext', {
  value: jest.fn(() => mockAudioContext)
});

describe('Assembly Line Integration', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

  const mockProfileResponse = {
    profile: { id: '1', email: 'test@test.com', full_name: 'Test User', role: 'user', created_at: '2025-01-01' },
    stats: { total_points: 100, challenges_solved: 5, rank: 10, total_users: 50 },
    recent_submissions: [
      { challenge_id: 'ch1', points_awarded: 50, submitted_at: '2025-01-01', is_correct: true },
      { challenge_id: 'ch2', points_awarded: 30, submitted_at: '2025-01-01', is_correct: true }
    ]
  };

  const mockProjectResponse = {
    projects: [{
      id: 'proj1',
      name: 'Test Project',
      description: 'A test project',
      neuralReconstruction: 25.5, // Above 10% to trigger advanced challenges
      logo: '🤖',
      aiStatus: 'Active',
      statusColor: 'green',
      leadDeveloper: 'Test Dev',
      lastBackup: '2025-01-01'
    }]
  };

  const mockChallengesResponse = {
    challenges: [
      {
        id: 'adv1',
        title: 'Advanced Challenge 1',
        description: 'A difficult challenge',
        category: 'web',
        difficulty: 'hard',
        points: 200
      },
      {
        id: 'adv2',
        title: 'Advanced Challenge 2',
        description: 'Another difficult challenge',
        category: 'crypto',
        difficulty: 'medium',
        points: 150
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();

    // Mock router
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    });

    // Mock projects context
    mockUseProjects.mockReturnValue({
      projects: [],
      addProject: jest.fn(),
      updateProject: jest.fn(),
      isLoading: false
    });
  });

  it('should fetch data once and share it between components', async () => {
    // Mock authenticated user
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    // Mock API responses - profile, projects, challenges
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockChallengesResponse)
      });

    render(
      <UserDataProvider>
        <AssemblyLinePage />
      </UserDataProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your project...')).not.toBeInTheDocument();
    });

    // Verify project data is displayed
    expect(screen.getByText('Test Project - Code Restoration Lab')).toBeInTheDocument();
    expect(screen.getByText('Neural Reconstruction: 25.5%')).toBeInTheDocument();

    // Wait for advanced challenges to load (triggered by neuralReconstruction > 10)
    await waitFor(() => {
      expect(screen.getByText('2 Advanced Protocols Detected')).toBeInTheDocument();
    });

    // Verify advanced challenges are displayed with correct completion status
    await waitFor(() => {
      expect(screen.getByText('Advanced Challenge 1')).toBeInTheDocument();
      expect(screen.getByText('Advanced Challenge 2')).toBeInTheDocument();
      expect(screen.getByText('2/2 COMPLETED')).toBeInTheDocument(); // Both challenges should show as completed
    });

    // Verify API call pattern:
    // 1. /api/profile - for user data and submissions
    // 2. /api/projects - for project data  
    // 3. /api/challenges - for advanced challenges
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/profile');
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/projects');
    expect(mockFetch).toHaveBeenNthCalledWith(3, '/api/challenges');

    // Verify that NO additional API calls for submissions were made by AdvancedChallengesPanel
    expect(mockFetch).not.toHaveBeenCalledWith('/api/challenges/submissions');
  });

  it('should not fetch data when not authenticated', async () => {
    // Mock unauthenticated user
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    });

    render(
      <UserDataProvider>
        <AssemblyLinePage />
      </UserDataProvider>
    );

    // Should redirect to login
    expect(mockPush).toHaveBeenCalledWith('/login');

    // Should not make any API calls
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle API errors without breaking the UI', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    // Mock API errors
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      });

    render(
      <UserDataProvider>
        <AssemblyLinePage />
      </UserDataProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your project...')).not.toBeInTheDocument();
    });

    // Should show no project state instead of crashing
    expect(screen.getByText('No Project Found')).toBeInTheDocument();

    // Should still have made the API calls
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should show loading state during data fetch', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    // Mock delayed responses
    let resolveProfile: any;
    let resolveProject: any;
    
    const profilePromise = new Promise(resolve => {
      resolveProfile = resolve;
    });
    const projectPromise = new Promise(resolve => {
      resolveProject = resolve;
    });

    mockFetch
      .mockReturnValueOnce(Promise.resolve({
        ok: true,
        json: () => profilePromise
      }))
      .mockReturnValueOnce(Promise.resolve({
        ok: true,
        json: () => projectPromise
      }));

    render(
      <UserDataProvider>
        <AssemblyLinePage />
      </UserDataProvider>
    );

    // Should show loading state
    expect(screen.getByText('Loading your project...')).toBeInTheDocument();

    // Resolve the promises
    await act(async () => {
      resolveProfile(mockProfileResponse);
      resolveProject(mockProjectResponse);
      await Promise.resolve(); // Allow promises to resolve
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your project...')).not.toBeInTheDocument();
    });

    // Should show project data
    expect(screen.getByText('Test Project - Code Restoration Lab')).toBeInTheDocument();
  });

  it('should refetch data when refetch is called', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    // Initial API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectResponse)
      });

    render(
      <UserDataProvider>
        <AssemblyLinePage />
      </UserDataProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Project - Code Restoration Lab')).toBeInTheDocument();
    });

    // Clear fetch calls
    mockFetch.mockClear();

    // Mock updated responses for refetch
    const updatedProjectResponse = {
      projects: [{
        ...mockProjectResponse.projects[0],
        neuralReconstruction: 85.0 // Updated progress
      }]
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedProjectResponse)
      });

    // Find and click a submit button to trigger refetch (simulating successful submission)
    const submitButton = screen.getByText('Restore Code Fragment');
    
    // Mock successful submission response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        correct: true,
        points_awarded: 100,
        challenge_title: 'Test Challenge',
        progress_increment: 10
      })
    });

    // Submit a code (this will trigger refetch after successful submission)
    const codeInput = screen.getByPlaceholderText(/Enter code fragment/);
    await act(async () => {
      codeInput.dispatchEvent(new Event('input', { bubbles: true }));
      (codeInput as HTMLInputElement).value = 'RBT{test_flag}';
      submitButton.click();
    });

    // Wait for the refetch to complete (happens after successful submission)
    await waitFor(() => {
      expect(screen.getByText('Neural Reconstruction: 85.0%')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify refetch API calls were made
    expect(mockFetch).toHaveBeenCalledWith('/api/profile');
    expect(mockFetch).toHaveBeenCalledWith('/api/projects');
  });
});
