import { Track } from '../types/index';
import { dbGetTracks, dbAddTrack, dbGetTrack, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const YOUTUBE_API_KEY = (import.meta as any).env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

// In-Memory cache fallback in case Firebase is not connected or fails
const localSearchCache: Record<string, Track[]> = {};
const localVideoCache: Record<string, Track> = {};

/**
 * Normalizes ISO 8601 Duration string from YouTube into seconds
 * e.g., "PT3M45S" -> 225
 */
function parseDuration(isoDuration: string): number {
  const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 180; // Fallback to 3 minutes
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Check Cache for search query results locally
 */
async function checkSearchCache(queryStr: string): Promise<Track[] | null> {
  const cacheKey = `search_${queryStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  // 1. Check local memory
  if (localSearchCache[cacheKey]) {
    return localSearchCache[cacheKey];
  }

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem(`yt_search_${cacheKey}`);
    if (raw) {
      return JSON.parse(raw) as Track[];
    }
  } catch {}

  return null;
}

/**
 * Save search results in local caches only
 */
async function saveSearchCache(queryStr: string, tracks: Track[]): Promise<void> {
  const cacheKey = `search_${queryStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  // 1. In-memory
  localSearchCache[cacheKey] = tracks;

  // 2. localStorage
  try {
    localStorage.setItem(`yt_search_${cacheKey}`, JSON.stringify(tracks));
  } catch {}
}

/**
 * Searches YouTube for music videos and translates them to Track interfaces
 * Checks cache first to avoid API quota usage.
 */
export async function searchTracks(queryStr: string): Promise<Track[]> {
  const cleanQuery = queryStr.trim();
  if (!cleanQuery) return [];

  // Check cache first
  const cached = await checkSearchCache(cleanQuery);
  if (cached) {
    return cached;
  }

  // Fallback / Mock tracks when API Key is missing or invalid
  const getMockTracks = (): Track[] => {
    const mockTitles = ['Perfect Mix', 'Midnight Chill', 'Golden Retro Beat', 'Arabian Melodies', 'Sultry Oasis'];
    const mockArtists = ['Samer Halim', 'Acoustic Waves', 'Lina Faris', 'The Red Dunes', 'Nour Al Sham'];
    const mockIds = ['L0MK7Hz1m98', 'WbSgYm9ZitI', '2I6Zk-hP_0g', 'dQw4w9WgXcQ', '9bZkp7q19f0'];
    
    return Array.from({ length: 5 }).map((_, i) => {
      const id = mockIds[i % mockIds.length];
      return {
        id: `yt_${id}_${i}`,
        title: `${cleanQuery} (${mockTitles[i]})`,
        artist: mockArtists[i],
        album: 'YouTube Live Search',
        coverUrl: `https://images.unsplash.com/photo-${1500000000000 + (i * 100000)}?w=400&q=80`,
        duration: 180 + i * 30,
        youtubeId: id,
        genre: 'Search Result',
        tags: ['youtube', 'searched', cleanQuery.toLowerCase()]
      };
    });
  };

  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube Search] API key not found. Returning beautiful mocked search results.');
    const mockTracks = getMockTracks();
    await saveSearchCache(cleanQuery, mockTracks);
    return mockTracks;
  }

  try {
    // 1. Call Search Endpoint to find videos (filtered by music/video category if possible)
    const searchResponse = await fetch(
      `${YOUTUBE_SEARCH_URL}?part=snippet&q=${encodeURIComponent(cleanQuery + " song")}&type=video&videoCategoryId=10&maxResults=8&key=${YOUTUBE_API_KEY}`
    );

    if (!searchResponse.ok) {
      throw new Error(`YouTube Search API returned status: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const items = searchData.items || [];

    if (items.length === 0) {
      return [];
    }

    const videoIds = items.map((item: any) => item.id.videoId).join(',');

    // 2. Retrieve detailed info (durations) for the found video IDs
    const detailsResponse = await fetch(
      `${YOUTUBE_VIDEOS_URL}?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!detailsResponse.ok) {
      throw new Error(`YouTube Videos API returned status: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    const detailItems = detailsData.items || [];

    const tracks: Track[] = detailItems.map((v: any) => {
      const id = v.id;
      const title = v.snippet.title || 'Unknown YouTube Song';
      const channelTitle = v.snippet.channelTitle || 'Unknown Artist';
      const durationStr = v.contentDetails.duration;
      const durationSec = parseDuration(durationStr);
      const thumbnail = v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80';

      // Clean up titles (remove bracketed noise like [Official Video])
      const cleanedTitle = title
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/Official Video/gi, '')
        .replace(/Official Audio/gi, '')
        .replace(/Lyrics/gi, '')
        .trim();

      const track: Track = {
        id,
        title: cleanedTitle,
        artist: channelTitle.replace(/VEVO$/i, '').trim(),
        coverUrl: thumbnail,
        duration: durationSec,
        youtubeId: id,
        genre: 'Streaming',
        tags: ['youtube', 'web-search']
      };

      return track;
    });

    // Save search in cache
    await saveSearchCache(cleanQuery, tracks);
    return tracks;
  } catch (error) {
    console.error('[YouTube Search] Failed fetching from API, falling back to mock details:', error);
    const fallbackTracks = getMockTracks();
    await saveSearchCache(cleanQuery, fallbackTracks);
    return fallbackTracks;
  }
}

/**
 * Fetches explicit details for a single YouTube video ID
 * Utilizes caching to prevent duplicate requests.
 */
export async function getVideoDetails(videoId: string): Promise<Track | null> {
  if (!videoId) return null;

  // 1. Check internal state cache
  if (localVideoCache[videoId]) {
    return localVideoCache[videoId];
  }

  // 2. Check local database/system register
  const localDbTrack = await dbGetTrack(videoId);
  if (localDbTrack) {
    localVideoCache[videoId] = localDbTrack;
    return localDbTrack;
  }

  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube Details] No API Key. Making mock Track.');
    return {
      id: videoId,
      title: 'YouTube Track ' + videoId,
      artist: 'Web Artist',
      coverUrl: 'https://images.unsplash.com/photo-1487180142328-054b783fc471?w=400&q=80',
      duration: 180,
      youtubeId: videoId,
      tags: ['fallback']
    };
  }

  try {
    const detailsResponse = await fetch(
      `${YOUTUBE_VIDEOS_URL}?part=contentDetails,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!detailsResponse.ok) {
      throw new Error(`YouTube API details returned status: ${detailsResponse.status}`);
    }

    const data = await detailsResponse.json();
    const item = data.items?.[0];

    if (!item) return null;

    const title = item.snippet.title;
    const channelTitle = item.snippet.channelTitle;
    const durationSec = parseDuration(item.contentDetails.duration);
    const thumbnail = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url;

    const track: Track = {
      id: videoId,
      title: title.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim(),
      artist: channelTitle.replace(/VEVO$/i, '').trim(),
      coverUrl: thumbnail,
      duration: durationSec,
      youtubeId: videoId,
      genre: 'Streaming',
      tags: ['youtube']
    };

    localVideoCache[videoId] = track;

    return track;
  } catch (error) {
    console.error(`[YouTube Details] Fetch error for video ${videoId}:`, error);
    return null;
  }
}
