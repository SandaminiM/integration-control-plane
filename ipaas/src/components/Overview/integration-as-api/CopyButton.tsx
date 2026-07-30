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

import { Button } from '@wso2/oxygen-ui';
import { Check, Copy } from '@wso2/oxygen-ui-icons-react';
import { useState, type JSX } from 'react';
import * as styles from './apiConsumption.styles';

interface CopyButtonProps {
  /** Value written to the clipboard. */
  value: string;
  label?: string;
}

/** Copy-to-clipboard button that flips to a "Copied" state for ~1.4s. */
export default function CopyButton({ value, label = 'Copy' }: CopyButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  // Confirm only after the write resolves: an unavailable clipboard (insecure
  // context) or a denied permission must not read as a successful copy.
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Button size="small" variant="outlined" onClick={() => void copy()} startIcon={copied ? <Check size={13} /> : <Copy size={13} />} sx={styles.copyButton}>
      {copied ? 'Copied' : label}
    </Button>
  );
}
