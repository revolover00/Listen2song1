import React, { useState } from 'react';
import { MusicProvider, useMusic } from './store/musicStore';
import { Sidebar } from './components/Sidebar';
import { HomeDashboard } from './components/HomeDashboard';
import { PlayerBar } from './components/PlayerBar';
import { MiniPlayer } from './components/MiniPlayer';
import { TvInterface } from './components/TvInterface';
import { AuthModal } from './components/AuthModal';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { Sparkles, Tv, User as UserIcon, LogOut, Radio } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, logout, isTvMode, setIsTvMode, isStreamingMode, setIsStreamingMode } = useMusic();
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'stats'>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden relative selection:bg-spotify-green selection:text-black">
      {/* Smart TV spatial overlay */}
      {isTvMode && <TvInterface />}

      {/* Main workspace layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Primary View Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Dashboard Nav */}
          <header className="h-16 shrink-0 bg-spotify-dark/95 border-b border-spotify-highlight/20 px-6 flex items-center justify-between">
            {/* Audio Signal / Live Streaming Indicator */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-spotify-light px-3 py-1.5 rounded-full border border-spotify-highlight/40">
                <Radio className={`h-4 w-4 ${isStreamingMode ? 'text-spotify-green animate-pulse' : 'text-gray-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  {isStreamingMode ? 'Broadcast Stream Live' : 'Local Playback'}
                </span>
              </div>
            </div>

            {/* User Profile & Smart Controls */}
            <div className="flex items-center space-x-4">
              {/* TV Mode Shortcut */}
              <button
                onClick={() => setIsTvMode(true)}
                className="flex items-center space-x-2 text-xs font-bold bg-spotify-highlight hover:bg-spotify-highlight/80 text-white px-3.5 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                title="Open Smart TV Interface"
              >
                <Tv className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">TV Mode</span>
              </button>

              {/* Authentication Trigger */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-spotify-highlight/80 rounded-full px-3 py-1.5 border border-spotify-green/20">
                    <UserIcon className="h-3.5 w-3.5 text-spotify-green" />
                    <span className="text-xs font-bold text-white truncate max-w-[100px]">
                      {user.email.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-spotify-highlight rounded-full transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition-all"
                >
                  Log In
                </button>
              )}
            </div>
          </header>

          {/* Dynamic home view body with sliding transitions */}
          <HomeDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        </div>
      </div>

      {/* Player controllers */}
      <PlayerBar />
      <MiniPlayer />

      {/* Auth Modals */}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}

      {/* Fullscreen Player Viewport */}
      <FullscreenPlayer />
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
}
