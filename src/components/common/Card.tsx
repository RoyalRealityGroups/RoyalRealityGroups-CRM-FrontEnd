import React from 'react';
import { Card as MuiCard } from '@mui/material';
import type { CardProps } from '@mui/material';

const Card: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <MuiCard
      {...props}
      sx={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 2,
        ...props.sx,
      }}
    >
      {children}
    </MuiCard>
  );
};

export default Card;
