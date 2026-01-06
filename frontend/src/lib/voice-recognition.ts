/**
 * Voice Recognition Handler
 *
 * Manages Web Speech API for voice input
 * Provides fallback support and error handling
 */

export interface VoiceRecognitionConfig {
  language: 'en-US' | 'ur-PK'
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

export interface VoiceTranscript {
  text: string
  confidence: number
  isFinal: boolean
  timestamp: number
}

export type VoiceRecognitionStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'error'
  | 'unsupported'

export interface VoiceRecognitionCallbacks {
  onTranscript?: (transcript: VoiceTranscript) => void
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
  onStatusChange?: (status: VoiceRecognitionStatus) => void
}

/**
 * Voice Recognition Manager
 * Wraps Web Speech API with error handling and fallbacks
 */
export class VoiceRecognitionManager {
  private recognition: SpeechRecognition | null = null
  private config: VoiceRecognitionConfig
  private callbacks: VoiceRecognitionCallbacks
  private status: VoiceRecognitionStatus = 'idle'
  private isListening = false

  constructor(
    config: Partial<VoiceRecognitionConfig> = {},
    callbacks: VoiceRecognitionCallbacks = {}
  ) {
    this.config = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      ...config,
    }
    this.callbacks = callbacks

    this.initialize()
  }

  /**
   * Initialize Web Speech API
   */
  private initialize(): void {
    // Check if Web Speech API is supported
    if (!this.isSupported()) {
      this.updateStatus('unsupported')
      return
    }

    // Create recognition instance
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    this.recognition = new SpeechRecognition()
    this.recognition.lang = this.config.language
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.maxAlternatives = this.config.maxAlternatives

    // Setup event handlers
    this.setupEventHandlers()
  }

  /**
   * Setup event handlers for speech recognition
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      this.updateStatus('listening')
      this.callbacks.onStart?.()
    }

    this.recognition.onend = () => {
      this.isListening = false
      if (this.status !== 'error') {
        this.updateStatus('idle')
      }
      this.callbacks.onEnd?.()
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.updateStatus('processing')

      const results = event.results
      const lastResult = results[results.length - 1]

      if (lastResult) {
        const alternative = lastResult[0]
        const transcript: VoiceTranscript = {
          text: alternative.transcript,
          confidence: alternative.confidence,
          isFinal: lastResult.isFinal,
          timestamp: Date.now(),
        }

        this.callbacks.onTranscript?.(transcript)
      }

      // Return to listening if continuous mode
      if (this.config.continuous && lastResult.isFinal) {
        this.updateStatus('listening')
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.updateStatus('error')
      const errorMessage = this.getErrorMessage(event.error)
      this.callbacks.onError?.(errorMessage)
    }
  }

  /**
   * Check if Web Speech API is supported
   */
  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  /**
   * Start voice recognition
   */
  start(): void {
    if (!this.recognition) {
      this.callbacks.onError?.('Voice recognition not initialized')
      return
    }

    if (this.isListening) {
      return
    }

    try {
      this.recognition.start()
    } catch (error) {
      this.updateStatus('error')
      this.callbacks.onError?.(
        error instanceof Error ? error.message : 'Failed to start recognition'
      )
    }
  }

  /**
   * Stop voice recognition
   */
  stop(): void {
    if (!this.recognition || !this.isListening) {
      return
    }

    try {
      this.recognition.stop()
    } catch (error) {
      console.error('Failed to stop recognition:', error)
    }
  }

  /**
   * Abort voice recognition immediately
   */
  abort(): void {
    if (!this.recognition || !this.isListening) {
      return
    }

    try {
      this.recognition.abort()
      this.updateStatus('idle')
    } catch (error) {
      console.error('Failed to abort recognition:', error)
    }
  }

  /**
   * Update language
   */
  setLanguage(language: 'en-US' | 'ur-PK'): void {
    this.config.language = language
    if (this.recognition) {
      this.recognition.lang = language
    }
  }

  /**
   * Update continuous mode
   */
  setContinuous(continuous: boolean): void {
    this.config.continuous = continuous
    if (this.recognition) {
      this.recognition.continuous = continuous
    }
  }

  /**
   * Get current status
   */
  getStatus(): VoiceRecognitionStatus {
    return this.status
  }

  /**
   * Update status and notify callbacks
   */
  private updateStatus(status: VoiceRecognitionStatus): void {
    this.status = status
    this.callbacks.onStatusChange?.(status)
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech':
        return 'No speech detected. Please try again.'
      case 'audio-capture':
        return 'Microphone not available. Please check permissions.'
      case 'not-allowed':
        return 'Microphone access denied. Please enable microphone permissions.'
      case 'network':
        return 'Network error. Please check your connection.'
      case 'aborted':
        return 'Recognition aborted.'
      case 'language-not-supported':
        return 'Language not supported.'
      default:
        return `Recognition error: ${error}`
    }
  }

  /**
   * Cleanup and destroy instance
   */
  destroy(): void {
    this.abort()
    this.recognition = null
    this.callbacks = {}
  }
}

/**
 * Helper function to check if microphone permission is granted
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch (error) {
    return false
  }
}

/**
 * Helper function to request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch (error) {
    console.error('Microphone permission denied:', error)
    return false
  }
}

/**
 * Augment Window interface with Web Speech API types
 */
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
