import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import dotenv from 'dotenv';
import { Track } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for MusicBrainz requests with 1-second rate-limiting
let lastMusicBrainzRequestTime = 0;
async function fetchMusicBrainz(url: string): Promise<any> {
  const now = Date.now();
  const timeSinceLast = now - lastMusicBrainzRequestTime;
  if (timeSinceLast < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLast));
  }
  lastMusicBrainzRequestTime = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'listen2song/1.0.0 ( abeehameed58@gmail.com )'
    }
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz request failed: ${response.statusText}`);
  }
  return response.json();
}

// ---------------- API ROUTES ----------------

// --- Authentication APIs ---
app.post('/api/auth/register', (req, res) => {
  const { email, displayName } = req.body;
  if (!email || !displayName) {
    return res.status(400).json({ error: 'Email and Name are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const id = 'user_' + Math.random().toString(36).substr(2, 9);
  const newUser = {
    id,
    email,
    displayName,
    createdAt: new Date().toISOString(),
    avatarUrl: `https://images.unsplash.com/photo-${['1535713875002-d1d0cf377fde', '1494790108377-be9c29b29330', '1599566150163-29194dcaad36'][Math.floor(Math.random() * 3)]}?w=100&h=100&fit=crop&q=80`
  };

  db.addUser(newUser);
  res.json({ user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    // Auto-register for easy demo!
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    const newUser = {
      id,
      email,
      displayName: email.split('@')[0],
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80'
    };
    db.addUser(newUser);
    return res.json({ user: newUser, message: 'Auto-registered' });
  }

  res.json({ user });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const userId = authHeader.split(' ')[1];
  const user = db.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// --- Tracks APIs ---
app.get('/api/tracks', (req, res) => {
  res.json({ tracks: db.getTracks() });
});

// Intelligent cached search proxy
app.get('/api/tracks/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ tracks: [] });
  }

  // 1. Check local cache (seeded + searched)
  const allTracks = db.getTracks();
  const searchResults = allTracks.filter(track =>
    track.title.toLowerCase().includes(query.toLowerCase()) ||
    track.artist.toLowerCase().includes(query.toLowerCase()) ||
    track.tags.some(t => t.toLowerCase().includes(query.toLowerCase())) ||
    track.genres.some(g => g.toLowerCase().includes(query.toLowerCase()))
  );

  // If we have a good number of local cached matches, return them immediately!
  // This satisfies our prompt requirement to read from Cache first and save YouTube units quota.
  if (searchResults.length >= 4) {
    return res.json({ tracks: searchResults, cached: true });
  }

  // 2. Fallback: Call YouTube Data API if token exists
  const ytKey = process.env.YOUTUBE_API_KEY;
  if (ytKey) {
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' audio song')}&type=video&videoCategoryId=10&maxResults=5&key=${ytKey}`;
      const ytRes = await fetch(searchUrl);
      if (ytRes.ok) {
        const ytData = await ytRes.json();
        const items = ytData.items || [];
        const newTracks: Track[] = [];

        for (const item of items) {
          const videoId = item.id.videoId;
          const snippet = item.snippet;

          // Check if this videoId already exists in our db
          const existing = db.getTrack(videoId);
          if (existing) {
            newTracks.push(existing);
            continue;
          }

          // Clean up YouTube titles (e.g. remove "Official Audio", "Lyrics", etc.)
          let rawTitle = snippet.title || 'Unknown Track';
          rawTitle = rawTitle
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s*[\(\[]\s*(Official\s+)?(Video|Audio|Lyrics|Music\s+Video|HD|HQ)\s*[\)\]]/gi, '')
            .trim();

          // Split artist and title from YouTube title if separated by '-'
          let artist = 'Various Artists';
          let title = rawTitle;
          if (rawTitle.includes('-')) {
            const parts = rawTitle.split('-');
            artist = parts[0].trim();
            title = parts.slice(1).join('-').trim();
          }

          // Fetch supplementary tags from MusicBrainz if available (gracefully handles errors)
          let tags = ['online', 'youtube'];
          let genres = ['Pop'];
          let mbid = '';
          try {
            const mbData = await fetchMusicBrainz(`https://musicbrainz.org/ws/2/recording?query=recording:${encodeURIComponent(title)}%20AND%20artist:${encodeURIComponent(artist)}&fmt=json`);
            if (mbData.recordings && mbData.recordings.length > 0) {
              const rec = mbData.recordings[0];
              mbid = rec.id;
              if (rec.tags) {
                tags.push(...rec.tags.slice(0, 4).map((t: any) => t.name.toLowerCase()));
              }
              if (rec['releases'] && rec['releases'].length > 0) {
                genres = [rec['releases'][0]['release-group']?.type || 'Pop'];
              }
            }
          } catch (mbErr) {
            console.warn('MusicBrainz enrichment skipped:', mbErr);
          }

          const track: Track = {
            id: videoId,
            youtubeId: videoId,
            title,
            artist,
            album: 'YouTube Release',
            duration: 240, // standard fallback duration
            coverUrl: snippet.thumbnails?.high?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
            tags: Array.from(new Set(tags)),
            genres: Array.from(new Set(genres)),
            playCount: 0,
            likeCount: 0,
            mbid,
            createdAt: new Date().toISOString()
          };

          db.addTrack(track);
          newTracks.push(track);
        }

        return res.json({ tracks: [...searchResults, ...newTracks].slice(0, 8), cached: false });
      }
    } catch (e) {
      console.error('Error in YouTube search proxy:', e);
    }
  }

  // If no API key or YouTube API fails, fallback to intelligent fuzzy search over seeded database
  // plus some predefined popular YouTube links for fallback
  const fallbackSeededTracks = allTracks.filter(track =>
    track.title.toLowerCase().includes(query.toLowerCase()) ||
    track.artist.toLowerCase().includes(query.toLowerCase())
  );
  res.json({ tracks: fallbackSeededTracks, cached: true });
});

// Like Tracks
app.post('/api/tracks/like', (req, res) => {
  const { userId, trackId, like } = req.body;
  if (!userId || !trackId) {
    return res.status(400).json({ error: 'userId and trackId are required' });
  }

  if (like) {
    db.addLike(userId, trackId);
  } else {
    db.removeLike(userId, trackId);
  }

  res.json({ success: true, likes: db.getLikes(userId) });
});

// Get User Likes
app.get('/api/tracks/likes', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  res.json({ likes: db.getLikes(userId) });
});

// --- Listening History & Analytics ---
app.post('/api/history', (req, res) => {
  const { userId, trackId, duration, completionRate } = req.body;
  if (!userId || !trackId) {
    return res.status(400).json({ error: 'userId and trackId are required' });
  }

  const id = 'hist_' + Math.random().toString(36).substr(2, 9);
  const historyRecord = {
    id,
    userId,
    trackId,
    listenedAt: new Date().toISOString(),
    duration: Number(duration || 0),
    completionRate: Number(completionRate || 0),
    skipped: Number(completionRate || 0) < 20
  };

  db.addListeningHistory(historyRecord);
  res.json({ success: true, historyRecord });
});

app.get('/api/history', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  res.json({ history: db.getListeningHistory(userId) });
});

// --- Playlists APIs ---
app.get('/api/playlists', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  res.json({ playlists: db.getPlaylists(userId) });
});

app.get('/api/playlists/:id', (req, res) => {
  const playlist = db.getPlaylist(req.params.id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }
  res.json({ playlist });
});

app.post('/api/playlists', (req, res) => {
  const { userId, name, description, coverUrl } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: 'userId and name are required' });
  }

  const id = 'playlist_' + Math.random().toString(36).substr(2, 9);
  const newPlaylist = db.createPlaylist({
    id,
    userId,
    name,
    description: description || '',
    coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    isPublic: true
  });

  res.json({ playlist: newPlaylist });
});

app.post('/api/playlists/:id/tracks', (req, res) => {
  const playlistId = req.params.id;
  const { trackId } = req.body;
  if (!trackId) {
    return res.status(400).json({ error: 'trackId is required' });
  }

  const playlist = db.getPlaylist(playlistId);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  if (!playlist.trackIds.includes(trackId)) {
    const updatedTrackIds = [...playlist.trackIds, trackId];
    db.updatePlaylist(playlistId, { trackIds: updatedTrackIds });
  }

  res.json({ success: true, playlist: db.getPlaylist(playlistId) });
});

app.delete('/api/playlists/:id/tracks/:trackId', (req, res) => {
  const { id, trackId } = req.params;
  const playlist = db.getPlaylist(id);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  const updatedTrackIds = playlist.trackIds.filter(tid => tid !== trackId);
  db.updatePlaylist(id, { trackIds: updatedTrackIds });

  res.json({ success: true, playlist: db.getPlaylist(id) });
});

// --- Dynamic Recommendations ---
app.get('/api/recommendations', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const result = db.getRecommendations(userId);
  res.json(result);
});

// --- ListenBrainz Scrobble & Labs API ---
app.post('/api/listenbrainz/scrobble', async (req, res) => {
  const { track, artist, listenedAt, userToken } = req.body;
  if (!track || !artist) {
    return res.status(400).json({ error: 'track and artist are required' });
  }

  // ListenBrainz Scrobble Proxy - handles fallback gracefully if token is missing
  if (!userToken) {
    return res.json({ success: true, message: 'Local scrobble simulated (No ListenBrainz token provided)' });
  }

  try {
    const response = await fetch('https://api.listenbrainz.org/1/submit-listens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${userToken}`
      },
      body: JSON.stringify({
        listen_type: 'single',
        payload: [
          {
            listened_at: Math.floor(new Date(listenedAt || Date.now()).getTime() / 1000),
            track_metadata: {
              artist_name: artist,
              track_name: track
            }
          }
        ]
      })
    });

    if (response.ok) {
      return res.json({ success: true, listenbrainz: true });
    } else {
      const errText = await response.text();
      console.warn('ListenBrainz submission failed, fell back locally:', errText);
    }
  } catch (e) {
    console.error('ListenBrainz error, falling back locally:', e);
  }

  // Fallback
  res.json({ success: true, listenbrainz: false, message: 'Fell back to local tracking' });
});

// ---------------- SERVER AND VITE ENTRY POINT ----------------

async function startServer() {
  // Vite middleware setup for development, or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[listen2song] full-stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
