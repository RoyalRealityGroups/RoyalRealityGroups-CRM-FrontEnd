/**
 * Invoice Report Page
 * Comprehensive invoice reporting with advanced filtering and export capabilities
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
  Receipt as ReceiptIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { invoiceReportApi } from "../../api/invoiceReport.api";
import { agentApi } from "../../api/masters.api";
import { useBreadcrumbs } from "../../contexts/BreadcrumbContext";
import { usePageTitle } from "../../hooks";
import { useNavigate } from "react-router-dom";
import type {
  InvoiceReportParams,
  CustomerTypeOption,
  SourceTypeOption,
  InvoiceStatusOption,
  PodStatusOption,
  DatePresetOption,
} from "../../types/invoiceReport.types";
import toast from "react-hot-toast";
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from "../../utils/spacing";
import { format } from "date-fns";
import dayjs from "dayjs";
import type { AuthorizationStatusOption } from "../../types/salesReport.types";

// Static filter options — defined outside component to avoid re-creation on each render
const CUSTOMER_TYPES: CustomerTypeOption[] = [
  { value: "RETAILER", label: "Retailer" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "SUPERSTOCKIST", label: "Superstockist" },
];

const SOURCE_TYPES: SourceTypeOption[] = [
  { value: "DISPATCH", label: "From Dispatch Plan" },
  { value: "ORDER", label: "From Sales Order" },
];

const INVOICE_STATUSES: InvoiceStatusOption[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PAID", label: "Paid" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

const POD_STATUSES: PodStatusOption[] = [
  { value: "PENDING", label: "POD Pending" },
  { value: "COMPLETED", label: "POD Completed" },
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

const STATUS_COLORS: Record<
  string,
  "default" | "warning" | "success" | "error" | "info" | "primary" | "secondary"
> = {
  DRAFT: "default",
  PENDING: "warning",
  CONFIRMED: "info",
  PAID: "success",
  PARTIALLY_PAID: "warning",
  CANCELLED: "error",
};

const authorizationStatuses: AuthorizationStatusOption[] = [
  { value: "1", label: "Pending" },
  { value: "2", label: "Approved" },
  { value: "3", label: "Rejected" },
];

const InvoiceReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  // Set page title
  usePageTitle("Invoice Report");

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
  const [ordering] = useState("-invoice_date");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [appliedQueryParams, setAppliedQueryParams] =
    useState<InvoiceReportParams | null>(null);

  // Filter state
  const [customerTypeFilter, setCustomerTypeFilter] =
    useState<CustomerTypeOption | null>(null);
  const [sourceTypeFilter, setSourceTypeFilter] =
    useState<SourceTypeOption | null>(null);
  const [invoiceStatusFilter, setInvoiceStatusFilter] =
    useState<InvoiceStatusOption | null>(null);
  const [podStatusFilter, setPodStatusFilter] =
    useState<PodStatusOption | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [datePresetFilter, setDatePresetFilter] =
    useState<DatePresetOption | null>(DEFAULT_DATE_PRESET);
  const [dueFromFilter, setDueFromFilter] = useState("");
  const [dueToFilter, setDueToFilter] = useState("");
  const [dispatchNumberFilter, setDispatchNumberFilter] = useState("");
  const [salesOrderNumberFilter, setSalesOrderNumberFilter] = useState("");

  const [authStatusFilter, setAuthStatusFilter] =
    useState<AuthorizationStatusOption | null>(null);
  const [agentFilter, setAgentFilter] = useState<{id: string; name: string} | null>(null);

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([
      { label: "Home", path: "/", icon: <HomeIcon fontSize="small" /> },
      {
        label: "Reports",
        path: "/reports",
        icon: <AssessmentIcon fontSize="small" />,
      },
      { label: "Invoice Report" },
    ]);

    // Clear breadcrumbs on unmount
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

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
    setSourceTypeFilter(null);
    setInvoiceStatusFilter(null);
    setPodStatusFilter(null);
    setDateFromFilter("");
    setDateToFilter("");
    setDatePresetFilter(DEFAULT_DATE_PRESET);
    setDueFromFilter("");
    setDueToFilter("");
    setDispatchNumberFilter("");
    setSalesOrderNumberFilter("");
    setSearchInput("");
    setSearchQuery("");
    setPaginationModel({ page: 0, pageSize: 10 });
    setFiltersApplied(false);
    setFiltersCollapsed(false);
    setAppliedQueryParams(null);
    setAgentFilter(null);
  };

  const handleApplyFilters = (): InvoiceReportParams | null => {
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

    if (dueFromFilter && dueToFilter && dueFromFilter > dueToFilter) {
      toast.error("Due from date must be on or before due to date");
      return null;
    }

    const newParams: InvoiceReportParams = {
      page: 1,
      page_size: 10,
      ordering,
      search: searchInput.trim() || undefined,
      customer_type: customerTypeFilter?.value || undefined,
      source_type: sourceTypeFilter?.value || undefined,
      invoice_status:
        (invoiceStatusFilter?.value as InvoiceReportParams["invoice_status"]) ||
        undefined,
      pod_status:
        (podStatusFilter?.value as InvoiceReportParams["pod_status"]) ||
        undefined,
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
      due_from_date: dueFromFilter || undefined,
      due_to_date: dueToFilter || undefined,
      dispatch_number: dispatchNumberFilter || undefined,
      sales_order_number: salesOrderNumberFilter || undefined,
      authorization_status: authStatusFilter?.value || undefined,
      agent: agentFilter?.id || undefined,
    };

    setPaginationModel({ page: 0, pageSize: 10 });
    setAppliedQueryParams(newParams);
    setFiltersApplied(true);
    setFiltersCollapsed(true);
    return newParams;
  };

  // Derive query params from applied snapshot + current pagination
  const queryParams: InvoiceReportParams | null = appliedQueryParams
    ? {
        ...appliedQueryParams,
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
      }
    : null;

  // Fetch Report Data - only when filters are applied
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["invoiceReport", queryParams],
    queryFn: () => invoiceReportApi.getReport(queryParams!),
    placeholderData: (previousData) => previousData,
    enabled: filtersApplied && !!queryParams,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

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

  // Export Report
  const handleExport = async (
    format: "excel" | "csv" | "pdf",
    paramsOverride?: InvoiceReportParams,
  ) => {
    const exportParams = paramsOverride || appliedQueryParams;
    if (!exportParams) {
      toast.error("Please apply filters first to generate the report");
      return;
    }

    setExporting(true);
    try {
      const { page, page_size, ...exportFilters } = exportParams;
      const blob = await invoiceReportApi.exportReport({
        format,
        filters: exportFilters,
      });
      invoiceReportApi.downloadReport(blob, format);
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

  // DataGrid columns
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
      field: "invoice_number",
      headerName: "Invoice Number",
      width: 140,
      sortable: false,
    },
    {
      field: "invoice_date",
      headerName: "Invoice Date",
      width: 110,
      sortable: false,
      valueFormatter: (value) => format(new Date(value), "dd-MM-yyyy"),
    },
    {
      field: "due_date",
      headerName: "Due Date",
      width: 110,
      sortable: false,
      valueFormatter: (value) => format(new Date(value), "dd-MM-yyyy"),
    },
    {
      field: "source_type_display",
      headerName: "Source",
      width: 150,
      sortable: false,
    },
    {
      field: "dispatch_number",
      headerName: "Dispatch #",
      width: 130,
      sortable: false,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "sales_order_number",
      headerName: "Order #",
      width: 130,
      sortable: false,
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
      field: "grand_total",
      headerName: "Grand Total",
      width: 130,
      align: "right",
      headerAlign: "right",
      sortable: false,
      valueFormatter: (value: any) => {
        const parsed = typeof value === "string" ? parseFloat(value) : value;
        const num = Number.isFinite(parsed) ? parsed : 0;
        return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      },
    },
    {
      field: "paid_amount",
      headerName: "Paid",
      width: 120,
      align: "right",
      headerAlign: "right",
      sortable: false,
      valueFormatter: (value: any) => {
        const parsed = typeof value === "string" ? parseFloat(value) : value;
        const num = Number.isFinite(parsed) ? parsed : 0;
        return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      },
    },
    {
      field: "balance_amount",
      headerName: "Balance",
      width: 120,
      align: "right",
      headerAlign: "right",
      sortable: false,
      valueFormatter: (value: any) => {
        const parsed = typeof value === "string" ? parseFloat(value) : value;
        const num = Number.isFinite(parsed) ? parsed : 0;
        return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
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
          color={STATUS_COLORS[params.row.status_code] || "default"}
          size="small"
        />
      ),
    },
    {
      field: "pod_status",
      headerName: "POD Status",
      width: 120,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.row.pod_status_code === "COMPLETED" ? "success" : "warning"
          }
          size="small"
        />
      ),
    },
    {
      field: "authorization_status_code",
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
              whiteSpace: "nowrap",
            }}
          >
            {params.row.state}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              mt: 0.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {params.row.city}
            {params.row.area && `, ${params.row.area}`}
          </Typography>
        </Box>
      ),
    },
  ];

  const invoices = data?.results || [];
  const summary = data?.summary || {
    total_invoices: 0,
    total_amount: 0,
    total_tax: 0,
    total_paid: 0,
    total_balance: 0,
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
              Invoice Report
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
                  Invoice Date Range{" "}
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
                        ? "repeat(5, 1fr)"
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
                        setDateFromFilter(
                          date ? dayjs(date).format("YYYY-MM-DD") : "",
                        );
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
                        setDateToFilter(
                          date ? dayjs(date).format("YYYY-MM-DD") : "",
                        );
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

                {/* Source Type */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Source Type
                  </Typography>
                  <Autocomplete
                    size="small"
                    options={SOURCE_TYPES}
                    value={sourceTypeFilter}
                    onChange={(_, newValue) => setSourceTypeFilter(newValue)}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.value === value.value
                    }
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select source type" />
                    )}
                  />
                </Box>

                {/* Dispatch Number */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Dispatch Number
                  </Typography>
                  <TextField
                    placeholder="Enter dispatch number"
                    value={dispatchNumberFilter}
                    onChange={(e) => setDispatchNumberFilter(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Box>

                {/* Sales Order Number */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Sales Order Number
                  </Typography>
                  <TextField
                    placeholder="Enter order number"
                    value={salesOrderNumberFilter}
                    onChange={(e) => setSalesOrderNumberFilter(e.target.value)}
                    size="small"
                    fullWidth
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
                      <TextField
                        {...params}
                        placeholder="Select customer type"
                      />
                    )}
                  />
                </Box>

                {/* Invoice Status */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Invoice Status
                  </Typography>
                  <Autocomplete
                    size="small"
                    options={INVOICE_STATUSES}
                    value={invoiceStatusFilter}
                    onChange={(_, newValue) => setInvoiceStatusFilter(newValue)}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.value === value.value
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select invoice status"
                      />
                    )}
                  />
                </Box>

                {/* POD Status */}
                {/* <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    POD Status
                  </Typography>
                  <Autocomplete
                    size="small"
                    options={POD_STATUSES}
                    value={podStatusFilter}
                    onChange={(_, newValue) => setPodStatusFilter(newValue)}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderInput={(params) => <TextField {...params} placeholder="Select POD status" />}
                  />
                </Box> */}

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

                {/* Due Date From */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Due From Date
                  </Typography>
                  <DatePicker
                    format="dd-MM-yyyy"
                    value={dueFromFilter ? dayjs(dueFromFilter).toDate() : null}
                    onChange={(date) => {
                      setDueFromFilter(
                        date ? dayjs(date).format("YYYY-MM-DD") : "",
                      );
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        placeholder: "Select due from date",
                      },
                    }}
                  />
                </Box>

                {/* Due Date To */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Due To Date
                  </Typography>
                  <DatePicker
                    format="dd-MM-yyyy"
                    value={dueToFilter ? dayjs(dueToFilter).toDate() : null}
                    onChange={(date) => {
                      setDueToFilter(
                        date ? dayjs(date).format("YYYY-MM-DD") : "",
                      );
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        placeholder: "Select due to date",
                      },
                    }}
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
                    placeholder="Invoice number, customer..."
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
                  Total Invoices
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {summary.total_invoices}
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
                  Total Paid
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ₹
                  {summary.total_paid?.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </Paper>
              <Paper sx={{ px: 2, py: 1.5, flex: 1, minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Outstanding Balance
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "error.main" }}
                >
                  ₹
                  {summary.total_balance?.toLocaleString("en-IN", {
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
                  <ReceiptIcon sx={{ fontSize: 60, color: "primary.main" }} />
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
                  'Apply' to view the invoice report data.
                </Typography>
              </Box>
            ) : (
              // Data Grid - Filters applied
              <DataGrid
                rows={invoices}
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

export default InvoiceReportPage;
