import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Music, 
  Play, 
  Disc, 
  Heart, 
  Compass, 
  ListMusic, 
  Plus, 
  Trash, 
  FolderPlus, 
  LogOut, 
  LogIn, 
  ChevronDown, 
  Music2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Track, Playlist } from '../types/index';
import { searchTracks } from '../services/youtube';
import { dbGetTracks } from '../services/firebase';
import { UserProfile } from '../services/auth';

interface HomeProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  user: UserProfile | null;
  likedTrackIds: string[];
  likedTracks: Track[];
  playlists: Playlist[];
  onSelectTrack: (track: Track, queue: Track[]) => void;
  onToggleLike: (trackOrId: Track | string) => Promise<void>;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onCreatePlaylist: (name: string, description?: string) => Promise<void>;
  onAddTrackToPlaylist: (playlistId: string, trackOrId: Track | string) => Promise<void>;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
}

type TabType = 'explore' | 'favorites' | 'playlists';

export const Home: React.FC<HomeProps> = ({
  currentTrack,
  isPlaying,
  user,
  likedTrackIds,
  likedTracks,
  playlists,
  onSelectTrack,
  onToggleLike,
  onLoginClick,
  onLogoutClick,
  onCreatePlaylist,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialTracks, setInitialTracks] = useState<Track[]>([]);
  
  // Playlist creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  // Selected playlist for detailed view
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  
  // Dropdown tracker for "Add to playlist" menus on each track card
  const [activeDropdownTrackId, setActiveDropdownTrackId] = useState<string | null>(null);

  // Load popular pre-seeded tracks on mount
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const preseeded = await dbGetTracks();
        setInitialTracks(preseeded);
        setTracks(preseeded);
      } catch (e) {
        console.error('Error loading initial tracks:', e);
      }
    };
    fetchInitial();
  }, []);

  // Sync selected playlist if it is modified externally (e.g. tracks added/removed)
  useEffect(() => {
    if (selectedPlaylist) {
      const updated = playlists.find(p => p.id === selectedPlaylist.id);
      if (updated) {
        setSelectedPlaylist(updated);
      } else {
        setSelectedPlaylist(null);
      }
    }
  }, [playlists, selectedPlaylist]);

  // Handle Search input
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setTracks(initialTracks);
      return;
    }

    setLoading(true);
    try {
      const results = await searchTracks(query);
      setTracks(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear search and reset
  const clearSearch = () => {
    setQuery('');
    setTracks(initialTracks);
  };

  // Handle new playlist submission
  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlaylistError(null);
    if (!newPlaylistName.trim()) {
      setPlaylistError('اسم قائمة التشغيل مطلوب.');
      return;
    }

    try {
      await onCreatePlaylist(newPlaylistName, newPlaylistDesc);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreateForm(false);
    } catch (err: any) {
      setPlaylistError(err.message || 'حدث خطأ أثناء إنشاء قائمة التشغيل.');
    }
  };

  // Switch tabs and reset temporary sub-states
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedPlaylist(null);
    setActiveDropdownTrackId(null);
  };

  // Helper to resolve track details by ID
  const getTrackById = (id: string): Track | null => {
    // Check initialTracks and current search results
    const found = [...initialTracks, ...tracks].find(t => t.id === id);
    if (found) return found;
    
    // Check in the likedTracks prop if available
    if (likedTracks) {
      const likedFound = likedTracks.find(t => t.id === id);
      if (likedFound) return likedFound;
    }
    
    // Check in the selectedPlaylist's embedded tracks if any
    if (selectedPlaylist && selectedPlaylist.tracks) {
      const playlistFound = selectedPlaylist.tracks.find(t => t.id === id);
      if (playlistFound) return playlistFound;
    }
    
    // Check in other playlists' embedded tracks
    for (const p of playlists) {
      if (p.tracks) {
        const foundInPlaylist = p.tracks.find(t => t.id === id);
        if (foundInPlaylist) return foundInPlaylist;
      }
    }

    // Fallback to currentTrack if not loaded yet
    if (currentTrack && currentTrack.id === id) return currentTrack;
    return null;
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-black text-zinc-100" dir="rtl">
      {/* Responsive Shell: Sidebar on Desktop, hidden on Mobile */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col w-64 bg-zinc-950 p-6 border-l border-zinc-900/60 shrink-0 gap-6"
      >
        <div className="flex items-center gap-2 px-2">
          <Disc className="w-8 h-8 text-[#1DB954] animate-spin-slow shrink-0" />
          <span className="font-extrabold text-xl tracking-tight text-white font-sans ltr">
            listen2song
          </span>
        </div>

        <nav className="flex flex-col gap-4 text-sm font-semibold text-zinc-400">
          <button
            onClick={() => handleTabChange('explore')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer text-right ${
              activeTab === 'explore' ? 'bg-zinc-900 text-white' : 'hover:text-white'
            }`}
          >
            <Compass className={`w-5 h-5 ${activeTab === 'explore' ? 'text-[#1DB954]' : ''}`} />
            <span>الرئيسية / استكشاف</span>
          </button>
          
          <div className="h-[1px] bg-zinc-900 my-1"></div>
          
          <div className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
            مجموعتك الموسيقية
          </div>
          
          <button 
            onClick={() => handleTabChange('favorites')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer text-right ${
              activeTab === 'favorites' ? 'bg-zinc-900 text-white' : 'hover:text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'text-[#1DB954] fill-[#1DB954]' : ''}`} />
            <span>الأغاني المفضلة</span>
          </button>

          <button 
            onClick={() => handleTabChange('playlists')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer text-right ${
              activeTab === 'playlists' ? 'bg-zinc-900 text-white' : 'hover:text-white'
            }`}
          >
            <ListMusic className={`w-5 h-5 ${activeTab === 'playlists' ? 'text-[#1DB954]' : ''}`} />
            <span>قوائم التشغيل</span>
          </button>
        </nav>

        {/* User Info Authentication (Bottom of Sidebar) */}
        <div className="mt-auto border-t border-zinc-900 pt-4 flex flex-col gap-3">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-850">
                <div className="w-9 h-9 rounded-full bg-[#1DB954] text-black flex items-center justify-center font-bold text-sm shrink-0">
                  {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">{user.displayName || 'مستمع متميز'}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onLogoutClick}
                className="w-full text-center text-xs text-red-500 hover:text-red-400 font-semibold py-2 rounded-xl hover:bg-zinc-900/60 transition-all cursor-pointer border border-transparent hover:border-red-500/10"
              >
                <div className="flex items-center justify-center gap-2">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-500 text-center leading-relaxed">سجل دخولك لحفظ أغانيك المفضلة وإنشاء قوائم تشغيل سحابية</p>
              <button
                onClick={onLoginClick}
                className="w-full text-center text-xs bg-white text-black hover:bg-[#1DB954] hover:text-black font-extrabold py-2.5 rounded-full transition-all cursor-pointer shadow-md transform active:scale-95"
              >
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول / التسجيل</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-32">
        {/* Navigation / Header */}
        <header className="sticky top-0 bg-black/80 backdrop-blur-md z-10 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900/40">
          <div className="md:hidden flex items-center gap-2">
            <Disc className="w-6 h-6 text-[#1DB954]" />
            <span className="font-extrabold text-lg text-white">listen2song</span>
          </div>

          {/* Search Form (Only show on 'explore' tab) */}
          {activeTab === 'explore' ? (
            <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
              <input
                id="search-input"
                type="text"
                placeholder="ابحث عن أغنية، فنان، أو ألبوم..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-11 pr-11 pl-4 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
              />
              <button
                id="search-submit-btn"
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-label="بحث"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <div className="text-sm font-bold text-zinc-400">
              {activeTab === 'favorites' ? 'قسم الأغاني المفضلة الخاص بك' : 'قسم قوائم التشغيل الخاصة بك'}
            </div>
          )}

          {/* User controls / Auth trigger for both desktop header & mobile header */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {user ? (
              <div className="md:hidden flex items-center gap-2">
                <span className="text-xs text-zinc-400">{user.displayName || 'مستمع'}</span>
                <button
                  onClick={onLogoutClick}
                  className="p-1 text-red-500 hover:text-red-400 transition-colors"
                  aria-label="خروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="md:hidden text-xs text-black font-extrabold bg-white hover:bg-[#1DB954] hover:text-black px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                تسجيل الدخول
              </button>
            )}
          </div>
        </header>

        {/* Tab Navigation for Mobile (sticky below header) */}
        <div className="md:hidden flex border-b border-zinc-900 bg-zinc-950 p-2 justify-around text-xs font-semibold text-zinc-400">
          <button 
            onClick={() => handleTabChange('explore')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full ${activeTab === 'explore' ? 'bg-zinc-900 text-white' : ''}`}
          >
            <Compass className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
          <button 
            onClick={() => handleTabChange('favorites')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full ${activeTab === 'favorites' ? 'bg-zinc-900 text-white' : ''}`}
          >
            <Heart className="w-4 h-4" />
            <span>المفضلة</span>
          </button>
          <button 
            onClick={() => handleTabChange('playlists')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full ${activeTab === 'playlists' ? 'bg-zinc-900 text-white' : ''}`}
          >
            <ListMusic className="w-4 h-4" />
            <span>قوائمي</span>
          </button>
        </div>

        {/* MAIN BODY SWITCH CONTENT */}
        <div className="px-6 py-6 flex flex-col gap-8 max-w-7xl mx-auto w-full">
          
          {/* TAB 1: EXPLORE VIEW */}
          {activeTab === 'explore' && (
            <>
              {/* Tracks Section */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {query ? `نتائج البحث عن: ${query}` : 'المقترحات الأكثر شعبية اليوم'}
                  </h3>
                  {query && (
                    <button
                      onClick={clearSearch}
                      className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      إلغاء البحث
                    </button>
                  )}
                </div>

                {loading ? (
                  /* Loading Skeleton Grid */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="bg-zinc-900/50 rounded-xl p-4 flex flex-col gap-3 animate-pulse">
                        <div className="aspect-square w-full rounded-md bg-zinc-800"></div>
                        <div className="h-4 w-3/4 rounded bg-zinc-800"></div>
                        <div className="h-3 w-1/2 rounded bg-zinc-800"></div>
                      </div>
                    ))}
                  </div>
                ) : tracks.length === 0 ? (
                  /* Empty Search Results State */
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Music className="w-8 h-8 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-base">لم نجد أي نتائج</p>
                      <p className="text-zinc-500 text-sm mt-1">تأكد من كتابة اسم الأغنية أو الفنان بشكل صحيح.</p>
                    </div>
                  </div>
                ) : (
                  /* Songs/Tracks Grid */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {tracks.map((track) => {
                      const isActive = currentTrack?.id === track.id;
                      const isLiked = likedTrackIds.includes(track.id);
                      return (
                        <div
                          key={track.id}
                          className="group relative bg-zinc-900/40 hover:bg-zinc-800/60 rounded-xl p-3 flex flex-col gap-3 border border-zinc-900 hover:border-zinc-800/80 transition-all cursor-pointer shadow-sm hover:shadow-lg"
                        >
                          {/* Thumbnail Container */}
                          <div 
                            className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-800 shadow-md"
                            onClick={() => onSelectTrack(track, tracks)}
                          >
                            {track.coverUrl ? (
                              <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <Music className="text-zinc-500 w-8 h-8" />
                              </div>
                            )}

                            {/* Floating Play Overlay Button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-[#1DB954] text-black flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-105">
                                {isActive && isPlaying ? (
                                  <span className="flex gap-1.5 items-end justify-center h-4 w-4 mb-0.5">
                                    <span className="w-1 bg-black rounded-sm h-3.5 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                    <span className="w-1 bg-black rounded-sm h-4 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                    <span className="w-1 bg-black rounded-sm h-2 animate-bounce" style={{ animationDelay: '0.5s' }}></span>
                                  </span>
                                ) : (
                                  <Play className="w-6 h-6 fill-current text-black ml-1" />
                                )}
                              </div>
                            </div>

                            {/* Active Track Highlight badge */}
                            {isActive && (
                              <div className="absolute top-2 right-2 bg-[#1DB954] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md uppercase">
                                جاري التشغيل
                              </div>
                            )}
                          </div>

                          {/* Track Details & Action Buttons */}
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 
                                onClick={() => onSelectTrack(track, tracks)}
                                className={`text-sm font-bold truncate flex-1 ${isActive ? 'text-[#1DB954]' : 'text-white hover:underline'}`}
                              >
                                {track.title}
                              </h4>
                              
                              {/* Small Inline Favorite heart button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLike(track);
                                }}
                                className={`shrink-0 p-1 rounded-md transition-colors ${
                                  isLiked ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-white'
                                }`}
                                aria-label="أعجبني"
                              >
                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1DB954]' : ''}`} />
                              </button>
                            </div>
                            <p className="text-xs text-zinc-500 truncate">{track.artist}</p>

                            {/* Playlist Add Dropdown (Only show if logged in and playlists exist) */}
                            {user && playlists.length > 0 && (
                              <div className="relative mt-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownTrackId(activeDropdownTrackId === track.id ? null : track.id);
                                  }}
                                  className="w-full flex items-center justify-between bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 px-2 py-1 rounded-md text-[11px] text-zinc-400 hover:text-white transition-all cursor-pointer"
                                >
                                  <span>إضافة لقائمة تشغيل...</span>
                                  <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                                </button>

                                {activeDropdownTrackId === track.id && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 text-right">
                                    {playlists.map((playlist) => {
                                      const alreadyHas = playlist.trackIds.includes(track.id);
                                      return (
                                        <button
                                          key={playlist.id}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (alreadyHas) {
                                              await onRemoveTrackFromPlaylist(playlist.id, track.id);
                                            } else {
                                              await onAddTrackToPlaylist(playlist.id, track);
                                            }
                                            setActiveDropdownTrackId(null);
                                          }}
                                          className="w-full text-right px-3 py-1.5 hover:bg-zinc-900 text-xs truncate flex items-center justify-between text-zinc-300 hover:text-white cursor-pointer"
                                        >
                                          <span className="truncate">{playlist.name}</span>
                                          {alreadyHas && <span className="text-xs text-[#1DB954]">✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {/* TAB 2: FAVORITES VIEW */}
          {activeTab === 'favorites' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Heart className="w-6 h-6 text-[#1DB954] fill-[#1DB954]" />
                  <span>مجموعتك المفضلة</span>
                </h3>
                <p className="text-sm text-zinc-400">الأغاني التي قمت بحفظها والضغط على زر الإعجاب لتصل إليها في أي وقت.</p>
              </div>

              {!user ? (
                /* Unauthenticated state placeholder */
                <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-950 border border-zinc-900 rounded-2xl p-6 gap-5">
                  <Heart className="w-12 h-12 text-zinc-600 animate-pulse" />
                  <div className="max-w-md">
                    <p className="text-white font-semibold text-base">يرجى تسجيل الدخول للوصول للمفضلة</p>
                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                      نحن نستخدم نظام المصادقة السحابي من Firebase لحفظ مفضلاتك بشكل آمن عبر السحابة، بحيث يمكنك العثور عليها على أي جهاز.
                    </p>
                  </div>
                  <button
                    onClick={onLoginClick}
                    className="bg-white text-black hover:bg-[#1DB954] font-extrabold px-6 py-2.5 rounded-full text-sm transition-all shadow-md cursor-pointer transform active:scale-95"
                  >
                    تسجيل الدخول / إنشاء حساب جديد
                  </button>
                </div>
              ) : (
                /* Authenticated state list */
                (() => {
                  const favoriteTracks = likedTracks && likedTracks.length > 0
                    ? likedTracks
                    : initialTracks.filter(t => likedTrackIds.includes(t.id));
                  
                  if (favoriteTracks.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl p-6 gap-3">
                        <Heart className="w-10 h-10 text-zinc-700" />
                        <p className="text-white font-semibold text-sm">قائمتك المفضلة فارغة</p>
                        <p className="text-zinc-500 text-xs">تصفح الأغاني واضغط على زر القلب ❤️ لإضافتها هنا.</p>
                        <button
                          onClick={() => handleTabChange('explore')}
                          className="text-xs text-[#1DB954] hover:underline font-bold mt-1 cursor-pointer"
                        >
                          تصفح الأغاني الآن
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {favoriteTracks.map((track) => {
                        const isActive = currentTrack?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            className="group relative bg-zinc-900/40 hover:bg-zinc-800/60 rounded-xl p-3 flex flex-col gap-3 border border-zinc-900 hover:border-zinc-800/80 transition-all cursor-pointer shadow-sm hover:shadow-lg"
                          >
                            <div 
                              className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-800 shadow-md"
                              onClick={() => onSelectTrack(track, favoriteTracks)}
                            >
                              {track.coverUrl ? (
                                <img
                                  src={track.coverUrl}
                                  alt={track.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                  <Music className="text-zinc-500 w-8 h-8" />
                                </div>
                              )}

                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-11 h-11 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl hover:scale-105">
                                  {isActive && isPlaying ? (
                                    <span className="flex gap-1 items-end justify-center h-3 w-3 mb-0.5">
                                      <span className="w-0.5 bg-black rounded-sm h-3 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                      <span className="w-0.5 bg-black rounded-sm h-3.5 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                      <span className="w-0.5 bg-black rounded-sm h-2 animate-bounce" style={{ animationDelay: '0.5s' }}></span>
                                    </span>
                                  ) : (
                                    <Play className="w-5 h-5 fill-current text-black ml-0.5" />
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <h4 
                                  onClick={() => onSelectTrack(track, favoriteTracks)}
                                  className={`text-sm font-bold truncate flex-1 ${isActive ? 'text-[#1DB954]' : 'text-white'}`}
                                >
                                  {track.title}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleLike(track);
                                  }}
                                  className="shrink-0 text-[#1DB954] p-0.5"
                                  aria-label="إلغاء الإعجاب"
                                >
                                  <Heart className="w-4 h-4 fill-current" />
                                </button>
                              </div>
                              <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* TAB 3: PLAYLISTS VIEW */}
          {activeTab === 'playlists' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ListMusic className="w-6 h-6 text-[#1DB954]" />
                    <span>قوائم التشغيل الخاصة بك</span>
                  </h3>
                  <p className="text-xs text-zinc-400">قم بإنشاء وتعديل قوائم مخصصة من الأغاني التي تفضلها.</p>
                </div>

                {user && (
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 bg-[#1DB954] text-black font-extrabold px-4 py-2 rounded-full text-xs hover:bg-[#1db954]/90 transition-all cursor-pointer shadow-md transform active:scale-95 self-start sm:self-auto"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>إنشاء قائمة جديدة</span>
                  </button>
                )}
              </div>

              {!user ? (
                /* Unauthenticated state placeholder */
                <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-950 border border-zinc-900 rounded-2xl p-6 gap-5">
                  <ListMusic className="w-12 h-12 text-zinc-600 animate-pulse" />
                  <div className="max-w-md">
                    <p className="text-white font-semibold text-base">يرجى تسجيل الدخول لإدارة قوائم التشغيل</p>
                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                      سجل دخولك باستخدام Firebase Auth لتتمكن من إنشاء وحفظ قوائم الأغاني السحابية الخاصة بك بكل سهولة وبأمان كامل.
                    </p>
                  </div>
                  <button
                    onClick={onLoginClick}
                    className="bg-white text-black hover:bg-[#1DB954] font-extrabold px-6 py-2.5 rounded-full text-sm transition-all shadow-md cursor-pointer"
                  >
                    تسجيل الدخول الآن
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Playlist Creation Inline Form */}
                  {showCreateForm && (
                    <form 
                      onSubmit={handleCreatePlaylistSubmit} 
                      className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4 text-right max-w-lg"
                    >
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-900 pb-2">
                        <FolderPlus className="w-4 h-4 text-[#1DB954]" />
                        <span>بيانات قائمة التشغيل الجديدة</span>
                      </h4>
                      
                      {playlistError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-xs text-red-400 font-medium">
                          {playlistError}
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-300">اسم القائمة</label>
                        <input
                          type="text"
                          placeholder="مثال: أغاني الصباح الباكر"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#1DB954]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-300">الوصف (اختياري)</label>
                        <textarea
                          placeholder="اكتب وصفاً مختصراً للقائمة..."
                          value={newPlaylistDesc}
                          onChange={(e) => setNewPlaylistDesc(e.target.value)}
                          rows={2}
                          className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#1DB954] resize-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setPlaylistError(null);
                          }}
                          className="px-4 py-2 bg-transparent text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#1DB954] text-black text-xs font-bold rounded-full hover:bg-opacity-90 cursor-pointer shadow-md"
                        >
                          تأكيد الإنشاء
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Playlist selection view or lists grid */}
                  {selectedPlaylist ? (
                    /* PLAYLIST TRACKS DETAIL VIEW */
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 flex flex-col gap-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#1DB954] shrink-0">
                            <ListMusic className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white">{selectedPlaylist.name}</h4>
                            <p className="text-xs text-zinc-500 mt-0.5">{selectedPlaylist.description || 'لا يوجد وصف.'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPlaylist(null)}
                            className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white font-semibold cursor-pointer"
                          >
                            رجوع للقوائم
                          </button>
                          
                          {selectedPlaylist.trackIds.length > 0 && (
                            <button
                              onClick={() => {
                                const resolvedTracks = selectedPlaylist.trackIds
                                  .map(id => getTrackById(id))
                                  .filter(t => t !== null) as Track[];
                                if (resolvedTracks.length > 0) {
                                  onSelectTrack(resolvedTracks[0], resolvedTracks);
                                }
                              }}
                              className="bg-[#1DB954] text-black font-extrabold px-5 py-2 rounded-full text-xs hover:scale-102 transition-transform cursor-pointer"
                            >
                              تشغيل القائمة بالكامل
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tracks in playlist */}
                      {selectedPlaylist.trackIds.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 text-xs">
                          <Music2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                          <p>لا توجد أغاني مضافة إلى هذه القائمة بعد.</p>
                          <p className="mt-1">تصفح القائمة الرئيسية واستخدم "إضافة لقائمة تشغيل..." تحت كل أغنية.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {selectedPlaylist.trackIds.map((id, index) => {
                            const t = getTrackById(id);
                            if (!t) return null;
                            const isCurrent = currentTrack?.id === t.id;
                            
                            return (
                              <div
                                key={id}
                                className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                                  isCurrent ? 'bg-zinc-900/60' : 'hover:bg-zinc-900/30'
                                }`}
                              >
                                <div 
                                  className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1"
                                  onClick={() => {
                                    const allTracksInPlaylist = selectedPlaylist.trackIds
                                      .map(tid => getTrackById(tid))
                                      .filter(track => track !== null) as Track[];
                                    onSelectTrack(t, allTracksInPlaylist);
                                  }}
                                >
                                  <span className="text-xs text-zinc-500 w-4 text-center shrink-0">{index + 1}</span>
                                  {t.coverUrl ? (
                                    <img 
                                      src={t.coverUrl} 
                                      alt={t.title} 
                                      className="w-10 h-10 object-cover rounded-lg shrink-0" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                                      <Music className="w-4 h-4 text-zinc-500" />
                                    </div>
                                  )}
                                  <div className="overflow-hidden">
                                    <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                                      {t.title}
                                    </p>
                                    <p className="text-xs text-zinc-500 truncate">{t.artist}</p>
                                  </div>
                                </div>

                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await onRemoveTrackFromPlaylist(selectedPlaylist.id, t.id);
                                  }}
                                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                                  aria-label="حذف من قائمة التشغيل"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* PLAYLIST LIST GRID VIEW */
                    playlists.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-950/40 border border-dashed border-zinc-800 rounded-2xl p-6 gap-3">
                        <ListMusic className="w-10 h-10 text-zinc-700" />
                        <p className="text-white font-semibold text-sm">ليس لديك أي قوائم تشغيل حتى الآن</p>
                        <p className="text-zinc-500 text-xs">ابدأ بإنشاء قائمة جديدة باستخدام زر "إنشاء قائمة جديدة" في الأعلى.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {playlists.map((playlist) => (
                          <div
                            key={playlist.id}
                            onClick={() => setSelectedPlaylist(playlist)}
                            className="bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-900 hover:border-zinc-800 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-lg group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-500 group-hover:text-[#1DB954] transition-colors shrink-0">
                              <ListMusic className="w-6 h-6" />
                            </div>
                            <div className="overflow-hidden flex-1 text-right">
                              <h4 className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                                {playlist.name}
                              </h4>
                              <p className="text-xs text-zinc-500 truncate mt-0.5">
                                {playlist.trackIds.length} أغنية
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
