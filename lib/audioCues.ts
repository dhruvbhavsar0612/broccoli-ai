'use client';

/**
 * Audio Cues for Voice Chat
 * Provides subtle audio feedback for state changes
 */

class AudioCueManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        this.isEnabled = false;
      }
    }
  }

  /**
   * Play a thinking state sound (low, calming tone)
   */
  playThinkingCue() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Low frequency, calming tone
    oscillator.frequency.setValueAtTime(220, ctx.currentTime); // A3
    oscillator.type = 'sine';

    // Fade in and out
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  /**
   * Play a generating/speaking state sound (pleasant chime)
   */
  playGeneratingCue() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;

    // Create a pleasant two-tone chime
    this.playTone(440, 0, 0.15, 0.04); // A4
    this.playTone(554.37, 0.08, 0.15, 0.04); // C#5
  }

  /**
   * Play a listening state sound (gentle ascending tone)
   */
  playListeningCue() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Ascending frequency
    oscillator.frequency.setValueAtTime(330, ctx.currentTime); // E4
    oscillator.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.15); // A4
    oscillator.type = 'sine';

    // Fade in and out
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  /**
   * Play a completion sound (gentle descending tone)
   */
  playCompletionCue() {
    if (!this.isEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Descending frequency
    oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
    oscillator.frequency.linearRampToValueAtTime(330, ctx.currentTime + 0.15); // E4
    oscillator.type = 'sine';

    // Fade in and out
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  /**
   * Helper method to play a tone
   */
  private playTone(frequency: number, startTime: number, duration: number, volume: number) {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);
    oscillator.type = 'sine';

    // Fade in and out
    gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + duration);

    oscillator.start(ctx.currentTime + startTime);
    oscillator.stop(ctx.currentTime + startTime + duration);
  }

  /**
   * Enable or disable audio cues
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Check if audio cues are enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Resume audio context (needed after user interaction)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// Singleton instance
let audioCueManager: AudioCueManager | null = null;

export function getAudioCueManager(): AudioCueManager {
  if (!audioCueManager) {
    audioCueManager = new AudioCueManager();
  }
  return audioCueManager;
}

export default AudioCueManager;
