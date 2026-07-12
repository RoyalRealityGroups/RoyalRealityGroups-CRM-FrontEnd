import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import { hasPermission } from "../../../utils/permissions";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { agentApi } from "../../../api/masters.api";
import AgentFormDialog from "./AgentFormDialog";
import AgentViewDialog from "./AgentViewDialog";
import ScreenHeader from "../../../components/common/ScreenHeader";
import { useBreadcrumbs } from "../../../contexts/BreadcrumbContext";
import { useToast } from "../../../contexts/ToastContext";
import { usePageTitle } from "../../../hooks";
import HomeIcon from "@mui/icons-material/Home";
import FolderIcon from "@mui/icons-material/Folder";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import type { Agent, AgentFormData } from "../../../types/masters.types";
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from "../../../utils/spacing";

import { exportApi } from "../../../api/export.api";

const AgentList: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle("Agent Master");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewAgent, setViewAgent] = useState<Agent | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Home", path: "/", icon: <HomeIcon fontSize="small" /> },
      {
        label: "Masters",
        path: "/masters",
        icon: <FolderIcon fontSize="small" />,
      },
      { label: "Agents", icon: <SupportAgentIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      if (searchInput !== searchQuery)
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(event.target.value);
    },
    [],
  );

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportApi.genericExport("Agent");
      toastSuccess("Export downloaded successfully");
    } catch {
      toastError("Failed to export agents");
    } finally {
      setExporting(false);
    }
  };
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: [
      "agents",
      paginationModel.page,
      paginationModel.pageSize,
      searchQuery,
    ],
    queryFn: () =>
      agentApi.getAgents({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: agentApi.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setFormOpen(false);
      toastSuccess("Agent created successfully");
    },
    onError: (err: any) => {
      toastError(
        err.response?.data?.name?.[0] ||
          err.response?.data?.phone?.[0] ||
          err.response?.data?.detail ||
          "Failed to create agent",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentFormData }) =>
      agentApi.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setFormOpen(false);
      setSelectedAgent(null);
      toastSuccess("Agent updated successfully");
    },
    onError: (err: any) => {
      toastError(
        err.response?.data?.name?.[0] ||
          err.response?.data?.phone?.[0] ||
          err.response?.data?.detail ||
          "Failed to update agent",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: agentApi.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setDeleteDialogOpen(false);
      setSelectedAgent(null);
      toastSuccess("Agent deleted successfully");
    },
    onError: (err: any) => {
      setDeleteDialogOpen(false);
      toastError(err.response?.data?.detail || "Failed to delete agent");
    },
  });

  const handleFormSubmit = async (data: AgentFormData) => {
    if (selectedAgent)
      await updateMutation.mutateAsync({ id: selectedAgent.id, data });
    else await createMutation.mutateAsync(data);
  };

  const columns: GridColDef[] = [
    {
      field: "sno",
      headerName: "S.No",
      width: 70,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const idx =
          data?.results?.findIndex((r: Agent) => r.id === params.row.id) ?? 0;
        return paginationModel.page * paginationModel.pageSize + idx + 1;
      },
    },
    {
      field: "code",
      headerName: "Code",
      width: 130,
      renderCell: (params) => (
        <Box
          sx={{
            cursor: "pointer",
            color: "primary.main",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={() => {
            setViewAgent(params.row);
            setViewDialogOpen(true);
          }}
        >
          {params.value}
        </Box>
      ),
    },
    { field: "name", headerName: "Agent Name", flex: 1, minWidth: 200 },
    { field: "phone", headerName: "Phone", width: 150 },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      valueGetter: (value) => value || "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {hasPermission(user, "change_agent") && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedAgent(params.row);
                  setFormOpen(true);
                }}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission(user, "delete_agent") && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedAgent(params.row);
                  setDeleteDialogOpen(true);
                }}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <ScreenHeader
            title="Agent Master"
            showBackButton
            onBack={() => navigate("/masters")}
            disableBox
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              placeholder="Search Agents..."
              size="small"
              value={searchInput}
              onChange={handleSearchChange}
              sx={{
                width: 280,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#fff",
                  borderRadius: 2,
                  "&:hover fieldset": { borderColor: "#006766" },
                  "&.Mui-focused fieldset": { borderColor: "#006766" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#006766" }} />
                  </InputAdornment>
                ),
              }}
            />

            {hasPermission(user, "export_agent") && (
              <Button
                variant="outlined"
                startIcon={<FileUploadIcon />}
                onClick={handleExport}
                disabled={exporting}
                sx={{ whiteSpace: "nowrap" }}
              >
                {exporting ? "Exporting..." : "Export"}
              </Button>
            )}
            {hasPermission(user, "add_agent") && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedAgent(null);
                  setFormOpen(true);
                }}
                sx={{ whiteSpace: "nowrap" }}
              >
                Add New Agent
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={getContentSectionStyles()}>
        <Paper
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 400,
            borderRadius: 0,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load Agents
            </Alert>
          )}
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <DataGrid
              rows={data?.results || []}
              columns={columns}
              rowCount={data?.count || 0}
              loading={isLoading || isFetching}
              pageSizeOptions={[10, 20, 50, 100]}
              paginationModel={paginationModel}
              paginationMode="server"
              onPaginationModelChange={setPaginationModel}
              disableRowSelectionOnClick
              sx={getDataGridStyles()}
            />
          </Box>
        </Paper>
      </Box>
      <AgentViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewAgent(null);
        }}
        agent={viewAgent}
      />
      <AgentFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedAgent(null);
        }}
        onSubmit={handleFormSubmit}
        agent={selectedAgent}
        loading={createMutation.isPending || updateMutation.isPending}
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={(_e, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown")
            setDeleteDialogOpen(false);
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Delete Agent
          <IconButton
            onClick={() => setDeleteDialogOpen(false)}
            size="small"
            disabled={deleteMutation.isPending}
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedAgent?.name}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() =>
              selectedAgent && deleteMutation.mutate(selectedAgent.id)
            }
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentList;
