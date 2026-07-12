import { Box, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Chip } from '@mui/material';
import { CheckCircle, Cancel, HourglassEmpty, Person } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { authorizationApi } from '../../api/authorization.api';
import { formatDate, formatTime } from '../../utils/format';

interface AuthorizationHistoryProps {
  modelPath: string;
  instanceId: string;
}

export default function AuthorizationHistory({ modelPath, instanceId }: AuthorizationHistoryProps) {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['authorizationHistory', modelPath, instanceId],
    queryFn: () => authorizationApi.getHistory(modelPath, instanceId),
  });

  const historyList = Array.isArray(history) ? history : (history as any)?.results || [];
  
  // Separate Level 0 (document creation) from authorization levels
  const creationEntry = historyList.find((item: any) => item.authorized_level === 0);
  const rawAuthorizationEntries = historyList.filter((item: any) => item.authorized_level !== 0);

  // Deduplicate: keep only the latest entry per authorized_level
  const authorizationEntries = Object.values(
    rawAuthorizationEntries.reduce((acc: Record<number, any>, item: any) => {
      const level = item.authorized_level;
      if (!acc[level] || new Date(item.authorized_on) > new Date(acc[level].authorized_on)) {
        acc[level] = item;
      }
      return acc;
    }, {} as Record<number, any>)
  ).sort((a: any, b: any) => a.authorized_level - b.authorized_level);

  if (isLoading) return <Typography>Loading history...</Typography>;
  if (error) return <Typography color="error">Error loading authorization history</Typography>;
  if (!historyList || historyList.length === 0) {
    return <Typography color="text.secondary">No authorization history</Typography>;
  }
  
  if (!creationEntry && authorizationEntries.length === 0) {
    return <Typography color="text.secondary">No authorization history</Typography>;
  }

  const getStatusIcon = (status: 1 | 2 | 3) => {
    switch (status) {
      case 1: return <HourglassEmpty />;
      case 2: return <CheckCircle />;
      case 3: return <Cancel />;
    }
  };

  const getStatusColor = (status: 1 | 2 | 3) => {
    switch (status) {
      case 1: return 'warning';
      case 2: return 'success';
      case 3: return 'error';
    }
  };

  const getStatusText = (status: 1 | 2 | 3) => {
    switch (status) {
      case 1: return 'Pending';
      case 2: return 'Approved';
      case 3: return 'Rejected';
    }
  };

  const autoApprovedLevels = authorizationEntries
    .filter((item: any) => String(item.description || '').toLowerCase().includes('auto-approved'))
    .map((item: any) => item.authorized_level)
    .filter((level: any) => typeof level === 'number');
  const autoApprovedLevel = autoApprovedLevels.length ? Math.max(...autoApprovedLevels) : null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6">Authorization History</Typography>
          {autoApprovedLevel ? (
            <Chip
              label={`Auto-approved to L${autoApprovedLevel}`}
              color="success"
              size="small"
              variant="outlined"
            />
          ) : null}
        </Box>
        <List>
          {/* Document Creation Entry */}
          {creationEntry && (
            <Box>
              <ListItem alignItems="flex-start">
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  <Person />
                </ListItemIcon>
                <ListItemText
                  primary="Document created by"
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.secondary">
                        {creationEntry.authorized_by?.fullname || creationEntry.authorized_by_identifier || 'Unknown'}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {formatDate(creationEntry.authorized_on)} {formatTime(creationEntry.authorized_on)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {authorizationEntries.length > 0 && <Divider />}
            </Box>
          )}
          
          {/* Authorization Levels */}
          {authorizationEntries.map((item: any, index: number) => (
            <Box key={item.id}>
              <ListItem alignItems="flex-start">
                <ListItemIcon sx={{ color: `${getStatusColor(item.authorized_status)}.main` }}>
                  {getStatusIcon(item.authorized_status)}
                </ListItemIcon>
                <ListItemText
                  primary={`Level ${item.authorized_level} - ${getStatusText(item.authorized_status)}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.secondary">
                        By: {item.authorized_by?.fullname || item.authorized_by_identifier || 'Unknown'} {item.authorized_by_type ? `(${item.authorized_by_type})` : ''}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {formatDate(item.authorized_on)} {formatTime(item.authorized_on)}
                      </Typography>
                      {item.description && (
                        <>
                          <br />
                          <Typography component="span" variant="body2" sx={{ fontStyle: 'italic' }}>
                            "{item.description}"
                          </Typography>
                        </>
                      )}
                    </>
                  }
                />
              </ListItem>
              {index < authorizationEntries.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
