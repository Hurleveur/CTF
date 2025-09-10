import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SolutionsPage from '../app/projects/page';

// Mock the ProjectContext
let mockProjects: any[] = [];
const mockSetProjects = jest.fn((projects) => {
  mockProjects = projects;
});

const mockUseProjects = {
  get projects() { return mockProjects; },
  addProject: jest.fn(),
  setProjects: mockSetProjects,
};

jest.mock('../app/contexts/ProjectContext', () => ({
  useProjects: () => mockUseProjects
}));

// Mock the AuthContext
const mockUseAuth = {
  isAuthenticated: true,
  user: { email: 'test@example.com', id: '123', name: 'Test User' },
  login: jest.fn(),
  logout: jest.fn()
};

jest.mock('../app/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ProjectsPage Loading Indicator', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockSetProjects.mockClear();
    mockProjects = []; // Reset projects array
  });

  test('shows project loading indicator when fetching projects', async () => {
    // Mock slow API responses to test loading state
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/statistics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              fragmentsFound: 10,
              teams: 5,
              projects: 3,
              neuralProgress: 45,
              avgSolveTime: '3-5 hours'
            }
          })
        });
      }
      if (url.includes('/api/projects/all')) {
        return new Promise(() => {}); // Never resolves to keep loading state
      }
      return Promise.reject('Unknown URL');
    });

    render(<SolutionsPage />);
    
    // Should show project loading indicator
    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    expect(screen.getByText('Fetching neural reconstruction data from all active projects...')).toBeInTheDocument();
    
    // Should have spinning loader
    const spinner = screen.getByText('Loading projects...').parentElement?.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-blue-600');
    
    // Should still show the projects grid (even if empty) while loading
    const projectGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(projectGrid).toBeInTheDocument();
  });

  test('hides project loading indicator after projects load', async () => {
    // Mock successful API responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/statistics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              fragmentsFound: 10,
              teams: 5,
              projects: 3,
              neuralProgress: 45,
              avgSolveTime: '3-5 hours'
            }
          })
        });
      }
      if (url.includes('/api/projects/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            projects: [
              {
                id: 1,
                name: 'Test Project',
                description: 'A test project',
                logo: '🤖',
                aiStatus: 'Basic Motor Functions',
                statusColor: 'red',
                neuralReconstruction: 25.5,
                lastBackup: '2025-01-01',
                leadDeveloper: 'Test Developer'
              }
            ],
            stats: {
              totalProjects: 1,
              totalTeams: 1
            }
          })
        });
      }
      return Promise.reject('Unknown URL');
    });

    render(<SolutionsPage />);
    
    // Initially should show loading
    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    
    // Wait for the API call to complete and loading to disappear
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/all');
    });

    // After loading completes, should not show loading indicator
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify setProjects was called with the fetched data
    expect(mockSetProjects).toHaveBeenCalledWith([
      {
        id: 1,
        name: 'Test Project',
        description: 'A test project',
        logo: '🤖',
        aiStatus: 'Basic Motor Functions',
        statusColor: 'red',
        neuralReconstruction: 25.5,
        lastBackup: '2025-01-01',
        leadDeveloper: 'Test Developer'
      }
    ]);
  });

  test('shows loading indicator with correct styling', () => {
    // Mock slow loading
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<SolutionsPage />);
    
    const loadingContainer = screen.getByText('Loading projects...').parentElement?.parentElement;
    
    // Check container styling
    expect(loadingContainer).toHaveClass('text-center', 'py-8', 'mb-8');
    
    // Check text styling
    const loadingText = screen.getByText('Loading projects...');
    expect(loadingText.parentElement).toHaveClass('flex', 'items-center', 'justify-center', 'mb-4');
    expect(loadingText).toHaveClass('text-gray-600', 'text-lg');
    
    // Check subtitle
    const subtitle = screen.getByText('Fetching neural reconstruction data from all active projects...');
    expect(subtitle).toHaveClass('text-gray-500', 'text-sm');
  });

  test('loading indicator shows during projects fetch but not statistics fetch', async () => {
    let resolveStats: (value: any) => void;
    let resolveProjects: (value: any) => void;

    const statsPromise = new Promise(resolve => { resolveStats = resolve; });
    const projectsPromise = new Promise(resolve => { resolveProjects = resolve; });

    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/statistics')) {
        return statsPromise;
      }
      if (url.includes('/api/projects/all')) {
        return projectsPromise;
      }
      return Promise.reject('Unknown URL');
    });

    render(<SolutionsPage />);
    
    // Should show project loading indicator initially
    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    
    // Resolve statistics first
    resolveStats!({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          fragmentsFound: 10,
          teams: 5,
          projects: 3,
          neuralProgress: 45,
          avgSolveTime: '3-5 hours'
        }
      })
    });

    // Should still show project loading (projects haven't loaded yet)
    await waitFor(() => {
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    // Resolve projects
    resolveProjects!({
      ok: true,
      json: () => Promise.resolve({
        projects: [],
        stats: { totalProjects: 0, totalTeams: 0 }
      })
    });

    // Should hide project loading after projects resolve
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });
  });
});
