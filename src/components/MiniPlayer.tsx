import React, { useState } from 'react';
import { useMusic } from '../store/musicStore';
import { Play, Pause, SkipForward, ChevronDown, Heart, Volume2, Music, Shuffle, Repeat, Maximize2 } from 'lucide-react';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    progress,
    duration,
    seek,
    likes,
    toggleLike,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    setIsFullscreenPlayerOpen
  } = useMusic();

  const [expanded, setExpanded] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const isLiked = likes.includes(currentTrack.id);

  return (
    <div className="md:hidden fixed bottom-16 left-2 right-2 z-40">
      {/* Tiny Sticky bar (collapsible state) */}
      {!expanded ? (
        <div
          onClick={() => setExpanded(true)}
          className="flex items-center justify-between bg-spotify-light/95 backdrop-blur-md border border-spotify-highlight/80 rounded-2xl p-2 pl-3 shadow-xl active:scale-[0.99] transition-all"
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="h-10 w-10 rounded-lg object-cover border border-spotify-highlight shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
              <p className="text-[10px] text-gray-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 pr-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(currentTrack.id);
              }}
              className={`p-1 ${isLiked ? 'text-spotify-green' : 'text-gray-400'}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="bg-white text-black p-2 rounded-full flex items-center justify-center shadow-md"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current text-black" /> : <Play className="h-4 w-4 fill-current text-black ml-0.5" />}
            </button>
          </div>
        </div>
      ) : (
        /* Full screen expanded overlay panel */
        <div className="fixed inset-0 bg-[#0a0a0c] z-50 flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setExpanded(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-spotify-highlight rounded-full transition-colors"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">PLAYING FROM TRACKS</span>
              <h5 className="text-xs font-bold text-white max-w-[200px] truncate">{currentTrack.album}</h5>
            </div>
            <button
              onClick={() => {
                setExpanded(false);
                setIsFullscreenPlayerOpen(true);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-spotify-highlight rounded-full transition-colors"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>

          {/* Large cover art */}
          <div className="flex-1 flex flex-col justify-center items-center my-4">
            <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-spotify-highlight">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Title & metadata */}
          <div className="w-full mb-6">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-display font-bold text-white truncate">{currentTrack.title}</h3>
                <p className="text-sm text-gray-400 truncate mt-1">{currentTrack.artist}</p>
              </div>
              <button
                onClick={() => toggleLike(currentTrack.id)}
                className={`p-2 shrink-0 ${isLiked ? 'text-spotify-green' : 'text-gray-400'}`}
              >
                <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Slider bar progress indicator */}
          <div className="w-full space-y-2 mb-6">
            <input
              type="range"
              min={0}
              max={duration || currentTrack.duration || 100}
              value={progress}
              onChange={handleProgressChange}
              className="w-full accent-spotify-green h-1 bg-spotify-highlight rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration || currentTrack.duration || 240)}</span>
            </div>
          </div>

          {/* Expanded controls row */}
          <div className="flex items-center justify-between w-full px-4 mb-8 shrink-0">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-2 transition-colors ${shuffle ? 'text-spotify-green' : 'text-gray-400'}`}
            >
              <Shuffle className="h-5 w-5" />
            </button>

            <button
              onClick={prevTrack}
              className="p-3 text-white transition-colors"
            >
              <SkipForward className="h-7 w-7 rotate-180 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              className="bg-white text-black p-5 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="h-8 w-8 fill-current text-black" /> : <Play className="h-8 w-8 fill-current text-black ml-1" />}
            </button>

            <button
              onClick={nextTrack}
              className="p-3 text-white transition-colors"
            >
              <SkipForward className="h-7 w-7 fill-current" />
            </button>

            <button
              onClick={() => setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
              className={`p-2 relative transition-colors ${repeat !== 'none' ? 'text-spotify-green' : 'text-gray-400'}`}
            >
              <Repeat className="h-5 w-5" />
              {repeat === 'one' && (
                <span className="absolute top-0 right-0 text-[8px] bg-spotify-green text-black px-0.5 font-bold rounded-full">1</span>
              )}
            </button>
          </div>

          {/* Quick TV Mode Launcher shortcut */}
          <div className="w-full pb-4 text-center">
            <div className="text-[10px] text-gray-500 font-mono flex items-center justify-center space-x-1">
              <Music className="h-3 w-3 text-spotify-green" />
              <span>LISTEN2SONG FREE AUDIO ENGINE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
