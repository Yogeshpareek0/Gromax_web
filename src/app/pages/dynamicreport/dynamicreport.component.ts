import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { DashboardViewModel, DashboardSection, ReportConfig, ReportData, ViewConfiguration, SectionReportInfo, DashboardListItem, ReportParameter, DropdownOption, MonthYearRange } from '../../model/apiresponse';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import {
  REPORT_COLUMN_CONFIGS,
  setReportColumnConfigsFromApi,
  getColumnGroupConfig,
  getColumnGroupInfo,
  isFirstInGroup,
  getGroupColspan,
  ReportColumnConfig,
  ColumnGroup, getGroupColumnDisplayName
} from './column-group-config';   // Adjust path as needed
import { ActivatedRoute } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

Chart.register(...registerables);

@Component({
  selector: 'app-dynamicreport',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dynamicreport.component.html',
  styleUrl: './dynamicreport.component.css',
  animations: [
    trigger('slideDown', [
      state('closed', style({
        height: '0',
        opacity: '0',
        overflow: 'hidden'
      })),
      state('open', style({
        height: '*',
        opacity: '1',
        overflow: 'visible'
      })),
      transition('closed => open', animate('300ms ease-out')),
      transition('open => closed', animate('300ms ease-in'))
    ])
  ]
})

export class DynamicreportComponent implements OnInit, OnDestroy {
  dashboards: DashboardListItem[] = [];
  selectedDashboardId: number | null = null;
  currentDashboard: DashboardViewModel | null = null;
  selectedSectionId: number | null = null;
  // Store column group configurations for each section
  columnGroupConfigs: Record<number, ReportColumnConfig | null> = {};
  positionId: any;
  userName: any;

  // Consolidated section state
  currentSectionReports: Record<number, SectionReportInfo> = {};
  currentSectionParams: Record<number, any> = {};
  defaultSectionParams: Record<number, any> = {};
  currentSectionData: Record<number, ReportData> = {};
  originalSectionRows: Record<number, any[]> = {};

  // UI state
  chartInstances: Record<number, Chart> = {};
  exportMenuOpen: Record<number, boolean> = {};
  columnVisibility: Record<number, Record<string, boolean>> = {};
  columnFilters: Record<number, Record<string, any[]>> = {};
  columnSearchText: Record<number, Record<string, string>> = {};
  groupByColumn: Record<number, string | null> = {};
  expandedGroups: Record<number, Record<string, boolean>> = {};
  dropdownOptions: Record<string, DropdownOption[]> = {};

  columnManagerOpen: number | null = null;
  activeFilterCol: { sectionId: number; col: string } | null = null;
  isLoading = false;
  showPrintButton = false;
  filterPanelOpen: Record<number, boolean> = {};
  frozenColumns: Record<number, string[]> = {};
  freezeManagerOpen: number | null = null;
  columnWidths: Record<number, Record<string, number>> = {};

  // Track grouping state
  isGrouping: Record<number, boolean> = {};

  // Add these properties in your component class
  monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  yearOptions: number[] = [];

  showCustomDateRange: Record<number, boolean> = {};

  constructor(
    private http: HttpClient,
    private apis: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Close filter dropdown
    if (this.activeFilterCol) {
      const clickedInsideDropdown = target.closest('.column-filter-dropdown');
      const clickedFilterIcon = target.closest('.filter-icon');
      if (!clickedInsideDropdown && !clickedFilterIcon) {
        this.activeFilterCol = null;
      }
    }

    // Close column manager
    if (this.columnManagerOpen !== null) {
      const clickedInsideManager = target.closest('.column-manager');
      const clickedManagerBtn = target.closest('[class*="customize-btn"]');
      if (!clickedInsideManager && !clickedManagerBtn) {
        this.columnManagerOpen = null;
      }
    }

    // Close freeze manager
    if (this.freezeManagerOpen !== null) {
      const clickedInsideFreeze = target.closest('.column-managers');
      const clickedFreezeBtn = target.closest('[class*="customize-btn"]');
      if (!clickedInsideFreeze && !clickedFreezeBtn) {
        this.freezeManagerOpen = null;
      }
    }

    // Close export menu
    if (Object.values(this.exportMenuOpen).some(v => v)) {
      const clickedInsideExport = target.closest('.export-dropdown');
      if (!clickedInsideExport) {
        this.exportMenuOpen = {};
      }
    }
  }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');

    // Generate year options (2000 to current year)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2015; year--) {
      this.yearOptions.push(year);
    }

    // Generate financial year options (last 10 years to next year)
    this.generateFinancialYearOptions();

    this.route.queryParams.subscribe(params => {
      this.selectedDashboardId = Number(params['dashboardId']) || null;
      this.loadDashboardList();
    });
  }

  // Add this method to check if parameter is custom date range
  isCustomDateRange(paramName: string): boolean {
    const customParams = ['startmonth', 'startyear', 'endmonth', 'endyear'];
    return customParams.includes(paramName.toLowerCase());
  }

  // Add this method to get month/year type
  getCustomDateType(paramName: string): 'month' | 'year' | null {
    const name = paramName.toLowerCase();
    if (name.includes('month')) return 'month';
    if (name.includes('year')) return 'year';
    return null;
  }

  // Add after yearOptions declaration
  financialYearOptions: { value: string; label: string; stDate: string; enDate: string }[] = [];

  ngOnDestroy(): void {
    Object.values(this.chartInstances).forEach(chart => chart.destroy());
  }

  // Dashboard Management
  loadDashboardList(): void {
    this.apis.getAllDashboards().subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.dashboards = res.data;
          if (this.selectedDashboardId) this.loadDashboard();
        } else {
          this.apis.showAlert('warning', 'Warning!', 'No dashboards available.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Unable to load dashboards.')
    });
  }

  onDashboardChange(value: number | null): void {
    this.selectedDashboardId = value;
    if (!value) this.resetDashboardState();
  }

  resetDashboardState(): void {
    this.currentDashboard = null;
    this.currentSectionReports = {};
    this.currentSectionParams = {};
    this.currentSectionData = {};
    this.showPrintButton = false;
    this.isLoading = false;
    Object.values(this.chartInstances).forEach(chart => chart.destroy());
    this.chartInstances = {};
  }

  loadDashboard(): void {
    if (!this.selectedDashboardId) {
      this.apis.showAlert('question', 'Required?', 'Please select a dashboard.');
      return;
    }

    this.isLoading = true;
    this.resetDashboardState();

    this.apis.getDashboard({ Id: this.selectedDashboardId }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.statusCode === 200 && response.data) {
          this.processDashboardData(response.data);
        } else {
          this.apis.showAlert('error', 'Error!', 'Dashboard data not found.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.apis.showAlert('error', 'Error!', 'Failed to load dashboard');
      }
    });
  }

  private processDashboardData(apiData: any): void {

    const sections = apiData.sections || [];
    this.currentDashboard = {
      name: apiData.name || 'Dashboard',
      theme: apiData.theme || 'Default',
      sections: sections.map((s: any) => ({
        id: s.id,
        columnWidth: s.columnWidth || 12,
        title: s.title || 'Section',
        files: s.files || [],
        savedReportId: s.savedReportId,
        reportConfigJson: s.reportConfigJson,
        report: s.report || []
      }))
    };

    this.showPrintButton = true;
    if (this.currentDashboard.sections.length > 0) {
      this.selectedSectionId = this.currentDashboard.sections[0].id;
    }

    this.currentDashboard.sections.forEach(section => {
      if (section.reportConfigJson) this.loadSectionReportFromData(section);
    });
  }

  loadSectionReportFromData(section: DashboardSection): void {
    try {
      //console.log('Loading section report for section:', section, section.id, section.title);
      //console.log('Report Config JSON:', section.savedReportId);
      const config: ReportConfig = JSON.parse(section.reportConfigJson || '{}');

      config.ViewConfig = config.ViewConfig || this.getDefaultViewConfig();

      this.initializeSectionState(section.id, config);
      // FIRST set report info
      this.currentSectionReports[section.id] = {
        name: section.title || 'Report',
        config: config,
        reportId: section.savedReportId || 0,
        reportData: section.report
      };

      // THEN load grouping config
      this.loadColumnGroupConfigFromApi(section.title || '', section.id);
      //this.calculateColumnWidths(section.id);

      this.handleDateDefaults(section.id);

      if (config.Parameters?.length) {
        this.loadAllDropdowns(section.id, config.Parameters);
      }

      const reportData = section.report || [];
      this.processReportData(section.id, reportData, config.ViewConfig);

    } catch (e) {
      /* console.error('Error in loadSectionReportFromData:', e);*/
      this.apis.showAlert('error', 'Error!', `Error loading section ${section.title}`);
    }
  }

  private loadColumnGroupConfigFromApi(
    reportName: string,
    sectionId: number
  ): void {

    if (!reportName) return;
    this.apis.getGroupColumnJson({ Name: reportName }).subscribe({
      next: (res: any) => {

        if (res?.statusCode === 200 && res.data) {
          setReportColumnConfigsFromApi(res.data);
          this.initializeColumnGroupConfig(sectionId);
          this.calculateColumnWidths(sectionId);

          //console.log(
          //  'Column Group Config loaded & initialized Dinesh:',
          //  res.data
          //);
        }
      },
      error: () => {
        console.error('Failed to load column group config');
      }
    });
  }

  private getDefaultViewConfig(): ViewConfiguration {
    return {
      ViewType: 'Table',
      ChartType: 'Bar',
      PrimaryColor: '#4caf50',
      SecondaryColor: '#2196f3',
      BackgroundColor: '#ffffff',
      TextColor: '#333333',
      ExportOptions: {
        AllowExcelExport: true,
        AllowPDFExport: true,
        AllowCSVExport: true,
        AllowCopyToClipboard: true
      }
    };
  }

  //private handleDateDefaults(sectionId: number): void {
  //  const reportInfo = this.currentSectionReports[sectionId];
  //  if (!reportInfo?.config?.Parameters) return;

  //  const today = new Date();
  //  const currentYear = today.getFullYear();
  //  const currentMonth = today.getMonth() + 1; // 1-12

  //  // Reset custom date range visibility
  //  this.showCustomDateRange[sectionId] = false;

  //  // Set default Financial Year (current FY) - ONLY FOR COMPARATIVE BDC
  //  if (this.isComparativeBDCReport(sectionId)) {
  //    const currentFYStart = currentMonth >= 4 ? currentYear : currentYear - 1;
  //    const defaultFY = `${currentFYStart}-${currentFYStart + 1}`;
  //    this.currentSectionParams[sectionId]['FinancialYear'] = defaultFY;
  //    this.defaultSectionParams[sectionId]['FinancialYear'] = defaultFY;
  //  }

  //  reportInfo.config.Parameters.forEach(param => {
  //    const paramName = param.Name.toLowerCase();

  //    // Handle custom month/year parameters
  //    if (paramName === 'startmonth') {
  //      const defaultValue = param.DefaultValue || 1;
  //      this.currentSectionParams[sectionId][param.Name] = defaultValue;
  //      this.defaultSectionParams[sectionId][param.Name] = defaultValue;
  //    }
  //    else if (paramName === 'endmonth') {
  //      const defaultValue = param.DefaultValue || currentMonth;
  //      this.currentSectionParams[sectionId][param.Name] = defaultValue;
  //      this.defaultSectionParams[sectionId][param.Name] = defaultValue;
  //    }
  //    else if (paramName === 'startyear') {
  //      const defaultValue = param.DefaultValue || currentYear;
  //      this.currentSectionParams[sectionId][param.Name] = defaultValue;
  //      this.defaultSectionParams[sectionId][param.Name] = defaultValue;
  //    }
  //    else if (paramName === 'endyear') {
  //      const defaultValue = param.DefaultValue || currentYear;
  //      this.currentSectionParams[sectionId][param.Name] = defaultValue;
  //      this.defaultSectionParams[sectionId][param.Name] = defaultValue;
  //    }
  //    // Handle regular date parameters
  //    else if (param.DataType === 'Date' || param.DataType === 'DateTime') {
  //      const year = today.getFullYear();
  //      const month = today.getMonth() + 1;
  //      const day = today.getDate();

  //      const firstDayStr = `${year}-${String(month).padStart(2, '0')}-01`;
  //      const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  //      let valueToSet: string;
  //      if (param.DefaultValue && param.DefaultValue !== '') {
  //        valueToSet = param.DefaultValue;
  //      } else {
  //        valueToSet = paramName.includes('start') || paramName.includes('from')
  //          ? firstDayStr
  //          : currentDateStr;
  //      }

  //      this.currentSectionParams[sectionId][param.Name] = valueToSet;
  //      this.defaultSectionParams[sectionId][param.Name] = valueToSet;
  //    }
  //  });
  //}

  private handleDateDefaults(sectionId: number): void {
    const reportInfo = this.currentSectionReports[sectionId];
    if (!reportInfo?.config?.Parameters) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    this.showCustomDateRange[sectionId] = false;

    // Set default Financial Year (current FY) - ONLY FOR COMPARATIVE BDC
    if (this.isComparativeBDCReport(sectionId)) {
      const currentFYStart = currentMonth >= 4 ? currentYear : currentYear - 1;
      const defaultFY = `${currentFYStart}-${currentFYStart + 1}`;
      this.currentSectionParams[sectionId]['FinancialYear'] = defaultFY;
      this.defaultSectionParams[sectionId]['FinancialYear'] = defaultFY;
    }

    reportInfo.config.Parameters.forEach(param => {
      const paramNameLower = param.Name.toLowerCase();

      // Handle custom month/year parameters
      if (paramNameLower === 'startmonth') {
        const defaultValue = param.DefaultValue || 1;
        this.currentSectionParams[sectionId][param.Name] = defaultValue;
        this.defaultSectionParams[sectionId][param.Name] = defaultValue;
      }
      else if (paramNameLower === 'endmonth') {
        const defaultValue = param.DefaultValue || currentMonth;
        this.currentSectionParams[sectionId][param.Name] = defaultValue;
        this.defaultSectionParams[sectionId][param.Name] = defaultValue;
      }
      else if (paramNameLower === 'startyear') {
        const defaultValue = param.DefaultValue || currentYear;
        this.currentSectionParams[sectionId][param.Name] = defaultValue;
        this.defaultSectionParams[sectionId][param.Name] = defaultValue;
      }
      else if (paramNameLower === 'endyear') {
        const defaultValue = param.DefaultValue || currentYear;
        this.currentSectionParams[sectionId][param.Name] = defaultValue;
        this.defaultSectionParams[sectionId][param.Name] = defaultValue;
      }
      // Handle regular date parameters
      else if (param.DataType === 'Date' || param.DataType === 'DateTime') {
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        const firstDayStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        let valueToSet: string;

        if (param.DefaultValue && param.DefaultValue !== '') {
          valueToSet = param.DefaultValue;
        } else {
          const isStartDate = paramNameLower.includes('start') ||
            paramNameLower.includes('from') ||
            paramNameLower.includes('stdate') ||
            paramNameLower.startsWith('st');

          valueToSet = isStartDate ? firstDayStr : currentDateStr;
        }

        this.currentSectionParams[sectionId][param.Name] = valueToSet;
        this.defaultSectionParams[sectionId][param.Name] = valueToSet;
      }
    });
  }

  // Add this method after shouldShowGroupBy()
  isComparativeBDCReport(sectionId: number): boolean {
    const reportName = this.currentSectionReports[sectionId]?.name?.toLowerCase() || '';
    return reportName.includes('comparative bdc');
  }

  private initializeSectionState(sectionId: number, config: ReportConfig): void {
    this.currentSectionParams[sectionId] = {};
    this.defaultSectionParams[sectionId] = {};
    this.columnSearchText[sectionId] = {};
    this.columnVisibility[sectionId] = {};
    this.columnFilters[sectionId] = {};
    this.expandedGroups[sectionId] = {};
    this.groupByColumn[sectionId] = null;
    this.filterPanelOpen[sectionId] = false;
    this.frozenColumns[sectionId] = [];
    this.columnWidths[sectionId] = {};
    this.isGrouping[sectionId] = false;

    // Initialize showCustomDateRange to false
    this.showCustomDateRange[sectionId] = false;

    // CRITICAL: Initialize column group config to null
    this.columnGroupConfigs[sectionId] = null;

    config.Parameters?.forEach(param => {
      if (param.DataType !== 'Date' && param.DataType !== 'DateTime') {
        if (param.DefaultValue !== undefined) {
          this.currentSectionParams[sectionId][param.Name] = param.DefaultValue;
          this.defaultSectionParams[sectionId][param.Name] = param.DefaultValue;
        }
      }
    });
  }

  private processReportData(sectionId: number, rows: any[], viewConfig: ViewConfiguration): void {
    const columns = this.getOrderedColumns(rows);

    this.currentSectionData[sectionId] = {
      success: true,
      columns: columns,
      rows: rows || []
    };
    this.originalSectionRows[sectionId] = rows ? [...rows] : [];

    columns.forEach(col => {
      this.initColumnState(sectionId, col);
      if (this.shouldHideStateColumn(sectionId, col)) {
        this.columnVisibility[sectionId][col] = false;
      }
    });

    // Set frozen columns
    const visibleCols = columns.filter(col => this.columnVisibility[sectionId][col]);
    this.frozenColumns[sectionId] = visibleCols.slice(0, 4);

    // Calculate widths IMMEDIATELY (includes total row calculation)
    if (rows?.length > 0 && viewConfig.ViewType === 'Table') {
      // First calculation - synchronous
      this.calculateColumnWidths(sectionId);
      this.cdr.detectChanges();

      // Second calculation after DOM renders - for accuracy
      setTimeout(() => {
        this.calculateColumnWidths(sectionId);
        this.cdr.detectChanges();
      }, 100);
    }

    if (viewConfig.ViewType === 'Chart' && rows?.length) {
      setTimeout(() => this.renderChart(sectionId, this.currentSectionData[sectionId], viewConfig), 300);
    }
  }

  private initColumnState(sectionId: number, col: string): void {
    if (!this.columnVisibility[sectionId]) this.columnVisibility[sectionId] = {};
    if (!this.columnFilters[sectionId]) this.columnFilters[sectionId] = {};
    if (!this.columnSearchText[sectionId]) this.columnSearchText[sectionId] = {};

    this.columnVisibility[sectionId][col] ??= true;
    this.columnFilters[sectionId][col] ??= [];
    this.columnSearchText[sectionId][col] ??= '';
  }

  private getOrderedColumns(rows: any[]): string[] {
    if (!rows?.length) return [];
    const allColumns = Object.keys(rows[0]);
    const normalColumns = allColumns.filter(col => isNaN(Number(col)) && !/^\d/.test(col));
    const modelColumns = allColumns.filter(col => !normalColumns.includes(col));
    return [...normalColumns, ...modelColumns];
  }

  // calculateColumnWidths with better sizing logic
  calculateColumnWidths(sectionId: number): void {

    const columns = this.currentSectionData[sectionId]?.columns || [];
    const visibility = this.columnVisibility[sectionId] || {};
    const hasGrouping = this.hasColumnGrouping(sectionId);
    const rows = this.currentSectionData[sectionId]?.rows || [];

    // Calculate total row values FIRST
    const totalRowValues: Record<string, string> = {};
    columns.forEach((col) => {

      const totalValue = this.getColumnTotal(sectionId, col);
      if (totalValue !== '') {
        totalRowValues[col] = this.formatDecimal(totalValue).toString();
      }
    });

    columns.forEach((col) => {
      if (!visibility[col]) return;



      const colLower = col.toLowerCase().trim();
      if (colLower === 'model code') {
        this.columnWidths[sectionId][col] = 180;
        return;
      }
      if (colLower === 'chassis no') {
        this.columnWidths[sectionId][col] = 180;
        return;
      }
      if (colLower === 'chassis number') {
        this.columnWidths[sectionId][col] = 180;
        return;
      }
      if (colLower === 'mop url' || colLower === ' rc url') {
        this.columnWidths[sectionId][col] = 100;
        return;
      }

      const isGrouped = hasGrouping && this.isColumnInGroup(sectionId, col);
      const displayName = isGrouped ? this.getColumnDisplayName(sectionId, col) : col;

      const isShortCode = isGrouped && this.isShortCodeColumn(displayName);

      if (isShortCode) {
        this.columnWidths[sectionId][col] = 54;
        return;
      }

      // Check if month column
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const isMonthColumn = monthNames.includes(displayName) || monthNames.includes(col);

      let finalWidth: number;

      // FOR MONTH COLUMNS: Fixed 56px width
      if (isMonthColumn) {
        finalWidth = 56;
      }
      // FOR OTHER COLUMNS: Calculate based on content + TOTAL ROW
      else {
        // Header width
        const headerTextLength = displayName.length;
        const headerWidth = (headerTextLength * 8) + 33;

        // Check total row value width FIRST
        let maxContentWidth = headerWidth;

        if (totalRowValues[col]) {
          const totalStr = totalRowValues[col];
          const totalWidth = (totalStr.length * 8) + 20;
          maxContentWidth = Math.max(maxContentWidth, totalWidth);
        }

        // Then check data rows (sample)
        const sampleSize = Math.min(rows.length, 100);
        for (let i = 0; i < sampleSize; i++) {
          const value = rows[i][col];
          if (value != null) {
            const valueStr = String(value);
            const valueWidth = (valueStr.length * 8) + 24;
            maxContentWidth = Math.max(maxContentWidth, valueWidth);
          }
        }

        // Determine min/max based on column type
        let minWidth: number;
        let maxWidth: number;

        if (isGrouped) {
          // Grouped columns (but not short codes, as they're already handled above)
          minWidth = 58;
          maxWidth = 160;
        } else {
          // Regular columns (Dir Name, SAP, etc.)
          minWidth = 71;
          maxWidth = 180;
        }

        // Apply min/max constraints
        finalWidth = Math.max(minWidth, Math.min(maxContentWidth, maxWidth));
      }

      this.columnWidths[sectionId][col] = finalWidth;
    });

    /*console.log('Column widths calculated (with total row):', this.columnWidths[sectionId]);*/
    this.cdr.detectChanges();
  }

  private isShortCodeColumn(displayName: string): boolean {
    if (!displayName) return false;

    const upperDisplayName = displayName.trim().toUpperCase();

    const knownShortCodes = ['BL', 'SF', 'YLW', 'BLK'];

    const isExactMatch = knownShortCodes.includes(upperDisplayName);

    if (isExactMatch) {
      /*console.log(`Exact match short code: ${displayName}`);*/
    }

    return isExactMatch;
  }

  // Dropdown Management
  loadAllDropdowns(sectionId: number, params: ReportParameter[]): void {

    const dropdownParams = params
      .filter(p => p.DataType === 'Dropdown' && p.DropdownQuery)
      .map(p => ({ paramName: p.Name, query: p.DropdownQuery }));

    if (!dropdownParams.length) return;

    const payload = {
      reportId: this.currentSectionReports[sectionId]?.reportId,
      dropdowns: dropdownParams
    };
    this.apis.getDropdownData(payload).subscribe({
      next: (res: any) => {
        if (res?.statusCode === 200 && res.data) {
          this.processDropdownData(sectionId, res.data);
        }
      }
    });
  }

  private processDropdownData(sectionId: number, data: any): void {
    Object.keys(data).forEach(paramName => {
      const key = `${sectionId}_${paramName}`;
      const options: DropdownOption[] = (data[paramName] || [])
        .filter((v: any) => v != null)
        .map((v: any) => ({ value: v, label: v }));

      this.dropdownOptions[key] = options;

      const defaultVal = this.currentSectionParams[sectionId][paramName];
      const match = options.find(o =>
        this.normalizeValue(o.value) === this.normalizeValue(defaultVal)
      );

      if (match) {
        this.currentSectionParams[sectionId][paramName] = match.value;

        if (this.normalizeValue(match.value) === 'custom') {
          this.showCustomDateRange[sectionId] = true;

          this.currentSectionParams[sectionId]['StartMonth'] = '';
          this.currentSectionParams[sectionId]['StartYear'] = '';
          this.currentSectionParams[sectionId]['EndMonth'] = '';
          this.currentSectionParams[sectionId]['EndYear'] = '';

          this.cdr.detectChanges();
        }
      }
    });
  }

  getDropdownOptionsForParam(sectionId: number, paramName: string): DropdownOption[] {
    return this.dropdownOptions[`${sectionId}_${paramName}`] || [];
  }

  applyFilters(sectionId: number): void {
    const reportInfo = this.currentSectionReports[sectionId];
    if (!reportInfo) return;

    const uiParams = this.currentSectionParams[sectionId] || {};
    const visibleParams = this.getVisibleParameters(reportInfo.config.Parameters || []);

    // Required validation
    for (const param of visibleParams) {
      if (param.IsRequired && !uiParams[param.Name]) {
        this.apis.showAlert('question', 'Required?', `Please fill ${param.DisplayName || param.Name}`);
        return;
      }
    }

    // Custom date range validation
    if (this.showCustomDateRange[sectionId]) {
      if (!uiParams['StartMonth'] || !uiParams['StartYear'] || !uiParams['EndMonth'] || !uiParams['EndYear']) {
        this.apis.showAlert('question', 'Required?', 'Please fill all custom date range fields');
        return;
      }

      const startMonth = Number(uiParams['StartMonth']);
      const startYear = Number(uiParams['StartYear']);
      const endMonth = Number(uiParams['EndMonth']);
      const endYear = Number(uiParams['EndYear']);

      const startDate = new Date(startYear, startMonth - 1, 1);
      const endDate = new Date(endYear, endMonth - 1, 1);

      if (endDate < startDate) {
        this.apis.showAlert('warning', 'Invalid Date Range', 'End month/year should be greater than or equal to start month/year');
        return;
      }
    }

    // Update State column visibility
    const columns = this.currentSectionData[sectionId]?.columns || [];
    columns.forEach(col => {
      if (col.toLowerCase() === 'state' || col.toLowerCase() === 'statename') {
        this.columnVisibility[sectionId][col] = !this.shouldHideStateColumn(sectionId, col);
      }
    });

    // Use helper method to prepare params
    const finalParams = this.prepareParamsForExecution(sectionId);

    /*console.log('Final Params sent to API:', finalParams);*/

    this.executeReport(sectionId, reportInfo.config, finalParams);
  }

  getMonthYearDateRange(startMonth: number, startYear: number, endMonth: number, endYear: number): MonthYearRange {
    const stDate = new Date(startYear, startMonth - 1, 1);
    const enDate = new Date(endYear, endMonth, 0);

    return {
      stDate: this.formatDateYYYYMMDD(stDate),
      enDate: this.formatDateYYYYMMDD(enDate)
    };
  }

  getVisibleParameters(params: ReportParameter[]): ReportParameter[] {
    const hiddenParams = ['loginas', 'username'];
    return params.filter(p => !hiddenParams.includes(p.Name.toLowerCase()));
  }

  clearFilters(sectionId: number): void {
    const reportInfo = this.currentSectionReports[sectionId];
    if (!reportInfo) return;

    this.currentSectionParams[sectionId] = this.getDefaultParameterValues(
      reportInfo.config.Parameters || []
    );
    this.executeReport(sectionId, reportInfo.config, this.currentSectionParams[sectionId]);
  }
  refreshSection(sectionId: number): void {
    const reportInfo = this.currentSectionReports[sectionId];
    if (!reportInfo) return;

    this.groupByColumn[sectionId] = null;
    this.expandedGroups[sectionId] = {};

    this.currentSectionParams[sectionId] = { ...this.defaultSectionParams[sectionId] };

    // Reset custom date range
    this.showCustomDateRange[sectionId] = false;

    if (this.isComparativeBDCReport(sectionId)) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentFYStart = currentMonth >= 4 ? currentYear : currentYear - 1;
      const defaultFY = `${currentFYStart}-${currentFYStart + 1}`;
      this.currentSectionParams[sectionId]['FinancialYear'] = defaultFY;
    } else {
      delete this.currentSectionParams[sectionId]['FinancialYear'];
    }

    this.handleDateDefaults(sectionId);

    setTimeout(() => {
      this.syncDropdownDefaults(sectionId);

      const params = this.currentSectionParams[sectionId];
      Object.keys(params).forEach(paramName => {
        if (this.normalizeValue(params[paramName]) === 'custom') {
          this.showCustomDateRange[sectionId] = true;
          this.filterPanelOpen[sectionId] = true;
          this.currentSectionParams[sectionId]['StartMonth'] = '';
          this.currentSectionParams[sectionId]['StartYear'] = '';
          this.currentSectionParams[sectionId]['EndMonth'] = '';
          this.currentSectionParams[sectionId]['EndYear'] = '';
          this.cdr.detectChanges();
        }
      });
    });

    this.resetTableUIState(sectionId);

    if (this.columnManagerOpen === sectionId) this.columnManagerOpen = null;
    if (this.freezeManagerOpen === sectionId) this.freezeManagerOpen = null;

    const paramsToSend = this.prepareParamsForExecution(sectionId);
    this.executeReport(sectionId, reportInfo.config, paramsToSend);
  }

  // Add this new method after applyFilters()
  private prepareParamsForExecution(sectionId: number): any {
    const uiParams = this.currentSectionParams[sectionId] || {};
    const finalParams: any = {};

    // Copy non-date params safely
    for (const key in uiParams) {
      if (!['StartMonth', 'StartYear', 'EndMonth', 'EndYear', 'FinancialYear'].includes(key)) {
        finalParams[key] = uiParams[key];
      }
    }

    // Financial Year handling
    if (uiParams['FinancialYear']) {
      const selectedFY = this.financialYearOptions.find(
        fy => fy.value === uiParams['FinancialYear']
      );

      if (selectedFY) {
        finalParams['stDate'] = selectedFY.stDate;
        finalParams['enDate'] = selectedFY.enDate;
      }
    }
    // Custom date range handling
    else if (this.showCustomDateRange[sectionId]) {
      if (uiParams['StartMonth'] && uiParams['StartYear'] && uiParams['EndMonth'] && uiParams['EndYear']) {
        const dateRange = this.getMonthYearDateRange(
          uiParams['StartMonth'],
          uiParams['StartYear'],
          uiParams['EndMonth'],
          uiParams['EndYear']
        );

        finalParams['stDate'] = dateRange.stDate;
        finalParams['enDate'] = dateRange.enDate;
      }
    }

    return finalParams;
  }

  private getDefaultParameterValues(parameters: ReportParameter[]): any {
    return parameters.reduce((acc, param) => {
      if (param.DefaultValue) acc[param.Name] = param.DefaultValue;
      return acc;
    }, {} as any);
  }

  executeReport(sectionId: number, config: ReportConfig, paramValues: any): void {

    const enrichedParams = { ...paramValues };

    const hasLoginAs = config.Parameters?.some(p => p.Name.toLowerCase() === 'loginas');
    const hasUsername = config.Parameters?.some(p => p.Name.toLowerCase() === 'username');

    if (hasLoginAs && this.positionId) {
      enrichedParams['loginas'] = this.positionId;
    }

    if (hasUsername && this.userName) {
      enrichedParams['username'] = this.userName;
    }

    const payload = {
      Id: this.currentSectionReports[sectionId].reportId,
      Parameters: Object.keys(enrichedParams).map(key => ({
        Name: key.replace('@', ''),
        DefaultValue: enrichedParams[key]
      }))
    };

    this.apis.executeQuery(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.handleReportSuccess(sectionId, res.data.report || [], config.ViewConfig);
        } else {
          this.handleReportNoData(sectionId);
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Could not fetch report data.')
    });
  }

  private handleReportSuccess(sectionId: number, reportData: any[], viewConfig?: ViewConfiguration): void {
    const columns = this.getOrderedColumns(reportData);

    this.currentSectionData[sectionId] = { success: true, columns, rows: reportData };
    this.originalSectionRows[sectionId] = [...reportData];

    Object.keys(this.columnFilters[sectionId] || {}).forEach(col => {
      this.columnFilters[sectionId][col] = [];
    });
    Object.keys(this.columnSearchText[sectionId] || {}).forEach(col => {
      this.columnSearchText[sectionId][col] = '';
    });
    this.activeFilterCol = null;

    // Reinitialize column grouping
    this.initializeColumnGroupConfig(sectionId);

    columns.forEach(col => {
      this.initColumnState(sectionId, col);
      if (this.shouldHideStateColumn(sectionId, col)) {
        this.columnVisibility[sectionId][col] = false;
      }
    });

    const existingFrozenCols = this.frozenColumns[sectionId] || [];
    const validFrozenCols = existingFrozenCols.filter(col => columns.includes(col));

    if (validFrozenCols.length > 0) {
      this.frozenColumns[sectionId] = validFrozenCols;
    } else {
      const visibleCols = columns.filter(col => this.columnVisibility[sectionId][col]);
      this.frozenColumns[sectionId] = visibleCols.slice(0, 4);
    }

    // Calculate widths immediately on data refresh
    if (reportData?.length > 0 && viewConfig?.ViewType === 'Table') {
      this.calculateColumnWidths(sectionId);
      this.cdr.detectChanges();

      setTimeout(() => {
        this.calculateColumnWidths(sectionId);
        this.frozenColumns[sectionId] = [...this.frozenColumns[sectionId]];
      }, 100);
    }

    if (viewConfig?.ViewType === 'Chart') {
      setTimeout(() => this.renderChart(sectionId, this.currentSectionData[sectionId], viewConfig), 0);
    }
  }

  private handleReportNoData(sectionId: number): void {
    this.currentSectionData[sectionId] = { success: true, columns: [], rows: [] };
    this.apis.showAlert('warning', 'No Data', 'No data found for the selected filters.');
  }

  // Chart Rendering
  renderChart(sectionId: number, data: ReportData, viewConfig: ViewConfiguration): void {
    const canvas = document.getElementById(`chart-${sectionId}`) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartInstances[sectionId]) {
      this.chartInstances[sectionId].destroy();
    }

    const xAxis = viewConfig.XAxisColumn || '';
    const yAxis = viewConfig.YAxisColumn || '';

    if (!xAxis || !yAxis || !data.columns.includes(xAxis) || !data.columns.includes(yAxis)) {
      return;
    }

    const labels = data.rows.map(row => row[xAxis]);
    const values = data.rows.map(row => parseFloat(row[yAxis]) || 0);
    const chartType = (viewConfig.ChartType || 'Bar').toLowerCase();

    const chartConfig = this.buildChartConfig(
      chartType,
      labels,
      values,
      yAxis,
      xAxis,
      viewConfig
    );

    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.chartInstances[sectionId] = new Chart(ctx, chartConfig);
    }
  }

  private buildChartConfig(
    chartType: string,
    labels: any[],
    values: number[],
    yLabel: string,
    xLabel: string,
    viewConfig: ViewConfiguration
  ): ChartConfiguration {
    const { PrimaryColor, SecondaryColor, BackgroundColor, TextColor } = viewConfig;

    const backgroundColors = this.getChartBackgroundColors(
      chartType,
      values.length,
      PrimaryColor || '#667eea',
      SecondaryColor || '#764ba2',
      BackgroundColor || '#ffffff'
    );

    const config: ChartConfiguration = {
      type: chartType === 'area' ? 'line' : chartType as any,
      data: {
        labels,
        datasets: [{
          label: yLabel,
          data: values,
          backgroundColor: backgroundColors,
          borderColor: chartType === 'line' ? PrimaryColor : SecondaryColor,
          borderWidth: chartType === 'line' ? 3 : 2,
          tension: 0.4,
          fill: chartType === 'area',
          pointRadius: chartType === 'line' ? 5 : 0,
          pointHoverRadius: chartType === 'line' ? 7 : 0,
          pointBackgroundColor: PrimaryColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: ['pie', 'doughnut'].includes(chartType) ? 'right' : 'top',
            labels: {
              font: { size: 13, weight: 600 },
              padding: 15,
              usePointStyle: true,
              color: TextColor || '#333'
            }
          },
          title: {
            display: true,
            text: `${yLabel} by ${xLabel}`,
            font: { size: 18, weight: 'bold' },
            padding: { top: 10, bottom: 25 },
            color: TextColor || '#333'
          }
        }
      }
    };

    if (!['pie', 'doughnut'].includes(chartType)) {
      config.options!.scales = {
        y: {
          beginAtZero: true,
          grid: { color: this.hexToRgba(TextColor || '#333', 0.08) },
          ticks: { color: TextColor || '#333' }
        },
        x: {
          grid: { display: false },
          ticks: {
            color: TextColor || '#333',
            maxRotation: 45,
            minRotation: 0
          }
        }
      };
    }

    if (chartType === 'area') {
      config.data.datasets[0].backgroundColor = this.hexToRgba(PrimaryColor || '#667eea', 0.15);
    }

    return config;
  }

  private getChartBackgroundColors(
    chartType: string,
    count: number,
    primary: string,
    secondary: string,
    bg: string
  ): any {
    if (['pie', 'doughnut'].includes(chartType)) {
      return this.generateChartColors(count, primary, secondary);
    }
    if (chartType === 'line') {
      return primary;
    }
    return Array.from({ length: count }, (_, i) =>
      this.interpolateColor(primary, secondary, i / Math.max(count - 1, 1))
    );
  }

  toggleColumnFilter(sectionId: number, col: string, event?: MouseEvent): void {
    event?.stopPropagation();

    if (
      this.activeFilterCol?.sectionId === sectionId &&
      this.activeFilterCol?.col === col
    ) {
      this.activeFilterCol = null;
    } else {
      this.activeFilterCol = { sectionId, col };
    }
  }

  // This function is not working this function yet
  private positionFilterDropdown(th: HTMLElement): void {
    const dropdown = document.querySelector(
      '.column-filter-dropdown'
    ) as HTMLElement;

    const container = th.closest('.table-scroll-wrapper') as HTMLElement;
    if (!dropdown || !container) return;

    const thRect = th.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const top =
      thRect.bottom - containerRect.top + container.scrollTop + 6;

    const left =
      thRect.left -
      containerRect.left +
      container.scrollLeft +
      thRect.width / 2 -
      dropdown.offsetWidth / 2;

    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${Math.max(left, 8)}px`; // prevent overflow
  }

  isAllSelected(sectionId: number, col: string): boolean {
    const allValues = this.getFilteredColumnValues(sectionId, col);
    const selected = this.columnFilters[sectionId][col] || [];
    return allValues.length > 0 && allValues.length === selected.length;
  }

  toggleSelectAll(sectionId: number, col: string, event: any): void {
    event.stopPropagation();
    const allValues = this.getFilteredColumnValues(sectionId, col);

    if (this.isAllSelected(sectionId, col)) {
      this.columnFilters[sectionId][col] = [];
    } else {
      this.columnFilters[sectionId][col] = [...allValues];
    }

    this.applyColumnFilters(sectionId);
  }

  getFilteredColumnValues(sectionId: number, col: string): any[] {
    let rows = [...this.originalSectionRows[sectionId]];

    Object.keys(this.columnFilters[sectionId] || {}).forEach(filterCol => {
      if (filterCol !== col) {
        const selected = this.columnFilters[sectionId][filterCol];
        if (selected.length) {
          rows = rows.filter(r => selected.includes(r[filterCol]));
        }
      }
    });

    let values = Array.from(
      new Set(rows.map(r => {
        const v = r[col];
        return v == null || v === '' ? '__BLANK__' : v;
      }))
    );

    const search = this.columnSearchText[sectionId]?.[col];
    if (search) {
      values = values.filter(v =>
        v.toString().toLowerCase().includes(search.toLowerCase())
      );
    }

    return values;
  }

  onColumnFilterChange(sectionId: number, col: string, value: any, e: any): void {
    const arr = this.columnFilters[sectionId][col];

    if (e.target.checked) {
      if (!arr.includes(value)) arr.push(value);
    } else {
      const idx = arr.indexOf(value);
      if (idx > -1) arr.splice(idx, 1);
    }

    this.applyColumnFilters(sectionId);
  }

  applyColumnFilters(sectionId: number): void {
    let rows = [...this.originalSectionRows[sectionId]];

    Object.keys(this.columnFilters[sectionId] || {}).forEach(col => {
      const selected = this.columnFilters[sectionId][col];
      if (selected.length) {
        rows = rows.filter(r => {
          const value = r[col] == null || r[col] === '' ? '__BLANK__' : r[col];
          return selected.includes(value);
        });
      }
    });

    this.currentSectionData[sectionId].rows = rows;
    if (rows?.length > 0) {
      setTimeout(() => {
        this.calculateColumnWidths(sectionId);
      }, 0);
    }
  }

  clearColumnFilter(sectionId: number, col: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.columnFilters[sectionId][col] = [];
    this.columnSearchText[sectionId][col] = '';
    this.applyColumnFilters(sectionId);
    this.activeFilterCol = null;
  }

  getGroupedDataWithSum(sectionId: number) {

    const groupCol = this.groupByColumn[sectionId];
    if (!groupCol) return [];

    const rows = this.getFilteredRows(sectionId);
    const groups = new Map();

    rows.forEach(row => {
      const rawKey = row[groupCol];
      const mapKey = rawKey == null || rawKey === '' ? '(BLANK)' : String(rawKey).trim().toUpperCase();
      const displayKey = rawKey == null || rawKey === '' ? '(Blank)' : String(rawKey).trim();

      if (!groups.has(mapKey)) {
        groups.set(mapKey, { mapKey, key: displayKey, rows: [], sums: {} });
      }

      const g = groups.get(mapKey);
      g.rows.push(row);

      Object.keys(row).forEach(col => {
        const value = row[col];
        if (typeof value === 'number') {
          g.sums[col] = (g.sums[col] || 0) + value;
        }
      });
    });

    // Format all sums to 2 decimal places
    const groupsArray = Array.from(groups.values());
    groupsArray.forEach(group => {
      Object.keys(group.sums).forEach(col => {
        const sum = group.sums[col];
        if (typeof sum === 'number') {
          // Round to 2 decimal places and convert back to number
          group.sums[col] = Math.round(sum * 100) / 100;
        }
      });
    });

    return groupsArray;
  }

  toggleGroupRow(sectionId: number, groupKey: string): void {
    this.expandedGroups[sectionId] ??= {};
    this.expandedGroups[sectionId][groupKey] = !this.expandedGroups[sectionId][groupKey];
  }

  //onGroupByChange - Preserve calculated widths properly
  onGroupByChange(sectionId: number): void {

    this.expandedGroups[sectionId] = {};

    const table = document.querySelector(`#section-${sectionId} .report-table`) as HTMLTableElement;

    // Calculate widths FIRST (includes total row)
    this.calculateColumnWidths(sectionId);

    // Store the calculated widths (not empty object)
    const calculatedWidths = { ...this.columnWidths[sectionId] };

    if (table) {
      table.classList.add('table-transitioning');
    }

    this.isGrouping[sectionId] = true;

    // Use calculated widths during transition
    this.columnWidths[sectionId] = calculatedWidths;

    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Recalculate after DOM settles (for grouped headers)
        this.calculateColumnWidths(sectionId);
        this.frozenColumns[sectionId] = [...this.frozenColumns[sectionId]];

        setTimeout(() => {
          if (table) {
            table.classList.remove('table-transitioning');
          }
          this.isGrouping[sectionId] = false;
          this.cdr.detectChanges();
        }, 100);
      });
    });
  }

  // Export Functions
  toggleExportMenu(sectionId: number): void {
    this.exportMenuOpen[sectionId] = !this.exportMenuOpen[sectionId];
  }

  private getCurrentDateString(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
  }

  private buildSectionExportData(sectionId: number) {
    const data = this.currentSectionData[sectionId];
    const params = this.currentSectionParams[sectionId];
    const reportInfo = this.currentSectionReports[sectionId];

    if (!data?.rows?.length) return null;

    const allColumns = data.columns || [];
    const visibleColumns = allColumns.filter(col =>
      this.columnVisibility[sectionId]?.[col] !== false
    );

    return {
      reportName: reportInfo?.name || `Section ${sectionId}`,
      exportDate: new Date().toLocaleString(),
      params: params || {},
      columns: visibleColumns,
      rows: data.rows
    };
  }

  // exportSectionToCSV
  exportSectionToCSV(sectionId: number): void {
    const exportData = this.buildSectionExportData(sectionId);
    if (!exportData) {
      this.apis.showAlert('warning', 'No Data', 'Nothing to export');
      return;
    }

    const dateStr = this.getCurrentDateString();
    const reportName = exportData.reportName || `Section_${sectionId}`;
    const filename = `${reportName}_${dateStr}.csv`;

    const paramConfig = this.getVisibleParameters(
      this.currentSectionReports[sectionId]?.config?.Parameters || []
    );

    const csv: string[] = [
      `Report Name,${reportName}`,
      `Export Date,${this.formatDateYYYYMMDD(exportData.exportDate)}`,
      '',
      'Parameters,'
    ];

    paramConfig.forEach(p => {
      const value = exportData.params?.[p.Name];
      const formattedValue =
        p.DataType === 'Date' || p.DataType === 'DateTime'
          ? this.formatDateYYYYMMDD(value)
          : value ?? '';
      csv.push(`"${p.DisplayName || p.Name}","${formattedValue}"`);
    });

    // Custom date range params
    if (this.showCustomDateRange[sectionId]) {
      const uiParams = this.currentSectionParams[sectionId] || {};
      const sm = this.monthOptions.find(m => m.value == uiParams['StartMonth'])?.label || uiParams['StartMonth'] || '';
      const sy = uiParams['StartYear'] || '';
      const em = this.monthOptions.find(m => m.value == uiParams['EndMonth'])?.label || uiParams['EndMonth'] || '';
      const ey = uiParams['EndYear'] || '';
      csv.push(`"Date Range","${sm} ${sy} to ${em} ${ey}"`);
    }

    csv.push('');

    const hasGrouping = this.hasColumnGrouping(sectionId);
    const config = this.getColumnGroupConfig(sectionId);

    if (hasGrouping && config) {
      const columns = exportData.columns;
      const groupHeaderRow: string[] = [];
      const subHeaderRow: string[] = [];

      columns.forEach((col) => {
        const groupInfo = this.getColumnGroupInfo(sectionId, col);

        if (groupInfo) {
          // Grouped column
          const isFirst = this.shouldShowGroupHeader(sectionId, col);
          const colspan = this.getGroupColspan(sectionId, groupInfo.groupIndex);
          const groupName = groupInfo.group.groupName;
          const displayName = this.getColumnDisplayName(sectionId, col);

          if (isFirst) {
            // Row 1: Group name in first cell, empty for rest of colspan
            groupHeaderRow.push(`"${groupName}"`);
            for (let i = 1; i < colspan; i++) {
              groupHeaderRow.push('""');
            }
          }

          // Row 2: Sub column display name
          subHeaderRow.push(`"${displayName}"`);

        } else {
          // Non-grouped column — SAME name in BOTH rows (no blank gap)
          groupHeaderRow.push(`"${col}"`);
          subHeaderRow.push(`"${col}"`);
        }
      });

      csv.push(groupHeaderRow.join(','));
      csv.push(subHeaderRow.join(','));

    } else {
      // No grouping — simple single header
      csv.push(exportData.columns.map(c => `"${c}"`).join(','));
    }

    // ─── Data rows ───
    exportData.rows.forEach(row => {
      csv.push(
        exportData.columns
          .map(col => `"${(row[col] ?? '').toString().replace(/"/g, '""')}"`)
          .join(',')
      );
    });

    this.downloadFile(csv.join('\n'), filename, 'text/csv');
    this.exportMenuOpen[sectionId] = false;
  }

  // exportSectionToExcel
  async exportSectionToExcel(sectionId: number) {
    const exportData = this.buildSectionExportData(sectionId);
    if (!exportData) {
      this.apis.showAlert('warning', 'No Data', 'Nothing to export');
      return;
    }

    const dateStr = this.getCurrentDateString();
    const reportName = exportData.reportName || `Section_${sectionId}`;
    const filename = `${reportName}_${dateStr}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // ─── Report metadata ───
    worksheet.addRow(['Report Name', reportName]);
    const dateRow = worksheet.addRow(['Export Date', this.formatDateYYYYMMDD(exportData.exportDate)]);
    dateRow.getCell(2).numFmt = 'yyyy-mm-dd';
    worksheet.addRow([]);

    // ─── Parameters ───
    if (exportData.params && Object.keys(exportData.params).length) {
      worksheet.addRow(['Parameters']);
      const paramConfig = this.getVisibleParameters(
        this.currentSectionReports[sectionId]?.config?.Parameters || []
      );
      paramConfig.forEach(p => {
        const value = exportData.params[p.Name];
        worksheet.addRow([p.DisplayName || p.Name, value ?? '']);
      });
      if (this.showCustomDateRange[sectionId]) {
        const uiParams = this.currentSectionParams[sectionId] || {};
        const sm = this.monthOptions.find(m => m.value == uiParams['StartMonth'])?.label || uiParams['StartMonth'] || '';
        const sy = uiParams['StartYear'] || '';
        const em = this.monthOptions.find(m => m.value == uiParams['EndMonth'])?.label || uiParams['EndMonth'] || '';
        const ey = uiParams['EndYear'] || '';
        worksheet.addRow(['Date Range', `${sm} ${sy} to ${em} ${ey}`]);
      }
      worksheet.addRow([]);
    }

    const hasGrouping = this.hasColumnGrouping(sectionId);
    const config = this.getColumnGroupConfig(sectionId);
    const columns = exportData.columns;

    if (hasGrouping && config) {

      // ════════════════════════════════════════════
      // PRE-PASS: Har group ka actual startCol aur
      // visible column count nikalo
      // ════════════════════════════════════════════
      const groupColspanMap = new Map<number, { startCol: number; count: number }>();
      let preCol = 1;

      columns.forEach((col) => {
        const groupInfo = this.getColumnGroupInfo(sectionId, col);
        if (groupInfo) {
          if (!groupColspanMap.has(groupInfo.groupIndex)) {
            groupColspanMap.set(groupInfo.groupIndex, { startCol: preCol, count: 0 });
          }
          groupColspanMap.get(groupInfo.groupIndex)!.count++;
        }
        preCol++;
      });

      // ════════════════════════════════════════════
      // MAIN PASS: groupHeaderRow + subHeaderRow build karo
      // ════════════════════════════════════════════
      const groupHeaderRow: any[] = [];
      const subHeaderRow: any[] = [];
      const merges: Array<{ startCol: number; endCol: number; text: string; color: string }> = [];
      const processedGroups = new Set<number>();

      columns.forEach((col) => {
        const groupInfo = this.getColumnGroupInfo(sectionId, col);

        if (groupInfo) {
          // Pehli baar group aaya — header + merge info push karo
          if (!processedGroups.has(groupInfo.groupIndex)) {
            processedGroups.add(groupInfo.groupIndex);

            const meta = groupColspanMap.get(groupInfo.groupIndex)!;
            const colspan = meta.count;
            const groupName = groupInfo.group.groupName;
            const groupColor = groupInfo.group.color || '#1a4d6d';

            merges.push({
              startCol: meta.startCol,
              endCol: meta.startCol + colspan - 1,
              text: groupName,
              color: groupColor
            });

            // Group name + empty cells for colspan
            groupHeaderRow.push(groupName);
            for (let i = 1; i < colspan; i++) {
              groupHeaderRow.push('');
            }
          }
          // Sub-header: display name
          subHeaderRow.push(this.getColumnDisplayName(sectionId, col));

        } else {
          // Non-grouped column: col name in group row, empty in sub row
          groupHeaderRow.push(col);
          subHeaderRow.push('');
        }
      });

      // ════════════════════════════════════════════
      // ROW 1: Group header row worksheet mein add karo
      // ════════════════════════════════════════════
      const groupRow = worksheet.addRow(groupHeaderRow);
      groupRow.height = 25;

      // Grouped columns — merge + style
      merges.forEach(merge => {
        try {
          if (merge.startCol < merge.endCol) {
            worksheet.mergeCells(
              groupRow.number, merge.startCol,
              groupRow.number, merge.endCol
            );
          }
          const cell = groupRow.getCell(merge.startCol);
          cell.value = merge.text;
          cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: this.hexToArgb(merge.color) }
          };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        } catch (e) {
          /*console.warn('Merge skipped:', merge, e);*/
        }
      });

      // Non-grouped columns in group header row — sirf style, no merge
      let colIdx = 1;
      columns.forEach((col) => {
        const groupInfo = this.getColumnGroupInfo(sectionId, col);
        if (!groupInfo) {
          const cell = groupRow.getCell(colIdx);
          cell.value = col;
          cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: 'FF215378' }
          };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        }
        colIdx++;
      });

      // ════════════════════════════════════════════
      // ROW 2: Sub-header row worksheet mein add karo
      // ════════════════════════════════════════════
      const subRow = worksheet.addRow(subHeaderRow);
      subRow.height = 20;

      colIdx = 1;
      columns.forEach((col) => {
        const groupInfo = this.getColumnGroupInfo(sectionId, col);
        const cell = subRow.getCell(colIdx);

        if (groupInfo) {
          cell.value = this.getColumnDisplayName(sectionId, col);
          cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: this.hexToArgb(groupInfo.group.subHeaderColor || '#215378') }
          };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        } else {
          // Non-grouped sub row — empty cell, dark blue background
          cell.value = '';
          cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: 'FF215378' }
          };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        }

        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        colIdx++;
      });

    } else {
      // ─── No grouping: simple single header ───
      const headerRow = worksheet.addRow(columns);
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: 'FF215378' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      });
    }

    // ─── Data rows ───
    exportData.rows.forEach(row => {
      worksheet.addRow(
        columns.map(c => {
          const v = row[c];
          return typeof v === 'number' ? v : v ?? '';
        })
      );
    });

    // ─── Column widths ───
    worksheet.columns.forEach((col, index) => {
      const columnName = columns[index];
      if (hasGrouping && this.isColumnInGroup(sectionId, columnName)) {
        col.width = 12;
      } else {
        col.width = 18;
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), filename);

    this.exportMenuOpen[sectionId] = false;
  }

  // copySectionToClipboard
  copySectionToClipboard(sectionId: number): void {
    const exportData = this.buildSectionExportData(sectionId);
    if (!exportData) {
      this.apis.showAlert('warning', 'No Data', 'Nothing to copy');
      return;
    }

    const exportDate = new Date();
    const formattedDate = exportDate.toISOString().split('T')[0];
    const lines: string[] = [];

    lines.push(`Report Name\t${exportData.reportName || `Section_${sectionId}`}`);
    lines.push(`Export Date\t${formattedDate}`);
    lines.push('');

    if (exportData.params && Object.keys(exportData.params).length) {
      lines.push('Parameters');

      const paramConfig = this.getVisibleParameters(
        this.currentSectionReports[sectionId]?.config?.Parameters || []
      );

      paramConfig.forEach(p => {
        const value = exportData.params[p.Name];
        lines.push(`${p.DisplayName || p.Name}\t${value ?? ''}`);
      });

      // Custom date range params
      if (this.showCustomDateRange[sectionId]) {
        const uiParams = this.currentSectionParams[sectionId] || {};
        const sm = this.monthOptions.find(m => m.value == uiParams['StartMonth'])?.label || uiParams['StartMonth'] || '';
        const sy = uiParams['StartYear'] || '';
        const em = this.monthOptions.find(m => m.value == uiParams['EndMonth'])?.label || uiParams['EndMonth'] || '';
        const ey = uiParams['EndYear'] || '';
        lines.push(`Date Range\t${sm} ${sy} to ${em} ${ey}`);
      }

      lines.push('');
    }

    const hasGrouping = this.hasColumnGrouping(sectionId);
    const config = this.getColumnGroupConfig(sectionId);

    if (hasGrouping && config) {
      const columns = exportData.columns;
      const groupHeaderRow: string[] = [];
      const subHeaderRow: string[] = [];

      columns.forEach((col) => {
        const groupInfo = this.getColumnGroupInfo(sectionId, col);

        if (groupInfo) {
          const isFirstInGroup = this.shouldShowGroupHeader(sectionId, col);

          if (isFirstInGroup) {
            const colspan = this.getGroupColspan(sectionId, groupInfo.groupIndex);
            const groupName = groupInfo.group.groupName;
            groupHeaderRow.push(groupName);
            for (let i = 1; i < colspan; i++) {
              groupHeaderRow.push('');
            }
          }

          const displayName = this.getColumnDisplayName(sectionId, col);
          subHeaderRow.push(displayName);
        } else {
          groupHeaderRow.push(col);
          subHeaderRow.push('');
        }
      });

      lines.push(groupHeaderRow.join('\t'));
      lines.push(subHeaderRow.join('\t'));
    } else {
      lines.push(exportData.columns.join('\t'));
    }

    exportData.rows.forEach(row => {
      lines.push(
        exportData.columns.map(c => row[c] ?? '').join('\t')
      );
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.apis.showAlert('success', 'Copied', 'Data copied to clipboard');
    });

    this.exportMenuOpen[sectionId] = false;
  }

  private formatDateYYYYMMDD(date: any): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Convert hex color to Excel ARGB format
  private hexToArgb(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // If 3-digit hex, expand to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    // Add full opacity (FF) at the start
    return 'FF' + hex.toUpperCase();
  }

  printAllSections(): void {
    const hasData = Object.values(this.currentSectionData).some(d => d?.rows?.length);
    if (!hasData) {
      this.apis.showAlert('warning', 'Warning!', 'No data available to print.');
      return;
    }

    this.prepareChartsForPrint();
    const sections = document.querySelectorAll('.print-area');
    const combinedHtml = Array.from(sections).map(s => `<div style="page-break-after: always;">${s.innerHTML}</div>`).join('');

    this.openPrintWindow(combinedHtml);
  }

  printSection(sectionId: number): void {
    const data = this.currentSectionData[sectionId];
    if (!data?.rows?.length) {
      this.apis.showAlert('warning', 'Warning!', 'This section has no data to print.');
      return;
    }

    const el = document.getElementById(`body-${sectionId}`);
    if (el) this.openPrintWindow(el.innerHTML);
  }

  private openPrintWindow(content: string): void {
    const win = window.open('', '', 'width=1200,height=800');
    if (!win) return;

    win.document.write(this.getPrintHtml(content));
    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
      win.close();
      this.restoreChartsAfterPrint();
    }, 700);
  }

  private getPrintHtml(content: string): string {
    return `
      <html>
        <head><title>Print</title><style>body{font-family:Arial;margin:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}</style></head>
        <body>${content}</body>
      </html>
    `;
  }

  prepareChartsForPrint(): void {
    Object.keys(this.chartInstances).forEach(key => {
      const sectionId = Number(key);
      const canvas = document.getElementById(`chart-${sectionId}`) as HTMLCanvasElement;
      const img = document.getElementById(`chart-img-${sectionId}`) as HTMLImageElement;
      if (canvas && img) {
        img.src = canvas.toDataURL('image/png', 1.0);
        img.style.display = 'block';
        canvas.style.display = 'none';
      }
    });
  }

  restoreChartsAfterPrint(): void {
    Object.keys(this.chartInstances).forEach(key => {
      const sectionId = Number(key);
      const canvas = document.getElementById(`chart-${sectionId}`) as HTMLCanvasElement;
      const img = document.getElementById(`chart-img-${sectionId}`) as HTMLImageElement;
      if (canvas && img) {
        img.style.display = 'none';
        canvas.style.display = 'block';
      }
    });
  }

  calculateSummaryValue(data: ReportData, box: any): number {
    if (!data.rows?.length) return 0;
    const values = data.rows.map(row => parseFloat(row[box.Column]) || 0);

    switch (box.Aggregate) {
      case 'SUM': return values.reduce((a, b) => a + b, 0);
      case 'AVG': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'COUNT': return data.rows.length;
      case 'MIN': return Math.min(...values);
      case 'MAX': return Math.max(...values);
      default: return values.reduce((a, b) => a + b, 0);
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  }

  lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  hexToRgba(hex: string, alpha: number): string {
    if (!hex) return `rgba(102, 126, 234, ${alpha})`;
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  generateChartColors(count: number, primary: string, secondary: string): string[] {
    const palette = [primary, secondary, '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#ff6a88'];
    if (count <= palette.length) return palette.slice(0, count);
    return Array.from({ length: count }, (_, i) =>
      this.interpolateColor(primary, secondary, i / (count - 1))
    );
  }

  interpolateColor(color1: string, color2: string, ratio: number): string {
    const hex = (x: number) => x.toString(16).padStart(2, '0');
    const parse = (c: string, i: number) => parseInt(c.substring(i * 2 + 1, i * 2 + 3), 16);

    const r = Math.round(parse(color1, 0) + (parse(color2, 0) - parse(color1, 0)) * ratio);
    const g = Math.round(parse(color1, 1) + (parse(color2, 1) - parse(color1, 1)) * ratio);
    const b = Math.round(parse(color1, 2) + (parse(color2, 2) - parse(color1, 2)) * ratio);

    return '#' + hex(r) + hex(g) + hex(b);
  }

  getColumnClass(width: number): string {
    return `col-md-${width}`;
  }

  getParamColClass(paramCount: number, sectionWidth: number): string {
    if (sectionWidth <= 6) return 'col-xl-3 col-12';
    if (sectionWidth === 12) {
      return paramCount <= 3 ? 'col-xl-3 col-lg-4 col-sm-6 col-12' : 'col-xl-3 col-lg-4 col-sm-6 col-12';
    }
    return 'col-12';
  }

  getFilteredRows(sectionId: number) {
    return this.currentSectionData[sectionId]?.rows || [];
  }

  toggleColumnManager(sectionId: number): void {
    this.columnManagerOpen = this.columnManagerOpen === sectionId ? null : sectionId;
    if (this.freezeManagerOpen === sectionId) {
      this.freezeManagerOpen = null;
    }
  }

  toggleFilterPanel(sectionId: number): void {
    this.filterPanelOpen[sectionId] = !this.filterPanelOpen[sectionId];
  }

  isTextColumn(sectionId: number, column: string): boolean {
    const rows = this.currentSectionData[sectionId]?.rows;
    if (!rows?.length) return false;

    const sampleValue = rows.find(r => r[column] != null && r[column] !== '')?.[column];
    if (sampleValue === undefined) return false;
    if (typeof sampleValue === 'number') return false;

    const date = Date.parse(sampleValue);
    if (!isNaN(date) && typeof sampleValue === 'string') return false;

    return true;
  }

  private resetTableUIState(sectionId: number): void {
    if (this.columnManagerOpen === sectionId) this.columnManagerOpen = null;

    Object.keys(this.columnVisibility[sectionId] || {}).forEach(col => {
      this.columnVisibility[sectionId][col] = true;
    });

    Object.keys(this.columnFilters[sectionId] || {}).forEach(col => {
      this.columnFilters[sectionId][col] = [];
    });

    Object.keys(this.columnSearchText[sectionId] || {}).forEach(col => {
      this.columnSearchText[sectionId][col] = '';
    });

    this.activeFilterCol = null;

    if (this.originalSectionRows[sectionId]) {
      this.currentSectionData[sectionId].rows = [...this.originalSectionRows[sectionId]];
    }

    const visibleCols = this.currentSectionData[sectionId]?.columns.filter(col =>
      this.columnVisibility[sectionId][col]
    ) || [];
    this.frozenColumns[sectionId] = visibleCols.slice(0, 4);

    setTimeout(() => this.calculateColumnWidths(sectionId), 100);
  }

  private syncDropdownDefaults(sectionId: number): void {
    const params = this.currentSectionParams[sectionId];
    if (!params) return;

    Object.keys(params).forEach(paramName => {
      const key = `${sectionId}_${paramName}`;
      const options = this.dropdownOptions[key];
      if (!options?.length) return;

      const normalized = this.normalizeValue(params[paramName]);
      if (!normalized) return;

      const match = options.find(o => this.normalizeValue(o.value) === normalized);
      if (match) {
        this.currentSectionParams[sectionId][paramName] = match.value;
      }
    });
  }

  private normalizeValue(val: any): string {
    return val == null ? '' : String(val).trim().toLowerCase();
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  isInFirstFourVisible(sectionId: number, col: string): boolean {
    const cols = this.currentSectionData[sectionId]?.columns || [];
    const visibleCols = cols.filter(c => this.columnVisibility[sectionId]?.[c]);
    const firstFour = visibleCols.slice(0, 4);
    return firstFour.includes(col);
  }

  getFrozenLeft(sectionId: number, col: string): number {
    const cols = this.currentSectionData[sectionId]?.columns || [];
    const frozenCols = this.frozenColumns[sectionId] || [];
    const widths = this.columnWidths[sectionId] || {};
    const visibility = this.columnVisibility[sectionId] || {};

    let left = 0;

    for (const c of cols) {
      if (!visibility[c]) continue;
      if (c === col) break;
      if (frozenCols.includes(c)) {
        left += widths[c] || 150;
      }
    }
    return left;
  }

  getColumnTotal(sectionId: number, col: string): number | string | '' {
    // Don't show total for %Cont columns
    const displayName = this.getColumnDisplayName(sectionId, col);
    if (
      displayName.toLowerCase().includes('%cont') ||
      displayName.toLowerCase().includes('%acc') ||
      col.toLowerCase().includes('%cont') ||
      col.toLowerCase().includes('%acc')
    ) {
      return '';
    }

    if (col.toLowerCase().trim() === 'div factor') {
      return '';
    }

    const rows = this.currentSectionData[sectionId]?.rows || [];

    const sampleValues = rows
      .map(r => r[col])
      .filter(v => v != null && v !== '')
      .slice(0, 10);

    const allNumeric = sampleValues.every(v => typeof v === 'number');

    if (!allNumeric) return '';

    const values = rows
      .map(r => r[col])
      .filter(v => typeof v === 'number')
      .map(v => Number(v));

    if (values.length === 0) return '';

    const sum = values.reduce((a, b) => a + b, 0);

    if (isNaN(sum)) return '';

    // Round to 2 decimal places
    return Math.round(sum * 100) / 100;
  }

  formatDecimal(value: any): number | string {
    if (value == null || value === '') return '';

    const num = Number(value);
    if (isNaN(num)) return value;

    // Round to 2 decimal places
    return Math.round(num * 100) / 100;
  }

  onFreezeCheckboxChange(sectionId: number, col: string, event: any): void {
    this.frozenColumns[sectionId] ??= [];

    if (event.target.checked) {
      if (!this.frozenColumns[sectionId].includes(col)) {
        this.frozenColumns[sectionId].push(col);
      }
    } else {
      this.frozenColumns[sectionId] = this.frozenColumns[sectionId].filter(c => c !== col);
    }

    // Recalculate widths immediately (not after timeout)
    this.calculateColumnWidths(sectionId);
    this.cdr.detectChanges();

    // Double-check after brief delay
    setTimeout(() => {
      this.frozenColumns[sectionId] = [...this.frozenColumns[sectionId]];
      this.calculateColumnWidths(sectionId);
    }, 50);
  }

  toggleFreezeManager(sectionId: number): void {
    this.freezeManagerOpen = this.freezeManagerOpen === sectionId ? null : sectionId;
    if (this.columnManagerOpen === sectionId) {
      this.columnManagerOpen = null;
    }
  }

  onColumnVisibilityChange(sectionId: number, col: string): void {
    const cols = this.currentSectionData[sectionId]?.columns || [];

    const visibleCols = cols.filter(c => this.columnVisibility[sectionId]?.[c]);
    const firstFourVisible = visibleCols.slice(0, 4);

    const oldFrozen = [...(this.frozenColumns[sectionId] || [])];
    this.frozenColumns[sectionId] = oldFrozen.filter(c => firstFourVisible.includes(c));

    this.initializeColumnGroupConfig(sectionId);

    this.cdr.detectChanges();

    const hasData = this.currentSectionData[sectionId]?.rows?.length > 0;
    if (hasData) {
      setTimeout(() => {
        this.calculateColumnWidths(sectionId);
        this.frozenColumns[sectionId] = [...this.frozenColumns[sectionId]];
        this.cdr.detectChanges();
      }, 0);
    }
  }
  //onColumnVisibilityChange(sectionId: number, col: string): void {
  //  const cols = this.currentSectionData[sectionId]?.columns || [];

  //  const visibleCols = cols.filter(c => this.columnVisibility[sectionId]?.[c]);

  //  const firstFourVisible = visibleCols.slice(0, 4);

  //  const oldFrozen = [...(this.frozenColumns[sectionId] || [])];
  //  this.frozenColumns[sectionId] = oldFrozen.filter(c => firstFourVisible.includes(c));

  //  const hasData = this.currentSectionData[sectionId]?.rows?.length > 0;
  //  if (hasData) {
  //    setTimeout(() => {
  //      this.calculateColumnWidths(sectionId);
  //      this.frozenColumns[sectionId] = [...this.frozenColumns[sectionId]];
  //    }, 0);
  //  }
  //}

  // select all & deselect all work start
  isAllColumnsVisible(sectionId: number, columns: string[]): boolean {
    if (!columns?.length) return false;
    return columns.every(col => this.columnVisibility[sectionId]?.[col] !== false);
  }

  isSomeColumnsVisible(sectionId: number, columns: string[]): boolean {
    if (!columns?.length) return false;
    const visibleCount = columns.filter(
      col => this.columnVisibility[sectionId]?.[col] !== false
    ).length;
    return visibleCount > 0 && visibleCount < columns.length;
  }

  toggleAllColumns(sectionId: number, columns: string[], event: any): void {
    const selectAll = event.target.checked;

    columns.forEach(col => {
      this.columnVisibility[sectionId][col] = selectAll;
    });

    this.initializeColumnGroupConfig(sectionId);

    if (selectAll) {
      const visibleCols = columns.filter(col => this.columnVisibility[sectionId][col]);
      this.frozenColumns[sectionId] = visibleCols.slice(0, 4);
      setTimeout(() => {
        this.calculateColumnWidths(sectionId);
        this.frozenColumns[sectionId] = [...this.frozenColumns[sectionId]];
        this.cdr.detectChanges();
      }, 0);
    } else {
      this.frozenColumns[sectionId] = [];
    }

    this.cdr.detectChanges(); // ✅ Turant render update
  }
  // select all & deselect all end

  isFrozen(sectionId: number, col: string): boolean {
    if (!this.columnVisibility[sectionId]?.[col]) {
      return false;
    }

    if (!this.frozenColumns[sectionId]?.includes(col)) {
      return false;
    }

    const cols = this.currentSectionData[sectionId]?.columns || [];
    const visibleCols = cols.filter(c => this.columnVisibility[sectionId]?.[c]);
    const firstFourVisible = visibleCols.slice(0, 4);

    return firstFourVisible.includes(col);
  }

  isStateAll(sectionId: number): boolean {
    const params = this.currentSectionParams[sectionId];
    if (!params) return false;

    const stateValue = params['State'] || params['state'] || params['StateName'];
    return stateValue?.toString().toLowerCase() === 'all';
  }

  isTMAIndustryReport(sectionId: number): boolean {
    const reportName = this.currentSectionReports[sectionId]?.name?.toLowerCase() || '';
    return reportName.includes('tma industry') || reportName.includes('industry tma');
  }

  shouldHideStateColumn(sectionId: number, columnName: string): boolean {
    // Only for State/StateName column
    const isStateColumn = columnName.toLowerCase() === 'state' || columnName.toLowerCase() === 'statename';
    if (!isStateColumn) return false;

    // Only for TMA Industry report
    if (!this.isTMAIndustryReport(sectionId)) return false;

    // Only when State parameter is "All"
    if (!this.isStateAll(sectionId)) return false;

    return true;
  }

  shouldShowGroupBy(sectionId: number): boolean {
    const reportName = this.currentSectionReports[sectionId]?.name?.toLowerCase() || '';

    // Don't show group by for Business Master
    if (reportName.includes('business master')) {
      return false;
    }

    // Don't show group by for TMA Industry report
    if (this.isTMAIndustryReport(sectionId)) {
      return false;

    }
    return true;
  }

  // Call this in your loadSectionReportFromData() method
  private initializeColumnGroupConfig(sectionId: number): void {
    /* console.log(`Initializing column group config for section ${sectionId}`);*/
    const reportInfo = this.currentSectionReports[sectionId];
    /* console.log(`Report info for section ${sectionId}:`, reportInfo);*/
    if (!reportInfo) {
      this.columnGroupConfigs[sectionId] = null;
      return;
    }

    const reportName = reportInfo.name || '';
    this.columnGroupConfigs[sectionId] = getColumnGroupConfig(reportName);

    // Debug log
    if (this.columnGroupConfigs[sectionId]) {
      /*console.log(`Column grouping enabled for section ${sectionId}: ${reportName}`,*/
      /*this.columnGroupConfigs[sectionId]);*/
    }
  }

  // Get column group configuration for a section
  getColumnGroupConfig(sectionId: number): ReportColumnConfig | null {
    return this.columnGroupConfigs[sectionId] || null;
  }

  // Check if a column belongs to any group
  getColumnGroupInfo(sectionId: number, columnName: string): { groupIndex: number; group: ColumnGroup; columnIndex: number; } | null {
    const config = this.columnGroupConfigs[sectionId];
    return getColumnGroupInfo(columnName, config);
  }

  // Check if column is in a group
  isColumnInGroup(sectionId: number, columnName: string): boolean {
    return this.getColumnGroupInfo(sectionId, columnName) !== null;
  }

  // Check if this is the first visible column in its group (for showing group header)
  shouldShowGroupHeader(sectionId: number, columnName: string): boolean {
    const config = this.columnGroupConfigs[sectionId];
    if (!config) return false;

    const visibleColumns = this.getVisibleColumnNames(sectionId);
    return isFirstInGroup(columnName, config, visibleColumns);
  }

  // Get colspan for a group header
  getGroupColspan(sectionId: number, groupIndex: number): number {
    const config = this.columnGroupConfigs[sectionId];
    const visibleColumns = this.getVisibleColumnNames(sectionId);
    return getGroupColspan(groupIndex, config, visibleColumns);
  }

  // Get visible column names for a section
  private getVisibleColumnNames(sectionId: number): string[] {
    const columns = this.currentSectionData[sectionId]?.columns || [];
    return columns.filter(col => this.columnVisibility[sectionId]?.[col]);
  }

  // Get all unique groups that have visible columns
  getActiveGroups(sectionId: number): Array<{ groupIndex: number; group: ColumnGroup; colspan: number }> {
    const config = this.columnGroupConfigs[sectionId];
    if (!config) return [];

    const visibleColumns = this.getVisibleColumnNames(sectionId);
    const activeGroups: Array<{ groupIndex: number; group: ColumnGroup; colspan: number }> = [];

    config.columnGroups.forEach((group, index) => {
      const colspan = getGroupColspan(index, config, visibleColumns);
      if (colspan > 0) {
        activeGroups.push({ groupIndex: index, group, colspan });
      }
    });

    return activeGroups;
  }

  hasColumnGrouping(sectionId: number): boolean {
    const config = this.columnGroupConfigs[sectionId];
    if (!config?.columnGroups?.length) return false;

    // Visible columns mein se koi bhi group mein hai ya nahi check karo
    const visibleColumns = this.getVisibleColumnNames(sectionId);
    return visibleColumns.some(col => getColumnGroupInfo(col, config) !== null);
  }
  //hasColumnGrouping(sectionId: number): boolean {
  //  const config = this.columnGroupConfigs[sectionId];
  //  // Handle null, undefined, and empty arrays
  //  return config !== null && config !== undefined && config.columnGroups && config.columnGroups.length > 0;
  //}

  getColumnDisplayName(sectionId: number, columnName: string): string {
    const config = this.columnGroupConfigs[sectionId];
    if (!config) return columnName;

    // If column is in a group and has a custom display name, use it
    const displayName = getGroupColumnDisplayName(columnName, config);
    return displayName;
  }

  isNegativeValue(value: any, sectionId?: number, col?: string, rowData?: any): boolean {
    if (sectionId !== undefined && col && rowData) {
      const displayName = this.getColumnDisplayName(sectionId, col).trim().toLowerCase();

      if (displayName.includes('%acc') || col.toLowerCase().includes('%acc') || col.toLowerCase().includes('accuracy')) {
        const columns = this.currentSectionData[sectionId]?.columns || [];

        const billingPlanCol = columns.find(c => {
          const lower = c.toLowerCase();
          return lower === 'ttl bp' ||
            lower === 'billing plan ttl' ||
            (lower.includes('ttl') && lower.includes('bp'));
        });

        const billingActualCol = columns.find(c => {
          const lower = c.toLowerCase();
          return lower.includes('actual') &&
            (lower.includes('billing') || lower.includes('ttl'));
        });
        if (billingPlanCol && billingActualCol) {
          const planValue = Number(rowData[billingPlanCol]) || 0;
          const actualValue = Number(rowData[billingActualCol]) || 0;

          if (Math.abs(planValue) < 0.01 && Math.abs(actualValue - 1) < 0.01) {
            return true;
          }
        } else {
        }
      }
    }

    if (value == null || value === '') return false;

    if (typeof value === 'number') {
      return value < 0;
    }

    if (typeof value === 'string') {
      const num = parseFloat(value);
      return !isNaN(num) && num < 0;
    }

    return false;
  }

  // Check if a specific cell value is negative
  //isNegativeValue(value: any): boolean {
  //  if (value == null || value === '') return false;

  //  // Check if value is a number and is negative
  //  if (typeof value === 'number') {
  //    return value < 0;
  //  }

  //  // Also check string numbers like "-123.45"
  //  if (typeof value === 'string') {
  //    const num = parseFloat(value);
  //    return !isNaN(num) && num < 0;
  //  }

  //  return false;
  //}

  onDropdownChange(sectionId: number, paramName: string, value: any): void {

    // Update the parameter value
    this.currentSectionParams[sectionId][paramName] = value;

    // Handle Financial Year selection
    if (paramName === 'FinancialYear' && value) {
      // Hide custom date range when FY is selected
      this.showCustomDateRange[sectionId] = false;
      return;
    }

    if (paramName?.toString().toLowerCase() === 'duration') {
      // Check if "custom" is selected
      if (value?.toString().toLowerCase() === 'custom') {
        this.showCustomDateRange[sectionId] = true;

        // Set empty defaults to show placeholder text
        this.currentSectionParams[sectionId]['StartMonth'] = '';
        this.currentSectionParams[sectionId]['StartYear'] = '';
        this.currentSectionParams[sectionId]['EndMonth'] = '';
        this.currentSectionParams[sectionId]['EndYear'] = '';

        // Force change detection
        this.cdr.detectChanges();
      } else {
        this.showCustomDateRange[sectionId] = false;
      }
    }

  }

  // Add this new method after shouldShowGroupBy()
  hasPercentContColumn(sectionId: number): boolean {
    const data = this.currentSectionData[sectionId];
    if (!data?.columns) return false;

    const hasInColumnName = data.columns.some(col => {
      const colLower = col.toLowerCase();
      return colLower.includes('%cont') || colLower.includes('%acc');
    });

    if (hasInColumnName) return true;

    const hasGrouping = this.hasColumnGrouping(sectionId);
    if (hasGrouping) {
      return data.columns.some(col => {
        const displayName = this.getColumnDisplayName(sectionId, col);
        const keywords = ['%cont', '%acc'];
        return keywords.some(k => displayName.toLowerCase().includes(k));
      });
    }

    return false;
  }

  getColumnBackgroundColor(sectionId: number, col: string): string {
    const displayName = this.getColumnDisplayName(sectionId, col).trim().toUpperCase();
    switch (displayName) {
      case 'BL':
        return '#8B8BFF';
      case 'BLK':
        return '#b3b3f1';
      case 'YLW':
        return '#eded82';
      case 'SF':
        return '#ffae7c';
      default:
        return '';
    }
  }

  // Add this method to check if column should have background
  shouldApplyColumnColor(sectionId: number, col: string): boolean {
    const displayName = this.getColumnDisplayName(sectionId, col).trim().toUpperCase();
    return ['BL', 'BLK', 'YLW', 'SF'].includes(displayName);
  }

  // Add this new method after ngOnInit()
  private generateFinancialYearOptions(): void {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    // Determine current financial year
    // If month >= April (4), FY is current-next, else previous-current
    let currentFYStart = currentMonth >= 4 ? currentYear : currentYear - 1;

    // Generate from 10 years ago to CURRENT year only (no next year)
    const startYear = currentFYStart - 10;
    const endYear = currentFYStart; // Changed from +1 to 0

    for (let year = startYear; year <= endYear; year++) {
      const nextYear = year + 1;
      const label = `${year}-${nextYear}`;
      const stDate = `${year}-04-01`; // April 1st
      const enDate = `${nextYear}-03-31`; // March 31st

      this.financialYearOptions.push({
        value: label,
        label: label,
        stDate: stDate,
        enDate: enDate
      });
    }
    // Reverse to show newest first
    this.financialYearOptions.reverse();
  }

  isUrlColumn(col: string): boolean {
    const lower = col.toLowerCase().trim();
    return lower === 'mop url' || lower === 'rc url';
  }
}
