/**
 * Receipt Report Page
 * Comprehensive receipt reporting with advanced filtering and export capabilities
 */

import React, { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Typography,
  Autocomplete,
  Chip,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Tooltip,
  Collapse,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import {
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { receiptReportApi } from "../../api/receiptReport.api";
import { companyApi, locationApi, agentApi } from "../../api/masters.api";
import { useBreadcrumbs } from "../../contexts/BreadcrumbContext";
import { usePageTitle } from "../../hooks";
import { useNavigate } from "react-router-dom";
import type {
  ReceiptReportParams,
  CustomerTypeOption,
  PaymentModeOption,
  AuthorizationStatusOption,
  DatePresetOption,
  CompanyOption,
  LocationOption,
} from "../../types/receiptReport.types";
import toast from "react-hot-toast";
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from "../../utils/spacing";
import { format } from "date-fns";
import dayjs from "dayjs";

// Static filter options — defined outside component to avoid re-creation on each render
const CUSTOMER_TYPES: CustomerTypeOption[] = [
  { value: "RETAILER", label: "Retailer" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "SUPERSTOCKIST", label: "Superstockist" },
];

const PAYMENT_MODES: PaymentModeOption[] = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "NEFT", label: "NEFT" },
  { value: "RTGS", label: "RTGS" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "CREDIT", label: "Credit" },
];

const AUTHORIZATION_STATUSES: AuthorizationStatusOption[] = [
  // { value: "0", label: "Draft" },
  { value: "1", label: "Pending" },
  { value: "2", label: "Approved" },
  { value: "3", label: "Rejected" },
];

const DATE_PRESETS: DatePresetOption[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom" },
];

const DEFAULT_DATE_PRESET: DatePresetOption = {
  value: "this_month",
  label: "This Month",
};

const AUTH_STATUS_COLORS: Record<
  string,
  "default" | "warning" | "success" | "error"
> = {
  Draft: "default",
  Pending: "warning",
  Approved: "success",
  Rejected: "error",
};

const ReceiptReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  usePageTitle("Receipts Report");

  // State Management
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel");
  const [exporting, setExporting] = useState(false);
  const [ordering] = useState("-receipt_date");
  const [filtersApplied, setFiltersApplied] = useState(false);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  
  const [appliedQueryParams, setAppliedQueryParams] =
    useState<ReceiptReportParams | null>(null);

  // Filter state
  const [datePresetFilter, setDatePresetFilter] =
    useState<DatePresetOption | null>(DEFAULT_DATE_PRESET);
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState<CompanyOption | null>(
    null,
  );
  const [locationFilter, setLocationFilter] = useState<LocationOption | null>(
    null,
  );
  const [receiptNumberFilter, setReceiptNumberFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] =
    useState<PaymentModeOption | null>(null);
  const [customerTypeFilter, setCustomerTypeFilter] =
    useState<CustomerTypeOption | null>(null);
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState("");
  const [authStatusFilter, setAuthStatusFilter] =
    useState<AuthorizationStatusOption | null>(null);
  const [agentFilter, setAgentFilter] = useState<{id: string; name: string} | null>(null);

  // Breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: "Home", path: "/", icon: <HomeIcon fontSize="small" /> },
      {
        label: "Reports",
        path: "/reports",
        icon: <AssessmentIcon fontSize="small" />,
      },
      { label: "Receipts Report" },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Fetch companies and locations for dropdowns
  const { data: companies = [] } = useQuery({
    queryKey: ["companiesMini"],
    queryFn: () => companyApi.getCompaniesMini(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: locationsData } = useQuery({
    queryKey: ["locationsList"],
    queryFn: () => locationApi.getLocations({ page: 1, page_size: 500 }),
    staleTime: 5 * 60 * 1000,
  });
  const locations: LocationOption[] = (locationsData?.results || []).map(
    (l: any) => ({ id: l.id, name: l.name }),
  );

  const { data: agents = [] } = useQuery({
    queryKey: ["agentsMini"],
    queryFn: () => agentApi.getAgentsMini(),
    staleTime: 5 * 60 * 1000,
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(event.target.value);
    },
    [],
  );

  const handleClearFilters = () => {
    setDatePresetFilter(DEFAULT_DATE_PRESET);
    setDateFromFilter("");
    setDateToFilter("");
    setCompanyFilter(null);
    setLocationFilter(null);
    setReceiptNumberFilter("");
    setPaymentModeFilter(null);
    setCustomerTypeFilter(null);
    setInvoiceNumberFilter("");
    setAuthStatusFilter(null);
    setAgentFilter(null);
    setSearchInput("");
    setSearchQuery("");
    setPaginationModel({ page: 0, pageSize: 10 });
    setFiltersApplied(false);
    setAppliedQueryParams(null);
    setFiltersCollapsed(false)
  };

  const handleApplyFilters = (): ReceiptReportParams | null => {
    if (
      !datePresetFilter ||
      (datePresetFilter.value === "custom" &&
        (!dateFromFilter || !dateToFilter))
    ) {
      toast.error(
        "Please select a date range (preset or custom dates) before applying filters",
      );
      return null;
    }

    if (
      datePresetFilter.value === "custom" &&
      dateFromFilter &&
      dateToFilter &&
      dateFromFilter > dateToFilter
    ) {
      toast.error("Start date must be on or before end date");
      return null;
    }

    // Resolve date preset to from_date / to_date
    let fromDate = dateFromFilter;
    let toDate = dateToFilter;
    const today = dayjs();

    if (datePresetFilter.value !== "custom") {
      toDate = today.format("YYYY-MM-DD");
      switch (datePresetFilter.value) {
        case "today":
          fromDate = toDate;
          break;
        case "this_week":
          fromDate = today.startOf("week").format("YYYY-MM-DD");
          break;
        case "this_month":
          fromDate = today.startOf("month").format("YYYY-MM-DD");
          break;
        case "this_year":
          fromDate = today.startOf("year").format("YYYY-MM-DD");
          break;
      }
    }

    const newParams: ReceiptReportParams = {
      page: 1,
      page_size: 10,
      ordering,
      search: searchQuery || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      company: companyFilter?.id || undefined,
      location: locationFilter?.id || undefined,
      receipt_number: receiptNumberFilter || undefined,
      payment_mode: paymentModeFilter?.value || undefined,
      customer_type: customerTypeFilter?.value || undefined,
      invoice_number: invoiceNumberFilter || undefined,
      authorization_status: authStatusFilter?.value || undefined,
      agent: agentFilter?.id || undefined,
    };

    setPaginationModel({ page: 0, pageSize: 10 });
    setAppliedQueryParams(newParams);
    setFiltersApplied(true);
    setFiltersCollapsed(true)
    return newParams;
  };

  // Derive query params from applied snapshot + current pagination
  const queryParams: ReceiptReportParams | null = appliedQueryParams
    ? {
        ...appliedQueryParams,
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
      }
    : null;

  // Fetch Report Data
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["receiptReport", queryParams],
    queryFn: () => receiptReportApi.getReport(queryParams!),
    placeholderData: (previousData) => previousData,
    enabled: filtersApplied && !!queryParams,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // File format map for generic export
  const FILE_FORMAT_MAP: Record<string, number> = { csv: 0, excel: 2 };

  // Export via generic export endpoint
  const handleExport = async (
    fmt: "excel" | "csv" | "pdf",
    paramsOverride?: ReceiptReportParams,
  ) => {
    const exportParams = paramsOverride || appliedQueryParams;
    if (!exportParams) {
      toast.error("Please apply filters first to generate the report");
      return;
    }
    setExporting(true);
    try {
      const { page, page_size, ...filterParams } = exportParams;
      const formatIndex = FILE_FORMAT_MAP[fmt] ?? 0;
      const { request_id } = await receiptReportApi.exportReport(
        formatIndex,
        filterParams,
      );

      // Poll until ready (max ~80s)
      for (let i = 0; i < 40; i++) {
        const ready = await receiptReportApi.checkExportStatus(request_id);
        if (ready) {
          await receiptReportApi.downloadExport(request_id);
          toast.success(`Report exported to ${fmt.toUpperCase()} successfully`);
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      toast.error("Export timed out. Please try again.");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleGenerate = () => {
    const params = handleApplyFilters();
    if (params) {
      handleExport(exportFormat, params);
    }
  };

  const handleRefresh = async () => {
    if (filtersApplied) {
      try {
        await refetch();
        toast.success("Report data refreshed");
      } catch (err) {
        console.error("Refresh error:", err);
        toast.error("Failed to refresh report data");
      }
    }
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: "sno",
      headerName: "S.No",
      width: 60,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => {
        const rowIndex =
          paginationModel.page * paginationModel.pageSize +
          params.api.getRowIndexRelativeToVisibleRows(params.id) +
          1;
        return rowIndex;
      },
    },
    {
      field: "receipt_number",
      headerName: "Receipt No.",
      width: 150,
      sortable: false,
    },
    {
      field: "receipt_date",
      headerName: "Receipt Date",
      width: 110,
      sortable: false,
      valueFormatter: (value) => format(new Date(value), "dd-MM-yyyy"),
    },
    {
      field: "payment_date",
      headerName: "Payment Date",
      width: 110,
      sortable: false,
      valueFormatter: (value) => format(new Date(value), "dd-MM-yyyy"),
    },
    {
      field: "customer_name",
      headerName: "Customer",
      minWidth: 170,
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.3,
            }}
          >
            {params.value}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            {params.row.customer_type}
          </Typography>
        </Box>
      ),
    },
    {
      field: "payment_mode",
      headerName: "Payment Mode",
      width: 120,
      sortable: false,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total_amount",
      headerName: "Total Amt",
      width: 130,
      align: "right",
      headerAlign: "right",
      sortable: false,
      valueFormatter: (value: any) => {
        const num = typeof value === "string" ? parseFloat(value) : value;
        return `₹${num?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}`;
      },
    },
    {
      field: "authorization_status",
      headerName: "Auth Status",
      width: 110,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={AUTH_STATUS_COLORS[params.value] || "default"}
          size="small"
        />
      ),
    },
    {
      field: "agent_name",
      headerName: "Agent",
      width: 130,
      sortable: false,
    },
    {
      field: "company_name",
      headerName: "Company",
      width: 140,
      sortable: false,
    },
    {
      field: "location_name",
      headerName: "Location",
      width: 140,
      sortable: false,
    },
  ];

  const rows = data?.results || [];
  const totalCount = data?.count || 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={getPageContainerStyles()}>
        {/* Fixed Header Section */}
        <Box sx={getHeaderSectionStyles()}>
          {/* Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <IconButton
              onClick={() => navigate("/reports")}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              <ArrowForwardIcon sx={{ transform: "rotate(180deg)" }} />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
              Receipts Report
            </Typography>
            {filtersApplied && (
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={handleRefresh}
                  disabled={isLoading || isFetching}
                  size="small"
                  sx={{
                    color: "primary.main",
                    "&:hover": { bgcolor: "rgba(0, 103, 102, 0.04)" },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Filter Panel */}
          <Paper sx={{ p: 2, mb: 2 }}>

            
 <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
                gap: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Filters
              </Typography>
              <Tooltip
                title={filtersCollapsed ? "Show filters" : "Hide filters"}
              >
                <IconButton
                  onClick={() => setFiltersCollapsed((prev) => !prev)}
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      bgcolor: "rgba(0, 103, 102, 0.04)",
                    },
                  }}
                >
                  {filtersCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
              </Tooltip>
            </Box>

              <Collapse in={!filtersCollapsed} timeout="auto" unmountOnExit>
            {/* Date Presets */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block", fontWeight: 500 }}
              >
                Date Range{" "}
                <Typography
                  component="span"
                  color="error"
                  sx={{ fontSize: "inherit" }}
                >
                  *
                </Typography>
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {DATE_PRESETS.map((preset) => (
                  <Chip
                    key={preset.value}
                    label={preset.label}
                    onClick={() => {
                      setDatePresetFilter(preset);
                      if (preset.value !== "custom") {
                        setDateFromFilter("");
                        setDateToFilter("");
                      } else {
                        setFiltersApplied(false);
                      }
                    }}
                    color={
                      datePresetFilter?.value === preset.value
                        ? "primary"
                        : "default"
                    }
                    variant={
                      datePresetFilter?.value === preset.value
                        ? "filled"
                        : "outlined"
                    }
                    size="small"
                  />
                ))}
              </Stack>
            </Box>

            {/* Filter Fields */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg:
                    datePresetFilter?.value === "custom"
                      ? "repeat(5, 1fr)"
                      : "repeat(4, 1fr)",
                },
                gap: 2,
                mb: 2,
              }}
            >
              {/* Custom Date Range */}
              {datePresetFilter?.value === "custom" && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Start Date{" "}
                    <Typography
                      component="span"
                      color="error"
                      sx={{ fontSize: "inherit" }}
                    >
                      *
                    </Typography>
                  </Typography>
                  <DatePicker
                    format="dd-MM-yyyy"
                    value={
                      dateFromFilter ? dayjs(dateFromFilter).toDate() : null
                    }
                    onChange={(date) =>
                      setDateFromFilter(
                        date ? dayjs(date).format("YYYY-MM-DD") : "",
                      )
                    }
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        placeholder: "Select a date",
                        required: true,
                      },
                    }}
                  />
                </Box>
              )}
              {datePresetFilter?.value === "custom" && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    End Date{" "}
                    <Typography
                      component="span"
                      color="error"
                      sx={{ fontSize: "inherit" }}
                    >
                      *
                    </Typography>
                  </Typography>
                  <DatePicker
                    format="dd-MM-yyyy"
                    value={dateToFilter ? dayjs(dateToFilter).toDate() : null}
                    onChange={(date) =>
                      setDateToFilter(
                        date ? dayjs(date).format("YYYY-MM-DD") : "",
                      )
                    }
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        placeholder: "Select a date",
                        required: true,
                      },
                    }}
                  />
                  {dateFromFilter && !dateToFilter && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      End date is required
                    </Typography>
                  )}
                </Box>
              )}

              {/* Company */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Company
                </Typography>
                <Autocomplete
                  size="small"
                  options={companies}
                  value={companyFilter}
                  onChange={(_, newValue) => setCompanyFilter(newValue)}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select company" />
                  )}
                />
              </Box>

              {/* Location */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Location
                </Typography>
                <Autocomplete
                  size="small"
                  options={locations}
                  value={locationFilter}
                  onChange={(_, newValue) => setLocationFilter(newValue)}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select location" />
                  )}
                />
              </Box>

              {/* Receipt Number */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Receipt Number
                </Typography>
                <TextField
                  placeholder="e.g. RCP-VSK-25-26-1"
                  value={receiptNumberFilter}
                  onChange={(e) => setReceiptNumberFilter(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Box>

              {/* Payment Mode */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Payment Mode
                </Typography>
                <Autocomplete
                  size="small"
                  options={PAYMENT_MODES}
                  value={paymentModeFilter}
                  onChange={(_, newValue) => setPaymentModeFilter(newValue)}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select payment mode" />
                  )}
                />
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Auth Status
                </Typography>
                <Autocomplete
                  size="small"
                  options={AUTHORIZATION_STATUSES}
                  value={authStatusFilter}
                  onChange={(_, newValue) => setAuthStatusFilter(newValue)}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select auth status" />
                  )}
                />
              </Box>

              {/* Customer Type */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Customer Type
                </Typography>
                <Autocomplete
                  size="small"
                  options={CUSTOMER_TYPES}
                  value={customerTypeFilter}
                  onChange={(_, newValue) => setCustomerTypeFilter(newValue)}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select customer type" />
                  )}
                />
              </Box>

              {/* Invoice Number */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Invoice Number
                </Typography>
                <TextField
                  placeholder="e.g. INV-001"
                  value={invoiceNumberFilter}
                  onChange={(e) => setInvoiceNumberFilter(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Box>

              {/* Agent */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Agent
                </Typography>
                <Autocomplete
                  size="small"
                  options={agents}
                  value={agentFilter}
                  onChange={(_, newValue) => setAgentFilter(newValue)}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select agent" />
                  )}
                />
              </Box>

              {/* Search */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Search
                </Typography>
                <TextField
                  placeholder="Receipt no., customer..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  size="small"
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Box>

            {/* File Format and Actions */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <FormControl>
                <FormLabel
                  sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 0.5 }}
                >
                  File Format
                </FormLabel>
                <RadioGroup
                  row
                  value={exportFormat}
                  onChange={(e) =>
                    setExportFormat(e.target.value as "excel" | "csv")
                  }
                >
                  <FormControlLabel
                    value="csv"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">CSV</Typography>}
                  />
                  <FormControlLabel
                    value="excel"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">XLSX</Typography>}
                  />
                </RadioGroup>
              </FormControl>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  disabled={exporting}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  disabled={exporting}
                  color="primary"
                >
                  Apply
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={exporting || !filtersApplied}
                  startIcon={exporting ? null : <FileDownloadIcon />}
                  color="success"
                >
                  {exporting ? "Generating..." : "Generate"}
                </Button>
              </Box>
            </Box>
            </Collapse>
          </Paper>
          
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={getContentSectionStyles()}>
          <Paper
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
              borderRadius: 0,
            }}
          >
            {!filtersApplied ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: 400,
                  p: 4,
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    bgcolor: "rgba(0, 103, 102, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 60, color: "primary.main" }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  No Data to Display
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 400 }}
                >
                  Please select a date range and other filters above, then click
                  'Apply' to view the receipts report data.
                </Typography>
              </Box>
            ) : (
              <DataGrid
                rows={rows}
                columns={columns}
                rowCount={totalCount}
                loading={isLoading || isFetching}
                pageSizeOptions={[10, 20, 50, 100]}
                paginationModel={paginationModel}
                paginationMode="server"
                onPaginationModelChange={setPaginationModel}
                disableRowSelectionOnClick
                disableColumnMenu
                getRowHeight={() => "auto"}
                sx={{
                  ...getDataGridStyles(),
                  height: "100%",
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                    py: 1,
                  },
                  "& .MuiDataGrid-row": {
                    minHeight: "60px !important",
                    maxHeight: "none !important",
                  },
                }}
              />
            )}
          </Paper>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ReceiptReportPage;
