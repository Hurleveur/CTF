import Link from 'next/link';

export const metadata = {
  title: 'Privacy Control Manual - RoboTech Industries',
  description: 'Privacy policy and cookie information for RoboTech Industries platform',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Control Manual</h1>
        <p className="text-xl text-gray-600">
          RoboTech Industries Data Protection & Cookie Management System
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-lg mx-auto">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()} | 
                <strong> Version:</strong> 1.0 | 
                <strong> System Status:</strong> <span className="text-green-600">Operational</span>
              </p>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🤖</span>
            Data Processing Overview
          </h2>
          <p className="text-gray-700 mb-4">
            RoboTech Industries respects your privacy and is committed to protecting your personal data. 
            This Privacy Control Manual explains how we collect, use, and protect your information when you 
            interact with our robotics platform and manufacturing systems.
          </p>
          <p className="text-gray-700">
            We operate under a principle of <strong>data minimization</strong> - we only collect and process 
            the data necessary for our systems to function efficiently and provide you with the best possible experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🍪</span>
            Cookie & Storage Technology
          </h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🎉 Good News: No Cookie Consent Required!</h3>
            <p className="text-blue-700">
              RoboTech Industries only uses <strong>essential authentication cookies</strong>. All your project data is securely stored in our database, not in your browser. This means <strong>no cookie banner is needed</strong> under GDPR!
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Essential System Cookies Only</h3>
            <p className="text-gray-700 mb-3">
              These cookies are strictly necessary for our platform to function:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li><strong>sb-access-token:</strong> Your authentication token for secure access</li>
              <li><strong>sb-refresh-token:</strong> Automatically refreshes your session</li>
              <li><strong>sb-provider-token:</strong> OAuth provider authentication</li>
              <li><strong>sb-user:</strong> Your user session metadata</li>
            </ul>
            <p className="text-sm text-gray-600 mt-3">
              <strong>Legal Basis:</strong> Legitimate interest (essential for service functionality)
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Database-Stored User Data</h3>
            <p className="text-gray-700 mb-3">
              Your robotics projects and configurations are stored securely in our database:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li><strong>🤖 Robotics Project Data:</strong> Stored in PostgreSQL with Row Level Security</li>
              <li><strong>🔒 Access Control:</strong> You can only access your own projects</li>
              <li><strong>📋 Cross-Device Sync:</strong> Available on all your devices when logged in</li>
              <li><strong>🛡️ Data Protection:</strong> Encrypted at rest and in transit</li>
            </ul>
            <p className="text-sm text-green-700 mt-3">
              <strong>Benefits:</strong> No data loss, works across devices, no consent needed, more secure than browser storage
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🔧</span>
            Managing Your Data (send us a mail)
          </h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Control Options</h3>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>View & Update:</strong> Access your account dashboard to view and modify your personal data
              </div>
              <div>
                <strong>Data Export:</strong> Request a copy of your robotics project data in machine-readable format
              </div>
              <div>
                <strong>Account Deletion:</strong> Permanently delete your account and all associated data
              </div>
              <div>
                <strong>Cookie Management:</strong> Change your consent preferences through your browser settings
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🛡️</span>
            Security Protocols
          </h2>
          <p className="text-gray-700 mb-4">
            Our security measures include:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            <li>End-to-end encryption for data transmission</li>
            <li>Multi-factor authentication for administrative access</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Automated threat detection and response systems</li>
            <li>Secure data centers with physical access controls</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📞</span>
            Contact Information
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 mb-2">
              <strong>All roles guy (actual email, don&apos;t spam it, don&apos;t bother trying to login with it guys):</strong> mail.robotech@gmx.com
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">⚖️</span>
            Legal Information
          </h2>
          <p className="text-gray-700 mb-4">
            This Privacy Control Manual complies with the General Data Protection Regulation (GDPR)
          </p>
          <p className="text-sm text-gray-600">
            We reserve the right to update this policy as our systems evolve. 
            Material changes will be communicated through your account dashboard.
          </p>
        </section>

        {/* Navigation back to site */}
        <div className="text-center pt-8 border-t border-gray-200">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to RoboTech Mainframe
          </Link>
        </div>
      </div>
    </div>
  );
}
