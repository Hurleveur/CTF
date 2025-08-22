// Test setup file for the Robotics CTF project
// This file ensures proper mocking of global objects needed for testing

// Mock the Request object for testing since it's not available in Jest environment
if (typeof global.Request === 'undefined') {
  global.Request = class MockRequest {
    method: string;
    body: string | null;
    headers: Headers;
    url: string;

    constructor(input: string | URL, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.toString();
      this.method = init?.method || 'GET';
      this.body = init?.body ? String(init.body) : null;
      this.headers = new Headers(init?.headers);
    }

    async json() {
      if (!this.body) {
        throw new Error('No body');
      }
      return JSON.parse(this.body);
    }
  } as any;
}

// Mock the Response object for testing
if (typeof global.Response === 'undefined') {
  global.Response = class MockResponse {
    status: number;
    statusText: string;
    headers: Headers;
    body: any;

    constructor(body?: any, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
    }

    async json() {
      return this.body;
    }

    static json(data: any, init?: ResponseInit) {
      return new MockResponse(data, init);
    }
  } as any;
}

// Mock the Headers object if not available
if (typeof global.Headers === 'undefined') {
  global.Headers = class MockHeaders {
    private headers: Map<string, string>;

    constructor(init?: HeadersInit) {
      this.headers = new Map();
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.headers.set(key, value));
        } else if (init instanceof Headers) {
          init.forEach((value, key) => this.headers.set(key, value));
        } else {
          Object.entries(init).forEach(([key, value]) => this.headers.set(key, value));
        }
      }
    }

    set(name: string, value: string) {
      this.headers.set(name.toLowerCase(), value);
    }

    get(name: string) {
      return this.headers.get(name.toLowerCase()) || null;
    }

    has(name: string) {
      return this.headers.has(name.toLowerCase());
    }

    forEach(callback: (value: string, key: string) => void) {
      this.headers.forEach((value, key) => callback(value, key));
    }
  } as any;
}

// Mock console.log to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
