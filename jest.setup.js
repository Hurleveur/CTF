import '@testing-library/jest-dom';

// Polyfills for Next.js 15 web APIs
import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'stream/web';

// Add polyfills to global scope
Object.assign(global, {
  TextDecoder,
  TextEncoder,
  ReadableStream,
  WritableStream,
  TransformStream,
});

// Mock Web APIs for Next.js 15
const mockHeaders = class Headers {
  constructor(init) {
    this._headers = new Map();
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this._headers.set(key.toLowerCase(), value));
      } else if (init instanceof Headers) {
        init.forEach((value, key) => this._headers.set(key, value));
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
    }
  }
  
  append(name, value) { 
    this._headers.set(name.toLowerCase(), value); 
  }
  delete(name) { 
    this._headers.delete(name.toLowerCase()); 
  }
  get(name) { 
    return this._headers.get(name.toLowerCase()) || null; 
  }
  has(name) { 
    return this._headers.has(name.toLowerCase()); 
  }
  set(name, value) { 
    this._headers.set(name.toLowerCase(), value); 
  }
  forEach(callback, thisArg) {
    this._headers.forEach((value, key) => {
      callback.call(thisArg, value, key, this);
    });
  }
  keys() { 
    return this._headers.keys(); 
  }
  values() { 
    return this._headers.values(); 
  }
  entries() { 
    return this._headers.entries(); 
  }
  [Symbol.iterator]() {
    return this._headers.entries();
  }
};

const mockRequest = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method || 'GET';
    this.headers = new mockHeaders(init.headers);
    this.body = init.body || null;
    this.bodyUsed = false;
    this.cache = init.cache || 'default';
    this.credentials = init.credentials || 'same-origin';
    this.destination = init.destination || '';
    this.integrity = init.integrity || '';
    this.keepalive = init.keepalive || false;
    this.mode = init.mode || 'cors';
    this.redirect = init.redirect || 'follow';
    this.referrer = init.referrer || 'about:client';
    this.referrerPolicy = init.referrerPolicy || '';
    this.signal = init.signal || null;
  }
  
  async arrayBuffer() {
    this.bodyUsed = true;
    return new ArrayBuffer(0);
  }
  
  async blob() {
    this.bodyUsed = true;
    return new Blob([]);
  }
  
  async formData() {
    this.bodyUsed = true;
    return new FormData();
  }
  
  async json() {
    this.bodyUsed = true;
    return this.body ? JSON.parse(this.body) : {};
  }
  
  async text() {
    this.bodyUsed = true;
    return this.body || '';
  }
  
  clone() {
    return new Request(this.url, this);
  }
};

const mockResponse = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.bodyUsed = false;
    this.headers = new mockHeaders(init.headers);
    this.ok = (init.status || 200) >= 200 && (init.status || 200) < 300;
    this.redirected = init.redirected || false;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.type = init.type || 'default';
    this.url = init.url || '';
  }
  
  async arrayBuffer() {
    this.bodyUsed = true;
    return new ArrayBuffer(0);
  }
  
  async blob() {
    this.bodyUsed = true;
    return new Blob([this.body]);
  }
  
  async formData() {
    this.bodyUsed = true;
    return new FormData();
  }
  
  async json() {
    this.bodyUsed = true;
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
  
  async text() {
    this.bodyUsed = true;
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
  
  clone() {
    return new Response(this.body, this);
  }
  
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  }
  
  static error() {
    return new Response(null, { status: 0, statusText: '' });
  }
  
  static redirect(url, status = 302) {
    return new Response(null, { status, headers: { location: url } });
  }
};

// Add to global scope
Object.assign(global, {
  Headers: mockHeaders,
  Request: mockRequest,
  Response: mockResponse,
  fetch: jest.fn(),
});

// Mock Next.js server APIs
const mockNextRequest = class NextRequest extends mockRequest {
  constructor(input, init = {}) {
    super(input, init);
    this.nextUrl = new URL(this.url);
    this.ip = '127.0.0.1';
    this.geo = {};
    this.cookies = new Map();
  }
};

const mockNextResponse = class NextResponse extends mockResponse {
  static json(data, init) {
    return new mockNextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  }
  
  static redirect(url, status = 302) {
    return new mockNextResponse(null, { status, headers: { location: url } });
  }
  
  static rewrite(destination) {
    return new mockNextResponse(null, { headers: { 'x-middleware-rewrite': destination } });
  }
  
  static next() {
    return new mockNextResponse(null, { headers: { 'x-middleware-next': '1' } });
  }
};

// Mock Next.js server module
jest.doMock('next/server', () => ({
  NextRequest: mockNextRequest,
  NextResponse: mockNextResponse,
}));

// Mock Supabase environment variables and client
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Global Supabase client mock
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    refreshSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
};

// Mock Supabase client creation functions
jest.doMock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

jest.doMock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
  createClientSync: () => mockSupabaseClient,
  createServiceRoleClient: () => mockSupabaseClient,
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn()
  })),
  usePathname: jest.fn(() => '/')
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console.error and console.warn in tests unless they are expected
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
