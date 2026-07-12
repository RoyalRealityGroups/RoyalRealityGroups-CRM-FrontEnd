import React, { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios.config';

interface State {
  id: string;
  name: string;
  code: string;
}

interface City {
  id: string;
  name: string;
  code: string;
  state: string | { id: string; name: string };
}

interface Area {
  id: string;
  name: string;
  code: string;
  city: string | { id: string; name: string };
}

interface LocationTreeViewProps {
  selectedStates: string[];
  selectedCities: string[];
  selectedAreas: string[];
  onSelectionChange: (selection: {
    states: string[];
    cities: string[];
    areas: string[];
  }) => void;
}

const LocationTreeView: React.FC<LocationTreeViewProps> = ({
  selectedStates,
  selectedCities,
  selectedAreas,
  onSelectionChange,
}) => {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  // const queryClient = useQueryClient();

  // Helper functions to extract IDs from objects or strings
  const getStateId = (state: string | { id: string; name: string }): string => {
    return typeof state === 'string' ? state : state.id;
  };

  const getCityId = (city: string | { id: string; name: string }): string => {
    return typeof city === 'string' ? city : city.id;
  };

  // Fetch all states
  const { data: statesData, isLoading: statesLoading } = useQuery({
    queryKey: ['states-all'],
    queryFn: async () => {
      const response = await apiClient.get('/api/masters/states/', {
        params: { 
          page_size: 1000,
          ordering: 'name'
        }
      });
      return response.data.results as State[];
    },
  });

  // Fetch cities for selected states
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ['cities-for-states', selectedStates],
    queryFn: async () => {
      if (selectedStates.length === 0) return [];
      const response = await apiClient.get('/api/masters/cities/', {
        params: { 
          state: selectedStates.join(','),
          page_size: 10000,
          ordering: 'name'
        }
      });
      return response.data.results as City[];
    },
    enabled: selectedStates.length > 0,
  });

  // Fetch areas for selected cities
  const { data: areasData, isLoading: areasLoading } = useQuery({
    queryKey: ['areas-for-cities', selectedCities],
    queryFn: async () => {
      if (selectedCities.length === 0) return [];
      const response = await apiClient.get('/api/masters/areas/', {
        params: { 
          city: selectedCities.join(','),
          page_size: 10000,
          ordering: 'name'
        }
      });
      return response.data.results as Area[];
    },
    enabled: selectedCities.length > 0,
  });

  const handleStateToggle = (stateId: string) => {
    const isSelected = selectedStates.includes(stateId);
    
    if (isSelected) {
      // Deselect state and all its children
      const newStates = selectedStates.filter(id => id !== stateId);
      const citiesToRemove = citiesData?.filter(c => getStateId(c.state) === stateId).map(c => c.id) || [];
      const newCities = selectedCities.filter(id => !citiesToRemove.includes(id));
      const areasToRemove = areasData?.filter(a => citiesToRemove.includes(getCityId(a.city))).map(a => a.id) || [];
      const newAreas = selectedAreas.filter(id => !areasToRemove.includes(id));
      
      onSelectionChange({ states: newStates, cities: newCities, areas: newAreas });
    } else {
      // Select state only (don't auto-select cities)
      const newStates = [...selectedStates, stateId];
      
      // Expand the state to show cities for manual selection
      const newExpanded = new Set(expandedStates);
      newExpanded.add(stateId);
      setExpandedStates(newExpanded);
      
      onSelectionChange({ states: newStates, cities: selectedCities, areas: selectedAreas });
    }
  };

  const handleCityToggle = (cityId: string, stateId: string) => {
    const isSelected = selectedCities.includes(cityId);
    
    if (isSelected) {
      // Deselect city and all its areas
      const newCities = selectedCities.filter(id => id !== cityId);
      const areasToRemove = areasData?.filter(a => getCityId(a.city) === cityId).map(a => a.id) || [];
      const newAreas = selectedAreas.filter(id => !areasToRemove.includes(id));
      
      // Check if we should deselect the state
      const stateCities = citiesData?.filter(c => getStateId(c.state) === stateId) || [];
      const remainingStateCities = newCities.filter(id => 
        stateCities.some(c => c.id === id)
      );
      const newStates = remainingStateCities.length === 0 
        ? selectedStates.filter(id => id !== stateId)
        : selectedStates;
      
      onSelectionChange({ states: newStates, cities: newCities, areas: newAreas });
    } else {
      // Select city only (don't auto-select areas)
      const newCities = [...selectedCities, cityId];
      
      // Expand the city to show areas for manual selection
      const newExpanded = new Set(expandedCities);
      newExpanded.add(cityId);
      setExpandedCities(newExpanded);
      
      // Ensure state is selected
      const newStates = selectedStates.includes(stateId) 
        ? selectedStates 
        : [...selectedStates, stateId];
      
      onSelectionChange({ states: newStates, cities: newCities, areas: selectedAreas });
    }
  };

  const handleAreaToggle = (areaId: string, cityId: string, stateId: string) => {
    const isSelected = selectedAreas.includes(areaId);
    
    if (isSelected) {
      // Deselect area
      const newAreas = selectedAreas.filter(id => id !== areaId);
      
      // Check if we should deselect the city
      const cityAreas = areasData?.filter(a => getCityId(a.city) === cityId) || [];
      const remainingCityAreas = newAreas.filter(id => 
        cityAreas.some(a => a.id === id)
      );
      const newCities = remainingCityAreas.length === 0
        ? selectedCities.filter(id => id !== cityId)
        : selectedCities;
      
      // Check if we should deselect the state
      const stateCities = citiesData?.filter(c => getStateId(c.state) === stateId) || [];
      const remainingStateCities = newCities.filter(id => 
        stateCities.some(c => c.id === id)
      );
      const newStates = remainingStateCities.length === 0
        ? selectedStates.filter(id => id !== stateId)
        : selectedStates;
      
      onSelectionChange({ states: newStates, cities: newCities, areas: newAreas });
    } else {
      // Select area
      const newAreas = [...selectedAreas, areaId];
      
      // Ensure city is selected
      const newCities = selectedCities.includes(cityId)
        ? selectedCities
        : [...selectedCities, cityId];
      
      // Ensure state is selected
      const newStates = selectedStates.includes(stateId)
        ? selectedStates
        : [...selectedStates, stateId];
      
      onSelectionChange({ states: newStates, cities: newCities, areas: newAreas });
    }
  };

  const toggleStateExpansion = (stateId: string) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(stateId)) {
      newExpanded.delete(stateId);
    } else {
      newExpanded.add(stateId);
    }
    setExpandedStates(newExpanded);
  };

  const toggleCityExpansion = (cityId: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedCities(newExpanded);
  };

  if (statesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!statesData || statesData.length === 0) {
    return (
      <Alert severity="warning">No states available</Alert>
    );
  }

  return (
    <Box>
      {/* Summary Chips */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip 
          label={`${selectedStates.length} States`} 
          color="primary" 
          variant={selectedStates.length > 0 ? "filled" : "outlined"}
          size="small"
        />
        <Chip 
          label={`${selectedCities.length} Cities`} 
          color="secondary" 
          variant={selectedCities.length > 0 ? "filled" : "outlined"}
          size="small"
        />
        <Chip 
          label={`${selectedAreas.length} Areas`} 
          color="success" 
          variant={selectedAreas.length > 0 ? "filled" : "outlined"}
          size="small"
        />
      </Box>

      {/* State Tree */}
      <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
        {statesData.map((state) => {
          const isStateSelected = selectedStates.includes(state.id);
          const stateCities = citiesData?.filter(c => getStateId(c.state) === state.id) || [];
          const isExpanded = expandedStates.has(state.id);

          return (
            <Accordion 
              key={state.id} 
              expanded={isExpanded}
              onChange={() => toggleStateExpansion(state.id)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isStateSelected}
                      onChange={() => {
                        handleStateToggle(state.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {state.name} ({state.code})
                      </Typography>
                      {isStateSelected && stateCities.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {stateCities.length} cities selected
                        </Typography>
                      )}
                    </Box>
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </AccordionSummary>
              
              <AccordionDetails>
                {citiesLoading ? (
                  <CircularProgress size={20} />
                ) : stateCities.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No cities available
                  </Typography>
                ) : (
                  <Box sx={{ pl: 2 }}>
                    {stateCities.map((city) => {
                      const isCitySelected = selectedCities.includes(city.id);
                      const cityAreas = areasData?.filter(a => getCityId(a.city) === city.id) || [];
                      const isCityExpanded = expandedCities.has(city.id);

                      return (
                        <Accordion 
                          key={city.id}
                          expanded={isCityExpanded}
                          onChange={() => toggleCityExpansion(city.id)}
                          sx={{ mb: 0.5 }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isCitySelected}
                                  onChange={() => handleCityToggle(city.id, state.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2">
                                    {city.name} ({city.code})
                                  </Typography>
                                  {isCitySelected && cityAreas.length > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      {cityAreas.length} areas selected
                                    </Typography>
                                  )}
                                </Box>
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </AccordionSummary>
                          
                          <AccordionDetails>
                            {areasLoading ? (
                              <CircularProgress size={16} />
                            ) : cityAreas.length === 0 ? (
                              <Typography variant="caption" color="text.secondary">
                                No areas available
                              </Typography>
                            ) : (
                              <Box sx={{ pl: 2 }}>
                                {cityAreas.map((area) => {
                                  const isAreaSelected = selectedAreas.includes(area.id);
                                  
                                  return (
                                    <FormControlLabel
                                      key={area.id}
                                      control={
                                        <Checkbox
                                          checked={isAreaSelected}
                                          onChange={() => handleAreaToggle(area.id, city.id, state.id)}
                                          size="small"
                                        />
                                      }
                                      label={
                                        <Typography variant="body2">
                                          {area.name} ({area.code})
                                        </Typography>
                                      }
                                    />
                                  );
                                })}
                              </Box>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
};

export default LocationTreeView;
