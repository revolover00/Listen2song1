/**
 * Core TypeScript Interfaces for the Spotify-like Music Streaming Platform
 * represents the core domain models used across the application.
 */

export interface Track {
  id: string;             // Unique identifier for the track (can be the YouTube Video ID or custom UUID)
  title: string;          // Name of the track
  artist: string;         // Name of the artist
  album?: string;         // Optional album name
  coverUrl: string;       // URL for the track/album cover image
  duration: number;       // Duration of the track in seconds
  youtubeId: string;      // The YouTube video ID used for background audio playback
  genre?: string;         // Optional genre classification
  tags?: string[];        // Optional tags for search and categorization
  createdAt?: string;     // Timestamp when added to the system
}

export interface User {
  id: string;             // Firebase Authentication UID
  email: string;          // User email address
  displayName?: string;   // User's profile display name
  photoURL?: string;      // Optional user profile photo URL
  createdAt: string;      // ISO 8601 string representing when the user registered
}

export interface ListeningHistoryEntry {
  id: string;             // Unique identifier for the history entry
  userId: string;         // UID of the user who listened
  trackId: string;        // ID of the listened track
  track?: Track;          // Optional full track metadata
  listenedAt: string;     // ISO 8601 string of when the track was played
  durationPlayed: number; // Time played in seconds
  completed: boolean;     // True if the user listened to most of the track (e.g., > 85%)
}

export interface Playlist {
  id: string;             // Unique identifier for the playlist
  name: string;           // Name of the playlist
  description?: string;   // Optional description
  userId: string;         // UID of the playlist creator/owner
  coverUrl?: string;      // Optional custom playlist cover image URL
  trackIds: string[];     // Ordered array of track IDs belonging to the playlist
  tracks?: Track[];       // Optional full track objects inside the playlist
  isPublic: boolean;      // True if the playlist is visible to other users
  createdAt: string;      // ISO 8601 string of playlist creation date
}

export interface PlaylistTrack {
  playlistId: string;     // Associated playlist ID
  trackId: string;        // Associated track ID
  addedAt: string;        // ISO 8601 string of when the track was added to the playlist
  addedBy: string;        // UID of the user who added this track
}
