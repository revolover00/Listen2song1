import React from 'react';
import { useMusic } from '../store/musicStore';
import { Home, Search, Library, PlusSquare, Heart, Music, Tv, Laptop, LogOut, User as UserIcon, Flame } from 'lucide-react';

interface SidebarProps {
  activeTab: 'home' | 'search' | 'library' | 'stats';
  setActiveTab: (tab: 'home' | 'search' | 'library' | 'stats') => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { playlists, createPlaylist, likes, user, logout, selectPlaylist, isTvMode, setIsTvMode } = useMusic();

  const handleCreatePlaylist = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const name = prompt('Enter playlist name:');
    if (name) {
      createPlaylist(name, 'My brand new custom playlist.');
    }
  };

  return (
    <aside className="w-64 bg-black flex flex-col h-full p-4 space-y-4 shrink-0 max-md:hidden">
      {/* Logo */}
      <div className="flex items-center space-x-2 px-2 py-1 mb-2">
        <div className="p-1.5 bg-spotify-green text-black rounded-lg">
          <Music className="h-6 w-6 stroke-[2.5]" />
        </div>
        <span className="text-xl font-display font-bold text-white tracking-tight">listen2song</span>
      </div>

      {/* Primary Navigation */}
      <nav className="bg-spotify-light rounded-xl p-3 flex flex-col space-y-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center space-x-4 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors w-full text-left ${activeTab === 'home' ? 'text-white bg-spotify-highlight' : 'text-gray-400 hover:text-white'}`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center space-x-4 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors w-full text-left ${activeTab === 'search' ? 'text-white bg-spotify-highlight' : 'text-gray-400 hover:text-white'}`}
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center space-x-4 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors w-full text-left ${activeTab === 'library' ? 'text-white bg-spotify-highlight' : 'text-gray-400 hover:text-white'}`}
        >
          <Library className="h-5 w-5" />
          <span>Your Library</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-colors w-full text-left ${activeTab === 'stats' ? 'text-white bg-spotify-highlight' : 'text-gray-400 hover:text-white'}`}
        >
          <span className="flex items-center space-x-4">
            <Flame className="h-5 w-5 text-spotify-green animate-pulse" />
            <span>Wrapped Stats</span>
          </span>
          <span className="bg-spotify-green/20 text-spotify-green text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90">Hot</span>
        </button>
      </nav>

      {/* Playlist and Likes Navigation */}
      <div className="bg-spotify-light rounded-xl p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 text-gray-400">
          <div className="flex items-center space-x-2">
            <PlusSquare className="h-5 w-5 hover:text-white cursor-pointer" onClick={handleCreatePlaylist} />
            <span className="text-xs font-bold uppercase tracking-wider">Playlists</span>
          </div>
        </div>

        <button
          onClick={() => {
            setActiveTab('library');
          }}
          className="flex items-center space-x-3 px-3 py-2 hover:text-white text-gray-400 text-sm font-semibold transition-colors mt-2"
        >
          <div className="p-1.5 bg-gradient-to-br from-indigo-700 to-purple-500 rounded text-white">
            <Heart className="h-4 w-4 fill-white" />
          </div>
          <span>Liked Songs ({likes.length})</span>
        </button>

        <div className="flex-1 overflow-y-auto mt-3 border-t border-spotify-highlight pt-2 space-y-1">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => {
                selectPlaylist(pl.id);
                setActiveTab('library');
              }}
              className="w-full text-left px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white truncate rounded hover:bg-spotify-highlight/40 transition-colors"
            >
              {pl.name}
            </button>
          ))}
          {playlists.length === 0 && (
            <div className="text-xs text-gray-500 px-3 py-2 italic">
              No custom playlists yet.
            </div>
          )}
        </div>
      </div>

      {/* Switch to Smart TV mode & User controls */}
      <div className="bg-spotify-light rounded-xl p-3 flex flex-col space-y-3">
        {/* TV Mode Toggle */}
        <button
          onClick={() => setIsTvMode(!isTvMode)}
          className={`flex items-center justify-between w-full p-2 rounded-lg text-xs font-bold transition-all border ${isTvMode ? 'bg-spotify-green/10 text-spotify-green border-spotify-green' : 'bg-spotify-highlight/40 text-gray-400 border-transparent hover:text-white'}`}
        >
          <span className="flex items-center space-x-2">
            <Tv className="h-4 w-4" />
            <span>Smart TV Mode</span>
          </span>
          <span className="px-1.5 py-0.5 bg-black/40 text-[10px] rounded border border-white/10 uppercase tracking-widest text-white">
            {isTvMode ? 'On' : 'Off'}
          </span>
        </button>

        {user ? (
          <div className="flex items-center justify-between px-2 pt-1 border-t border-spotify-highlight">
            <div className="flex items-center space-x-2 min-w-0">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80'}
                alt={user.displayName}
                className="h-7 w-7 rounded-full object-cover shrink-0 border border-spotify-highlight"
              />
              <span className="text-xs font-bold text-white truncate">{user.displayName}</span>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-spotify-highlight transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-center space-x-2 bg-white text-black font-bold py-2 px-3 rounded-full hover:scale-105 active:scale-95 transition-all text-xs"
          >
            <UserIcon className="h-4 w-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
};
