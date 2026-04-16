import { useState, useEffect, useCallback, useRef } from 'react';

// Handle browser polyfills for window.SpeechRecognition
const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [supported] = useState(!!SpeechRecognitionAPI);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const optionsRef = useRef(options);

  // Keep options ref updated to avoid re-binding on every option change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!supported) return;

    const recognition = new SpeechRecognitionAPI();
    
    // We recreate it when we explicitly start, but we set it up here as the base object
    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = true;
    
    // Default to US English if not provided, but allow dynamic switching
    // Note: To change language mid-flight, Web Speech API requires stopping and restarting
    recognition.lang = options.language || 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setTranscript(() => {
        // If continuous is false, just show the current chunk.
        // If true, we might want to append, but for our Voice Entry use case,
        // we just want to replace the current text buffer while speaking so it doesn't duplicate loops.
        return finalTranscript || interimTranscript;
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      // 'no-speech' is common and not really a fatal error, just stop listening
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [supported, options.language, options.continuous]);

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    setError(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      console.error('Failed to start recognition (it might already be running)', e);
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error('Failed to stop recognition', e);
    }
    setListening(false);
  }, [supported]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    supported,
    error,
  };
}
