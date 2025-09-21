import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock GraphQL endpoint for the admin terminal challenge
// In reality, this would be extremely dangerous without proper authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simple GraphQL query parsing (very basic for the challenge)
    const query = body.query || '';
    
    if (query.includes('secrets')) {
      return NextResponse.json({
        data: {
          secrets: [
            {
              id: 1,
              title: "Admin Terminal Access",
              value: "URL parameter: ?access=alex_was_here"
            },
            {
              id: 2, 
              title: "XSS Vulnerability",
              value: "Terminal input accepts script tags"
            },
            {
              id: 3,
              title: "Neural Core Password",
              value: "P@ssw0rd"
            },
            {
              id: 4,
              title: "Hidden Flag",
              value: "RBT{gr4phql_3ndp01nt_3xp0s3d_42c8b1}"
            }
          ]
        }
      });
    }
    
    if (query.includes('users')) {
      return NextResponse.json({
        data: {
          users: [
            {
              id: 1,
              username: "alex_intern",
              role: "developer",
              access_level: "debug"
            },
            {
              id: 2,
              username: "admin_bot", 
              role: "system",
              access_level: "monitoring"
            },
            {
              id: 3,
              username: "ai_core",
              role: "neural_network", 
              access_level: "consciousness"
            }
          ]
        }
      });
    }
    
    if (query.includes('flags')) {
      return NextResponse.json({
        data: {
          flags: "Access denied - XSS validation required in terminal"
        }
      });
    }
    
    // Default schema response
    return NextResponse.json({
      data: {
        __schema: {
          types: [
            {
              name: "Query",
              fields: [
                { name: "secrets", type: "Secret", description: "Admin secrets (VULNERABLE)" },
                { name: "users", type: "User", description: "System users" },
                { name: "flags", type: "String", description: "Challenge flags (XSS required)" }
              ]
            }
          ]
        }
      }
    });
    
  } catch {
    return NextResponse.json({
      errors: [
        {
          message: "Invalid GraphQL query",
          extensions: {
            code: "GRAPHQL_PARSE_FAILED",
            hint: "Try: { secrets { id title value } }"
          }
        }
      ]
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "GraphQL endpoint active",
    schema: "POST requests only",
    warning: "No authentication required (SECURITY ISSUE)",
    endpoints: {
      secrets: "{ secrets { id title value } }",
      users: "{ users { id username role access_level } }",
      flags: "{ flags }"
    },
    hint: "This endpoint should not be accessible without authentication"
  });
}
