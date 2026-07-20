import React, { useState, useEffect, useRef } from 'react';
import { Home } from './components/Home';
import { Player } from './components/Player';
import { AuthModal } from './components/AuthModal';
import { Track, Playlist } from './types/index';
import { ytPlayer, PlayerState } from './services/player';
import { onAuthStateChange, signOutUser, UserProfile } from './services/auth';
import { 
  dbGetLikedTrackIds, 
  dbGetLikedTracks,
  dbToggleLike, 
  dbGetPlaylists, 
  dbCreatePlaylist, 
  dbAddTrackToPlaylist, 
  dbRemoveTrackFromPlaylist 
} from './services/firebase';

export default function App() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Authentication & custom user states
  const [user, setUser] = useState<UserProfile | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // References to keep event callbacks synced with the freshest state
  const queueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const currentTrackRef = useRef<Track | null>(null);

  useEffect(() => {
    queueRef.current = queue;
    currentIndexRef.current = currentIndex;
    currentTrackRef.current = currentTrack;
  }, [queue, currentIndex, currentTrack]);

  // Handle Track Playback completion / autoplay next track
  const handleTrackEnded = () => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < queueRef.current.length) {
      const nextTrack = queueRef.current[nextIndex];
      handleSelectTrack(nextTrack, queueRef.current);
    } else {
      setIsPlaying(false);
    }
  };

  // Initialize YouTube IFrame Player wrapper on mount
  useEffect(() => {
    ytPlayer.init({
      onReady: () => {
        console.log('[App] YouTube Player wrapper loaded and ready.');
        ytPlayer.setVolume(volume);
      },
      onStateChange: (state: PlayerState, trackDuration: number) => {
        setDuration(trackDuration);
        if (state === 'PLAYING') {
          setIsPlaying(true);
        } else if (state === 'PAUSED') {
          setIsPlaying(false);
        } else if (state === 'ENDED') {
          setIsPlaying(false);
          handleTrackEnded();
        }
      },
      onError: (errorMsg: string) => {
        console.error('[App] YouTube Player Error:', errorMsg);
      },
      onTimeUpdate: (currentTime: number) => {
        setProgress(currentTime);
      },
    });

    return () => {
      ytPlayer.destroy();
    };
  }, []);

  // Listen to Firebase Authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        console.log('[Auth] User logged in:', firebaseUser.email);
        try {
          // Load likes and playlists for this user
          const likes = await dbGetLikedTrackIds(firebaseUser.uid);
          setLikedTrackIds(likes);

          const fullLikes = await dbGetLikedTracks(firebaseUser.uid);
          setLikedTracks(fullLikes);
          
          const userPlaylists = await dbGetPlaylists(firebaseUser.uid);
          setPlaylists(userPlaylists);
        } catch (err) {
          console.error('[App] Error loading user data:', err);
        }
      } else {
        console.log('[Auth] User logged out or unauthenticated.');
        setLikedTrackIds([]);
        setLikedTracks([]);
        setPlaylists([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handlers
  const handlePlayPause = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      ytPlayer.pause();
      setIsPlaying(false);
    } else {
      ytPlayer.play();
      setIsPlaying(true);
    }
  };

  const handleSelectTrack = (track: Track, newQueue: Track[]) => {
    setCurrentTrack(track);
    setQueue(newQueue);
    
    const index = newQueue.findIndex((t) => t.id === track.id);
    setCurrentIndex(index);
    setProgress(0);

    // Give player a brief moment to initialize if needed
    setTimeout(() => {
      ytPlayer.loadAndPlay(track.youtubeId);
      setIsPlaying(true);
    }, 50);
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      handleSelectTrack(queue[nextIndex], queue);
    } else {
      // Wrap around to start of queue
      handleSelectTrack(queue[0], queue);
    }
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    
    // If progress is more than 3 seconds, restart current track
    if (progress > 3) {
      handleSeek(0);
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      handleSelectTrack(queue[prevIndex], queue);
    } else {
      // Wrap around to end of queue
      handleSelectTrack(queue[queue.length - 1], queue);
    }
  };

  const handleSeek = (seconds: number) => {
    ytPlayer.seek(seconds);
    setProgress(seconds);
  };

  const handleVolumeChange = (newVolume: number) => {
    ytPlayer.setVolume(newVolume);
    setVolume(newVolume);
  };

  // --- Auth & Profile Actions ---
  
  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleToggleLike = async (trackIdOrTrack: string | Track) => {
    if (!user) {
      // Prompt user to log in if they try to like without an account
      setShowAuthModal(true);
      return;
    }

    // Support both ID string (e.g. from Player) or full Track object (e.g. from Home)
    let trackToLike: Track | null = null;
    let targetId = '';
    if (typeof trackIdOrTrack === 'string') {
      targetId = trackIdOrTrack;
      // Resolve track metadata from queue or current track
      if (currentTrack && currentTrack.id === targetId) {
        trackToLike = currentTrack;
      } else {
        trackToLike = queue.find(t => t.id === targetId) || null;
      }
    } else {
      trackToLike = trackIdOrTrack;
      targetId = trackIdOrTrack.id;
    }

    if (!trackToLike) {
      console.warn('[handleToggleLike] Track metadata not found, cannot like.');
      return;
    }

    try {
      const liked = await dbToggleLike(user.uid, trackToLike);
      if (liked) {
        setLikedTrackIds(prev => [...prev, targetId]);
        setLikedTracks(prev => [...prev, trackToLike!]);
      } else {
        setLikedTrackIds(prev => prev.filter(id => id !== targetId));
        setLikedTracks(prev => prev.filter(t => t.id !== targetId));
      }
    } catch (err) {
      console.error('Toggle like error:', err);
    }
  };

  const handleCreatePlaylist = async (name: string, description?: string) => {
    if (!user) return;
    try {
      await dbCreatePlaylist({
        name,
        description,
        userId: user.uid,
        trackIds: [],
        isPublic: false
      });
      // Refresh user playlists
      const updated = await dbGetPlaylists(user.uid);
      setPlaylists(updated);
    } catch (err) {
      console.error('Create playlist error:', err);
      throw err;
    }
  };

  const handleAddTrackToPlaylist = async (playlistId: string, trackOrId: string | Track) => {
    if (!user) return;
    try {
      let trackToAddToPlaylist: Track | null = null;
      if (typeof trackOrId === 'string') {
        const targetId = trackOrId;
        if (currentTrack && currentTrack.id === targetId) {
          trackToAddToPlaylist = currentTrack;
        } else {
          trackToAddToPlaylist = queue.find(t => t.id === targetId) || null;
        }
      } else {
        trackToAddToPlaylist = trackOrId;
      }

      if (!trackToAddToPlaylist) {
        console.warn('[handleAddTrackToPlaylist] Track metadata not found, cannot add.');
        return;
      }

      await dbAddTrackToPlaylist(playlistId, trackToAddToPlaylist);
      // Refresh playlists state
      const updated = await dbGetPlaylists(user.uid);
      setPlaylists(updated);
    } catch (err) {
      console.error('Add track to playlist error:', err);
    }
  };

  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    if (!user) return;
    try {
      await dbRemoveTrackFromPlaylist(playlistId, trackId);
      // Refresh playlists state
      const updated = await dbGetPlaylists(user.uid);
      setPlaylists(updated);
    } catch (err) {
      console.error('Remove track from playlist error:', err);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-zinc-100 overflow-hidden relative font-sans">
      {/* Home dashboard */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Home
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          user={user}
          likedTrackIds={likedTrackIds}
          likedTracks={likedTracks}
          playlists={playlists}
          onSelectTrack={handleSelectTrack}
          onToggleLike={handleToggleLike}
          onLoginClick={() => setShowAuthModal(true)}
          onLogoutClick={handleLogout}
          onCreatePlaylist={handleCreatePlaylist}
          onAddTrackToPlaylist={handleAddTrackToPlaylist}
          onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
        />
      </div>

      {/* Persistent Bottom Audio Player Bar */}
      <Player
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        isLiked={currentTrack ? likedTrackIds.includes(currentTrack.id) : false}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleLike={currentTrack ? () => handleToggleLike(currentTrack.id) : undefined}
      />

      {/* Global Authentication Dialog Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}
