'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Hardcoded company data
const COMPANIES = [
  {
    id: 1,
    name: 'TechCorp Manufacturing',
    logo: '🏭',
    description: 'Advanced electronics manufacturing',
    status: 'active',
    productionLine: 'Line A-1',
    efficiency: 94.2,
    lastMaintenance: '2025-01-15'
  },
  {
    id: 2,
    name: 'RoboAssembly Inc.',
    logo: '🤖',
    description: 'Robotic component assembly',
    status: 'maintenance',
    productionLine: 'Line B-3',
    efficiency: 87.8,
    lastMaintenance: '2025-01-10'
  },
  {
    id: 3,
    name: 'Precision Parts Co.',
    logo: '⚙️',
    description: 'High-precision mechanical parts',
    status: 'active',
    productionLine: 'Line C-2',
    efficiency: 96.5,
    lastMaintenance: '2025-01-18'
  }
];

export default function AssemblyLinePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState<typeof COMPANIES[0] | null>(null);
  const [assemblyStatus, setAssemblyStatus] = useState('idle');
  const [productionCount, setProductionCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (selectedCompany) {
      // Simulate assembly line activity
      const interval = setInterval(() => {
        if (assemblyStatus === 'running') {
          setProductionCount(prev => prev + 1);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [selectedCompany, assemblyStatus]);

  const handleCompanyLogin = (company: typeof COMPANIES[0]) => {
    setSelectedCompany(company);
    setAssemblyStatus('idle');
    setProductionCount(0);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const toggleAssemblyLine = () => {
    setAssemblyStatus(prev => prev === 'running' ? 'stopped' : 'running');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Assembly Line Control</h1>
              {selectedCompany && (
                <div className="ml-6 flex items-center">
                  <span className="text-sm text-gray-500">Logged into:</span>
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {selectedCompany.logo} {selectedCompany.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedCompany ? (
          /* Company Selection */
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Company to Login</h2>
              <p className="text-gray-600">Choose a company to access their assembly line controls</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {COMPANIES.map((company) => (
                <div
                  key={company.id}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCompanyLogin(company)}
                >
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{company.logo}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-600">{company.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        company.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {company.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Production Line:</span>
                      <span className="font-medium">{company.productionLine}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Efficiency:</span>
                      <span className="font-medium">{company.efficiency}%</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                    Login to Company
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Assembly Line Control */
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCompany.name} - Assembly Line Control
                </h2>
                <p className="text-gray-600">Production Line: {selectedCompany.productionLine}</p>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Switch Company
              </button>
            </div>

            {/* Assembly Line Visualization */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assembly Line Status</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${
                    assemblyStatus === 'running' ? 'bg-green-100 text-green-600' :
                    assemblyStatus === 'stopped' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {assemblyStatus === 'running' ? '▶️' : assemblyStatus === 'stopped' ? '⏸️' : '⏸️'}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 capitalize">{assemblyStatus}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    {productionCount}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">Units Produced</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600">
                    {selectedCompany.efficiency}%
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">Efficiency</p>
                </div>
              </div>

              {/* Assembly Line Animation */}
              <div className="relative bg-gray-100 rounded-lg p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Production Line Visualization</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={toggleAssemblyLine}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        assemblyStatus === 'running'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {assemblyStatus === 'running' ? 'Stop Line' : 'Start Line'}
                    </button>
                  </div>
                </div>
                
                <div className="relative h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg">
                  {/* Conveyor Belt */}
                  <div className={`absolute top-1/2 left-0 w-full h-4 bg-gray-400 transform -translate-y-1/2 ${
                    assemblyStatus === 'running' ? 'animate-pulse' : ''
                  }`}></div>
                  
                  {/* Moving Parts */}
                  {assemblyStatus === 'running' && (
                    <>
                      <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-blue-500 rounded-full transform -translate-y-1/2 animate-bounce"></div>
                      <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-green-500 rounded-full transform -translate-y-1/2 animate-bounce" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute top-1/2 left-3/4 w-8 h-8 bg-red-500 rounded-full transform -translate-y-1/2 animate-bounce" style={{animationDelay: '1s'}}></div>
                    </>
                  )}
                  
                  {/* Station Indicators */}
                  <div className="absolute top-2 left-4 w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="absolute top-2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2"></div>
                  <div className="absolute top-2 right-4 w-3 h-3 bg-yellow-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Company Name</p>
                  <p className="font-medium">{selectedCompany.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Production Line</p>
                  <p className="font-medium">{selectedCompany.productionLine}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Efficiency</p>
                  <p className="font-medium">{selectedCompany.efficiency}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Maintenance</p>
                  <p className="font-medium">{selectedCompany.lastMaintenance}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
