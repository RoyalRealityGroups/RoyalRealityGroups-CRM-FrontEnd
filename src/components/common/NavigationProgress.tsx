import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router-dom';
import { LinearProgress, Box } from '@mui/material';

export const NavigationProgress = () => {
  const navigation = useNavigation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (navigation.state === 'loading') {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [navigation.state]);

  if (!show) return null;

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      <LinearProgress />
    </Box>
  );
};
