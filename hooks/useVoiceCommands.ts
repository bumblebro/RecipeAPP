import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import * as Haptics from 'expo-haptics';

// ─── Types ───────────────────────────────────────────────────────────────────

export type VoiceMode = 'idle' | 'activeListening' | 'ttsMuted';

interface VoiceCommand {
  triggers: string[];
  action: () => void;
}

interface UseVoiceCommandsOptions {
  /** Whether the voice feature is enabled in settings */
  enabled: boolean;
  /** Whether microphone permission has been granted */
  permissionGranted: boolean;
  /** Whether TTS audio is currently playing — mic will be muted when true */
  isTTSSpeaking: boolean;
  /** Command definitions: each has trigger phrases and an action callback */
  commands: VoiceCommand[];
  /**
   * Optional regex-based commands (e.g., "step 3").
   * Return true if the command was handled.
   */
  regexCommands?: Array<{
    pattern: RegExp;
    action: (match: RegExpMatchArray) => boolean;
  }>;
}

interface UseVoiceCommandsReturn {
  voiceMode: VoiceMode;
  isListening: boolean;
  partialTranscript: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WAKE_WORD = 'hey chef';
const ACTIVE_LISTENING_TIMEOUT_MS = 5000;
const RESTART_DELAY_MS = 300;
const COMMAND_COOLDOWN_MS = 1500;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useVoiceCommands({
  enabled,
  permissionGranted,
  isTTSSpeaking,
  commands,
  regexCommands,
}: UseVoiceCommandsOptions): UseVoiceCommandsReturn {
  // ── State ──────────────────────────────────────────────────────────────────
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('idle');
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');

  // ── Refs (stable across renders) ───────────────────────────────────────────
  const voiceModeRef = useRef<VoiceMode>('idle');
  const isTTSSpeakingRef = useRef(isTTSSpeaking);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false); // New: prevents concurrent stop deadlocks
  const isListeningRef = useRef(false); // New: robust tracking of engine state
  const isTransitioningRef = useRef(false); // Prevents onSpeechEnd race condition
  const activeListeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommandTimeRef = useRef(0);
  const commandsRef = useRef(commands);
  const regexCommandsRef = useRef(regexCommands);
  const enabledRef = useRef(enabled);
  const permissionRef = useRef(permissionGranted);

  // Keep refs in sync
  useEffect(() => { isTTSSpeakingRef.current = isTTSSpeaking; }, [isTTSSpeaking]);
  useEffect(() => { commandsRef.current = commands; }, [commands]);
  useEffect(() => { regexCommandsRef.current = regexCommands; }, [regexCommands]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { permissionRef.current = permissionGranted; }, [permissionGranted]);

  // ── Helper: update mode in both state + ref ────────────────────────────────
  const setMode = useCallback((mode: VoiceMode) => {
    voiceModeRef.current = mode;
    setVoiceMode(mode);
  }, []);

  // ── Helper: clear active listening timer ───────────────────────────────────
  const clearActiveTimer = useCallback(() => {
    if (activeListeningTimerRef.current) {
      clearTimeout(activeListeningTimerRef.current);
      activeListeningTimerRef.current = null;
    }
  }, []);

  // ── Core: start voice recognition ─────────────────────────────────────────
  const startVoice = useCallback(async () => {
    if (isStartingRef.current || isListeningRef.current || isStoppingRef.current) {
      console.log('[VoiceCmd] Skip start: isStarting=', isStartingRef.current, 'isListening=', isListeningRef.current, 'isStopping=', isStoppingRef.current);
      return;
    }
    if (isTTSSpeakingRef.current) return;
    if (!enabledRef.current || !permissionRef.current) return;

    try {
      isStartingRef.current = true;
      console.log('[VoiceCmd] Starting recognizer native session...');

      // Final check — TTS may have started during the wait
      if (isTTSSpeakingRef.current) {
        console.log('[VoiceCmd] Abort start: TTS speaking');
        return;
      }

      await Voice.start('en-US');
    } catch (e: any) {
      if (!e?.message?.includes('already started')) {
        console.log('[VoiceCmd] Voice.start error:', e);
      }
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  // ── Core: stop voice recognition ───────────────────────────────────────────
  const stopVoice = useCallback(async () => {
    if (isStoppingRef.current || !isListeningRef.current) return;
    
    try {
      isStoppingRef.current = true;
      console.log('[VoiceCmd] Stopping recognizer...');
      await Voice.stop();
    } catch { } finally {
      setIsListening(false);
      isListeningRef.current = false;
      isStoppingRef.current = false;
    }
  }, []);

  // ── Core: transition to idle (wake word listening) ─────────────────────────
  const transitionToIdle = useCallback(async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    clearActiveTimer();
    setPartialTranscript('');
    setMode('idle');
    console.log('[VoiceCmd] Transition -> idle (wake word)');

    // Ensure engine is stopped before restarting for wake word
    await stopVoice();

    setTimeout(() => {
      isTransitioningRef.current = false;
      if (!isTTSSpeakingRef.current && enabledRef.current && voiceModeRef.current === 'idle') {
        startVoice();
      }
    }, RESTART_DELAY_MS + 300); // 600ms total buffer
  }, [clearActiveTimer, setMode, startVoice, stopVoice]);

  // ── Core: transition to active listening (after wake word) ─────────────────
  const transitionToActiveListening = useCallback(async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    clearActiveTimer();
    setPartialTranscript('');
    setMode('activeListening');
    console.log('[VoiceCmd] Transition -> activeListening (5s)');

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Stop current recognition cleanly to start fresh for command
    await stopVoice();

    setTimeout(() => {
      isTransitioningRef.current = false;
      if (!isTTSSpeakingRef.current && voiceModeRef.current === 'activeListening') {
        startVoice();
      }
    }, 400);

    activeListeningTimerRef.current = setTimeout(() => {
      console.log('[VoiceCmd] Active window timed out');
      transitionToIdle();
    }, ACTIVE_LISTENING_TIMEOUT_MS);
  }, [clearActiveTimer, setMode, startVoice, transitionToIdle, stopVoice]);

  // ── Core: transition to TTS muted ─────────────────────────────────────────
  const transitionToTTSMuted = useCallback(async () => {
    clearActiveTimer();
    setMode('ttsMuted');
    setPartialTranscript('');
    await stopVoice();
    console.log('[VoiceCmd] State -> ttsMuted');
  }, [clearActiveTimer, setMode, stopVoice]);

  // ── Command matching ──────────────────────────────────────────────────────
  const tryMatchCommand = useCallback((transcript: string): boolean => {
    const text = transcript.toLowerCase().trim();
    if (!text) return false;

    const now = Date.now();
    if (now - lastCommandTimeRef.current < COMMAND_COOLDOWN_MS) return false;

    console.log('[VoiceCmd] Matching against:', text);

    // 1. Regex commands
    const regexCmds = regexCommandsRef.current;
    if (regexCmds) {
      for (const { pattern, action } of regexCmds) {
        const match = text.match(pattern);
        if (match) {
          if (action(match)) {
            lastCommandTimeRef.current = now;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return true;
          }
        }
      }
    }

    // 2. Substring triggers
    const cmds = commandsRef.current;
    for (const cmd of cmds) {
      if (cmd.triggers.some(trigger => text.includes(trigger))) {
        lastCommandTimeRef.current = now;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        cmd.action();
        return true;
      }
    }
    return false;
  }, []);

  // ── Handle speech results ─────────────────────────────────────────────────
  const handleSpeechResult = useCallback((transcript: string) => {
    const mode = voiceModeRef.current;
    const text = transcript.toLowerCase().trim();

    if (mode === 'idle') {
      const wakeWords = ['chef', 'hey', 'hi', 'hello', 'hay', 'shef', 'jeff', 'hey chef', 'hi chef'];
      if (wakeWords.some(w => text.includes(w))) {
        console.log('[VoiceCmd] Wake word triggered by:', text);
        transitionToActiveListening();
      }
    } else if (mode === 'activeListening') {
      if (tryMatchCommand(transcript)) {
        stopVoice().then(() => {
          setTimeout(() => {
            // Guard: if a command triggered TTS (like "Repeat"), 
            // the TTS effect will have already transitioned us to ttsMuted.
            // Don't override it back to idle.
            if (voiceModeRef.current !== 'ttsMuted' && !isTTSSpeakingRef.current) {
              transitionToIdle();
            } else {
              console.log('[VoiceCmd] Skipping idle transition: TTS active');
            }
          }, 500);
        });
      }
    }
  }, [transitionToActiveListening, tryMatchCommand, stopVoice, transitionToIdle]);

  // ── Effect: React to TTS speaking state changes ────────────────────────────
  useEffect(() => {
    isTTSSpeakingRef.current = isTTSSpeaking;
    if (!enabled || !permissionGranted) return;

    if (isTTSSpeaking) {
      transitionToTTSMuted();
    } else if (voiceModeRef.current === 'ttsMuted') {
      console.log('[VoiceCmd] TTS done, returning to idle');
      setTimeout(() => {
        if (!isTTSSpeakingRef.current) {
          transitionToIdle();
        }
      }, RESTART_DELAY_MS);
    }
  }, [isTTSSpeaking, enabled, permissionGranted, transitionToTTSMuted, transitionToIdle]);

  // ── Effect: Set up Voice listeners & initial start ─────────────────────────
  useEffect(() => {
    if (!enabled || !permissionGranted) {
      console.log('[VoiceCmd] Hook disabled (enabled:', enabled, 'perm:', permissionGranted, ')');
      stopVoice();
      setMode('idle');
      return;
    }

    console.log('[VoiceCmd] Initializing hook listeners & AudioSession...');

    // One-time setup for the current enabled session
    if (Platform.OS === 'ios') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      }).catch(err => console.log('[VoiceCmd] Audio mode error:', err));
    }


    Voice.onSpeechStart = () => {
      console.log('[VoiceCmd] Listening active');
      setIsListening(true);
      isListeningRef.current = true;
    };

    Voice.onSpeechEnd = () => {
      console.log('[VoiceCmd] Listening end (onSpeechEnd)');
      setIsListening(false);
      isListeningRef.current = false;

      // Only auto-restart if we aren't currently in the middle of a manual transition
      if (isTransitioningRef.current) {
        console.log('[VoiceCmd] Skip end-restart: transition in progress');
        return;
      }

      const mode = voiceModeRef.current;
      if (mode === 'idle' && !isTTSSpeakingRef.current && enabledRef.current) {
        setTimeout(() => startVoice(), 500);
      }
      if (mode === 'activeListening' && !isTTSSpeakingRef.current) {
        setTimeout(() => startVoice(), 300);
      }
    };

    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      if (e.error?.message !== 'Speech recognition already started!') {
        console.log('[VoiceCmd] Error:', e.error);
      }
      setIsListening(false);
      isListeningRef.current = false;

      const mode = voiceModeRef.current;
      if ((mode === 'idle' || mode === 'activeListening') && !isTTSSpeakingRef.current && enabledRef.current) {
        setTimeout(() => startVoice(), 1000);
      }
    };

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        console.log('[VoiceCmd] Results:', text);
        handleSpeechResult(text);
      }
    };

    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        console.log('[VoiceCmd] Partial:', text);
        setPartialTranscript(text);
        handleSpeechResult(text);
      }
    };

    // Initial start (idle / wake word mode)
    if (!isTTSSpeakingRef.current) {
      setMode('idle');
      startVoice();
    } else {
      setMode('ttsMuted');
    }

    return () => {
      clearActiveTimer();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [enabled, permissionGranted]); // Only re-run when enabled/permission changes

  return {
    voiceMode,
    isListening,
    partialTranscript,
  };
}
