'use client';

/**
 * useAIGeneration — hook for AI floor plan generation.
 *
 * New response format from backend:
 *   { success, image_base64, layout, prompt_used, model_used, generation_time_ms, cached }
 *
 * Frontend caching: sessionStorage keyed by MD5-like hash of formData.
 * Prevents redundant API calls for the same input within a session.
 */

import { useState, useCallback, useRef } from 'react';

const API_URL  = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const ENDPOINT = `${API_URL}/api/ai-floor-plan/generate`;

export const LOADING_MESSAGES = [
  'Sending requirements to Llama 3…',
  'AI is planning your layout…',
  'Generating room positions…',
  'Building Stable Diffusion prompt…',
  'Rendering blueprint image…',
  'Applying architectural style…',
  'Almost ready…',
];

// ── Simple client-side cache key ──────────────────────────────
function cacheKey(formData) {
  return 'fp_' + JSON.stringify(formData).split('').reduce((a, c) => {
    const h = ((a << 5) - a) + c.charCodeAt(0);
    return h & h;
  }, 0);
}

function sessionGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function sessionSet(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Main hook ────────────────────────────────────────────────
export function useAIGeneration() {
  const [isLoading,      setIsLoading]      = useState(false);
  const [error,          setError]          = useState(null);
  const [generatedPlan,  setGeneratedPlan]  = useState(null);  // full API response
  const [generationTime, setGenerationTime] = useState(null);
  const [msgIndex,       setMsgIndex]       = useState(0);

  const msgIntervalRef = useRef(null);

  const startMsgCycle = useCallback(() => {
    setMsgIndex(0);
    if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    msgIntervalRef.current = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
  }, []);

  const stopMsgCycle = useCallback(() => {
    if (msgIntervalRef.current) {
      clearInterval(msgIntervalRef.current);
      msgIntervalRef.current = null;
    }
  }, []);

  // ── Generate ──────────────────────────────────────────────
  const generateFloorPlan = useCallback(async (formData) => {
    setIsLoading(true);
    setError(null);
    setGeneratedPlan(null);
    setGenerationTime(null);
    startMsgCycle();

    // Check sessionStorage cache first
    const ck     = cacheKey(formData);
    const cached = sessionGet(ck);
    if (cached) {
      setGeneratedPlan(cached);
      setGenerationTime(cached.generation_time_ms ?? null);
      setIsLoading(false);
      stopMsgCycle();
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 180_000); // 3 min for SD

      let res;
      try {
        res = await fetch(ENDPOINT, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(formData),
          signal:  controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = data?.detail || `Server error ${res.status}`;
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }

      if (!data.success || !data.image_base64) {
        throw new Error('Backend returned success=false or empty image.');
      }

      setGeneratedPlan(data);
      setGenerationTime(data.generation_time_ms ?? null);

      // Save to sessionStorage cache
      sessionSet(ck, data);

    } catch (err) {
      const msg = err.name === 'AbortError'
        ? 'Request timed out (3 min). Stable Diffusion may still be warming up — please try again.'
        : (err.message || 'Unknown error occurred.');
      setError(msg);
    } finally {
      setIsLoading(false);
      stopMsgCycle();
    }
  }, [startMsgCycle, stopMsgCycle]);

  // ── Reset ────────────────────────────────────────────────
  const resetGeneration = useCallback(() => {
    stopMsgCycle();
    setIsLoading(false);
    setError(null);
    setGeneratedPlan(null);
    setGenerationTime(null);
    setMsgIndex(0);
  }, [stopMsgCycle]);

  return {
    isLoading,
    error,
    generatedPlan,       // { success, image_base64, layout, prompt_used, model_used, generation_time_ms, cached }
    generationTime,
    loadingMessage: LOADING_MESSAGES[msgIndex],
    generateFloorPlan,
    resetGeneration,
  };
}
