import React, { useState } from 'react';
import { useMusic } from '../store/musicStore';
import { Play, Heart, Plus, Search, Trash2, FileMusic, Disc, List, ArrowRight, User as UserIcon } from 'lucide-react';
import { Track, Playlist } from '../types';
import { StatsWrapped } from './StatsWrapped';

interface HomeDashboardProps {
  activeTab: 'home' | 'search' | 'library' | 'stats';
  setActiveTab: (tab: 'home' | 'search' | 'library' | 'stats') => void;
  onOpenAuth: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const {
    tracks,
    playlists,
    likes,
    toggleLike,
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
    recommendations,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    currentPlaylist,
    selectPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    createPlaylist,
    history,
    user
  } = useMusic();

  const [activeLibrarySubTab, setActiveLibrarySubTab] = useState<'playlists' | 'likes' | 'history'>('playlists');
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning / صباح الخير';
    if (hr < 18) return 'Good afternoon / مساء الخير';
    return 'Good evening / مساء النور';
  };

  const handleTrackPlay = (track: Track, contextList: Track[]) => {
    playTrack(track, contextList);
  };

  const handleSearchCategoryClick = (category: string) => {
    setSearchQuery(category);
  };

  const handleCreatePlaylist = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const name = prompt('Enter playlist name:');
    if (name) {
      createPlaylist(name, 'My custom playlist.');
    }
  };

  const handleToggleMenu = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    setActiveMenuTrackId(activeMenuTrackId === trackId ? null : trackId);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-spotify-dark via-spotify-dark to-black p-6 pb-32">
      {/* ---------------- HOME TAB ---------------- */}
      {activeTab === 'home' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Greeting Header */}
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">{getGreeting()}</h1>
          </div>

          {/* Quick Mix (Spotify Bento Header Grid) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tracks.slice(0, 6).map((track) => (
              <div
                key={track.id}
                onClick={() => handleTrackPlay(track, tracks)}
                className="group flex items-center bg-spotify-highlight/40 hover:bg-spotify-highlight/80 rounded-lg overflow-hidden cursor-pointer transition-all pr-4 relative"
              >
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="h-20 w-20 object-cover shrink-0"
                />
                <div className="ml-4 min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white truncate">{track.title}</span>
                  <span className="block text-xs text-gray-400 truncate mt-0.5">{track.artist}</span>
                </div>
                <button className="opacity-0 group-hover:opacity-100 absolute right-4 p-3 bg-spotify-green rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-black">
                  <Play className="h-4 w-4 fill-current" />
                </button>
              </div>
            ))}
          </div>

          {/* Dynamic Personalized Recommendations ("Discover Weekly") */}
          {recommendations && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-white tracking-tight">Discover Weekly / اكتشف أسبوعيًا</h2>
                  <p className="text-xs text-gray-400 mt-1">{recommendations.reason}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {recommendations.discoverWeekly.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleTrackPlay(track, recommendations.discoverWeekly)}
                      className="bg-spotify-light/50 hover:bg-spotify-highlight/50 p-4 rounded-xl cursor-pointer transition-all relative group"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-md border border-spotify-highlight/50">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-3 bg-spotify-green rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-black">
                          <Play className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                      <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-spotify-green' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic "Contextual Session Mix" (similar to last song played) */}
          {recommendations && recommendations.contextualMix && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-display font-bold text-white tracking-tight">Contextual Session Mix / المقترح سياقيًا</h2>
                <p className="text-xs text-gray-400 mt-1">Based on your recent acoustic waves and listening context.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {recommendations.contextualMix.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleTrackPlay(track, recommendations.contextualMix)}
                      className="bg-spotify-light/50 hover:bg-spotify-highlight/50 p-4 rounded-xl cursor-pointer transition-all relative group"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-md border border-spotify-highlight/50">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-3 bg-spotify-green rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-black">
                          <Play className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                      <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-spotify-green' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seeded General Library Slider */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-tight">All-time Classics & Lo-fi Hits</h2>
              <p className="text-xs text-gray-400 mt-1">Popular cost-free music sources cached on listen2song.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleTrackPlay(track, tracks)}
                  className="flex items-center space-x-4 bg-spotify-light/30 hover:bg-spotify-highlight/30 p-3 rounded-xl cursor-pointer transition-colors relative group"
                >
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="h-14 w-14 rounded-lg object-cover border border-spotify-highlight"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {track.genres.map((g, i) => (
                        <span key={i} className="text-[10px] bg-spotify-highlight px-1.5 py-0.5 rounded text-gray-400 font-medium">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2.5 bg-spotify-green rounded-full shadow-md text-black">
                    <Play className="h-3 w-3 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SEARCH TAB ---------------- */}
      {activeTab === 'search' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Search / البحث</h1>

          {/* Search bar input container */}
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="What do you want to listen to? (e.g. Amr Diab, Fairouz, Lofi Chill)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-spotify-light border border-spotify-highlight text-white placeholder-gray-400 pl-12 pr-4 py-3.5 rounded-full focus:outline-none focus:border-spotify-green transition-colors text-sm font-medium"
            />
          </div>

          {/* Search categories (if no query) */}
          {!searchQuery ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Browse all genres</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { name: 'Arabic Pop', color: 'from-orange-500 to-amber-600', query: 'Arabic Pop' },
                  { name: 'Tarab Classic', color: 'from-red-600 to-rose-700', query: 'Tarab' },
                  { name: 'Chill Lofi Study', color: 'from-indigo-600 to-purple-700', query: 'lofi study' },
                  { name: 'Retro Synthwave', color: 'from-pink-500 to-purple-600', query: 'synthwave' },
                  { name: 'Morning Fairouz', color: 'from-emerald-600 to-teal-700', query: 'Fairouz' }
                ].map((cat, i) => (
                  <div
                    key={i}
                    onClick={() => handleSearchCategoryClick(cat.query)}
                    className={`bg-gradient-to-br ${cat.color} h-32 rounded-xl p-4 cursor-pointer relative overflow-hidden active:scale-[0.98] transition-all hover:shadow-lg`}
                  >
                    <span className="text-base font-bold text-white font-display block leading-tight">{cat.name}</span>
                    <div className="absolute right-[-10px] bottom-[-10px] bg-black/20 rounded-full h-16 w-16 flex items-center justify-center rotate-12">
                      <Disc className="h-8 w-8 text-white/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Search results */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {isSearching ? 'Searching unlimited databases...' : 'Search Results'}
                </h3>
              </div>

              {searchResults.length > 0 ? (
                <div className="bg-spotify-light/20 rounded-xl overflow-hidden border border-spotify-highlight/40">
                  <div className="divide-y divide-spotify-highlight/30">
                    {searchResults.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => handleTrackPlay(track, searchResults)}
                        className="flex items-center justify-between p-3.5 hover:bg-spotify-highlight/40 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="h-11 w-11 rounded-lg object-cover border border-spotify-highlight"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                          </div>
                        </div>

                        {/* Add to playlist menu controls */}
                        <div className="flex items-center space-x-3 pr-2 relative shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(track.id);
                            }}
                            className={`p-1 hover:text-white transition-colors ${likes.includes(track.id) ? 'text-spotify-green' : 'text-gray-400'}`}
                          >
                            <Heart className={`h-4 w-4 ${likes.includes(track.id) ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            onClick={(e) => handleToggleMenu(e, track.id)}
                            className="p-1 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-spotify-highlight"
                          >
                            <Plus className="h-4 w-4" />
                          </button>

                          {activeMenuTrackId === track.id && (
                            <div className="absolute right-0 bottom-8 z-50 bg-spotify-light border border-spotify-highlight rounded-xl p-2 w-48 shadow-xl">
                              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2 py-1 mb-1 border-b border-spotify-highlight">
                                Add to playlist
                              </span>
                              {playlists.map(pl => (
                                <button
                                  key={pl.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addTrackToPlaylist(pl.id, track.id);
                                    setActiveMenuTrackId(null);
                                    alert(`Added to ${pl.name}!`);
                                  }}
                                  className="w-full text-left text-xs font-semibold hover:bg-spotify-green hover:text-black text-gray-200 px-2 py-1.5 rounded transition-colors"
                                >
                                  {pl.name}
                                </button>
                              ))}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreatePlaylist();
                                }}
                                className="w-full text-left text-xs font-semibold text-spotify-green hover:underline px-2 py-1.5 mt-1 border-t border-spotify-highlight"
                              >
                                + New Playlist
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">
                  {isSearching ? 'Analyzing servers...' : 'Type a query or choose a genre to load full YouTube libraries.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- LIBRARY TAB ---------------- */}
      {activeTab === 'library' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Your Library / مكتبتك</h1>
            <button
              onClick={handleCreatePlaylist}
              className="bg-white text-black font-bold py-2.5 px-5 rounded-full text-sm hover:scale-105 active:scale-95 transition-all w-fit"
            >
              + Create Playlist
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex space-x-3 border-b border-spotify-highlight pb-1">
            {[
              { id: 'playlists', label: 'Playlists' },
              { id: 'likes', label: 'Liked Songs' },
              { id: 'history', label: 'Recent Listening' }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setActiveLibrarySubTab(sub.id as any);
                  if (sub.id !== 'playlists') {
                    selectPlaylist(''); // clear current active playlist detail
                  }
                }}
                className={`pb-3 text-sm font-bold border-b-2 transition-all px-2 ${activeLibrarySubTab === sub.id && !currentPlaylist ? 'text-white border-spotify-green' : 'text-gray-400 border-transparent hover:text-white'}`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Sub Tab Content */}
          {activeLibrarySubTab === 'playlists' && (
            <div className="space-y-6">
              {currentPlaylist ? (
                /* DETAILED PLAYLIST VIEW */
                <div className="space-y-6 animate-in slide-in-from-bottom duration-200">
                  <button
                    onClick={() => selectPlaylist('')}
                    className="text-spotify-green hover:underline text-sm font-semibold flex items-center space-x-1"
                  >
                    <span>← Back to all Playlists</span>
                  </button>

                  <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 bg-gradient-to-r from-spotify-highlight/40 to-transparent p-6 rounded-2xl border border-spotify-highlight/20">
                    <img
                      src={currentPlaylist.coverUrl}
                      alt={currentPlaylist.name}
                      className="h-40 w-40 object-cover rounded-xl shadow-lg border border-spotify-highlight"
                    />
                    <div>
                      <span className="text-xs uppercase tracking-widest font-bold text-gray-400">PLAYLIST</span>
                      <h2 className="text-4xl font-display font-bold text-white mt-1">{currentPlaylist.name}</h2>
                      <p className="text-sm text-gray-400 mt-2">{currentPlaylist.description}</p>
                      <p className="text-xs text-spotify-green mt-3 font-semibold">
                        {currentPlaylist.trackIds.length} audio tracks synced
                      </p>
                    </div>
                  </div>

                  {/* Tracks list */}
                  <div className="bg-spotify-light/20 rounded-xl overflow-hidden border border-spotify-highlight/40">
                    {currentPlaylist.trackIds.length > 0 ? (
                      <div className="divide-y divide-spotify-highlight/30">
                        {currentPlaylist.trackIds.map((tid) => {
                          const track = tracks.find(t => t.id === tid);
                          if (!track) return null;
                          return (
                            <div
                              key={track.id}
                              onClick={() => {
                                // play with current playlist tracks array
                                const playlistTracks = currentPlaylist.trackIds
                                  .map(id => tracks.find(t => t.id === id))
                                  .filter(Boolean) as Track[];
                                handleTrackPlay(track, playlistTracks);
                              }}
                              className="flex items-center justify-between p-3.5 hover:bg-spotify-highlight/40 cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center space-x-4 min-w-0 flex-1">
                                <img
                                  src={track.coverUrl}
                                  alt={track.title}
                                  className="h-11 w-11 rounded-lg object-cover border border-spotify-highlight"
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                                  <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTrackFromPlaylist(currentPlaylist.id, track.id);
                                }}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-spotify-highlight rounded-full transition-colors shrink-0"
                                title="Remove from Playlist"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 text-sm italic">
                        This playlist is currently empty. Head to Search and click '+' to sync tracks!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ALL PLAYLISTS GRID */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => selectPlaylist(pl.id)}
                      className="bg-spotify-light/50 hover:bg-spotify-highlight/50 p-4 rounded-xl cursor-pointer transition-all relative group border border-transparent hover:border-spotify-highlight"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-md border border-spotify-highlight/50">
                        <img
                          src={pl.coverUrl}
                          alt={pl.name}
                          className="w-full h-full object-cover"
                        />
                        <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-3 bg-spotify-green rounded-full shadow-lg text-black">
                          <FileMusic className="h-4 w-4 text-black" />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {pl.trackIds.length} audio tracks
                      </p>
                    </div>
                  ))}
                  {playlists.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 text-sm">
                      Create your first playlist and starts collecting!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeLibrarySubTab === 'likes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Liked Songs ({likes.length})</h3>
              <div className="bg-spotify-light/20 rounded-xl overflow-hidden border border-spotify-highlight/40">
                {likes.length > 0 ? (
                  <div className="divide-y divide-spotify-highlight/30">
                    {likes.map((tid) => {
                      const track = tracks.find(t => t.id === tid);
                      if (!track) return null;
                      return (
                        <div
                          key={track.id}
                          onClick={() => handleTrackPlay(track, tracks.filter(t => likes.includes(t.id)))}
                          className="flex items-center justify-between p-3.5 hover:bg-spotify-highlight/40 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center space-x-4 min-w-0 flex-1">
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="h-11 w-11 rounded-lg object-cover border border-spotify-highlight"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(track.id);
                            }}
                            className="p-2 text-spotify-green hover:text-white transition-colors shrink-0"
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 text-sm italic">
                    Your liked songs list is empty. Click the heart on any song to save it here!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeLibrarySubTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Recent Listening Logs</h3>
              <div className="bg-spotify-light/20 rounded-xl overflow-hidden border border-spotify-highlight/40">
                {history.length > 0 ? (
                  <div className="divide-y divide-spotify-highlight/30">
                    {history.map((track, idx) => (
                      <div
                        key={`${track.id}-${idx}`}
                        onClick={() => handleTrackPlay(track, history)}
                        className="flex items-center justify-between p-3.5 hover:bg-spotify-highlight/40 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="h-11 w-11 rounded-lg object-cover border border-spotify-highlight"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-spotify-highlight text-gray-400 px-2 py-1 rounded font-mono uppercase">
                          Synced
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 text-sm italic">
                    Your recent history is currently empty. Play a track to trigger real-time logs!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- STATS/WRAPPED TAB ---------------- */}
      {activeTab === 'stats' && <StatsWrapped />}
    </div>
  );
};
