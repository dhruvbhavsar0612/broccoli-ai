"use client";

/**
 * Real-time Audio Analyzer
 * Provides smooth, high-frequency audio analysis for fluid visualizations
 */

export interface FrequencyBands {
  sub: number; // 20-60 Hz (sub-bass)
  bass: number; // 60-250 Hz (bass)
  low: number; // 250-500 Hz (low-mids)
  mid: number; // 500-2000 Hz (mids)
  high: number; // 2000-6000 Hz (high-mids)
  presence: number; // 6000-20000 Hz (presence/brilliance)
}

export interface AudioAnalysisData {
  level: number; // Overall audio level (0-1)
  peak: number; // Peak level with decay (0-1)
  bands: FrequencyBands; // Frequency bands (0-1 each)
  waveform: Float32Array; // Time-domain waveform data
  spectrum: Float32Array; // Frequency spectrum data
  isActive: boolean; // Whether audio is currently being analyzed
}

type AudioDataCallback = (data: AudioAnalysisData) => void;

export class RealtimeAudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;

  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private timeData: Float32Array<ArrayBuffer> = new Float32Array(0);
  private smoothedBands: FrequencyBands = {
    sub: 0,
    bass: 0,
    low: 0,
    mid: 0,
    high: 0,
    presence: 0,
  };
  private smoothedLevel: number = 0;
  private peakLevel: number = 0;

  private animationFrame: number | null = null;
  private callbacks: Set<AudioDataCallback> = new Set();
  private isActive: boolean = false;

  // Smoothing factors (higher = smoother but slower response)
  private readonly levelSmoothing = 0.3;
  private readonly bandSmoothing = 0.25;
  private readonly peakDecay = 0.95;
  private readonly peakRise = 0.98;

  // FFT configuration
  private readonly fftSize = 2048;
  private readonly sampleRate = 24000;

  constructor() {
    // Bind methods
    this.analyze = this.analyze.bind(this);
  }

  /**
   * Initialize the analyzer with a media stream
   */
  async initialize(stream?: MediaStream): Promise<void> {
    try {
      // Use provided stream or get user media
      if (stream) {
        this.mediaStream = stream;
      } else {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: this.sampleRate,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.6;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // Create source from media stream
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.analyser);

      // Initialize data arrays
      this.frequencyData = new Uint8Array(
        this.analyser.frequencyBinCount,
      ) as Uint8Array<ArrayBuffer>;
      this.timeData = new Float32Array(
        this.analyser.fftSize,
      ) as Float32Array<ArrayBuffer>;

      this.isActive = true;

      // Start analysis loop
      this.startAnalysis();
    } catch (error) {
      console.error("Failed to initialize audio analyzer:", error);
      throw error;
    }
  }

  /**
   * Subscribe to audio analysis updates
   */
  subscribe(callback: AudioDataCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Start the analysis loop
   */
  private startAnalysis(): void {
    if (this.animationFrame !== null) return;
    this.analyze();
  }

  /**
   * Main analysis loop
   */
  private analyze(): void {
    if (!this.isActive || !this.analyser) {
      this.animationFrame = null;
      return;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.frequencyData);

    // Get time domain data (waveform)
    this.analyser.getFloatTimeDomainData(this.timeData);

    // Calculate overall level
    const rawLevel = this.calculateLevel();
    this.smoothedLevel = this.lerp(
      this.smoothedLevel,
      rawLevel,
      this.levelSmoothing,
    );

    // Update peak with decay
    if (rawLevel > this.peakLevel) {
      this.peakLevel = this.lerp(this.peakLevel, rawLevel, this.peakRise);
    } else {
      this.peakLevel *= this.peakDecay;
    }

    // Calculate frequency bands
    const rawBands = this.calculateBands();
    this.smoothBands(rawBands);

    // Create normalized spectrum
    const spectrum = new Float32Array(this.frequencyData.length);
    for (let i = 0; i < this.frequencyData.length; i++) {
      spectrum[i] = this.frequencyData[i] / 255;
    }

    // Notify subscribers
    const data: AudioAnalysisData = {
      level: this.smoothedLevel,
      peak: this.peakLevel,
      bands: { ...this.smoothedBands },
      waveform: new Float32Array(this.timeData),
      spectrum,
      isActive: this.isActive,
    };

    this.callbacks.forEach((callback) => callback(data));

    // Continue loop
    this.animationFrame = requestAnimationFrame(this.analyze);
  }

  /**
   * Calculate overall audio level from frequency data
   */
  private calculateLevel(): number {
    if (this.frequencyData.length === 0) return 0;

    let sum = 0;
    let count = 0;

    // Weight lower frequencies more heavily for a more natural response
    for (let i = 0; i < this.frequencyData.length; i++) {
      const weight = 1 - (i / this.frequencyData.length) * 0.5;
      sum += this.frequencyData[i] * weight;
      count += weight;
    }

    return Math.min(1, sum / count / 200); // Normalize to 0-1
  }

  /**
   * Calculate frequency bands
   */
  private calculateBands(): FrequencyBands {
    const nyquist = this.sampleRate / 2;
    const binWidth = nyquist / this.frequencyData.length;

    const getBandAverage = (lowFreq: number, highFreq: number): number => {
      const lowBin = Math.floor(lowFreq / binWidth);
      const highBin = Math.min(
        Math.floor(highFreq / binWidth),
        this.frequencyData.length - 1,
      );

      if (lowBin >= highBin) return 0;

      let sum = 0;
      let count = 0;

      for (let i = lowBin; i <= highBin; i++) {
        sum += this.frequencyData[i];
        count++;
      }

      return count > 0 ? sum / count / 255 : 0;
    };

    return {
      sub: getBandAverage(20, 60),
      bass: getBandAverage(60, 250),
      low: getBandAverage(250, 500),
      mid: getBandAverage(500, 2000),
      high: getBandAverage(2000, 6000),
      presence: getBandAverage(6000, Math.min(20000, nyquist)),
    };
  }

  /**
   * Smooth the frequency bands
   */
  private smoothBands(raw: FrequencyBands): void {
    const keys = Object.keys(raw) as (keyof FrequencyBands)[];
    for (const key of keys) {
      this.smoothedBands[key] = this.lerp(
        this.smoothedBands[key],
        raw[key],
        this.bandSmoothing,
      );
    }
  }

  /**
   * Linear interpolation helper
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Get current analysis data synchronously
   */
  getCurrentData(): AudioAnalysisData {
    const spectrum = new Float32Array(this.frequencyData.length);
    for (let i = 0; i < this.frequencyData.length; i++) {
      spectrum[i] = this.frequencyData[i] / 255;
    }

    return {
      level: this.smoothedLevel,
      peak: this.peakLevel,
      bands: { ...this.smoothedBands },
      waveform: new Float32Array(this.timeData),
      spectrum,
      isActive: this.isActive,
    };
  }

  /**
   * Check if the analyzer is active
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Pause analysis (but keep resources)
   */
  pause(): void {
    this.isActive = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Resume analysis
   */
  resume(): void {
    if (this.analyser && !this.isActive) {
      this.isActive = true;
      this.startAnalysis();
    }
  }

  /**
   * Clean up and release resources
   */
  destroy(): void {
    this.isActive = false;

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Note: Don't stop media stream here as it may be managed externally
    this.mediaStream = null;

    this.callbacks.clear();

    // Reset values
    this.smoothedLevel = 0;
    this.peakLevel = 0;
    this.smoothedBands = {
      sub: 0,
      bass: 0,
      low: 0,
      mid: 0,
      high: 0,
      presence: 0,
    };
  }
}

// Singleton instance for global access
let analyzerInstance: RealtimeAudioAnalyzer | null = null;

export function getRealtimeAudioAnalyzer(): RealtimeAudioAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new RealtimeAudioAnalyzer();
  }
  return analyzerInstance;
}

export function resetRealtimeAudioAnalyzer(): void {
  if (analyzerInstance) {
    analyzerInstance.destroy();
    analyzerInstance = null;
  }
}
