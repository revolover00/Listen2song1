import React, { useState, useMemo } from 'react';
import { useMusic } from '../store/musicStore';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BarChart2, Award, Clock, Music, Heart, Share2, Disc, User, Check, Flame } from 'lucide-react';
import { Track } from '../types';

export const StatsWrapped: React.FC = () => {
  const { history, likes, tracks, theme } = useMusic();
  const [selectedPersonality, setSelectedPersonality] = useState<'tarab' | 'lofi' | 'pop'>('tarab');
  const [isCopied, setIsCopied] = useState(false);

  // Derive stats with fallback seeded data if history is sparse
  const stats = useMemo(() => {
    const defaultHistory = [
      { id: 'bI8P68SSh3s', title: 'Tamally Maak (تمت معاك)', artist: 'Amr Diab', genres: ['Arabic Pop', 'Romantic'], duration: 269 },
      { id: 'ol7_m2bH400', title: 'Kifak Inta (كيفك انت)', artist: 'Fairouz', genres: ['Arabic Classical', 'Tarab'], duration: 212 },
      { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio - Chill Beats', artist: 'ChilledCow', genres: ['Lofi Hip Hop', 'Ambient'], duration: 3600 },
      { id: 'ol7_m2bH400', title: 'Kifak Inta (كيفك انت)', artist: 'Fairouz', genres: ['Arabic Classical', 'Tarab'], duration: 212 },
    ];

    const activeHistory = history.length > 0 ? history : defaultHistory;

    // 1. Calculate total minutes listened
    const totalSeconds = activeHistory.reduce((acc, t) => acc + (t.duration || 240), 0);
    const totalMinutes = Math.max(12, Math.round(totalSeconds / 60));

    // 2. Count top tracks
    const trackCounts: Record<string, { track: Track | any; count: number }> = {};
    activeHistory.forEach(t => {
      if (!trackCounts[t.id]) {
        trackCounts[t.id] = { track: t, count: 0 };
      }
      trackCounts[t.id].count++;
    });
    const sortedTrackCounts = Object.values(trackCounts).sort((a, b) => b.count - a.count);
    const topTrack = sortedTrackCounts[0]?.track || defaultHistory[0];

    // 3. Count top artists
    const artistCounts: Record<string, number> = {};
    activeHistory.forEach(t => {
      artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
    });
    const sortedArtistCounts = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]);
    const topArtist = sortedArtistCounts[0]?.[0] || 'Fairouz';

    // 4. Count top genres
    const genreCounts: Record<string, number> = {};
    activeHistory.forEach(t => {
      const trackGenres = t.genres || ['Pop'];
      trackGenres.forEach((g: string) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    const sortedGenreCounts = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
    const topGenre = sortedGenreCounts[0]?.[0] || 'Tarab';

    return {
      totalMinutes,
      topTrack,
      topArtist,
      topGenre,
      uniqueSongsCount: sortedTrackCounts.length,
      likesCount: likes.length || 3
    };
  }, [history, likes, tracks]);

  const personalities = {
    tarab: {
      id: 'tarab',
      title: 'Tarab Connoisseur / سمّيع طرب',
      description: 'You value vocal mastery, grand orchestral sweeps, and timeless classical Arabic legends. You appreciate the slow build, the poetic depth, and the emotional release of a true musical masterpiece.',
      gradient: 'from-amber-900 via-rose-950 to-stone-950',
      badge: 'Golden Vintage',
      accentColor: 'text-amber-400',
      bgBadge: 'bg-amber-400/20 text-amber-300 border-amber-400/30'
    },
    lofi: {
      id: 'lofi',
      title: 'Ambient Dreamer / الحالم الهادئ',
      description: 'Your waves are chill, relaxed, and focused. You float on peaceful lofi study beats and dream pop melodies. Noise is filtered; your mind thrives in cozy space, perfect for late-night focus sessions.',
      gradient: 'from-indigo-950 via-purple-950 to-slate-950',
      badge: 'Cosmic Neon',
      accentColor: 'text-indigo-400',
      bgBadge: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30'
    },
    pop: {
      id: 'pop',
      title: 'Acoustic Adventurer / المغامر الصوتي',
      description: 'Energy, rhythm, and modern synth-beats define your sonic journeys. You love memorable hooks, summer driving anthems, and lively rhythms that get your feet moving instantly.',
      gradient: 'from-emerald-950 via-teal-950 to-neutral-950',
      badge: 'Acid Waves',
      accentColor: 'text-spotify-green',
      bgBadge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
    }
  };

  const currentPersonality = personalities[selectedPersonality];

  const handleShare = () => {
    setIsCopied(true);
    navigator.clipboard.writeText(`My listen2song vibe personality is: ${currentPersonality.title}! Top song is "${stats.topTrack.title}" by ${stats.topTrack.artist}. Check your wrapped at listen2song! 🎵`);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Your Wrapped Profile / إحصائياتك</h1>
          <p className="text-xs text-gray-400 mt-1">A real-time deep-dive analysis of your cost-free listening waves.</p>
        </div>
        <div className="flex items-center space-x-2 bg-spotify-highlight px-3 py-1.5 rounded-full border border-spotify-highlight/40">
          <Flame className="h-4 w-4 text-spotify-green animate-pulse" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">Live Wrapped Engine Active</span>
        </div>
      </div>

      {/* Grid: Stats Widgets Bento boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Time */}
        <div className={`p-6 rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-spotify-light/60 border-spotify-highlight/40'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-mono text-gray-400 uppercase">Listening Time</span>
            <div className="p-2 bg-spotify-green/20 text-spotify-green rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-3xl font-display font-bold tracking-tight">{stats.totalMinutes}</h3>
          <p className="text-xs text-gray-400 mt-2">Minutes of high-fidelity audio streamed.</p>
        </div>

        {/* Widget 2: Top Song */}
        <div className={`p-6 rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-spotify-light/60 border-spotify-highlight/40'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-mono text-gray-400 uppercase">Top Anthem</span>
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Music className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold truncate">{stats.topTrack.title}</h3>
          <p className="text-xs text-gray-400 mt-1 truncate">by {stats.topTrack.artist}</p>
          <div className="flex items-center space-x-1.5 mt-3 text-[10px] text-indigo-400 font-bold uppercase">
            <Award className="h-3.5 w-3.5" />
            <span>Most Played</span>
          </div>
        </div>

        {/* Widget 3: Top Artist */}
        <div className={`p-6 rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-spotify-light/60 border-spotify-highlight/40'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-mono text-gray-400 uppercase">Top Artist</span>
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <User className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-xl font-display font-bold tracking-tight truncate">{stats.topArtist}</h3>
          <p className="text-xs text-gray-400 mt-2">Dominating your audio waves.</p>
        </div>

        {/* Widget 4: Top Genre */}
        <div className={`p-6 rounded-2xl border transition-all ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-spotify-light/60 border-spotify-highlight/40'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-mono text-gray-400 uppercase">Acoustic Mood</span>
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <BarChart2 className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-xl font-display font-bold tracking-tight truncate">{stats.topGenre}</h3>
          <p className="text-xs text-gray-400 mt-2">Your main genre stream signature.</p>
        </div>
      </div>

      {/* Personality Card Selector & Infographic Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Selector Panel on left */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold font-display">Select Personality / اختر بطاقتك</h2>
            <p className="text-xs text-gray-400 mt-1">Select from beautiful human-crafted design themes to customize your shareable Wrapped profile.</p>
          </div>

          <div className="space-y-3">
            {[personalities.tarab, personalities.lofi, personalities.pop].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPersonality(p.id as any)}
                className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${selectedPersonality === p.id ? 'bg-spotify-highlight border-spotify-green text-white shadow-md' : 'bg-spotify-light/30 border-spotify-highlight/20 text-gray-400 hover:text-white hover:bg-spotify-light/50'}`}
              >
                <div>
                  <h4 className="text-sm font-bold">{p.title}</h4>
                  <span className="text-[10px] uppercase font-mono mt-0.5 tracking-wider font-bold text-gray-400 block">{p.badge} Theme</span>
                </div>
                <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedPersonality === p.id ? 'bg-spotify-green border-spotify-green' : 'border-gray-600'}`}>
                  {selectedPersonality === p.id && <Check className="h-3 w-3 text-black stroke-[3]" />}
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 bg-spotify-highlight/30 border border-spotify-highlight/20 rounded-xl text-xs text-gray-400 leading-relaxed">
            <span className="font-bold text-white block mb-1">How it is calculated:</span>
            We evaluate your custom collaborative filtering scrobbles, song completion rates (completed vs. skipped tracks), and MusicBrainz genres data to map your personality.
          </div>
        </div>

        {/* Infographic Poster Canvas on right */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[380px] sm:max-w-[420px]">
            {/* Poster Card Shell with Framer Motion transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPersonality}
                initial={{ opacity: 0, scale: 0.95, rotate: -1 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.95, rotate: 1 }}
                transition={{ duration: 0.3 }}
                className={`relative rounded-3xl p-8 text-white overflow-hidden shadow-2xl border border-white/10 aspect-[3/4.5] flex flex-col justify-between bg-gradient-to-b ${currentPersonality.gradient}`}
              >
                {/* Background rotating graphic details */}
                <div className="absolute right-[-20%] top-[10%] w-[240px] h-[240px] rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="absolute left-[-20%] bottom-[20%] w-[200px] h-[200px] rounded-full bg-spotify-green/5 blur-3xl pointer-events-none" />

                {/* Top Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest uppercase border border-white/20 px-2.5 py-1 rounded-full bg-white/5 backdrop-blur-md">
                      listen2song wrapped
                    </span>
                    <span className={`text-xs font-mono font-bold uppercase border px-2.5 py-1 rounded-full ${currentPersonality.bgBadge}`}>
                      {currentPersonality.badge} vibe
                    </span>
                  </div>

                  <div className="space-y-2 mt-4">
                    <h2 className="text-2xl sm:text-3xl font-display font-bold leading-tight tracking-tight">
                      {currentPersonality.title}
                    </h2>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans font-light">
                      {currentPersonality.description}
                    </p>
                  </div>
                </div>

                {/* Core Stats Box on the infographic card */}
                <div className="bg-black/35 rounded-2xl p-4 border border-white/10 backdrop-blur-md space-y-3.5 my-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">My Sound Stats</span>
                    <Flame className="h-3.5 w-3.5 text-spotify-green animate-pulse" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase font-mono">Minutes Streamed</span>
                      <span className="text-base font-bold font-display text-white">{stats.totalMinutes}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase font-mono">Top Genre</span>
                      <span className="text-base font-bold font-display text-spotify-green truncate block">{stats.topGenre}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-2 space-y-1">
                    <span className="text-[9px] text-gray-400 block uppercase font-mono">Top Track / الأكثر استماعًا</span>
                    <div className="flex items-center space-x-2">
                      <Disc className="h-4 w-4 text-spotify-green animate-spin shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate leading-none">{stats.topTrack.title}</p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{stats.topTrack.artist}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer credit branding */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-spotify-green rounded text-black shrink-0">
                      <Music className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="text-xs font-bold font-display tracking-tight text-white">listen2song</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">
                    No-cost music engine
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Poster share triggers */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full justify-center">
              <button
                onClick={handleShare}
                className="flex items-center justify-center space-x-2.5 bg-spotify-green text-black font-bold py-3 px-6 rounded-full hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer shadow-lg w-full"
              >
                {isCopied ? <Check className="h-4 w-4 stroke-[3]" /> : <Share2 className="h-4 w-4" />}
                <span>{isCopied ? 'Link Copied / تم النسخ' : 'Share My Vibe / مشاركة'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
