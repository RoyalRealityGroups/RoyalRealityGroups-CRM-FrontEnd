import apiClient from './axios.config';

interface ExportInitResponse {
  message: string;
  request_id: string;
  report_id: string;
  is_long_query: boolean;
}

const waitForReady = async (requestId: string): Promise<void> => {
  for (let i = 0; i < 40; i++) {
    const { data } = await apiClient.post(`/api/reports/generic_export/status/${requestId}/`);
    if (data.status === true) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Export timed out');
};

const downloadFile = async (requestId: string, modelName: string): Promise<void> => {
  const response = await apiClient.post(
    `/api/reports/generic_export/download/${requestId}/`,
    {},
    { responseType: 'blob' }
  );

  const contentDisposition = response.headers['content-disposition'];
  const contentType = String(response.headers['content-type'] || '');
  const isCSV = contentType.includes('text/csv') || contentType.includes('text/plain');
  const defaultFilename = `${modelName}_export.${isCSV ? 'csv' : 'xlsx'}`;

  let filename = defaultFilename;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match?.[1]) {
      filename = match[1].replace(/['"]/g, '');
    }
  }

  const blob = new Blob([response.data], {
    type: isCSV ? 'text/csv;charset=utf-8;' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportApi = {
  genericExport: async (
    modelName: string,
    fileFormat: number = 0,
    queryParams?: Record<string, any>
  ): Promise<void> => {
    const { data } = await apiClient.post<ExportInitResponse>(
      '/api/reports/generic_export/',
      { model_name: modelName, file_format: fileFormat },
      { params: queryParams }
    );

    await waitForReady(data.request_id);
    await downloadFile(data.request_id, modelName);
  },
};
