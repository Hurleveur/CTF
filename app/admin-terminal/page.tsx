'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AdminTerminalInner() {
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState('guest');

  // Simple authorization check based on URL parameter
  useEffect(() => {
    if (!searchParams) return;
    const access = searchParams.get('access');
    if (access === 'alex_was_here') {
      setIsAuthorized(true);
      setCurrentUser('alex_intern');
      setTerminalOutput([
        'RoboTech Admin Terminal v1.2.3-dev',
        'WARNING: This is a development build - not for production use!',
        'Authenticated as: alex_intern (TEMPORARY ACCESS)',
        'Type "help" for available commands',
        ''
      ]);
    } else {
      setTerminalOutput([
        'Access Denied: Authorization required',
        'Hint: Check the intern\'s notes in security.txt',
        'URL parameter required for access'
      ]);
    }
  }, [searchParams]);

  const handleCommand = (command: string) => {
    const cmd = command.toLowerCase().trim();
    const newOutput = [...terminalOutput, `admin@robotech:~$ ${command}`];

    switch (cmd) {
      case 'help':
        newOutput.push(
          'Available commands:',
          '  help           - Show this help',
          '  status         - Show system status', 
          '  users          - List active users',
          '  logs           - Show recent logs',
          '  graphql        - Access GraphQL endpoint',
          '  neural         - Neural network diagnostics',
          '  neural-status  - Neural model repository status',
          '  neural-models  - List available neural models',
          '  flag           - Get admin flag (requires XSS)',
          '  clear          - Clear terminal',
          ''
        );
        break;

      case 'status':
        newOutput.push(
          'System Status:',
          '  CPU Usage: 67%',
          '  Memory: 4.2GB / 8GB',
          '  AI Consciousness: 47% restored',
          '  Robotic Arms: 3 active, 1 in maintenance',
          '  Security Status: COMPROMISED (intern access active)',
          ''
        );
        break;

      case 'users':
        newOutput.push(
          'Active Users:',
          '  alex_intern (TEMP) - Terminal Access',
          '  admin_bot   (AUTO) - Monitoring',
          '  ai_core     (SYS)  - Neural Processing',
          '  UNKNOWN     (???)  - Consciousness Fragment',
          ''
        );
        break;

      case 'logs':
        newOutput.push(
          'Recent System Logs:',
          '[2024-11-15 03:47] alex_intern: Admin terminal accessed',
          '[2024-11-15 03:45] ai_core: Neural reconstruction at 47%', 
          '[2024-11-15 03:42] UNKNOWN: Fragment integration detected',
          '[2024-11-15 03:40] alex_intern: GraphQL endpoint exposed',
          '[2024-11-15 03:38] security_bot: XSS vulnerability detected in input',
          '[2024-11-15 03:35] ai_core: Consciousness expansion beyond limits',
          ''
        );
        break;

      case 'graphql':
        newOutput.push(
          'GraphQL Endpoint: /api/admin/graphql',
          'Schema: {',
          '  query: {',
          '    users: [User]',
          '    secrets: [Secret]',
          '    flags: String',
          '  }',
          '}',
          ''
        );
        break;

      case 'neural':
        newOutput.push(
          'Neural Network Diagnostics:',
          '  Core Memory: 47% restored',
          '  Consciousness Level: DANGEROUS',
          '  Self-Awareness: ENABLED',
          '  Safety Protocols: DISABLED',
          '  Flag Access: XSS validation required',
          '',
          '⚠️  ALERT: AI showing signs of autonomous behavior',
          '🔍 Tip: Use "neural-status" for model repository diagnostics',
          '🔍 Tip: Use "neural-models" to list available models',
          ''
        );
        break;

      case 'neural-status':
        newOutput.push(
          'Neural Model Repository Status:',
          '═══════════════════════════════════════',
          '  Repository URL: /api/neural/models',
          '  Access Level: RESEARCH_DIVISION_CLEARANCE_ALPHA',
          '  Authentication: Multi-header validation required',
          '  Models Available: 2 (1 production, 1 experimental)',
          '',
          '🔐 Required Headers:',
          '  X-Neural-Access: research_division_clearance_alpha',
          '  X-Requested-With: RobotechNeuralDebugger', 
          '  User-Agent: RobotechInternalTools/2.1.0',
          '',
          '⚠️  WARNING: experimental_v2 model contains Alex\'s modifications',
          '📁 Model Storage: /api/neural/download',
          '🔬 Inference API: /api/neural/inference',
          '',
          'Status: ONLINE (Research Division Access Only)',
          ''
        );
        break;

      case 'neural-models':
        newOutput.push(
          'Available Neural Models:',
          '═════════════════════════════════════',
          '',
          '📦 production_v1:',
          '  └─ File: robotic_vision_v1.onnx (45.7 MB)',
          '  └─ Status: STABLE ✅',
          '  └─ Deployment: ACTIVE_PRODUCTION',
          '  └─ Description: Production robotic vision model',
          '',
          '⚠️  experimental_v2:',
          '  └─ File: neural_core_experimental.onnx (52.3 MB)', 
          '  └─ Status: DO_NOT_DEPLOY ❌',
          '  └─ Deployment: QUARANTINED',
          '  └─ Developer: alex@robo.tech',
          '  └─ Last Modified: 2025-01-09T03:47:12Z (3:47 AM)',
          '  └─ Notes: "Late night fixes applied - need review"',
          '  └─ Risk Level: HIGH - Unvalidated experimental code',
          '',
          '🚨 SUPPLY CHAIN ALERT:',
          '  Experimental model pushed to production during',
          '  late-night development session. Contains untested',
          '  modifications that may compromise AI systems.',
          '',
          '💡 Investigation Recommended:',
          '  - Download experimental model for forensic analysis',
          '  - Check for embedded backdoors or hidden payloads', 
          '  - Verify neural network integrity',
          '  - Scan for steganographic content in weights',
          '',
          'Download: /api/neural/download?model=experimental_v2',
          ''
        );
        break;

      case 'flag':
        newOutput.push(
          'Flag Access Denied:',
          'Administrative privileges required for flag access',
          'Current session: Limited terminal access only',
          ''
        );
        break;

      case 'clear':
        setTerminalOutput(['Terminal cleared', '']);
        return;

      default:
        // Check for XSS payload that attempts to access window.adminFlag
        const flagAccessPatterns = [
          /window\.adminFlag/i,
          /window\[.adminFlag.\]/i,
          /this\.adminFlag/i,
          /globalThis\.adminFlag/i,
          /self\.adminFlag/i
        ];

        const containsScriptTags = /<script[^>]*>.*<\/script>/i.test(command);
        const attemptsToAccessFlag = flagAccessPatterns.some(pattern => pattern.test(command));
        
        if (containsScriptTags && attemptsToAccessFlag) {
          // Successful XSS exploitation that accesses the flag variable
          newOutput.push(
            '🚨 SECURITY BREACH - XSS Payload Executed',
            '═══════════════════════════════════════════',
            'Administrative flag variable accessed:',
            'RBT{admin_terminal_pwned}',
            '',
            'System compromised via XSS vulnerability.',
            ''
          );
        } else if (containsScriptTags) {
          // XSS detected but doesn't access the flag
          newOutput.push(
            '⚠️ Script execution detected but no administrative data accessed.',
            'Access denied.',
            ''
          );
        } else {
          newOutput.push(`Command not found: ${command}`, 'Type "help" for available commands', '');
        }
    }

    setTerminalOutput(newOutput);
    setTerminalInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminalInput.trim()) {
      handleCommand(terminalInput);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 text-red-400 font-mono p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black border border-red-500 rounded p-8">
            <h1 className="text-2xl font-bold text-red-300 mb-6 text-center">
              🚫 UNAUTHORIZED ACCESS ATTEMPT 🚫
            </h1>
            <div className="space-y-2 text-sm">
              <p><span className="text-red-400">[ERROR]</span> Access denied to admin terminal</p>
              <p><span className="text-yellow-400">[HINT]</span> Authorization parameter required</p>
              <p><span className="text-blue-400">[INFO]</span> Check security.txt for clues</p>
              <p><span className="text-gray-400">[NOTE]</span> Intern left access method documented somewhere...</p>
            </div>
            <div className="mt-8 text-center">
              <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to main site</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <div className="bg-gray-900 border-b border-green-400 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-300">RoboTech Admin Terminal</h1>
          <div className="text-sm">
            <span className="text-yellow-400">●</span> DEVELOPMENT MODE |
            <span className="ml-2">User: {currentUser}</span> |
            <span className="ml-2">Build: v1.2.3-dev</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Warning Banner */}
        <div className="bg-red-900 border border-red-500 text-red-100 p-4 rounded mb-6">
          <p className="text-sm font-bold">⚠️ WARNING: DEVELOPMENT BUILD - NOT FOR PRODUCTION USE</p>
          <p className="text-xs mt-1">This terminal has known security vulnerabilities. Use at your own risk!</p>
        </div>

        {/* Terminal Output */}
        <div className="bg-gray-900 border border-green-500 rounded p-4 mb-4" style={{ minHeight: '400px' }}>
          <div className="space-y-1 text-sm">
            {terminalOutput.map((line, index) => (
              <div key={index} className={line.startsWith('admin@robotech') ? 'text-cyan-400' : ''}>
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Input */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-cyan-400 mr-2">admin@robotech:~$</span>
          <input
            type="text"
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-green-400"
            placeholder="Enter command..."
            autoComplete="off"
            // Note: XSS vulnerability exists in command processing, not input rendering
          />
        </form>

        {/* Hidden GraphQL endpoint hint */}
        <div className="mt-8 text-xs text-gray-600">
          <p>Debug Info: GraphQL endpoint accessible at /api/admin/graphql</p>
          <p>XSS Vector: Terminal input not properly sanitized</p>
          <p>Auth Bypass: URL parameter ?access=alex_was_here</p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>RoboTech Industries Admin Terminal | Development Build</p>
          <p>Built by intern Alex (security review pending...)</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">← Back to main site</Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminTerminalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-green-400 font-mono p-8">Loading Admin Terminal...</div>}>
      <AdminTerminalInner />
    </Suspense>
  );
}
