export interface ColumnMapping {
  actualName: string;
  displayName?: string;
}

export interface ColumnGroup {
  groupName: string;
  columns: (string | ColumnMapping)[];
  color?: string;
  subHeaderColor?: string;
}

export interface ReportColumnConfig {
  reportName: string;
  columnGroups: ColumnGroup[];
}

export const REPORT_COLUMN_CONFIGS: ReportColumnConfig[] = [];

export function setReportColumnConfigsFromApi(
  config: ReportColumnConfig | ReportColumnConfig[]
) {
  REPORT_COLUMN_CONFIGS.length = 0;

  if (Array.isArray(config)) {
    REPORT_COLUMN_CONFIGS.push(...config);
  } else if (config) {
    REPORT_COLUMN_CONFIGS.push(config);
  }
}

/* ======= HELPERS (SAME AS YOUR CODE) ======= */

function getActualColumnName(column: string | ColumnMapping): string {
  return typeof column === 'string' ? column : column.actualName;
}

export function getColumnDisplayName(column: string | ColumnMapping): string {
  if (typeof column === 'string') return column;
  return column.displayName || column.actualName;
}

export function getColumnGroupConfig(reportName: string): ReportColumnConfig | null {
  if (!reportName) return null;

  const normalizedReportName = reportName.toLowerCase().trim();

  return (
    REPORT_COLUMN_CONFIGS.find(config =>
      normalizedReportName.includes(config.reportName.toLowerCase()) ||
      config.reportName.toLowerCase().includes(normalizedReportName)
    ) || null
  );
}

export function getColumnGroupInfo(columnName: string, config: ReportColumnConfig | null) {
  if (!config || !columnName) return null;

  const normalizedColName = columnName.trim().toLowerCase();

  for (let i = 0; i < config.columnGroups.length; i++) {
    const group = config.columnGroups[i];
    const columnIndex = group.columns.findIndex(col =>
      getActualColumnName(col).toLowerCase() === normalizedColName
    );

    if (columnIndex !== -1) {
      return {
        groupIndex: i,
        group,
        columnIndex,
        columnDef: group.columns[columnIndex]
      };
    }
  }
  return null;
}

export function getGroupColumnDisplayName(columnName: string, config: ReportColumnConfig | null): string {
  const info = getColumnGroupInfo(columnName, config);
  return info ? getColumnDisplayName(info.columnDef) : columnName;
}

export function isFirstInGroup(
  columnName: string,
  config: ReportColumnConfig | null,
  visibleColumns: string[]
): boolean {
  const info = getColumnGroupInfo(columnName, config);
  if (!info) return false;

  const firstVisible = info.group.columns.find(col =>
    visibleColumns.some(v =>
      v.toLowerCase() === getActualColumnName(col).toLowerCase()
    )
  );

  // Explicit boolean return
  if (!firstVisible) return false;

  return (
    getActualColumnName(firstVisible).toLowerCase() ===
    columnName.toLowerCase()
  );
}


export function getGroupColspan(groupIndex: number, config: ReportColumnConfig | null, visibleColumns: string[]): number {
  if (!config) return 0;

  return config.columnGroups[groupIndex].columns.filter(col =>
    visibleColumns.some(v => v.toLowerCase() === getActualColumnName(col).toLowerCase())
  ).length;
}

export function getGroupColumnMappings(groupIndex: number, config: ReportColumnConfig | null) {
  if (!config) return [];

  return config.columnGroups[groupIndex].columns.map(col => ({
    actualName: getActualColumnName(col),
    displayName: getColumnDisplayName(col)
  }));
}
