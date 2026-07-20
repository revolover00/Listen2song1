import { Track, ListeningHistory, Like } from '../src/types';

export interface RecommendationWeights {
  content: number;
  collaborative: number;
  session: number;
}

export class RecommenderEngine {
  /**
   * Helper to compute L2 norm of a vector
   */
  private static norm(vec: number[]): number {
    const sum = vec.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum);
  }

  /**
   * Helper to compute dot product of two vectors
   */
  private static dotProduct(vecA: number[], vecB: number[]): number {
    return vecA.reduce((acc, val, idx) => acc + val * (vecB[idx] || 0), 0);
  }

  /**
   * Helper to compute cosine similarity
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    const normA = this.norm(vecA);
    const normB = this.norm(vecB);
    if (normA === 0 || normB === 0) return 0;
    return this.dotProduct(vecA, vecB) / (normA * normB);
  }

  /**
   * 1. Content-based: Construct tag-based vector space model for all tracks
   */
  public static computeContentScores(
    userId: string,
    allTracks: Track[],
    likes: Like[],
    history: ListeningHistory[]
  ): Record<string, number> {
    // Collect all unique tags across all tracks
    const allTagsSet = new Set<string>();
    allTracks.forEach(t => t.tags.forEach(tag => allTagsSet.add(tag.toLowerCase())));
    const allTags = Array.from(allTagsSet);

    // Track ID -> Vector mapping (normalized)
    const trackVectors: Record<string, number[]> = {};
    allTracks.forEach(track => {
      const vec = allTags.map(tag => (track.tags.map(t => t.toLowerCase()).includes(tag) ? 1.0 : 0.0));
      trackVectors[track.id] = vec;
    });

    // Build User Profile Vector
    const userProfileVec = new Array(allTags.length).fill(0);
    const userLikes = likes.filter(l => l.userId === userId);
    const userHistory = history.filter(h => h.userId === userId);

    // Positive weight for Likes
    userLikes.forEach(like => {
      const vec = trackVectors[like.trackId];
      if (vec) {
        for (let i = 0; i < vec.length; i++) {
          userProfileVec[i] += vec[i] * 3.0; // Liked songs weighted heavily
        }
      }
    });

    // Weighted addition based on completion rate
    userHistory.forEach(hist => {
      const vec = trackVectors[hist.trackId];
      if (vec) {
        // High completion is positive; skip is negative
        const weight = hist.skipped ? -2.0 : (hist.completionRate / 100);
        for (let i = 0; i < vec.length; i++) {
          userProfileVec[i] += vec[i] * weight;
        }
      }
    });

    // Calculate cosine similarity for all tracks
    const scores: Record<string, number> = {};
    allTracks.forEach(track => {
      const trackVec = trackVectors[track.id];
      if (trackVec) {
        // Cosine similarity mapped to [0, 1] range
        const sim = this.cosineSimilarity(userProfileVec, trackVec);
        scores[track.id] = Math.max(0, sim);
      } else {
        scores[track.id] = 0;
      }
    });

    return scores;
  }

  /**
   * 2. Collaborative Filtering: Simple Latent Factor Matrix Factorization using SGD
   */
  public static computeCollaborativeScores(
    userId: string,
    allTracks: Track[],
    allHistory: ListeningHistory[],
    allLikes: Like[],
    latentFactors = 8,
    epochs = 60,
    lr = 0.05,
    reg = 0.02
  ): Record<string, number> {
    const scores: Record<string, number> = {};
    
    // Map user IDs and track IDs to contiguous integer indexes
    const userSet = new Set<string>();
    const trackSet = new Set<string>();

    allHistory.forEach(h => {
      userSet.add(h.userId);
      trackSet.add(h.trackId);
    });
    allLikes.forEach(l => {
      userSet.add(l.userId);
      trackSet.add(l.trackId);
    });
    allTracks.forEach(t => trackSet.add(t.id));

    const users = Array.from(userSet);
    const tracks = Array.from(trackSet);

    if (users.length === 0 || tracks.length === 0) {
      allTracks.forEach(t => { scores[t.id] = 0.5; });
      return scores;
    }

    const userMap: Record<string, number> = {};
    const trackMap: Record<string, number> = {};

    users.forEach((u, idx) => { userMap[u] = idx; });
    tracks.forEach((t, idx) => { trackMap[t] = idx; });

    // Initialize latent vectors randomly around small positive values
    const P = users.map(() => new Array(latentFactors).fill(0).map(() => Math.random() * 0.1));
    const Q = tracks.map(() => new Array(latentFactors).fill(0).map(() => Math.random() * 0.1));

    // Construct implicit ratings matrix from interactions
    const ratings: { uIdx: number; iIdx: number; rating: number }[] = [];
    const ratingKeys = new Set<string>();

    // Map likes to implicit ratings (Like = high interest: rating 1.5)
    allLikes.forEach(like => {
      const uIdx = userMap[like.userId];
      const iIdx = trackMap[like.trackId];
      if (uIdx !== undefined && iIdx !== undefined) {
        ratings.push({ uIdx, iIdx, rating: 1.5 });
        ratingKeys.add(`${uIdx}-${iIdx}`);
      }
    });

    // Map history completion rate to ratings
    allHistory.forEach(hist => {
      const uIdx = userMap[hist.userId];
      const iIdx = trackMap[hist.trackId];
      if (uIdx !== undefined && iIdx !== undefined) {
        // Calculate rating: completionRate scale (0 to 1.0)
        let rating = hist.completionRate / 100;
        if (hist.skipped) rating = 0.0;

        const key = `${uIdx}-${iIdx}`;
        if (!ratingKeys.has(key)) {
          ratings.push({ uIdx, iIdx, rating });
          ratingKeys.add(key);
        } else {
          // Average or upgrade rating if multiple plays occurred
          const found = ratings.find(r => r.uIdx === uIdx && r.iIdx === iIdx);
          if (found) {
            found.rating = Math.max(found.rating, rating);
          }
        }
      }
    });

    // If we have zero ratings (e.g. fresh environment), set fallback random weights
    if (ratings.length === 0) {
      allTracks.forEach(t => { scores[t.id] = 0.5; });
      return scores;
    }

    // Train the matrix factorization model using Stochastic Gradient Descent (SGD)
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const sample of ratings) {
        const { uIdx, iIdx, rating } = sample;
        const p_u = P[uIdx];
        const q_i = Q[iIdx];

        // Predicted rating: dot product of p_u and q_i
        let prediction = 0;
        for (let f = 0; f < latentFactors; f++) {
          prediction += p_u[f] * q_i[f];
        }

        const error = rating - prediction;

        // Update latent vectors
        for (let f = 0; f < latentFactors; f++) {
          const p_val = p_u[f];
          const q_val = q_i[f];

          p_u[f] += lr * (error * q_val - reg * p_val);
          q_i[f] += lr * (error * p_val - reg * q_val);
        }
      }
    }

    // Compute scores for target user
    const targetUserIdx = userMap[userId];
    if (targetUserIdx === undefined) {
      // Fallback for new user: use general popularity
      allTracks.forEach(t => {
        scores[t.id] = (t.playCount || 0) / 5000;
      });
      return scores;
    }

    const p_u = P[targetUserIdx];
    let minScore = Infinity;
    let maxScore = -Infinity;

    allTracks.forEach(track => {
      const iIdx = trackMap[track.id];
      if (iIdx !== undefined) {
        const q_i = Q[iIdx];
        let pred = 0;
        for (let f = 0; f < latentFactors; f++) {
          pred += p_u[f] * q_i[f];
        }
        scores[track.id] = pred;
        if (pred < minScore) minScore = pred;
        if (pred > maxScore) maxScore = pred;
      } else {
        scores[track.id] = 0;
      }
    });

    // Normalize predicted ratings to [0, 1] range
    const range = maxScore - minScore;
    allTracks.forEach(track => {
      if (range > 0) {
        scores[track.id] = (scores[track.id] - minScore) / range;
      } else {
        scores[track.id] = 0.5;
      }
    });

    return scores;
  }

  /**
   * 3. Session-based: Compute score decaying exponentially based on last 5 session tracks
   */
  public static computeSessionScores(
    userId: string,
    allTracks: Track[],
    history: ListeningHistory[]
  ): Record<string, number> {
    const scores: Record<string, number> = {};
    const userHistory = history
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());

    // Take the last 5 listened tracks
    const sessionHistory = userHistory.slice(0, 5);

    if (sessionHistory.length === 0) {
      allTracks.forEach(t => { scores[t.id] = 0.0; });
      return scores;
    }

    // Collect tag space
    const allTagsSet = new Set<string>();
    allTracks.forEach(t => t.tags.forEach(tag => allTagsSet.add(tag.toLowerCase())));
    const allTags = Array.from(allTagsSet);

    // Track vectors
    const trackVectors: Record<string, number[]> = {};
    allTracks.forEach(track => {
      trackVectors[track.id] = allTags.map(tag => (track.tags.map(t => t.toLowerCase()).includes(tag) ? 1.0 : 0.0));
    });

    // Average session vector with exponential decay
    const sessionVec = new Array(allTags.length).fill(0);
    const decayFactor = 0.5; // weight decays by 0.5 for each step back in session history

    sessionHistory.forEach((hist, age) => {
      const vec = trackVectors[hist.trackId];
      if (vec) {
        const weight = Math.pow(decayFactor, age);
        for (let i = 0; i < vec.length; i++) {
          sessionVec[i] += vec[i] * weight;
        }
      }
    });

    // Compute cosine similarity between session vector and candidate track vectors
    allTracks.forEach(track => {
      const trackVec = trackVectors[track.id];
      if (trackVec) {
        const sim = this.cosineSimilarity(sessionVec, trackVec);
        scores[track.id] = Math.max(0, sim);
      } else {
        scores[track.id] = 0;
      }
    });

    return scores;
  }

  /**
   * 4. Weighted blend: Blend content-based, collaborative, and session-based scores
   */
  public static generateBlendedRecommendations(
    userId: string,
    allTracks: Track[],
    allHistory: ListeningHistory[],
    allLikes: Like[],
    weights: RecommendationWeights = { content: 0.4, collaborative: 0.4, session: 0.2 }
  ): { tracks: Track[]; reason: string } {
    const contentScores = this.computeContentScores(userId, allTracks, allLikes, allHistory);
    const collabScores = this.computeCollaborativeScores(userId, allTracks, allHistory, allLikes);
    const sessionScores = this.computeSessionScores(userId, allTracks, allHistory);

    // Ensure weights sum up to 1.0
    const totalW = weights.content + weights.collaborative + weights.session;
    const wContent = weights.content / (totalW || 1);
    const wCollab = weights.collaborative / (totalW || 1);
    const wSession = weights.session / (totalW || 1);

    const blended = allTracks.map(track => {
      const contentS = contentScores[track.id] || 0;
      const collabS = collabScores[track.id] || 0;
      const sessionS = sessionScores[track.id] || 0;

      const finalScore = (wContent * contentS) + (wCollab * collabS) + (wSession * sessionS);
      return { track, finalScore, details: { contentS, collabS, sessionS } };
    });

    // Sort descending by final blended score
    blended.sort((a, b) => b.finalScore - a.finalScore);

    // Filter out items already liked, or completed with high rates (encourages discovery)
    const likedIds = new Set(allLikes.filter(l => l.userId === userId).map(l => l.trackId));
    const finishedIds = new Set(allHistory.filter(h => h.userId === userId && h.completionRate >= 80).map(h => h.trackId));

    // Recommend top discovery items
    let recommended = blended
      .filter(item => !likedIds.has(item.track.id) && !finishedIds.has(item.track.id))
      .map(item => item.track)
      .slice(0, 6);

    // Fallback if discovery is sparse
    if (recommended.length < 4) {
      recommended = blended.map(item => item.track).slice(0, 6);
    }

    // Build description reason
    const topReasonList: string[] = [];
    if (wContent > 0.3) topReasonList.push('acoustic content similarity');
    if (wCollab > 0.3) topReasonList.push('collaborative listener habits');
    if (wSession > 0.15) topReasonList.push('current session waves');

    const reason = `Blended mix tailored dynamically via ${topReasonList.join(', ')} (Weights: Ctn ${Math.round(wContent * 100)}% / Clb ${Math.round(wCollab * 100)}% / Ssn ${Math.round(wSession * 100)}%)`;

    return {
      tracks: recommended,
      reason
    };
  }
}
