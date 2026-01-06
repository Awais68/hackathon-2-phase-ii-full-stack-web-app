/**
 * Voice Synthesis (Text-to-Speech) Handler
 *
 * Provides text-to-speech feedback for voice commands
 * Supports multiple languages and voice options
 */

export interface VoiceSynthesisConfig {
  language: 'en-US' | 'ur-PK'
  rate: number // 0.1 to 10
  pitch: number // 0 to 2
  volume: number // 0 to 1
}

export interface VoiceFeedbackCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

/**
 * Voice Synthesis Manager
 * Wraps Web Speech Synthesis API for text-to-speech
 */
export class VoiceSynthesisManager {
  private synth: SpeechSynthesis | null = null
  private config: VoiceSynthesisConfig
  private callbacks: VoiceFeedbackCallbacks
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private availableVoices: SpeechSynthesisVoice[] = []

  constructor(
    config: Partial<VoiceSynthesisConfig> = {},
    callbacks: VoiceFeedbackCallbacks = {}
  ) {
    this.config = {
      language: 'en-US',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      ...config,
    }
    this.callbacks = callbacks

    this.initialize()
  }

  /**
   * Initialize Speech Synthesis API
   */
  private initialize(): void {
    if (!this.isSupported()) {
      return
    }

    this.synth = window.speechSynthesis

    // Load available voices
    this.loadVoices()

    // Listen for voice changes (some browsers load voices asynchronously)
    if (this.synth) {
      this.synth.onvoiceschanged = () => {
        this.loadVoices()
      }
    }
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (!this.synth) return

    this.availableVoices = this.synth.getVoices()
  }

  /**
   * Check if Web Speech Synthesis API is supported
   */
  isSupported(): boolean {
    return !!window.speechSynthesis
  }

  /**
   * Get the best voice for the configured language
   */
  private getVoiceForLanguage(
    language: string
  ): SpeechSynthesisVoice | undefined {
    // Try to find exact language match
    let voice = this.availableVoices.find((v) => v.lang === language)

    // Try to find language prefix match (e.g., 'en' for 'en-US')
    if (!voice) {
      const langPrefix = language.split('-')[0]
      voice = this.availableVoices.find((v) => v.lang.startsWith(langPrefix))
    }

    // Try to find default voice for the language
    if (!voice) {
      voice = this.availableVoices.find(
        (v) => v.lang.startsWith(language.split('-')[0]) && v.default
      )
    }

    return voice
  }

  /**
   * Speak text with text-to-speech
   * @param text - Text to speak
   * @param options - Optional override config
   */
  speak(text: string, options: Partial<VoiceSynthesisConfig> = {}): void {
    if (!this.synth || !this.isSupported()) {
      this.callbacks.onError?.('Speech synthesis not supported')
      return
    }

    // Cancel any ongoing speech
    this.cancel()

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text)

    // Apply configuration
    const config = { ...this.config, ...options }
    utterance.lang = config.language
    utterance.rate = config.rate
    utterance.pitch = config.pitch
    utterance.volume = config.volume

    // Set voice if available
    const voice = this.getVoiceForLanguage(config.language)
    if (voice) {
      utterance.voice = voice
    }

    // Setup event handlers
    utterance.onstart = () => {
      this.callbacks.onStart?.()
    }

    utterance.onend = () => {
      this.currentUtterance = null
      this.callbacks.onEnd?.()
    }

    utterance.onerror = (event) => {
      this.currentUtterance = null
      this.callbacks.onError?.(
        event.error || 'Speech synthesis error'
      )
    }

    // Store current utterance
    this.currentUtterance = utterance

    // Speak
    this.synth.speak(utterance)
  }

  /**
   * Pause ongoing speech
   */
  pause(): void {
    if (!this.synth || !this.isSpeaking()) return
    this.synth.pause()
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (!this.synth || !this.isPaused()) return
    this.synth.resume()
  }

  /**
   * Cancel ongoing speech
   */
  cancel(): void {
    if (!this.synth) return
    this.synth.cancel()
    this.currentUtterance = null
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth?.speaking ?? false
  }

  /**
   * Check if speech is paused
   */
  isPaused(): boolean {
    return this.synth?.paused ?? false
  }

  /**
   * Update language
   */
  setLanguage(language: 'en-US' | 'ur-PK'): void {
    this.config.language = language
  }

  /**
   * Update speech rate
   */
  setRate(rate: number): void {
    this.config.rate = Math.max(0.1, Math.min(10, rate))
  }

  /**
   * Update speech pitch
   */
  setPitch(pitch: number): void {
    this.config.pitch = Math.max(0, Math.min(2, pitch))
  }

  /**
   * Update speech volume
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices
  }

  /**
   * Get voices for specific language
   */
  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    const langPrefix = language.split('-')[0]
    return this.availableVoices.filter((v) => v.lang.startsWith(langPrefix))
  }

  /**
   * Cleanup and destroy instance
   */
  destroy(): void {
    this.cancel()
    this.synth = null
    this.callbacks = {}
  }
}

/**
 * Helper function to play audio beep
 * Used for start/stop indicators
 */
export function playBeep(frequency: number = 800, duration: number = 100): void {
  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    return
  }

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration / 1000
    )

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration / 1000)
  } catch (error) {
    console.error('Failed to play beep:', error)
  }
}

/**
 * Predefined feedback messages
 */
export const FEEDBACK_MESSAGES = {
  en: {
    listening: 'Listening',
    processing: 'Processing',
    success: 'Done',
    error: 'Error',
    commandUnknown: 'Command not recognized. Please try again.',
    lowConfidence: 'Not sure what you said. Please speak clearly.',
  },
  ur: {
    listening: 'سن رہا ہوں',
    processing: 'پراسیسنگ',
    success: 'ہو گیا',
    error: 'خرابی',
    commandUnknown: 'کمانڈ سمجھ نہیں آئی۔ دوبارہ کوشش کریں۔',
    lowConfidence: 'صاف بولیں۔',
  },
}

/**
 * Get feedback message in specified language
 */
export function getFeedbackMessage(
  key: keyof typeof FEEDBACK_MESSAGES.en,
  language: 'en' | 'ur' = 'en'
): string {
  return FEEDBACK_MESSAGES[language][key]
}
