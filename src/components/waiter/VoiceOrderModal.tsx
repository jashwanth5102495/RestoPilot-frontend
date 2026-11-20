import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Plus, Minus, Trash2, ArrowRight, Check, Utensils } from 'lucide-react';
import { getDishImage } from '../../lib/dishImages';

interface VoiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTable: any;
  dishes: any[];
  onConfirmOrder: (items: { dishId: string; quantity: number; notes?: string }[]) => Promise<void>;
}

// Spoken number words mapping (1 to 20 + quantities)
const NUMBER_WORDS: Record<string, number> = {
  one: 1, '1': 1, single: 1, a: 1, an: 1,
  two: 2, '2': 2, to: 2, too: 2, double: 2,
  three: 3, '3': 3, triple: 3,
  four: 4, '4': 4, for: 4,
  five: 5, '5': 5,
  six: 6, '6': 6,
  seven: 7, '7': 7,
  eight: 8, '8': 8, ate: 8,
  nine: 9, '9': 9,
  ten: 10, '10': 10,
  eleven: 11, '11': 11,
  twelve: 12, '12': 12,
  thirteen: 13, '13': 13,
  fourteen: 14, '14': 14,
  fifteen: 15, '15': 15,
  sixteen: 16, '16': 16,
  seventeen: 17, '17': 17,
  eighteen: 18, '18': 18,
  nineteen: 19, '19': 19,
  twenty: 20, '20': 20,
};

// Common spoken food synonyms and phonetic aliases in Indian restaurant POS
const COMMON_ALIASES: [RegExp, string][] = [
  // Biryani normalizations (biryani / briyani -> biriyani)
  [/\bbiryani\b|\bbriyani\b|\bbiriyanis\b/gi, 'biriyani'],
  // Naan variations (nan / nans -> naan)
  [/\bnan\b|\bnans\b/gi, 'naan'],
  [/\bnaans\b/gi, 'naan'],
  // Roti variations
  [/\brotis\b|\broties\b/gi, 'roti'],
  // Parotta variations
  [/\bparotta\b|\bporotta\b|\bparatha\b|\bparathas\b/gi, 'parota'],
  // Kulcha variations
  [/\bkulchas\b/gi, 'kulcha'],
  // Popular dish aliases
  [/\bbutter\s+chicken\b/gi, 'chicken butter masala'],
  [/\bpaneer\s+butter\b(?!\s+masala)/gi, 'paneer butter masala'],
  [/\bchicken\s+tikka\b(?!\s+(?:masala|boneless|bone))/gi, 'chicken tikka'],
  [/\bpaneer\s+tikka\b(?!\s+(?:masala|peri|nilgiri|malai))/gi, 'paneer tikka'],
  [/\btandoori\s+roti\b/gi, 'roti'],
  [/\btandoori\s+chicken\b/gi, 'chicken tandoor'],
  [/\bchicken\s+tandoori\b/gi, 'chicken tandoor'],
  [/\bsixty\s+five\b/gi, '65'],
  // Beverage aliases
  [/\bcoke\b/gi, 'coca cola'],
  [/\bcoca-cola\b/gi, 'coca cola'],
  [/\bthumbs\s*up\b|\bthums\s*up\b/gi, 'thumbs up'],
  [/\blime\s+soda\b/gi, 'fresh lime soda'],
  [/\blemon\s+juice\b|\blemon\b/gi, 'limon juice'],
  [/\bpeper\b/gi, 'pepper'],
  [/\bpomfret\b/gi, 'pamphlet'],
  [/\bwhisky\b|\bwhiskey\b/gi, 'wisky'],
  [/\balfaham\b/gi, 'alfam'],
  [/\bkabab\b|\bkababs\b|\bkebabs\b/gi, 'kebab'],
  [/\bdaal\b/gi, 'dal'],
];

const FILLER_WORDS = new Set([
  'plate', 'plates', 'glass', 'glasses', 'bottle', 'bottles', 'portion', 'portions',
  'cup', 'cups', 'order', 'orders', 'piece', 'pieces', 'can', 'cans',
  'please', 'give', 'me', 'want', 'table', 'add', 'and', 'with', 'bring'
]);

const PREFIXES_TO_STRIP = ['mystery ', 'special ', 'chef special ', 'daba special ', 'our '];

function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[/,.;:!?+()\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhonetics(text: string): string {
  let t = ' ' + text + ' ';
  for (const [pattern, repl] of COMMON_ALIASES) {
    t = t.replace(pattern, repl);
  }
  return t.replace(/\s+/g, ' ').trim();
}

function stemToken(w: string): string {
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}

interface PreparedDish {
  dish: any;
  name: string;
  tokens: string[];
  stemmed: string[];
}

function buildPreparedDishes(allDishes: any[]): PreparedDish[] {
  const prepared: PreparedDish[] = [];
  for (const dish of allDishes) {
    const rawName = dish.name || '';
    const variants = [rawName];
    // Strip parentheses e.g. "Chaklli Chicken (Daba Special)" -> "Chaklli Chicken"
    const noParens = rawName.replace(/\([^)]*\)/g, ' ').trim();
    if (noParens && noParens !== rawName) {
      variants.push(noParens);
    }

    // Strip cafe name / special prefix e.g. "Mystery Chicken Dum Biriyani" -> "Chicken Dum Biriyani"
    for (const pfx of PREFIXES_TO_STRIP) {
      const lower = rawName.toLowerCase();
      if (lower.startsWith(pfx)) {
        const stripped = rawName.slice(pfx.length).trim();
        if (stripped) variants.push(stripped);
      }
    }

    // Direct alias for Dum Biriyani
    if (rawName.toLowerCase().includes('dum biriyani') || rawName.toLowerCase().includes('dum biryani')) {
      variants.push('dum biriyani');
    }

    for (const v of variants) {
      const cleaned = cleanText(v);
      const norm = normalizePhonetics(cleaned);
      if (norm && norm.length >= 2) {
        const tokens = norm.split(' ');
        prepared.push({
          dish,
          name: norm,
          tokens,
          stemmed: tokens.map(stemToken),
        });
      }
    }
  }

  // Dishes with more words match first, so "Chicken Tikka Masala" matches before "Chicken Tikka"
  prepared.sort((a, b) => b.tokens.length - a.tokens.length || b.name.length - a.name.length);
  return prepared;
}

export function parseSpokenDishes(transcript: string, allDishes: any[]): { dish: any; quantity: number }[] {
  if (!transcript || !allDishes || allDishes.length === 0) return [];

  const cleaned = cleanText(transcript);
  const norm = normalizePhonetics(cleaned);
  const tokens = norm.split(' ');
  const stemmed = tokens.map(stemToken);

  const preparedDishes = buildPreparedDishes(allDishes);
  const usedIndices = new Set<number>();
  const results: { dish: any; quantity: number }[] = [];

  for (const pd of preparedDishes) {
    const dTokens = pd.tokens;
    const dStemmed = pd.stemmed;
    const dLen = dTokens.length;

    let i = 0;
    while (i <= tokens.length - dLen) {
      const windowIndices: number[] = [];
      for (let k = 0; k < dLen; k++) windowIndices.push(i + k);

      if (windowIndices.some(idx => usedIndices.has(idx))) {
        i++;
        continue;
      }

      let matchFound = true;
      for (let k = 0; k < dLen; k++) {
        if (tokens[i + k] !== dTokens[k] && stemmed[i + k] !== dStemmed[k]) {
          matchFound = false;
          break;
        }
      }

      if (matchFound) {
        let qty = 1;
        let leftFound = false;

        // Check token immediately to left for quantity
        let leftIdx = i - 1;
        while (leftIdx >= 0 && !usedIndices.has(leftIdx) && FILLER_WORDS.has(tokens[leftIdx]) && !(tokens[leftIdx] in NUMBER_WORDS)) {
          leftIdx--;
        }
        if (leftIdx >= 0 && !usedIndices.has(leftIdx) && tokens[leftIdx] in NUMBER_WORDS) {
          qty = NUMBER_WORDS[tokens[leftIdx]];
          usedIndices.add(leftIdx);
          leftFound = true;
        }

        // If no number on left, check token immediately to right (e.g. "chicken biryani 2")
        if (!leftFound) {
          let rightIdx = i + dLen;
          while (rightIdx < tokens.length && !usedIndices.has(rightIdx) && FILLER_WORDS.has(tokens[rightIdx]) && !(tokens[rightIdx] in NUMBER_WORDS)) {
            rightIdx++;
          }
          if (rightIdx < tokens.length && !usedIndices.has(rightIdx) && tokens[rightIdx] in NUMBER_WORDS) {
            qty = NUMBER_WORDS[tokens[rightIdx]];
            usedIndices.add(rightIdx);
          }
        }

        for (const idx of windowIndices) {
          usedIndices.add(idx);
        }

        const dishId = pd.dish._id;
        const existing = results.find(r => r.dish._id === dishId);
        if (existing) {
          existing.quantity += qty;
        } else {
          results.push({ dish: pd.dish, quantity: qty });
        }

        i += dLen - 1;
      }
      i++;
    }
  }

  // Smarter fallback: If "biryani" was spoken alone without a recognized combo
  if (norm.includes('biriyani') && results.length === 0) {
    let defaultBiryani: any = null;
    if (norm.includes('rice')) {
      defaultBiryani = allDishes.find(d => d.name?.toLowerCase().includes('biriyani') && d.name?.toLowerCase().includes('rice'));
    } else {
      defaultBiryani = (
        allDishes.find(d => d.name?.toLowerCase().includes('chicken') && d.name?.toLowerCase().includes('biriyani')) ||
        allDishes.find(d => d.name?.toLowerCase().includes('biriyani') && !d.name?.toLowerCase().includes('rice'))
      );
    }

    if (defaultBiryani) {
      let qty = 1;
      for (const tok of tokens) {
        if (tok in NUMBER_WORDS) {
          qty = NUMBER_WORDS[tok];
          break;
        }
      }
      results.push({ dish: defaultBiryani, quantity: qty });
    }
  }

  return results;
}

/**
 * Animated Chef Assistant Icon (Custom SVG matching reference illustration)
 */
function ChefAssistantIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14 md:w-18 md:h-18 select-none pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 45C14 48.5 14 53.5 16 57" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M11 41C8.5 47 8.5 55 11 61" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
      <path d="M84 45C86 48.5 86 53.5 84 57" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M89 41C91.5 47 91.5 55 89 61" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />

      {/* Chef Hat */}
      <path
        d="M34 32C31 25 35 16 44 18C47 13 54 13 57 18C66 16 70 25 67 32"
        fill="#FFFFFF"
        stroke="#18181B"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M33 32H67V37H33V32Z" fill="#FFFFFF" stroke="#18181B" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M42 22V32M50 20V32M58 22V32" stroke="#E4E4E7" strokeWidth="1.6" strokeLinecap="round" />

      {/* Head / Face */}
      <rect x="36" y="36.5" width="28" height="23" rx="11.5" fill="#FFE0C2" stroke="#18181B" strokeWidth="2.4" />
      <circle cx="34.5" cy="47" r="2.5" fill="#FFE0C2" stroke="#18181B" strokeWidth="1.6" />
      <circle cx="65.5" cy="47" r="2.5" fill="#FFE0C2" stroke="#18181B" strokeWidth="1.6" />

      {/* Eyes */}
      <path d="M41 45C42.5 43 45 43 46.5 45" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M53.5 45C55 43 57.5 43 59 45" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" />

      {/* Rosy Cheeks */}
      <circle cx="39" cy="49.5" r="2.2" fill="#F87171" fillOpacity="0.45" />
      <circle cx="61" cy="49.5" r="2.2" fill="#F87171" fillOpacity="0.45" />

      {/* Moustache */}
      <path
        d="M50 49C46.8 47.8 43.5 49 41.5 51.5C43.5 53.5 47.5 52.8 50 50.2C52.5 52.8 56.5 53.5 58.5 51.5C56.5 49 53.2 47.8 50 49Z"
        fill="#18181B"
      />

      {/* Cravat */}
      <path d="M44 58.5L50 64.5L56 58.5L50 56.5Z" fill="#EA580C" stroke="#18181B" strokeWidth="1.6" strokeLinejoin="round" />

      {/* Chef Uniform */}
      <path
        d="M29 76C29 66.5 35 60.5 43 58.5L50 62L57 58.5C65 60.5 71 66.5 71 76"
        fill="#FFFFFF"
        stroke="#18181B"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M48.5 64V76" stroke="#D4D4D8" strokeWidth="1.5" strokeDasharray="1 2.5" />
      <circle cx="44.5" cy="68" r="1.3" fill="#18181B" />
      <circle cx="55.5" cy="68" r="1.3" fill="#18181B" />
      <circle cx="44.5" cy="73.5" r="1.3" fill="#18181B" />
      <circle cx="55.5" cy="73.5" r="1.3" fill="#18181B" />
    </svg>
  );
}

export default function VoiceOrderModal({
  isOpen,
  onClose,
  activeTable,
  dishes,
  onConfirmOrder,
}: VoiceOrderModalProps) {
  // Navigation View State: 'LISTENING' or 'REVIEW'
  const [viewState, setViewState] = useState<'LISTENING' | 'REVIEW'>('LISTENING');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('Speak dishes with quantities (e.g. 2 Chicken Biryani)');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recognizedItems, setRecognizedItems] = useState<{ dish: any; quantity: number }[]>([]);

  // Slider State
  const [sliderProgress, setSliderProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // References
  const isComponentOpenRef = useRef(false);
  const isMicActiveRef = useRef(true);
  const isRecognitionRunningRef = useRef(false);
  const restartTimerRef = useRef<any>(null);
  const consecutiveQuickEndsRef = useRef(0);
  const lastStartTimeRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const speakingTimeoutRef = useRef<any>(null);

  // Persistent transcripts across speech pauses and automatic restarts
  const accumulatedTranscriptRef = useRef<string>('');
  const currentSessionFinalRef = useRef<string>('');
  const latestSessionTextRef = useRef<string>('');
  const sliderTrackRef = useRef<HTMLDivElement | null>(null);

  const tableName = activeTable?.name?.toLowerCase().startsWith('table')
    ? activeTable.name
    : `Table ${activeTable?.name || activeTable?.tableNumber}`;

  useEffect(() => {
    if (isOpen) {
      isComponentOpenRef.current = true;
      isMicActiveRef.current = true;
      isRecognitionRunningRef.current = false;
      consecutiveQuickEndsRef.current = 0;
      setViewState('LISTENING');
      setIsSpeaking(false);
      setLiveTranscript('');
      setErrorMessage(null);
      setRecognizedItems([]);
      setSliderProgress(0);
      setIsPlacingOrder(false);
      accumulatedTranscriptRef.current = '';
      currentSessionFinalRef.current = '';
      latestSessionTextRef.current = '';

      startSpeechRecognition();
    } else {
      isComponentOpenRef.current = false;
      isMicActiveRef.current = false;
      cleanupSpeechRecognition();
    }

    return () => {
      isComponentOpenRef.current = false;
      isMicActiveRef.current = false;
      cleanupSpeechRecognition();
    };
  }, [isOpen]);

  const cleanupSpeechRecognition = () => {
    isMicActiveRef.current = false;
    isRecognitionRunningRef.current = false;
    setIsSpeaking(false);
    setIsMicListening(false);

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
  };

  /**
   * Safe, debounced, non-flickering speech recognition initialization.
   * Completely avoids synchronous onend restart loops and hardware collisions.
   */
  const startSpeechRecognition = async () => {
    if (!isComponentOpenRef.current || !isMicActiveRef.current) return;
    if (isRecognitionRunningRef.current) return;

    // 1. Explicitly verify microphone permission once without holding an audio graph lock
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release media tracks so SpeechRecognition has 100% exclusive access
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone in browser URL bar settings.');
        return;
      }
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please open in Google Chrome or Microsoft Edge.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-IN'; // Tuned for Indian English & restaurant accents

      recognition.onstart = () => {
        isRecognitionRunningRef.current = true;
        setIsMicListening(true);
        lastStartTimeRef.current = Date.now();
        setStatusMessage('Listening • Speak your order now...');
        setErrorMessage(null);
      };

      recognition.onspeechstart = () => {
        setIsSpeaking(true);
      };

      recognition.onsoundstart = () => {
        setIsSpeaking(true);
      };

      recognition.onspeechend = () => {
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(() => {
          setIsSpeaking(false);
        }, 1200);
      };

      recognition.onsoundend = () => {
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(() => {
          setIsSpeaking(false);
        }, 1200);
      };

      recognition.onresult = (event: any) => {
        setIsSpeaking(true);
        consecutiveQuickEndsRef.current = 0; // successfully receiving speech!

        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(() => {
          setIsSpeaking(false);
        }, 1500);

        let currentSessionFinal = '';
        let currentSessionInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item[0]?.transcript) {
            if (item.isFinal) {
              currentSessionFinal += item[0].transcript + ' ';
            } else {
              currentSessionInterim += item[0].transcript + ' ';
            }
          }
        }

        currentSessionFinalRef.current = currentSessionFinal;
        latestSessionTextRef.current = (currentSessionFinal + ' ' + currentSessionInterim).trim();

        // Live text typed in real-time as spoken
        const liveTypingText = (currentSessionInterim || currentSessionFinal || '').trim();
        if (liveTypingText) {
          setLiveTranscript(liveTypingText);
        }

        // Full transcript across sessions to parse dishes
        const fullSpoken = (accumulatedTranscriptRef.current + ' ' + currentSessionFinal + ' ' + currentSessionInterim).trim();
        const parsed = parseSpokenDishes(fullSpoken, dishes);
        if (parsed.length > 0) {
          setRecognizedItems(parsed);
          setStatusMessage(`${parsed.length} dish(es) recognized`);
        }
      };

      recognition.onerror = (event: any) => {
        if (
          event.error === 'no-speech' ||
          event.error === 'aborted'
        ) {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Microphone access is blocked. Please click the lock icon in your browser URL bar and choose "Allow Microphone".');
        } else if (event.error === 'network') {
          setErrorMessage('Google Speech network error: Speech recognition requires Google Chrome or Microsoft Edge with internet access. Embedded IDE preview tabs and Brave browser block Google speech services.');
        } else if (event.error === 'audio-capture') {
          setErrorMessage('No microphone was found or mic is currently in use by another program.');
        }
      };

      recognition.onend = () => {
        isRecognitionRunningRef.current = false;
        setIsMicListening(false);

        // Commit final transcript before restarting so speech is NEVER lost across pauses
        if (currentSessionFinalRef.current) {
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current + ' ' + currentSessionFinalRef.current
          ).trim();
          currentSessionFinalRef.current = '';
        }

        const sessionDuration = Date.now() - lastStartTimeRef.current;
        if (sessionDuration < 1000) {
          consecutiveQuickEndsRef.current++;
        } else {
          consecutiveQuickEndsRef.current = 0;
        }

        // Circuit breaker: prevent infinite restart loops if browser engine keeps aborting
        if (consecutiveQuickEndsRef.current >= 4) {
          setStatusMessage('Microphone idle. Tap chef button to resume.');
          return;
        }

        // Debounced restart with a healthy delay: prevents high-speed flashing of the red dot & UI flickering
        if (isComponentOpenRef.current && isMicActiveRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          const delay = consecutiveQuickEndsRef.current > 0 ? 1000 : 600;
          restartTimerRef.current = setTimeout(() => {
            if (isComponentOpenRef.current && isMicActiveRef.current && !isRecognitionRunningRef.current) {
              try {
                recognition.start();
              } catch {}
            }
          }, delay);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Speech recognition initialization error:', err);
      setErrorMessage(err.message || 'Could not start speech recognition');
    }
  };

  const handleStopMicAndReview = () => {
    const fullSpoken = (accumulatedTranscriptRef.current + ' ' + latestSessionTextRef.current).trim();
    if (fullSpoken) {
      const parsed = parseSpokenDishes(fullSpoken, dishes);
      if (parsed.length > 0) {
        setRecognizedItems(parsed);
      }
    }

    cleanupSpeechRecognition();
    setViewState('REVIEW');
  };

  const handleResumeMic = () => {
    setViewState('LISTENING');
    isMicActiveRef.current = true;
    consecutiveQuickEndsRef.current = 0;
    startSpeechRecognition();
  };

  const updateItemQty = (dishId: string, delta: number) => {
    setRecognizedItems(prev =>
      prev
        .map(item => (item.dish._id === dishId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const removeItem = (dishId: string) => {
    setRecognizedItems(prev => prev.filter(item => item.dish._id !== dishId));
  };

  const totalAmount = recognizedItems.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);

  // Slider Drag Handlers
  const handleStartDrag = () => {
    if (isPlacingOrder || recognizedItems.length === 0) return;
    setIsDragging(true);
  };

  const handleMoveDrag = (clientX: number) => {
    if (!isDragging || isPlacingOrder || !sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const trackWidth = rect.width - 56;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, trackWidth));
    const progress = Math.min(100, Math.round((offsetX / trackWidth) * 100));
    setSliderProgress(progress);

    if (progress >= 85) {
      triggerOrderConfirmation();
    }
  };

  const handleEndDrag = () => {
    if (isPlacingOrder) return;
    setIsDragging(false);
    if (sliderProgress < 85) {
      setSliderProgress(0);
    }
  };

  const triggerOrderConfirmation = async () => {
    if (isPlacingOrder || recognizedItems.length === 0) return;
    setIsPlacingOrder(true);
    setSliderProgress(100);

    if (navigator.vibrate) {
      try { navigator.vibrate([40, 60, 40]); } catch {}
    }

    try {
      const itemsPayload = recognizedItems.map(item => ({
        dishId: item.dish._id,
        quantity: item.quantity,
      }));
      await onConfirmOrder(itemsPayload);
      onClose();
    } catch (err) {
      console.error('Order placement failed from voice modal:', err);
      setIsPlacingOrder(false);
      setSliderProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col justify-between p-3 md:p-6 text-white select-none animate-in fade-in duration-200">
      <style>{`
        @keyframes shimmerOrange {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-orange-text {
          background: linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.4) 100%);
          background-size: 200% 100%;
          animation: shimmerOrange 2.5s infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes soundWaveRippleOuter {
          0% { transform: scale(0.96); opacity: 0.35; }
          50% { transform: scale(1.12); opacity: 0.85; }
          100% { transform: scale(0.96); opacity: 0.35; }
        }
        @keyframes soundWaveRippleMiddle {
          0% { transform: scale(0.98); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 0.95; }
          100% { transform: scale(0.98); opacity: 0.5; }
        }
        @keyframes soundWaveRippleInner {
          0% { transform: scale(1); box-shadow: 0 0 25px rgba(249,115,22,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 45px rgba(249,115,22,0.75); }
          100% { transform: scale(1); box-shadow: 0 0 25px rgba(249,115,22,0.4); }
        }
        .animate-soundwave-outer {
          animation: soundWaveRippleOuter 2.4s ease-in-out infinite;
        }
        .animate-soundwave-middle {
          animation: soundWaveRippleMiddle 1.8s ease-in-out infinite;
        }
        .animate-soundwave-inner {
          animation: soundWaveRippleInner 1.4s ease-in-out infinite;
        }
        @keyframes waveBarBounce {
          0%, 100% { height: 20%; }
          50% { height: 95%; }
        }
        .animate-wave-0 { animation: waveBarBounce 0.8s ease-in-out infinite 0.1s; }
        .animate-wave-1 { animation: waveBarBounce 0.65s ease-in-out infinite 0.25s; }
        .animate-wave-2 { animation: waveBarBounce 0.9s ease-in-out infinite 0.15s; }
        .animate-wave-3 { animation: waveBarBounce 0.7s ease-in-out infinite 0.3s; }
        .animate-wave-4 { animation: waveBarBounce 0.85s ease-in-out infinite 0.2s; }
        .animate-wave-5 { animation: waveBarBounce 0.6s ease-in-out infinite 0.35s; }
        .animate-wave-6 { animation: waveBarBounce 0.95s ease-in-out infinite 0.12s; }
        .animate-wave-7 { animation: waveBarBounce 0.75s ease-in-out infinite 0.28s; }
        .animate-wave-8 { animation: waveBarBounce 0.8s ease-in-out infinite 0.18s; }
        .animate-wave-9 { animation: waveBarBounce 0.7s ease-in-out infinite 0.32s; }
      `}</style>

      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-xl mx-auto pt-1">
        <div>
          <span className="text-xs md:text-sm font-semibold tracking-wide text-gray-400">
            {tableName} Order
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {viewState === 'LISTENING' ? 'AI Voice Ordering' : 'Confirm Order'}
          </h2>
        </div>

        {/* Dynamic Top Audio Waveform */}
        <div className="flex items-center gap-[3px] h-8 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full transition-all ${
                isSpeaking
                  ? `bg-orange-400 animate-wave-${i}`
                  : 'bg-white/30 h-2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {viewState === 'LISTENING' ? (
        <div className="flex-1 flex flex-col w-full max-w-xl mx-auto my-1 md:my-2 overflow-hidden justify-between">
          {/* Central Chef Assistant with Layered Concentric Sound Waves */}
          <div className="relative flex flex-col items-center justify-center my-1 md:my-2 shrink-0">
            {/* Concentric Sound Waves Container */}
            <div className="relative flex items-center justify-center w-48 h-48 md:w-56 md:h-56">
              {/* Outer Sound Wave Circle */}
              <div
                className={`absolute inset-0 rounded-full border border-orange-500/30 bg-orange-500/5 shadow-[0_0_50px_rgba(249,115,22,0.2)] animate-soundwave-outer transition-transform ${
                  isSpeaking ? 'scale-110 border-orange-400/60' : ''
                }`}
              />
              {/* Middle Sound Wave Circle */}
              <div
                className={`absolute inset-4 md:inset-5 rounded-full border border-orange-500/50 bg-orange-500/10 shadow-[0_0_35px_rgba(249,115,22,0.3)] animate-soundwave-middle transition-transform ${
                  isSpeaking ? 'scale-108 border-orange-400/70' : ''
                }`}
              />
              {/* Inner Sound Wave Circle */}
              <div
                className={`absolute inset-9 md:inset-11 rounded-full border-2 border-orange-400/90 bg-gradient-to-br from-orange-500/35 to-amber-500/15 animate-soundwave-inner flex items-center justify-center transition-transform ${
                  isSpeaking ? 'scale-105' : ''
                }`}
              >
                {/* Circular Cream Chef Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isMicListening) {
                      handleStopMicAndReview();
                    } else {
                      setErrorMessage(null);
                      handleResumeMic();
                    }
                  }}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#FFFBF7] shadow-[0_0_40px_rgba(249,115,22,0.65)] border-2 border-orange-200 flex items-center justify-center cursor-pointer active:scale-95 transition-transform relative group z-10"
                  title={isMicListening ? "Tap to stop mic & review" : "Tap to resume mic"}
                >
                  <ChefAssistantIcon />
                  <span className="absolute -bottom-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-white/20">
                    {isMicListening ? 'Tap to Stop' : 'Tap to Resume'}
                  </span>
                </button>
              </div>
            </div>

            {/* Instruction Subtitle */}
            <p className="text-xs text-gray-300 mt-2 font-medium text-center">
              {statusMessage}
            </p>

            {/* Error Message with direct Retry button */}
            {errorMessage && (
              <div className="mt-2 p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold max-w-sm text-center flex flex-col items-center gap-1.5 shadow-lg">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    handleResumeMic();
                  }}
                  className="px-3 py-1 bg-red-500/30 hover:bg-red-500/50 border border-red-400/50 rounded-lg text-white font-bold text-[11px] active:scale-95 transition-all flex items-center gap-1"
                >
                  <Mic className="w-3 h-3 text-orange-300" />
                  Retry Microphone
                </button>
              </div>
            )}
          </div>

          {/* LIVE TYPING TEXT BOX (Words appear live as spoken) */}
          <div className={`p-3 rounded-2xl border backdrop-blur-md shadow-md my-1.5 shrink-0 transition-all ${
            isSpeaking
              ? 'bg-orange-500/15 border-orange-500/60 shadow-[0_0_25px_rgba(249,115,22,0.25)]'
              : 'bg-white/10 border-white/15'
          }`}>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-orange-300">
                <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-orange-400'}`} />
                {isSpeaking ? 'Hearing & Typing Live:' : 'Live Voice Input:'}
              </span>
              <span className="text-[11px] text-gray-400">English (India)</span>
            </div>

            <div className="text-base md:text-lg font-semibold text-white min-h-[1.75rem] flex items-center">
              {liveTranscript ? (
                <span className="tracking-wide text-orange-100">
                  &ldquo;{liveTranscript}&rdquo;
                  <span className="inline-block w-1.5 h-4 ml-1 bg-orange-400 animate-pulse align-middle" />
                </span>
              ) : (
                <span className="text-gray-400 text-sm font-normal italic">
                  Start speaking dishes (e.g. &ldquo;2 Chicken Biryani, 3 Butter Naan&rdquo;)...
                </span>
              )}
            </div>
          </div>

          {/* RECOGNIZED DISHES LIST (Always visible directly below voice box) */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-[120px]">
            <div className="flex items-center justify-between pb-1 px-1 text-xs font-bold uppercase tracking-wider text-gray-400">
              <span>Recognized Dishes ({recognizedItems.length})</span>
              {recognizedItems.length > 0 && (
                <span className="text-orange-400 font-extrabold">Total: ₹{totalAmount}</span>
              )}
            </div>

            {recognizedItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-3 border border-dashed border-white/15 rounded-2xl text-center text-gray-400 my-1 bg-white/5">
                <Utensils className="w-5 h-5 text-orange-400 mb-1" />
                <p className="text-xs font-semibold text-gray-300">Dishes will be listed here live</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Speak dish name & quantity (e.g. &ldquo;Chicken Biryani 2&rdquo;, &ldquo;Soda 2&rdquo;)
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1">
                {recognizedItems.map(({ dish, quantity }) => (
                  <div
                    key={dish._id}
                    className="flex items-center justify-between p-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={getDishImage(dish)}
                        alt={dish.name}
                        className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0 bg-neutral-800"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{dish.name}</h4>
                        <p className="text-xs text-orange-300 font-semibold">₹{dish.price} each</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-black/50 rounded-xl border border-white/20 p-0.5">
                        <button
                          type="button"
                          onClick={() => updateItemQty(dish._id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 text-white"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-white">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(dish._id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 text-white"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[48px]">
                        <span className="font-extrabold text-sm text-white">₹{dish.price * quantity}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(dish._id)}
                        className="text-gray-400 hover:text-red-400 p-1 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Review Screen (Microphone Stopped) */
        <div className="flex-1 flex flex-col w-full max-w-xl mx-auto my-2 overflow-hidden">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Microphone Stopped
              </span>
              <span className="text-xs text-orange-400 font-bold">({recognizedItems.length} items to order)</span>
            </div>

            <button
              type="button"
              onClick={handleResumeMic}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30 active:scale-95 transition-all"
            >
              <Mic className="w-3.5 h-3.5" /> Speak More Dishes
            </button>
          </div>

          {recognizedItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-2xl border border-white/10 my-4">
              <div className="w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-3">
                <ChefAssistantIcon />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">No dishes recognized</h4>
              <p className="text-sm text-gray-400 max-w-xs mb-4">
                No menu dishes were matched from speech. Tap below to speak again.
              </p>
              <button
                type="button"
                onClick={handleResumeMic}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <Mic className="w-4 h-4" /> Tap to Speak Again
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
              {recognizedItems.map(({ dish, quantity }) => (
                <div
                  key={dish._id}
                  className="flex items-center justify-between p-2.5 md:p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getDishImage(dish)}
                      alt={dish.name}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover border border-white/10 shrink-0 bg-neutral-800"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm md:text-base truncate">{dish.name}</h4>
                      <p className="text-xs text-orange-300 font-semibold mt-0.5">₹{dish.price} each</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
                    <div className="flex items-center bg-black/50 rounded-xl border border-white/20 p-0.5 md:p-1">
                      <button
                        type="button"
                        onClick={() => updateItemQty(dish._id, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 text-white"
                        title="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 md:w-7 text-center font-bold text-sm text-white">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQty(dish._id, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 active:scale-95 text-white"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[50px] md:min-w-[55px]">
                      <span className="font-extrabold text-sm md:text-base text-white">₹{dish.price * quantity}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(dish._id)}
                      className="text-gray-400 hover:text-red-400 p-1 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recognizedItems.length > 0 && (
            <div className="pt-2 pb-1 flex justify-between items-center text-sm md:text-base font-semibold border-t border-white/15 text-gray-300 px-1">
              <span>Total Amount ({recognizedItems.reduce((a, b) => a + b.quantity, 0)} items)</span>
              <span className="text-lg md:text-xl font-black text-orange-400">₹{totalAmount}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Actions & Slider */}
      <div className="w-full max-w-xl mx-auto pt-2">
        {viewState === 'LISTENING' ? (
          /* While Listening: ALWAYS show Cancel and Stop Mic buttons */
          <div className="flex items-center justify-center gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                cleanupSpeechRecognition();
                onClose();
              }}
              className="px-6 py-3 rounded-full bg-[#232326] hover:bg-[#2e2e33] active:scale-95 text-white font-medium text-sm transition-all border border-white/10 shadow-lg shrink-0"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleStopMicAndReview}
              className="flex-1 max-w-xs px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-sm md:text-base shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 transition-all border border-orange-400/40"
            >
              <MicOff className="w-5 h-5 shrink-0" />
              <span className="truncate">
                {recognizedItems.length > 0 ? `Stop Mic (${recognizedItems.length}) & Review` : 'Stop Mic & Review'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        ) : (
          /* While in Review: iPhone Slider to Confirm */
          <div className="space-y-2">
            {recognizedItems.length > 0 ? (
              <div
                ref={sliderTrackRef}
                onMouseDown={e => { handleStartDrag(); handleMoveDrag(e.clientX); }}
                onMouseMove={e => isDragging && handleMoveDrag(e.clientX)}
                onMouseUp={handleEndDrag}
                onMouseLeave={handleEndDrag}
                onTouchStart={e => { handleStartDrag(); if (e.touches && e.touches[0]) handleMoveDrag(e.touches[0].clientX); }}
                onTouchMove={e => isDragging && e.touches && e.touches[0] && handleMoveDrag(e.touches[0].clientX)}
                onTouchEnd={handleEndDrag}
                className="relative h-14 md:h-16 w-full rounded-full bg-neutral-900 border border-orange-500/40 p-1 select-none overflow-hidden flex items-center shadow-2xl touch-none cursor-pointer"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-600 to-amber-500 rounded-full transition-all duration-75 opacity-90"
                  style={{ width: `${Math.max(15, sliderProgress)}%` }}
                />

                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs md:text-sm font-bold tracking-wider uppercase transition-opacity duration-150"
                  style={{ opacity: Math.max(0, 1 - sliderProgress / 60) }}
                >
                  <span className="shimmer-orange-text flex items-center gap-1.5">
                    Slide to Send to Kitchen <ArrowRight className="w-4 h-4 inline animate-pulse" />
                  </span>
                </div>

                <div
                  className="absolute top-1 bottom-1 w-12 md:w-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-[0_2px_12px_rgba(249,115,22,0.6)] cursor-grab active:cursor-grabbing z-10 transition-transform active:scale-105 pointer-events-none"
                  style={{
                    left: `calc(${sliderProgress}% * ${(sliderTrackRef.current?.clientWidth ? (sliderTrackRef.current.clientWidth - 56) / sliderTrackRef.current.clientWidth : 0.85)})`,
                  }}
                >
                  {isPlacingOrder ? (
                    <Check className="w-6 h-6 animate-bounce text-white" />
                  ) : (
                    <ArrowRight className="w-6 h-6 text-white stroke-[2.5]" />
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between px-2 text-xs text-gray-400">
              <button
                type="button"
                onClick={handleResumeMic}
                className="hover:text-white flex items-center gap-1 font-medium"
              >
                <Mic className="w-3.5 h-3.5 text-orange-400" /> Speak More Dishes
              </button>

              <button
                type="button"
                onClick={() => {
                  cleanupSpeechRecognition();
                  onClose();
                }}
                className="hover:text-red-400 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
