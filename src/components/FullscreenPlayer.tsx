import React, { useEffect, useState } from 'react';
import { useMusic } from '../store/musicStore';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, Heart, X, Sparkles, Music, Disc, Layers } from 'lucide-react';

export const FullscreenPlayer: React.FC = () => {
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
    isFullscreenPlayerOpen,
    setIsFullscreenPlayerOpen,
    theme
  } = useMusic();

  const [activeVisualizerTab, setActiveVisualizerTab] = useState<'vinyl' | 'lyrics'>('vinyl');

  if (!isFullscreenPlayerOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  // Timing-based lyrics mapper
  const getLyricsForTrack = (trackId: string, time: number) => {
    if (trackId === 'bI8P68SSh3s') { // Tamally Maak
      if (time < 8) return { ar: 'تمت معاك.. ولو حتى بعيد عني في قلبي هواك', en: 'Always with you.. even if you are far, your love is in my heart' };
      if (time < 18) return { ar: 'تمت معاك.. يا أغلى عمري وبتمناك', en: 'Always with you.. you are the most precious in my life' };
      if (time < 30) return { ar: 'يا ريت قلبي يكون وياك', en: 'I wish my heart could be with you' };
      if (time < 45) return { ar: 'تملي حبيبي شاغل بالي.. تملي عنيا بتناديلك', en: 'Always, my darling, you occupy my mind.. always my eyes call you' };
      return { ar: 'تملي في قلبي يا غالي.. تملي عيوني بتناديك', en: 'Always in my heart, precious one.. always my eyes call you' };
    }
    if (trackId === 'ol7_m2bH400') { // Kifak Inta
      if (time < 12) return { ar: 'بتذكر آخر مرة شفتك بسنتها', en: 'I remember the last time I saw you, that year' };
      if (time < 22) return { ar: 'كيفك انت ملا انت', en: 'How are you? What a person you are!' };
      if (time < 35) return { ar: 'بتذكر آخر كلمة قلتلي ياها تذكرتها', en: 'I remember the last word you said to me, I remembered it' };
      return { ar: 'وقلتلي اتأخرتي كتير.. كيفك انت', en: 'And you told me you are very late.. how are you?' };
    }
    if (trackId === 'fJm4xLpUj0c') { // Ahwak
      if (time < 10) return { ar: 'أهواك.. وأتمنى لو أنساك', en: 'I adore you.. and wish I could forget you' };
      if (time < 22) return { ar: 'وأنسى روحي وياك.. وإن ضاعت يبقى فداك', en: 'And forget my soul with you.. and if it is lost, let it be for your sake' };
      return { ar: 'لو كان قلبك يفتكرني.. أهواك', en: 'If your heart remembers me.. I adore you' };
    }
    
    // Fallback poetic quotes for Lofi / instrumental ambient tracks
    if (time < 15) return { ar: 'موجات صوتية هادئة مريحة للأعصاب...', en: 'Quiet sound waves relaxing for the mind...' };
    if (time < 35) return { ar: 'اسمح للموسيقى بأن تملأ الفراغ والروح', en: 'Let the music fill the silence and the soul' };
    return { ar: 'استمع بقلبك.. حيث تلتقي الكلمات بالنغمات', en: 'Listen with your heart.. where words meet melodies' };
  };

  const currentLyric = getLyricsForTrack(currentTrack.id, progress);
  const isLiked = likes.includes(currentTrack.id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 overflow-hidden selection:bg-spotify-green selection:text-black"
        style={{
          background: theme === 'light' 
            ? 'linear-gradient(to bottom, #f1f5f9, #e2e8f0, #cbd5e1)'
            : 'linear-gradient(to bottom, #09090b, #030303, #000000)'
        }}
      >
        {/* Immersive Blurry Artwork Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden opacity-30 blur-[100px] pointer-events-none scale-125">
          <img
            src={currentTrack.coverUrl}
            alt=""
            className="w-full h-full object-cover animate-pulse"
            style={{ animationDuration: '8s' }}
          />
        </div>

        {/* Top bar header */}
        <header className="flex items-center justify-between w-full relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-spotify-green text-black rounded-lg">
              <Music className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-spotify-green">Now Playing / مشغل الصوت</span>
              <h2 className={`text-sm font-bold leading-none ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>listen2song immersive</h2>
            </div>
          </div>

          {/* Tab selector for center visualization */}
          <div className="flex bg-black/30 p-1 rounded-full border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveVisualizerTab('vinyl')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeVisualizerTab === 'vinyl' ? 'bg-spotify-green text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Vinyl Record
            </button>
            <button
              onClick={() => setActiveVisualizerTab('lyrics')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeVisualizerTab === 'lyrics' ? 'bg-spotify-green text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Karaoke Lyrics
            </button>
          </div>

          <button
            onClick={() => setIsFullscreenPlayerOpen(false)}
            className={`p-3 rounded-full border transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md ${theme === 'light' ? 'bg-white/80 border-slate-300 text-slate-800 hover:bg-white' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Center content slot */}
        <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-5xl mx-auto my-8 relative z-10">
          
          {/* Visualizer Slot A: Floating Vinyl Record */}
          {activeVisualizerTab === 'vinyl' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center"
            >
              <div className="relative">
                {/* Vinyl outer sleeve glowing border */}
                <div className={`absolute -inset-4 rounded-full blur-xl opacity-30 ${isPlaying ? 'bg-spotify-green animate-pulse' : 'bg-transparent'}`} />
                
                {/* Vinyl record disc body */}
                <div 
                  className={`relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] rounded-full bg-neutral-900 border-[8px] border-neutral-950 flex items-center justify-center shadow-2xl overflow-hidden transition-transform ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 0 0 30px rgba(0,0,0,0.9)'
                  }}
                >
                  {/* Vinyl grooves lines (repeated SVG look) */}
                  <div className="absolute inset-8 rounded-full border border-neutral-800/40" />
                  <div className="absolute inset-16 rounded-full border border-neutral-800/40" />
                  <div className="absolute inset-24 rounded-full border border-neutral-800/40" />
                  <div className="absolute inset-32 rounded-full border border-neutral-800/40" />

                  {/* Album Cover placed in vinyl center */}
                  <div className="w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] rounded-full overflow-hidden border-[4px] border-neutral-950 relative">
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Vinyl center pinhole */}
                    <div className="absolute inset-0 m-auto w-5 h-5 bg-black rounded-full border-2 border-neutral-800 shadow-inner" />
                  </div>
                </div>

                {/* Floating music note icon indicator */}
                {isPlaying && (
                  <motion.div
                    animate={{ y: [-10, 10, -10], rotate: [0, 15, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="absolute -top-6 -right-6 p-2 bg-spotify-green rounded-full shadow-lg text-black"
                  >
                    <Disc className="h-4 w-4 animate-spin" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Visualizer Slot B: Large Typography Synced Lyrics Karaoke */}
          {activeVisualizerTab === 'lyrics' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col justify-center items-center text-center space-y-6 px-4 py-8 bg-black/20 border border-white/5 rounded-3xl backdrop-blur-lg w-full max-w-xl h-[300px] sm:h-[400px]"
            >
              <div className="space-y-6 max-w-md">
                <Sparkles className="h-6 w-6 text-spotify-green mx-auto animate-bounce" />
                <p className="text-sm font-bold tracking-widest text-spotify-green uppercase font-mono">Live Karaoke Sync</p>
                <div className="space-y-4">
                  <h3 className={`text-2xl sm:text-3xl font-display font-bold leading-relaxed tracking-tight ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                    {currentLyric.ar}
                  </h3>
                  <h4 className="text-base sm:text-lg text-gray-400 font-sans italic leading-relaxed">
                    {currentLyric.en}
                  </h4>
                </div>
              </div>
            </motion.div>
          )}

          {/* Track Detail / Meta Right side */}
          <div className="w-full md:w-[320px] shrink-0 text-center md:text-left flex flex-col justify-center">
            <span className="text-[10px] bg-spotify-green/20 text-spotify-green font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto md:mx-0 mb-3">
              {currentTrack.genres[0] || 'Acoustic Wave'}
            </span>
            <h1 className={`text-3xl font-display font-bold tracking-tight leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {currentTrack.title}
            </h1>
            <p className="text-lg text-gray-400 mt-2 font-medium">
              {currentTrack.artist}
            </p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-mono">
              Album: {currentTrack.album}
            </p>

            {/* Quick interactive like button inside fullscreen */}
            <div className="flex items-center justify-center md:justify-start space-x-4 mt-6">
              <button
                onClick={() => toggleLike(currentTrack.id)}
                className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-full border transition-all text-xs font-bold hover:scale-105 active:scale-95 cursor-pointer ${isLiked ? 'bg-spotify-green border-spotify-green text-black' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{isLiked ? 'Liked' : 'Like song'}</span>
              </button>
            </div>
          </div>

        </main>

        {/* Bottom controls dock */}
        <footer className="w-full max-w-4xl mx-auto space-y-6 relative z-10">
          {/* Progress Timeline bar */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={duration || currentTrack.duration || 100}
              value={progress}
              onChange={handleProgressChange}
              className="w-full accent-spotify-green h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all"
            />
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration || currentTrack.duration || 240)}</span>
            </div>
          </div>

          {/* Expanded playback navigation row */}
          <div className="flex items-center justify-between px-4">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-2 hover:scale-110 transition-all ${shuffle ? 'text-spotify-green' : 'text-gray-400 hover:text-white'}`}
              title="Shuffle"
            >
              <Shuffle className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-8">
              <button
                onClick={prevTrack}
                className="text-gray-400 hover:text-white hover:scale-110 active:scale-90 transition-all p-2"
                title="Previous"
              >
                <SkipBack className="h-7 w-7 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="bg-white hover:scale-105 active:scale-95 text-black p-5 rounded-full flex items-center justify-center shadow-2xl transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying 
                  ? <Pause className="h-8 w-8 fill-current text-black" /> 
                  : <Play className="h-8 w-8 fill-current text-black ml-1" />
                }
              </button>

              <button
                onClick={nextTrack}
                className="text-gray-400 hover:text-white hover:scale-110 active:scale-90 transition-all p-2"
                title="Next"
              >
                <SkipForward className="h-7 w-7 fill-current" />
              </button>
            </div>

            <button
              onClick={() => setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
              className={`p-2 relative hover:scale-110 transition-all ${repeat !== 'none' ? 'text-spotify-green' : 'text-gray-400 hover:text-white'}`}
              title={`Repeat: ${repeat}`}
            >
              <Repeat className="h-5 w-5" />
              {repeat === 'one' && (
                <span className="absolute top-0 right-0 text-[8px] bg-spotify-green text-black px-1 font-bold rounded-full">1</span>
              )}
            </button>
          </div>

          {/* Quick TV mode indicator / credits bar */}
          <div className="text-center py-2 border-t border-white/5">
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              free unlimited audio streams • listen2song platform engine
            </p>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
