import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { Track, ListeningHistoryEntry, Playlist } from '../types/index';

// Load environment variables
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
};

// Check if configuration is present
const hasFirebaseConfig = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain
);

let app;
let auth: any = null;
let firestore: any = null;

if (hasFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
    console.log('[Firebase] Successfully initialized real SDK.');
  } catch (error) {
    console.error('[Firebase] Error initializing real SDK, using fallback:', error);
  }
} else {
  console.warn('[Firebase] Missing config keys in environment. Using robust localStorage fallback.');
}

// --- LOCAL STORAGE FALLBACK ENGINE ---
class LocalStorageFallback {
  private getStorageItem<T>(key: string, defaultVal: T): T {
    try {
      const val = localStorage.getItem(`spotify_clone_${key}`);
      return val ? JSON.parse(val) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStorageItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(`spotify_clone_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('[Fallback Storage] Error setting value:', e);
    }
  }

  public getTracks(): Track[] {
    // Default initial mock tracks so the platform isn't empty on load
    const defaultTracks: Track[] = [
      {
        id: 'L0MK7Hz1m98',
        title: 'Tamally Maak',
        artist: 'Amr Diab',
        album: 'Tamally Maak',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
        duration: 269,
        youtubeId: 'L0MK7Hz1m98',
        genre: 'Arabic Pop',
        tags: ['arabic', 'pop', 'classic', 'romantic']
      },
      {
        id: 'WbSgYm9ZitI',
        title: 'Naseeni El Donya',
        artist: 'Ragheb Alama',
        album: 'Al Hob El Kebeer',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
        duration: 250,
        youtubeId: 'WbSgYm9ZitI',
        genre: 'Arabic Pop',
        tags: ['arabic', 'pop', 'classic', 'energetic']
      },
      {
        id: '2I6Zk-hP_0g',
        title: 'Crystalline Soundwaves',
        artist: 'Ambient Dreams',
        album: 'Cosmic Silence',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
        duration: 185,
        youtubeId: '2I6Zk-hP_0g',
        genre: 'Ambient',
        tags: ['ambient', 'chill', 'focus', 'relax']
      }
    ];
    const tracks = this.getStorageItem<Track[]>('tracks', []);
    if (tracks.length === 0) {
      this.setStorageItem<Track[]>('tracks', defaultTracks);
      return defaultTracks;
    }
    return tracks;
  }

  public saveTrack(track: Track): void {
    const tracks = this.getTracks();
    const idx = tracks.findIndex(t => t.id === track.id);
    if (idx >= 0) {
      tracks[idx] = track;
    } else {
      tracks.push(track);
    }
    this.setStorageItem<Track[]>('tracks', tracks);
  }

  public getLikes(userId: string): string[] {
    const allLikes = this.getStorageItem<Record<string, string[]>>('likes', {});
    return allLikes[userId] || [];
  }

  public toggleLike(userId: string, trackId: string): boolean {
    const allLikes = this.getStorageItem<Record<string, string[]>>('likes', {});
    const userLikes = allLikes[userId] || [];
    const idx = userLikes.indexOf(trackId);
    let liked = false;
    if (idx >= 0) {
      userLikes.splice(idx, 1);
    } else {
      userLikes.push(trackId);
      liked = true;
    }
    allLikes[userId] = userLikes;
    this.setStorageItem<Record<string, string[]>>('likes', allLikes);
    return liked;
  }

  public getHistory(userId: string): ListeningHistoryEntry[] {
    const allHistory = this.getStorageItem<ListeningHistoryEntry[]>('history', []);
    return allHistory.filter(h => h.userId === userId);
  }

  public addHistory(entry: ListeningHistoryEntry): void {
    const allHistory = this.getStorageItem<ListeningHistoryEntry[]>('history', []);
    allHistory.push(entry);
    this.setStorageItem<ListeningHistoryEntry[]>('history', allHistory);
  }

  public getPlaylists(userId: string): Playlist[] {
    const defaultPlaylists: Playlist[] = [
      {
        id: 'favorites_id',
        name: 'My Favorites / المفضلة',
        description: 'Your loved tracks collection',
        userId: userId,
        coverUrl: 'https://images.unsplash.com/photo-1513829096900-ee83fbe011fa?w=400&q=80',
        trackIds: [],
        isPublic: false,
        createdAt: new Date().toISOString()
      }
    ];
    const playlists = this.getStorageItem<Playlist[]>('playlists', []);
    const userPlaylists = playlists.filter(p => p.userId === userId);
    if (userPlaylists.length === 0) {
      const initialized = defaultPlaylists.map(p => ({ ...p, userId }));
      this.setStorageItem<Playlist[]>('playlists', [...playlists, ...initialized]);
      return initialized;
    }
    return userPlaylists;
  }

  public savePlaylist(playlist: Playlist): void {
    const playlists = this.getStorageItem<Playlist[]>('playlists', []);
    const idx = playlists.findIndex(p => p.id === playlist.id);
    if (idx >= 0) {
      playlists[idx] = playlist;
    } else {
      playlists.push(playlist);
    }
    this.setStorageItem<Playlist[]>('playlists', playlists);
  }
}

const fallback = new LocalStorageFallback();

// --- EXPORTED SERVICE INTERFACE ---

/**
 * Saves a track metadata record (caching/registration)
 */
export async function dbAddTrack(track: Track): Promise<void> {
  try {
    if (firestore) {
      await setDoc(doc(firestore, 'tracks', track.id), track);
    } else {
      fallback.saveTrack(track);
    }
  } catch (error) {
    console.error('[dbAddTrack] Error writing track to DB:', error);
    fallback.saveTrack(track);
  }
}

/**
 * Retrieves a single track by ID
 */
export async function dbGetTrack(id: string): Promise<Track | null> {
  try {
    if (firestore) {
      const docRef = doc(firestore, 'tracks', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Track;
      }
    }
    const local = fallback.getTracks().find(t => t.id === id);
    return local || null;
  } catch (error) {
    console.error('[dbGetTrack] Error reading track:', error);
    const local = fallback.getTracks().find(t => t.id === id);
    return local || null;
  }
}

/**
 * Retrieves all registered tracks in system
 */
export async function dbGetTracks(): Promise<Track[]> {
  try {
    if (firestore) {
      const colRef = collection(firestore, 'tracks');
      const querySnap = await getDocs(colRef);
      const tracks: Track[] = [];
      querySnap.forEach(docSnap => {
        tracks.push(docSnap.data() as Track);
      });
      if (tracks.length > 0) return tracks;
    }
    return fallback.getTracks();
  } catch (error) {
    console.error('[dbGetTracks] Error getting tracks:', error);
    return fallback.getTracks();
  }
}

/**
 * Toggles a track favorite/like status for a user
 * Returns true if liked, false if unliked
 */
export async function dbToggleLike(userId: string, track: Track): Promise<boolean> {
  try {
    if (firestore) {
      const likeRef = doc(firestore, 'likes', `${userId}_${track.id}`);
      const snap = await getDoc(likeRef);
      if (snap.exists()) {
        await deleteDoc(likeRef);
        return false;
      } else {
        await setDoc(likeRef, {
          userId,
          trackId: track.id,
          track,
          likedAt: new Date().toISOString()
        });
        return true;
      }
    }
    const liked = fallback.toggleLike(userId, track.id);
    if (liked) {
      fallback.saveTrack(track);
    }
    return liked;
  } catch (error) {
    console.error('[dbToggleLike] Error toggling like:', error);
    const liked = fallback.toggleLike(userId, track.id);
    if (liked) {
      fallback.saveTrack(track);
    }
    return liked;
  }
}

/**
 * Retrieves full Track objects liked by a user
 */
export async function dbGetLikedTracks(userId: string): Promise<Track[]> {
  try {
    if (firestore) {
      const q = query(collection(firestore, 'likes'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const tracks: Track[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.track) {
          tracks.push(data.track as Track);
        }
      });
      return tracks;
    }
    const likedIds = fallback.getLikes(userId);
    return fallback.getTracks().filter(t => likedIds.includes(t.id));
  } catch (error) {
    console.error('[dbGetLikedTracks] Error loading liked tracks:', error);
    const likedIds = fallback.getLikes(userId);
    return fallback.getTracks().filter(t => likedIds.includes(t.id));
  }
}

/**
 * Retrieves array of track IDs liked by a user
 */
export async function dbGetLikedTrackIds(userId: string): Promise<string[]> {
  try {
    if (firestore) {
      const q = query(collection(firestore, 'likes'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const trackIds: string[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.trackId) trackIds.push(data.trackId);
      });
      return trackIds;
    }
    return fallback.getLikes(userId);
  } catch (error) {
    console.error('[dbGetLikedTrackIds] Error loading likes:', error);
    return fallback.getLikes(userId);
  }
}

/**
 * Saves a listening history entry
 */
export async function dbAddHistoryEntry(
  entry: Omit<ListeningHistoryEntry, 'id'>
): Promise<ListeningHistoryEntry> {
  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const finalEntry: ListeningHistoryEntry = { ...entry, id };

  try {
    if (firestore) {
      await setDoc(doc(firestore, 'history', id), finalEntry);
    } else {
      fallback.addHistory(finalEntry);
    }
  } catch (error) {
    console.error('[dbAddHistoryEntry] Error inserting listening log:', error);
    fallback.addHistory(finalEntry);
  }
  return finalEntry;
}

/**
 * Fetches play history for a user
 */
export async function dbGetHistory(userId: string): Promise<ListeningHistoryEntry[]> {
  try {
    if (firestore) {
      const q = query(
        collection(firestore, 'history'), 
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      const list: ListeningHistoryEntry[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as ListeningHistoryEntry);
      });
      // Sort descending by timestamp
      return list.sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());
    }
    return fallback.getHistory(userId).sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());
  } catch (error) {
    console.error('[dbGetHistory] Error loading history:', error);
    return fallback.getHistory(userId).sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());
  }
}

/**
 * Creates a brand new Playlist
 */
export async function dbCreatePlaylist(
  playlist: Omit<Playlist, 'id' | 'createdAt'>
): Promise<Playlist> {
  const id = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const finalPlaylist: Playlist = {
    ...playlist,
    id,
    createdAt: new Date().toISOString()
  };

  try {
    if (firestore) {
      await setDoc(doc(firestore, 'playlists', id), finalPlaylist);
    } else {
      fallback.savePlaylist(finalPlaylist);
    }
  } catch (error) {
    console.error('[dbCreatePlaylist] Error adding playlist:', error);
    fallback.savePlaylist(finalPlaylist);
  }
  return finalPlaylist;
}

/**
 * Retrieves all user's playlists
 */
export async function dbGetPlaylists(userId: string): Promise<Playlist[]> {
  try {
    if (firestore) {
      const q = query(collection(firestore, 'playlists'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: Playlist[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as Playlist);
      });
      if (list.length > 0) return list;
    }
    return fallback.getPlaylists(userId);
  } catch (error) {
    console.error('[dbGetPlaylists] Error fetching playlists:', error);
    return fallback.getPlaylists(userId);
  }
}

/**
 * Add a track to playlist
 */
export async function dbAddTrackToPlaylist(playlistId: string, track: Track): Promise<void> {
  try {
    if (firestore) {
      const ref = doc(firestore, 'playlists', playlistId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as Playlist;
        const trackIds = data.trackIds || [];
        const tracks = data.tracks || [];
        
        if (!trackIds.includes(track.id)) {
          trackIds.push(track.id);
        }
        if (!tracks.some(t => t.id === track.id)) {
          tracks.push(track);
        }
        
        await updateDoc(ref, { trackIds, tracks });
      }
    } else {
      // Also register track in fallback's tracks so we can resolve details
      fallback.saveTrack(track);
      
      const playlists = fallback.getPlaylists('any');
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist) {
        if (!playlist.trackIds.includes(track.id)) {
          playlist.trackIds.push(track.id);
        }
        if (!playlist.tracks) {
          playlist.tracks = [];
        }
        if (!playlist.tracks.some(t => t.id === track.id)) {
          playlist.tracks.push(track);
        }
        fallback.savePlaylist(playlist);
      }
    }
  } catch (error) {
    console.error('[dbAddTrackToPlaylist] Error adding track:', error);
  }
}

/**
 * Remove a track from playlist
 */
export async function dbRemoveTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  try {
    if (firestore) {
      const ref = doc(firestore, 'playlists', playlistId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as Playlist;
        const trackIds = (data.trackIds || []).filter(id => id !== trackId);
        const tracks = (data.tracks || []).filter(t => t.id !== trackId);
        await updateDoc(ref, { trackIds, tracks });
      }
    } else {
      const playlists = fallback.getPlaylists('any');
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist) {
        playlist.trackIds = playlist.trackIds.filter(id => id !== trackId);
        if (playlist.tracks) {
          playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
        }
        fallback.savePlaylist(playlist);
      }
    }
  } catch (error) {
    console.error('[dbRemoveTrackFromPlaylist] Error removing track:', error);
  }
}

export { auth, firestore as db };
