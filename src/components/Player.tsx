import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Heart } from 'lucide-react';
import { Track } from '../types/index';

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isLiked?: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleLike?: () => void;
}

// Format seconds into MM:SS
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const Player: React.FC<PlayerProps> = ({
  currentTrack,
  isPlaying,
  progress,
  duration,
  volume,
  isLiked = false,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleLike,
}) => {
  if (!currentTrack) return null;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseInt(e.target.value, 10));
  };

  const toggleMute = () => {
    onVolumeChange(volume > 0 ? 0 : 80);
  };

  return (
    <div
      id="bottom-player-bar"
      className="fixed bottom-0 left-0 right-0 h-24 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-50 select-none"
    >
      {/* Track Info (Left section) */}
      <div className="flex items-center w-1/4 min-w-[180px] gap-3">
        {currentTrack.coverUrl ? (
          <img
            id="player-track-cover"
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-14 h-14 rounded-md object-cover shadow-md"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-14 h-14 rounded-md bg-zinc-800 flex items-center justify-center shadow-md">
            <Music className="text-zinc-400 w-6 h-6" />
          </div>
        )}
        <div className="overflow-hidden flex-1">
          <h4
            id="player-track-title"
            className="text-white text-sm font-semibold truncate hover:underline cursor-pointer"
          >
            {currentTrack.title}
          </h4>
          <p id="player-track-artist" className="text-zinc-400 text-xs truncate">
            {currentTrack.artist}
          </p>
        </div>
        {onToggleLike && (
          <button
            onClick={onToggleLike}
            className={`shrink-0 p-1.5 cursor-pointer transition-colors ${
              isLiked ? 'text-[#1DB954]' : 'text-zinc-400 hover:text-white'
            }`}
            aria-label={isLiked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#1DB954]' : ''}`} />
          </button>
        )}
      </div>

      {/* Control Buttons & Progress (Middle section) */}
      <div className="flex flex-col items-center flex-1 max-w-xl px-4 gap-2">
        <div className="flex items-center gap-6">
          <button
            id="player-btn-prev"
            onClick={onPrev}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="الأغنية السابقة"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            id="player-btn-play-pause"
            onClick={onPlayPause}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg cursor-pointer"
            aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current text-black ml-0" />
            ) : (
              <Play className="w-5 h-5 fill-current text-black ml-0.5" />
            )}
          </button>
          <button
            id="player-btn-next"
            onClick={onNext}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="الأغنية التالية"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Progress Timeline */}
        <div className="flex items-center w-full gap-2 text-xs text-zinc-400">
          <span id="player-time-current" className="w-10 text-right">
            {formatTime(progress)}
          </span>
          <div className="flex-1 relative group flex items-center">
            <input
              id="player-progress-slider"
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={handleSeekChange}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#1DB954] hover:bg-zinc-600 transition-colors"
            />
          </div>
          <span id="player-time-duration" className="w-10 text-left">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume controls (Right section) */}
      <div className="flex items-center justify-end w-1/4 min-w-[120px] gap-2.5">
        <button
          id="player-btn-mute"
          onClick={toggleMute}
          className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="كتم الصوت"
        >
          {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <input
          id="player-volume-slider"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="w-20 sm:w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
        />
      </div>
    </div>
  );
};
