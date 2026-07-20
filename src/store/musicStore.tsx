import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, User, Playlist, RecommendationResponse } from '../types';

interface MusicContextType {
  // Authentication
  user: User | null;
  login: (email: string) => Promise<boolean>;
  register: (email: string, name: string) => Promise<boolean>;
  logout: () => void;

  // Track Collection & Playlists
  tracks: Track[];
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  selectPlaylist: (playlistId: string) => Promise<void>;
  createPlaylist: (name: string, description?: string, coverUrl?: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  likes: string[]; // array of trackIds
  toggleLike: (trackId: string) => Promise<void>;

  // Recommendations
  recommendations: RecommendationResponse | null;
  refreshRecommendations: () => Promise<void>;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Track[];
  isSearching: boolean;
  triggerSearch: (q: string) => Promise<void>;

  // Playback Control
  currentTrack: Track | null;
  isPlaying: boolean;
  playbackState: 'unstarted' | 'playing' | 'paused' | 'ended' | 'buffering' | 'cued';
  progress: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 100
  setVolume: (v: number) => void;
  playTrack: (track: Track, fromQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  shuffle: boolean;
  setShuffle: (s: boolean) => void;
  repeat: 'none' | 'one' | 'all';
  setRepeat: (r: 'none' | 'one' | 'all') => void;
  queue: Track[];
  history: Track[];

  // TV / Spatial Navigation Mode
  isTvMode: boolean;
  setIsTvMode: (tv: boolean) => void;

  // Theme Support
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Fullscreen Player
  isFullscreenPlayerOpen: boolean;
  setIsFullscreenPlayerOpen: (open: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Define global YouTube iframe callback so YT player can notify React
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);

  // Music state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [likes, setLikes] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackState, setPlaybackState] = useState<'unstarted' | 'playing' | 'paused' | 'ended' | 'buffering' | 'cued'>('unstarted');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none');
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);

  // Device Layout states
  const [isTvMode, setIsTvMode] = useState(false);

  // Theme and Fullscreen states
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('listen2song_theme') as 'light' | 'dark') || 'dark';
  });
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('listen2song_theme', next);
  };

  // YouTube player references
  const ytPlayerRef = useRef<any>(null);
  const progressTimerRef = useRef<any>(null);
  const listeningDurationRef = useRef<number>(0);
  const lastActiveUserIdRef = useRef<string | null>(null);

  // --- Auth Actions ---
  const fetchMe = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        lastActiveUserIdRef.current = data.user.id;
        localStorage.setItem('listen2song_user_id', data.user.id);
        return true;
      }
    } catch (e) {
      console.error('Fetch me error:', e);
    }
    return false;
  };

  const login = async (email: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        lastActiveUserIdRef.current = data.user.id;
        localStorage.setItem('listen2song_user_id', data.user.id);
        return true;
      }
    } catch (e) {
      console.error('Login error:', e);
    }
    return false;
  };

  const register = async (email: string, displayName: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        lastActiveUserIdRef.current = data.user.id;
        localStorage.setItem('listen2song_user_id', data.user.id);
        return true;
      }
    } catch (e) {
      console.error('Register error:', e);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    lastActiveUserIdRef.current = null;
    localStorage.removeItem('listen2song_user_id');
  };

  // --- Data Fetching ---
  const loadInitialData = async (userId: string) => {
    try {
      // 1. Get tracks
      const tracksRes = await fetch('/api/tracks');
      if (tracksRes.ok) {
        const d = await tracksRes.json();
        setTracks(d.tracks);
      }

      // 2. Get playlists
      const plRes = await fetch(`/api/playlists?userId=${userId}`);
      if (plRes.ok) {
        const d = await plRes.json();
        setPlaylists(d.playlists);
      }

      // 3. Get likes
      const likesRes = await fetch(`/api/tracks/likes?userId=${userId}`);
      if (likesRes.ok) {
        const d = await likesRes.json();
        setLikes(d.likes.map((l: any) => l.trackId));
      }

      // 4. Get recommendations
      const recsRes = await fetch(`/api/recommendations?userId=${userId}`);
      if (recsRes.ok) {
        const d = await recsRes.json();
        setRecommendations(d);
      }
    } catch (e) {
      console.error('Initial data load error:', e);
    }
  };

  const refreshRecommendations = async () => {
    if (!user) return;
    try {
      const recsRes = await fetch(`/api/recommendations?userId=${user.id}`);
      if (recsRes.ok) {
        const d = await recsRes.json();
        setRecommendations(d);
      }
    } catch (e) {
      console.error('Refresh recommendations error:', e);
    }
  };

  // Trigger loading when user state changes
  useEffect(() => {
    const savedUserId = localStorage.getItem('listen2song_user_id');
    if (savedUserId && !user) {
      fetchMe(savedUserId).then((success) => {
        if (success) {
          loadInitialData(savedUserId);
        } else {
          // fallback to demo user
          login('demo@listen2song.com').then(() => loadInitialData('user_demo'));
        }
      });
    } else if (user) {
      loadInitialData(user.id);
    } else {
      // login demo immediately for rich content out-of-the-box
      login('demo@listen2song.com').then(() => loadInitialData('user_demo'));
    }
  }, [user?.id]);

  // --- Playlist Actions ---
  const selectPlaylist = async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentPlaylist(data.playlist);
      }
    } catch (e) {
      console.error('Playlist select error:', e);
    }
  };

  const createPlaylist = async (name: string, description?: string, coverUrl?: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name, description, coverUrl })
      });
      if (res.ok) {
        const plRes = await fetch(`/api/playlists?userId=${user.id}`);
        if (plRes.ok) {
          const d = await plRes.json();
          setPlaylists(d.playlists);
        }
      }
    } catch (e) {
      console.error('Create playlist error:', e);
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId })
      });
      if (res.ok) {
        if (currentPlaylist && currentPlaylist.id === playlistId) {
          selectPlaylist(playlistId);
        }
        // reload playlists list
        if (user) {
          const plRes = await fetch(`/api/playlists?userId=${user.id}`);
          if (plRes.ok) {
            const d = await plRes.json();
            setPlaylists(d.playlists);
          }
        }
      }
    } catch (e) {
      console.error('Add track to playlist error:', e);
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (currentPlaylist && currentPlaylist.id === playlistId) {
          selectPlaylist(playlistId);
        }
        if (user) {
          const plRes = await fetch(`/api/playlists?userId=${user.id}`);
          if (plRes.ok) {
            const d = await plRes.json();
            setPlaylists(d.playlists);
          }
        }
      }
    } catch (e) {
      console.error('Remove track from playlist error:', e);
    }
  };

  const toggleLike = async (trackId: string) => {
    const activeUser = user || { id: 'user_demo' };
    const liked = likes.includes(trackId);
    try {
      const newLikes = liked ? likes.filter(id => id !== trackId) : [...likes, trackId];
      setLikes(newLikes);

      await fetch('/api/tracks/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id, trackId, like: !liked })
      });

      // reload recommendation engine dynamically when user likes something!
      refreshRecommendations();
    } catch (e) {
      console.error('Toggle like error:', e);
    }
  };

  // --- Search Actions ---
  const triggerSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/tracks/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.tracks || []);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        triggerSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Playback Engine (YouTube Hidden Bridge) ---
  const setupYouTubePlayer = () => {
    // If global script not injected, inject it
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_player_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Set callback
    window.onYouTubeIframeAPIReady = () => {
      ytPlayerRef.current = new window.YT.Player('hidden-youtube-player-iframe', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
          },
          onStateChange: onPlayerStateChange
        }
      });
    };

    // If script already loaded but player not created
    if (window.YT && window.YT.Player && !ytPlayerRef.current) {
      window.onYouTubeIframeAPIReady?.();
    }
  };

  useEffect(() => {
    setupYouTubePlayer();
    return () => {
      clearInterval(progressTimerRef.current);
    };
  }, []);

  const onPlayerStateChange = (event: any) => {
    const stateMap: Record<number, typeof playbackState> = {
      [-1]: 'unstarted',
      [window.YT.PlayerState.ENDED]: 'ended',
      [window.YT.PlayerState.PLAYING]: 'playing',
      [window.YT.PlayerState.PAUSED]: 'paused',
      [window.YT.PlayerState.BUFFERING]: 'buffering',
      [window.YT.PlayerState.CUED]: 'cued'
    };

    const newState = stateMap[event.data] || 'unstarted';
    setPlaybackState(newState);

    if (newState === 'playing') {
      setIsPlaying(true);
      setDuration(ytPlayerRef.current.getDuration() || 0);

      // Start tick timer
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = setInterval(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          const curr = ytPlayerRef.current.getCurrentTime();
          setProgress(curr);
          listeningDurationRef.current += 1;
        }
      }, 1000);
    } else {
      setIsPlaying(false);
      clearInterval(progressTimerRef.current);

      if (newState === 'ended') {
        reportListenHistory();
        handleTrackEnded();
      }
    }
  };

  const reportListenHistory = async () => {
    if (!currentTrack) return;
    const activeUserId = user?.id || 'user_demo';
    const totalDuration = duration || currentTrack.duration || 1;
    const listSeconds = listeningDurationRef.current;
    const rate = Math.min(100, Math.round((listSeconds / totalDuration) * 100));

    try {
      // 1. Local Database History
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          trackId: currentTrack.id,
          duration: listSeconds,
          completionRate: rate
        })
      });

      // 2. ListenBrainz Scrobble
      await fetch('/api/listenbrainz/scrobble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: currentTrack.title,
          artist: currentTrack.artist,
          listenedAt: new Date().toISOString()
        })
      });

      // reset listening duration counter for next track
      listeningDurationRef.current = 0;
    } catch (e) {
      console.error('History submission error:', e);
    }
  };

  const handleTrackEnded = () => {
    if (repeat === 'one') {
      seek(0);
      playTrack(currentTrack!);
    } else {
      nextTrack();
    }
  };

  const playTrack = (track: Track, fromQueue?: Track[]) => {
    setCurrentTrack(track);
    setProgress(0);
    listeningDurationRef.current = 0;

    if (fromQueue) {
      setQueue(fromQueue);
    } else if (!queue.some(q => q.id === track.id)) {
      setQueue(prev => [...prev, track]);
    }

    // Keep history trail
    setHistory(prev => {
      const filtered = prev.filter(p => p.id !== track.id);
      return [track, ...filtered].slice(0, 50);
    });

    if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
      ytPlayerRef.current.loadVideoById(track.youtubeId);
      ytPlayerRef.current.playVideo();
    } else {
      // Retry in 500ms if player is not fully ready
      setTimeout(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
          ytPlayerRef.current.loadVideoById(track.youtubeId);
          ytPlayerRef.current.playVideo();
        }
      }, 500);
    }
  };

  const togglePlay = () => {
    if (!currentTrack && tracks.length > 0) {
      playTrack(tracks[0]);
      return;
    }
    if (!ytPlayerRef.current) return;

    if (isPlaying) {
      ytPlayerRef.current.pauseVideo();
    } else {
      ytPlayerRef.current.playVideo();
    }
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);

    if (shuffle) {
      const nextIndex = Math.floor(Math.random() * queue.length);
      playTrack(queue[nextIndex]);
    } else if (currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    } else if (repeat === 'all') {
      playTrack(queue[0]);
    } else {
      setIsPlaying(false);
    }
  };

  const prevTrack = () => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);

    if (progress > 5) {
      seek(0);
    } else if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else if (repeat === 'all') {
      playTrack(queue[queue.length - 1]);
    } else {
      seek(0);
    }
  };

  const seek = (seconds: number) => {
    if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      ytPlayerRef.current.seekTo(seconds, true);
      setProgress(seconds);
    }
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(v);
    }
  };

  return (
    <MusicContext.Provider value={{
      user, login, register, logout,
      tracks, playlists, currentPlaylist, selectPlaylist, createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist,
      likes, toggleLike, recommendations, refreshRecommendations,
      searchQuery, setSearchQuery, searchResults, isSearching, triggerSearch,
      currentTrack, isPlaying, playbackState, progress, duration, volume, setVolume,
      playTrack, togglePlay, nextTrack, prevTrack, seek, shuffle, setShuffle, repeat, setRepeat, queue, history,
      isTvMode, setIsTvMode,
      theme, toggleTheme,
      isFullscreenPlayerOpen, setIsFullscreenPlayerOpen
    }}>
      {children}
      {/* Hidden YouTube Iframe Container */}
      <div id="hidden-youtube-player-container" className="fixed bottom-0 right-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0 select-none">
        <div id="hidden-youtube-player-iframe"></div>
      </div>
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
