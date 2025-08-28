import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { UserDataProvider, useUserData } from '../../app/contexts/UserDataContext';
import { useAuth } from '../../app/contexts/AuthContext';

// Mock dependencies
jest.mock('../../app/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test component to access context
const TestComponent = ({ onDataLoaded }: { onDataLoaded?: (data: any) => void }) => {
  const userData = useUserData();
  
  React.useEffect(() => {
    if (onDataLoaded) {
      onDataLoaded(userData);
    }
  }, [userData, onDataLoaded]);

  return (
    <div data-testid="user-data">
      <div data-testid="loading">{userData.isLoading.toString()}</div>
      <div data-testid="profile">{userData.profile?.full_name || 'null'}</div>
      <div data-testid="project">{userData.project?.name || 'null'}</div>
      <div data-testid="completed-challenges">{userData.completedChallengeIds.size}</div>
      <div data-testid="error">{userData.error || 'null'}</div>
    </div>
  );
};

describe('UserDataContext', () => {
  const mockAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  const mockProfileResponse = {
    profile: { id: '1', email: 'test@test.com', full_name: 'Test User', role: 'user', created_at: '2025-01-01' },
    stats: { total_points: 100, challenges_solved: 5, rank: 10, total_users: 50 },
    recent_submissions: [
      { challenge_id: 'ch1', points_awarded: 50, submitted_at: '2025-01-01', is_correct: true },
      { challenge_id: 'ch2', points_awarded: 30, submitted_at: '2025-01-01', is_correct: true },
      { challenge_id: 'ch3', points_awarded: 20, submitted_at: '2025-01-01', is_correct: false }
    ]
  };

  const mockProjectResponse = {
    projects: [{
      id: 'proj1',
      name: 'Test Project',
      description: 'A test project',
      neuralReconstruction: 75.5,
      logo: '🤖',
      aiStatus: 'Active',
      statusColor: 'green',
      leadDeveloper: 'Test Dev',
      lastBackup: '2025-01-01'
    }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should fetch user data when authenticated', async () => {
    // Mock authenticated user
    mockAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectResponse)
      });

    const onDataLoaded = jest.fn();

    render(
      <UserDataProvider>
        <TestComponent onDataLoaded={onDataLoaded} />
      </UserDataProvider>
    );

    // Initial loading state
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.getByTestId('profile')).toHaveTextContent('null');

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Verify data is loaded correctly
    expect(screen.getByTestId('profile')).toHaveTextContent('Test User');
    expect(screen.getByTestId('project')).toHaveTextContent('Test Project');
    expect(screen.getByTestId('completed-challenges')).toHaveTextContent('2'); // 2 correct submissions
    expect(screen.getByTestId('error')).toHaveTextContent('null');

    // Verify API calls were made correctly
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith('/api/profile');
    expect(mockFetch).toHaveBeenCalledWith('/api/projects');
  });

  it('should clear data when not authenticated', async () => {
    // Mock unauthenticated user
    mockAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    render(
      <UserDataProvider>
        <TestComponent />
      </UserDataProvider>
    );

    // Verify data is cleared
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('profile')).toHaveTextContent('null');
    expect(screen.getByTestId('project')).toHaveTextContent('null');
    expect(screen.getByTestId('completed-challenges')).toHaveTextContent('0');
    expect(screen.getByTestId('error')).toHaveTextContent('null');

    // Verify no API calls were made
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    mockAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    // Mock API error
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
        <TestComponent />
      </UserDataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Failed to load profile data');
  });

  it('should not re-fetch data on user object changes with same authentication state', async () => {
    const mockUser1 = { id: '1', email: 'test@test.com', name: 'Test User' };
    const mockUser2 = { id: '1', email: 'test@test.com', name: 'Test User' }; // Same data, different object

    mockAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUser1,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectResponse)
      });

    const { rerender } = render(
      <UserDataProvider>
        <TestComponent />
      </UserDataProvider>
    );

    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Clear fetch calls
    mockFetch.mockClear();

    // Re-render with different user object but same data
    mockAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUser2,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    rerender(
      <UserDataProvider>
        <TestComponent />
      </UserDataProvider>
    );

    // Wait a bit to ensure no additional calls are made
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify no additional API calls were made
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should provide correct completed challenge IDs set', async () => {
    mockAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectResponse)
      });

    let capturedData: any;
    const onDataLoaded = (data: any) => {
      capturedData = data;
    };

    render(
      <UserDataProvider>
        <TestComponent onDataLoaded={onDataLoaded} />
      </UserDataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Verify completed challenges Set contains correct IDs
    expect(capturedData.completedChallengeIds).toBeInstanceOf(Set);
    expect(capturedData.completedChallengeIds.has('ch1')).toBe(true);
    expect(capturedData.completedChallengeIds.has('ch2')).toBe(true);
    expect(capturedData.completedChallengeIds.has('ch3')).toBe(false); // is_correct: false
    expect(capturedData.completedChallengeIds.size).toBe(2);
  });

  it('should provide refetch functionality', async () => {
    mockAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectResponse)
      });

    let capturedData: any;
    const onDataLoaded = (data: any) => {
      capturedData = data;
    };

    render(
      <UserDataProvider>
        <TestComponent onDataLoaded={onDataLoaded} />
      </UserDataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Clear previous calls
    mockFetch.mockClear();

    // Mock new responses for refetch
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockProfileResponse,
          profile: { ...mockProfileResponse.profile, full_name: 'Updated User' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjectResponse)
      });

    // Call refetch
    await act(async () => {
      await capturedData.refetch();
    });

    // Verify refetch made new API calls
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('profile')).toHaveTextContent('Updated User');
  });
});
