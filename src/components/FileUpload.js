import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import ClearIcon from '@mui/icons-material/Clear';

function FileUpload({ 
  files = [], 
  onFileSelect = () => {}, 
  onFileRemove = () => {}, 
  disabled = false 
}) {
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    onFileSelect(selectedFiles);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="image-upload"
        type="file"
        multiple
        onChange={handleFileSelect}
        disabled={disabled}
      />
      <label htmlFor="image-upload">
        <IconButton
          color="primary"
          component="span"
          disabled={disabled}
        >
          <ImageIcon />
        </IconButton>
      </label>
      
      {files?.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            {files.length} image{files.length !== 1 ? 's' : ''} selected
          </Typography>
          <IconButton
            size="small"
            onClick={onFileRemove}
            disabled={disabled}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export default FileUpload;
