import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  Paper,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/axios.config';

interface State {
  id: string;
  name: string;
  code: string;
}

interface District {
  id: string;
  name: string;
  code: string;
  state: string | { id: string; name: string };
}

interface Mandal {
  id: string;
  name: string;
  code: string;
  district: string | { id: string; name: string };
  state: string | { id: string; name: string };
}

interface City {
  id: string;
  name: string;
  code: string;
  mandal: string | { id: string; name: string };
  district: string | { id: string; name: string };
  state: string | { id: string; name: string };
}

interface Area {
  id: string;
  name: string;
  code: string;
  city: string | { id: string; name: string };
}

interface LocationCascadeSelectorProps {
  selectedStates: string[];
  selectedDistricts?: string[];
  selectedMandals?: string[];
  selectedCities: string[];
  selectedAreas: string[];
  onSelectionChange: (selection: {
    states: string[];
    districts: string[];
    mandals: string[];
    cities: string[];
    areas: string[];
  }) => void;
}

const getId = (val: string | { id: string; name: string }): string =>
  typeof val === 'string' ? val : val.id;

const LocationCascadeSelector: React.FC<LocationCascadeSelectorProps> = ({
  selectedStates,
  selectedDistricts = [],
  selectedMandals = [],
  selectedCities,
  selectedAreas,
  onSelectionChange,
}) => {
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [mandalSearch, setMandalSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  // Fetch all states
  const { data: statesData = [], isLoading: statesLoading } = useQuery({
    queryKey: ['states-all'],
    queryFn: async () => {
      const response = await apiClient.get('/api/masters/states/', {
        params: { page_size: 1000, ordering: 'name' }
      });
      return response.data.results as State[];
    },
  });

  // Fetch districts for selected states
  const { data: districtsData = [], isLoading: districtsLoading } = useQuery({
    queryKey: ['districts-for-states', selectedStates],
    queryFn: async () => {
      if (selectedStates.length === 0) return [];
      const response = await apiClient.get('/api/masters/districts/', {
        params: { state: selectedStates.join(','), page_size: 10000, ordering: 'name' }
      });
      return response.data.results as District[];
    },
    enabled: selectedStates.length > 0,
  });

  // Fetch mandals for selected districts
  const { data: mandalsData = [], isLoading: mandalsLoading } = useQuery({
    queryKey: ['mandals-for-districts', selectedDistricts],
    queryFn: async () => {
      if (selectedDistricts.length === 0) return [];
      const response = await apiClient.get('/api/masters/mandals/', {
        params: { district: selectedDistricts.join(','), page_size: 10000, ordering: 'name' }
      });
      return response.data.results as Mandal[];
    },
    enabled: selectedDistricts.length > 0,
  });

  // Fetch cities for selected mandals
  const { data: citiesData = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['cities-for-mandals', selectedMandals],
    queryFn: async () => {
      if (selectedMandals.length === 0) return [];
      const response = await apiClient.get('/api/masters/cities/', {
        params: { mandal: selectedMandals.join(','), page_size: 10000, ordering: 'name' }
      });
      return response.data.results as City[];
    },
    enabled: selectedMandals.length > 0,
  });

  // Fetch areas for selected cities
  const { data: areasData = [], isLoading: areasLoading } = useQuery({
    queryKey: ['areas-for-cities', selectedCities],
    queryFn: async () => {
      if (selectedCities.length === 0) return [];
      const response = await apiClient.get('/api/masters/areas/', {
        params: { city: selectedCities.join(','), page_size: 10000, ordering: 'name' }
      });
      return response.data.results as Area[];
    },
    enabled: selectedCities.length > 0,
  });

  // Filtered lists
  const filteredStates = useMemo(() => {
    if (!stateSearch) return statesData;
    return statesData.filter(s =>
      s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(stateSearch.toLowerCase())
    );
  }, [statesData, stateSearch]);

  const filteredDistricts = useMemo(() => {
    if (!districtSearch) return districtsData;
    return districtsData.filter(d =>
      d.name.toLowerCase().includes(districtSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(districtSearch.toLowerCase())
    );
  }, [districtsData, districtSearch]);

  const filteredMandals = useMemo(() => {
    if (!mandalSearch) return mandalsData;
    return mandalsData.filter(m =>
      m.name.toLowerCase().includes(mandalSearch.toLowerCase()) ||
      m.code.toLowerCase().includes(mandalSearch.toLowerCase())
    );
  }, [mandalsData, mandalSearch]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return citiesData;
    return citiesData.filter(c =>
      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [citiesData, citySearch]);

  const filteredAreas = useMemo(() => {
    if (!areaSearch) return areasData;
    return areasData.filter(a =>
      a.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
      a.code.toLowerCase().includes(areaSearch.toLowerCase())
    );
  }, [areasData, areaSearch]);

  // Handlers
  const handleStateToggle = (stateId: string) => {
    const newStates = selectedStates.includes(stateId)
      ? selectedStates.filter(id => id !== stateId)
      : [...selectedStates, stateId];

    if (!newStates.includes(stateId)) {
      // Deselecting state - remove child districts, mandals, cities, areas
      const districtsToRemove = districtsData.filter(d => getId(d.state) === stateId).map(d => d.id);
      const newDistricts = selectedDistricts.filter(id => !districtsToRemove.includes(id));
      const mandalsToRemove = mandalsData.filter(m => districtsToRemove.includes(getId(m.district))).map(m => m.id);
      const newMandals = selectedMandals.filter(id => !mandalsToRemove.includes(id));
      const citiesToRemove = citiesData.filter(c => mandalsToRemove.includes(getId(c.mandal))).map(c => c.id);
      const newCities = selectedCities.filter(id => !citiesToRemove.includes(id));
      const areasToRemove = areasData.filter(a => citiesToRemove.includes(getId(a.city))).map(a => a.id);
      const newAreas = selectedAreas.filter(id => !areasToRemove.includes(id));
      onSelectionChange({ states: newStates, districts: newDistricts, mandals: newMandals, cities: newCities, areas: newAreas });
    } else {
      onSelectionChange({ states: newStates, districts: selectedDistricts, mandals: selectedMandals, cities: selectedCities, areas: selectedAreas });
    }
  };

  const handleDistrictToggle = (districtId: string) => {
    const newDistricts = selectedDistricts.includes(districtId)
      ? selectedDistricts.filter(id => id !== districtId)
      : [...selectedDistricts, districtId];

    if (!newDistricts.includes(districtId)) {
      const mandalsToRemove = mandalsData.filter(m => getId(m.district) === districtId).map(m => m.id);
      const newMandals = selectedMandals.filter(id => !mandalsToRemove.includes(id));
      const citiesToRemove = citiesData.filter(c => mandalsToRemove.includes(getId(c.mandal))).map(c => c.id);
      const newCities = selectedCities.filter(id => !citiesToRemove.includes(id));
      const areasToRemove = areasData.filter(a => citiesToRemove.includes(getId(a.city))).map(a => a.id);
      const newAreas = selectedAreas.filter(id => !areasToRemove.includes(id));
      onSelectionChange({ states: selectedStates, districts: newDistricts, mandals: newMandals, cities: newCities, areas: newAreas });
    } else {
      // Auto-select parent state
      const district = districtsData.find(d => d.id === districtId);
      const stateId = district ? getId(district.state) : '';
      const newStates = stateId && !selectedStates.includes(stateId) ? [...selectedStates, stateId] : selectedStates;
      onSelectionChange({ states: newStates, districts: newDistricts, mandals: selectedMandals, cities: selectedCities, areas: selectedAreas });
    }
  };

  const handleMandalToggle = (mandalId: string) => {
    const newMandals = selectedMandals.includes(mandalId)
      ? selectedMandals.filter(id => id !== mandalId)
      : [...selectedMandals, mandalId];

    if (!newMandals.includes(mandalId)) {
      const citiesToRemove = citiesData.filter(c => getId(c.mandal) === mandalId).map(c => c.id);
      const newCities = selectedCities.filter(id => !citiesToRemove.includes(id));
      const areasToRemove = areasData.filter(a => citiesToRemove.includes(getId(a.city))).map(a => a.id);
      const newAreas = selectedAreas.filter(id => !areasToRemove.includes(id));
      onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: newMandals, cities: newCities, areas: newAreas });
    } else {
      // Auto-select parent district & state
      const mandal = mandalsData.find(m => m.id === mandalId);
      const districtId = mandal ? getId(mandal.district) : '';
      const stateId = mandal ? getId(mandal.state) : '';
      const newDistricts = districtId && !selectedDistricts.includes(districtId) ? [...selectedDistricts, districtId] : selectedDistricts;
      const newStates = stateId && !selectedStates.includes(stateId) ? [...selectedStates, stateId] : selectedStates;
      onSelectionChange({ states: newStates, districts: newDistricts, mandals: newMandals, cities: selectedCities, areas: selectedAreas });
    }
  };

  const handleCityToggle = (cityId: string) => {
    const newCities = selectedCities.includes(cityId)
      ? selectedCities.filter(id => id !== cityId)
      : [...selectedCities, cityId];

    if (!newCities.includes(cityId)) {
      const areasToRemove = areasData.filter(a => getId(a.city) === cityId).map(a => a.id);
      const newAreas = selectedAreas.filter(id => !areasToRemove.includes(id));
      onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: selectedMandals, cities: newCities, areas: newAreas });
    } else {
      onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: selectedMandals, cities: newCities, areas: selectedAreas });
    }
  };

  const handleAreaToggle = (areaId: string) => {
    const newAreas = selectedAreas.includes(areaId)
      ? selectedAreas.filter(id => id !== areaId)
      : [...selectedAreas, areaId];
    onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: selectedMandals, cities: selectedCities, areas: newAreas });
  };

  // Select All handlers
  const handleToggleAllStates = (checked: boolean) => {
    if (checked) {
      onSelectionChange({ states: filteredStates.map(s => s.id), districts: selectedDistricts, mandals: selectedMandals, cities: selectedCities, areas: selectedAreas });
    } else {
      onSelectionChange({ states: [], districts: [], mandals: [], cities: [], areas: [] });
    }
  };

  const handleToggleAllDistricts = (checked: boolean) => {
    if (checked) {
      onSelectionChange({ states: selectedStates, districts: districtsData.map(d => d.id), mandals: selectedMandals, cities: selectedCities, areas: selectedAreas });
    } else {
      onSelectionChange({ states: selectedStates, districts: [], mandals: [], cities: [], areas: [] });
    }
  };

  const handleToggleAllMandals = (checked: boolean) => {
    if (checked) {
      onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: mandalsData.map(m => m.id), cities: selectedCities, areas: selectedAreas });
    } else {
      onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: [], cities: [], areas: [] });
    }
  };

  const handleToggleAllCities = (checked: boolean) => {
    if (checked) {
      onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: selectedMandals, cities: citiesData.map(c => c.id), areas: selectedAreas });
    } else {
      onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: selectedMandals, cities: [], areas: [] });
    }
  };

  const handleToggleAllAreas = (checked: boolean) => {
    if (checked) {
      onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: selectedMandals, cities: selectedCities, areas: areasData.map(a => a.id) });
    } else {
      onSelectionChange({ states: selectedStates, districts: selectedDistricts, mandals: selectedMandals, cities: selectedCities, areas: [] });
    }
  };

  const isAllStatesSelected = filteredStates.length > 0 && selectedStates.length === filteredStates.length;
  const isSomeStatesSelected = selectedStates.length > 0 && selectedStates.length < filteredStates.length;
  const isAllDistrictsSelected = districtsData.length > 0 && selectedDistricts.length === districtsData.length;
  const isSomeDistrictsSelected = selectedDistricts.length > 0 && selectedDistricts.length < districtsData.length;
  const isAllMandalsSelected = mandalsData.length > 0 && selectedMandals.length === mandalsData.length;
  const isSomeMandalsSelected = selectedMandals.length > 0 && selectedMandals.length < mandalsData.length;
  const isAllCitiesSelected = citiesData.length > 0 && selectedCities.length === citiesData.length;
  const isSomeCitiesSelected = selectedCities.length > 0 && selectedCities.length < citiesData.length;
  const isAllAreasSelected = areasData.length > 0 && selectedAreas.length === areasData.length;
  const isSomeAreasSelected = selectedAreas.length > 0 && selectedAreas.length < areasData.length;

  const renderColumn = (
    title: string,
    selectedCount: number,
    searchValue: string,
    onSearchChange: (v: string) => void,
    isAllSelected: boolean,
    isSomeSelected: boolean,
    onToggleAll: (checked: boolean) => void,
    disabled: boolean,
    loading: boolean,
    items: { id: string; name: string; code: string }[],
    selectedIds: string[],
    onToggle: (id: string) => void,
    emptyMessage: string,
  ) => (
    <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={isAllSelected}
              indeterminate={isSomeSelected}
              onChange={(e) => onToggleAll(e.target.checked)}
              disabled={disabled || loading || items.length === 0}
            />
          }
          label={<Typography variant="subtitle2" fontWeight={600}>{title} ({selectedCount})</Typography>}
          sx={{ m: 0 }}
        />
        <TextField
          fullWidth
          size="small"
          placeholder={`Search...`}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
          sx={{ mt: 1 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />
      </Box>
      <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        {disabled ? (
          <ListItem><ListItemText primary={emptyMessage} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} /></ListItem>
        ) : loading ? (
          <ListItem><ListItemText primary="Loading..." /></ListItem>
        ) : items.length === 0 ? (
          <ListItem><ListItemText primary="No items found" /></ListItem>
        ) : (
          items.map((item) => (
            <ListItemButton key={item.id} dense onClick={() => onToggle(item.id)}>
              <Checkbox edge="start" size="small" checked={selectedIds.includes(item.id)} tabIndex={-1} disableRipple />
              <ListItemText primary={item.name} secondary={item.code} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItemButton>
          ))
        )}
      </List>
    </Paper>
  );

  return (
    <Box sx={{ display: 'flex', gap: 1, height: '500px' }}>
      {renderColumn('States', selectedStates.length, stateSearch, setStateSearch, isAllStatesSelected, isSomeStatesSelected, handleToggleAllStates, false, statesLoading, filteredStates, selectedStates, handleStateToggle, '')}
      {renderColumn('Districts', selectedDistricts.length, districtSearch, setDistrictSearch, isAllDistrictsSelected, isSomeDistrictsSelected, handleToggleAllDistricts, selectedStates.length === 0, districtsLoading, filteredDistricts, selectedDistricts, handleDistrictToggle, 'Select states first')}
      {renderColumn('Mandals', selectedMandals.length, mandalSearch, setMandalSearch, isAllMandalsSelected, isSomeMandalsSelected, handleToggleAllMandals, selectedDistricts.length === 0, mandalsLoading, filteredMandals, selectedMandals, handleMandalToggle, 'Select districts first')}
      {renderColumn('Cities', selectedCities.length, citySearch, setCitySearch, isAllCitiesSelected, isSomeCitiesSelected, handleToggleAllCities, selectedMandals.length === 0, citiesLoading, filteredCities, selectedCities, handleCityToggle, 'Select mandals first')}
      {renderColumn('Areas', selectedAreas.length, areaSearch, setAreaSearch, isAllAreasSelected, isSomeAreasSelected, handleToggleAllAreas, selectedCities.length === 0, areasLoading, filteredAreas, selectedAreas, handleAreaToggle, 'Select cities first')}
    </Box>
  );
};

export default LocationCascadeSelector;
