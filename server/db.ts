import fs from 'fs';
import path from 'path';
import { Track, User, ListeningHistory, Like, Playlist } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Pre-seeded high quality tracks (working YouTube links + artwork)
const SEED_TRACKS: Track[] = [
  {
    id: 'bI8P68SSh3s',
    youtubeId: 'bI8P68SSh3s',
    title: 'Tamally Maak (تمت معاك)',
    artist: 'Amr Diab',
    album: 'Tamally Maak',
    duration: 269,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    tags: ['classic', 'romantic', 'pop', 'arabic', '90s'],
    genres: ['Arabic Pop', 'Romantic'],
    playCount: 1540,
    likeCount: 320,
    mbid: '7b7da617-64df-4161-a1bf-1049c6934c2b',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ol7_m2bH400',
    youtubeId: 'ol7_m2bH400',
    title: 'Kifak Inta (كيفك انت)',
    artist: 'Fairouz',
    album: 'Kifak Inta',
    duration: 212,
    coverUrl: 'https://images.unsplash.com/photo-1487180142328-054b783fc471?w=400&q=80',
    tags: ['legendary', 'classic', 'morning', 'jazz', 'arabic'],
    genres: ['Arabic Classical', 'Tarab'],
    playCount: 2450,
    likeCount: 512,
    mbid: '50e18987-bf64-4bf8-b9a3-df5e67272895',
    createdAt: new Date().toISOString()
  },
  {
    id: 'fJm4xLpUj0c',
    youtubeId: 'fJm4xLpUj0c',
    title: 'Ahwak (أهواك)',
    artist: 'Abdel Halim Hafez',
    album: 'Golden Hits',
    duration: 250,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    tags: ['classic', 'tarab', 'golden age', 'arabic', 'orchestral'],
    genres: ['Tarab', 'Classical'],
    playCount: 1820,
    likeCount: 401,
    createdAt: new Date().toISOString()
  },
  {
    id: 'jfKfPfyJRdk',
    youtubeId: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio - Chill Beats',
    artist: 'ChilledCow',
    album: 'Lofi Study Beats',
    duration: 3600,
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80',
    tags: ['lofi', 'chill', 'study', 'focus', 'relax', 'instrumental'],
    genres: ['Lofi Hip Hop', 'Ambient'],
    playCount: 4900,
    likeCount: 932,
    createdAt: new Date().toISOString()
  },
  {
    id: '4xDzrJKXOOY',
    youtubeId: '4xDzrJKXOOY',
    title: 'Synthwave Retro Sunset',
    artist: 'Neon Drive',
    album: 'Outrun Chronicles',
    duration: 304,
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
    tags: ['synthwave', '80s', 'retro', 'electronic', 'instrumental'],
    genres: ['Synthwave', 'Electronic'],
    playCount: 920,
    likeCount: 185,
    createdAt: new Date().toISOString()
  },
  {
    id: 'k9X1u3W6nGo',
    youtubeId: 'k9X1u3W6nGo',
    title: 'Yellow (Lofi Ambient Cover)',
    artist: 'Acoustic Dreams',
    album: 'Chill Indie Pop',
    duration: 202,
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80',
    tags: ['indie', 'lofi', 'cover', 'relax', 'ambient'],
    genres: ['Indie Lofi', 'Dream Pop'],
    playCount: 1200,
    likeCount: 290,
    createdAt: new Date().toISOString()
  },
  {
    id: 'V1Pl8Cz0u8A',
    youtubeId: 'V1Pl8Cz0u8A',
    title: 'Ocean Eyes (Lofi Beats)',
    artist: 'Ethereal Waves',
    album: 'Bedroom Pop Lofi',
    duration: 184,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    tags: ['ambient', 'relax', 'lofi', 'chill', 'bedroom pop'],
    genres: ['Ambient Pop', 'Lofi'],
    playCount: 840,
    likeCount: 172,
    createdAt: new Date().toISOString()
  },
  {
    id: 'S8mN0S0h0Q4',
    youtubeId: 'S8mN0S0h0Q4',
    title: 'El Bint El Gawaye (البنت القوية)',
    artist: 'Wael Kfoury',
    album: 'El Bint El Gawaye',
    duration: 224,
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
    tags: ['pop', 'arabic', 'summer', 'dance', 'lebanon'],
    genres: ['Levantine Pop', 'Arabic Pop'],
    playCount: 2100,
    likeCount: 450,
    createdAt: new Date().toISOString()
  }
];

interface DatabaseSchema {
  tracks: Track[];
  users: User[];
  listeningHistory: ListeningHistory[];
  likes: Like[];
  playlists: Playlist[];
}

class LocalDB {
  private data: DatabaseSchema = {
    tracks: [],
    users: [],
    listeningHistory: [],
    likes: [],
    playlists: []
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        // Ensure standard tracks always exist
        SEED_TRACKS.forEach(seedTrack => {
          if (!this.data.tracks.some(t => t.id === seedTrack.id)) {
            this.data.tracks.push(seedTrack);
          }
        });
      } else {
        this.data = {
          tracks: [...SEED_TRACKS],
          users: [
            { id: 'user_demo', email: 'demo@listen2song.com', displayName: 'Demo Listener', createdAt: new Date().toISOString(), avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80' }
          ],
          listeningHistory: [
            // Feed history to help recommendation engine
            { id: 'hist_1', userId: 'user_demo', trackId: 'bI8P68SSh3s', listenedAt: new Date(Date.now() - 86400000).toISOString(), duration: 250, completionRate: 92.9, skipped: false },
            { id: 'hist_2', userId: 'user_demo', trackId: 'ol7_m2bH400', listenedAt: new Date(Date.now() - 172800000).toISOString(), duration: 200, completionRate: 94.3, skipped: false },
            { id: 'hist_3', userId: 'user_demo', trackId: '4xDzrJKXOOY', listenedAt: new Date(Date.now() - 43200000).toISOString(), duration: 15, completionRate: 4.9, skipped: true }
          ],
          likes: [
            { userId: 'user_demo', trackId: 'bI8P68SSh3s', createdAt: new Date().toISOString() },
            { userId: 'user_demo', trackId: 'ol7_m2bH400', createdAt: new Date().toISOString() }
          ],
          playlists: [
            {
              id: 'playlist_all_time',
              userId: 'user_demo',
              name: 'My Masterpieces',
              description: 'A curated selection of Arabic legends and smooth electronic waves.',
              coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
              isPublic: true,
              createdAt: new Date().toISOString(),
              trackIds: ['bI8P68SSh3s', 'ol7_m2bH400', 'fJm4xLpUj0c']
            }
          ]
        };
        this.save();
      }
    } catch (e) {
      console.error('Error loading db.json:', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving db.json:', e);
    }
  }

  public getTracks(): Track[] {
    return this.data.tracks;
  }

  public getTrack(id: string): Track | undefined {
    return this.data.tracks.find(t => t.id === id);
  }

  public addTrack(track: Track) {
    if (!this.data.tracks.some(t => t.id === track.id)) {
      this.data.tracks.push(track);
      this.save();
    }
  }

  public updateTrackStats(id: string, played: boolean, liked?: boolean) {
    const track = this.getTrack(id);
    if (track) {
      if (played) track.playCount = (track.playCount || 0) + 1;
      if (liked !== undefined) {
        track.likeCount = Math.max(0, (track.likeCount || 0) + (liked ? 1 : -1));
      }
      this.save();
    }
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUser(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }

  public getLikes(userId: string): Like[] {
    return this.data.likes.filter(l => l.userId === userId);
  }

  public addLike(userId: string, trackId: string) {
    if (!this.data.likes.some(l => l.userId === userId && l.trackId === trackId)) {
      this.data.likes.push({ userId, trackId, createdAt: new Date().toISOString() });
      this.updateTrackStats(trackId, false, true);
      this.save();
    }
  }

  public removeLike(userId: string, trackId: string) {
    const initialLen = this.data.likes.length;
    this.data.likes = this.data.likes.filter(l => !(l.userId === userId && l.trackId === trackId));
    if (this.data.likes.length < initialLen) {
      this.updateTrackStats(trackId, false, false);
      this.save();
    }
  }

  public getListeningHistory(userId: string): ListeningHistory[] {
    return this.data.listeningHistory.filter(h => h.userId === userId);
  }

  public addListeningHistory(history: ListeningHistory) {
    this.data.listeningHistory.push(history);
    this.updateTrackStats(history.trackId, true);
    this.save();
  }

  public getPlaylists(userId: string): Playlist[] {
    return this.data.playlists.filter(p => p.userId === userId || p.isPublic);
  }

  public getPlaylist(id: string): Playlist | undefined {
    return this.data.playlists.find(p => p.id === id);
  }

  public createPlaylist(playlist: Omit<Playlist, 'trackIds' | 'createdAt'>): Playlist {
    const newPlaylist: Playlist = {
      ...playlist,
      trackIds: [],
      createdAt: new Date().toISOString()
    };
    this.data.playlists.push(newPlaylist);
    this.save();
    return newPlaylist;
  }

  public updatePlaylist(id: string, updates: Partial<Playlist>) {
    const playlist = this.data.playlists.find(p => p.id === id);
    if (playlist) {
      Object.assign(playlist, updates);
      this.save();
    }
  }

  public deletePlaylist(id: string) {
    this.data.playlists = this.data.playlists.filter(p => p.id !== id);
    this.save();
  }

  // Pure Recommendation Algorithm
  public getRecommendations(userId: string): { discoverWeekly: Track[]; contextualMix: Track[]; reason: string } {
    const userLikes = this.getLikes(userId);
    const userHistory = this.getListeningHistory(userId);
    const allTracks = this.getTracks();

    const likedTrackIds = new Set(userLikes.map(l => l.trackId));
    const finishedTrackIds = new Set(
      userHistory.filter(h => h.completionRate >= 60).map(h => h.trackId)
    );
    const skippedTrackIds = new Set(
      userHistory.filter(h => h.skipped).map(h => h.trackId)
    );

    // 1. Content-based: Identify favorite tags and genres
    const tagScores: Record<string, number> = {};
    const genreScores: Record<string, number> = {};

    userLikes.forEach(like => {
      const track = this.getTrack(like.trackId);
      if (track) {
        track.tags.forEach(tag => {
          tagScores[tag] = (tagScores[tag] || 0) + 3; // Liking is highly indicative
        });
        track.genres.forEach(genre => {
          genreScores[genre] = (genreScores[genre] || 0) + 3;
        });
      }
    });

    userHistory.forEach(hist => {
      const track = this.getTrack(hist.trackId);
      if (track) {
        const multiplier = hist.skipped ? -2 : (hist.completionRate / 100);
        track.tags.forEach(tag => {
          tagScores[tag] = (tagScores[tag] || 0) + multiplier;
        });
        track.genres.forEach(genre => {
          genreScores[genre] = (genreScores[genre] || 0) + multiplier;
        });
      }
    });

    // Score all available tracks based on matching tags and genres
    const scoredTracks = allTracks.map(track => {
      let score = 0;
      track.tags.forEach(tag => {
        score += tagScores[tag] || 0;
      });
      track.genres.forEach(genre => {
        score += genreScores[genre] || 0;
      });

      // Boost popular tracks slightly
      score += (track.playCount || 0) * 0.01;

      // Penalty for heavy repetition or skips
      if (skippedTrackIds.has(track.id)) score -= 15;
      if (likedTrackIds.has(track.id)) score += 5; // Support hearing liked songs, but encourage new ones

      return { track, score };
    });

    // Sort scored tracks descending
    scoredTracks.sort((a, b) => b.score - a.score);

    // Extract recommendations
    // "Discover Weekly" - focus on high scores that the user HAS NOT listened to yet (or likes)
    const discoverWeekly = scoredTracks
      .filter(item => !likedTrackIds.has(item.track.id) && !finishedTrackIds.has(item.track.id))
      .slice(0, 6)
      .map(item => item.track);

    // "Contextual Session Mix" - focus on tracks similar to the LAST listened track in userHistory
    let contextualMix: Track[] = [];
    if (userHistory.length > 0) {
      const lastTrackId = userHistory[userHistory.length - 1].trackId;
      const lastTrack = this.getTrack(lastTrackId);
      if (lastTrack) {
        const lastTrackTags = new Set(lastTrack.tags);
        const similarTracksScored = allTracks
          .filter(t => t.id !== lastTrackId)
          .map(t => {
            let matches = 0;
            t.tags.forEach(tag => {
              if (lastTrackTags.has(tag)) matches++;
            });
            return { track: t, matches };
          });

        similarTracksScored.sort((a, b) => b.matches - a.matches);
        contextualMix = similarTracksScored.slice(0, 6).map(item => item.track);
      }
    }

    // Fallbacks if lists are too short
    if (discoverWeekly.length < 3) {
      // populate with trending
      const trending = [...allTracks]
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .filter(t => !discoverWeekly.some(dw => dw.id === t.id))
        .slice(0, 4);
      discoverWeekly.push(...trending);
    }

    if (contextualMix.length < 3) {
      // populate with random high rated
      const randomTracks = [...allTracks]
        .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
        .filter(t => !contextualMix.some(cm => cm.id === t.id))
        .slice(0, 4);
      contextualMix.push(...randomTracks);
    }

    // Generate descriptive reason based on top tags
    const topTags = Object.entries(tagScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(e => e[0]);

    const reason = topTags.length > 0
      ? `Because you enjoy ${topTags.join(' and ')} vibes.`
      : "Personalized mixes based on listening activity.";

    return {
      discoverWeekly: discoverWeekly.slice(0, 6),
      contextualMix: contextualMix.slice(0, 6),
      reason
    };
  }
}

export const db = new LocalDB();
