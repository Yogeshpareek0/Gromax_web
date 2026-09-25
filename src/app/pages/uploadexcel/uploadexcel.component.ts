import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UploadReport } from './../../model/apiresponse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import { ViewChild, ElementRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';


interface Accessory {
  name: string;
  value: number;
}

@Component({
  selector: 'app-uploadexcel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './uploadexcel.component.html',
  styleUrl: './uploadexcel.component.css'
})
export class UploadexcelComponent implements OnInit {
  private readonly COLORS = {
    PRIMARY_HEADER: 'FFDEEAF6',    // Light blue - Main section headers
    SECONDARY_HEADER: 'FFE7E6E6',  // Light gray - Sub headers
    LOCKED_CELL: 'FFF2F2F2',       // Gray - Locked/read-only cells
    FORMULA_CELL: 'FFFFF2CC',      // Light yellow - Formula cells
    TOTAL_ROW: 'FFFFFF00',         // Yellow - Total rows (changed from light blue)
    DISABLED_CELL: 'FFE7E6E6'      // Darker gray - Disabled cells (like W5 when no week 5)
  };

  /*price position*/

  /*makeList: any[] = [];*/
  makeList: any[] = [
    'MAHINDRA',
    'TAFE',
    'MASSEY FERGUSON',
    'EICHER',
    'ESCORT',
    'FARMTRAC',
    'POWERTRAC',
    'DIGITRAC',
    'KUBOTA',
    'NEW HOLLAND ( CNH )',
    'JOHN DEER',
    'VST',
    'INDO FARM',
    'CAPTAIN TRACTORS',
    'SOLIS YANMAR',
    'SONALIKA INTERNATIONAL',
    'ACE',
    'KARTAR',
    'PREET',
    'SAME DEUTZ-FAR',
    'STANDARD',
    'AUTONXT',
    'SAS MOTORS',
    'MONTRA ELECTRIC',
    'MONARCH TRACTOR',
    'SWARAJ/PTL'
  ];
  allHpList: number[] = [];
  readonly hpRangeMap: { [range: string]: number[] } = {
    '0-20': [],
    '21-23': [],
    '24-26': [],
    '27-30': [],
    '31-33': [],
    '34-36': [],
    '37-38': [],
    '39-40': [],
    '41-43': [],
    '44-45': [],
    '46-47': [],
    '48-50': [],
    '50+': []
  };


  accessoriesList = [
    { name: 'Drawbar', value: 1000 },
    { name: 'Bumper', value: 4500 },
    { name: 'Canopy', value: 4000 },
    { name: 'Hitch', value: 3000 }
  ];

  selectedAccessory: Accessory[] = [];

  hpRangeList: string[] = Object.keys(this.hpRangeMap);

  filteredHpList: number[] = [];

  selectedHpRange: string = '';
  selectedHp: number = 0;
  selectedMake: string = '';
  modelName: string = '';

  avgVolPerMonth: number = 0;
  variantCode: string = '';

  ndp: number = 0;
  freight: number = 8000;
  accessories: number = 0;
  dlrMargin: number = 0;
  mop: number = 0;
  offrPrice: number = 0;
  implementPrice: number = 0;
  rtoInsurance: number = 0;
  mopDate: Date | null = null;

  isCommitting = false;

  mopProofFile: File | null = null;
  mopProofFileName: string = '';

  rcCopyFile: File | null = null;
  rcCopyFileName: string = '';


  selectedAccessoryDisplay: string = '';
  dropdownOpen: boolean = false;
  /*price position*/

  // Data properties
  uploadReportList: UploadReport[] = [];
  filteredUploadReportList: UploadReport[] = [];
  selectedUploadId: number | null = null;
  selectedUploadName = '';
  previewColumnOrder: string[] = [];
  selectedFile: File | null = null;
  selectedFileName = '';
  downloadFileUrl = '';
  downloadFileName = '';
  priecPositionDiv: boolean = false;
  selectedState: string | null = null;
  selectedDrive: string | null = null;


  // Data arrays
  dealerData: any[] = [];
  modelData: any[] = [];
  industryData: any[] = [];
  talukaIndustryData: any[] = [];
  bdrcData: any[] = [];
  spaData: any[] = [];
  stateList: any[] = [];
  outlookFormatData: any[] = [];
  pddFormatData: any[] = [];

  // Preview mode
  isPreviewMode = false;
  previewResponse: any = null;
  previewRows: any[] = [];

  stagingTable = '';

  // User properties
  positionId: string | null = null;
  userName: string | null = null;
  stateBasedUploadTypes = [1, 3, 4, 5, 7, 11];

  summary = { total: 0, valid: 0, invalid: 0 };

  years: number[] = [];
  selectedMonth: number | null = null;
  selectedYear: number | null = null;
  currentWeek: number | null = null;

  availableMonths: { name: string; value: number }[] = [];

  private readonly allMonths = [
    { name: 'January', value: 1 }, { name: 'February', value: 2 }, { name: 'March', value: 3 },
    { name: 'April', value: 4 }, { name: 'May', value: 5 }, { name: 'June', value: 6 },
    { name: 'July', value: 7 }, { name: 'August', value: 8 }, { name: 'September', value: 9 },
    { name: 'October', value: 10 }, { name: 'November', value: 11 }, { name: 'December', value: 12 }
  ];

  months = this.allMonths;

  private templateMap: { [key: number]: string } = {
    8: 'BillingEntry.xlsx'
  };

  showMonthYearDropdowns = true;
  allowFutureMonths = false;

  isCommitResultMode = false;
  commitResultRows: any[] = [];
  commitResultColumns: string[] = [];
  constructor(private apis: AuthService) { }

  ngOnInit(): void {
    this.setDynamicMonthsAndYears();

    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');

    this.getUploadReportTable();
    this.getStateList();
    this.calculateMop();
    this.calculateNetMop();
    //removable
    //this.downlaodOutLookFormat();
  }

  // ==== API CALLS ====

  getUploadReportTable(): void {

    this.apis.getUploadReportTable().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.uploadReportList = res.data;
          this.filterUploadListByPermission();
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching upload types.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Something went wrong while fetching upload types.');
      }
    });
  }

  getStateList(): void {
    this.apis.getStateListReport().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.stateList = res.data;
          //console.log(this.stateList);
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching state list.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Something went wrong while fetching upload types.');
      }
    });
  }

  filterUploadListByPermission(): void {
    if (!this.uploadReportList || this.uploadReportList.length === 0) {
      this.filteredUploadReportList = [];
      return;
    }

    this.filteredUploadReportList = this.uploadReportList.filter(upload => {

      // Agar userpermission mein kuch hai — SIRF username se match karo
      if (upload.userpermission && upload.userpermission.trim() !== '') {
        const userPermissions = upload.userpermission.split(',').map(p => p.trim().toLowerCase());
        return this.userName && userPermissions.includes(this.userName.toLowerCase());
      }

      // userpermission null/empty hai — tab permission (positionId) se check karo
      if (upload.permission && upload.permission.trim() !== '') {
        const permissions = upload.permission.split(',').map(p => p.trim());
        return this.positionId && permissions.includes(this.positionId);
      }
      return false;
    });
  }

  // ==== EVENT HANDLERS ====

  onUploadTypeChange(): void {

    if (this.selectedUploadId == null) {
      this.resetSelections();
      return;
    }
    this.priecPositionDiv = false;
    const selectedItem = this.filteredUploadReportList.find(x => x.UploadID === this.selectedUploadId);
    this.selectedUploadName = selectedItem?.UploadName || '';
    this.resetFileSelection();

    if (this.selectedUploadId === 1 || this.selectedUploadId === 11 || this.selectedUploadId === 12) {
      this.showMonthYearDropdowns = false;
      this.setFinancialYearMonthYear();
    } else {
      this.showMonthYearDropdowns = true;
      this.setMonthsYearsForUploadType();
    }

    if (![1, 3, 4, 5, 6, 7].includes(this.selectedUploadId)) {
      const fileName = this.templateMap[this.selectedUploadId];
      if (fileName) {
        this.downloadFileName = fileName;
        this.downloadFileUrl = `assets/excel/${fileName}`;
      }
    }
    if (this.selectedMonth && this.selectedYear && this.selectedUploadId === 10) {
      this.downloadFileName = 'outlook';
      this.getOutlookReportFormatData();
    }

    if (this.selectedUploadId === 12) {
      this.downloadFileName = 'PDD Entry';
      this.getPddFormatData();
    }

    if (this.selectedUploadId === 6) {
      this.fetchSPADetails();
    }

    if (this.selectedUploadId === 9) {
      this.priecPositionDiv = true;
      this.selectedState = 'All';
    }

    if (this.stateBasedUploadTypes.includes(this.selectedUploadId)) {
      this.selectedState = 'All';
      setTimeout(() => this.onStateChange(), 0);
    }

    this.resetForm();
  }

  private setFinancialYearMonthYear(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    if (currentMonth >= 4) {
      this.selectedMonth = currentMonth;
      this.selectedYear = currentYear;
    } else {
      this.selectedMonth = currentMonth;
      this.selectedYear = currentYear;
    }

    //console.log('Auto-set Financial Year:', {
    //  month: this.selectedMonth,
    //  year: this.selectedYear,
    //  monthName: this.allMonths.find(m => m.value === this.selectedMonth)?.name
    //});
  }

  // dinesh
  private setMonthsYearsForUploadType(): void {

    // ================= BDRC (UploadId = 3) =================
    if (this.selectedUploadId === 3) {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const months: { name: string; value: number }[] = [];
      const yearsSet = new Set<number>();

      // current -1  to current +5  (current INCLUDED)
      for (let offset = -1; offset <= 5; offset++) {
        const tempDate = new Date(currentYear, currentMonth - 1 + offset, 1);
        const monthValue = tempDate.getMonth() + 1;
        const yearValue = tempDate.getFullYear();

        const monthObj = this.allMonths.find(m => m.value === monthValue);
        if (monthObj) {
          months.push(monthObj);
          yearsSet.add(yearValue);
        }
      }

      this.availableMonths = months;
      this.years = Array.from(yearsSet).sort((a, b) => a - b);
      return;
    }

    // ================= FORECAST (UploadId = 4) =================
    //if (this.selectedUploadId === 4) {
    //  const today = new Date();
    //  const currentMonth = today.getMonth() + 1;
    //  const currentYear = today.getFullYear();
    //  const months: { name: string; value: number }[] = [];
    //  const yearsSet = new Set<number>();

    //  const dayOffset = today.getDate() >= 19 ? 1 : 0;

    //  for (let i = 1; i <= 3; i++) {
    //    const tempDate = new Date(currentYear, currentMonth - 1 + i + dayOffset, 1);
    //    //const monthValue = tempDate.getMonth() + 1;
    //    const monthValue = tempDate.getMonth();
    //    const yearValue = tempDate.getFullYear();
    //    const monthObj = this.allMonths.find(m => m.value === monthValue);
    //    if (monthObj) {
    //      months.push(monthObj);
    //      yearsSet.add(yearValue);
    //    }
    //  }

    //  this.availableMonths = months;
    //  this.years = Array.from(yearsSet).sort((a, b) => a - b);
    //  return;
    //}

    if (this.selectedUploadId === 4) {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const months: { name: string; value: number }[] = [];
      const yearsSet = new Set<number>();

      for (let i = 0; i <= 5; i++) {
        const tempDate = new Date(currentYear, currentMonth - 1 + i, 1);

        const monthValue = tempDate.getMonth() + 1;
        const yearValue = tempDate.getFullYear();

        const monthObj = this.allMonths.find(m => m.value === monthValue);

        if (monthObj) {
          months.push(monthObj);
          yearsSet.add(yearValue);
        }
      }

      this.availableMonths = months;
      this.years = Array.from(yearsSet).sort((a, b) => a - b);
      return;
    }

    // ================= INDUSTRY (UploadId = 5) =================
    if (this.selectedUploadId === 5) {
      this.availableMonths = [...this.allMonths]; // Jan to Dec sab months

      const currentYear = new Date().getFullYear();
      this.years = [];
      for (let y = 2023; y <= currentYear; y++) {
        this.years.push(y);
      }
      return;
    }
    // ================= DEFAULT =================
    this.setDynamicMonthsAndYears();
  }

  onStateChange(): void {

    this.downloadFileName = '';
    this.downloadFileUrl = '';
    this.clearAllData();

    const stateHandlers: { [key: number]: (state: string) => void } = {
      7: (state) => this.fetchDealersByState(state),
      4: (state) => this.fetchModelByState(state),
      5: (state) => this.fetchIndustryByState(state),
      1: (state) => this.fetchTalukaIndustryByState(state),
      3: (state) => this.fetchBDRCByState(state),
      11: (state) => this.fetchRevisedBRDCDataByState(state)
    };

    if (this.selectedUploadId && this.selectedState) {
      const handler = stateHandlers[this.selectedUploadId];
      if (handler) handler(this.selectedState);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!this.selectedUploadId) {
      this.apis.showAlert('warning', 'Required', 'Please select upload type first.');
      input.value = '';
      return;
    }

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        this.apis.showAlert('warning', 'Invalid File', 'Only .xlsx files are allowed.');
        input.value = '';
        return;
      }
      this.selectedFile = file;
      this.selectedFileName = file.name;
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedUploadId) {
      this.apis.showAlert('question', 'Required?', 'Upload Type is required.');
      return;
    }

    if (this.selectedUploadId !== 1 && (!this.selectedMonth || !this.selectedYear)) {
      this.apis.showAlert('question', 'Required?', 'Month and Year are required.');
      return;
    }

    if (!this.selectedFile) {
      this.apis.showAlert('question', 'Required?', 'Excel file is required.');
      return;
    }

    const uploadHandlers: { [key: number]: () => Promise<void> } = {
      1: () => this.handleTalukaIndustryUpload(),
      3: () => this.handleBDRCUpload(),
      4: () => this.handleForecastUpload(),
      5: () => this.handleIndustryUpload(),
      7: () => this.handleAccountEntryUpload(),
      10: () => this.handleOutlookUploadExcel(),
      11: () => this.handleRevisedBdrcUploadExcel(),
    };

    const handler = uploadHandlers[this.selectedUploadId!];
    if (handler) {
      await handler();
    } else {
      await this.handleDefaultUpload();
    }
  }

  onBack(): void {
    if (this.isCommitResultMode) {
      this.isCommitResultMode = false;
      this.commitResultRows = [];
      this.resetAfterCommit();
    } else {
      this.resetAfterCommit();
    }
  }

  onCommit(): void {
    if (this.isCommitting) return;

    if (!this.selectedUploadId || !this.selectedMonth || !this.selectedYear) {
      this.apis.showAlert('question', 'Required?', 'Upload Type, Month & Year are required.');
      return;
    }

    if (!this.stagingTable) {
      this.apis.showAlert('error', 'Error', 'Staging table not found.');
      return;
    }

    this.isCommitting = true;

    const request = {
      UploadId: this.selectedUploadId.toString(),
      StagingTable: this.stagingTable,
      Month: Number(this.selectedMonth),
      Year: Number(this.selectedYear)
    };

    this.apis.commitData(request).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.commitResultRows = Array.isArray(res.data) ? res.data : [];
          this.commitResultColumns = this.commitResultRows.length > 0 ? Object.keys(this.commitResultRows[0]) : [];
          this.isPreviewMode = false;
          this.isCommitResultMode = true;
        } else {
          this.apis.showAlert('error', 'Error', res?.message || 'Data save failed.');
        }
        this.isCommitting = false;
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Something went wrong during upload.');
        this.isCommitting = false;
      }
    });
  }

  // ==== FETCH DATA METHODS ====

  fetchSPADetails(): void {
    this.apis.fetchSPADetails().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.spaData = res.data;
          this.downloadFileName = `SPAPlanning_${new Date().getTime()}.xlsx`;
          if (this.spaData.length === 0) {
            this.apis.showAlert('info', 'No Data', 'No SPA planning data found');
          }
        } else {
          this.spaData = [];
          this.apis.showAlert('error', 'Error', 'Failed to fetch SPA planning data.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error', 'SPA planning data fetch failed')
    });
  }

  fetchBDRCByState(stateName: string): void {
    this.fetchDataByState(stateName, 'getDealersByState', 'bdrcData', 'BDRC', 'BDRC data');
  }

  fetchTalukaIndustryByState(stateName: string): void {
    this.fetchDataByState(stateName, 'fetchTalukaIndustryByState', 'talukaIndustryData', 'TalukaIndustry', 'Taluka industry data');
  }

  fetchIndustryByState(stateName: string): void {
    this.fetchDataByState(stateName, 'fetchIndustryByState', 'industryData', 'Industry', 'Industry data');
  }

  fetchModelByState(stateName: string): void {
    this.fetchDataByState(stateName, 'fetchModelByState', 'modelData', 'Forecast', 'Forecast data');
  }

  fetchDealersByState(stateName: string): void {
    this.fetchDataByState(stateName, 'getDealersByState', 'dealerData', 'AccountEntry', 'dealer data');
  }

  private fetchDataByState(stateName: string, apiMethod: string, dataProperty: string, filePrefix: string, errorMessage: string): void {

    const request = { StateName: stateName };
    (this.apis as any)[apiMethod](request).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          (this as any)[dataProperty] = res.data;
          this.downloadFileName = `${filePrefix}_${stateName}_${new Date().getTime()}.xlsx`;
          if (res.data.length === 0) {
            this.apis.showAlert('info', 'No Data', `No ${errorMessage} found for ${stateName}`);
          }
        } else {
          (this as any)[dataProperty] = [];
          this.apis.showAlert('error', 'Error', `Failed to fetch ${errorMessage}.`);
        }
      },
      error: () => this.apis.showAlert('error', 'Error', `${errorMessage} fetch failed`)
    });
  }

  async downloadBDRCExcel(): Promise<void> {
    if (!this.selectedMonth || !this.selectedYear) {
      this.apis.showAlert('warning', 'Required', 'Please select Month and Year before downloading BDRC Excel.');
      return;
    }
    if (!this.validateDownload(this.bdrcData, 'BDRC')) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('BDRC Entry');
      const monthYearText = this.getMonthYearText();
      const hasW5 = this.hasWeek5(this.selectedMonth, this.selectedYear);

      const columns: Partial<ExcelJS.Column>[] = [
        { width: 10 }, // State
        { width: 27 }, // Dlr Name
        { width: 13 }, // Dlr Loc
        { width: 8 },  // SAP
        { width: 8 }  // Status 
      ];
      // Add 30 more columns for weeks
      for (let i = 0; i < 30; i++) {
        const colNum = i + 6; // Changed from 5 to 6 due to Status column
        if ([11, 17, 23, 29, 35].includes(colNum)) { // TTL columns (shifted by 1)
          columns.push({ width: 4 });
        } else {
          columns.push({ width: 4 }); // W1, W2, W3, W4, W5 columns
        }
      }
      worksheet.columns = columns;

      // Row 1: Month/Year
      worksheet.mergeCells('A1:AI1'); // Changed from AH1 to AI1
      worksheet.getCell('A1').value = monthYearText;
      this.applyCellStyle(worksheet.getCell('A1'), { bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER });
      worksheet.getCell('A1').font = { name: 'Calibri', size: 12, bold: true };

      // Row 2: Plan sections
      [1, 2, 3, 4, 5].forEach(col => this.applyCellStyle(worksheet.getCell(2, col), { border: true })); // Added col 5

      const row2Merges = [
        { range: 'F2:K2', value: 'Bill plan' },      // Shifted from E2:J2
        { range: 'L2:Q2', value: 'Del plan' },       // Shifted from K2:P2
        { range: 'R2:W2', value: 'Ret plan' },       // Shifted from Q2:V2
        { range: 'X2:AC2', value: 'Coll plan(In Lacs)' }, // Shifted from W2:AB2
        { range: 'AD2:AI2', value: 'BG Plan(In Lacs)' }   // Shifted from AC2:AH2
      ];

      row2Merges.forEach(({ range, value }) => {
        worksheet.mergeCells(range);
        const cell = worksheet.getCell(range.split(':')[0]);
        cell.value = value;
        this.applyCellStyle(cell, { bold: true, bgColor: this.COLORS.PRIMARY_HEADER, border: true });
      });

      // TOTAL ROW
      const totalRow = worksheet.getRow(3);
      const columnGroups = [
        { start: 6, end: 11 },   // Shifted from 5-10
        { start: 12, end: 17 },  // Shifted from 11-16
        { start: 18, end: 23 },  // Shifted from 17-22
        { start: 24, end: 29 },  // Shifted from 23-28
        { start: 30, end: 35 }   // Shifted from 29-34
      ];

      // Merge first 4 columns for "Total" text (including Status)
      worksheet.mergeCells(3, 1, 3, 4); // Changed from 3 to 4
      totalRow.getCell(1).value = 'Total';
      this.applyCellStyle(totalRow.getCell(1), {
        bold: true,
        bgColor: this.COLORS.TOTAL_ROW,
        border: true,
        locked: true
      });

      // Status column - empty
      totalRow.getCell(5).value = '';
      this.applyCellStyle(totalRow.getCell(5), {
        bold: true,
        bgColor: this.COLORS.TOTAL_ROW,
        border: true,
        locked: true
      });

      // Sum formulas for all week columns
      const dataStartRow = 5;
      const dataEndRow = 4 + this.bdrcData.length;

      columnGroups.forEach(group => {
        for (let col = group.start; col <= group.end; col++) {
          const colLetter = this.getColumnLetter(col);
          totalRow.getCell(col).value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
          this.applyCellStyle(totalRow.getCell(col), {
            bold: true,
            bgColor: this.COLORS.TOTAL_ROW,
            border: true,
            locked: true
          });
        }
      });

      const subHeaders = [
        'State', 'Dlr Name', 'Dlr Loc', 'SAP', 'Status', // Added Status
        ...Array(5).fill(['W1', 'W2', 'W3', 'W4', 'W5', 'TTL']).flat()
      ];

      subHeaders.forEach((header, index) => {
        const cell = worksheet.getCell(4, index + 1);
        cell.value = header;
        this.applyCellStyle(cell, { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
      });

      // Data rows start from row 5
      this.bdrcData.forEach((dealer, index) => {
        const rowIndex = index + 5;
        const row = worksheet.getRow(rowIndex);

        [
          { col: 1, value: dealer.StateName || '' },
          { col: 2, value: dealer.DealerName || '' },
          { col: 3, value: dealer.DlrLoc || '' },
          { col: 4, value: dealer.DealerCode || '' },
          { col: 5, value: dealer.Status || '' } // NEW: Status column
        ].forEach(({ col, value }) => {
          row.getCell(col).value = value;
          this.applyCellStyle(row.getCell(col), { locked: true, bgColor: this.COLORS.LOCKED_CELL, border: true });
        });

        columnGroups.forEach(group => {
          // W1-W4
          for (let col = group.start; col <= group.start + 3; col++) {
            row.getCell(col).value = '';
            this.applyCellStyle(row.getCell(col), { locked: false, border: true });
          }

          // W5
          const w5Col = group.start + 4;
          row.getCell(w5Col).value = hasW5 ? '' : 0;
          this.applyCellStyle(row.getCell(w5Col), {
            locked: !hasW5,
            bgColor: hasW5 ? undefined : this.COLORS.DISABLED_CELL,
            border: true
          });

          // TTL
          const ttlCol = group.start + 5;
          const startLetter = this.getColumnLetter(group.start);
          const endLetter = this.getColumnLetter(group.start + 4);
          row.getCell(ttlCol).value = { formula: `SUM(${startLetter}${rowIndex}:${endLetter}${rowIndex})` };
          this.applyCellStyle(row.getCell(ttlCol), { locked: true, bgColor: this.COLORS.FORMULA_CELL, border: true });
        });
      });

      // Validation - column numbers shifted by 1
      const validationColumns = [6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34];
      this.addDataValidation(worksheet, this.bdrcData.length, validationColumns, hasW5, [10, 16, 22, 28, 34], 5);

      await this.protectAndSaveWorkbook(workbook, this.downloadFileName, true);
    } catch (error) {
      //console.error('Excel generation error:', error);
      this.apis.showAlert('error', 'Error', 'Failed to generate Excel file.');
    }
  }

  async downloadDynamicExcel(): Promise<void> {
    if (!this.validateDownload(this.dealerData, 'dealer')) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Account Entry');

      const { currentMonthText, previousMonthText } = this.getDynamicMonthYearText();
      const monthYearText = this.getMonthYearText();

      // TOTAL 22 COLUMNS (NO COLLECTION TTL)
      worksheet.columns = [
        { width: 16 }, // 1 State
        { width: 6 },  // 2 SAP
        { width: 7 },  // 3 Status
        { width: 6 },  // 4 Previous Month Collection
        { width: 6 },  // 5 Current Month Collection

        { width: 6 },  // 6 Ageing 00-30
        { width: 6 },  // 7 Ageing 31-60
        { width: 6 },  // 8 Ageing 61-90
        { width: 7 },  // 9 Ageing 91-120
        { width: 7 },  // 10 Ageing 121-150
        { width: 7 },  // 11 Ageing 151-180
        { width: 6 },  // 12 Ageing >180
        { width: 6 },  // 13 Ageing TTL 

        { width: 8 },  // 14 TA O/S MMFSL
        { width: 5 },  // 15 TA O/S LTF
        { width: 5 },  // 16 TA O/S HDFC
        { width: 6 },  // 17 TA O/S Other
        { width: 6 },  // 18 TA O/S TTL

        { width: 6 },  // 19 BG YTD
        { width: 6 },  // 20 BG Current Month
        { width: 9 },  // 21 Credit Note Released
        { width: 6 },   // 22 Credit Note Hold
        { width: 6 },   // 22 Credit Note Hold
        { width: 6 },   // 22 Credit Note Hold

      ];

      // ---------- ROW 1 ----------
      const headersRow1 = [
        { range: 'A1:C1', value: monthYearText },
        { range: 'D1:E1', value: 'Collection' },
        { range: 'F1:M1', value: 'Current Month Ageing O/s as on 1st' },
        { range: 'N1:R1', value: `TA O/S As on 1st of ${currentMonthText}` },
        { range: 'S1:T1', value: 'BG' },
        { range: 'U1:V1', value: 'Credit Note' },
        { range: 'W1:X1', value: 'Rotavator' }
      ];

      headersRow1.forEach(h => {
        worksheet.mergeCells(h.range);
        const cell = worksheet.getCell(h.range.split(':')[0]);
        cell.value = h.value;
        this.applyCellStyle(cell, { bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER });
      });

      // ---------- ROW 2 TOTAL ----------
      const totalRow = worksheet.getRow(2);
      const dataStartRow = 4;
      const dataEndRow = 3 + this.dealerData.length;

      worksheet.mergeCells('A2:C2');
      totalRow.getCell(1).value = 'Total';
      this.applyCellStyle(totalRow.getCell(1), { bold: true, border: true, locked: true, bgColor: this.COLORS.TOTAL_ROW });

      for (let col = 4; col <= 24; col++) {
        const colLetter = this.getColumnLetter(col);

        if (col === 13) {
          totalRow.getCell(col).value = { formula: `SUM(F2:L2)` }; // Ageing TTL
        } else if (col === 18) {
          totalRow.getCell(col).value = { formula: `SUM(N2:Q2)` }; // TA TTL
        } else {
          totalRow.getCell(col).value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
        }

        this.applyCellStyle(totalRow.getCell(col), {
          bold: true,
          locked: true,
          border: true,
          numFmt: '0.00',
          bgColor: (col === 13 || col === 18) ? this.COLORS.FORMULA_CELL : this.COLORS.TOTAL_ROW
        });
      }

      // ---------- ROW 3 SUB HEADERS ----------
      const headers = [
        'State', 'SAP', 'Status',
        previousMonthText, currentMonthText,
        '00-30', '31-60', '61-90', '91-120', '121-150', '151-180', '>180', 'TTL',
        'MMFSL', 'LTF', 'HDFC', 'Other', 'TTL',
        'YTD', currentMonthText, 'Released', 'Hold', 'Stock', 'O/s'
      ];

      headers.forEach((h, i) => {
        const cell = worksheet.getCell(3, i + 1);
        cell.value = h;
        this.applyCellStyle(cell, { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
      });

      // ---------- DATA ROWS ----------
      this.dealerData.forEach((d, i) => {
        const rowIndex = i + 4;
        const row = worksheet.getRow(rowIndex);

        row.getCell(1).value = d.StateName || '';
        row.getCell(2).value = d.DealerCode || '';
        row.getCell(3).value = d.Status || 'Active';

        [1, 2, 3].forEach(c =>
          this.applyCellStyle(row.getCell(c), { locked: true, border: true, bgColor: this.COLORS.LOCKED_CELL })
        );

        const editable = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24];
        editable.forEach(c => {
          row.getCell(c).value = '';
          this.applyCellStyle(row.getCell(c), { locked: false, border: true, numFmt: '0.00' });
        });

        row.getCell(13).value = { formula: `SUM(F${rowIndex}:L${rowIndex})` }; // Ageing TTL
        row.getCell(18).value = { formula: `SUM(N${rowIndex}:Q${rowIndex})` }; // TA TTL

        [13, 18].forEach(c =>
          this.applyCellStyle(row.getCell(c), { locked: true, border: true, bgColor: this.COLORS.FORMULA_CELL, numFmt: '0.00' })
        );
      });

      await this.protectAndSaveWorkbook(workbook, this.downloadFileName, true);
    } catch {
      this.apis.showAlert('error', 'Error', 'Failed to generate Excel file.');
    }
  }

  async downloadForecastExcel(): Promise<void> {
    if (!this.validateDownload(this.modelData, 'forecast')) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Forecast');
      const monthYearText = this.getMonthYearText();
      const hasW5 = this.hasWeek5(this.selectedMonth!, this.selectedYear!);

      worksheet.columns = [
        { width: 8 }, // State
        { width: 26 }, // Model
        { width: 20 }, // Part Code
        { width: 4 }, // HP
        { width: 8 }, // FR
        { width: 8 }, // RR
        { width: 6 }, // Status
        { width: 4 }, // W1 (Billing)
        { width: 4 }, // W2
        { width: 4 }, // W3
        { width: 4 }, // W4
        { width: 4 }, // W5
        { width: 4 }  // TTL
      ];

      // Row 1: Month/Year and section header
      worksheet.mergeCells('A1:G1');
      worksheet.getCell('A1').value = monthYearText;
      this.applyCellStyle(worksheet.getCell('A1'), { bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER });
      worksheet.getCell('A1').font = { name: 'Calibri', size: 12, bold: true };

      worksheet.mergeCells('H1:M1');
      worksheet.getCell('H1').value = '';
      this.applyCellStyle(worksheet.getCell('H1'), { bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER });

      // Row 2: Empty cells for first 7 columns, then plan label
      [1, 2, 3, 4, 5, 6, 7].forEach(col => this.applyCellStyle(worksheet.getCell(2, col), { border: true }));

      worksheet.mergeCells('H2:M2');
      worksheet.getCell('H2').value = 'Billing Plan';
      this.applyCellStyle(worksheet.getCell('H2'), { bold: true, bgColor: this.COLORS.PRIMARY_HEADER, border: true });

      // Row 3: TOTAL ROW
      const totalRow = worksheet.getRow(3);

      // Merge first 6 columns for "Total" text (State to RR)
      worksheet.mergeCells(3, 1, 3, 6);
      totalRow.getCell(1).value = 'Total';
      this.applyCellStyle(totalRow.getCell(1), {
        bold: true,
        bgColor: this.COLORS.TOTAL_ROW,
        border: true,
        locked: true
      });

      // Status column - empty
      totalRow.getCell(7).value = '';
      this.applyCellStyle(totalRow.getCell(7), {
        bold: true,
        bgColor: this.COLORS.TOTAL_ROW,
        border: true,
        locked: true
      });

      // Sum formulas for Billing Plan (columns 8-13)
      const dataStartRow = 5;
      const dataEndRow = 4 + this.modelData.length;

      // Billing Plan totals
      for (let col = 8; col <= 13; col++) {
        const colLetter = this.getColumnLetter(col);
        totalRow.getCell(col).value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
        this.applyCellStyle(totalRow.getCell(col), {
          bold: true,
          bgColor: this.COLORS.TOTAL_ROW,
          border: true,
          locked: true,
          numFmt: '0'
        });
      }

      // Row 4: Headers
      const headers = [
        'State', 'Model', 'Part Code', 'HP', 'FR', 'RR', 'Status',
        'W1', 'W2', 'W3', 'W4', 'W5', 'TTL'
      ];
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(4, index + 1);
        cell.value = header;
        this.applyCellStyle(cell, { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
      });

      // Data rows start from row 5
      this.modelData.forEach((model, index) => {
        const rowIndex = index + 5;
        const row = worksheet.getRow(rowIndex);

        // Locked columns: State, Model, Part Code, HP, FR, RR, Status
        row.getCell(1).value = model.StateName || '';
        row.getCell(2).value = model.ModelName || '';
        row.getCell(3).value = model.ModelCode || '';
        row.getCell(4).value = model.HP || '';
        row.getCell(5).value = model.FR || '';
        row.getCell(6).value = model.RR || '';
        row.getCell(7).value = model.Status || '';

        [1, 2, 3, 4, 5, 6, 7].forEach(col => {
          this.applyCellStyle(row.getCell(col), { locked: true, bgColor: this.COLORS.LOCKED_CELL, border: true });
        });

        // Editable columns: W1-W4 for Billing
        [8, 9, 10, 11].forEach(col => {
          row.getCell(col).value = '';
          this.applyCellStyle(row.getCell(col), { locked: false, border: true, numFmt: '0' });
        });

        // W5 column (conditional based on hasW5)
        row.getCell(12).value = hasW5 ? '' : 0;
        const style: any = { border: true, numFmt: '0' };
        if (!hasW5) {
          style.locked = true;
          style.bgColor = this.COLORS.DISABLED_CELL;
        } else {
          style.locked = false;
        }
        this.applyCellStyle(row.getCell(12), style);

        // TTL formula
        row.getCell(13).value = { formula: `SUM(H${rowIndex}:L${rowIndex})` };
        this.applyCellStyle(row.getCell(13), { locked: true, border: true, numFmt: '0', bgColor: this.COLORS.FORMULA_CELL });
      });

      // Data validation for editable columns
      const validationColumns = [8, 9, 10, 11, 12];
      validationColumns.forEach(colIndex => {
        for (let rowIdx = 5; rowIdx <= 4 + this.modelData.length; rowIdx++) {
          const cell = worksheet.getCell(rowIdx, colIndex);

          if (colIndex === 12 && !hasW5) continue;

          cell.dataValidation = {
            type: 'whole',
            operator: 'between',
            formulae: [0, 99],
            allowBlank: true,
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid Input',
            error: 'Only 2-digit numbers (0–99) are allowed',
            showInputMessage: true,
            promptTitle: 'Enter Value',
            prompt: 'Please enter a number between 0 and 99'
          };
        }
      });

      await this.protectAndSaveWorkbook(workbook, this.downloadFileName, true);
    } catch (error) {
      this.apis.showAlert('error', 'Error', 'Failed to generate Excel file.');
    }
  }

  async downloadIndustryExcel(): Promise<void> {
    if (!this.validateDownload(this.industryData, 'industry')) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Industry');
      const monthYearText = this.getMonthYearText();

      const stateGroups = this.groupByState(this.industryData);

      const allBrands: string[] = [];
      this.industryData.forEach(item => {
        if (item.BrandName && item.BrandName.trim() !== '' && !allBrands.includes(item.BrandName)) {
          allBrands.push(item.BrandName);
        }
      });

      const hpCategories = ['<20', '20-30', '30-40', '41-45', '46-50', '>50'];
      const totalColumns = 2 + allBrands.length + 1;
      const totalColIndex = 3 + allBrands.length;

      const columns = [{ width: 12 }, { width: 6 }];
      allBrands.forEach(() => columns.push({ width: 8 }));
      columns.push({ width: 8 }); // TOTAL column
      worksheet.columns = columns;

      let currentRow = 1;

      // ── Row 1: Month-Year header ───────────────────────────────────
      worksheet.mergeCells(currentRow, 1, currentRow, totalColumns);
      worksheet.getCell(currentRow, 1).value = monthYearText;
      this.applyCellStyle(worksheet.getCell(currentRow, 1), {
        bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER
      });
      currentRow++;

      const stateKeys = Object.keys(stateGroups);

      // Track which rows contain each HP category TOTAL cell (for grand total formula)
      // hpTotalRowRefs[hpIndex] = array of row numbers for that HP across all states
      const hpDataRowsByHp: number[][] = hpCategories.map(() => []);
      // Also track per-state TOTAL rows for grand total
      const stateTotalRows: number[] = [];

      // ── Per-State blocks ───────────────────────────────────────────
      stateKeys.forEach((stateName, stateIndex) => {

        // Header Row
        const headerRow = worksheet.getRow(currentRow);
        headerRow.getCell(1).value = 'State';
        this.applyCellStyle(headerRow.getCell(1), { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
        headerRow.getCell(2).value = 'HP';
        this.applyCellStyle(headerRow.getCell(2), { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
        allBrands.forEach((brand, i) => {
          headerRow.getCell(3 + i).value = brand;
          this.applyCellStyle(headerRow.getCell(3 + i), { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
        });
        headerRow.getCell(totalColIndex).value = 'TOTAL';
        this.applyCellStyle(headerRow.getCell(totalColIndex), { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
        currentRow++;

        const dataFirstRow = currentRow;

        // HP Data Rows
        hpCategories.forEach((hpCat, hpIndex) => {
          hpDataRowsByHp[hpIndex].push(currentRow); // remember for grand total

          const dataRow = worksheet.getRow(currentRow);

          dataRow.getCell(1).value = hpIndex === 0 ? stateName : '';
          this.applyCellStyle(dataRow.getCell(1), { locked: true, bgColor: this.COLORS.LOCKED_CELL, border: true });

          dataRow.getCell(2).value = hpCat;
          this.applyCellStyle(dataRow.getCell(2), { locked: true, bgColor: this.COLORS.LOCKED_CELL, border: true });

          allBrands.forEach((_, i) => {
            dataRow.getCell(3 + i).value = null;  // null so cell is truly empty (not empty string)
            this.applyCellStyle(dataRow.getCell(3 + i), { locked: false, border: true });
            dataRow.getCell(3 + i).dataValidation = {
              type: 'whole',
              operator: 'between',
              formulae: [-99999, 99999],
              //type: 'whole',
              //operator: 'greaterThanOrEqual',
              //formulae: [0],
              allowBlank: true,
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Invalid Input',
              error: 'Only whole numbers (integers) are allowed!'
            };
          });

          // TOTAL column — row-wise sum of all brands
          const startBrandCol = this.getColumnLetter(3);
          const endBrandCol = this.getColumnLetter(totalColIndex - 1);
          dataRow.getCell(totalColIndex).value = {
            formula: `SUM(${startBrandCol}${currentRow}:${endBrandCol}${currentRow})`
          };
          this.applyCellStyle(dataRow.getCell(totalColIndex), {
            locked: true, bgColor: this.COLORS.FORMULA_CELL, border: true
          });

          currentRow++;
        });

        const dataLastRow = currentRow - 1;

        // State TOTAL Row
        stateTotalRows.push(currentRow); // remember for grand total
        const totalRow = worksheet.getRow(currentRow);

        totalRow.getCell(1).value = '';
        this.applyCellStyle(totalRow.getCell(1), { locked: true, bgColor: this.COLORS.LOCKED_CELL, border: true });

        totalRow.getCell(2).value = 'TOTAL';
        this.applyCellStyle(totalRow.getCell(2), { bold: true, bgColor: this.COLORS.TOTAL_ROW, border: true, locked: true });

        allBrands.forEach((_, i) => {
          const colLetter = this.getColumnLetter(3 + i);
          totalRow.getCell(3 + i).value = {
            formula: `SUM(${colLetter}${dataFirstRow}:${colLetter}${dataLastRow})`
          };
          this.applyCellStyle(totalRow.getCell(3 + i), {
            bold: true, bgColor: this.COLORS.FORMULA_CELL, border: true, locked: true
          });
        });

        const totalColLetter = this.getColumnLetter(totalColIndex);
        totalRow.getCell(totalColIndex).value = {
          formula: `SUM(${totalColLetter}${dataFirstRow}:${totalColLetter}${dataLastRow})`
        };
        this.applyCellStyle(totalRow.getCell(totalColIndex), {
          bold: true, bgColor: this.COLORS.TOTAL_ROW, border: true, locked: true
        });

        // Merge state cell across all HP rows + TOTAL row
        worksheet.mergeCells(dataFirstRow, 1, currentRow, 1);

        currentRow++; // past TOTAL row

        // Blank separator between states
        if (stateIndex < stateKeys.length - 1) {
          currentRow++;
        }
      });

      // ── Grand HP-wise Total block at the END ───────────────────────
      // Two blank rows separator before grand total
      currentRow += 2;

      // Sub-header row (no separate heading row — "All States Total" is in State column)
      const gtSubHeader = worksheet.getRow(currentRow);
      gtSubHeader.getCell(1).value = 'State';
      this.applyCellStyle(gtSubHeader.getCell(1), { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
      gtSubHeader.getCell(2).value = 'HP';
      this.applyCellStyle(gtSubHeader.getCell(2), { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
      allBrands.forEach((brand, i) => {
        gtSubHeader.getCell(3 + i).value = brand;
        this.applyCellStyle(gtSubHeader.getCell(3 + i), { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
      });
      gtSubHeader.getCell(totalColIndex).value = 'TOTAL';
      this.applyCellStyle(gtSubHeader.getCell(totalColIndex), { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
      currentRow++;

      const gtDataFirstRow = currentRow;

      // One row per HP category — SUM of that HP row across all states
      hpCategories.forEach((hpCat, hpIndex) => {
        const gtRow = worksheet.getRow(currentRow);

        // "Total" label only in first row
        gtRow.getCell(1).value = hpIndex === 0 ? 'Total' : '';
        this.applyCellStyle(gtRow.getCell(1), { locked: true, bold: hpIndex === 0, bgColor: this.COLORS.LOCKED_CELL, border: true });

        gtRow.getCell(2).value = hpCat;
        this.applyCellStyle(gtRow.getCell(2), { locked: true, bgColor: this.COLORS.LOCKED_CELL, border: true });

        // For each brand: SUM of that brand column for this HP row across all states
        allBrands.forEach((_, i) => {
          const colLetter = this.getColumnLetter(3 + i);
          const rowRefs = hpDataRowsByHp[hpIndex];
          // Use IFERROR on each cell ref to handle empty/text cells gracefully
          const formula = rowRefs.length > 0
            ? rowRefs.map(r => `IFERROR(${colLetter}${r}*1,0)`).join('+')
            : '0';
          gtRow.getCell(3 + i).value = { formula };
          this.applyCellStyle(gtRow.getCell(3 + i), {
            locked: true, bgColor: this.COLORS.FORMULA_CELL, border: true
          });
        });

        // Row TOTAL = SUM of all brand grand-total cells in this row
        const startBrandCol = this.getColumnLetter(3);
        const endBrandCol = this.getColumnLetter(totalColIndex - 1);
        gtRow.getCell(totalColIndex).value = {
          formula: `SUM(${startBrandCol}${currentRow}:${endBrandCol}${currentRow})`
        };
        this.applyCellStyle(gtRow.getCell(totalColIndex), {
          locked: true, bgColor: this.COLORS.FORMULA_CELL, border: true
        });

        currentRow++;
      });

      const gtDataLastRow = currentRow - 1;

      // Merge "All States Total" cell across all HP rows
      worksheet.mergeCells(gtDataFirstRow, 1, gtDataLastRow, 1);

      // Grand TOTAL row — sums up all HP grand-total rows
      const gtTotalRow = worksheet.getRow(currentRow);

      gtTotalRow.getCell(1).value = '';
      this.applyCellStyle(gtTotalRow.getCell(1), { locked: true, bgColor: this.COLORS.LOCKED_CELL, border: true });

      gtTotalRow.getCell(2).value = 'TOTAL';
      this.applyCellStyle(gtTotalRow.getCell(2), { bold: true, bgColor: this.COLORS.TOTAL_ROW, border: true, locked: true });

      allBrands.forEach((_, i) => {
        const colLetter = this.getColumnLetter(3 + i);
        gtTotalRow.getCell(3 + i).value = {
          formula: `SUM(${colLetter}${gtDataFirstRow}:${colLetter}${gtDataLastRow})`
        };
        this.applyCellStyle(gtTotalRow.getCell(3 + i), {
          bold: true, bgColor: this.COLORS.FORMULA_CELL, border: true, locked: true
        });
      });

      const totalColLetter = this.getColumnLetter(totalColIndex);
      gtTotalRow.getCell(totalColIndex).value = {
        formula: `SUM(${totalColLetter}${gtDataFirstRow}:${totalColLetter}${gtDataLastRow})`
      };
      this.applyCellStyle(gtTotalRow.getCell(totalColIndex), {
        bold: true, bgColor: this.COLORS.TOTAL_ROW, border: true, locked: true
      });

      await this.protectAndSaveWorkbook(workbook, this.downloadFileName, true);
    } catch (error) {
      //console.error('Excel generation error:', error);
      this.apis.showAlert('error', 'Error', 'Failed to generate Excel file.');
    }
  }

  async downloadTalukaIndustryExcel(): Promise<void> {
    if (!this.validateDownload(this.talukaIndustryData, 'taluka industry')) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('TalukaIndustry');

      // Get financial year months for 3 years
      const { lfyMonths, cfyMonths, nfyMonths, lfyLabel, cfyLabel, nfyLabel } = this.getFinancialYearMonths();

      // Total columns: State, District, Taluka + (12 months + TTL) * 3 years = 3 + 39
      const totalColumns = 3 + (lfyMonths.length + 1) + (cfyMonths.length + 1) + (nfyMonths.length + 1);

      // Set column widths
      const columns: Partial<ExcelJS.Column>[] = [
        { width: 10 },  // State
        { width: 16 },  // District
        { width: 16 }   // Taluka
      ];
      // Add columns for 3 years (12 months + 1 TTL each)
      for (let i = 0; i < 39; i++) {
        columns.push({ width: 7 });
      }
      worksheet.columns = columns;

      // ROW 1: Month/Year header (merge all columns)
      worksheet.mergeCells(1, 1, 1, totalColumns);
      worksheet.getCell(1, 1).value = "";
      this.applyCellStyle(worksheet.getCell(1, 1), { bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER });
      worksheet.getCell(1, 1).font = { name: 'Calibri', size: 12, bold: true };

      // ROW 2: Financial Year labels
      // First 3 columns empty with border
      [1, 2, 3].forEach(col => {
        this.applyCellStyle(worksheet.getCell(2, col), { border: true });
      });

      // Last FY label (columns 4-16: 12 months + TTL)
      worksheet.mergeCells(2, 4, 2, 16);
      worksheet.getCell(2, 4).value = lfyLabel;
      this.applyCellStyle(worksheet.getCell(2, 4), { bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER });

      // Current FY label (columns 17-29: 12 months + TTL)
      worksheet.mergeCells(2, 17, 2, 29);
      worksheet.getCell(2, 17).value = cfyLabel;
      this.applyCellStyle(worksheet.getCell(2, 17), { bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER });

      // Next FY label (columns 30-42: 12 months + TTL)
      worksheet.mergeCells(2, 30, 2, 42);
      worksheet.getCell(2, 30).value = nfyLabel;
      this.applyCellStyle(worksheet.getCell(2, 30), { bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER });

      // ROW 3: TOTAL ROW (with formulas)
      const totalRow = worksheet.getRow(3);
      const dataStartRow = 5;
      const dataEndRow = 4 + this.talukaIndustryData.length;

      // Merge first 3 columns for "Total" text
      worksheet.mergeCells(3, 1, 3, 3);
      totalRow.getCell(1).value = 'Total';
      this.applyCellStyle(totalRow.getCell(1), {
        bold: true,
        bgColor: this.COLORS.TOTAL_ROW,
        border: true,
        locked: true
      });

      // Sum formulas for all month columns (skip TTL columns for now)
      let currentCol = 4;

      // Last FY months
      for (let i = 0; i < lfyMonths.length; i++) {
        const colLetter = this.getColumnLetter(currentCol);
        totalRow.getCell(currentCol).value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
        this.applyCellStyle(totalRow.getCell(currentCol), {
          bold: true,
          bgColor: this.COLORS.TOTAL_ROW,
          border: true,
          locked: true,
          numFmt: '0'
        });
        currentCol++;
      }

      // Last FY TTL (sum of last 12 columns)
      const lfyTtlStartCol = this.getColumnLetter(4);
      const lfyTtlEndCol = this.getColumnLetter(15);
      totalRow.getCell(currentCol).value = { formula: `SUM(${lfyTtlStartCol}3:${lfyTtlEndCol}3)` };
      this.applyCellStyle(totalRow.getCell(currentCol), {
        bold: true,
        bgColor: this.COLORS.FORMULA_CELL,
        border: true,
        locked: true,
        numFmt: '0'
      });
      currentCol++;

      // Current FY months
      for (let i = 0; i < cfyMonths.length; i++) {
        const colLetter = this.getColumnLetter(currentCol);
        totalRow.getCell(currentCol).value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
        this.applyCellStyle(totalRow.getCell(currentCol), {
          bold: true,
          bgColor: this.COLORS.TOTAL_ROW,
          border: true,
          locked: true,
          numFmt: '0'
        });
        currentCol++;
      }

      // Current FY TTL
      const cfyTtlStartCol = this.getColumnLetter(17);
      const cfyTtlEndCol = this.getColumnLetter(28);
      totalRow.getCell(currentCol).value = { formula: `SUM(${cfyTtlStartCol}3:${cfyTtlEndCol}3)` };
      this.applyCellStyle(totalRow.getCell(currentCol), {
        bold: true,
        bgColor: this.COLORS.FORMULA_CELL,
        border: true,
        locked: true,
        numFmt: '0'
      });
      currentCol++;

      // Next FY months
      for (let i = 0; i < nfyMonths.length; i++) {
        const colLetter = this.getColumnLetter(currentCol);
        totalRow.getCell(currentCol).value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
        this.applyCellStyle(totalRow.getCell(currentCol), {
          bold: true,
          bgColor: this.COLORS.TOTAL_ROW,
          border: true,
          locked: true,
          numFmt: '0'
        });
        currentCol++;
      }

      // Next FY TTL
      const nfyTtlStartCol = this.getColumnLetter(30);
      const nfyTtlEndCol = this.getColumnLetter(41);
      totalRow.getCell(currentCol).value = { formula: `SUM(${nfyTtlStartCol}3:${nfyTtlEndCol}3)` };
      this.applyCellStyle(totalRow.getCell(currentCol), {
        bold: true,
        bgColor: this.COLORS.FORMULA_CELL,
        border: true,
        locked: true,
        numFmt: '0'
      });

      // ROW 4: Headers
      const headers = [
        'State',
        'District',
        'Taluka Mapped',
        ...lfyMonths, 'TTL',
        ...cfyMonths, 'TTL',
        ...nfyMonths, 'TTL'
      ];

      headers.forEach((header, index) => {
        const cell = worksheet.getCell(4, index + 1);
        cell.value = header;

        // TTL columns get different color
        const isTtlColumn = header === 'TTL';
        this.applyCellStyle(cell, {
          bold: true,
          bgColor: isTtlColumn ? this.COLORS.FORMULA_CELL : this.COLORS.SECONDARY_HEADER,
          border: true
        });
      });

      // ROW 5+: Data rows
      this.talukaIndustryData.forEach((item, index) => {
        const rowIndex = index + 5;
        const row = worksheet.getRow(rowIndex);

        // Locked columns: State, District, Taluka
        [
          { col: 1, value: item.StateName || '' },
          { col: 2, value: item.DistrictName || '' },
          { col: 3, value: item.TehsilName || '' }
        ].forEach(({ col, value }) => {
          row.getCell(col).value = value;
          this.applyCellStyle(row.getCell(col), { locked: true, bgColor: this.COLORS.LOCKED_CELL, border: true });
        });

        // Editable and formula columns
        let currentCol = 4;

        // Last FY: 12 months (editable) + TTL (formula)
        for (let i = 0; i < lfyMonths.length; i++) {
          row.getCell(currentCol).value = '';
          this.applyCellStyle(row.getCell(currentCol), { locked: false, border: true, numFmt: '0' });
          currentCol++;
        }
        const lfyRowStartCol = this.getColumnLetter(4);
        const lfyRowEndCol = this.getColumnLetter(15);
        row.getCell(currentCol).value = { formula: `SUM(${lfyRowStartCol}${rowIndex}:${lfyRowEndCol}${rowIndex})` };
        this.applyCellStyle(row.getCell(currentCol), { locked: true, bgColor: this.COLORS.FORMULA_CELL, border: true, numFmt: '0' });
        currentCol++;

        // Current FY: 12 months (editable) + TTL (formula)
        for (let i = 0; i < cfyMonths.length; i++) {
          row.getCell(currentCol).value = '';
          this.applyCellStyle(row.getCell(currentCol), { locked: false, border: true, numFmt: '0' });
          currentCol++;
        }
        const cfyRowStartCol = this.getColumnLetter(17);
        const cfyRowEndCol = this.getColumnLetter(28);
        row.getCell(currentCol).value = { formula: `SUM(${cfyRowStartCol}${rowIndex}:${cfyRowEndCol}${rowIndex})` };
        this.applyCellStyle(row.getCell(currentCol), { locked: true, bgColor: this.COLORS.FORMULA_CELL, border: true, numFmt: '0' });
        currentCol++;

        // Next FY: 12 months (editable) + TTL (formula)
        for (let i = 0; i < nfyMonths.length; i++) {
          row.getCell(currentCol).value = '';
          this.applyCellStyle(row.getCell(currentCol), { locked: false, border: true, numFmt: '0' });
          currentCol++;
        }
        const nfyRowStartCol = this.getColumnLetter(30);
        const nfyRowEndCol = this.getColumnLetter(41);
        row.getCell(currentCol).value = { formula: `SUM(${nfyRowStartCol}${rowIndex}:${nfyRowEndCol}${rowIndex})` };
        this.applyCellStyle(row.getCell(currentCol), { locked: true, bgColor: this.COLORS.FORMULA_CELL, border: true, numFmt: '0' });
      });

      // Integer validation for all editable month columns (skip TTL columns)
      const editableColumns: number[] = [];

      // Last FY months (4-15)
      for (let i = 4; i <= 15; i++) editableColumns.push(i);

      // Current FY months (17-28)
      for (let i = 17; i <= 28; i++) editableColumns.push(i);

      // Next FY months (30-41)
      for (let i = 30; i <= 41; i++) editableColumns.push(i);

      this.addDataValidation(worksheet, this.talukaIndustryData.length, editableColumns, undefined, undefined, 5);

      await this.protectAndSaveWorkbook(workbook, this.downloadFileName, true);
    } catch (error) {
      //console.error('Excel generation error:', error);
      this.apis.showAlert('error', 'Error', 'Failed to generate Excel file.');
    }
  }

  downloadSPAExcel(): void {
    if (!this.spaData || this.spaData.length === 0) {
      this.apis.showAlert('warning', 'No Data', 'No SPA planning data available.');
      return;
    }

    try {
      const excelData = this.spaData.map(d => ({
        'Dealer Code': d.DealerCode || '',
        'Activity Name': d.ActivityName || '',
        'Planned Qty': '',
        'Planned Activity Budget': d.ActivityBudget
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SPA Planning');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(blob, this.downloadFileName);
    } catch (error) {
      this.apis.showAlert('error', 'Error', 'Failed to generate Excel file.');
    }
  }

  // ==== UPLOAD HANDLERS ====
  async handleTalukaIndustryUpload(): Promise<void> {
    const transformedData = await this.transformTalukaIndustryData();
    if (!transformedData) return;

    //console.log('Sending data to API...');
    //console.log('Sample records:', transformedData.slice(0, 3));

    const apiHeaders = ['StateName', 'DistrictName', 'TalukaName', 'Month', 'Year', 'Industrydata'];
    await this.sendTransformedData(
      transformedData,
      apiHeaders,
      'Taluka Industry Data',
      'taluka_industry_transformed.xlsx'
    );
  }

  async handleBDRCUpload(): Promise<void> {
    const transformedData = await this.transformBDRCData();
    if (!transformedData) return;
    const apiHeaders = [
      'StateName', 'DealerCode', 'DealerName', 'Status', // Added Status
      'BillPlan_W1', 'BillPlan_W2', 'BillPlan_W3', 'BillPlan_W4', 'BillPlan_W5',
      'DelPlan_W1', 'DelPlan_W2', 'DelPlan_W3', 'DelPlan_W4', 'DelPlan_W5',
      'RetPlan_W1', 'RetPlan_W2', 'RetPlan_W3', 'RetPlan_W4', 'RetPlan_W5',
      'CollPlan_W1', 'CollPlan_W2', 'CollPlan_W3', 'CollPlan_W4', 'CollPlan_W5',
      'BGPlan_W1', 'BGPlan_W2', 'BGPlan_W3', 'BGPlan_W4', 'BGPlan_W5'
    ];
    await this.sendTransformedData(transformedData, apiHeaders, 'BDRC Data', 'bdrc_transformed.xlsx');
  }

  async handleForecastUpload(): Promise<void> {
    const transformedData = await this.transformForecastData();
    if (!transformedData) return;
    const apiHeaders = [
      'State', 'Part Code', 'Model',
      'HP', 'FR', 'RR', 'Status',
      'W1_BillingPlan', 'W2_BillingPlan', 'W3_BillingPlan', 'W4_BillingPlan', 'W5_BillingPlan', 'Total_BillingPlan'
    ];
    await this.sendTransformedData(transformedData, apiHeaders, 'Forecast Data', 'forecast_transformed.xlsx');
  }

  async handleIndustryUpload(): Promise<void> {
    const transformedData = await this.transformIndustryData();
    if (!transformedData) return;

    const apiHeaders = ['StateName', 'HP_Category', 'BrandName', 'VehicleSold'];
    await this.sendTransformedData(transformedData, apiHeaders, 'Industry Data', 'industry_transformed.xlsx');
  }

  async handleAccountEntryUpload(): Promise<void> {
    const transformedData = await this.transformAccountEntryData();
    if (!transformedData) return;

    const apiHeaders = [
      'SAP',
      'State',
      'Status',  // NEW: Status column
      'Previos Month Collection',
      'Current Month Collection',
      'Current Month Ageing O/S 0000-0030',
      'Current Month Ageing O/S 0031-0060',
      'Current Month Ageing O/S 0061-0090',
      'Current Month Ageing O/S 0091-0120',
      'Current Month Ageing O/S 0121-0150',
      'Current Month Ageing O/S 0151-0180',
      'Current Month Ageing O/S Above 180',
      'Aging TTL',  // Aging Total (formula result)
      'TA O/S MMFSL',
      'TA O/S LTF',
      'TA O/S HDFC',
      'TA O/S Other',
      'TA O/S TTL',
      'BG YTD',
      'BG Current Month',
      'Credit Note Released',
      'Credit Note Hold',
      'Rota Stock',
      'Rota Os'
    ];

    await this.sendTransformedData(transformedData, apiHeaders, 'Account Entry Data', 'account_entry_transformed.xlsx');
  }

  async handleDefaultUpload(): Promise<void> {
    const formData = new FormData();
    formData.append('UploadId', this.selectedUploadId!.toString());
    formData.append('file', this.selectedFile!);

    this.apis.uploadExcelReport(formData).subscribe({
      next: (res: any) => this.handleUploadResponse(res),
      error: () => this.apis.showAlert('error', 'Error!', 'Something went wrong during upload.')
    });
  }

  // ==== TRANSFORM DATA METHODS ====

  private async transformTalukaIndustryData(): Promise<any[] | null> {
    try {
      const workbook = await this.loadWorkbook(this.selectedFile!);
      const worksheet = workbook.getWorksheet('TalukaIndustry');
      if (!worksheet) {
        this.apis.showAlert('error', 'Error', 'Invalid Taluka Industry Excel format. Sheet "TalukaIndustry" not found.');
        return null;
      }

      const transformedData: any[] = [];

      // Get financial year months for proper mapping
      const { lfyMonths, cfyMonths, nfyMonths } = this.getFinancialYearMonths();

      worksheet.eachRow((row, rowNumber) => {
        // Skip rows: 1 (month/year), 2 (FY labels), 3 (TOTAL row), 4 (headers)
        if (rowNumber < 5) return;

        const stateName = row.getCell(1).value;
        if (!stateName) return;

        // Skip if state is "Total"
        if (stateName && String(stateName).toLowerCase().trim() === 'total') return;

        const districtName = row.getCell(2).value || '';
        const talukaName = row.getCell(3).value || '';

        let currentCol = 4;

        // Process Last FY months (columns 4-15)
        for (let i = 0; i < lfyMonths.length; i++) {
          const monthYear = this.parseMonthYear(lfyMonths[i]);
          if (monthYear) {
            const industryValue = this.getCellValues(row.getCell(currentCol));

            // Only add if there's actual data (even if 0)
            if (industryValue !== null) {
              transformedData.push({
                StateName: stateName,
                DistrictName: districtName,
                TalukaName: talukaName,
                Month: monthYear.month,      // "Jan", "Feb", etc.
                Year: monthYear.year,         // 2024, 2025, etc.
                Industrydata: industryValue
              });
            }
          }
          currentCol++;
        }
        currentCol++; // Skip LFY TTL column (column 16)

        // Process Current FY months (columns 17-28)
        for (let i = 0; i < cfyMonths.length; i++) {
          const monthYear = this.parseMonthYear(cfyMonths[i]);
          if (monthYear) {
            const industryValue = this.getCellValues(row.getCell(currentCol));

            if (industryValue !== null) {
              transformedData.push({
                StateName: stateName,
                DistrictName: districtName,
                TalukaName: talukaName,
                Month: monthYear.month,
                Year: monthYear.year,
                Industrydata: industryValue
              });
            }
          }
          currentCol++;
        }
        currentCol++; // Skip CFY TTL column (column 29)

        // Process Next FY months (columns 30-41)
        for (let i = 0; i < nfyMonths.length; i++) {
          const monthYear = this.parseMonthYear(nfyMonths[i]);
          if (monthYear) {
            const industryValue = this.getCellValues(row.getCell(currentCol));

            if (industryValue !== null) {
              transformedData.push({
                StateName: stateName,
                DistrictName: districtName,
                TalukaName: talukaName,
                Month: monthYear.month,
                Year: monthYear.year,
                Industrydata: industryValue
              });
            }
          }
          currentCol++;
        }
        // currentCol++ for NFY TTL not needed as we're done processing
      });

      if (transformedData.length === 0) {
        this.apis.showAlert('warning', 'No Data', 'No data found in uploaded Excel.');
        return null;
      }

      // Sort by financial year order (Apr to Mar)
      const financialYearOrder: { [key: string]: number } = {
        'Apr': 1, 'May': 2, 'Jun': 3, 'Jul': 4, 'Aug': 5, 'Sep': 6,
        'Oct': 7, 'Nov': 8, 'Dec': 9, 'Jan': 10, 'Feb': 11, 'Mar': 12
      };

      transformedData.sort((a, b) => {
        // First compare year
        if (a.Year !== b.Year) return a.Year - b.Year;
        // Same year, compare by financial month order
        return financialYearOrder[a.Month] - financialYearOrder[b.Month];
      });

      //console.log('Transformed Data Sample:', transformedData.slice(0, 5));
      //console.log('Total Records:', transformedData.length);

      return transformedData;
    } catch (error) {
      console.error('Transform error:', error);
      this.apis.showAlert('error', 'Error', 'Failed to process Taluka Industry Excel file.');
      return null;
    }
  }

  private parseMonthYear(monthStr: string): { month: string; year: number } | null {
    try {
      // Expected format: "Apr-24", "May-24", etc.
      const parts = monthStr.split('-');
      if (parts.length !== 2) return null;

      const monthAbbr = parts[0].trim();
      const yearShort = parts[1].trim();

      // Validate month abbreviation
      const validMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      if (!validMonths.includes(monthAbbr)) return null;

      // Convert 2-digit year to 4-digit (24 -> 2024, 25 -> 2025)
      const year = parseInt(yearShort) + 2000;

      return { month: monthAbbr, year };  // Return "Apr", 2024
    } catch (error) {
      return null;
    }
  }

  // ====  GET CELL VALUE HELPER  ====

  private getCellValues(cell: ExcelJS.Cell): number | null {
    const value = cell.value;

    // Agar cell empty hai
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Agar cell mein formula hai, to result use karo
    if (value && typeof value === 'object' && 'result' in value) {
      const result = (value as any).result;
      if (result === null || result === undefined || result === '') return null;
      return Number(result) || 0;
    }

    // Agar simple number hai
    if (typeof value === 'number') {
      return value;
    }

    // Agar string hai to parse karo
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return null;
      const parsed = parseFloat(trimmed);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }


  private async transformBDRCData(): Promise<any[] | null> {
    try {
      const workbook = await this.loadWorkbook(this.selectedFile!);
      const worksheet = workbook.getWorksheet('BDRC Entry');
      if (!worksheet) {
        this.apis.showAlert('error', 'Error', 'Invalid BDRC Excel format. Sheet "BDRC Entry" not found.');
        return null;
      }
      const transformedData: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        // Skip rows: 1 (month), 2 (plan sections), 3 (TOTAL), 4 (headers)
        if (rowNumber < 5) return;
        const dealerCode = row.getCell(4).value;
        if (!dealerCode) return;
        // Skip if dealer name is "Total"
        const dealerName = row.getCell(2).value;
        if (dealerName && String(dealerName).toLowerCase().trim() === 'total') return;
        transformedData.push({
          StateName: row.getCell(1).value || '',
          DealerCode: dealerCode || '',
          DealerName: dealerName || '',
          Status: row.getCell(5).value || '', // NEW: Status column
          BillPlan_W1: this.getCellValue(row.getCell(6)),   // Shifted from 5
          BillPlan_W2: this.getCellValue(row.getCell(7)),   // Shifted from 6
          BillPlan_W3: this.getCellValue(row.getCell(8)),   // Shifted from 7
          BillPlan_W4: this.getCellValue(row.getCell(9)),   // Shifted from 8
          BillPlan_W5: this.getCellValue(row.getCell(10)),  // Shifted from 9
          DelPlan_W1: this.getCellValue(row.getCell(12)),   // Shifted from 11
          DelPlan_W2: this.getCellValue(row.getCell(13)),   // Shifted from 12
          DelPlan_W3: this.getCellValue(row.getCell(14)),   // Shifted from 13
          DelPlan_W4: this.getCellValue(row.getCell(15)),   // Shifted from 14
          DelPlan_W5: this.getCellValue(row.getCell(16)),   // Shifted from 15
          RetPlan_W1: this.getCellValue(row.getCell(18)),   // Shifted from 17
          RetPlan_W2: this.getCellValue(row.getCell(19)),   // Shifted from 18
          RetPlan_W3: this.getCellValue(row.getCell(20)),   // Shifted from 19
          RetPlan_W4: this.getCellValue(row.getCell(21)),   // Shifted from 20
          RetPlan_W5: this.getCellValue(row.getCell(22)),   // Shifted from 21
          CollPlan_W1: this.getCellValue(row.getCell(24)),  // Shifted from 23
          CollPlan_W2: this.getCellValue(row.getCell(25)),  // Shifted from 24
          CollPlan_W3: this.getCellValue(row.getCell(26)),  // Shifted from 25
          CollPlan_W4: this.getCellValue(row.getCell(27)),  // Shifted from 26
          CollPlan_W5: this.getCellValue(row.getCell(28)),  // Shifted from 27
          BGPlan_W1: this.getCellValue(row.getCell(30)),    // Shifted from 29
          BGPlan_W2: this.getCellValue(row.getCell(31)),    // Shifted from 30
          BGPlan_W3: this.getCellValue(row.getCell(32)),    // Shifted from 31
          BGPlan_W4: this.getCellValue(row.getCell(33)),    // Shifted from 32
          BGPlan_W5: this.getCellValue(row.getCell(34))     // Shifted from 33
        });
      });
      if (transformedData.length === 0) {
        this.apis.showAlert('warning', 'No Data', 'No data found in uploaded Excel.');
        return null;
      }
      return transformedData;
    } catch (error) {
      this.apis.showAlert('error', 'Error!', 'Failed to process BDRC Excel file.');
      return null;
    }
  }

  private async transformForecastData(): Promise<any[] | null> {
    try {
      const workbook = await this.loadWorkbook(this.selectedFile!);
      const worksheet = workbook.getWorksheet('Forecast');
      if (!worksheet) {
        this.apis.showAlert('error', 'Error', 'Invalid Forecast Excel format. Sheet "Forecast" not found.');
        return null;
      }
      const transformedData: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        // Skip rows: 1 (headers), 2 (plan sections), 3 (TOTAL), 4 (column headers)
        if (rowNumber < 5) return;
        const partCode = row.getCell(3).value;
        if (!partCode) return;
        // Skip if model name is "Total"
        const modelName = row.getCell(2).value;
        if (modelName && String(modelName).toLowerCase().trim() === 'total') return;
        transformedData.push({
          State: row.getCell(1).value || '',
          'Part Code': partCode || '',
          Model: row.getCell(2).value || '',
          HP: row.getCell(4).value || '',
          FR: row.getCell(5).value || '',
          RR: row.getCell(6).value || '',
          Status: row.getCell(7).value || '',
          W1_BillingPlan: this.getCellValue(row.getCell(8)),
          W2_BillingPlan: this.getCellValue(row.getCell(9)),
          W3_BillingPlan: this.getCellValue(row.getCell(10)),
          W4_BillingPlan: this.getCellValue(row.getCell(11)),
          W5_BillingPlan: this.getCellValue(row.getCell(12)),
          Total_BillingPlan: this.getCellValue(row.getCell(13))
        });
      });
      if (transformedData.length === 0) {
        this.apis.showAlert('warning', 'No Data', 'No data found in uploaded Excel.');
        return null;
      }
      return transformedData;
    } catch (error) {
      this.apis.showAlert('error', 'Error', 'Failed to process Forecast Excel file.');
      return null;
    }
  }

  private async transformIndustryData(): Promise<any[] | null> {
    try {
      const workbook = await this.loadWorkbook(this.selectedFile!);
      const worksheet = workbook.getWorksheet('Industry');
      if (!worksheet) {
        this.apis.showAlert('error', 'Error', 'Invalid Industry Excel format. Sheet "Industry" not found.');
        return null;
      }

      const headerRow = worksheet.getRow(2);
      const brandNames: string[] = [];
      const totalColumns = worksheet.columnCount;

      for (let col = 3; col < totalColumns; col++) {
        const brandName = headerRow.getCell(col).value;
        if (brandName && typeof brandName === 'string' && brandName.toUpperCase() !== 'TOTAL') {
          brandNames.push(brandName);
        }
      }

      const transformedData: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < 3) return;
        const stateName = row.getCell(1).value;
        const hpCategory = row.getCell(2).value;

        if (!stateName || !hpCategory || String(hpCategory).toUpperCase() === 'TOTAL' || String(stateName).trim() === 'Total') return;

        brandNames.forEach((brandName, index) => {
          const colIndex = 3 + index;
          const cell = row.getCell(colIndex);
          let cellValue = cell.value;

          if (cellValue && typeof cellValue === 'object' && 'result' in cellValue) {
            cellValue = cellValue.result;
          }

          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            const vehicleSold = Number(cellValue) || 0;
            //if (vehicleSold > 0) {
            if (vehicleSold !== null && vehicleSold !== undefined && vehicleSold !== 0) {
              transformedData.push({
                StateName: String(stateName),
                HP_Category: String(hpCategory),
                BrandName: brandName,
                VehicleSold: vehicleSold
              });
            }
          }
        });
      });

      if (transformedData.length === 0) {
        this.apis.showAlert('warning', 'No Data', 'No valid data found in uploaded Excel.');
        return null;
      }

      return transformedData;
    } catch (error) {
      this.apis.showAlert('error', 'Error', 'Failed to process Industry Excel file.');
      return null;
    }
  }

  private async transformAccountEntryData(): Promise<any[] | null> {
    try {
      const workbook = await this.loadWorkbook(this.selectedFile!);
      const sheet = workbook.getWorksheet('Account Entry');
      if (!sheet) return null;

      const data: any[] = [];

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber < 4) return;

        const sap = row.getCell(2).value;
        if (!sap) return;

        const state = row.getCell(1).value;
        if (String(state).toLowerCase() === 'total') return;

        data.push({
          SAP: sap,
          State: state,
          Status: row.getCell(3).value,

          'Previos Month Collection': this.getCellValueDecimal(row.getCell(4)),
          'Current Month Collection': this.getCellValueDecimal(row.getCell(5)),

          'Current Month Ageing O/S 0000-0030': this.getCellValueDecimal(row.getCell(6)),
          'Current Month Ageing O/S 0031-0060': this.getCellValueDecimal(row.getCell(7)),
          'Current Month Ageing O/S 0061-0090': this.getCellValueDecimal(row.getCell(8)),
          'Current Month Ageing O/S 0091-0120': this.getCellValueDecimal(row.getCell(9)),
          'Current Month Ageing O/S 0121-0150': this.getCellValueDecimal(row.getCell(10)),
          'Current Month Ageing O/S 0151-0180': this.getCellValueDecimal(row.getCell(11)),
          'Current Month Ageing O/S Above 180': this.getCellValueDecimal(row.getCell(12)),
          'Aging TTL': this.getCellValueDecimal(row.getCell(13)),

          'TA O/S MMFSL': this.getCellValueDecimal(row.getCell(14)),
          'TA O/S LTF': this.getCellValueDecimal(row.getCell(15)),
          'TA O/S HDFC': this.getCellValueDecimal(row.getCell(16)),
          'TA O/S Other': this.getCellValueDecimal(row.getCell(17)),
          'TA O/S TTL': this.getCellValueDecimal(row.getCell(18)),

          'BG YTD': this.getCellValueDecimal(row.getCell(19)),
          'BG Current Month': this.getCellValueDecimal(row.getCell(20)),
          'Credit Note Released': this.getCellValueDecimal(row.getCell(21)),
          'Credit Note Hold': this.getCellValueDecimal(row.getCell(22)),
          'Rota Stock': this.getCellValueDecimal(row.getCell(23)),
          'Rota Os': this.getCellValueDecimal(row.getCell(24)),
        });
      });

      return data.length ? data : null;
    } catch {
      return null;
    }
  }

  // ==== EXCEL HELPER METHODS ====

  private getFinancialYearMonths(): {
    lfyMonths: string[];
    cfyMonths: string[];
    nfyMonths: string[];
    lfyLabel: string;
    cfyLabel: string;
    nfyLabel: string;
  } {
    const monthValue = Number(this.selectedMonth);
    const yearValue = Number(this.selectedYear);
    let currentFYStart: number;
    let currentFYEnd: number;

    // Financial Year: April to March
    if (monthValue >= 4) {
      currentFYStart = yearValue;
      currentFYEnd = yearValue + 1;
    } else {
      currentFYStart = yearValue - 1;
      currentFYEnd = yearValue;
    }

    const lastFYStart = currentFYStart - 1;
    const lastFYEnd = currentFYEnd - 1;
    const nextFYStart = currentFYStart + 1;
    const nextFYEnd = currentFYEnd + 1;

    const lfyLabel = `F${String(lastFYEnd).slice(-2)}`;    // F25
    const cfyLabel = `F${String(currentFYEnd).slice(-2)}`; // F26
    const nfyLabel = `F${String(nextFYEnd).slice(-2)}`;    // F27

    // Generate month labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // LFY: April (lastFYStart) to March (lastFYEnd)
    const lfyMonths: string[] = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (3 + i) % 12; // Start from April (index 3)
      const year = i < 9 ? lastFYStart : lastFYEnd;
      lfyMonths.push(`${monthNames[monthIndex]}-${String(year).slice(-2)}`);
    }

    // CFY: April (currentFYStart) to March (currentFYEnd)
    const cfyMonths: string[] = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (3 + i) % 12;
      const year = i < 9 ? currentFYStart : currentFYEnd;
      cfyMonths.push(`${monthNames[monthIndex]}-${String(year).slice(-2)}`);
    }

    // NFY: April (nextFYStart) to March (nextFYEnd)
    const nfyMonths: string[] = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (3 + i) % 12;
      const year = i < 9 ? nextFYStart : nextFYEnd;
      nfyMonths.push(`${monthNames[monthIndex]}-${String(year).slice(-2)}`);
    }

    return { lfyMonths, cfyMonths, nfyMonths, lfyLabel, cfyLabel, nfyLabel };
  }

  private async loadWorkbook(file: File): Promise<ExcelJS.Workbook> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    return workbook;
  }

  private async sendTransformedData(transformedData: any[], apiHeaders: string[], sheetName: string, fileName: string): Promise<void> {
    const apiWorkbook = new ExcelJS.Workbook();
    const apiWorksheet = apiWorkbook.addWorksheet(sheetName);

    apiWorksheet.addRow(apiHeaders);
    transformedData.forEach(data => {
      const row = apiHeaders.map(header => data[header]);
      apiWorksheet.addRow(row);
    });

    const buffer = await apiWorkbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const transformedFile = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const formData = new FormData();
    formData.append('UploadId', String(this.selectedUploadId));
    formData.append('file', transformedFile);

    this.apis.uploadExcelReport(formData).subscribe({
      next: (res: any) => this.handleUploadResponse(res),
      error: () => this.apis.showAlert('error', 'Error!', 'Something went wrong during upload.')
    });
  }

  private handleUploadResponse(res: any): void {
    if (res?.message?.toLowerCase() === 'success') {
      this.previewResponse = res.data;
      this.previewRows = res.data.preview || [];
      if (this.previewRows.length > 0) {
        this.previewColumnOrder = Object.keys(this.previewRows[0]);
      }
      this.stagingTable = res.data.stagingTable;
      this.summary = {
        total: res.data.total,
        valid: res.data.valid,
        invalid: res.data.invalid
      };
      this.isPreviewMode = true;
    } else {
      this.apis.showAlert('error', 'Error', 'Failed to generate preview.');
    }
  }

  private applyCellStyle(cell: ExcelJS.Cell, style: {
    bold?: boolean;
    locked?: boolean;
    bgColor?: string;
    border?: boolean;
    numFmt?: string;
  } = {}): void {
    if (style.bold) {
      cell.font = { name: 'Calibri', size: 11, bold: true };
    } else {
      cell.font = { name: 'Calibri', size: 11 };
    }

    cell.alignment = { horizontal: 'center', vertical: 'middle' };

    if (style.border) {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }

    if (style.locked !== undefined) {
      cell.protection = { locked: style.locked };
    }

    if (style.bgColor) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: style.bgColor }
      };
    }

    if (style.numFmt) {
      cell.numFmt = style.numFmt;
    }
  }

  private addDataValidation(worksheet: ExcelJS.Worksheet, dataRowCount: number, editableColumns: number[], hasW5?: boolean, w5Columns?: number[], startRow: number = 3): void {
    editableColumns.forEach(colIndex => {
      for (let rowIdx = startRow; rowIdx <= startRow - 1 + dataRowCount; rowIdx++) {
        if (hasW5 !== undefined && w5Columns && w5Columns.includes(colIndex) && !hasW5) {
          continue;
        }

        const cell = worksheet.getCell(rowIdx, colIndex);
        cell.dataValidation = {
          type: 'whole',
          operator: 'greaterThanOrEqual',
          formulae: [0],
          allowBlank: true,
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid Input',
          error: 'Only whole numbers (integers) are allowed!',
          showInputMessage: true,
          promptTitle: 'Enter Number',
          prompt: 'Please enter a whole number (integer) only'
        };
      }
    });
  }

  private async protectAndSaveWorkbook(workbook: ExcelJS.Workbook, fileName: string, enableColumnFormatting: boolean = false): Promise<void> {
    try {
      const worksheet = workbook.worksheets[0];
      await worksheet.protect('', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: enableColumnFormatting,
        formatRows: false,
        insertRows: false,
        insertColumns: false,
        deleteRows: false,
        deleteColumns: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Excel save error:', error);
      this.apis.showAlert('error', 'Error', 'Failed to generate Excel file.');
    }
  }

  private getCellValue(cell: any): number {
    if (!cell || cell.value === null || cell.value === undefined) return 0;
    if (typeof cell.value === 'object' && 'result' in cell.value) {
      return Number(cell.value.result) || 0;
    }
    return Number(cell.value) || 0;
  }

  getColumnLetter(colNumber: number): string {
    let letter = '';
    while (colNumber > 0) {
      const remainder = (colNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      colNumber = Math.floor((colNumber - 1) / 26);
    }
    return letter;
  }

  private addDecimalDataValidation(worksheet: ExcelJS.Worksheet, dataRowCount: number, editableColumns: number[], startRow: number = 3): void {
    editableColumns.forEach(colIndex => {
      for (let rowIdx = startRow; rowIdx <= startRow - 1 + dataRowCount; rowIdx++) {
        const cell = worksheet.getCell(rowIdx, colIndex);
        cell.dataValidation = {
          type: 'decimal',
          operator: 'greaterThanOrEqual',
          formulae: [0],
          allowBlank: true,
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid Input',
          error: 'Only decimal numbers (up to 2 decimal places) are allowed!',
          showInputMessage: true,
          promptTitle: 'Enter Decimal',
          prompt: 'Please enter a decimal number (e.g., 100.50)'
        };
      }
    });
  }

  private getDynamicMonthYearText(): { currentMonthText: string; previousMonthText: string } {
    const monthValue = Number(this.selectedMonth);
    const yearValue = Number(this.selectedYear);

    // Current month
    const currentMonthName = this.allMonths.find(m => m.value === monthValue)?.name || '';
    const currentMonthShort = currentMonthName.substring(0, 3); // Jan, Feb, etc.
    const currentYearShort = String(yearValue).slice(-2); // 26, 25, etc.
    const currentMonthText = `${currentMonthShort}'${currentYearShort}`;

    // Previous month
    let previousMonth = monthValue === 1 ? 12 : monthValue - 1;
    let previousYear = monthValue === 1 ? yearValue - 1 : yearValue;
    const previousMonthName = this.allMonths.find(m => m.value === previousMonth)?.name || '';
    const previousMonthShort = previousMonthName.substring(0, 3);
    const previousYearShort = String(previousYear).slice(-2);
    const previousMonthText = `${previousMonthShort}'${previousYearShort}`;

    return { currentMonthText, previousMonthText };
  }

  private getCellValueDecimal(cell: any): number {
    if (!cell || cell.value === null || cell.value === undefined) return 0;

    if (typeof cell.value === 'object' && 'result' in cell.value) {
      return parseFloat(Number(cell.value.result).toFixed(2)) || 0;
    }

    return parseFloat(Number(cell.value).toFixed(2)) || 0;
  }

  // ==== UTILITY METHODS ====

  private validateSubmission(): boolean {
    if (!this.selectedUploadId || !this.selectedMonth || !this.selectedYear || !this.selectedFile) {
      this.apis.showAlert('question', 'Required?', 'Upload Type, Month, Year and Excel file are all required.');
      return false;
    }
    return true;
  }

  private validateDownload(data: any[], dataType: string): boolean {
    if (!data || data.length === 0) {
      this.apis.showAlert('warning', 'No Data', `No ${dataType} data available to download.`);
      return false;
    }
    if (!this.selectedMonth || !this.selectedYear) {
      this.apis.showAlert('warning', 'Required', 'Please select Month and Year first.');
      return false;
    }
    return true;
  }

  private getMonthYearText(): string {
    const monthValue = Number(this.selectedMonth);
    const monthName = this.months.find(m => m.value === monthValue)?.name || '';
    return `${monthName} ${this.selectedYear}`;
  }

  private groupByState(data: any[]): { [key: string]: any[] } {
    const groups: { [key: string]: any[] } = {};
    data.forEach(item => {
      const state = item.StateName || item.State || '';
      if (!groups[state]) groups[state] = [];
      groups[state].push(item);
    });
    return groups;
  }

  private resetSelections(): void {
    this.selectedUploadName = '';
    this.selectedYear = null;
    this.selectedMonth = null;
    this.selectedFile = null;
    this.selectedFileName = '';
    this.downloadFileUrl = '';
    this.downloadFileName = '';
    this.selectedState = null;
    this.dealerData = [];
    this.showMonthYearDropdowns = true;
  }

  private resetFileSelection(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedState = null;
    this.dealerData = [];
    this.downloadFileUrl = '';
    this.downloadFileName = '';
    this.selectedYear = null;
    this.selectedMonth = null;
  }

  private clearAllData(): void {
    this.dealerData = [];
    this.modelData = [];
    this.industryData = [];
    this.talukaIndustryData = [];
    this.bdrcData = [];
    this.spaData = [];
  }

  private resetAfterCommit(): void {
    this.isPreviewMode = false;
    this.previewResponse = null;
    this.previewRows = [];
    this.summary = { total: 0, valid: 0, invalid: 0 };
    this.selectedUploadId = null;
    this.selectedUploadName = '';
    this.selectedMonth = null;
    this.selectedYear = null;
    this.selectedState = null;
    this.stagingTable = '';
    this.clearAllData();
    this.selectedFile = null;
    this.selectedFileName = '';
    this.downloadFileUrl = '';
    this.downloadFileName = '';

    const fileInput = document.getElementById('excelFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  formatDate(value: any): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return value;
    return `${String(parsed.getDate()).padStart(2, '0')}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${parsed.getFullYear()}`;
  }

  isDateColumn(key: any): boolean {
    return String(key).toLowerCase().includes('date') || String(key).toLowerCase().includes('uploadedon');
  }

  hasWeek5(month: number, year: number): boolean {
    const lastDay = new Date(year, month, 0).getDate();
    return lastDay > 28;
  }

  private setDynamicMonthsAndYears(): void {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (currentMonth === 1) {
      this.years = [currentYear, currentYear - 1];
    } else {
      this.years = [currentYear];
    }

    const currentMonthObj = this.allMonths.find(m => m.value === currentMonth)!;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousMonthObj = this.allMonths.find(m => m.value === previousMonth)!;

    this.availableMonths = [previousMonthObj, currentMonthObj];
  }
  // dinesh
  onMonthChange(): void {
    if (!this.selectedMonth) return;
    // Industry ke liye year manually select karna hai, auto-set mat karo
    if (this.selectedUploadId === 5) return;

    const selectedMonth = Number(this.selectedMonth);
    const today = new Date();

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    let resolvedYear = currentYear;

    // ================= BDRC =================
    if (this.selectedUploadId === 3) {
      if (currentMonth === 1 && selectedMonth === 12) {
        resolvedYear = currentYear - 1;
      } else {
        resolvedYear = currentYear;
      }

      this.selectedYear = resolvedYear;
      this.years = [resolvedYear];
      return;
    }

    // ================= OTHER REPORTS =================
    if (currentMonth === 1 && selectedMonth === 12) {
      resolvedYear = currentYear - 1;
    } else {
      resolvedYear = currentYear;
    }

    this.selectedYear = resolvedYear;
    this.years = [resolvedYear];

    if (this.selectedMonth && this.selectedYear && this.selectedUploadId === 10) {
      this.downloadFileName = 'outlook';
      this.getOutlookReportFormatData();
    }
  }

  loadMakes(): void {
    //this.http.get<MakeModel[]>('/api/master/makes').subscribe({
    //  next: (data) => (this.makeList = data),
    //  error: (err) => console.error('Error loading makes:', err)
    //});
  }

  getHpListFromRange(range: string): number[] {
    if (range.includes('+')) {
      const start = parseInt(range);
      return Array.from({ length: 100 - start + 1 }, (_, i) => start + i);
      // yaha 100 max liya hai, tum change kar sakte ho
    }

    const [min, max] = range.split('-').map(Number);

    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  onHpRangeSelect(range: string) {

    this.filteredHpList = this.getHpListFromRange(range);
    this.selectedHp = this.filteredHpList[0];
    this.onHpChange();
  }

  private bucketHpIntoRanges(hps: number[]): void {
    this.hpRangeMap['0-20'] = hps.filter(h => h >= 0 && h <= 20);
    this.hpRangeMap['21-23'] = hps.filter(h => h >= 21 && h <= 23);
    this.hpRangeMap['24-26'] = hps.filter(h => h >= 24 && h <= 26);
    this.hpRangeMap['27-30'] = hps.filter(h => h >= 27 && h <= 30);
    this.hpRangeMap['31-33'] = hps.filter(h => h >= 31 && h <= 33);
    this.hpRangeMap['34-36'] = hps.filter(h => h >= 34 && h <= 36);
    this.hpRangeMap['37-38'] = hps.filter(h => h >= 37 && h <= 38);
    this.hpRangeMap['39-40'] = hps.filter(h => h >= 39 && h <= 40);
    this.hpRangeMap['41-43'] = hps.filter(h => h >= 41 && h <= 43);
    this.hpRangeMap['44-45'] = hps.filter(h => h >= 44 && h <= 45);
    this.hpRangeMap['46-47'] = hps.filter(h => h >= 46 && h <= 47);
    this.hpRangeMap['48-50'] = hps.filter(h => h >= 48 && h <= 50);
    this.hpRangeMap['50+'] = hps.filter(h => h >= 50);
  }

  onHpChange(): void {
    //console.log('HP selected:', this.selectedHp);
    if (this.selectedHp <= 40) {
      this.dlrMargin = 25000
    }
    else if (this.selectedHp > 40)
      this.dlrMargin = 35000
  }

  onMakeChange(): void {
    /*console.log('Make selected:', this.selectedMake);*/
  }
  calculateMop() {
    //this.mop =
    //  (this.ndp || 0) +
    //  (this.freight || 0) +
    //  (this.accessories || 0) -
    //  (this.dlrMargin || 0);
    this.ndp =
      (this.mop || 0) -
      (
        (this.freight || 0) +
        (this.accessories || 0) +
        (this.dlrMargin || 0)
      );
  }
  calculateNetMop() {
    //this.mop =
    //  (this.ndp || 0) +
    //  (this.freight || 0) +
    //  (this.accessories || 0) -
    //  (this.dlrMargin || 0);
    this.mop =
      (this.offrPrice || 0) -
      (
        (this.rtoInsurance || 0) +
        (this.implementPrice || 0));
    this.calculateMop();

  }

  @ViewChild('mopProofInput') mopProofInput!: ElementRef<HTMLInputElement>;

  onMopProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (this.isValidFileType(file)) {
        this.mopProofFile = file;
        this.mopProofFileName = file.name;
      } else {
        alert('Only PDF, JPG, JPEG, PNG files are allowed.');
        input.value = '';
      }
    }
  }


  removeMopProof(event: Event): void {
    event.stopPropagation();

    this.mopProofFile = null;
    this.mopProofFileName = '';

    // 🔥 IMPORTANT: input reset
    if (this.mopProofInput) {
      this.mopProofInput.nativeElement.value = '';
    }
  }

  @ViewChild('rcCopyInput') rcCopyInput!: ElementRef<HTMLInputElement>;

  onRcCopySelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (this.isValidFileType(file)) {
        this.rcCopyFile = file;
        this.rcCopyFileName = file.name;
      } else {
        alert('Only PDF, JPG, JPEG, PNG files are allowed.');
        input.value = ''; // reset if invalid
      }
    }
  }

  removeRcCopy(event: Event): void {
    event.stopPropagation();

    this.rcCopyFile = null;
    this.rcCopyFileName = '';

    // 🔥 IMPORTANT: reset input
    if (this.rcCopyInput) {
      this.rcCopyInput.nativeElement.value = '';
    }
  }

  private isValidFileType(file: File): boolean {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    return allowed.includes(file.type);
  }

  isFormValid(): boolean {

    return !!(
      this.selectedState &&
      this.selectedState !== 'All' &&
      this.selectedHpRange &&
      this.selectedHp &&
      this.selectedMake &&
      this.modelName?.trim() &&
      this.avgVolPerMonth &&
      this.ndp &&
      this.freight &&
      this.accessories &&
      this.dlrMargin &&
      this.mop &&
      this.mopProofFile
      && this.mopDate
      && this.selectedDrive

      // MOP proof is required (attachment option)
      // rcCopyFile is optional
    );
  }

  allowNumbersOnly(event: KeyboardEvent): boolean {
    const charCode = event.charCode;
    return charCode >= 48 && charCode <= 57;
  }

  submitPricePosition() {

    const formData = new FormData();

    formData.append('stateName', this.selectedState || '');
    formData.append('hpRange', this.selectedHpRange || '');
    formData.append('hp', String(this.selectedHp || 0));
    formData.append('make', this.selectedMake || '');
    formData.append('bom', this.modelName || '');
    formData.append('avgVolPerMonth', String(parseInt(String(this.avgVolPerMonth), 10) || 0));
    formData.append('variantCode', this.variantCode || '');
    formData.append('ndp', String(parseFloat(String(this.ndp)) || ''));
    formData.append('freight', String(parseFloat(String(this.freight)) || ''));
    formData.append('accessories', String(parseFloat(String(this.accessories)) || ''));
    formData.append('dlrMargin', String(parseFloat(String(this.dlrMargin)) || ''));
    formData.append('mop', String(parseFloat(String(this.mop)) || ''));
    formData.append('accessoryName', this.selectedAccessoryDisplay);
    formData.append('mopDate', String(this.mopDate));

    formData.append('driveType', this.selectedDrive || '');
    formData.append('implementPrice', String(parseFloat(String(this.implementPrice)) || ''));
    formData.append('rtoInsurance', String(parseFloat(String(this.rtoInsurance)) || ''));
    formData.append('offerPrice', String(parseFloat(String(this.offrPrice)) || ''));


    if (this.mopProofFile) {
      formData.append('mopProof', this.mopProofFile);
    }

    if (this.rcCopyFile) {
      formData.append('rcCopy', this.rcCopyFile);
    }

    this.apis.insertPricePosition(formData).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success', 'Inserted successfully.');
          this.resetForm();
        } else {
          this.apis.showAlert('error', 'Error', res?.message || 'Insert failed.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Something went wrong.');
      }
    });

  }

  resetForm() {
    // Dropdowns & text fields
    this.selectedState = '';
    this.selectedHpRange = '';
    this.selectedHp = 0;
    this.selectedMake = '';
    this.modelName = '';
    this.selectedState = 'All';
    this.avgVolPerMonth = 0;
    this.variantCode = '';

    this.ndp = 0;
    this.offrPrice = 0;
    this.freight = 8000;
    this.accessories = 0;
    this.dlrMargin = 0;
    this.mop = 0;
    this.selectedAccessoryDisplay = '';
    this.mopDate = null;
    this.selectedAccessory = [];

    // File reset
    this.mopProofFile = null;
    this.rcCopyFile = null;

    // Optional: file names reset (agar show kar rahe ho)
    this.mopProofFileName = '';
    this.rcCopyFileName = '';
    this.selectedDrive = '';
    this.implementPrice = 0;
    this.rtoInsurance = 0;

    // Optional: filtered lists reset
    this.filteredHpList = [];
  }

  onAccessoryChange(event: any) {
    const selectedName = event.target.value;

    const found = this.accessoriesList.find(x => x.name === selectedName);

    if (found) {
      this.selectedAccessory = selectedName;
      this.accessories = found.value;
      this.calculateMop();
    } else {
      this.accessories = 0;
    }
  }

  isSelected(item: any): boolean {
    return this.selectedAccessory.some(x => x.name === item.name);
  }

  // Toggle selection on click
  toggleSelection(item: any): void {
    const index = this.selectedAccessory.findIndex(x => x.name === item.name);

    if (index > -1) {
      // Already selected → remove karo
      this.selectedAccessory.splice(index, 1);
    } else {
      // Nahi tha → add karo
      this.selectedAccessory.push(item);
    }

    // Update display string
    this.selectedAccessoryDisplay = this.selectedAccessory
      .map(x => x.name)
      .join(', ');

    // Cumulative sum calculate karo
    this.accessories = this.selectedAccessory
      .reduce((sum, x) => sum + (x.value || 0), 0);

    this.calculateMop();
  }

  // Dropdown open/close toggle
  toggleDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();  // document click se rokta hai
    }
    this.dropdownOpen = !this.dropdownOpen;
  }
  removeAccessory(item: Accessory): void {
    const index = this.selectedAccessory.findIndex(x => x.name === item.name);
    if (index > -1) {
      this.selectedAccessory.splice(index, 1);
    }

    // Recalculate
    this.accessories = this.selectedAccessory
      .reduce((sum: number, x: Accessory) => sum + (Number(x.value) || 0), 0);

    this.calculateMop();
  }
  @HostListener('document:click')
  onDocumentClick(): void {
    this.dropdownOpen = false;  // bahar click karne pe band
  }

  columnIndexToLetter(colIndex: number): string {
    let letter = '';
    while (colIndex > 0) {
      const rem = (colIndex - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      colIndex = Math.floor((colIndex - 1) / 26);
    }
    return letter;
  }

  async getOutlookReportFormatData(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.apis.getOutlookFormatData(this.selectedMonth ?? (new Date().getMonth() + 1), this.selectedYear ?? new Date().getFullYear())
      );
      1
      if (
        res?.message?.toLowerCase() === 'success' &&
        Array.isArray(res.data)
      ) {
        this.outlookFormatData = res.data;


        if (res.data.length === 0) {
          this.apis.showAlert('info', 'No Data', 'No Outlook Report data found.');
        }
      } else {
        this.outlookFormatData = [];
        this.apis.showAlert('error', 'Error', 'Failed to fetch Outlook Report data.');
      }
    } catch (err) {
      //console.error(err);
      this.outlookFormatData = [];
      this.apis.showAlert('error', 'Error', 'Outlook Report data fetch failed.');
    }
  }

  async downlaodOutLookFormat(): Promise<void> {

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('outLookFormat');

    const now = new Date();
    const monthNumber = this.selectedMonth ?? (now.getMonth() + 1);
    const yearNumber = this.selectedYear ?? now.getFullYear();
    const date = new Date(yearNumber, monthNumber - 1, 1);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = yearNumber.toString().slice(-2);
    const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();
    const show29 = daysInMonth >= 29;
    const show30 = daysInMonth >= 30;
    const show31 = daysInMonth >= 31;

    const lockedFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
    const editableFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
    const formulaFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
    const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

    const font = (): Partial<ExcelJS.Font> => ({ bold: true, size: 10, name: 'Century Gothic' });
    const alignment = (wrap = false): Partial<ExcelJS.Alignment> => ({ horizontal: 'center', vertical: 'middle', wrapText: wrap });
    const border: Partial<ExcelJS.Borders> = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    const letterToColIndex = (col: string): number => {
      let index = 0;
      for (let i = 0; i < col.length; i++) index = index * 26 + col.charCodeAt(i) - 64;
      return index;
    };

    const setCell = (addr: string, value: ExcelJS.CellValue, wrap = false, fill: ExcelJS.Fill = lockedFill) => {
      const cell = ws.getCell(addr);
      cell.value = value; cell.font = font(); cell.alignment = alignment(wrap);
      cell.border = border; cell.fill = fill; cell.protection = { locked: true };
    };

    const setDataCell = (rowNum: number, col: number, value: ExcelJS.CellValue, fill: ExcelJS.Fill, locked: boolean = true, numFmt?: string, align: 'left' | 'center' = 'center') => {
      const cell = ws.getCell(rowNum, col);
      cell.value = value;
      cell.font = { size: 10, name: 'Century Gothic' };
      cell.alignment = { horizontal: align, vertical: 'middle' };
      cell.border = border;
      cell.fill = fill;
      cell.protection = { locked };
      if (numFmt) cell.numFmt = numFmt;
    };

    // No max restriction, integer format
    //const setEditableIntCell = (rowNum: number, col: number) => {
    //  const cell = ws.getCell(rowNum, col);
    //  cell.value = null; cell.font = { size: 10, name: 'Century Gothic' };
    //  cell.alignment = { horizontal: 'center', vertical: 'middle' };
    //  cell.border = border; cell.fill = editableFill; cell.protection = { locked: false };
    //  cell.numFmt = '0';
    //  cell.dataValidation = {
    //    type: 'decimal',
    //    operator: 'greaterThanOrEqual',
    //    formulae: [0],
    //    allowBlank: true, showErrorMessage: true, errorStyle: 'stop',
    //    errorTitle: 'Invalid Input', error: 'Only numbers are allowed.',
    //    promptTitle: 'Input', prompt: 'Enter a number',
    //  };
    //};


    const setEditableIntCell = (rowNum: number, col: number, value: ExcelJS.CellValue | undefined | null = null) => {
      const cell = ws.getCell(rowNum, col);
      cell.value = (value === undefined || value === null || value === '') ? null : value;
      cell.font = { size: 10, name: 'Century Gothic' };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border; cell.fill = editableFill; cell.protection = { locked: false };
      cell.numFmt = '0';
      cell.dataValidation = {
        type: 'decimal',
        operator: 'greaterThanOrEqual',
        formulae: [0],
        allowBlank: true, showErrorMessage: true, errorStyle: 'stop',
        errorTitle: 'Invalid Input', error: 'Only numbers are allowed.',
        promptTitle: 'Input', prompt: 'Enter a number',
      };
    };

    // Decimal editable (for collection fields)
    //const setEditableDecimalCell = (rowNum: number, col: number) => {
    //  const cell = ws.getCell(rowNum, col);
    //  cell.value = null; cell.font = { size: 10, name: 'Century Gothic' };
    //  cell.alignment = { horizontal: 'center', vertical: 'middle' };
    //  cell.border = border; cell.fill = editableFill; cell.protection = { locked: false };
    //  cell.numFmt = '0.00';
    //  cell.dataValidation = {
    //    type: 'decimal',
    //    operator: 'greaterThanOrEqual',
    //    formulae: [0],
    //    allowBlank: true, showErrorMessage: true, errorStyle: 'stop',
    //    errorTitle: 'Invalid Input', error: 'Only decimal numbers are allowed.',
    //    promptTitle: 'Input', prompt: 'Enter a decimal number',
    //  };
    //};


    const setEditableDecimalCell = (rowNum: number, col: number, value: ExcelJS.CellValue | undefined | null = null) => {
      const cell = ws.getCell(rowNum, col);
      cell.value = (value === undefined || value === null || value === '') ? null : value;
      cell.font = { size: 10, name: 'Century Gothic' };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border; cell.fill = editableFill; cell.protection = { locked: false };
      cell.numFmt = '0.00';
      cell.dataValidation = {
        type: 'decimal',
        operator: 'greaterThanOrEqual',
        formulae: [0],
        allowBlank: true, showErrorMessage: true, errorStyle: 'stop',
        errorTitle: 'Invalid Input', error: 'Only decimal numbers are allowed.',
        promptTitle: 'Input', prompt: 'Enter a decimal number',
      };
    };

    const setFormulaCell = (rowNum: number, col: number, formula: string, numFmt: string = '0') => {
      const cell = ws.getCell(rowNum, col);
      cell.value = { formula }; cell.font = { size: 10, name: 'Century Gothic' };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border; cell.fill = formulaFill; cell.protection = { locked: true };
      cell.numFmt = numFmt;
    };

    // Non-editable static/locked cell with a fixed formula (not user-editable, fill = lockedFill look)
    const setLockedFormulaCell = (rowNum: number, col: number, formula: string, numFmt: string = '0') => {
      const cell = ws.getCell(rowNum, col);
      cell.value = { formula }; cell.font = { size: 10, name: 'Century Gothic' };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border; cell.fill = lockedFill; cell.protection = { locked: true };
      cell.numFmt = numFmt;
    };

    // ───────────────────────────────────────────────────────────────────────
    // NEW COLUMN MAP (after inserting 4 new columns):
    //  8  H  Op Stk trs
    //  9  I  Opn Adv-Tr
    //  10 J  Os Amt (L)
    //  11 K  90+ Os (L)      <-- NEW (opening section)
    //  12 L  TA Os (L)       <-- NEW (opening section)
    //  13 M  BG (L) - opening
    //  14-19 N-S  Plan: B,D,R,C(L),Coll(Tr),BG
    //  20-23 T-W  MTD: B,D,C(L),BG
    //  24 X  Os (L)          <-- NEW (MTD section, after BG)
    //  25-30 Y-AD  Outlook: B,D,R,Coll(L),Coll(Tr),BG
    //  31 AE  CL o/s 90+     <-- NEW (Outlook section, after BG)
    //  32-39 AF-AM  Coll breakup (28th)
    //  40-47 AN-AU  Coll breakup (29th)
    //  48-55 AV-BC  Coll breakup (30th)
    //  56-63 BD-BK  Coll breakup (31st)
    //  64 BL  Total Month
    //  65 BM  RTGS Total
    //  66 BN  Own Fund Total
    //  67 BO  TA Total
    //  68 BP  DO (Amount)
    //  69 BQ  G Total
    // ───────────────────────────────────────────────────────────────────────

    if (!show29) for (let c = 40; c <= 47; c++) ws.getColumn(c).hidden = true;
    if (!show30) for (let c = 48; c <= 55; c++) ws.getColumn(c).hidden = true;
    if (!show31) for (let c = 56; c <= 63; c++) ws.getColumn(c).hidden = true;

    for (let r = 1; r <= 3; r++) {
      for (let c = letterToColIndex('A'); c <= letterToColIndex('W'); c++) { ws.getCell(r, c).fill = lockedFill; ws.getCell(r, c).protection = { locked: true }; }
      for (let c = letterToColIndex('X'); c <= letterToColIndex('BK'); c++) { ws.getCell(r, c).fill = editableFill; ws.getCell(r, c).protection = { locked: true }; }
      for (let c = letterToColIndex('BL'); c <= letterToColIndex('BQ'); c++) { ws.getCell(r, c).fill = formulaFill; ws.getCell(r, c).protection = { locked: true }; }
    }

    const collHeader = 'Collection Break up Day Wise -Source Wise ';
    ws.mergeCells('AF1:AM1'); setCell('AF1', collHeader, false, editableFill);
    if (show29) { ws.mergeCells('AN1:AU1'); setCell('AN1', collHeader, false, editableFill); }
    if (show30) { ws.mergeCells('AV1:BC1'); setCell('AV1', collHeader, false, editableFill); }
    if (show31) { ws.mergeCells('BD1:BK1'); setCell('BD1', collHeader, false, editableFill); }

    const endCols: Array<[string, string, boolean]> = [
      ['BL1', 'Total Month', true], ['BM1', 'RTGS Total', true], ['BN1', 'Own Fund Total', true],
      ['BO1', 'TA Total', true], ['BP1', 'DO\n(Amount)', true], ['BQ1', 'G Total', true],
    ];
    endCols.forEach(([addr, val, wrap]) => { ws.mergeCells(`${addr}:${addr.replace('1', '3')}`); setCell(addr, val, wrap, formulaFill); });
    const staticCols: Array<[string, string]> = [
      ['A1', 'State'], ['B1', 'Dealer Location'], ['C1', 'Dealer Code'], ['D1', 'TM '], ['E1', 'Dealer Name'], ['F1', 'Status'],
    ];
    staticCols.forEach(([addr, val]) => {
      ws.mergeCells(`${addr}:${addr.replace('1', '3')}`);
      setCell(addr, val, true, lockedFill);
      ws.getCell(addr).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    });
    setCell('G1', 'Bill', false, lockedFill);
    ws.mergeCells('G1', 'G2');

    const dynSections: Array<[string, string, string, ExcelJS.Fill]> = [
      ['H1', 'M2', `${month}'${year} opening`, lockedFill],
      ['N1', 'S2', `${month}'${year} Plan`, lockedFill],
      ['T1', 'X2', `${month}'${year} - MTD`, lockedFill],
      ['Y1', 'AE2', `${month}'${year} - Outlook`, editableFill],
    ];
    dynSections.forEach(([start, end, val, fill]) => { ws.mergeCells(`${start}:${end}`); setCell(start, val, true, fill); });

    ws.mergeCells('AF2:AM2'); setCell('AF2', 'Outlook submission day to 28th', false, editableFill);
    if (show29) { ws.mergeCells('AN2:AU2'); setCell('AN2', '29th', false, editableFill); }
    if (show30) { ws.mergeCells('AV2:BC2'); setCell('AV2', '30th', false, editableFill); }
    if (show31) { ws.mergeCells('BD2:BK2'); setCell('BD2', '31st', false, editableFill); }

    setCell('G3', 'Div Factor ', true, lockedFill);

    const openingSub: Array<[string, string]> = [
      ['H3', 'Op\nStk trs'], ['I3', 'Opn \nAdv -Tr'], ['J3', ' Os   Amt (In lakh)'],
      ['K3', '90+ Os (L)'], ['L3', 'TA Os (L)'], ['M3', 'BG (L)'],
    ];
    openingSub.forEach(([addr, val]) => setCell(addr, val, true, lockedFill));

    const planSub: Array<[string, string]> = [['N3', 'B'], ['O3', 'D'], ['P3', 'R'], ['Q3', 'C (L)'], ['R3', ' Coll (Tr)'], ['S3', 'BG (L)']];
    planSub.forEach(([addr, val]) => setCell(addr, val, true, lockedFill));

    const mtdSub: Array<[string, string]> = [['T3', 'B'], ['U3', 'D'], ['V3', 'C (L)'], ['W3', 'BG'], ['X3', 'Os (L)']];
    mtdSub.forEach(([addr, val]) => setCell(addr, val, true, lockedFill));

    const outlookSub: Array<[string, string]> = [
      ['Y3', 'B'], ['Z3', 'D'], ['AA3', 'R'], ['AB3', ' Coll (L)'], ['AC3', ' Coll (Tr)'], ['AD3', 'BG'], ['AE3', 'CL o/s 90+'],
    ];
    outlookSub.forEach(([addr, val]) => setCell(addr, val, true, lockedFill));

    const collSubHeaders = ['RTGS', 'Own fund', 'DO', 'TA (MFSL)', 'TA (HDFC)', 'TA (LTF)', 'TA (ICICI)', 'Total'];
    const activeSectionStartCols = [32];
    if (show29) activeSectionStartCols.push(40);
    if (show30) activeSectionStartCols.push(48);
    if (show31) activeSectionStartCols.push(56);
    activeSectionStartCols.forEach((startCol) => {
      collSubHeaders.forEach((header, i) => setCell(`${this.columnIndexToLetter(startCol + i)}3`, header, false, editableFill));
    });

    // ── TOTAL ROW at row 4 (right after headers) ─────────────────────────────
    const totalRowNum = 4;
    const dataStartRow = 5;
    const dataEndRow = dataStartRow + this.outlookFormatData.length - 1;

    ws.getRow(totalRowNum).height = 15;

    const setTotalCell = (col: number, value: ExcelJS.CellValue, numFmt?: string) => {
      const cell = ws.getCell(totalRowNum, col);
      cell.value = value; cell.font = { bold: true, size: 10, name: 'Century Gothic' };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border; cell.fill = totalFill; cell.protection = { locked: true };
      if (numFmt) cell.numFmt = numFmt;
    };

    setTotalCell(1, 'Total');
    for (let c = 2; c <= 7; c++) setTotalCell(c, '');

    // H-J (8-10): Op Stk trs, Opn Adv-Tr, Os Amt(L)
    for (let c = 8; c <= 10; c++) setTotalCell(c, { formula: `SUM(${this.columnIndexToLetter(c)}${dataStartRow}:${this.columnIndexToLetter(c)}${dataEndRow})` }, '0.00');

    // K-L (11-12): NEW 90+ Os (L), TA Os (L)
    for (let c = 11; c <= 12; c++) setTotalCell(c, { formula: `SUM(${this.columnIndexToLetter(c)}${dataStartRow}:${this.columnIndexToLetter(c)}${dataEndRow})` }, '0.00');

    // M (13): BG (L) opening
    setTotalCell(13, { formula: `SUM(${this.columnIndexToLetter(13)}${dataStartRow}:${this.columnIndexToLetter(13)}${dataEndRow})` }, '0');

    // N-S (14-19): Plan section
    for (let c = 14; c <= 19; c++) {
      setTotalCell(c, { formula: `SUM(${this.columnIndexToLetter(c)}${dataStartRow}:${this.columnIndexToLetter(c)}${dataEndRow})` }, '0');
    }

    // T-W (20-23): MTD section
    for (let c = 20; c <= 23; c++) setTotalCell(c, { formula: `SUM(${this.columnIndexToLetter(c)}${dataStartRow}:${this.columnIndexToLetter(c)}${dataEndRow})` }, '0');

    // X (24): NEW MTD Os (L)
    setTotalCell(24, { formula: `SUM(${this.columnIndexToLetter(24)}${dataStartRow}:${this.columnIndexToLetter(24)}${dataEndRow})` }, '0.00');

    // Y-AD (25-30): Outlook section
    for (let c = 25; c <= 30; c++) {
      setTotalCell(c, { formula: `SUM(${this.columnIndexToLetter(c)}${dataStartRow}:${this.columnIndexToLetter(c)}${dataEndRow})` }, '0');
    }

    // AE (31): NEW CL o/s 90+
    setTotalCell(31, { formula: `SUM(${this.columnIndexToLetter(31)}${dataStartRow}:${this.columnIndexToLetter(31)}${dataEndRow})` }, '0');

    const allDayCols: number[] = [];
    for (let c = 32; c <= 39; c++) allDayCols.push(c);
    if (show29) for (let c = 40; c <= 47; c++) allDayCols.push(c);
    if (show30) for (let c = 48; c <= 55; c++) allDayCols.push(c);
    if (show31) for (let c = 56; c <= 63; c++) allDayCols.push(c);
    allDayCols.forEach(c => setTotalCell(c, { formula: `SUM(${this.columnIndexToLetter(c)}${dataStartRow}:${this.columnIndexToLetter(c)}${dataEndRow})` }, '0.00'));

    for (let c = 64; c <= 69; c++) setTotalCell(c, { formula: `SUM(${this.columnIndexToLetter(c)}${dataStartRow}:${this.columnIndexToLetter(c)}${dataEndRow})` }, '0.00');

    // Static map: column index -> backend field name (defined once, outside the row loop)
    const editableColumnFieldMap: Record<number, string> = {
      25: 'outlook_b',
      26: 'outlook_d',
      27: 'outlook_r',
      28: 'outlook_collL',
      // 29 (AC, Coll Tr) is a formula cell — not in this map
      30: 'outlook_bg',

      // Coll28 block (32-38 editable, 39 = Total formula)
      32: 'coll28_rtgs',
      33: 'coll28_ownFund',
      34: 'coll28_do',
      35: 'coll28_taMfsl',
      36: 'coll28_taHdfc',
      37: 'coll28_taLtf',
      38: 'coll28_taIcici',

      // Coll29 block (40-46 editable, 47 = Total formula)
      40: 'coll29_rtgs',
      41: 'coll29_ownFund',
      42: 'coll29_do',
      43: 'coll29_taMfsl',
      44: 'coll29_taHdfc',
      45: 'coll29_taLtf',
      46: 'coll29_taIcici',

      // Coll30 block (48-54 editable, 55 = Total formula)
      48: 'coll30_rtgs',
      49: 'coll30_ownFund',
      50: 'coll30_do',
      51: 'coll30_taMfsl',
      52: 'coll30_taHdfc',
      53: 'coll30_taLtf',
      54: 'coll30_taIcici',

      // Coll31 block (56-62 editable, 63 = Total formula)
      56: 'coll31_rtgs',
      57: 'coll31_ownFund',
      58: 'coll31_do',
      59: 'coll31_taMfsl',
      60: 'coll31_taHdfc',
      61: 'coll31_taLtf',
      62: 'coll31_taIcici',
    };
    // ── Data rows from row 5 ──────────────────────────────────────────────────
    this.outlookFormatData.forEach((row: any, index: number) => {
      const rowNum = index + dataStartRow;
      ws.getRow(rowNum).height = 15;

      setDataCell(rowNum, 1, row.state ?? '', lockedFill, true, undefined, 'left');
      setDataCell(rowNum, 2, row.location ?? '', lockedFill, true, undefined, 'left');

      setDataCell(rowNum, 3, row.dealerCode ?? '', lockedFill, true, undefined, 'left');
      setDataCell(rowNum, 4, row.tm ?? '', lockedFill, true, undefined, 'left');
      setDataCell(rowNum, 5, row.dealerName ?? '', lockedFill, true, undefined, 'left');
      setDataCell(rowNum, 6, row.status ?? '', lockedFill, true, undefined, 'left');
      setDataCell(rowNum, 7, row.divFac ?? 6.70, lockedFill, true, '0.00');
      setDataCell(rowNum, 8, row.opStk ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 9, row.OpAdv ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 10, row.opeOs ?? 0, lockedFill, true, '0.00');

      // K=11 90+ Os (L) -- NEW, not editable (locked, plain data cell)
      setDataCell(rowNum, 11, row.os90Plus ?? 0, lockedFill, true, '0.00');
      // L=12 TA Os (L) -- NEW, not editable (locked, plain data cell)
      setDataCell(rowNum, 12, row.OpeningTA_OutStand ?? 0, lockedFill, true, '0.00');

      setDataCell(rowNum, 13, row.openingBg ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 14, row.BillPlan_TTL ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 15, row.DelPlan_TTL ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 16, row.RetPlan_TTL ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 17, row.CollPlan_TTL ?? 0, lockedFill, true, '0.00');
      setDataCell(rowNum, 18, row.Coll_tr ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 19, row.BgPlan ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 20, row['Net Bill'] ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 21, row['Net Del'] ?? 0, lockedFill, true, '0');
      setDataCell(rowNum, 22, row.CollActual_TTL ?? 0, lockedFill, true, '0.00');
      setDataCell(rowNum, 23, row.BGActual_TTL ?? 0, lockedFill, true, '0');

      // X=24 Os (L) -- NEW (MTD section, after BG), not editable
      setDataCell(rowNum, 24, row.ClosingTA_OutStand ?? 0, lockedFill, true, '0.00');

      // Y=25(B), Z=26(D), AA=27(R), AD=30(BG) — integer, editable, no restriction
      setEditableIntCell(rowNum, 25, row[editableColumnFieldMap[25]]);
      setEditableIntCell(rowNum, 26, row[editableColumnFieldMap[26]]);
      setEditableIntCell(rowNum, 27, row[editableColumnFieldMap[27]]);
      setEditableIntCell(rowNum, 30, row[editableColumnFieldMap[30]]);

      // AB=28 Coll (L) — decimal, editable
      //setEditableDecimalCell(rowNum, 28);
      setEditableIntCell(rowNum, 28, row[editableColumnFieldMap[28]]);


      // AC=29 Coll (Tr) — formula
      setLockedFormulaCell(rowNum, 29, `IF(OR(AB${rowNum}="",G${rowNum}="",G${rowNum}=0),0,AB${rowNum}/G${rowNum})`, '0');

      // AE=31 CL o/s 90+ — NEW, formula (placeholder 1+1), not editable
      setLockedFormulaCell(
        rowNum,
        31,
        `IF(AB${rowNum}="",${row.os60Plus},${row.os60Plus}-AB${rowNum})`,
        '0.00'
      );

      const activeRanges: Array<[number, number]> = [[32, 39]];
      if (show29) activeRanges.push([40, 47]);
      if (show30) activeRanges.push([48, 55]);
      if (show31) activeRanges.push([56, 63]);

      const totalCols = new Set([39, 47, 55, 63]);
      activeRanges.forEach(([from, to]) => {
        for (let c = from; c <= to; c++) {
          if (totalCols.has(c)) {
            const cell = ws.getCell(rowNum, c);
            cell.value = { formula: `SUM(${this.columnIndexToLetter(c - 7)}${rowNum}:${this.columnIndexToLetter(c - 1)}${rowNum})` };
            cell.font = { size: 10, name: 'Century Gothic' }; cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = border; cell.fill = editableFill; cell.protection = { locked: true }; cell.numFmt = '0.00';
          } else {

            const fieldName = editableColumnFieldMap[c];
            const val = row[fieldName];
            setEditableDecimalCell(rowNum, c, val);
          }
        }
      });

      const activeTotalCols = ['AM'];
      if (show29) activeTotalCols.push('AU');
      if (show30) activeTotalCols.push('BC');
      if (show31) activeTotalCols.push('BK');
      setFormulaCell(rowNum, 64, activeTotalCols.map(c => `${c}${rowNum}`).join('+'), '0.00');

      const rtgsCols = ['AF']; if (show29) rtgsCols.push('AN'); if (show30) rtgsCols.push('AV'); if (show31) rtgsCols.push('BD');
      setFormulaCell(rowNum, 65, rtgsCols.map(c => `${c}${rowNum}`).join('+'), '0.00');

      const ownFundCols = ['AG']; if (show29) ownFundCols.push('AO'); if (show30) ownFundCols.push('AW'); if (show31) ownFundCols.push('BE');
      setFormulaCell(rowNum, 66, ownFundCols.map(c => `${c}${rowNum}`).join('+'), '0.00');

      const taSumRanges: string[] = [`AI${rowNum}:AL${rowNum}`];
      if (show29) taSumRanges.push(`AQ${rowNum}:AT${rowNum}`);
      if (show30) taSumRanges.push(`AY${rowNum}:BB${rowNum}`);
      if (show31) taSumRanges.push(`BG${rowNum}:BJ${rowNum}`);
      setFormulaCell(rowNum, 67, `SUM(${taSumRanges.join(',')})`, '0.00');

      const doCols = ['AH']; if (show29) doCols.push('AP'); if (show30) doCols.push('AX'); if (show31) doCols.push('BF');
      setFormulaCell(rowNum, 68, doCols.map(c => `${c}${rowNum}`).join('+'), '0.00');

      setFormulaCell(rowNum, 69, `BL${rowNum}+V${rowNum}`, '0.00');
    });





    ws.views = [
      { state: 'frozen', xSplit: 2, ySplit: 4 },
    ];
    await ws.protect('', {
      selectLockedCells: true, selectUnlockedCells: true, formatCells: false,
      formatColumns: false, formatRows: false, insertRows: false, insertColumns: false,
      deleteRows: false, deleteColumns: false, sort: false, autoFilter: false,
    });

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
      const column = ws.getColumn(col);
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => { maxLength = Math.max(maxLength, (cell.text || '').length); });
      column.width = maxLength + 5;
    });
    for (let c = 8; c <= 69; c++) ws.getColumn(c).width = 8.43;

    ws.getRow(1).height = 15;
    ws.getRow(2).height = 15;
    ws.getRow(3).height = 25.5;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `outLookFormat_${month}_${year}.xlsx`);
  }

  async handleOutlookUploadExcel() {

    const COLUMN_MAP: Record<number, string> = {
      0: 'state', 1: 'dealerLocation', 2: 'dealerCode', 3: 'tmName', 4: 'dealerName', 5: 'status',
      6: 'divFactor', 7: 'opening_opStkTrs', 8: 'opening_opnAdvTr', 9: 'opening_osAmtLakh',
      10: 'opening_os90Plus', 11: 'opening_taOs', 12: 'opening_BG',
      13: 'plan_b', 14: 'plan_d', 15: 'plan_r', 16: 'plan_cL',
      17: 'plan_collTr', 18: 'plan_bgL', 19: 'mtd_b', 20: 'mtd_d', 21: 'mtd_cL',
      22: 'mtd_bgL', 23: 'mtd_osL',
      24: 'outlook_b', 25: 'outlook_d', 26: 'outlook_r', 27: 'outlook_collL',
      28: 'outlook_collTr', 29: 'outlook_bg', 30: 'outlook_clOs90Plus',
      31: 'coll28_rtgs', 32: 'coll28_ownFund',
      33: 'coll28_do', 34: 'coll28_taMfsl', 35: 'coll28_taHdfc', 36: 'coll28_taLtf',
      37: 'coll28_taIcici', 38: 'coll28_total', 39: 'coll29_rtgs', 40: 'coll29_ownFund',
      41: 'coll29_do', 42: 'coll29_taMfsl', 43: 'coll29_taHdfc', 44: 'coll29_taLtf',
      45: 'coll29_taIcici', 46: 'coll29_total', 47: 'coll30_rtgs', 48: 'coll30_ownFund',
      49: 'coll30_do', 50: 'coll30_taMfsl', 51: 'coll30_taHdfc', 52: 'coll30_taLtf',
      53: 'coll30_taIcici', 54: 'coll30_total', 55: 'coll31_rtgs', 56: 'coll31_ownFund',
      57: 'coll31_do', 58: 'coll31_taMfsl', 59: 'coll31_taHdfc', 60: 'coll31_taLtf',
      61: 'coll31_taIcici', 62: 'coll31_total', 63: 'totalMonth', 64: 'rtgsFundTotal',
      65: 'ownFundTotal', 66: 'taTotal', 67: 'doAmount', 68: 'grandTotal'
    };

    const HEADER_ROWS = 4;
    const NUMERIC_START_COL = 6;

    if (!this.selectedFile) return;

    const now = new Date();
    const monthNumber = this.selectedMonth ?? (now.getMonth() + 1);
    const yearNumber = this.selectedYear ?? now.getFullYear();
    const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();
    const show29 = daysInMonth >= 29;
    const show30 = daysInMonth >= 30;
    const show31 = daysInMonth >= 31;

    const forcedZeroCols = new Set<number>();
    if (!show29) for (let c = 39; c <= 46; c++) forcedZeroCols.add(c);
    if (!show30) for (let c = 47; c <= 54; c++) forcedZeroCols.add(c);
    if (!show31) for (let c = 55; c <= 62; c++) forcedZeroCols.add(c);

    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this.selectedFile!);
    });

    const workbook = XLSX.read(buffer, { type: 'array', cellFormula: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });

    const records: any[] = [];

    for (let rowIdx = HEADER_ROWS; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.every((cell: any) => cell === null || cell === '')) continue;

      const firstCell = row[0];
      if (firstCell !== null && String(firstCell).trim().toLowerCase() === 'total') continue;

      const record: any = {};

      for (const [colStr, key] of Object.entries(COLUMN_MAP)) {
        const colIndex = Number(colStr);
        if (forcedZeroCols.has(colIndex)) { record[key] = 0; continue; }

        let value = row[colIndex] ?? null;
        if (typeof value === 'string' && value.trim().startsWith('=')) value = 0;
        if (value === null || value === '') value = colIndex >= NUMERIC_START_COL ? 0 : null;

        record[key] = value;
      }

      records.push(record);
    }
    const mismatchRows: string[] = [];      // grandTotal != outlook_collL
    const mtdMismatchRows: string[] = [];   // outlook_b < mtd_b ya outlook_d < mtd_d

    records.forEach((record, i) => {
      const dayWiseTotal = parseFloat(record['grandTotal']) || 0;
      const collOutlook = parseFloat(record['outlook_collL']) || 0;

      const outlookB = parseFloat(record['outlook_b']) || 0;
      const mtdB = parseFloat(record['mtd_b']) || 0;

      const outlookD = parseFloat(record['outlook_d']) || 0;
      const mtdD = parseFloat(record['mtd_d']) || 0;


      const dealerCode = record['dealerCode'];

      // Condition 1: grandTotal and outlook_collL should be equal
      if (dayWiseTotal !== collOutlook) {
        mismatchRows.push(dealerCode);
      }

      // Condition 2: outlook_b >= mtd_b and outlook_d >= mtd_d
      if (outlookB < mtdB || outlookD < mtdD) {
        mtdMismatchRows.push(dealerCode);
      }
    });

    if (mismatchRows.length > 0) {
      this.apis.showAlert('error', 'Mismatch Found!', `Mismatch in Outlook collection and day wise break up plan — DealerCode(s): ${mismatchRows.join(', ')}`);
      return;
    }

    if (mtdMismatchRows.length > 0) {
      this.apis.showAlert('error', 'Mismatch Found!', `Outlook B/D cannot be less than MTD B/D at dealers:  ${mtdMismatchRows.join(', ')}`);
      return;
    }

    const newWorkbook = XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(records);
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Sheet1');

    const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const modifiedFile = new File([blob], this.selectedFile!.name, { type: blob.type });

    const formData = new FormData();
    formData.append('UploadId', this.selectedUploadId!.toString());
    formData.append('file', modifiedFile);

    this.apis.uploadExcelReport(formData).subscribe({
      next: (res: any) => this.handleUploadResponse(res),
      error: () => this.apis.showAlert('error', 'Error!', 'Something went wrong during upload.')
    });
  }





  downloadRevisedBdrcExcel() {
    if (!this.selectedMonth || !this.selectedYear) {
      this.apis.showAlert('warning', 'Required', 'Please select Month and Year before downloading BDRC Excel.');
      return;
    }
    if (!this.validateDownload(this.bdrcData, 'Revised BDRC')) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Revised BDRC Entry');
      const monthYearText = this.getMonthYearText();

      // Determine current week number based on today's date
      const currentWeekNum = this.getCurrentWeekNumber();

      const columns: Partial<ExcelJS.Column>[] = [
        { width: 10 }, // State
        { width: 27 }, // Dlr Name
        { width: 13 }, // Dlr Loc
        { width: 8 },  // SAP
        { width: 8 },  // Status
        { width: 6 },  // D
        { width: 6 }   // C
      ];
      worksheet.columns = columns;

      // Row 1: Month/Year
      worksheet.mergeCells('A1:E2');
      worksheet.getCell('A1').value = monthYearText;
      this.applyCellStyle(worksheet.getCell('A1'), { bold: true, border: true, bgColor: this.COLORS.PRIMARY_HEADER });
      worksheet.getCell('A1').font = { name: 'Century Gothic', size: 10, bold: true };

      // Row 2: Dealer detail header cells (col 1-5) + Revised Plan header (col 6-7)
      [1, 2, 3, 4, 5].forEach(col => this.applyCellStyle(worksheet.getCell(2, col), { border: true }));

      worksheet.mergeCells('F1:G2');
      const planHeaderCell = worksheet.getCell('F1');
      planHeaderCell.value = `W${currentWeekNum} Revised Plan`;
      this.applyCellStyle(planHeaderCell, { bold: true, bgColor: this.COLORS.PRIMARY_HEADER, border: true });
      planHeaderCell.font = { name: 'Century Gothic', size: 10, bold: true };

      // TOTAL ROW (row 3)
      const totalRow = worksheet.getRow(3);
      worksheet.mergeCells(3, 1, 3, 5); // A3:E3 merge
      totalRow.getCell(1).value = 'Total';
      this.applyCellStyle(totalRow.getCell(1), {
        bold: true,
        bgColor: this.COLORS.TOTAL_ROW,
        border: true,
        locked: true
      });
      totalRow.getCell(1).alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };

      // Sum formulas for D, C columns (6,7)
      const dataStartRow = 5;
      const dataEndRow = 4 + this.bdrcData.length;

      for (let col = 6; col <= 7; col++) {
        const colLetter = this.getColumnLetter(col);
        totalRow.getCell(col).value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})` };
        this.applyCellStyle(totalRow.getCell(col), {
          bold: true,
          bgColor: this.COLORS.TOTAL_ROW,
          border: true,
          locked: true
        });
      }

      // Row 4: Sub headers
      const subHeaders = ['State', 'Dlr Name', 'Dlr Loc', 'SAP', 'Status', 'D', 'C'];

      subHeaders.forEach((header, index) => {
        const cell = worksheet.getCell(4, index + 1);
        cell.value = header;
        this.applyCellStyle(cell, { bold: true, border: true, bgColor: this.COLORS.SECONDARY_HEADER });
      });

      // Data rows start from row 5
      this.bdrcData.forEach((dealer, index) => {
        const rowIndex = index + 5;
        const row = worksheet.getRow(rowIndex);
        [
          { col: 1, value: dealer.StateName || '' },
          { col: 2, value: dealer.DealerName || '' },
          { col: 3, value: dealer.DlrLoc || '' },
          { col: 4, value: dealer.DealerCode || '' },
          { col: 5, value: dealer.Status || '' }
        ].forEach(({ col, value }) => {
          row.getCell(col).value = value;
          this.applyCellStyle(row.getCell(col), { locked: true, bgColor: this.COLORS.LOCKED_CELL, border: true });
        });

        // D, C - editable cells only
        [
          { col: 6, value: dealer.revisedColl ?? '' },/*this is delivery but field name wrong*/
          { col: 7, value: dealer.revisedRet ?? '' }/*this is collection but field name wrong*/
        ].forEach(({ col, value }) => {
          row.getCell(col).value = value;
          this.applyCellStyle(row.getCell(col), { locked: false, border: true });
        });
      });

      // Validation - columns 6,7 (D,C)
      const validationColumns = [6, 7];
      this.addDataValidation(worksheet, this.bdrcData.length, validationColumns, true, [], 5);

      // Force Century Gothic, size 10 on every cell (bold preserved)
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.font = {
            name: 'Century Gothic',
            size: 10,
            bold: !!cell.font?.bold
          };
        });
      });

      // Re-assert bold + font on known bold header cells (merged-cell safe)
      ['A1', 'F1'].forEach(addr => {
        worksheet.getCell(addr).font = { name: 'Century Gothic', size: 10, bold: true };
      });
      totalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: 'Century Gothic', size: 10, bold: true };
      });
      worksheet.getRow(4).eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: 'Century Gothic', size: 10, bold: true };
      });
      this.downloadFileName = `RevisedBdrc_${this.selectedState}.xlsx`;
      this.protectAndSaveWorkbook(workbook, this.downloadFileName, true);
    } catch (error) {
      //console.error('Excel generation error:', error);
      this.apis.showAlert('error', 'Error', 'Failed to generate Excel file.');
    }
  }

  private getCurrentWeekNumber(): number {
    const today = new Date().getDate(); // day of month, 1-31
    if (today <= 7) return 1;
    if (today <= 14) return 2;
    if (today <= 21) return 3;
    if (today <= 28) return 4;
    return 5;
  }

  async handleRevisedBdrcUploadExcel() {
    const COLUMN_MAP: Record<number, string> = {
      0: 'state', 1: 'dealerName', 2: 'dealerLocation', 3: 'dealerCode', 4: 'status',
      5: 'd', 6: 'c'
    };
    const HEADER_ROWS = 4;
    const NUMERIC_START_COL = 5; // B, D, R, C columns are numeric
    if (!this.selectedFile) return;
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this.selectedFile!);
    });
    const workbook = XLSX.read(buffer, { type: 'array', cellFormula: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });

    // ---- F1 week validation ----
    const f1Value = rows[0]?.[5];
    const uploadedWeekNum = f1Value;
    const weekNumber = this.getCurrentWeekNumber(); // e.g. 4
    const currentWeekNum = `W${weekNumber} Revised Plan`;
    if (uploadedWeekNum !== currentWeekNum) {
      this.apis.showAlert(
        'error',
        'Week Mismatch!',
        `Uploaded file shows "${uploadedWeekNum}", but expected "${currentWeekNum}" based on today's date. Please upload the correct week's file.`
      );
      return;
    }
    // ---- end F1 week validation ----

    const records: any[] = [];
    for (let rowIdx = HEADER_ROWS; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.every((cell: any) => cell === null || cell === '')) continue;
      const firstCell = row[0];
      if (firstCell !== null && String(firstCell).trim().toLowerCase() === 'total') continue;
      const record: any = {};
      for (const [colStr, key] of Object.entries(COLUMN_MAP)) {
        const colIndex = Number(colStr);
        let value = row[colIndex] ?? null;
        if (typeof value === 'string' && value.trim().startsWith('=')) value = 0;
        if (value === null || value === '') value = colIndex >= NUMERIC_START_COL ? 0 : null;
        record[key] = value;
      }
      record['week'] = weekNumber; // 👈 naya column: sirf 1/2/3/4/5
      records.push(record);
    }

    const newWorkbook = XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(records);
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, currentWeekNum);
    const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const modifiedFile = new File([blob], this.selectedFile!.name, { type: blob.type });
    const formData = new FormData();
    formData.append('UploadId', this.selectedUploadId!.toString());
    formData.append('file', modifiedFile);
    this.apis.uploadExcelReport(formData).subscribe({
      next: (res: any) => this.handleUploadResponse(res),
      error: () => this.apis.showAlert('error', 'Error!', 'Something went wrong during upload.')
    });
  }

  private fetchRevisedBRDCDataByState(stateName: string): void {
    this.currentWeek = this.getCurrentWeekNumber();
    if (!this.selectedMonth) {
      this.selectedMonth = new Date().getMonth() + 1;
    }
    if (!this.selectedYear) {
      this.selectedYear = new Date().getFullYear();
    }
    const request = { stateName: stateName, month: this.selectedMonth, year: this.selectedYear, week: this.currentWeek };
    this.apis.getRevisedBDRCFormatData(request).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.bdrcData = res.data;

          if (res.data.length === 0) {
            this.apis.showAlert('info', 'No Data', `No Revised Data found for ${stateName}`);
          }
        } else {
          this.bdrcData = [];
          this.apis.showAlert('error', 'Error', `Failed to fetch Revised Data.`);
        }
      },
      error: () => this.apis.showAlert('error', 'Error', `Revised Data fetch failed`)
    });
  }




  async getPddFormatData(): Promise<void> {
    try {
      const res: any = await firstValueFrom(
        this.apis.getPdd(0, 0)
      );
      1
      if (
        res?.message?.toLowerCase() === 'success' &&
        Array.isArray(res.data)
      ) {
        this.pddFormatData = res.data;


        if (res.data.length === 0) {
          this.apis.showAlert('info', 'No Data', 'No Pdd Report data found.');
        }
      } else {
        this.pddFormatData = [];
        this.apis.showAlert('error', 'Error', 'Failed to fetch Pdd Report data.');
      }
    } catch (err) {
      //console.error(err);
      this.pddFormatData = [];
      this.apis.showAlert('error', 'Error', 'Pdd Report data fetch failed.');
    }
  }

  async downloadPddExcel(): Promise<void> {
    try {
      if (!this.pddFormatData || this.pddFormatData.length === 0) {
        this.apis.showAlert('warning', 'No Data', 'No data available to download.');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('PDD Report');

      const lockedFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5496' } };
      const dataFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

      const font = (): Partial<ExcelJS.Font> => ({ bold: true, size: 9, name: 'Century Gothic' });
      const alignment = (): Partial<ExcelJS.Alignment> => ({ horizontal: 'center', vertical: 'middle', wrapText: true });
      const border: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };

      const setHeaderCell = (addr: string, value: ExcelJS.CellValue) => {
        const cell = ws.getCell(addr);
        cell.value = value;
        cell.font = { ...font(), color: { argb: 'FFFFFFFF' } };
        cell.alignment = alignment();
        cell.border = border;
        cell.fill = lockedFill;
        cell.protection = { locked: true };
      };

      const setDataCell = (rowNum: number, col: number, value: ExcelJS.CellValue, numFmt?: string, align: 'left' | 'center' = 'center') => {
        const cell = ws.getCell(rowNum, col);
        cell.value = value;
        cell.font = { size: 10, name: 'Century Gothic' };
        cell.alignment = { horizontal: align, vertical: 'middle' };
        cell.border = border;
        cell.fill = dataFill;
        cell.protection = { locked: false };
        if (numFmt) cell.numFmt = numFmt;
      };

      const setTotalCell = (rowNum: number, col: number, value: ExcelJS.CellValue, numFmt?: string) => {
        const cell = ws.getCell(rowNum, col);
        cell.value = value;
        cell.font = { bold: true, size: 10, name: 'Century Gothic' };
        cell.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' };
        cell.border = border;
        cell.fill = totalFill;
        cell.protection = { locked: true };
        if (numFmt) cell.numFmt = numFmt;
      };

      // Headers
      setHeaderCell('A1', 'Dealer Code');
      setHeaderCell('B1', 'PDD Current Month');
      setHeaderCell('C1', 'PDD YTD');
      setHeaderCell('D1', 'PFS');

      ws.getRow(1).height = 18;

      // Data rows
      const dataStartRow = 2;
      const dataEndRow = dataStartRow + this.pddFormatData.length - 1;

      this.pddFormatData.forEach((item, index) => {
        const rowNum = dataStartRow + index;
        ws.getRow(rowNum).height = 15;

        setDataCell(rowNum, 1, item.dealerCode ?? '', undefined, 'left');
        setDataCell(rowNum, 2, item.pddCurrMonth ?? 0, '0.00', 'center');
        setDataCell(rowNum, 3, item.pddYTD ?? 0, '0.00', 'center');
        setDataCell(rowNum, 4, item.pfs ?? 0, '0.00', 'center');
      });

      //// Total row
      //const totalRowNum = dataEndRow + 1;
      //ws.getRow(totalRowNum).height = 15;

      //setTotalCell(totalRowNum, 1, 'Total');
      //setTotalCell(totalRowNum, 2, { formula: `SUM(B${dataStartRow}:B${dataEndRow})` }, '0.00');
      //setTotalCell(totalRowNum, 3, { formula: `SUM(C${dataStartRow}:C${dataEndRow})` }, '0.00');
      //setTotalCell(totalRowNum, 4, { formula: `SUM(D${dataStartRow}:D${dataEndRow})` }, '0.00');

      // AutoFit columns based on content
      ['A', 'B', 'C', 'D'].forEach(col => {
        const column = ws.getColumn(col);
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          maxLength = Math.max(maxLength, (cell.text || '').length);
        });
        column.width = Math.min(maxLength + 2, 25);
      });

      // Freeze header
      ws.views = [{ state: 'frozen', ySplit: 1 }];

      // Protect sheet
      await ws.protect('', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertRows: false,
        insertColumns: false,
        deleteRows: false,
        deleteColumns: false,
        sort: false,
        autoFilter: false,
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `PDD_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);

    } catch (err) {
      //console.error(err);
      this.apis.showAlert('error', 'Error', 'Failed to download Excel file.');
    }
  }

  async handlePddUploadExcel() {
    const COLUMN_MAP: Record<number, string> = {
      0: 'dealerCode',
      1: 'pddCurrMonth',
      2: 'pddYTD',
      3: 'pfs'
    };

    const HEADER_ROWS = 1;
    const NUMERIC_START_COL = 1;

    if (!this.selectedFile) return;

    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this.selectedFile!);
    });

    const workbook = XLSX.read(buffer, { type: 'array', cellFormula: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });

    const records: any[] = [];

    for (let rowIdx = HEADER_ROWS; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.every((cell: any) => cell === null || cell === '')) continue;

      const firstCell = row[0];
      // Skip total row if present
      if (firstCell !== null && String(firstCell).trim().toLowerCase() === 'total') continue;

      const record: any = {};

      for (const [colStr, key] of Object.entries(COLUMN_MAP)) {
        const colIndex = Number(colStr);
        let value = row[colIndex] ?? null;

        if (typeof value === 'string' && value.trim().startsWith('=')) value = 0;
        if (value === null || value === '') value = colIndex >= NUMERIC_START_COL ? 0 : null;

        record[key] = value;
      }

      records.push(record);
    }

    // Validation: Check for empty dealer codes
    const emptyDealers = records
      .map((r, i) => ({ ...r, rowIndex: i + HEADER_ROWS + 1 }))
      .filter(r => !r.dealerCode)
      .map(r => `Row ${r.rowIndex}`);

    if (emptyDealers.length > 0) {
      this.apis.showAlert('error', 'Invalid Data', `Missing Dealer Code in: ${emptyDealers.join(', ')}`);
      return;
    }

    // Validation: Check for negative values
    const negativeRows: string[] = [];
    records.forEach((record, i) => {
      const currMonth = parseFloat(record['pddCurrMonth']) || 0;
      const ytd = parseFloat(record['pddYTD']) || 0;
      const pfs = parseFloat(record['pfs']) || 0;

      if (currMonth < 0 || ytd < 0 || pfs < 0) {
        negativeRows.push(record['dealerCode']);
      }
    });

    if (negativeRows.length > 0) {
      this.apis.showAlert('error', 'Invalid Values', `Negative values found at DealerCode(s): ${negativeRows.join(', ')}`);
      return;
    }

    // Create clean workbook for upload (header + data only, no total)
    const uploadData = [
      ['Dealer Code', 'PDD Current Month', 'PDD YTD', 'PFS'],
      ...records.map(r => [
        r.dealerCode,
        r.pddCurrMonth,
        r.pddYTD,
        r.pfs
      ])
    ];

    const newWorkbook = XLSX.utils.book_new();
    const newSheet = XLSX.utils.aoa_to_sheet(uploadData);
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'PDD Report');

    const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const modifiedFile = new File([blob], this.selectedFile!.name, { type: blob.type });

    const formData = new FormData();
    formData.append('UploadId', this.selectedUploadId!.toString());
    formData.append('file', modifiedFile);

    this.apis.uploadExcelReport(formData).subscribe({
      next: (res: any) => this.handleUploadResponse(res),
      error: () => this.apis.showAlert('error', 'Error!', 'Something went wrong during upload.')
    });
  }



}

