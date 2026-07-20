import React, { useState, useEffect } from 'react';
import { useMusic } from '../store/musicStore';
import { Play, Pause, SkipForward, SkipBack, Heart, Music, Tv, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Track } from '../types';

export const TvInterface: React.FC = () => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    playTrack,
    setIsTvMode
  } = useMusic();

  // Selected item index in the tracks array
  const [focusIndex, setFocusIndex] = useState(0);

  // Monitor spatial keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((prev) => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((prev) => Math.min(tracks.length - 1, prev + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusIndex((prev) => Math.max(0, prev - 3));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusIndex((prev) => Math.min(tracks.length - 1, prev + 3));
          break;
        case 'Enter':
          e.preventDefault();
          if (tracks[focusIndex]) {
            playTrack(tracks[focusIndex], tracks);
          }
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          setIsTvMode(false); // Close TV mode
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tracks, focusIndex, playTrack, togglePlay, setIsTvMode]);

  return (
    <div className="fixed inset-0 bg-[#060608] z-50 flex flex-col p-8 select-none text-white animate-in fade-in duration-300 overflow-hidden font-display">
      {/* Top Banner / TV Brand */}
      <div className="flex items-center justify-between border-b border-spotify-highlight pb-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-spotify-green text-black rounded-xl">
            <Tv className="h-8 w-8 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-wider uppercase">listen2song TV</span>
            <p className="text-xs text-gray-500 font-mono">10-FOOT USER INTERFACE • NO REMOTE KEYPAD REQUIRED</p>
          </div>
        </div>

        {/* Spatial Tips */}
        <div className="flex items-center space-x-4 text-xs font-semibold text-gray-400">
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-spotify-highlight/40 rounded-full border border-white/5">
            <span>Arrow Keys</span>
            <span className="text-spotify-green">Navigate</span>
          </span>
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-spotify-highlight/40 rounded-full border border-white/5">
            <CornerDownLeft className="h-3.5 w-3.5 text-spotify-green" />
            <span>Enter to Play</span>
          </span>
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-spotify-highlight/40 rounded-full border border-white/5">
            <span>Esc</span>
            <span className="text-red-400">Close TV</span>
          </span>
        </div>
      </div>

      {/* Main split viewport (Left: Now Playing, Right: Playlist Bento Grid) */}
      <div className="flex-1 grid grid-cols-12 gap-8 items-center min-h-0">
        {/* Left Side: Massive Player Hub */}
        <div className="col-span-5 flex flex-col justify-center items-center text-center space-y-6 bg-spotify-light/30 border border-spotify-highlight/30 rounded-3xl p-8 h-full">
          {currentTrack ? (
            <>
              <div className="relative w-64 aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-spotify-highlight">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white line-clamp-1">{currentTrack.title}</h2>
                <p className="text-lg text-spotify-green truncate">{currentTrack.artist}</p>
                <p className="text-xs text-gray-500 truncate">{currentTrack.album}</p>
              </div>

              {/* Status Visualizer */}
              {isPlaying ? (
                <div className="flex items-end space-x-1 h-8">
                  {[1, 2, 3, 4, 5].map((b) => (
                    <div
                      key={b}
                      className="w-1.5 bg-spotify-green rounded-full animate-bounce"
                      style={{ height: '100%', animationDuration: `${0.6 + b * 0.1}s` }}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-500 uppercase tracking-widest font-mono">PAUSED</span>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-spotify-highlight/50 rounded-full inline-block">
                <Music className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-lg text-gray-400 font-bold">No Track Loaded</p>
              <p className="text-xs text-gray-500">Navigate the grid on the right to start playing.</p>
            </div>
          )}
        </div>

        {/* Right Side: Massive Spatial Grid (3 items wide, 2 high or scrolling) */}
        <div className="col-span-7 flex flex-col h-full min-h-0">
          <h3 className="text-lg font-bold text-gray-400 mb-4 uppercase tracking-wider">Free Music Collections</h3>
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-3 gap-6">
            {tracks.map((track, idx) => {
              const isFocused = idx === focusIndex;
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  className={`bg-spotify-light/60 border border-spotify-highlight rounded-2xl p-4 cursor-pointer transition-all ${isFocused ? 'tv-focus-active' : ''}`}
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 relative">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        {isPlaying ? (
                          <div className="flex items-end space-x-1 h-6">
                            {[1, 2, 3].map((b) => (
                              <div
                                key={b}
                                className="w-1 bg-spotify-green rounded-full animate-bounce"
                                style={{ height: '100%', animationDuration: `${0.4 + b * 0.15}s` }}
                              />
                            ))}
                          </div>
                        ) : (
                          <Play className="h-6 w-6 text-white fill-current" />
                        )}
                      </div>
                    )}
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
      </div>
    </div>
  );
};
