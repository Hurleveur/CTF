import { 
  consentedStorage, 
  getConsentStatus, 
  hasConsentDecision, 
  isFunctionalStorageAllowed,
  clearFunctionalData,
  initializeConsentStorage
} from '@/lib/consentedStorage';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};

// Mock window object
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('ConsentedStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('getConsentStatus', () => {
    it('should return functional=true when consent is given', () => {
      localStorageMock.getItem.mockReturnValue('functional');
      
      const status = getConsentStatus();
      
      expect(status.functional).toBe(true);
      expect(status.analytics).toBe(false);
      expect(status.advertising).toBe(false);
    });

    it('should return functional=false when consent is declined', () => {
      localStorageMock.getItem.mockReturnValue('declined');
      
      const status = getConsentStatus();
      
      expect(status.functional).toBe(false);
      expect(status.analytics).toBe(false);
      expect(status.advertising).toBe(false);
    });

    it('should return all false when no consent given', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const status = getConsentStatus();
      
      expect(status.functional).toBe(false);
      expect(status.analytics).toBe(false);
      expect(status.advertising).toBe(false);
    });
  });

  describe('hasConsentDecision', () => {
    it('should return true when consent is given', () => {
      localStorageMock.getItem.mockReturnValue('functional');
      expect(hasConsentDecision()).toBe(true);
    });

    it('should return true when consent is declined', () => {
      localStorageMock.getItem.mockReturnValue('declined');
      expect(hasConsentDecision()).toBe(true);
    });

    it('should return false when no consent decision', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(hasConsentDecision()).toBe(false);
    });
  });

  describe('isFunctionalStorageAllowed', () => {
    it('should return true when functional consent given', () => {
      localStorageMock.getItem.mockReturnValue('functional');
      expect(isFunctionalStorageAllowed()).toBe(true);
    });

    it('should return false when consent declined', () => {
      localStorageMock.getItem.mockReturnValue('declined');
      expect(isFunctionalStorageAllowed()).toBe(false);
    });

    it('should return false when no consent given', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(isFunctionalStorageAllowed()).toBe(false);
    });
  });

  describe('consentedStorage.setItem', () => {
    it('should allow setting consent items regardless of consent status', () => {
      localStorageMock.getItem.mockReturnValue('declined'); // Consent declined
      
      const result = consentedStorage.setItem('rt-cookie-consent', 'functional');
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('rt-cookie-consent', 'functional');
    });

    it('should allow setting items when functional consent given', () => {
      localStorageMock.getItem.mockReturnValue('functional'); // Consent given
      
      const result = consentedStorage.setItem('robotech-projects', '{"test": "data"}');
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('robotech-projects', '{"test": "data"}');
    });

    it('should block setting items when consent declined', () => {
      localStorageMock.getItem.mockReturnValue('declined'); // Consent declined
      
      const result = consentedStorage.setItem('robotech-projects', '{"test": "data"}');
      
      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('robotech-projects', '{"test": "data"}');
    });

    it('should block setting items when no consent given', () => {
      localStorageMock.getItem.mockReturnValue(null); // No consent
      
      const result = consentedStorage.setItem('user-preferences', '{"theme": "dark"}');
      
      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('user-preferences', '{"theme": "dark"}');
    });
  });

  describe('consentedStorage.getItem', () => {
    it('should always allow reading items', () => {
      localStorageMock.getItem.mockReturnValue('{"test": "data"}');
      
      const result = consentedStorage.getItem('robotech-projects');
      
      expect(result).toBe('{"test": "data"}');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('robotech-projects');
    });
  });

  describe('consentedStorage.removeItem', () => {
    it('should always allow removing items', () => {
      const result = consentedStorage.removeItem('robotech-projects');
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('robotech-projects');
    });
  });

  describe('clearFunctionalData', () => {
    beforeEach(() => {
      // Mock localStorage.length and key method for iteration
      localStorageMock.length = 4;
      localStorageMock.key
        .mockReturnValueOnce('rt-cookie-consent')  // Should be preserved
        .mockReturnValueOnce('sb-access-token')    // Should be preserved (Supabase)
        .mockReturnValueOnce('robotech-projects')  // Should be removed
        .mockReturnValueOnce('user-preferences');  // Should be removed
    });

    it('should clear functional data but preserve essential cookies', () => {
      clearFunctionalData();
      
      // Should not remove consent or Supabase cookies
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('rt-cookie-consent');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('sb-access-token');
      
      // Should remove functional data
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('robotech-projects');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user-preferences');
    });
  });

  describe('initializeConsentStorage', () => {
    it('should clear functional data if consent was previously declined', () => {
      localStorageMock.getItem.mockReturnValue('declined');
      localStorageMock.length = 2;
      localStorageMock.key
        .mockReturnValueOnce('rt-cookie-consent')
        .mockReturnValueOnce('robotech-projects');
      
      initializeConsentStorage();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('robotech-projects');
    });

    it('should not clear data if consent was given', () => {
      localStorageMock.getItem.mockReturnValue('functional');
      
      initializeConsentStorage();
      
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });
});

describe('ConsentedStorage Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage is full');
    });

    const result = consentedStorage.setItem('rt-cookie-consent', 'functional');
    
    expect(result).toBe(false);
  });

  it('should handle getItem errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage access denied');
    });

    const result = consentedStorage.getItem('test-key');
    
    expect(result).toBe(null);
  });
});
