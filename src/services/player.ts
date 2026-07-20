/**
 * YouTube IFrame Player API wrapper service
 * Provides audio playback control using YouTube player in background
 */

export type PlayerState = 'UNSTARTED' | 'ENDED' | 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'CUED';

export interface PlayerEvents {
  onReady: () => void;
  onStateChange: (state: PlayerState, duration: number) => void;
  onError: (error: string) => void;
  onTimeUpdate: (currentTime: number) => void;
}

interface YTWindow extends Window {
  onYouTubeIframeAPIReady?: () => void;
  YT?: any;
}

class YouTubeAudioPlayer {
  private player: any = null;
  private isLoaded = false;
  private isReady = false;
  private iframeContainerId = 'yt-hidden-player';
  private timeUpdateInterval: any = null;
  private events: PlayerEvents | null = null;

  /**
   * Loads the YouTube IFrame API Script asynchronously
   */
  public init(events: PlayerEvents): void {
    this.events = events;

    if (this.isLoaded) {
      this.setupPlayer();
      return;
    }

    // 1. Create hidden div for player if it doesn't exist
    let container = document.getElementById(this.iframeContainerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.iframeContainerId;
      // Style it to be completely invisible and small so it doesn't break UI layout
      container.style.position = 'absolute';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.top = '-1000px';
      container.style.left = '-1000px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    // 2. Setup the global callback for YouTube script
    (window as YTWindow).onYouTubeIframeAPIReady = () => {
      this.isLoaded = true;
      this.setupPlayer();
    };

    // 3. Inject YouTube SDK script tag
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    } else if ((window as YTWindow).YT && (window as YTWindow).YT.Player) {
      // Script already loaded by browser previously
      this.isLoaded = true;
      this.setupPlayer();
    }
  }

  /**
   * Instantiate YT.Player in the hidden container
   */
  private setupPlayer(): void {
    const win = window as YTWindow;
    if (!win.YT || !win.YT.Player) {
      setTimeout(() => this.setupPlayer(), 200);
      return;
    }

    try {
      this.player = new win.YT.Player(this.iframeContainerId, {
        height: '100',
        width: '100',
        videoId: '', // start empty
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          playsinline: 1,
          iv_load_policy: 3
        },
        events: {
          onReady: () => {
            this.isReady = true;
            console.log('[YouTube Player] Ready for action.');
            if (this.events) {
              this.events.onReady();
            }
          },
          onStateChange: (event: any) => {
            this.handleStateChange(event.data);
          },
          onError: (event: any) => {
            let errorMsg = 'Unknown error';
            const code = event.data;
            if (code === 2) errorMsg = 'Invalid parameter';
            if (code === 5) errorMsg = 'HTML5 player error';
            if (code === 100) errorMsg = 'Video not found or deleted';
            if (code === 101 || code === 150) errorMsg = 'Playback not allowed in iframe';

            console.error('[YouTube Player] Error occurred:', errorMsg, code);
            if (this.events) {
              this.events.onError(errorMsg);
            }
          }
        }
      });
    } catch (e) {
      console.error('[YouTube Player] Initialization exception:', e);
    }
  }

  /**
   * Maps numerical player states to human-readable codes and starts/stops timer
   */
  private handleStateChange(stateNum: number): void {
    let stateStr: PlayerState = 'UNSTARTED';
    const win = window as YTWindow;

    if (win.YT) {
      switch (stateNum) {
        case win.YT.PlayerState.ENDED:
          stateStr = 'ENDED';
          this.stopTimeTracker();
          break;
        case win.YT.PlayerState.PLAYING:
          stateStr = 'PLAYING';
          this.startTimeTracker();
          break;
        case win.YT.PlayerState.PAUSED:
          stateStr = 'PAUSED';
          this.stopTimeTracker();
          break;
        case win.YT.PlayerState.BUFFERING:
          stateStr = 'BUFFERING';
          break;
        case win.YT.PlayerState.CUED:
          stateStr = 'CUED';
          break;
        default:
          stateStr = 'UNSTARTED';
      }
    }

    if (this.events) {
      const duration = this.player ? this.player.getDuration() : 0;
      this.events.onStateChange(stateStr, duration);
    }
  }

  /**
   * Polling loop to report current playback head position (smooth progression)
   */
  private startTimeTracker(): void {
    this.stopTimeTracker();
    this.timeUpdateInterval = setInterval(() => {
      if (this.player && this.isReady && typeof this.player.getCurrentTime === 'function') {
        const current = this.player.getCurrentTime();
        if (this.events) {
          this.events.onTimeUpdate(current);
        }
      }
    }, 250); // Report location 4 times per second
  }

  private stopTimeTracker(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  // --- CONTROL APIs ---

  /**
   * Starts playing a track by its YouTube video ID
   */
  public loadAndPlay(videoId: string): void {
    if (!this.player || !this.isReady) {
      console.warn('[YouTube Player] loadAndPlay invoked before ready state.');
      return;
    }
    this.player.loadVideoById(videoId);
  }

  /**
   * Resumes active audio playback
   */
  public play(): void {
    if (this.player && this.isReady) {
      this.player.playVideo();
    }
  }

  /**
   * Pauses active audio playback
   */
  public pause(): void {
    if (this.player && this.isReady) {
      this.player.pauseVideo();
    }
  }

  /**
   * Seeks the video to the specified time in seconds
   */
  public seek(seconds: number): void {
    if (this.player && this.isReady) {
      this.player.seekTo(seconds, true);
    }
  }

  /**
   * Sets the playback volume from 0 to 100
   */
  public setVolume(volume: number): void {
    if (this.player && this.isReady) {
      // Ensure constraints are respected
      const normalized = Math.max(0, Math.min(100, volume));
      this.player.setVolume(normalized);
    }
  }

  /**
   * Clears timers and resets reference
   */
  public destroy(): void {
    this.stopTimeTracker();
    if (this.player) {
      try {
        this.player.destroy();
      } catch {}
      this.player = null;
    }
    this.isReady = false;
  }
}

export const ytPlayer = new YouTubeAudioPlayer();
