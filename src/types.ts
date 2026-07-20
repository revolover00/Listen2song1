/**
 * Types for listen2song application
 */

export interface Track {
  id: string; // YouTube video ID or custom ID
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  youtubeId: string;
  tags: string[];
  genres: string[];
  playCount: number;
  likeCount: number;
  mbid?: string; // MusicBrainz ID
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface ListeningHistory {
  id: string;
  userId: string;
  trackId: string;
  listenedAt: string;
  duration: number; // how many seconds listened
  completionRate: number; // calculated on server: (listened / total) * 100
  skipped: boolean; // if completionRate < 20%
}

export interface Like {
  userId: string;
  trackId: string;
  createdAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description: string;
  coverUrl: string;
  isPublic: boolean;
  createdAt: string;
  trackIds: string[];
}

export interface RecommendationResponse {
  discoverWeekly: Track[];
  contextualMix: Track[];
  recommendedArtists: { name: string; mbid?: string; coverUrl: string; tags: string[] }[];
  reason: string;
}
