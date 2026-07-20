import React, { useState } from 'react';
import { useMusic } from '../store/musicStore';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, VolumeX, Heart, ListMusic, Maximize2 } from 'lucide-react';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    progress,
    duration,
    seek,
    volume,
    setVolume,
    likes,
    toggleLike,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    playbackState,
    setIsFullscreenPlayerOpen
  } = useMusic();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);

  if (!currentTrack) {
    return (
      <div className="h-20 bg-spotify-light border-t border-spotify-highlight px-4 flex items-center justify-center text-gray-500 text-sm max-md:hidden">
        Select a track to start playing free music instantly!
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSec = Number(e.target.value);
    seek(targetSec);
  };

  const isLiked = likes.includes(currentTrack.id);

  return (
    <div className="h-24 bg-[#0a0a0c] border-t border-spotify-highlight/60 px-6 flex items-center justify-between shrink-0 select-none max-md:hidden">
      {/* Track info */}
      <div 
        onClick={() => setIsFullscreenPlayerOpen(true)}
        className="flex items-center space-x-4 w-1/3 min-w-[200px] cursor-pointer group/info"
      >
        <img
          src={currentTrack.coverUrl}
          alt={currentTrack.title}
          className="h-14 w-14 rounded-lg object-cover shadow-md border border-spotify-highlight shrink-0 group-hover/info:scale-105 transition-all"
        />
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white truncate group-hover/info:text-spotify-green transition-colors">
            {currentTrack.title}
          </h4>
          <p className="text-xs text-gray-400 truncate group-hover/info:text-gray-200 transition-colors">
            {currentTrack.artist}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(currentTrack.id);
          }}
          className={`p-1.5 rounded-full hover:bg-spotify-highlight transition-colors ${isLiked ? 'text-spotify-green' : 'text-gray-400 hover:text-white'}`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Main playback control center */}
      <div className="flex flex-col items-center w-1/3 max-w-[600px]">
        {/* Top buttons row */}
        <div className="flex items-center space-x-6 mb-2">
          <button
            onClick={() => setShuffle(!shuffle)}
            className={`p-1 hover:scale-105 active:scale-95 transition-all ${shuffle ? 'text-spotify-green' : 'text-gray-400 hover:text-white'}`}
            title="Shuffle"
          >
            <Shuffle className="h-4 w-4" />
          </button>

          <button
            onClick={prevTrack}
            className="text-gray-400 hover:text-white p-1 hover:scale-105 active:scale-95 transition-all"
            title="Previous"
          >
            <SkipBack className="h-5 w-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="bg-white hover:scale-105 active:scale-95 text-black p-3 rounded-full flex items-center justify-center shadow-lg transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current text-black" /> : <Play className="h-5 w-5 fill-current text-black ml-0.5" />}
          </button>

          <button
            onClick={nextTrack}
            className="text-gray-400 hover:text-white p-1 hover:scale-105 active:scale-95 transition-all"
            title="Next"
          >
            <SkipForward className="h-5 w-5 fill-current" />
          </button>

          <button
            onClick={() => setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
            className={`p-1 relative hover:scale-105 active:scale-95 transition-all ${repeat !== 'none' ? 'text-spotify-green' : 'text-gray-400 hover:text-white'}`}
            title={`Repeat: ${repeat}`}
          >
            <Repeat className="h-4 w-4" />
            {repeat === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-spotify-green text-black px-0.5 font-bold rounded-full">1</span>
            )}
          </button>
        </div>

        {/* Progress Timeline Slider bar */}
        <div className="flex items-center space-x-3 w-full text-xs text-gray-400">
          <span className="font-mono">{formatTime(progress)}</span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || currentTrack.duration || 100}
              value={progress}
              onChange={handleProgressChange}
              className="w-full accent-spotify-green h-1 bg-spotify-highlight rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all"
            />
          </div>
          <span className="font-mono">{formatTime(duration || currentTrack.duration || 240)}</span>
        </div>
      </div>

      {/* Auxiliary control center (volume, visualizer, queue) */}
      <div className="flex items-center justify-end space-x-4 w-1/3 min-w-[200px]">
        {/* Dynamic Acoustic Waveform SVG Visualizer */}
        {isPlaying && (
          <div className="flex items-end justify-center space-x-0.5 h-6 w-12 mr-2">
            {[1, 2, 3, 4, 5, 6].map((bar) => {
              const animDuration = [0.6, 0.9, 1.2, 0.7, 1.0, 0.8][bar - 1];
              return (
                <div
                  key={bar}
                  className="bg-spotify-green w-1 rounded-full animate-pulse"
                  style={{
                    height: `${Math.floor(Math.random() * 80) + 20}%`,
                    animationDuration: `${animDuration}s`
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="flex items-center space-x-2 group/volume w-32 shrink-0">
          <button
            onClick={handleToggleMute}
            className="text-gray-400 hover:text-white p-1 transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-1 accent-spotify-green bg-spotify-highlight rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Maximize to full screen */}
        <button
          onClick={() => setIsFullscreenPlayerOpen(true)}
          className="text-gray-400 hover:text-white p-1.5 hover:bg-spotify-highlight rounded-full transition-colors cursor-pointer"
          title="Immersive Mode"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
