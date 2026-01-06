/**
 * Voice Command Parser
 *
 * Parses voice input into structured commands for task management
 * Supports both English and Urdu languages
 */

export interface VoiceCommand {
  action: 'add' | 'list' | 'complete' | 'delete' | 'update' | 'unknown'
  params: {
    id?: string
    title?: string
  }
  confidence: number
  originalText: string
  language: 'en' | 'ur'
}

/**
 * English command patterns
 */
const ENGLISH_PATTERNS = {
  add: [
    /^add task (.+)$/i,
    /^create task (.+)$/i,
    /^new task (.+)$/i,
  ],
  list: [
    /^list tasks?$/i,
    /^show (all )?tasks?$/i,
    /^get (all )?tasks?$/i,
    /^view (all )?tasks?$/i,
  ],
  complete: [
    /^complete task (.+)$/i,
    /^finish task (.+)$/i,
    /^mark task (.+) (as )?complete$/i,
    /^done task (.+)$/i,
  ],
  delete: [
    /^delete task (.+)$/i,
    /^remove task (.+)$/i,
    /^erase task (.+)$/i,
  ],
  update: [
    /^update task (.+?) (?:to )?(.+)$/i,
    /^change task (.+?) (?:to )?(.+)$/i,
    /^rename task (.+?) (?:to )?(.+)$/i,
    /^edit task (.+?) (?:to )?(.+)$/i,
  ],
}

/**
 * Urdu command patterns (using Arabic script)
 */
const URDU_PATTERNS = {
  add: [
    /^کام شامل کرو (.+)$/,
    /^نیا کام (.+)$/,
  ],
  list: [
    /^تمام کام دکھاؤ$/,
    /^کام دکھاؤ$/,
    /^سب کام$/,
  ],
  complete: [
    /^کام مکمل کرو (.+)$/,
    /^کام ختم کرو (.+)$/,
  ],
  delete: [
    /^کام حذف کرو (.+)$/,
    /^کام ہٹاؤ (.+)$/,
  ],
  update: [
    /^کام تبدیل کرو (.+?) (.+)$/,
    /^کام بدلو (.+?) (.+)$/,
  ],
}

/**
 * Parse English voice command
 * @param text - Voice input text
 * @returns Parsed voice command or null
 */
function parseEnglishCommand(text: string): VoiceCommand | null {
  const normalized = text.trim()

  // Check add patterns
  for (const pattern of ENGLISH_PATTERNS.add) {
    const match = normalized.match(pattern)
    if (match) {
      return {
        action: 'add',
        params: { title: match[1].trim() },
        confidence: 0.9,
        originalText: text,
        language: 'en',
      }
    }
  }

  // Check list patterns
  for (const pattern of ENGLISH_PATTERNS.list) {
    if (pattern.test(normalized)) {
      return {
        action: 'list',
        params: {},
        confidence: 0.95,
        originalText: text,
        language: 'en',
      }
    }
  }

  // Check complete patterns
  for (const pattern of ENGLISH_PATTERNS.complete) {
    const match = normalized.match(pattern)
    if (match) {
      return {
        action: 'complete',
        params: { id: match[1].trim() },
        confidence: 0.85,
        originalText: text,
        language: 'en',
      }
    }
  }

  // Check delete patterns
  for (const pattern of ENGLISH_PATTERNS.delete) {
    const match = normalized.match(pattern)
    if (match) {
      return {
        action: 'delete',
        params: { id: match[1].trim() },
        confidence: 0.85,
        originalText: text,
        language: 'en',
      }
    }
  }

  // Check update patterns
  for (const pattern of ENGLISH_PATTERNS.update) {
    const match = normalized.match(pattern)
    if (match) {
      return {
        action: 'update',
        params: { id: match[1].trim(), title: match[2].trim() },
        confidence: 0.8,
        originalText: text,
        language: 'en',
      }
    }
  }

  return null
}

/**
 * Parse Urdu voice command
 * @param text - Voice input text in Urdu
 * @returns Parsed voice command or null
 */
function parseUrduCommand(text: string): VoiceCommand | null {
  const normalized = text.trim()

  // Check add patterns
  for (const pattern of URDU_PATTERNS.add) {
    const match = normalized.match(pattern)
    if (match) {
      return {
        action: 'add',
        params: { title: match[1].trim() },
        confidence: 0.9,
        originalText: text,
        language: 'ur',
      }
    }
  }

  // Check list patterns
  for (const pattern of URDU_PATTERNS.list) {
    if (pattern.test(normalized)) {
      return {
        action: 'list',
        params: {},
        confidence: 0.95,
        originalText: text,
        language: 'ur',
      }
    }
  }

  // Check complete patterns
  for (const pattern of URDU_PATTERNS.complete) {
    const match = normalized.match(pattern)
    if (match) {
      return {
        action: 'complete',
        params: { id: match[1].trim() },
        confidence: 0.85,
        originalText: text,
        language: 'ur',
      }
    }
  }

  // Check delete patterns
  for (const pattern of URDU_PATTERNS.delete) {
    const match = normalized.match(pattern)
    if (match) {
      return {
        action: 'delete',
        params: { id: match[1].trim() },
        confidence: 0.85,
        originalText: text,
        language: 'ur',
      }
    }
  }

  // Check update patterns
  for (const pattern of URDU_PATTERNS.update) {
    const match = normalized.match(pattern)
    if (match) {
      return {
        action: 'update',
        params: { id: match[1].trim(), title: match[2].trim() },
        confidence: 0.8,
        originalText: text,
        language: 'ur',
      }
    }
  }

  return null
}

/**
 * Parse voice input into a structured command
 * @param text - Voice input text
 * @param language - Target language ('en' or 'ur')
 * @returns Parsed voice command
 */
export function parseVoiceCommand(
  text: string,
  language: 'en' | 'ur' = 'en'
): VoiceCommand {
  // Try parsing with specified language first
  const command =
    language === 'en'
      ? parseEnglishCommand(text)
      : parseUrduCommand(text)

  // If parsing fails, try the other language
  if (!command) {
    const fallbackCommand =
      language === 'en'
        ? parseUrduCommand(text)
        : parseEnglishCommand(text)

    if (fallbackCommand) {
      return fallbackCommand
    }
  }

  if (command) {
    return command
  }

  // Return unknown command with low confidence
  return {
    action: 'unknown',
    params: {},
    confidence: 0.0,
    originalText: text,
    language,
  }
}

/**
 * Get command description for feedback
 * @param command - Parsed voice command
 * @returns Human-readable description
 */
export function getCommandDescription(command: VoiceCommand): string {
  const lang = command.language

  switch (command.action) {
    case 'add':
      return lang === 'en'
        ? `Adding task: "${command.params.title}"`
        : `کام شامل کیا جا رہا ہے: "${command.params.title}"`

    case 'list':
      return lang === 'en' ? 'Listing all tasks' : 'تمام کام دکھائے جا رہے ہیں'

    case 'complete':
      return lang === 'en'
        ? `Completing task: ${command.params.id}`
        : `کام مکمل کیا جا رہا ہے: ${command.params.id}`

    case 'delete':
      return lang === 'en'
        ? `Deleting task: ${command.params.id}`
        : `کام حذف کیا جا رہا ہے: ${command.params.id}`

    case 'update':
      return lang === 'en'
        ? `Updating task ${command.params.id} to: "${command.params.title}"`
        : `کام ${command.params.id} تبدیل کیا جا رہا ہے: "${command.params.title}"`

    case 'unknown':
    default:
      return lang === 'en'
        ? 'Command not recognized'
        : 'کمانڈ سمجھ نہیں آئی'
  }
}

/**
 * Get help text for voice commands
 * @param language - Language for help text
 * @returns Help text
 */
export function getVoiceCommandHelp(language: 'en' | 'ur' = 'en'): string[] {
  if (language === 'en') {
    return [
      'add task [title] - Create a new task',
      'list tasks - Show all tasks',
      'complete task [id] - Mark task as complete',
      'delete task [id] - Delete a task',
      'update task [id] [new title] - Update task title',
    ]
  } else {
    return [
      'کام شامل کرو [عنوان] - نیا کام بنائیں',
      'تمام کام دکھاؤ - سب کام دکھائیں',
      'کام مکمل کرو [آئی ڈی] - کام مکمل کریں',
      'کام حذف کرو [آئی ڈی] - کام حذف کریں',
      'کام تبدیل کرو [آئی ڈی] [نیا عنوان] - کام کا عنوان بدلیں',
    ]
  }
}
