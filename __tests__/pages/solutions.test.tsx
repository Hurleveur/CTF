import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../../app/contexts/AuthContext';
import { useProjects } from '../../app/contexts/ProjectContext';
import SolutionsPage from '../../app/solutions/page';

// Mock the contexts
jest.mock('../../app/contexts/AuthContext');
jest.mock('../../app/contexts/ProjectContext');

// Mock fetch globally
global.fetch = jest.fn();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;

describe('SolutionsPage Statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      signup: jest.fn(),
      isLoading: false,
    });

    mockUseProjects.mockReturnValue({
      projects: [],
      addProject: jest.fn(),
      setProjects: jest.fn(),
      removeProject: jest.fn(),
      updateProject: jest.fn(),
    });
  });

  it('should display loading state initially', async () => {
    // Mock the statistics API call
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/statistics')) {
        return new Promise(() => {}); // Never resolves to keep loading state
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });

    render(<SolutionsPage />);

    // Check for loading states in statistics
    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
  });

  it('should display statistics data when API call succeeds', async () => {
    // Mock successful statistics API response
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/statistics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              fragmentsFound: 25,
              teams: 12,
              projects: 8,
              neuralProgress: 156,
              avgSolveTime: '3-5 hours'
            }
          })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });

    render(<SolutionsPage />);

    // Wait for the statistics to load
    await waitFor(() => {
      expect(screen.getByText('25 restored')).toBeInTheDocument();
      expect(screen.getByText('12 active')).toBeInTheDocument();
      expect(screen.getByText('8 projects running')).toBeInTheDocument();
      expect(screen.getByText('3-5 hours')).toBeInTheDocument();
    });
  });

  it('should display error state when API call fails', async () => {
    // Mock failed statistics API response
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/statistics')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Server error' })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });

    render(<SolutionsPage />);

    // Wait for error state
    await waitFor(() => {
      const errorMarkers = screen.getAllByText('—');
      expect(errorMarkers.length).toBeGreaterThan(0);
    });
  });

  it('should display statistics section headers correctly', () => {
    render(<SolutionsPage />);

    expect(screen.getByText('Consciousness Restoration Metrics')).toBeInTheDocument();
    expect(screen.getByText('Restoration Teams')).toBeInTheDocument();
    expect(screen.getByText('Fragments Found')).toBeInTheDocument();
    expect(screen.getByText('Projects Active')).toBeInTheDocument();
    expect(screen.getByText('Avg Restoration')).toBeInTheDocument();
  });

  it('should handle network error gracefully', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/statistics')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });

    render(<SolutionsPage />);

    // Wait for error state
    await waitFor(() => {
      const errorMarkers = screen.getAllByText('—');
      expect(errorMarkers.length).toBeGreaterThan(0);
    });
  });
});
