import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppData } from '../../data';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Trophy, ArrowLeft, Coffee, LogOut, ChevronLeft } from 'lucide-react';
import { Role, User } from '../../types';

interface PublicLeaderboardProps {
  appData: AppData;
  currentUser?: User;
  onExit: () => void;
  onLogout?: () => void;
}

// Coffee Cup Logo Component
const CoffeeCupLogo: React.FC<{ size?: number }> = ({ size = 48 }) => {
    return (
        <div 
            className="relative"
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
            >
                {/* Cup Body */}
                <rect x="20" y="30" width="50" height="40" rx="4" fill="#6B4423" stroke="#3D2817" strokeWidth="1.5" />
                
                {/* Cup Highlight */}
                <rect x="22" y="32" width="8" height="32" rx="3" fill="#8B5A2B" opacity="0.6" />
                
                {/* Handle */}
                <path
                    d="M 75 40 Q 90 40 90 50 Q 90 60 75 60"
                    fill="none"
                    stroke="#6B4423"
                    strokeWidth="3"
                />
                
                {/* Handle Highlight */}
                <path
                    d="M 76 42 Q 85 42 85 50 Q 85 58 76 58"
                    fill="none"
                    stroke="#8B5A2B"
                    strokeWidth="1.5"
                    opacity="0.5"
                />
                
                {/* Coffee inside */}
                <rect x="22" y="35" width="46" height="30" fill="#4A2511" opacity="0.8" />
                
                {/* Saucer */}
                <ellipse cx="45" cy="75" rx="32" ry="8" fill="#8B5A2B" stroke="#3D2817" strokeWidth="1.5" />
                <ellipse cx="45" cy="74" rx="32" ry="6" fill="#A0704D" opacity="0.6" />
            </svg>
        </div>
    );
};

// Smooth transition styles
const transitionStyles = `
  html, body, #root {
    background-color: white;
    margin: 0;
    padding: 0;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .transition-smooth {
    animation: fadeIn 0.4s ease-in-out;
  }
`;

const PublicLeaderboard: React.FC<PublicLeaderboardProps> = ({ appData, currentUser, onExit, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the redirect path from the query parameter
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/';
  
  // Use provided currentUser or try to get from data
  const user = currentUser || (appData as any).currentUser;

  const rankedSamples = useMemo(() => {
    return appData.samples
      .filter(sample => {
        const farmer = appData.users.find(u => u.id === sample.farmerId);
        return (
          sample.adjudicatedFinalScore !== undefined &&
          sample.adjudicatedFinalScore > 0 &&
          sample.sampleType !== 'CALIBRATION' && // Exclude calibration samples from leaderboard
          farmer?.roles.includes(Role.FARMER) // Ensure only farmers' samples are displayed
        );
      })
      .sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0));
  }, [appData.samples, appData.users]);

  const getRankSuffix = (rank: number) => {
      if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
      switch(rank % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
      }
  }

  // Main leaderboard layout with sidebar
  return (
    <>
    <style>{transitionStyles}</style>
    <div className="fixed inset-0 bg-white flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 shadow-sm overflow-y-auto flex flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-100 flex flex-col items-center gap-2">
            <CoffeeCupLogo size={56} />
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Cupping Lab</h1>
              <p className="text-xs text-gray-500">Coffee Quality</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col p-4 gap-2 flex-1">
            <button
              onClick={() => navigate('/qgrader-dashboard')}
              className="w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <Coffee size={18} />
              <span>Cup Samples</span>
            </button>
            <button
              className="w-full px-4 py-3 text-sm font-medium transition-colors duration-200 flex items-center gap-3 rounded-lg bg-primary text-white shadow-md"
            >
              <Trophy size={18} />
              <span>Leaderboard</span>
            </button>
          </nav>

          {/* Q Grader Profile Section at Bottom */}
          {user && (
            <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
              {/* Profile Card */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 w-full">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase() || 'Q'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-600">Q Grader</span>
                  <span className="text-xs font-bold text-gray-800 truncate">{user?.name || 'Q Grader'}</span>
                </div>
              </div>

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-white to-blue-50/30">
          <div className="p-6">
            <Card className="transition-smooth">
              <div className="flex items-center gap-3 mb-8">
                <Trophy className="text-primary" size={32} />
                <h1 className="text-3xl font-extrabold text-text-dark">Official Results</h1>
              </div>
              
              <p className="text-text-light mb-6 text-center md:text-left">Golden Bean Championship 2024</p>

              {rankedSamples.length > 0 ? (
                <div className="space-y-3">
                  {rankedSamples.map((sample, index) => {
                    const rank = index + 1;
                    const farmer = appData.users.find(u => u.id === sample.farmerId);
                    let rankColor = 'bg-surface';
                    if (rank === 1) rankColor = 'bg-yellow-400 text-yellow-900';
                    if (rank === 2) rankColor = 'bg-gray-300 text-gray-800';
                    if (rank === 3) rankColor = 'bg-yellow-600 text-yellow-100';

                    return (
                      <div key={sample.id} className="bg-surface border border-border rounded-lg p-4 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-xl font-bold ${rankColor}`}>
                            {rank}
                        </div>
                        <div className="flex-grow">
                            <p className="font-bold text-lg text-text-dark">{sample.farmName}</p>
                            <p className="text-sm text-text-light">{farmer?.name} | {sample.region}</p>
                            <p className="text-xs font-mono mt-1 text-primary">{sample.variety} - {sample.processingMethod}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-bold text-primary">{sample.adjudicatedFinalScore?.toFixed(2)}</p>
                            <p className="text-xs text-text-light">Final Score</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-light text-lg">Final results have not been published yet. Please check back later.</p>
                </div>
              )}
            </Card>
          </div>
        </div>

      </div>
    </div>
    </>
  );
};

export default PublicLeaderboard;
