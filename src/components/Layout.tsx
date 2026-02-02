import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Pill, Heart, Users, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen gradient-bg">
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50 animate-slide-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Pill className="h-8 w-8 text-white animate-pulse-slow" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">PillBridge</h1>
                <p className="text-sm text-gray-600 font-medium">Medication Care Made Simple</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-lg font-bold text-gray-900">{userProfile?.full_name}</p>
                <p className="text-sm font-medium capitalize">
                  {userProfile?.role === 'caregiver' ? (
                    <span className="flex items-center justify-end text-indigo-600">
                      <Users className="h-4 w-4 mr-1" />
                      Caregiver
                    </span>
                  ) : (
                    <span className="flex items-center justify-end text-blue-600">
                      <Heart className="h-4 w-4 mr-1" />
                      Patient
                    </span>
                  )}
                </p>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-semibold">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
      
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
    </div>
  );
}