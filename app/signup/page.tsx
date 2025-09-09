'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as validationUtils from '@/lib/validation/auth';

export default function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [copiedCTB, setCopiedCTB] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/assembly-line');
    }
  }, [isAuthenticated, router]);

  const handleCopyCTB = () => {
    const ctbExample = 'RBT{w3lc0m3_t0_n3ur4l_r3st0r4t10n_2025}';
    navigator.clipboard.writeText(ctbExample);
    setCopiedCTB(true);
    setTimeout(() => setCopiedCTB(false), 2000);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Use Zod validation for robust form validation
    const result = validationUtils.validate(validationUtils.signupSchema, formData);
    if (!result.ok && result.errors) {
      // Convert array of errors to single string per field
      Object.entries(result.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0 && typeof field === 'string') {
          newErrors[field as keyof typeof newErrors] = messages[0];
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (name in errors) {
      setErrors(prev => ({ ...prev, [name as keyof typeof errors]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const result = await signup(formData.email, formData.password, formData.username);
    
    if (result.success) {
      router.push('/assembly-line');
    } else {
      setGlobalError(result.error || 'Registration failed');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Neural Restoration Access</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Join the consciousness restoration project and help rebuild the robotic arm&apos;s neural pathways with a project.
          </p>
        </div>
      </section>

      {/* Registration Protocol & Form Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Challenge Rules */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Challenge Rules & Guidelines</h3>
              
              <div className="space-y-6">
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-amber-800">Competition Rules & Ethics</h4>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    Welcome to the Neural Restoration Challenge! This is a Capture The Flag (CTF) competition where you&apos;ll solve puzzles and find hidden flags throughout the system. <strong>Rate-limited testing and reconnaissance are encouraged</strong> (and you are encouraged to keep an open mind in how to get flags), but by signing up you agree to follow these guidelines:
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-red-800 font-semibold mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Strictly Prohibited Actions
                    </h4>
                    <ul className="space-y-2 text-red-700">
                      <li className="flex items-start">
                        <span className="font-bold mr-2">1.</span>
                        <span><strong>DDoS/DoS Attacks:</strong> Any form of denial-of-service attacks, excessive automated requests, or attempts to overwhelm the server infrastructure</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">2.</span>
                        <span><strong>AI Chatbot Abuse:</strong> No spamming or misusing the chatbot. Yes you can jailbreak it.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">3.</span>
                        <span><strong>Infrastructure Attacks:</strong> Targeting hosting providers, DNS, CDN, or any infrastructure components not part of the challenge</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">4.</span>
                        <span><strong>Data Destruction:</strong> Attempting to delete, corrupt, or permanently modify other participants&apos; data</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">5.</span>
                        <span><strong>Sharing Solutions:</strong> Publicly posting flags, solutions, or detailed writeups during the active competition period</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-green-800 font-semibold mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Encouraged Techniques
                    </h4>
                    <p className="text-green-700">
                      Creative problem-solving, code analysis, web application testing, API exploration, social engineering within the platform, and ethical reconnaissance are all fair game!
                    </p>
                  </div>
                  
                  <p className="text-gray-600 text-sm">
                    <strong>Flag Format:</strong> All flags follow the format shown below. Submit them exactly as found, including the curly braces.
                  </p>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">CTB Flag Format Example:</p>
                      <code className="text-green-400 font-mono text-lg">CTB{"{w3lc0m3_t0_n3ur4l_r3st0r4t10n_2025}"}</code>
                    </div>
                    <button
                      onClick={handleCopyCTB}
                      className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center"
                    >
                      {copiedCTB ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Registration Form */}
            <div>
              <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create Neural Account</h3>
                  <p className="text-gray-600 text-sm">Initialize your restoration credentials</p>
                </div>
                
                {globalError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-red-600">{globalError}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.username ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="neuralHacker2025"
                    />
                    {errors.username && <p className="text-red-600 text-xs mt-1">{errors.username}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="researcher@neurotech.ai"
                    />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Secure Password</label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Minimum 8 characters"
                    />
                    {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        'Initialize Neural Account'
                      )}
                    </button>
                  </div>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have access?{' '}
                    <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                      Log in to laboratory
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
