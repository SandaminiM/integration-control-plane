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

import { Box, Button, Card, CardContent, Tooltip } from '@wso2/oxygen-ui';
import { Send } from '@wso2/oxygen-ui-icons-react';
import { useRef, useState } from 'react';
import type { JSX } from 'react';
import { AI_PROMPT_PLACEHOLDER, CHIPS_PER_PAGE, CHIPS_ROTATE_INTERVAL_MS, EXAMPLE_PROMPTS } from '../../constants/aiBuilder';
import { useRotatingPage, useTypingPlaceholder } from './useTypingPlaceholder';
import { EXAMPLE_CHIP_SX, PROMPT_TEXTAREA_STYLE, landingCardSx } from './AiBuilderLandingCard.styles';

const TOTAL_CHIP_PAGES = Math.ceil(EXAMPLE_PROMPTS.length / CHIPS_PER_PAGE);

export function AiBuilderLandingCard({ onStartPlanning }: { onStartPlanning: (query: string) => void }): JSX.Element {
  const [chatInput, setChatInput] = useState('');
  const [isChatFocused, setIsChatFocused] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const idle = !isChatFocused && !chatInput;
  const typingText = useTypingPlaceholder(AI_PROMPT_PLACEHOLDER, idle);
  const chipPage = useRotatingPage(TOTAL_CHIP_PAGES, idle, CHIPS_ROTATE_INTERVAL_MS);
  const visibleChips = EXAMPLE_PROMPTS.slice(chipPage * CHIPS_PER_PAGE, chipPage * CHIPS_PER_PAGE + CHIPS_PER_PAGE);

  const submit = () => {
    if (chatInput.trim()) {
      onStartPlanning(chatInput);
      setChatInput('');
    }
  };

  return (
    <Card sx={landingCardSx(isChatFocused)}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', p: 2.5, height: '100%', '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
          <textarea
            ref={textAreaRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onFocus={() => setIsChatFocused(true)}
            onBlur={() => setIsChatFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={isChatFocused || chatInput ? '' : typingText}
            aria-label="Describe your integration scenario"
            style={PROMPT_TEXTAREA_STYLE}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {visibleChips.map((prompt) => (
              <Tooltip key={prompt.short} title={prompt.short} placement="top">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setChatInput(prompt.full);
                    textAreaRef.current?.focus();
                  }}
                  sx={EXAMPLE_CHIP_SX}>
                  {prompt.short}
                </Button>
              </Tooltip>
            ))}
          </Box>

          <Button variant="contained" color="primary" endIcon={<Send size={16} />} disabled={!chatInput.trim()} onClick={submit} sx={{ flexShrink: 0 }}>
            Start planning
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
