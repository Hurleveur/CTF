import { GET, POST } from '@/app/api/hello/route';

// Mock the NextRequest object for testing
const mockRequest = (method: string, body?: any): Request => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('host', 'localhost:3000');
  
  return new Request('http://localhost:3000/api/hello', {
    method: method,
    body: body ? JSON.stringify(body) : undefined,
    headers: headers,
  });
};

describe('API Route Security', () => {
  // Test case for the GET request
  it('should return a success message for GET requests', async () => {
    const request = mockRequest('GET');
    const response = await GET(request);
    
    // Check for a 200 OK status code
    expect(response.status).toBe(200);

    // Check if the response body contains the expected success message
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.message).toBe('Hello from a secure API endpoint!');
  });

  // Test case for the POST request with valid data
  it('should process a valid POST request and return a success message', async () => {
    const request = mockRequest('POST', { data: 'test_data' });
    const response = await POST(request);
    
    // Check for a 200 OK status code
    expect(response.status).toBe(200);

    // Check if the response body contains the processed data
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.message).toContain('test_data');
  });

  // Test case for the POST request with an invalid data type
  it('should reject a POST request with invalid data', async () => {
    const request = mockRequest('POST', { data: 123 }); // Number instead of string
    const response = await POST(request);

    // Check for a 400 Bad Request status code
    expect(response.status).toBe(400);

    // Check for the specific error message
    const data = await response.json();
    expect(data.status).toBe('error');
    expect(data.message).toBe('Invalid input. Data must be a non-empty string.');
  });
  
  // Test case for a potential XSS payload
  it('should sanitize a POST request with an XSS payload', async () => {
    const xssPayload = 'Hello <script>alert("xss")</script> World';
    const request = mockRequest('POST', { data: xssPayload });
    const response = await POST(request);
    
    // The response should be a 200 OK because it successfully processed the request,
    // but the payload should be sanitized.
    expect(response.status).toBe(200);

    const data = await response.json();
    // The sanitized output should not contain the script tag.
    expect(data.message).not.toContain('<script>');
  });
});
