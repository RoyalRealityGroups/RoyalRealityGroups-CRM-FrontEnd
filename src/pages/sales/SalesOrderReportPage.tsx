/**
 * Sales Order Report Page
 * Comprehensive sales order reporting with advanced filtering and export capabilities
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
import { salesReportApi } from "../../api/salesReport.api";
import { agentApi } from "../../api/masters.api";
import { useBreadcrumbs } from "../../contexts/BreadcrumbContext";
import { usePageTitle } from "../../hooks";
import { useNavigate } from "react-router-dom";
import type {
  SalesOrderReportParams,
  CustomerTypeOption,
  AuthorizationStatusOption,
  OrderStatusOption,
  DatePresetOption,
} from "../../types/salesReport.types";
import toast from "react-hot-toast";
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from "../../utils/spacing";
import { format } from "date-fns";
import dayjs from "dayjs";
import { toDateString } from "../../utils/format";

const SalesOrderReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  // Set page title
  usePageTitle("Sales Order Report");

  // State Management
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportFormat, setExportFormat] = useState<"excel" | "csv" | "pdf">(
    "excel",
  );
  const [exporting, setExporting] = useState(false);
  const [ordering, setOrdering] = useState("-order_date");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [appliedQueryParams, setAppliedQueryParams] =
    useState<SalesOrderReportParams | null>(null);

  // Filter state
  const [customerTypeFilter, setCustomerTypeFilter] =
    useState<CustomerTypeOption | null>(null);
  const [authStatusFilter, setAuthStatusFilter] =
    useState<AuthorizationStatusOption | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] =
    useState<OrderStatusOption | null>(null);
  const [agentFilter, setAgentFilter] = useState<{id: string; name: string} | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [datePresetFilter, setDatePresetFilter] =
    useState<DatePresetOption | null>({
      value: "this_month",
      label: "This Month",
    });

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([
      { label: "Home", path: "/", icon: <HomeIcon fontSize="small" /> },
      {
        label: "Reports",
        path: "/reports",
        icon: <AssessmentIcon fontSize="small" />,
      },
      { label: "Sales Order Report" },
    ]);

    // Clear breadcrumbs on unmount
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Dropdown Options
  const customerTypes: CustomerTypeOption[] = [
    { value: "RETAILER", label: "Retailer" },
    { value: "DISTRIBUTOR", label: "Distributor" },
    { value: "SUPERSTOCKIST", label: "Superstockist" },
  ];

  const authorizationStatuses: AuthorizationStatusOption[] = [
    { value: "1", label: "Pending" },
    { value: "2", label: "Approved" },
    { value: "3", label: "Rejected" },
  ];

  const orderStatuses: OrderStatusOption[] = [
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PARTIALLY_DISPATCHED", label: "Partially Dispatched" },
    { value: "DISPATCHED", label: "Dispatched" },
    { value: "PARTIALLY_INVOICED", label: "Partially Invoiced" },
    { value: "INVOICED", label: "Invoiced" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const datePresets: DatePresetOption[] = [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "this_year", label: "This Year" },
    { value: "custom", label: "Custom" },
  ];

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

  const { data: agents = [] } = useQuery({
    queryKey: ["agentsMini"],
    queryFn: () => agentApi.getAgentsMini(),
    staleTime: 5 * 60 * 1000,
  });

  // Handle filter changes
  const handleClearFilters = () => {
    setCustomerTypeFilter(null);
    setAuthStatusFilter(null);
    setOrderStatusFilter(null);
    setAgentFilter(null);
    setDateFromFilter("");
    setDateToFilter("");
    setDatePresetFilter({ value: "this_month", label: "This Month" });
    setSearchInput("");
    setSearchQuery("");
    setPaginationModel({ page: 0, pageSize: 10 });
    setFiltersApplied(false);
    setAppliedQueryParams(null);
    setFiltersCollapsed(false);
  };

  const handleApplyFilters = (): SalesOrderReportParams | null => {
    // Validate: At least date range must be selected
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

    // Validate: Start date must be on or before end date
    if (
      datePresetFilter.value === "custom" &&
      dateFromFilter &&
      dateToFilter &&
      dateFromFilter > dateToFilter
    ) {
      toast.error("Start date must be on or before end date");
      return null;
    }

    const newParams: SalesOrderReportParams = {
      page: 1,
      page_size: 10,
      ordering,
      search: searchQuery || undefined,
      customer_type: customerTypeFilter?.value || undefined,
      authorization_status: authStatusFilter?.value || undefined,
      order_status: orderStatusFilter?.value || undefined,
      agent: agentFilter?.id || undefined,
      date_preset:
        datePresetFilter.value && datePresetFilter.value !== "custom"
          ? datePresetFilter.value
          : undefined,
      from_date:
        datePresetFilter.value === "custom" && dateFromFilter
          ? dateFromFilter
          : undefined,
      to_date:
        datePresetFilter.value === "custom" && dateToFilter
          ? dateToFilter
          : undefined,
    };

    setPaginationModel({ page: 0, pageSize: 10 });
    setAppliedQueryParams(newParams);
    setFiltersApplied(true);
    setFiltersApplied(true);
    return newParams;
  };

  const activeFilterCount =
    (customerTypeFilter ? 1 : 0) +
    (authStatusFilter ? 1 : 0) +
    (orderStatusFilter ? 1 : 0) +
    (datePresetFilter && datePresetFilter.value !== "custom" ? 1 : 0) +
    (datePresetFilter?.value === "custom" && (dateFromFilter || dateToFilter)
      ? 1
      : 0) +
    (searchQuery ? 1 : 0);

  // Derive query params from applied snapshot + current pagination
  const queryParams: SalesOrderReportParams | null = appliedQueryParams
    ? {
        ...appliedQueryParams,
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
      }
    : null;

  // Fetch Report Data - only when filters are applied
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["salesOrderReport", queryParams],
    queryFn: () => salesReportApi.getReport(queryParams!),
    placeholderData: (previousData) => previousData,
    enabled: filtersApplied && !!queryParams,
    staleTime: 30000, // Data considered fresh for 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Export Report
  const handleExport = async (
    format: "excel" | "csv" | "pdf",
    paramsOverride?: SalesOrderReportParams,
  ) => {
    const exportParams = paramsOverride || appliedQueryParams;
    if (!exportParams) {
      toast.error("Please apply filters first to generate the report");
      return;
    }

    setExporting(true);
    try {
      const { page, page_size, ...exportFilters } = exportParams;
      const blob = await salesReportApi.exportReport({
        format,
        filters: exportFilters,
      });
      salesReportApi.downloadReport(blob, format);
      toast.success(`Report exported to ${format.toUpperCase()} successfully`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleGenerate = () => {
    if (
      exportFormat === "excel" ||
      exportFormat === "csv" ||
      exportFormat === "pdf"
    ) {
      const params = handleApplyFilters();
      if (params) {
        handleExport(exportFormat, params);
      }
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

  // Get Status Color
  const getStatusColor = (
    status: string,
  ):
    | "default"
    | "warning"
    | "success"
    | "error"
    | "info"
    | "primary"
    | "secondary" => {
    const statusColors: Record<
      string,
      | "default"
      | "warning"
      | "success"
      | "error"
      | "info"
      | "primary"
      | "secondary"
    > = {
      DRAFT: "default",
      PENDING: "warning",
      CONFIRMED: "info",
      PARTIALLY_DISPATCHED: "primary",
      DISPATCHED: "primary",
      PARTIALLY_INVOICED: "warning",
      INVOICED: "secondary",
      DELIVERED: "success",
      CANCELLED: "error",
    };
    return statusColors[status] || "default";
  };

  // Get Authorization Status Color
  const getAuthStatusColor = (
    status: string,
  ): "default" | "warning" | "success" | "error" => {
    const colors: Record<string, "default" | "warning" | "success" | "error"> =
      {
        Pending: "warning",
        Approved: "success",
        Rejected: "error",
      };
    return colors[status] || "default";
  };

  // DataGrid columns - Product-wise
  const columns: GridColDef[] = [
    {
      field: "sno",
      headerName: "S.No",
      width: 70,
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
      field: "order_number",
      headerName: "Order Number",
      width: 140,
      sortable: false,
    },
    {
      field: "order_date",
      headerName: "Order Date",
      width: 110,
      sortable: false,
      valueFormatter: (value) => format(new Date(value), "dd-MM-yyyy"),
    },
    {
      field: "customer_name",
      headerName: "Customer",
      minWidth: 180,
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
            sx={{
              display: "block",
              mt: 0.5,
            }}
          >
            {params.row.customer_type}
          </Typography>
        </Box>
      ),
    },
    {
      field: "product_name",
      headerName: "Product",
      minWidth: 200,
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
            sx={{
              display: "block",
              mt: 0.5,
            }}
          >
            {params.row.product_code}
          </Typography>
        </Box>
      ),
    },
    {
      field: "quantity",
      headerName: "Qty",
      width: 90,
      align: "center",
      headerAlign: "center",
      sortable: false,
      valueFormatter: (value: any) => {
        const num = typeof value === "string" ? parseFloat(value) : value;
        return num?.toFixed(2) || "0.00";
      },
    },
    {
      field: "rate",
      headerName: "Rate",
      width: 100,
      align: "right",
      headerAlign: "right",
      sortable: false,
      valueFormatter: (value: any) => {
        const num = typeof value === "string" ? parseFloat(value) : value;
        return `₹${num?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}`;
      },
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      align: "right",
      headerAlign: "right",
      sortable: false,
      valueFormatter: (value: any) => {
        const num = typeof value === "string" ? parseFloat(value) : value;
        return `₹${num?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}`;
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.row.status_code)}
          size="small"
        />
      ),
    },
    {
      field: "authorization_status",
      headerName: "Auth Status",
      width: 120,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getAuthStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: "agent_name",
      headerName: "Agent",
      width: 130,
      sortable: false,
      valueFormatter: (value: any) => value || "—",
    },
    {
      field: "location",
      headerName: "Location",
      minWidth: 180,
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
            {params.row.state}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
           
              mt: 0.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.3,
            }}
          >
            {params.row.city}
            {params.row.area && `, ${params.row.area}`}
          </Typography>
        </Box>
      ),
    },
  ];

  const orders = data?.results || [];
  const summary = data?.summary || {
    total_orders: 0,
    total_products: 0,
    total_amount: 0,
    total_tax: 0,
  };
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
              Sales Order Report
            </Typography>
            {filtersApplied && (
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={handleRefresh}
                  disabled={isLoading || isFetching}
                  size="small"
                  sx={{
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "rgba(0, 103, 102, 0.04)",
                    },
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
              {/* First Row - Date Presets */}
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
                  {datePresets.map((preset) => (
                    <Chip
                      key={preset.value}
                      label={preset.label}
                      onClick={() => {
                        setDatePresetFilter(preset);
                        if (preset.value !== "custom") {
                          // Clear custom dates when selecting a preset
                          setDateFromFilter("");
                          setDateToFilter("");
                        } else {
                          // When switching to Custom, clear the applied filters to hide data
                          // until user selects custom dates and clicks Apply again
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

              {/* Second Row - Filter Fields */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg:
                      datePresetFilter?.value === "custom"
                        ? "repeat(6, 1fr)"
                        : "repeat(4, 1fr)",
                  },
                  gap: 2,
                  mb: 2,
                }}
              >
                {/* Start Date - Only show when Custom is selected */}
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
                      onChange={(date) => {
                        setDateFromFilter(toDateString(date));
                      }}
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

                {/* End Date - Only show when Custom is selected */}
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
                      onChange={(date) => {
                        setDateToFilter(toDateString(date));
                      }}
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
                    options={customerTypes}
                    value={customerTypeFilter}
                    onChange={(_, newValue) => setCustomerTypeFilter(newValue)}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.value === value.value
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select customer type"
                      />
                    )}
                  />
                </Box>

                {/* Authorization Status */}
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
                    options={authorizationStatuses}
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

                {/* Order Status */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Order Status
                  </Typography>
                  <Autocomplete
                    size="small"
                    options={orderStatuses}
                    value={orderStatusFilter}
                    onChange={(_, newValue) => setOrderStatusFilter(newValue)}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.value === value.value
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select order status"
                      />
                    )}
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
                    placeholder="Order number, customer..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              {/* Third Row - File Format and Actions */}
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
                    sx={{
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      mb: 0.5,
                    }}
                  >
                    File Format
                  </FormLabel>
                  <RadioGroup
                    row
                    value={exportFormat}
                    onChange={(e) =>
                      setExportFormat(e.target.value as "excel" | "csv" | "pdf")
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
                    {/* <FormControlLabel
                      value="pdf"
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">PDF</Typography>}
                    /> */}
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

          {/* Summary Cards - Only show when filters are applied */}
          {filtersApplied && (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Paper sx={{ px: 2, py: 1.5, flex: 1, minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Orders
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {summary.total_orders}
                </Typography>
              </Paper>
              <Paper sx={{ px: 2, py: 1.5, flex: 1, minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Products
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {summary.total_products || 0}
                </Typography>
              </Paper>
              <Paper sx={{ px: 2, py: 1.5, flex: 1, minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ₹
                  {summary.total_amount?.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </Paper>
              <Paper sx={{ px: 2, py: 1.5, flex: 1, minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Tax
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ₹
                  {summary.total_tax?.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </Paper>
            </Box>
          )}
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
              // Empty State - No filters applied
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
                  'Apply' to view the sales order report data.
                </Typography>
              </Box>
            ) : (
              // Data Grid - Filters applied
              <DataGrid
                rows={orders}
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

export default SalesOrderReportPage;
