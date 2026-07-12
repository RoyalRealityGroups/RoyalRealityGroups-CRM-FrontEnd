import React from 'react';
import { TextField as MuiTextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

const TextField: React.FC<TextFieldProps> = (props) => {
  return (
    <MuiTextField
      fullWidth
      variant="outlined"
      size="small"
      {...props}
    />
  );
};

export default TextField;
