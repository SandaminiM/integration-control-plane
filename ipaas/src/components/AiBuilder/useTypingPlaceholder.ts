/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { useEffect, useState } from 'react';

const TYPE_FORWARD_MS = 85;
const TYPE_BACK_MS = 40;
const PAUSE_AFTER_TYPING_MS = 1800;

/** Typewriter effect that types `text` out then deletes it, looping while `active`. */
export function useTypingPlaceholder(text: string, active: boolean): string {
  const [typingText, setTypingText] = useState('');
  const [index, setIndex] = useState(0);
  const [forward, setForward] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!active) {
      setTypingText('');
      setIndex(0);
      setForward(true);
      setPaused(false);
      return;
    }
    if (paused) {
      const timer = setTimeout(() => {
        setPaused(false);
        setForward(false);
      }, PAUSE_AFTER_TYPING_MS);
      return () => clearTimeout(timer);
    }
    if (forward) {
      if (index < text.length) {
        const timer = setTimeout(() => {
          setTypingText(text.slice(0, index + 1));
          setIndex((prev) => prev + 1);
        }, TYPE_FORWARD_MS);
        return () => clearTimeout(timer);
      }
      setPaused(true);
      return;
    }
    if (index > 0) {
      const timer = setTimeout(() => {
        setTypingText(text.slice(0, index - 1));
        setIndex((prev) => prev - 1);
      }, TYPE_BACK_MS);
      return () => clearTimeout(timer);
    }
    setForward(true);
  }, [index, forward, active, paused, text]);

  return typingText;
}

/** Advances through `pageCount` pages on an interval while `active`. */
export function useRotatingPage(pageCount: number, active: boolean, intervalMs: number): number {
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!active || pageCount <= 1) return;
    const interval = setInterval(() => setPage((prev) => (prev + 1) % pageCount), intervalMs);
    return () => clearInterval(interval);
  }, [active, pageCount, intervalMs]);

  return page;
}
