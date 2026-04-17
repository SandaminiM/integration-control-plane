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

import { Box, Button } from '@wso2/oxygen-ui';
import { ExternalLink } from '@wso2/oxygen-ui-icons-react';
import React, { type JSX } from 'react';

export interface IDEMockupProps {
  isHovered?: boolean;
  onOpenClick?: () => void;
}

export default function IDEMockup({ isHovered, onOpenClick }: IDEMockupProps): JSX.Element {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        fontFamily: 'monospace',
        position: 'relative',
      }}>
      {/* Title bar */}
      <Box
        sx={{
          height: 20,
          bgcolor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          px: 1,
          flexShrink: 0,
        }}>
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'action.disabled', border: '1px solid', borderColor: 'divider' }} />
          ))}
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: 128, height: 8, bgcolor: 'action.selected', borderRadius: 0.5 }} />
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Activity bar */}
        <Box
          sx={{
            width: 24,
            bgcolor: 'action.hover',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 2,
            gap: 1.5,
            flexShrink: 0,
          }}>
          <Box sx={{ width: 20, height: 20, borderRadius: 0.5, bgcolor: 'action.selected' }} />
          <Box sx={{ width: 20, height: 20, borderRadius: 0.5, bgcolor: 'primary.main' }} />
          <Box sx={{ width: 20, height: 20, borderRadius: 0.5, bgcolor: 'action.selected' }} />
        </Box>

        {/* Canvas area with dot-grid */}
        <Box
          sx={{
            flex: 1,
            bgcolor: 'background.paper',
            backgroundImage: (theme) => `radial-gradient(${theme.palette.divider} 1.5px, transparent 1.5px)`,
            backgroundSize: '20px 20px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 2,
            overflow: 'hidden',
          }}>
          {/* Top toolbar skeleton */}
          <Box sx={{ position: 'absolute', top: 8, left: 16, display: 'flex', gap: 1 }}>
            <Box sx={{ width: 48, height: 6, bgcolor: 'action.selected', borderRadius: 0.5 }} />
            <Box sx={{ width: 32, height: 6, bgcolor: 'action.selected', borderRadius: 0.5 }} />
          </Box>

          {/* Flow diagram */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              zIndex: 10,
              width: '100%',
              transform: 'scale(0.9)',
              transformOrigin: 'top',
            }}>
            {/* Start node */}
            <Box
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                p: 1,
                fontSize: 10,
                fontWeight: 500,
                color: 'text.secondary',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                zIndex: 10,
                position: 'relative',
              }}>
              Start
            </Box>

            {/* Connector */}
            <Box sx={{ width: '2px', height: 24, bgcolor: 'divider' }} />

            {/* Action node */}
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  width: 192,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 1,
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'text.secondary',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  zIndex: 10,
                  position: 'relative',
                }}>
                <Box sx={{ bgcolor: 'action.hover', p: 0.75, borderRadius: 0.5, color: 'text.secondary' }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: 'text.disabled', borderRadius: 0.25 }} />
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ width: 80, height: 6, bgcolor: 'action.selected', borderRadius: 0.5 }} />
                  <Box sx={{ width: 48, height: 6, bgcolor: 'action.hover', borderRadius: 0.5 }} />
                </Box>
                <Box sx={{ width: 12, height: 12, bgcolor: 'text.disabled', borderRadius: 0.25 }} />
              </Box>

              {/* Side connector */}
              <Box sx={{ position: 'absolute', top: '50%', right: -42, transform: 'translateY(-50%)' }}>
                <Box sx={{ width: 48, height: '2px', bgcolor: 'divider' }} />
                <Box
                  sx={{
                    position: 'absolute',
                    right: -42,
                    mt: '-21px',
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Box sx={{ width: 15, height: 15, bgcolor: 'primary.main', borderRadius: '5px' }} />
                </Box>
              </Box>
            </Box>

            {/* Connector */}
            <Box sx={{ width: '2px', height: 24, bgcolor: 'divider' }} />

            {/* Decision node (diamond) */}
            <Box
              sx={{
                width: 36,
                height: 36,
                transform: 'rotate(45deg)',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Box sx={{ width: 12, height: 12, bgcolor: 'text.disabled', borderRadius: 0.25, transform: 'rotate(-45deg)' }} />
            </Box>

            {/* Connector */}
            <Box sx={{ width: '2px', height: 24, bgcolor: 'divider' }} />

            {/* Add placeholder */}
            <Box
              sx={{
                width: 192,
                height: 40,
                border: '2px dashed',
                borderColor: 'primary.main',
                bgcolor: 'primary.main',
                opacity: 0.1,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Hover overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: 1,
          background: (theme) => (isHovered ? (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.27)') : 'transparent'),
          backdropFilter: isHovered ? 'blur(4px)' : 'blur(0px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isHovered ? 'auto' : 'none',
          zIndex: 30,
        }}>
        <Box
          sx={{
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ExternalLink size={16} />}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onOpenClick?.();
            }}>
            Open Cloud Editor
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
