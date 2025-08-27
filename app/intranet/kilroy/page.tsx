export default function IntranetKilroyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono">
      {/* Terminal-style header */}
      <div className="p-4 border-b border-green-400">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">RoboTech Intranet - Employee Portal v2.1</h1>
          <div className="text-sm">
            <span className="text-yellow-400">●</span> Connected | 
            <span className="ml-2">Terminal ID: EMP-001</span>
          </div>
        </div>
        <div className="text-sm text-gray-400 mt-2">
          Last accessed: 2024-11-01 03:30:47 UTC
        </div>
      </div>

      <div className="p-6">
        {/* ASCII Art Banner */}
        <pre className="text-center text-green-300 mb-8 text-xs overflow-x-auto">
{`██╗  ██╗██╗██╗     ██████╗  ██████╗ ██╗   ██╗
██║ ██╔╝██║██║     ██╔══██╗██╔═══██╗╚██╗ ██╔╝
█████╔╝ ██║██║     ██████╔╝██║   ██║ ╚████╔╝ 
██╔═██╗ ██║██║     ██╔══██╗██║   ██║  ╚██╔╝  
██║  ██╗██║███████╗██║  ██║╚██████╔╝   ██║   
╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝    ╚═╝   
                                              
        KILROY WAS HERE - EMPLOYEE PORTAL`}
        </pre>

        {/* Welcome Message */}
        <div className="bg-gray-800 border border-green-400 p-6 rounded mb-6">
          <h2 className="text-lg font-bold text-green-300 mb-4">Employee Access Terminal</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-yellow-400">[INFO]</span> Welcome to the RoboTech employee intranet</p>
            <p><span className="text-blue-400">[NOTE]</span> This system is for authorized personnel only</p>
            <p><span className="text-red-400">[WARN]</span> All activities are monitored and logged</p>
          </div>
        </div>

        {/* Classic "Kilroy was here" drawing */}
        <div className="bg-black border border-green-400 p-4 rounded mb-6">
          <pre className="text-center text-green-400 text-xs">
{`     ┌─────────────────────────────┐
     │ Kilroy was here!           │
     └─────────────────────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              │    ╔═══════════════╗    │
              │    ║   ◉       ◉   ║    │
              │    ║               ║    │
              │    ║       ∩       ║    │
              │    ╚═══════════════╝    │
              │                         │
              └─────────────────────────┘`}
          </pre>
        </div>

        {/* Employee message */}
        <div className="bg-gray-800 border border-green-400 p-6 rounded mb-6">
          <h3 className="text-green-300 font-bold mb-4">Employee Message Board</h3>
          <div className="space-y-4 text-sm">
            <div className="border-l-2 border-yellow-400 pl-4">
              <div className="text-yellow-400 font-bold">Alex D. - Intern</div>
              <div className="text-gray-300">Posted: 2024-11-01 03:30</div>
              <p className="mt-2">
                Hey team! Left a little easter egg here for anyone who finds this old portal.
                Classic "Kilroy was here" seemed appropriate for an abandoned intranet page.
                
                If you're reading this, you probably followed the breadcrumbs from robots.txt.
                Nice detective work! Here's your reward:
              </p>
              <div className="mt-4 p-3 bg-black border border-cyan-400 rounded">
                <p className="text-cyan-400 font-mono">
                  Flag: <span className="text-white">RBT{`{intranet_kilroy_was_here}`}</span>
                </p>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                P.S. There are more secrets scattered around. Keep exploring! 
                The consciousness fragments are everywhere...
              </p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div className="bg-gray-800 border border-green-400 p-4 rounded">
          <h3 className="text-green-300 font-bold mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <a href="/" className="text-blue-400 hover:text-blue-300">← Back to Main Site</a>
            <a href="/robots.txt" className="text-blue-400 hover:text-blue-300">robots.txt</a>
            <a href="/sitemap.xml" className="text-blue-400 hover:text-blue-300">sitemap.xml</a>
            <a href="/security.txt" className="text-blue-400 hover:text-blue-300">security.txt</a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>RoboTech Industries Employee Portal | Version 2.1.3</p>
          <p>© 2024 RoboTech Industries | Not for external access</p>
          <p className="mt-2 text-yellow-600">
            Warning: This page should have been decommissioned months ago...
          </p>
        </div>
      </div>
    </div>
  );
}
