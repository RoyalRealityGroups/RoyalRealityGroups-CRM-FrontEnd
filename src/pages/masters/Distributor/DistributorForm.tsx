import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  IconButton,
  Card,
  CardContent,
  CardActions,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Save as SaveIcon, Delete as DeleteIcon, Upload as UploadIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import SearchableDropdownWithCreate from '../../../components/common/SearchableDropdownWithCreate';
import ScreenHeader from '../../../components/common/ScreenHeader';
import ChannelPartnerGuard from '../../../components/guards/ChannelPartnerGuard';
import LocationCascadeSelector from '../../../components/masters/LocationCascadeSelector';
import LocationContactDialog, { type LocationContactFormData } from '../../../components/masters/LocationContactDialog';
import LocationContactTable, { type LocationContact } from '../../../components/masters/LocationContactTable';
import CountryFormDialog from '../Country/CountryFormDialog';
import StateFormDialog from '../State/StateFormDialog';
import DistrictFormDialog from '../District/DistrictFormDialog';
import MandalFormDialog from '../Mandal/MandalFormDialog';
import CityFormDialog from '../City/CityFormDialog';
import AreaFormDialog from '../Area/AreaFormDialog';
import AgentFormDialog from '../Agent/AgentFormDialog';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import useToast from '../../../hooks/useToast';
import { usePageTitle } from '../../../hooks';
import { distributorApi, countryApi, stateApi, districtApi, mandalApi, cityApi, areaApi, agentApi } from '../../../api/masters.api';
import { API_ENDPOINTS } from '../../../utils/constants';
import apiClient from '../../../api/axios.config';
import type { DistributorFormData } from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import { getContentSectionStyles, getHeaderSectionStyles, getPageContainerStyles } from '../../../utils/spacing';
import { generateClientId } from '../../../utils/id';

const DistributorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditMode = Boolean(id);

  usePageTitle(isEditMode ? 'Edit Distributor' : 'Add Distributor');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DistributorFormData>({
    defaultValues: {
      code: '',
      name: '',
      company_id: '',
      superstockist_id: '',
      country_id: '',
      state_id: '',
      district_id: '',
      mandal_id: '',
      city_id: '',
      area_id: '',
      street: '',
      address: '',
      pincode: '',
      shipping_same_as_billing: true,
      shipping_country_id: '',
      shipping_state_id: '',
      shipping_district_id: '',
      shipping_mandal_id: '',
      shipping_city_id: '',
      shipping_area_id: '',
      shipping_street: '',
      shipping_address: '',
      shipping_pincode: '',
      gstin: '',
      pan: '',
      aadhar: '',
      bank_account_number: '',
      bank_name: '',
      bank_branch: '',
      bank_ifsc: '',
      bank_account_type: '',
      google_location: '',
      credit_limit: 0,
      credit_days: 0,
      is_active: true,
      effective_from: '',
      effective_to: '',
      erp_code: '',
    },
  });

  const [selectedCompany, setSelectedCompany] = useState<DropdownOption | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<DropdownOption | null>(null);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DropdownOption | null>(null);
  const [selectedMandal, setSelectedMandal] = useState<DropdownOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<DropdownOption | null>(null);
  const [selectedArea, setSelectedArea] = useState<DropdownOption | null>(null);
  const [selectedShippingCountry, setSelectedShippingCountry] = useState<DropdownOption | null>(null);
  const [selectedShippingState, setSelectedShippingState] = useState<DropdownOption | null>(null);
  const [selectedShippingDistrict, setSelectedShippingDistrict] = useState<DropdownOption | null>(null);
  const [selectedShippingMandal, setSelectedShippingMandal] = useState<DropdownOption | null>(null);
  const [selectedShippingCity, setSelectedShippingCity] = useState<DropdownOption | null>(null);
  const [selectedShippingArea, setSelectedShippingArea] = useState<DropdownOption | null>(null);
  const [selectedSuperstockist, setSelectedSuperstockist] = useState<DropdownOption | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<DropdownOption | null>(null);
  const [agentFormOpen, setAgentFormOpen] = useState(false);
  const [agentError, setAgentError] = useState(false);

  // Form dialog states
  const [countryFormOpen, setCountryFormOpen] = useState(false);
  const [stateFormOpen, setStateFormOpen] = useState(false);
  const [districtFormOpen, setDistrictFormOpen] = useState(false);
  const [mandalFormOpen, setMandalFormOpen] = useState(false);
  const [cityFormOpen, setCityFormOpen] = useState(false);
  const [areaFormOpen, setAreaFormOpen] = useState(false);
  const [shippingCountryFormOpen, setShippingCountryFormOpen] = useState(false);
  const [shippingStateFormOpen, setShippingStateFormOpen] = useState(false);
  const [shippingDistrictFormOpen, setShippingDistrictFormOpen] = useState(false);
  const [shippingMandalFormOpen, setShippingMandalFormOpen] = useState(false);
  const [shippingCityFormOpen, setShippingCityFormOpen] = useState(false);
  const [shippingAreaFormOpen, setShippingAreaFormOpen] = useState(false);

  // User account validation errors
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});
  const [userUsername, setUserUsername] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userDeviceAccess, setUserDeviceAccess] = useState(3);
  const [userGroupIds, setUserGroupIds] = useState<DropdownOption[]>([]);
  const [userSelectedCompanies, setUserSelectedCompanies] = useState<DropdownOption[]>([]);
  const [userHasAllCompanies, setUserHasAllCompanies] = useState(false);
  const [userSelectedLocations, setUserSelectedLocations] = useState<DropdownOption[]>([]);
  const [userHasAllLocations, setUserHasAllLocations] = useState(false);

  // Watch shipping_same_as_billing checkbox
  const shippingSameAsBilling = watch('shipping_same_as_billing');
  const billingCountryId = watch('country_id');
  const billingStateId = watch('state_id');
  const billingDistrictId = watch('district_id');
  const billingMandalId = watch('mandal_id');
  const billingCityId = watch('city_id');
  const billingAreaId = watch('area_id');
  const billingStreet = watch('street');
  const billingAddress = watch('address');
  const billingPincode = watch('pincode');

  // Autofill shipping address when checkbox is checked
  useEffect(() => {
    if (shippingSameAsBilling) {
      setValue('shipping_country_id', billingCountryId);
      setValue('shipping_state_id', billingStateId);
      setValue('shipping_district_id', billingDistrictId);
      setValue('shipping_mandal_id', billingMandalId);
      setValue('shipping_city_id', billingCityId);
      setValue('shipping_area_id', billingAreaId);
      setValue('shipping_street', billingStreet);
      setValue('shipping_address', billingAddress);
      setValue('shipping_pincode', billingPincode);
      setSelectedShippingCountry(selectedCountry);
      setSelectedShippingState(selectedState);
      setSelectedShippingDistrict(selectedDistrict);
      setSelectedShippingMandal(selectedMandal);
      setSelectedShippingCity(selectedCity);
      setSelectedShippingArea(selectedArea);
    }
  }, [shippingSameAsBilling, billingCountryId, billingStateId, billingDistrictId, billingMandalId, billingCityId, billingAreaId, billingStreet, billingAddress, billingPincode, selectedCountry, selectedState, selectedDistrict, selectedMandal, selectedCity, selectedArea, setValue]);
  const [selectedLocationStates, setSelectedLocationStates] = useState<string[]>([]);
  const [selectedLocationDistricts, setSelectedLocationDistricts] = useState<string[]>([]);
  const [selectedLocationMandals, setSelectedLocationMandals] = useState<string[]>([]);
  const [selectedLocationCities, setSelectedLocationCities] = useState<string[]>([]);
  const [selectedLocationAreas, setSelectedLocationAreas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<{[key: string]: File}>({});
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<LocationContact | null>(null);
  const [tempContacts, setTempContacts] = useState<LocationContact[]>([]);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Distributor', path: '/masters/distributor', icon: <LocalShippingIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Distributor' : 'Add Distributor' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Fetch channel configuration
  const { data: channelConfig } = useQuery({
    queryKey: ['channelConfig'],
    queryFn: async () => {
      const response = await apiClient.get('/api/masters/channel-config/');
      return {
        enable_superstockist: response.data.enable_superstockist || false,
        enforce_channel_hierarchy: response.data.enforce_channel_hierarchy || false,
      };
    },
  });

  // Fetch distributor data for edit mode
  const { data: distributorData, isLoading: isLoadingDistributor } = useQuery({
    queryKey: ['distributor', id],
    queryFn: () => distributorApi.getDistributor(id!),
    enabled: isEditMode,
  });

  // Fetch attachments for edit mode
  const { data: attachmentsData, refetch: refetchAttachments } = useQuery({
    queryKey: ['distributorAttachments', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/masters/distributors/${id}/attachments/`);
      return response.data;
    },
    enabled: isEditMode,
  });

  // Fetch contacts for edit mode
  const { data: contactsData } = useQuery({
    queryKey: ['distributorContacts', id],
    queryFn: () => distributorApi.getContacts(id!),
    enabled: isEditMode && !!id,
  });

  const contacts = contactsData?.results || contactsData || [];

  const createContactMutation = useMutation({
    mutationFn: (data: LocationContactFormData) => distributorApi.createContact(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributorContacts', id] });
      toastSuccess('Contact added successfully');
    },
    onError: () => toastError('Failed to add contact'),
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: LocationContactFormData }) =>
      distributorApi.updateContact(id!, contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributorContacts', id] });
      toastSuccess('Contact updated successfully');
    },
    onError: () => toastError('Failed to update contact'),
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => distributorApi.deleteContact(id!, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributorContacts', id] });
      toastSuccess('Contact deleted successfully');
    },
    onError: () => toastError('Failed to delete contact'),
  });

  // Geographic master creation mutations
  const createCountryMutation = useMutation({
    mutationFn: countryApi.createCountry,
    onSuccess: (newCountry) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setSelectedCountry({ id: newCountry.id, name: newCountry.name });
      setValue('country_id', newCountry.id);
      setCountryFormOpen(false);
    },
  });

  const createStateMutation = useMutation({
    mutationFn: stateApi.createState,
    onSuccess: (newState) => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
      setSelectedState({ id: newState.id, name: newState.name });
      setValue('state_id', newState.id);
      setStateFormOpen(false);
    },
  });

  const createDistrictMutation = useMutation({
    mutationFn: districtApi.createDistrict,
    onSuccess: (newDistrict) => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setSelectedDistrict({ id: newDistrict.id, name: newDistrict.name });
      setValue('district_id', newDistrict.id);
      setDistrictFormOpen(false);
    },
  });

  const createMandalMutation = useMutation({
    mutationFn: mandalApi.createMandal,
    onSuccess: (newMandal) => {
      queryClient.invalidateQueries({ queryKey: ['mandals'] });
      setSelectedMandal({ id: newMandal.id, name: newMandal.name });
      setValue('mandal_id', newMandal.id);
      setMandalFormOpen(false);
    },
  });

  const createCityMutation = useMutation({
    mutationFn: cityApi.createCity,
    onSuccess: (newCity) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setSelectedCity({ id: newCity.id, name: newCity.name });
      setValue('city_id', newCity.id);
      setCityFormOpen(false);
    },
  });

  const createAreaMutation = useMutation({
    mutationFn: areaApi.createArea,
    onSuccess: (newArea) => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setSelectedArea({ id: newArea.id, name: newArea.name });
      setValue('area_id', newArea.id);
      setAreaFormOpen(false);
    },
  });

  // Shipping address creation mutations
  const createShippingCountryMutation = useMutation({
    mutationFn: countryApi.createCountry,
    onSuccess: (newCountry) => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setSelectedShippingCountry({ id: newCountry.id, name: newCountry.name });
      setValue('shipping_country_id', newCountry.id);
      setShippingCountryFormOpen(false);
    },
  });

  const createShippingStateMutation = useMutation({
    mutationFn: stateApi.createState,
    onSuccess: (newState) => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
      setSelectedShippingState({ id: newState.id, name: newState.name });
      setValue('shipping_state_id', newState.id);
      setShippingStateFormOpen(false);
    },
  });

  const createShippingDistrictMutation = useMutation({
    mutationFn: districtApi.createDistrict,
    onSuccess: (newDistrict) => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setSelectedShippingDistrict({ id: newDistrict.id, name: newDistrict.name });
      setValue('shipping_district_id', newDistrict.id);
      setShippingDistrictFormOpen(false);
    },
  });

  const createShippingMandalMutation = useMutation({
    mutationFn: mandalApi.createMandal,
    onSuccess: (newMandal) => {
      queryClient.invalidateQueries({ queryKey: ['mandals'] });
      setSelectedShippingMandal({ id: newMandal.id, name: newMandal.name });
      setValue('shipping_mandal_id', newMandal.id);
      setShippingMandalFormOpen(false);
    },
  });

  const createShippingCityMutation = useMutation({
    mutationFn: cityApi.createCity,
    onSuccess: (newCity) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setSelectedShippingCity({ id: newCity.id, name: newCity.name });
      setValue('shipping_city_id', newCity.id);
      setShippingCityFormOpen(false);
    },
  });

  const createShippingAreaMutation = useMutation({
    mutationFn: areaApi.createArea,
    onSuccess: (newArea) => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setSelectedShippingArea({ id: newArea.id, name: newArea.name });
      setValue('shipping_area_id', newArea.id);
      setShippingAreaFormOpen(false);
    },
  });

  useEffect(() => {
    if (attachmentsData) {
      setAttachments(attachmentsData);
    }
  }, [attachmentsData]);

  // Populate form when distributor data is loaded
  useEffect(() => {
    if (distributorData) {
      const data = distributorData as any;
      reset({
        code: distributorData.code || '',
        name: distributorData.name || '',
        company_id: distributorData.company || '',
        superstockist_id: distributorData.superstockist || '',
        country_id: data.country_id || distributorData.country || '',
        state_id: data.state_id || distributorData.state || '',
        district_id: data.district_id || distributorData.district || '',
        mandal_id: data.mandal_id || distributorData.mandal || '',
        city_id: data.city_id || distributorData.city || '',
        area_id: data.area_id || distributorData.area || '',
        street: distributorData.street || '',
        address: distributorData.address || '',
        pincode: distributorData.pincode || '',
        shipping_same_as_billing: distributorData.shipping_same_as_billing ?? true,
        shipping_country_id: data.shipping_country_id || distributorData.shipping_country || '',
        shipping_state_id: data.shipping_state_id || distributorData.shipping_state || '',
        shipping_district_id: data.shipping_district_id || distributorData.shipping_district || '',
        shipping_mandal_id: data.shipping_mandal_id || distributorData.shipping_mandal || '',
        shipping_city_id: data.shipping_city_id || distributorData.shipping_city || '',
        shipping_area_id: data.shipping_area_id || distributorData.shipping_area || '',
        shipping_street: distributorData.shipping_street || '',
        shipping_address: distributorData.shipping_address || '',
        shipping_pincode: distributorData.shipping_pincode || '',
        gstin: distributorData.gstin || '',
        pan: distributorData.pan || '',
        aadhar: distributorData.aadhar || '',
        bank_account_number: distributorData.bank_account_number || '',
        bank_name: distributorData.bank_name || '',
        bank_branch: distributorData.bank_branch || '',
        bank_ifsc: distributorData.bank_ifsc || '',
        bank_account_type: distributorData.bank_account_type || '',
        google_location: distributorData.google_location || '',
        credit_limit: distributorData.credit_limit ? parseFloat(distributorData.credit_limit) : 0,
        credit_days: distributorData.credit_days || 0,
        is_active: distributorData.is_active,
        effective_from: distributorData.effective_from || '',
        effective_to: distributorData.effective_to || '',
        erp_code: distributorData.erp_code || '',
      });
      setSelectedCompany(
        (data.company_id || distributorData.company) && distributorData.company_name
          ? { id: data.company_id || distributorData.company, name: distributorData.company_name }
          : null
      );
      setSelectedCountry(
        (data.country_id || distributorData.country) && distributorData.country_name
          ? { id: data.country_id || distributorData.country, name: distributorData.country_name }
          : null
      );
      setSelectedState(
        (data.state_id || distributorData.state) && distributorData.state_name
          ? { id: data.state_id || distributorData.state, name: distributorData.state_name }
          : null
      );
      setSelectedDistrict(
        (data.district_id || distributorData.district) && distributorData.district_name
          ? { id: data.district_id || distributorData.district, name: distributorData.district_name }
          : null
      );
      setSelectedMandal(
        (data.mandal_id || distributorData.mandal) && distributorData.mandal_name
          ? { id: data.mandal_id || distributorData.mandal, name: distributorData.mandal_name }
          : null
      );
      setSelectedCity(
        (data.city_id || distributorData.city) && distributorData.city_name
          ? { id: data.city_id || distributorData.city, name: distributorData.city_name }
          : null
      );
      setSelectedArea(
        (data.area_id || distributorData.area) && distributorData.area_name
          ? { id: data.area_id || distributorData.area, name: distributorData.area_name }
          : null
      );
      setSelectedShippingCountry(
        (data.shipping_country_id || distributorData.shipping_country) && distributorData.shipping_country_name
          ? { id: data.shipping_country_id || distributorData.shipping_country, name: distributorData.shipping_country_name }
          : null
      );
      setSelectedShippingState(
        (data.shipping_state_id || distributorData.shipping_state) && distributorData.shipping_state_name
          ? { id: data.shipping_state_id || distributorData.shipping_state, name: distributorData.shipping_state_name }
          : null
      );
      setSelectedShippingDistrict(
        (data.shipping_district_id || distributorData.shipping_district) && distributorData.shipping_district_name
          ? { id: data.shipping_district_id || distributorData.shipping_district, name: distributorData.shipping_district_name }
          : null
      );
      setSelectedShippingMandal(
        (data.shipping_mandal_id || distributorData.shipping_mandal) && distributorData.shipping_mandal_name
          ? { id: data.shipping_mandal_id || distributorData.shipping_mandal, name: distributorData.shipping_mandal_name }
          : null
      );
      setSelectedShippingCity(
        (data.shipping_city_id || distributorData.shipping_city) && distributorData.shipping_city_name
          ? { id: data.shipping_city_id || distributorData.shipping_city, name: distributorData.shipping_city_name }
          : null
      );
      setSelectedShippingArea(
        (data.shipping_area_id || distributorData.shipping_area) && distributorData.shipping_area_name
          ? { id: data.shipping_area_id || distributorData.shipping_area, name: distributorData.shipping_area_name }
          : null
      );
      setSelectedSuperstockist(
        (data.superstockist_id || distributorData.superstockist) && distributorData.superstockist_name
          ? { id: data.superstockist_id || distributorData.superstockist, name: distributorData.superstockist_name }
          : null
      );
      setSelectedAgent(
        (data.agent_id || distributorData.agent) && distributorData.agent_name
          ? { id: data.agent_id || distributorData.agent, name: distributorData.agent_name }
          : null
      );
      
      // Load existing coverage areas from the main response
      if (distributorData.locations && distributorData.locations.length > 0) {
        const states: string[] = [];
        const districts: string[] = [];
        const mandals: string[] = [];
        const cities: string[] = [];
        const areas: string[] = [];
        
        distributorData.locations.forEach((loc: any) => {
          if (loc.state && !states.includes(loc.state.toString())) states.push(loc.state.toString());
          if (loc.district && !districts.includes(loc.district.toString())) districts.push(loc.district.toString());
          if (loc.mandal && !mandals.includes(loc.mandal.toString())) mandals.push(loc.mandal.toString());
          if (loc.city && !cities.includes(loc.city.toString())) cities.push(loc.city.toString());
          if (loc.area && !areas.includes(loc.area.toString())) areas.push(loc.area.toString());
        });
        
        setSelectedLocationStates(states);
        setSelectedLocationDistricts(districts);
        setSelectedLocationMandals(mandals);
        setSelectedLocationCities(cities);
        setSelectedLocationAreas(areas);
      }

      // Populate user account fields
      setUserUsername((data as any).user_username || '');
      setUserPhone((data as any).user_phone || '');
      setUserDeviceAccess((data as any).user_device_access || 3);
      setUserHasAllCompanies((data as any).user_has_all_companies || false);
      setUserHasAllLocations((data as any).user_has_all_locations || false);
      if ((data as any).user_groups && (data as any).user_groups.length > 0) {
        setUserGroupIds((data as any).user_groups.map((g: any) => ({ id: g.id, name: g.name })));
      }
      if ((data as any).user_companies && (data as any).user_companies.length > 0) {
        setUserSelectedCompanies((data as any).user_companies.map((c: any) => ({ id: c.id, name: c.name })));
      }
      if ((data as any).user_locations && (data as any).user_locations.length > 0) {
        setUserSelectedLocations((data as any).user_locations.map((l: any) => ({ id: l.id, name: l.name })));
      }
    }
  }, [distributorData, reset, id]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: distributorApi.createDistributor,
    onSuccess: async (newDistributor) => {
      // Create contacts if any
      if (tempContacts.length > 0) {
        await Promise.all(
          tempContacts.map(contact => 
            distributorApi.createContact(newDistributor.id, contact)
          )
        );
      }
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      toastSuccess('Distributor created successfully');
      setTimeout(() => {
        navigate('/masters/distributor');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create distributor';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.errors) {
          // Handle field-level validation errors
          const fieldErrors = Object.entries(data.errors)
            .map(([field, errors]: [string, any]) => {
              const errorList = Array.isArray(errors) ? errors : [errors];
              return `${field}: ${errorList.join(', ')}`;
            })
            .join('\n');
          errorMessage = `Validation failed:\n${fieldErrors}`;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        }
      }
      toastError(errorMessage);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: DistributorFormData) => distributorApi.updateDistributor(id!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributor', id] });
      toastSuccess('Distributor updated successfully');
      setTimeout(() => {
        navigate('/masters/distributor');
      }, 1000);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update distributor';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.errors) {
          const fieldErrors = Object.entries(data.errors)
            .map(([field, errors]: [string, any]) => {
              const errorList = Array.isArray(errors) ? errors : [errors];
              return `${field}: ${errorList.join(', ')}`;
            })
            .join('\n');
          errorMessage = `Validation failed:\n${fieldErrors}`;
        } else if (data.detail) {
          errorMessage = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.code) {
          errorMessage = Array.isArray(data.code) ? data.code[0] : data.code;
        }
      }
      toastError(errorMessage);
    },
  });

  const onSubmit = async (data: DistributorFormData) => {
    
    // Validate coverage areas
    if (selectedLocationStates.length === 0 && selectedLocationDistricts.length === 0 && selectedLocationMandals.length === 0 && selectedLocationCities.length === 0 && selectedLocationAreas.length === 0) {
      toastError('At least one coverage area must be selected');
      setActiveTab(1);
      return;
    }

    // Validate agent
    if (!selectedAgent) {
      setAgentError(true);
      toastError('Agent is required');
      return;
    }
    
    // Validate user account fields in create mode
    if (!isEditMode) {
      const newUserErrors: Record<string, string> = {};
      if (!userUsername.trim()) newUserErrors.username = 'Username is required';
      if (!userPhone.trim()) newUserErrors.phone = 'Phone number is required';
      if (!userPassword.trim()) newUserErrors.password = 'Password is required';
      if (userGroupIds.length === 0) newUserErrors.groups = 'At least one group is required';
      setUserErrors(newUserErrors);
      if (Object.keys(newUserErrors).length > 0) return;
    }

    // Clean up the data - convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      superstockist_id: data.superstockist_id || null,
      agent_id: selectedAgent?.id || null,
      city_id: data.city_id || null,
      area_id: data.area_id || null,
      shipping_state_id: data.shipping_state_id || null,
      shipping_city_id: data.shipping_city_id || null,
      shipping_area_id: data.shipping_area_id || null,
      effective_from: data.effective_from || null,
      effective_to: data.effective_to || null,
      gstin: data.gstin?.trim() || undefined,
      pan: data.pan?.trim() || undefined,
      aadhar: data.aadhar?.trim() || undefined,
    };
    
    // Add locations to the form data (UUIDs as strings)
    const formDataWithLocations = {
      ...cleanedData,
      location_states: selectedLocationStates,
      location_districts: selectedLocationDistricts,
      location_mandals: selectedLocationMandals,
      location_cities: selectedLocationCities,
      location_areas: selectedLocationAreas,
      ...(!isEditMode && {
        user_username: userUsername || undefined,
        user_password: userPassword || undefined,
      }),
      user_phone: userPhone || undefined,
      user_device_access: userDeviceAccess,
      user_group_ids: userGroupIds.map(g => g.id),
      user_company_ids: userHasAllCompanies ? [] : userSelectedCompanies.map(c => c.id),
      user_has_all_companies: userHasAllCompanies,
      user_location_ids: userHasAllLocations ? [] : userSelectedLocations.map(l => l.id),
      user_has_all_locations: userHasAllLocations,
    };
    
    // Remove undefined values
    Object.keys(formDataWithLocations).forEach(key => {
      if (formDataWithLocations[key as keyof typeof formDataWithLocations] === undefined) {
        delete formDataWithLocations[key as keyof typeof formDataWithLocations];
      }
    });
    
    // Check if there are any valid attachment files (must be File instances with size > 0)
    const hasAttachments = Object.values(attachmentFiles).some(
      file => file && file instanceof File && file.size > 0
    );
    
    
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(formDataWithLocations as any);
      } else {
        
        if (hasAttachments) {
          // Send as FormData with attachments
          const formData = new FormData();
          formData.append('data', JSON.stringify(formDataWithLocations));
          
          // Only append files that are valid File objects with size > 0
          let attachmentCount = 0;
          Object.entries(attachmentFiles).forEach(([type, file]) => {
            if (file && file instanceof File && file.size > 0) {
              formData.append(type.toLowerCase(), file);
              attachmentCount++;
            }
          });
          
          
          // Double-check we actually have attachments to send
          if (attachmentCount === 0) {
            await createMutation.mutateAsync(formDataWithLocations as any);
          } else {
            await createMutation.mutateAsync(formData as any);
          }
        } else {
          // Send as JSON without attachments
          await createMutation.mutateAsync(formDataWithLocations as any);
        }
      }
    } catch (error) {
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, attachmentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isEditMode) {
      // In create mode, store file locally
      setAttachmentFiles(prev => ({ ...prev, [attachmentType]: file }));
      toastSuccess('Attachment added');
      return;
    }

    // In edit mode, upload immediately
    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachment_type', attachmentType);

    try {
      await apiClient.post(`/api/masters/distributors/${id}/upload_attachment/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toastSuccess('Attachment uploaded successfully');
      refetchAttachments();
    } catch (error: any) {
      toastError(error.response?.data?.detail || 'Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!id) return;
    try {
      await apiClient.delete(`/api/masters/distributors/${id}/attachments/${attachmentId}/`);
      toastSuccess('Attachment deleted successfully');
      refetchAttachments();
    } catch (error: any) {
      toastError(error.response?.data?.detail || 'Failed to delete attachment');
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setContactDialogOpen(true);
  };

  const handleEditContact = (contact: LocationContact) => {
    setEditingContact(contact);
    setContactDialogOpen(true);
  };

  const handleDeleteContact = (contactId: string) => {
    if (isEditMode) {
      deleteContactMutation.mutate(contactId);
    } else {
      setTempContacts(prev => prev.filter(c => c.id !== contactId));
    }
  };

  const handleContactSubmit = async (data: LocationContactFormData) => {
    if (isEditMode) {
      if (editingContact) {
        await updateContactMutation.mutateAsync({ contactId: editingContact.id, data });
      } else {
        await createContactMutation.mutateAsync(data);
      }
    } else {
      if (editingContact) {
        setTempContacts(prev => prev.map(c => 
          c.id === editingContact.id ? { ...c, ...data } : c
        ));
      } else {
        setTempContacts(prev => [...prev, { id: generateClientId(), ...data }]);
      }
    }
    setContactDialogOpen(false);
    setEditingContact(null);
  };

  // Geographic master creation handlers
  const handleCountryCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createCountryMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleStateCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createStateMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleDistrictCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createDistrictMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleMandalCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createMandalMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleCityCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createCityMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleAreaCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createAreaMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  // Shipping address creation handlers
  const handleShippingCountryCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createShippingCountryMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleShippingStateCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createShippingStateMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleShippingDistrictCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createShippingDistrictMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleShippingMandalCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createShippingMandalMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleShippingCityCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createShippingCityMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const handleShippingAreaCreate = async (data: any) => {
    return new Promise<void>((resolve) => {
      createShippingAreaMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const getAttachmentsByType = (type: string) => {
    return attachments.filter((att: any) => att.attachment_type === type);
  };

  const renderAttachmentSection = (type: string, label: string, allowMultiple: boolean = false) => {
    const typeAttachments = getAttachmentsByType(type);
    const selectedFile = attachmentFiles[type];
    const canUpload = (allowMultiple || typeAttachments.length === 0) && !selectedFile;

    const isImageFile = (fileUrl: string) => {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'];
      return imageExtensions.some(ext => fileUrl.toLowerCase().endsWith(ext));
    };

    return (
      <Box sx={{ mb: 0 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          {label}
        </Typography>
        <Box>
          {typeAttachments.map((att: any) => (
            <Card key={att.id}>
              {att.file_url && isImageFile(att.file_url) && (
                <Box
                  component="img"
                  src={att.file_url}
                  alt={att.attachment_type}
                  sx={{ width: '100%', height: 120, objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" noWrap>
                    {att.original_filename || att.file.split('/').pop()}
                  </Typography>
                </Box>
                {att.description && (
                  <Typography variant="caption" color="text.secondary">
                    {att.description}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                <Button size="small" href={att.file_url} target="_blank">
                  View
                </Button>
                <IconButton size="small" color="error" onClick={() => handleDeleteAttachment(att.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
          {selectedFile && (
            <Card>
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" noWrap>
                    {selectedFile.name}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton size="small" color="error" onClick={() => setAttachmentFiles(prev => { const newFiles = {...prev}; delete newFiles[type]; return newFiles; })}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          )}
          {canUpload && (
            <Card sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed', borderColor: 'divider' }}>
              <CardContent>
                <input
                  style={{ display: 'none' }}
                  id={`upload-${type}`}
                  type="file"
                  onChange={(e) => handleFileUpload(e, type)}
                  disabled={uploadingAttachment}
                />
                <label htmlFor={`upload-${type}`}>
                  <Button
                    component="span"
                    startIcon={<UploadIcon />}
                    disabled={uploadingAttachment}
                    size="small"
                  >
                    Upload
                  </Button>
                </label>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    );
  };

  const handleBack = () => {
    navigate('/masters/distributor');
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingDistributor) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Fixed Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <ScreenHeader
            title={isEditMode ? 'Edit Distributor' : 'Add Distributor'}
            showBackButton
            onBack={handleBack}
            disableBox
          />
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="distributor-form"
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                // Validate user account fields first in create mode
                if (!isEditMode) {
                  const newUserErrors: Record<string, string> = {};
                  if (!userUsername.trim()) newUserErrors.username = 'Username is required';
                  if (!userPhone.trim()) newUserErrors.phone = 'Phone number is required';
                  if (!userPassword.trim()) newUserErrors.password = 'Password is required';
                  if (userGroupIds.length === 0) newUserErrors.groups = 'At least one group is required';
                  setUserErrors(newUserErrors);
                }
                handleSubmit(onSubmit)();
              }}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ borderRadius: 0 }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_e, newValue) => {
              // Validate mandatory fields when moving from General Info to other tabs
              if (activeTab === 0 && newValue > 0) {
                const name = watch('name');
                const companyId = watch('company_id');
                const countryId = watch('country_id');
                const stateId = watch('state_id');
                const districtId = watch('district_id');
                const mandalId = watch('mandal_id');
                const cityId = watch('city_id');
                const areaId = watch('area_id');
                const missing: string[] = [];
                if (!name?.trim()) missing.push('Name');
                if (!companyId) missing.push('Company');
                if (!countryId) missing.push('Country');
                if (!stateId) missing.push('State');
                if (!districtId) missing.push('District');
                if (!mandalId) missing.push('Mandal');
                if (!cityId) missing.push('City');
                if (!areaId) missing.push('Village/Town');
                if (missing.length > 0) {
                  toastError(`Please fill mandatory fields: ${missing.join(', ')}`);
                  return;
                }
              }
              setActiveTab(newValue);
            }}>
              <Tab label="General Information" />
              <Tab label="Coverage Areas" />
              <Tab label="Attachments" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <form id="distributor-form" onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ p: 3, position: 'relative' }}>
              {/* Tab 1: General Information */}
              <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
                <Box>
                  {/* Basic Information Section */}
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                    Basic Information
                  </Typography>
            <Grid container spacing={3}>
              {/* Code */}
              {/* <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Code
                </Typography>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., DIS001"
                      fullWidth
                      size="small"
                      error={!!errors.code}
                      helperText={errors.code?.message || 'Leave empty for auto-generation'}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
              </Grid> */}

              {/* Name */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{
                    required: 'Name is required',
                    maxLength: {
                      value: 200,
                      message: 'Name must not exceed 200 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., ABC Distributors"
                      fullWidth
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Company */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Company <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="company_id"
                  control={control}
                  rules={{ required: 'Company is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.COMPANIES_DROPDOWN}
                      value={selectedCompany}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCompany(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      error={!!errors.company_id}
                      helperText={errors.company_id?.message}
                      disabled={isSubmitting}
                      placeholder="Select a company"
                    />
                  )}
                />
              </Grid>

              {/* Superstockist - Only show if enabled */}
              {channelConfig?.enable_superstockist && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                  >
                    Superstockist
                    {channelConfig?.enforce_channel_hierarchy && channelConfig?.enable_superstockist && (
                      <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}> *</Box>
                    )}
                  </Typography>
                  <Controller
                    name="superstockist_id"
                    control={control}
                    rules={{
                      required: channelConfig?.enforce_channel_hierarchy && channelConfig?.enable_superstockist
                        ? 'Superstockist is required when hierarchy is enforced'
                        : false,
                    }}
                    render={({ field: { onChange } }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={API_ENDPOINTS.SUPERSTOCKISTS}
                        value={selectedSuperstockist}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedSuperstockist(selectedOption);
                          onChange(selectedOption?.id || '');
                        }}
                        error={!!errors.superstockist_id}
                        helperText={errors.superstockist_id?.message}
                        disabled={isSubmitting}
                        placeholder={channelConfig?.enforce_channel_hierarchy && channelConfig?.enable_superstockist ? "Select a superstockist" : "Select a superstockist (optional)"}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Agent/Broker */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Agent/Broker <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <SearchableDropdownWithCreate
                  label=""
                  apiEndpoint={API_ENDPOINTS.AGENTS + 'mini/'}
                  value={selectedAgent}
                  onChange={(selectedOption: DropdownOption | null) => {
                    setSelectedAgent(selectedOption);
                    setAgentError(false);
                  }}
                  onCreateClick={() => setAgentFormOpen(true)}
                  disabled={isSubmitting}
                  placeholder="Select an agent"
                  error={agentError}
                  helperText={agentError ? 'Agent is required' : ''}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Contact Information Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Contact Information
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddContact}
                size="small"
              >
                Add Contact
              </Button>
            </Box>
            
            <LocationContactTable
              contacts={isEditMode ? (contacts || []) : tempContacts}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              isLoading={isEditMode && (createContactMutation.isPending || updateContactMutation.isPending || deleteContactMutation.isPending)}
            />

            <Divider sx={{ my: 3 }} />

            {/* Billing Address Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Billing Address
            </Typography>
            <Grid container spacing={3}>
              {/* Country */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Country <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="country_id"
                  control={control}
                  rules={{ required: 'Country is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.COUNTRIES}
                      value={selectedCountry}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCountry(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedState(null);
                        setSelectedDistrict(null);
                        setSelectedMandal(null);
                        setSelectedCity(null);
                        setSelectedArea(null);
                        setValue('state_id', '');
                        setValue('district_id', '');
                        setValue('mandal_id', '');
                        setValue('city_id', '');
                        setValue('area_id', '');
                      }}
                      onCreateClick={() => setCountryFormOpen(true)}
                      error={!!errors.country_id}
                      helperText={errors.country_id?.message}
                      disabled={isSubmitting}
                      placeholder="Select a country"
                    />
                  )}
                />
              </Grid>

              {/* State */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  State <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="state_id"
                  control={control}
                  rules={{ required: 'State is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedState}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedState(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedDistrict(null);
                        setSelectedMandal(null);
                        setSelectedCity(null);
                        setSelectedArea(null);
                        setValue('district_id', '');
                        setValue('mandal_id', '');
                        setValue('city_id', '');
                        setValue('area_id', '');
                      }}
                      onCreateClick={() => setStateFormOpen(true)}
                      additionalFilters={selectedCountry ? { country: selectedCountry.id } : undefined}
                      disabled={isSubmitting || !selectedCountry}
                      placeholder={selectedCountry ? "Select a state" : "Select country first"}
                      error={!!errors.state_id}
                      helperText={errors.state_id?.message}
                    />
                  )}
                />
              </Grid>

              {/* District */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  District <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="district_id"
                  control={control}
                  rules={{ required: 'District is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.DISTRICTS}
                      value={selectedDistrict}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedDistrict(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedMandal(null);
                        setSelectedCity(null);
                        setSelectedArea(null);
                        setValue('mandal_id', '');
                        setValue('city_id', '');
                        setValue('area_id', '');
                      }}
                      onCreateClick={() => setDistrictFormOpen(true)}
                      additionalFilters={selectedState ? { state: selectedState.id } : undefined}
                      disabled={isSubmitting || !selectedState}
                      placeholder={selectedState ? "Select a district" : "Select state first"}
                      error={!!errors.district_id}
                      helperText={errors.district_id?.message}
                    />
                  )}
                />
              </Grid>

              {/* Mandal */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Mandal <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="mandal_id"
                  control={control}
                  rules={{ required: 'Mandal is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.MANDALS}
                      value={selectedMandal}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedMandal(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedCity(null);
                        setSelectedArea(null);
                        setValue('city_id', '');
                        setValue('area_id', '');
                      }}
                      onCreateClick={() => setMandalFormOpen(true)}
                      additionalFilters={selectedDistrict ? { district: selectedDistrict.id } : undefined}
                      disabled={isSubmitting || !selectedDistrict}
                      placeholder={selectedDistrict ? "Select a mandal" : "Select district first"}
                      error={!!errors.mandal_id}
                      helperText={errors.mandal_id?.message}
                    />
                  )}
                />
              </Grid>

              {/* City */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  City <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="city_id"
                  control={control}
                  rules={{ required: 'City is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.CITIES}
                      value={selectedCity}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCity(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear area when city changes
                        setSelectedArea(null);
                        setValue('area_id', '');
                      }}
                      onCreateClick={() => setCityFormOpen(true)}
                      additionalFilters={selectedMandal ? { mandal: selectedMandal.id } : undefined}
                      disabled={isSubmitting || !selectedMandal}
                      placeholder={selectedMandal ? "Select a city" : "Select mandal first"}
                      error={Boolean(errors.city_id)}
                      helperText={errors.city_id?.message}
                    />
                  )}
                />
              </Grid>

              {/* Village/Town (Area) */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Village/Town <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="area_id"
                  control={control}
                  rules={{ required: 'Village/Town is required' }}
                  render={({ field: { onChange }, fieldState: { error } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.AREAS}
                      value={selectedArea}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedArea(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      onCreateClick={() => setAreaFormOpen(true)}
                      additionalFilters={selectedCity ? { city: selectedCity.id } : undefined}
                      disabled={isSubmitting || !selectedCity}
                      placeholder={selectedCity ? "Select a village/town" : "Select city first"}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid>

              {/* Street */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Street
                </Typography>
                <Controller
                  name="street"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 200,
                      message: 'Street must not exceed 200 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter street name"
                      fullWidth
                      size="small"
                      error={!!errors.street}
                      helperText={errors.street?.message}
                      disabled={isSubmitting}
                      inputProps={{ maxLength: 200 }}
                    />
                  )}
                />
              </Grid>

              {/* Billing Address */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Address
                </Typography>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter full billing address"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Billing Pincode */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Pincode
                </Typography>
                <Controller
                  name="pincode"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: 'Pincode must be 6 digits',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 500001"
                      fullWidth
                      size="small"
                      error={!!errors.pincode}
                      helperText={errors.pincode?.message}
                      disabled={isSubmitting}
                      inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Shipping Address Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Shipping Address
            </Typography>
            
            {/* Same as Billing Address Checkbox */}
            <Box sx={{ mb: 2 }}>
              <Controller
                name="shipping_same_as_billing"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                      />
                    }
                    label="Same as Billing Address"
                  />
                )}
              />
            </Box>

            <Grid container spacing={3}>
              {/* Shipping Country */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping Country
                </Typography>
                <Controller
                  name="shipping_country_id"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.COUNTRIES}
                      value={selectedShippingCountry}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedShippingCountry(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedShippingState(null);
                        setSelectedShippingDistrict(null);
                        setSelectedShippingMandal(null);
                        setSelectedShippingCity(null);
                        setSelectedShippingArea(null);
                        setValue('shipping_state_id', '');
                        setValue('shipping_district_id', '');
                        setValue('shipping_mandal_id', '');
                        setValue('shipping_city_id', '');
                        setValue('shipping_area_id', '');
                      }}
                      onCreateClick={() => setShippingCountryFormOpen(true)}
                      disabled={isSubmitting || watch('shipping_same_as_billing')}
                      placeholder="Select a country"
                    />
                  )}
                />
              </Grid>

              {/* Shipping State */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping State
                </Typography>
                <Controller
                  name="shipping_state_id"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedShippingState}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedShippingState(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedShippingDistrict(null);
                        setSelectedShippingMandal(null);
                        setSelectedShippingCity(null);
                        setSelectedShippingArea(null);
                        setValue('shipping_district_id', '');
                        setValue('shipping_mandal_id', '');
                        setValue('shipping_city_id', '');
                        setValue('shipping_area_id', '');
                      }}
                      onCreateClick={() => setShippingStateFormOpen(true)}
                      additionalFilters={selectedShippingCountry ? { country: selectedShippingCountry.id } : undefined}
                      disabled={isSubmitting || watch('shipping_same_as_billing') || !selectedShippingCountry}
                      placeholder={selectedShippingCountry ? "Select a state" : "Select country first"}
                    />
                  )}
                />
              </Grid>

              {/* Shipping District */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping District
                </Typography>
                <Controller
                  name="shipping_district_id"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.DISTRICTS}
                      value={selectedShippingDistrict}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedShippingDistrict(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedShippingMandal(null);
                        setSelectedShippingCity(null);
                        setSelectedShippingArea(null);
                        setValue('shipping_mandal_id', '');
                        setValue('shipping_city_id', '');
                        setValue('shipping_area_id', '');
                      }}
                      onCreateClick={() => setShippingDistrictFormOpen(true)}
                      additionalFilters={selectedShippingState ? { state: selectedShippingState.id } : undefined}
                      disabled={isSubmitting || watch('shipping_same_as_billing') || !selectedShippingState}
                      placeholder={selectedShippingState ? "Select a district" : "Select state first"}
                    />
                  )}
                />
              </Grid>

              {/* Shipping Mandal */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping Mandal
                </Typography>
                <Controller
                  name="shipping_mandal_id"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.MANDALS}
                      value={selectedShippingMandal}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedShippingMandal(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear dependent fields
                        setSelectedShippingCity(null);
                        setSelectedShippingArea(null);
                        setValue('shipping_city_id', '');
                        setValue('shipping_area_id', '');
                      }}
                      onCreateClick={() => setShippingMandalFormOpen(true)}
                      additionalFilters={selectedShippingDistrict ? { district: selectedShippingDistrict.id } : undefined}
                      disabled={isSubmitting || watch('shipping_same_as_billing') || !selectedShippingDistrict}
                      placeholder={selectedShippingDistrict ? "Select a mandal" : "Select district first"}
                    />
                  )}
                />
              </Grid>

              {/* Shipping City */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping City
                </Typography>
                <Controller
                  name="shipping_city_id"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.CITIES}
                      value={selectedShippingCity}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedShippingCity(selectedOption);
                        onChange(selectedOption?.id || '');
                        // Clear area when city changes
                        setSelectedShippingArea(null);
                        setValue('shipping_area_id', '');
                      }}
                      onCreateClick={() => setShippingCityFormOpen(true)}
                      additionalFilters={selectedShippingMandal ? { mandal: selectedShippingMandal.id } : undefined}
                      disabled={isSubmitting || watch('shipping_same_as_billing') || !selectedShippingMandal}
                      placeholder={selectedShippingMandal ? "Select a city" : "Select mandal first"}
                    />
                  )}
                />
              </Grid>

              {/* Shipping Village/Town (Area) */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping Village/Town
                </Typography>
                <Controller
                  name="shipping_area_id"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdownWithCreate
                      label=""
                      apiEndpoint={API_ENDPOINTS.AREAS}
                      value={selectedShippingArea}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedShippingArea(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      onCreateClick={() => setShippingAreaFormOpen(true)}
                      additionalFilters={selectedShippingCity ? { city: selectedShippingCity.id } : undefined}
                      disabled={isSubmitting || watch('shipping_same_as_billing') || !selectedShippingCity}
                      placeholder={selectedShippingCity ? "Select a village/town" : "Select city first"}
                    />
                  )}
                />
              </Grid>

              {/* Shipping Street */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Shipping Street
                </Typography>
                <Controller
                  name="shipping_street"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 200,
                      message: 'Street must not exceed 200 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter street name"
                      fullWidth
                      size="small"
                      error={!!errors.shipping_street}
                      helperText={errors.shipping_street?.message}
                      disabled={isSubmitting || watch('shipping_same_as_billing')}
                      inputProps={{ maxLength: 200 }}
                    />
                  )}
                />
              </Grid>

              {/* Shipping Address */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Address
                </Typography>
                <Controller
                  name="shipping_address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Enter full shipping address"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      disabled={isSubmitting || watch('shipping_same_as_billing')}
                    />
                  )}
                />
              </Grid>

              {/* Shipping Pincode */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Pincode
                </Typography>
                <Controller
                  name="shipping_pincode"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: 'Pincode must be 6 digits',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 500001"
                      fullWidth
                      size="small"
                      error={!!errors.shipping_pincode}
                      helperText={errors.shipping_pincode?.message}
                      disabled={isSubmitting || watch('shipping_same_as_billing')}
                      inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Financial Information Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Financial Information
            </Typography>
            <Grid container spacing={3}>
              {/* GSTIN */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  GSTIN
                </Typography>
                <Controller
                  name="gstin"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                      message: 'Invalid GSTIN format',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 29ABCDE1234F1Z5"
                      fullWidth
                      size="small"
                      error={!!errors.gstin}
                      helperText={errors.gstin?.message}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      inputProps={{ maxLength: 15 }}
                    />
                  )}
                />
              </Grid>

              {/* PAN */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  PAN
                </Typography>
                <Controller
                  name="pan"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                      message: 'Invalid PAN format',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., ABCDE1234F"
                      fullWidth
                      size="small"
                      error={!!errors.pan}
                      helperText={errors.pan?.message}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      inputProps={{ maxLength: 10 }}
                    />
                  )}
                />
              </Grid>

              {/* Aadhar */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Aadhar Number
                </Typography>
                <Controller
                  name="aadhar"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{12}$/,
                      message: 'Aadhar must be 12 digits',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(value);
                      }}
                      placeholder="e.g., 123456789012"
                      fullWidth
                      size="small"
                      error={!!errors.aadhar}
                      helperText={errors.aadhar?.message}
                      disabled={isSubmitting}
                      inputProps={{ inputMode: 'numeric', maxLength: 12 }}
                    />
                  )}
                />
              </Grid>

              {/* Credit Limit */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Credit Limit (₹)
                </Typography>
                <Controller
                  name="credit_limit"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 100000"
                      fullWidth
                      size="small"
                      type="number"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Credit Days */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Credit Days
                </Typography>
                <Controller
                  name="credit_days"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 30"
                      fullWidth
                      size="small"
                      type="number"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Bank Details Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Bank Details
            </Typography>
            <Grid container spacing={3}>
              {/* Bank Account Number */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Account Number
                </Typography>
                <Controller
                  name="bank_account_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., 1234567890"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Bank Name */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Bank Name
                </Typography>
                <Controller
                  name="bank_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., State Bank of India"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* Bank Branch */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Branch
                </Typography>
                <Controller
                  name="bank_branch"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Main Branch"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>

              {/* IFSC Code */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  IFSC Code
                </Typography>
                <Controller
                  name="bank_ifsc"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                      message: 'Invalid IFSC format',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., SBIN0001234"
                      fullWidth
                      size="small"
                      error={!!errors.bank_ifsc}
                      helperText={errors.bank_ifsc?.message}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      inputProps={{ maxLength: 11 }}
                    />
                  )}
                />
              </Grid>

              {/* Account Type */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Account Type
                </Typography>
                <Controller
                  name="bank_account_type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    >
                      <MenuItem value="">Select Type</MenuItem>
                      <MenuItem value="SAVINGS">Savings</MenuItem>
                      <MenuItem value="CURRENT">Current</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              {/* Google Location */}
              <Grid size={{ xs: 12, sm: 6, md: 9 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Google Location
                </Typography>
                <Controller
                  name="google_location"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., https://maps.google.com/?q=..."
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* User Account Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              User Account
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>Username {!isEditMode && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}</Typography>
                <TextField value={userUsername} onChange={(e) => { setUserUsername(e.target.value); setUserErrors(prev => { const n = {...prev}; delete n.username; return n; }); }} placeholder="Enter username" fullWidth size="small" disabled={isSubmitting || isEditMode} error={!!userErrors.username} helperText={userErrors.username} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>Phone {!isEditMode && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}</Typography>
                <TextField value={userPhone} onChange={(e) => { setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setUserErrors(prev => { const n = {...prev}; delete n.phone; return n; }); }} placeholder="e.g., 9876543210" fullWidth size="small" disabled={isSubmitting} error={!!userErrors.phone} helperText={userErrors.phone} />
              </Grid>
              {!isEditMode && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>Password <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box></Typography>
                  <TextField value={userPassword} onChange={(e) => { setUserPassword(e.target.value); setUserErrors(prev => { const n = {...prev}; delete n.password; return n; }); }} placeholder="Enter password" type="password" fullWidth size="small" disabled={isSubmitting} error={!!userErrors.password} helperText={userErrors.password} />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>Device Access</Typography>
                <TextField select value={userDeviceAccess} onChange={(e) => setUserDeviceAccess(Number(e.target.value))} fullWidth size="small" disabled={isSubmitting}>
                  <MenuItem value={1}>Only Mobile</MenuItem>
                  <MenuItem value={2}>Only Web</MenuItem>
                  <MenuItem value={3}>Both</MenuItem>
                  <MenuItem value={4}>None</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>Groups {!isEditMode && <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>}</Typography>
                <SearchableDropdown label="" apiEndpoint="/api/users/groups/" value={userGroupIds} onChange={(v) => { setUserGroupIds(Array.isArray(v) ? v : []); setUserErrors(prev => { const n = {...prev}; delete n.groups; return n; }); }} disabled={isSubmitting} placeholder="Select groups" multiple size="small" error={!!userErrors.groups} helperText={userErrors.groups} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>Companies</Typography>
                  <FormControlLabel control={<Switch checked={userHasAllCompanies} onChange={(e) => { setUserHasAllCompanies(e.target.checked); if (e.target.checked) setUserSelectedCompanies([]); }} disabled={isSubmitting} size="small" />} label="All Companies" />
                </Box>
                <SearchableDropdown label="" apiEndpoint="/api/usermanagement/dropdowns/companies/" value={userSelectedCompanies} onChange={(v) => setUserSelectedCompanies(Array.isArray(v) ? v : [])} disabled={isSubmitting || userHasAllCompanies} placeholder={userHasAllCompanies ? "All companies selected" : "Select companies"} multiple size="small" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>Locations</Typography>
                  <FormControlLabel control={<Switch checked={userHasAllLocations} onChange={(e) => { setUserHasAllLocations(e.target.checked); if (e.target.checked) setUserSelectedLocations([]); }} disabled={isSubmitting || (!userHasAllCompanies && userSelectedCompanies.length === 0)} size="small" />} label="All Locations" />
                </Box>
                <SearchableDropdown label="" apiEndpoint="/api/usermanagement/dropdowns/locations/" additionalFilters={!userHasAllCompanies && userSelectedCompanies.length > 0 ? { company_ids: userSelectedCompanies.map(c => c.id).join(',') } : {}} value={userSelectedLocations} onChange={(v) => setUserSelectedLocations(Array.isArray(v) ? v : [])} disabled={isSubmitting || userHasAllLocations || (!userHasAllCompanies && userSelectedCompanies.length === 0)} placeholder={userHasAllLocations ? "All locations selected" : (!userHasAllCompanies && userSelectedCompanies.length === 0) ? "Select companies first" : "Select locations"} multiple size="small" />
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />

            {/* Status & Other Information Section - Commented out
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Status & Other Information
            </Typography>
            <Grid container spacing={3}>
              {/* Active Status */}
              {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      }
                      label="Active"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Effective From
                </Typography>
                <Controller
                  name="effective_from"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      format="DD-MM-YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                      disabled={isSubmitting}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          InputLabelProps: { shrink: true },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Effective To
                </Typography>
                <Controller
                  name="effective_to"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      format="DD-MM-YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                      disabled={isSubmitting}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          InputLabelProps: { shrink: true },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  ERP Code
                </Typography>
                <Controller
                  name="erp_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., ERP001"
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
              </Grid>
            */}
                </Box>
              </Box>

              {/* Tab 2: Coverage Areas */}
              <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Select the states, districts, mandals, cities, and areas this distributor operates in
                  </Typography>
                  <LocationCascadeSelector
                    selectedStates={selectedLocationStates}
                    selectedDistricts={selectedLocationDistricts}
                    selectedMandals={selectedLocationMandals}
                    selectedCities={selectedLocationCities}
                    selectedAreas={selectedLocationAreas}
                    onSelectionChange={(selection) => {
                      setSelectedLocationStates(selection.states);
                      setSelectedLocationDistricts(selection.districts);
                      setSelectedLocationMandals(selection.mandals);
                      setSelectedLocationCities(selection.cities);
                      setSelectedLocationAreas(selection.areas);
                    }}
                  />
                  {(selectedLocationStates.length > 0 || selectedLocationDistricts.length > 0 || selectedLocationMandals.length > 0 || selectedLocationCities.length > 0 || selectedLocationAreas.length > 0) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {selectedLocationStates.length} states, {selectedLocationDistricts.length} districts, {selectedLocationMandals.length} mandals, {selectedLocationCities.length} cities, {selectedLocationAreas.length} areas selected
                      </Typography>
                    </Box>
                )}
              </Box>
              </Box>

              {/* Tab 3: Attachments */}
              <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
                <Box>
                  {uploadingAttachment && (
                    <Box sx={{ mb: 2 }}>
                      <Alert severity="info">Uploading attachment...</Alert>
                    </Box>
                  )}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                    {renderAttachmentSection('AADHAR', 'Aadhar Card')}
                    {renderAttachmentSection('PAN', 'PAN Card')}
                    {renderAttachmentSection('AGREEMENT', 'Agreement')}
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                    {renderAttachmentSection('SHOP_PICTURE', 'Shop Picture')}
                    {renderAttachmentSection('CANCELLED_CHEQUE', 'Cancelled Cheque')}
                    {renderAttachmentSection('OWNER_PICTURE', 'Owner Picture')}
                  </Box>
                  {renderAttachmentSection('OTHER', 'Other Documents', true)}
                </Box>
              </Box>
          </Box>
          </form>
        </Paper>
      </Box>

      <LocationContactDialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        onSubmit={handleContactSubmit}
        initialData={editingContact}
        isSubmitting={isEditMode && (createContactMutation.isPending || updateContactMutation.isPending)}
      />

      {/* Billing Address Form Dialogs */}
      <CountryFormDialog
        open={countryFormOpen}
        onClose={() => setCountryFormOpen(false)}
        onSubmit={handleCountryCreate}
        loading={createCountryMutation.isPending}
      />

      <StateFormDialog
        open={stateFormOpen}
        onClose={() => setStateFormOpen(false)}
        onSubmit={handleStateCreate}
        loading={createStateMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
      />

      <DistrictFormDialog
        open={districtFormOpen}
        onClose={() => setDistrictFormOpen(false)}
        onSubmit={handleDistrictCreate}
        loading={createDistrictMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
      />

      <MandalFormDialog
        open={mandalFormOpen}
        onClose={() => setMandalFormOpen(false)}
        onSubmit={handleMandalCreate}
        loading={createMandalMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
        prefilledDistrictId={selectedDistrict?.id ? String(selectedDistrict.id) : undefined}
      />

      <CityFormDialog
        open={cityFormOpen}
        onClose={() => setCityFormOpen(false)}
        onSubmit={handleCityCreate}
        loading={createCityMutation.isPending}
        prefilledCountryId={selectedCountry?.id ? String(selectedCountry.id) : undefined}
        prefilledStateId={selectedState?.id ? String(selectedState.id) : undefined}
        prefilledDistrictId={selectedDistrict?.id ? String(selectedDistrict.id) : undefined}
        prefilledMandalId={selectedMandal?.id ? String(selectedMandal.id) : undefined}
      />

      <AreaFormDialog
        open={areaFormOpen}
        onClose={() => setAreaFormOpen(false)}
        onSubmit={handleAreaCreate}
        loading={createAreaMutation.isPending}
      />

      {/* Shipping Address Form Dialogs */}
      <CountryFormDialog
        open={shippingCountryFormOpen}
        onClose={() => setShippingCountryFormOpen(false)}
        onSubmit={handleShippingCountryCreate}
        loading={createShippingCountryMutation.isPending}
      />

      <StateFormDialog
        open={shippingStateFormOpen}
        onClose={() => setShippingStateFormOpen(false)}
        onSubmit={handleShippingStateCreate}
        loading={createShippingStateMutation.isPending}
        prefilledCountryId={selectedShippingCountry?.id ? String(selectedShippingCountry.id) : undefined}
      />

      <DistrictFormDialog
        open={shippingDistrictFormOpen}
        onClose={() => setShippingDistrictFormOpen(false)}
        onSubmit={handleShippingDistrictCreate}
        loading={createShippingDistrictMutation.isPending}
        prefilledCountryId={selectedShippingCountry?.id ? String(selectedShippingCountry.id) : undefined}
        prefilledStateId={selectedShippingState?.id ? String(selectedShippingState.id) : undefined}
      />

      <MandalFormDialog
        open={shippingMandalFormOpen}
        onClose={() => setShippingMandalFormOpen(false)}
        onSubmit={handleShippingMandalCreate}
        loading={createShippingMandalMutation.isPending}
        prefilledCountryId={selectedShippingCountry?.id ? String(selectedShippingCountry.id) : undefined}
        prefilledStateId={selectedShippingState?.id ? String(selectedShippingState.id) : undefined}
        prefilledDistrictId={selectedShippingDistrict?.id ? String(selectedShippingDistrict.id) : undefined}
      />

      <CityFormDialog
        open={shippingCityFormOpen}
        onClose={() => setShippingCityFormOpen(false)}
        onSubmit={handleShippingCityCreate}
        loading={createShippingCityMutation.isPending}
        prefilledCountryId={selectedShippingCountry?.id ? String(selectedShippingCountry.id) : undefined}
        prefilledStateId={selectedShippingState?.id ? String(selectedShippingState.id) : undefined}
        prefilledDistrictId={selectedShippingDistrict?.id ? String(selectedShippingDistrict.id) : undefined}
        prefilledMandalId={selectedShippingMandal?.id ? String(selectedShippingMandal.id) : undefined}
      />

      <AreaFormDialog
        open={shippingAreaFormOpen}
        onClose={() => setShippingAreaFormOpen(false)}
        onSubmit={handleShippingAreaCreate}
        loading={createShippingAreaMutation.isPending}
      />

      <AgentFormDialog
        open={agentFormOpen}
        onClose={() => setAgentFormOpen(false)}
        onSubmit={async (data) => {
          const newAgent = await agentApi.createAgent(data);
          setSelectedAgent({ id: newAgent.id, name: newAgent.name });
          setAgentError(false);
          setAgentFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['agents'] });
          toastSuccess('Agent created successfully');
        }}
      />
    </Box>
  );
};

const DistributorFormWithGuard: React.FC = () => (
  <ChannelPartnerGuard partnerType="distributor">
    <DistributorForm />
  </ChannelPartnerGuard>
);

export default DistributorFormWithGuard;
