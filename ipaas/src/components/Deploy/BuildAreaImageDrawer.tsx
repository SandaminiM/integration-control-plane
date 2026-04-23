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

import { Box, Button, CircularProgress, Divider, Drawer, IconButton, Stack, Typography } from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import type { GqlDeploymentTrackImage } from '../../api/queries';
import BuildImageCard from './BuildImageCard';

interface BuildAreaImageDrawerProps {
  open: boolean;
  onClose: () => void;
  images: GqlDeploymentTrackImage[];
  isLoading: boolean;
  selectedImageId: string | null;
  onSelect: (image: GqlDeploymentTrackImage) => void;
}

export default function BuildAreaImageDrawer({
  open,
  onClose,
  images,
  isLoading,
  selectedImageId,
  onSelect,
}: BuildAreaImageDrawerProps): JSX.Element {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 440 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6">Select Image</Typography>
        <IconButton size="small" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!isLoading && images.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No images available. Trigger a build from the Build page first.
            </Typography>
          </Box>
        )}

        <Stack gap={1.5}>
          {!isLoading && images.map((image, index) => (
            <BuildImageCard
              key={image.imageId}
              image={image}
              isLatest={index === 0}
              variant="selectable"
              isSelected={image.imageId === selectedImageId}
              onSelect={() => { onSelect(image); onClose(); }}
            />
          ))}
        </Stack>
      </Box>

      <Divider />
      <Box sx={{ px: 2, py: 1.5 }}>
        <Button variant="outlined" size="small" fullWidth onClick={onClose}>
          Close
        </Button>
      </Box>
    </Drawer>
  );
}
