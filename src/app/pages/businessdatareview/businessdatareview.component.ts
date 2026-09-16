import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BDRCRow, ForecastRow, TalukaRow, TalukaPivotRow, PersonModel, getApisResponse, filterApisResponse } from './../../model/apiresponse';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-businessdatareview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './businessdatareview.component.html',
  styleUrl: './businessdatareview.component.css'
})
export class BusinessdatareviewComponent implements OnInit {

  apiresponse: getApisResponse = { message: null, data: null };
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];
  stateHead: PersonModel[] = [];
  showAM = false;
  showTM = false;
  showSH = false;
  showDealer = false;
  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';

  // ---- Filter State ----
  uploadReportList: any[] = [];
  filteredUploadReportList: any[] = [];
  stateList: string[] = [];

  selectedUploadId: number | null = null;
  selectedUploadName = '';
  selectedMonth: number | null = null;
  selectedYear: number | null = null;
  selectedState: string | null = null;
  selectedTTL: string = '';
  ShowForecastApproval = true;

  stateBasedUploadTypes = [1, 3, 4, 5, 7, 8, 9];
  showMonthYearDropdowns = true;

  availableMonths: { name: string; value: number }[] = [];
  years: number[] = [];

  private readonly allMonths = [
    { name: 'January', value: 1 }, { name: 'February', value: 2 }, { name: 'March', value: 3 },
    { name: 'April', value: 4 }, { name: 'May', value: 5 }, { name: 'June', value: 6 },
    { name: 'July', value: 7 }, { name: 'August', value: 8 }, { name: 'September', value: 9 },
    { name: 'October', value: 10 }, { name: 'November', value: 11 }, { name: 'December', value: 12 }
  ];

  positionId: string | null = null;
  userName: string | null = null;

  // ---- Table State ----
  hasSearched = false;
  filterSubmitted = false;
  hasW5 = false;

  // ---- BDRC ----
  bdrcRows: BDRCRow[] = [];
  isSavingAll = false;

  planSections = [
    { key: 'BillPlan', label: 'Bill Plan' },
    { key: 'DelPlan', label: 'Del Plan' },
    { key: 'RetPlan', label: 'Ret Plan' },
    { key: 'CollPlan', label: 'Coll Plan (In Lacs)' },
    { key: 'BGPlan', label: 'BG Plan (In Lacs)' }
  ];

  // ---- FORECAST ----
  forecastRows: ForecastRow[] = [];
  isSavingAllForecast = false;


  // ---- Shared Remark Modal ----
  rejectRemark = '';
  rejectRemarkSubmitted = false;
  private modal: any;
  private rejectingSection: 'bdrc' | 'forecast' | 'taluka' = 'bdrc';

  // ---- TALUKA INDUSTRY ----
  talukaRows: TalukaPivotRow[] = [];
  isSavingAllTaluka = false;

  talukaFYMonths: { lfyMonths: string[], cfyMonths: string[], nfyMonths: string[], lfyLabel: string, cfyLabel: string, nfyLabel: string } | null = null;



  /*priceposition*/
  pricePositionRows: any[] = [];
  isSavingAllPricePosition = false;

  get pricePositionEditingCount(): number {
    return this.pricePositionRows.filter((r: any) => r._editing).length;
  }

  get pricePositionDirtyCount(): number {
    return this.pricePositionRows.filter((r: any) => r._dirty).length;
  }

  get hasPricePositionEditable(): boolean {
    return this.pricePositionRows.some(r => this.canEditPricePosition(r));
  }

  get hasPricePositionRejected(): boolean {
    return this.pricePositionRows.some(r => r.IsCommited === -1);
  }

  showRejectModal: boolean = false;
  //rejectRemark: string = '';
  rejectRemarkError: boolean = false;
  selectedRejectRow: any = null;

  constructor(private apis: AuthService) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    if (this.positionId === 'National Sales Head') {
      this.showSH = true;
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
    }
    else if (this.positionId === 'State Head') {
      this.showSH = false;
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
    } else if (this.positionId === 'Area Manager') {
      this.showSH = false;
      this.showAM = false;
      this.showTM = true;
      this.showDealer = true;
    } else if (this.positionId === 'Territory Manager') {
      this.showSH = false;
      this.showAM = false;
      this.showTM = false;
      this.showDealer = true;
    } else {
      this.showSH = false;
      this.showAM = false;
      this.showTM = false;
      this.showDealer = false;
    }

    this.showSH = false;
    this.showAM = false;
    this.showTM = false;
    this.showDealer = false;
    this.getHOFilter();
    this.setDynamicMonthsAndYears();
    this.getUploadReportTable();
    this.getStateList();
  }

  getHOFilter(): void {
    const request = {
      ShMail: "",
      AmMail: "",
      TmMail: "",
      DealerMail: "",
    };

    this.apis.getHOFilter(request).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.stateHead = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.stateHead || [])];
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  getUploadReportTable(): void {
    this.apis.getUploadReportTable().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.uploadReportList = res.data;
          this.filterUploadListByPermission();
        }
      },
      error: () => { }
    });
  }

  getStateList(): void {
    this.apis.getStateListReport().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.stateList = res.data;
        }
      },
      error: () => { }
    });
  }

  filterUploadListByPermission(): void {
    if (!this.uploadReportList?.length) { this.filteredUploadReportList = []; return; }
    const excludedUploadIds = [5, 7];
    this.filteredUploadReportList = this.uploadReportList.filter(upload => {
      if (excludedUploadIds.includes(upload.UploadID)) return false;
      if (upload.userpermission && upload.userpermission.trim() !== '') {
        const userPermissions = upload.userpermission.split(',').map((p: string) => p.trim().toLowerCase());
        return this.userName && userPermissions.includes(this.userName.toLowerCase());
      }
      if (upload.permission && upload.permission.trim() !== '') {
        const permissions = upload.permission.split(',').map((p: string) => p.trim());
        return this.positionId && permissions.includes(this.positionId);
      }
      return false;
    });
  }

  onFilter(): void {

    this.filterSubmitted = true;
    if (!this.selectedUploadId) return;
    if (this.showMonthYearDropdowns && (!this.selectedMonth || !this.selectedYear)) return;
    if (this.stateBasedUploadTypes.includes(this.selectedUploadId!) && !this.selectedState) return;

    if (this.hasAnyEditing()) {
      this.apis.showAlert('warning', 'Unsaved Changes', 'Please save or cancel all edited rows before applying new filters.');
      return;
    }

    this.hasSearched = false;
    this.bdrcRows = [];
    this.forecastRows = [];
    this.talukaRows = [];

    if (this.selectedUploadId === 3) this.fetchBDRCReviewData();
    else if (this.selectedUploadId === 4) this.fetchForecastReviewData();
    else if (this.selectedUploadId === 1) this.fetchTalukaReviewData();
    else if (this.selectedUploadId === 9) this.fetchPricePositionData();
  }
  ExportTo() {
    this.filterSubmitted = true;

    if (!this.selectedUploadId) return;
    if (this.showMonthYearDropdowns && (!this.selectedMonth || !this.selectedYear)) return;
    if (this.stateBasedUploadTypes.includes(this.selectedUploadId!) && !this.selectedState) return;

    const request = {
      UploadId: Number(this.selectedUploadId),
      StateName: this.selectedState,
      Month: Number(this.selectedMonth),
      Year: Number(this.selectedYear),
      tmMail: this.selectedUploadId === 3 ? this.selectedTM : null,
      amMail: this.selectedUploadId === 3 ? this.selectedAM : null,
      shMail: (this.selectedUploadId === 3 || this.selectedUploadId === 4) ? this.selectedSH : null,
    };

    this.apis.getReviewData(request).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data) && res.data.length > 0) {

          let exportData: any[] = [];
          let fileName = '';

          // ── BDRC ──
          if (this.selectedUploadId === 3) {
            exportData = res.data.map((row: any) => ({
              'State': row.StateName,
              'Dlr Name': row.DealerName,
              'Dlr Loc': row.DlrLoc,
              'SAP': row.DealerCode,
              'Status': row.Status,
              'Bill W1': row.BillPlan_W1 || 0,
              'Bill W2': row.BillPlan_W2 || 0,
              'Bill W3': row.BillPlan_W3 || 0,
              'Bill W4': row.BillPlan_W4 || 0,
              'Bill W5': row.BillPlan_W5 || 0,
              'Bill TTL': this.calcBDRCTTL(row, 'BillPlan'),
              'Del W1': row.DelPlan_W1 || 0,
              'Del W2': row.DelPlan_W2 || 0,
              'Del W3': row.DelPlan_W3 || 0,
              'Del W4': row.DelPlan_W4 || 0,
              'Del W5': row.DelPlan_W5 || 0,
              'Del TTL': this.calcBDRCTTL(row, 'DelPlan'),
              'Ret W1': row.RetPlan_W1 || 0,
              'Ret W2': row.RetPlan_W2 || 0,
              'Ret W3': row.RetPlan_W3 || 0,
              'Ret W4': row.RetPlan_W4 || 0,
              'Ret W5': row.RetPlan_W5 || 0,
              'Ret TTL': this.calcBDRCTTL(row, 'RetPlan'),
              'Coll W1': row.CollPlan_W1 || 0,
              'Coll W2': row.CollPlan_W2 || 0,
              'Coll W3': row.CollPlan_W3 || 0,
              'Coll W4': row.CollPlan_W4 || 0,
              'Coll W5': row.CollPlan_W5 || 0,
              'Coll TTL': this.calcBDRCTTL(row, 'CollPlan'),
              'BG W1': row.BGPlan_W1 || 0,
              'BG W2': row.BGPlan_W2 || 0,
              'BG W3': row.BGPlan_W3 || 0,
              'BG W4': row.BGPlan_W4 || 0,
              'BG W5': row.BGPlan_W5 || 0,
              'BG TTL': this.calcBDRCTTL(row, 'BGPlan'),
              'Uploaded By': row.UploadByPosition || '—',
              'Uploader Name': row.UploadName || '—',
              'Pending With': row.pendingon === 'No' ? '—' : (row.pendingon || '—'),
              'Pending Name': row.PendingName || '—',
              'Approval Status': row.IsCommited === 1 ? 'Approved' : row.IsCommited === -1 ? 'Rejected' : 'Pending',
              'Reviewed By': row.lastReviewBy || '—',
              'Remark': row.Remark || '—'
            }));
            fileName = `BDRCReview_${new Date().toISOString().split('T')[0]}.xlsx`;
          }

          // ── FORECAST ──
          else if (this.selectedUploadId === 4) {
            exportData = res.data.map((row: any) => {
              const newRow = { ...row };
              ['UploadByPosition', 'PendingName', 'Possition_order',
                'BatchId', 'IsCommited', 'lastReviewBy', 'Remark'].forEach(col => delete newRow[col]);
              newRow.Total_BillingPlan = this.calcForecastTTL(row);
              return newRow;
            });
            fileName = `ForecastReview_${new Date().toISOString().split('T')[0]}.xlsx`;
          }

          const worksheet = XLSX.utils.json_to_sheet(exportData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
          XLSX.writeFile(workbook, fileName);

        } else {
          this.apis.showAlert('info', 'No Data', 'No data found for the selected range.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred.');
      }
    });
  }

  fetchBDRCReviewData(): void {
    const request = {
      UploadId: Number(this.selectedUploadId),
      StateName: this.selectedState,
      Month: Number(this.selectedMonth),
      Year: Number(this.selectedYear),
      tmMail: this.selectedTM,
      amMail: this.selectedAM,
      shMail: this.selectedSH,
    };
   
    this.apis.getReviewData(request).subscribe({
      next: (res: any) => {
        this.hasSearched = true;
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.hasW5 = this.checkHasWeek5(this.selectedMonth!, this.selectedYear!);
          this.bdrcRows = res.data.map((row: any) => ({
            ...row,
            BillPlan_TTL: this.calcBDRCTTL(row, 'BillPlan'),
            DelPlan_TTL: this.calcBDRCTTL(row, 'DelPlan'),
            RetPlan_TTL: this.calcBDRCTTL(row, 'RetPlan'),
            CollPlan_TTL: this.calcBDRCTTL(row, 'CollPlan'),
            BGPlan_TTL: this.calcBDRCTTL(row, 'BGPlan'),
            _editing: false, _dirty: false
          }));
        } else {
          this.bdrcRows = [];
        }
      },
      error: () => { this.hasSearched = true; this.apis.showAlert('error', 'Error', 'Failed to fetch BDRC review data.'); }
    });
  }

  fetchForecastReviewData(): void {
 
    if (this.selectedTTL) {
      this.ShowForecastApproval = false;
    }
    else {
      this.ShowForecastApproval = true;

    }

    const request = {
      UploadId: Number(this.selectedUploadId),
      StateName: this.selectedState,
      Month: Number(this.selectedMonth),
      Year: Number(this.selectedYear),
      billingTtl: this.selectedTTL,
      SHMail: this.selectedSH
    };
    this.apis.getReviewData(request).subscribe({
      next: (res: any) => {
        this.hasSearched = true;
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.hasW5 = this.checkHasWeek5(this.selectedMonth!, this.selectedYear!);
          this.forecastRows = res.data.map((row: any) => ({
            ...row,
            Total_BillingPlan: this.calcForecastTTL(row),
            _editing: false, _dirty: false
          }));
        } else {
          this.forecastRows = [];
        }
      },
      error: () => { this.hasSearched = true; this.apis.showAlert('error', 'Error', 'Failed to fetch Forecast review data.'); }
    });
  }

  fetchTalukaReviewData(): void {
    const request = {
      UploadId: Number(this.selectedUploadId),
      StateName: this.selectedState
    };
    this.apis.getReviewData(request).subscribe({
      next: (res: any) => {
        this.hasSearched = true;
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.talukaFYMonths = this.buildFYMonthsFromData(res.data);
          this.talukaRows = this.pivotTalukaData(res.data);
        } else {
          this.talukaRows = [];
          this.talukaFYMonths = null;
        }
      },
      error: () => {
        this.hasSearched = true;
        this.apis.showAlert('error', 'Error', 'Failed to fetch Taluka Industry review data.');
      }
    });
  }

  fetchPricePositionData(): void {
    const request = {
      UploadId: Number(this.selectedUploadId),
      StateName: this.selectedState
    };
    this.apis.getReviewData(request).subscribe({
      next: (res: any) => {

        this.hasSearched = true;
        //console.log('price positioning', JSON.stringify(res));
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.pricePositionRows = res.data;
        } else {
          this.pricePositionRows = [];
        }
      },
      error: () => {
        this.hasSearched = true;
        this.apis.showAlert('error', 'Error', 'Failed to fetch Price Positioning data.');
      }
    });
  }

  private pivotTalukaData(flatData: any[]): TalukaPivotRow[] {
    const map = new Map<string, TalukaPivotRow>();

    flatData.forEach(item => {
      const key = `${item.StateName}__${item.DistrictName}__${item.TalukaName}`;

      if (!map.has(key)) {
        map.set(key, {
          StateName: item.StateName,
          DistrictName: item.DistrictName,
          TalukaName: item.TalukaName,
          DealerCode: item.DealerCode,
          BatchId: item.BatchId,
          IsCommited: item.IsCommited,
          Remark: item.Remark,
          pendingon: item.pendingon,
          PendingName: item.PendingName,
          UploadByPosition: item.UploadByPosition,
          UploadName: item.UploadName,
          lastReviewBy: item.lastReviewBy,
          monthData: {},
          _editing: false,
          _dirty: false
        });
      }

      const row = map.get(key)!;
      if (item.Month && item.Year) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[Number(item.Month) - 1];
        const yearShort = String(item.Year).slice(-2);
        const monthKey = `${monthName}_${yearShort}`;
        row.monthData[monthKey] = item.Industry_LY ?? null;
      }
    });

    return Array.from(map.values());
  }

  getTalukaAllMonthCols(): string[] {
    if (!this.talukaFYMonths) return [];
    const { lfyMonths, cfyMonths, nfyMonths } = this.talukaFYMonths;
    const toKey = (m: string) => m.replace('-', '_');

    const cols: string[] = [];
    if (lfyMonths.length > 0) { cols.push(...lfyMonths.map(toKey), 'TTL_LFY'); }
    if (cfyMonths.length > 0) { cols.push(...cfyMonths.map(toKey), 'TTL_CFY'); }
    if (nfyMonths.length > 0) { cols.push(...nfyMonths.map(toKey), 'TTL_NFY'); }
    return cols;
  }

  getTalukaMonthValue(row: TalukaPivotRow, monthKey: string): number {
    return row.monthData[monthKey] ?? 0;
  }

  getTalukaTTL(row: TalukaPivotRow, fyMonths: string[]): number {
    const toKey = (m: string) => m.replace('-', '_');
    return fyMonths.reduce((sum, m) => sum + (row.monthData[toKey(m)] ?? 0), 0);
  }

  isTTLCol(col: string): boolean {
    return col === 'TTL_LFY' || col === 'TTL_CFY' || col === 'TTL_NFY';
  }

  talukaColLabel(col: string): string {
    if (col === 'TTL_LFY' || col === 'TTL_CFY' || col === 'TTL_NFY') return 'TTL';
    return col.replace('_', '-'); // "Apr_24" -> "Apr-24"
  }

  canEdit(row: any): boolean {
    if (!this.positionId) return false;
    const pending = row.pendingon?.trim().toLowerCase();
    if (!pending || pending === 'no') return false;
    return pending === this.positionId.trim().toLowerCase();
  }

  startEdit(index: number): void {
    const row = this.bdrcRows[index];
    if (row._editing) return;
    row._original = this.cloneRowData(row);
    row._editing = true;
    row._dirty = false;
  }

  cancelEdit(index: number): void {
    const row = this.bdrcRows[index];
    if (row._original) { Object.assign(row, row._original); this.recalcTTL(row); }
    row._editing = false; row._dirty = false; row._original = undefined;
  }

  cancelAllEdits(): void {
    this.bdrcRows.forEach((_, i) => { if (this.bdrcRows[i]._editing) this.cancelEdit(i); });
  }

  onCellChange(row: BDRCRow): void {
    this.recalcTTL(row);
    row._dirty = true;
  }

  saveAll(): void {
    const editableRows = this.bdrcRows.filter(row => this.canEdit(row));
    if (!editableRows.length) return;
    const bdrcclist = editableRows.map(row => this.buildBDRCPayload(row, row._dirty ? 'Yes' : 'No'));
    this.isSavingAll = true;
    this.apis.updateBDRCDataBulk({ bdrcclist, status: 'Approved' }).subscribe({
      next: (res: any) => {
        this.isSavingAll = false;
        if (res?.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Saved', `${editableRows.length} record(s) saved successfully.`);
          this.resetAfterSave();
        } else { this.apis.showAlert('error', 'Error', res?.message || 'Save failed.'); }
      },
      error: () => { this.isSavingAll = false; this.apis.showAlert('error', 'Error', 'Something went wrong.'); }
    });
  }

  rejectAll(): void {
    if (!this.bdrcRows.some(row => this.canEdit(row))) return;
    this.rejectingSection = 'bdrc';
    this.openRejectModal();
  }

  startEditForecast(index: number): void {
    const row = this.forecastRows[index];
    if (row._editing) return;
    row._original = { ...row };
    row._editing = true;
    row._dirty = false;
  }

  cancelEditForecast(index: number): void {
    const row = this.forecastRows[index];
    if (row._original) { Object.assign(row, row._original); row.Total_BillingPlan = this.calcForecastTTL(row); }
    row._editing = false; row._dirty = false; row._original = undefined;
  }

  cancelAllEditsForecast(): void {
    this.forecastRows.forEach((_, i) => { if (this.forecastRows[i]._editing) this.cancelEditForecast(i); });
  }

  onForecastCellChange(row: ForecastRow): void {
    row.Total_BillingPlan = this.calcForecastTTL(row);
    row._dirty = true;
  }

  saveAllForecast(): void {
    const editableRows = this.forecastRows.filter(row => this.canEdit(row));
    if (!editableRows.length) return;
    const forecastlist = editableRows.map(row => this.buildForecastPayload(row, row._dirty ? 'Yes' : 'No'));
    this.isSavingAllForecast = true;
    this.apis.forecastReportApproval({ forecastlist, status: 'Approved' }).subscribe({
      next: (res: any) => {
        this.isSavingAllForecast = false;
        if (res?.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Saved', `${editableRows.length} record(s) saved successfully.`);
          this.resetAfterSave();
        } else { this.apis.showAlert('error', 'Error', res?.message || 'Save failed.'); }
      },
      error: () => { this.isSavingAllForecast = false; this.apis.showAlert('error', 'Error', 'Something went wrong.'); }
    });
  }

  rejectAllForecast(): void {
    if (!this.forecastRows.some(row => this.canEdit(row))) return;
    this.rejectingSection = 'forecast';
    this.openRejectModal();
  }

  startEditTaluka(index: number): void {
    const row = this.talukaRows[index];
    if (row._editing) return;
    row._original = { ...row, monthData: { ...row.monthData } };
    row._editing = true;
    row._dirty = false;
  }

  cancelEditTaluka(index: number): void {
    const row = this.talukaRows[index];
    if (row._original) {
      row.monthData = { ...row._original.monthData };
    }
    row._editing = false;
    row._dirty = false;
    row._original = undefined;
  }

  cancelAllEditsTaluka(): void {
    this.talukaRows.forEach((_, i) => {
      if (this.talukaRows[i]._editing) this.cancelEditTaluka(i);
    });
  }

  onTalukaCellChange(row: TalukaPivotRow): void {
    row._dirty = true;
  }

  saveAllTaluka(): void {
    
    const editableRows = this.talukaRows.filter(row => this.canEdit(row));
    if (!editableRows.length) return;

    const talukaIndustryList = this.buildTalukaFlatPayload(editableRows);
    this.isSavingAllTaluka = true;

    //this.apis.talukaIndustryApproval({ talukaIndustryList, status: 'Approved' }).subscribe({
    //  next: (res: any) => {
    //    this.isSavingAllTaluka = false;
    //    if (res?.message?.toLowerCase() === 'success') {
    //      this.apis.showAlert('success', 'Approved', `Records approved successfully.`);
    //      this.resetAfterSave();
    //    } else {
    //      this.apis.showAlert('error', 'Error', res?.message || 'Save failed.');
    //    }
    //  },
    //  error: () => {
    //    this.isSavingAllTaluka = false;
    //    this.apis.showAlert('error', 'Error', 'Something went wrong.');
    //  }
    //});
  }

  rejectAllTaluka(): void {
    if (!this.talukaRows.some(row => this.canEdit(row))) return;
    this.rejectingSection = 'taluka';
    this.openRejectModal();
  }

  confirmReject(): void {
    this.rejectRemarkSubmitted = true;
    if (!this.rejectRemark.trim()) return;
    this.closeModal();

    if (this.rejectingSection === 'bdrc') {
      const editableRows = this.bdrcRows.filter(row => this.canEdit(row));
      const bdrcclist = editableRows.map(row => this.buildBDRCPayload(row, ''));
      this.apis.updateBDRCDataBulk({ bdrcclist, status: 'Rejected', remark: this.rejectRemark.trim() }).subscribe({
        next: (res: any) => {
          if (res?.message?.toLowerCase() === 'success') {
            this.apis.showAlert('success', 'Rejected', `${editableRows.length} record(s) rejected.`);
            this.resetAfterSave();
          } else { this.apis.showAlert('error', 'Error', res?.message || 'Reject failed.'); }
        },
        error: () => this.apis.showAlert('error', 'Error', 'Something went wrong.')
      });

    }

    else if (this.rejectingSection === 'forecast') {
      const editableRows = this.forecastRows.filter(row => this.canEdit(row));
      const forecastlist = editableRows.map(row => this.buildForecastPayload(row, ''));
      this.apis.forecastReportApproval({ forecastlist, status: 'Rejected', remark: this.rejectRemark.trim() }).subscribe({
        next: (res: any) => {
          if (res?.message?.toLowerCase() === 'success') {
            this.apis.showAlert('success', 'Rejected', `${editableRows.length} record(s) rejected.`);
            this.resetAfterSave();
          } else { this.apis.showAlert('error', 'Error', res?.message || 'Reject failed.'); }
        },
        error: () => this.apis.showAlert('error', 'Error', 'Something went wrong.')
      });

    }

    else if (this.rejectingSection === 'taluka') {
      const editableRows = this.talukaRows.filter(row => this.canEdit(row));
      const talukaIndustryList = this.buildTalukaFlatPayload(editableRows);
      //this.apis.talukaIndustryApproval({ talukaIndustryList, status: 'Rejected', remark: this.rejectRemark.trim() }).subscribe({
      //  next: (res: any) => {
      //    if (res?.message?.toLowerCase() === 'success') {
      //      this.apis.showAlert('success', 'Rejected', `${editableRows.length} record(s) rejected.`);
      //      this.resetAfterSave();
      //    } else { this.apis.showAlert('error', 'Error', res?.message || 'Reject failed.'); }
      //  },
      //  error: () => this.apis.showAlert('error', 'Error', 'Something went wrong.')
      //});
    }
  }

  cancelReject(): void {
    this.rejectRemark = '';
    this.rejectRemarkSubmitted = false;
    this.closeModal();
  }

  private openRejectModal(): void {
    this.rejectRemark = '';
    this.rejectRemarkSubmitted = false;
    const modalEl = document.getElementById('rejectRemarkModal');
    if (modalEl) {
      this.modal = new (window as any).bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      this.modal.show();
    }
  }

  private closeModal(): void {
    const modalEl = document.getElementById('rejectRemarkModal');
    (window as any).bootstrap.Modal.getInstance(modalEl)?.hide();
  }

  hasAnyEditing(): boolean {
    return this.bdrcRows.some(r => r._editing)
      || this.forecastRows.some(r => r._editing)
      || this.talukaRows.some(r => r._editing);
  }

  // BDRC getters
  get editingCount(): number { return this.bdrcRows.filter(r => r._editing).length; }
  get dirtyCount(): number { return this.bdrcRows.filter(r => r._editing && r._dirty).length; }
  get hasAnyEditable(): boolean { return this.bdrcRows.some(row => this.canEdit(row)); }
  get hasAnyRejected(): boolean { return this.bdrcRows.some(r => (r as any).IsCommited === -1); }

  // Forecast getters
  get forecastEditingCount(): number { return this.forecastRows.filter(r => r._editing).length; }
  get forecastDirtyCount(): number { return this.forecastRows.filter(r => r._editing && r._dirty).length; }
  get hasForecastEditable(): boolean { return this.forecastRows.some(row => this.canEdit(row)); }
  get hasForecastRejected(): boolean { return this.forecastRows.some(r => r.IsCommited === -1); }

  private buildTalukaFlatPayload(rows: TalukaPivotRow[]): any[] {
    const result: any[] = [];
    if (!this.talukaFYMonths) return result;

    const { lfyMonths, cfyMonths, nfyMonths } = this.talukaFYMonths;
    const allMonths = [...lfyMonths, ...cfyMonths, ...nfyMonths];

    rows.forEach(row => {
      allMonths.forEach(monthLabel => {
        const monthKey = monthLabel.replace('-', '_'); // "Apr-24" -> "Apr_24"
        const value = row.monthData[monthKey];
        if (value !== null && value !== undefined) {
          const parsed = this.parseMonthLabel(monthLabel); // { month: 'Apr', year: 2024 }
          result.push({
            uploadId: this.selectedUploadId,
            stateName: row.StateName,
            districtName: row.DistrictName,
            talukaName: row.TalukaName,
            dealerCode: row.DealerCode,
            batchId: row.BatchId,
            month: parsed?.month,
            year: parsed?.year,
            industryData: value,
            isEdit: row._dirty ? 'Yes' : 'No'
          });
        }
      });
    });

    return result;
  }

  private parseMonthLabel(label: string): { month: string; year: number } | null {
    // "Apr-24" -> { month: 'Apr', year: 2024 }
    const parts = label.split('-');
    if (parts.length !== 2) return null;
    return { month: parts[0], year: parseInt(parts[1]) + 2000 };
  }

  private buildFYMonthsFromData(flatData: any[]): {
    lfyMonths: string[], cfyMonths: string[], nfyMonths: string[],
    lfyLabel: string, cfyLabel: string, nfyLabel: string
  } {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Data mein jo unique month+year combinations hain wo nikalo
    const uniqueMonthYears = new Set<string>();
    flatData.forEach(item => {
      if (item.Month && item.Year) {
        uniqueMonthYears.add(`${item.Month}_${item.Year}`);
      }
    });

    // Har month ko FY mein categorize karo (Apr-Mar cycle)
    const fyMap = new Map<number, string[]>(); // fyEndYear -> months array

    uniqueMonthYears.forEach(key => {
      const [monthNum, yearNum] = key.split('_').map(Number);
      // FY end year: month >= 4 to current year+1, else current year
      const fyEndYear = monthNum >= 4 ? yearNum + 1 : yearNum;

      if (!fyMap.has(fyEndYear)) fyMap.set(fyEndYear, []);

      const monthLabel = `${monthNames[monthNum - 1]}-${String(yearNum).slice(-2)}`;
      fyMap.get(fyEndYear)!.push(monthLabel);
    });

    // FY sort karo (ascending) aur months bhi sort karo (Apr to Mar order)
    const fyOrder = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]; // Apr=1st, Mar=12th
    const sortMonths = (months: string[]) => {
      return months.sort((a, b) => {
        const [mA, yA] = a.split('-');
        const [mB, yB] = b.split('-');
        const yearDiff = parseInt(yA) - parseInt(yB);
        if (yearDiff !== 0) return yearDiff;
        const miA = monthNames.indexOf(mA) + 1;
        const miB = monthNames.indexOf(mB) + 1;
        return fyOrder.indexOf(miA) - fyOrder.indexOf(miB);
      });
    };

    const sortedFYs = Array.from(fyMap.keys()).sort((a, b) => a - b);

    // Max 3 FYs — LFY, CFY, NFY
    const lfyEndYear = sortedFYs[0] ?? 0;
    const cfyEndYear = sortedFYs[1] ?? 0;
    const nfyEndYear = sortedFYs[2] ?? 0;

    return {
      lfyMonths: lfyEndYear ? sortMonths(fyMap.get(lfyEndYear) || []) : [],
      cfyMonths: cfyEndYear ? sortMonths(fyMap.get(cfyEndYear) || []) : [],
      nfyMonths: nfyEndYear ? sortMonths(fyMap.get(nfyEndYear) || []) : [],
      lfyLabel: lfyEndYear ? `F${String(lfyEndYear).slice(-2)}` : '',
      cfyLabel: cfyEndYear ? `F${String(cfyEndYear).slice(-2)}` : '',
      nfyLabel: nfyEndYear ? `F${String(nfyEndYear).slice(-2)}` : ''
    };
  }

  get talukaEditingCount(): number { return this.talukaRows.filter(r => r._editing).length; }
  get talukaDirtyCount(): number { return this.talukaRows.filter(r => r._editing && r._dirty).length; }
  get hasTalukaEditable(): boolean { return this.talukaRows.some(row => this.canEdit(row)); }
  get hasTalukaRejected(): boolean { return this.talukaRows.some(r => r.IsCommited === -1); }

  private calcBDRCTTL(row: any, section: string): number {
    return (row[`${section}_W1`] || 0) + (row[`${section}_W2`] || 0) +
      (row[`${section}_W3`] || 0) + (row[`${section}_W4`] || 0) + (row[`${section}_W5`] || 0);
  }

  calcForecastTTL(row: any): number {
    return (row.W1_BillingPlan || 0) + (row.W2_BillingPlan || 0) +
      (row.W3_BillingPlan || 0) + (row.W4_BillingPlan || 0) + (row.W5_BillingPlan || 0);
  }

  calcTalukaTTL(row: any): number {
    return (row.W1_BillingPlan || 0) + (row.W2_BillingPlan || 0) +
      (row.W3_BillingPlan || 0) + (row.W4_BillingPlan || 0) + (row.W5_BillingPlan || 0);
  }

  recalcTTL(row: BDRCRow): void {
    row.BillPlan_TTL = this.calcBDRCTTL(row, 'BillPlan');
    row.DelPlan_TTL = this.calcBDRCTTL(row, 'DelPlan');
    row.RetPlan_TTL = this.calcBDRCTTL(row, 'RetPlan');
    row.CollPlan_TTL = this.calcBDRCTTL(row, 'CollPlan');
    row.BGPlan_TTL = this.calcBDRCTTL(row, 'BGPlan');
  }

  getWeekValue(row: BDRCRow, section: string, week: string): number {
    return (row as any)[`${section}_${week}`] || 0;
  }

  getTTLValue(row: BDRCRow, section: string): number {
    return (row as any)[`${section}_TTL`] || 0;
  }

  getSectionTotal(section: string, week: string): number {
    return this.bdrcRows.reduce((sum, row) => sum + ((row as any)[`${section}_${week}`] || 0), 0);
  }

  getSectionTTLTotal(section: string): number {
    return this.bdrcRows.reduce((sum, row) => sum + ((row as any)[`${section}_TTL`] || 0), 0);
  }

  getForecastColTotal(col: string): number {
    return this.forecastRows.reduce((sum, row) => sum + ((row as any)[col] || 0), 0);
  }

  getTalukaColTotal(monthKey: string): number {
    if (!this.talukaFYMonths) return 0;
    const { lfyMonths, cfyMonths, nfyMonths } = this.talukaFYMonths;
    const toKey = (m: string) => m.replace('-', '_');

    if (monthKey === 'TTL_LFY') {
      return this.talukaRows.reduce((sum, row) => sum + this.getTalukaTTL(row, lfyMonths), 0);
    }
    if (monthKey === 'TTL_CFY') {
      return this.talukaRows.reduce((sum, row) => sum + this.getTalukaTTL(row, cfyMonths), 0);
    }
    if (monthKey === 'TTL_NFY') {
      return this.talukaRows.reduce((sum, row) => sum + this.getTalukaTTL(row, nfyMonths), 0);
    }
    return this.talukaRows.reduce((sum, row) => sum + (row.monthData[monthKey] ?? 0), 0);
  }

  getMonthYearLabel(): string {
    const m = this.allMonths.find(x => x.value === this.selectedMonth)?.name || '';
    return `${m} ${this.selectedYear}`;
  }

  private cloneRowData(row: BDRCRow): Partial<BDRCRow> {
    const { _editing, _original, _dirty, ...rest } = row;
    return { ...rest };
  }

  checkHasWeek5(month: number, year: number): boolean {
    return new Date(year, month, 0).getDate() > 28;
  }

  getWeekCols(): string[] {
    return this.hasW5 ? ['W1', 'W2', 'W3', 'W4', 'W5', 'TTL'] : ['W1', 'W2', 'W3', 'W4', 'TTL'];
  }

  forecastWeekCols(): string[] {
    return this.hasW5
      ? ['W1_BillingPlan', 'W2_BillingPlan', 'W3_BillingPlan', 'W4_BillingPlan', 'W5_BillingPlan', 'Total_BillingPlan']
      : ['W1_BillingPlan', 'W2_BillingPlan', 'W3_BillingPlan', 'W4_BillingPlan', 'Total_BillingPlan'];
  }

  forecastWeekLabel(col: string): string {
    const map: { [k: string]: string } = {
      'W1_BillingPlan': 'W1', 'W2_BillingPlan': 'W2',
      'W3_BillingPlan': 'W3', 'W4_BillingPlan': 'W4',
      'W5_BillingPlan': 'W5', 'Total_BillingPlan': 'TTL'
    };
    return map[col] || col;
  }

  talukaWeekCols(): string[] {
    return ['W1_BillingPlan', 'W2_BillingPlan', 'W3_BillingPlan',
      'W4_BillingPlan', 'W5_BillingPlan', 'Total_BillingPlan'];
  }

  talukaWeekLabel(col: string): string {
    const map: { [k: string]: string } = {
      'W1_BillingPlan': 'W1', 'W2_BillingPlan': 'W2',
      'W3_BillingPlan': 'W3', 'W4_BillingPlan': 'W4',
      'W5_BillingPlan': 'W5', 'Total_BillingPlan': 'TTL'
    };
    return map[col] || col;
  }

  onUploadTypeChange(): void {
   
    this.bdrcRows = [];
    this.forecastRows = [];
    this.talukaRows = [];
    this.hasSearched = false;
    this.selectedState = null;
    this.selectedMonth = null;
    this.selectedYear = null;
    this.filterSubmitted = false;
    this.showAM = false;
    this.showTM = false;
    this.showSH = false;

    if (!this.selectedUploadId) { this.showMonthYearDropdowns = true; return; }
    const selectedItem = this.filteredUploadReportList.find(x => x.UploadID === this.selectedUploadId);
    this.selectedUploadName = selectedItem?.UploadName || '';


    if (this.selectedUploadId === 1) {
      this.showMonthYearDropdowns = false;

    }
    else if (this.selectedUploadId === 4) {
      //this.showAM = true;
      //this.showTM = true;
      this.showSH = true;
      this.showMonthYearDropdowns = true;
      this.setMonthsYearsForUploadType();
    }
    else if (this.selectedUploadId === 3) {
      this.showAM = true;
      this.showTM = true;
      this.showSH = true;
      this.showMonthYearDropdowns = true;
      this.setMonthsYearsForUploadType();
    }
    if (this.selectedUploadId === 9) {
      this.showMonthYearDropdowns = false;

    }
    else {
      this.showMonthYearDropdowns = true;
      this.setMonthsYearsForUploadType();
    }

    if (this.stateBasedUploadTypes.includes(this.selectedUploadId!)) {
      this.selectedState = 'All';
    }
  }

  onMonthChange(): void {
    if (!this.selectedMonth || this.selectedUploadId === 5) return;
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    let resolvedYear = currentYear;
    if (currentMonth === 1 && Number(this.selectedMonth) === 12) resolvedYear = currentYear - 1;
    this.selectedYear = resolvedYear;
    this.years = [resolvedYear];
  }

  //onStateChange(): void {
  //  this.bdrcRows = [];
  //  this.forecastRows = [];
  //  this.talukaRows = [];
  //  this.hasSearched = false;
  //}

  private setDynamicMonthsAndYears(): void {
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth() + 1;
    this.years = cm === 1 ? [cy, cy - 1] : [cy];
    const prev = cm === 1 ? 12 : cm - 1;
    this.availableMonths = [this.allMonths.find(m => m.value === prev)!, this.allMonths.find(m => m.value === cm)!];
  }

  private setMonthsYearsForUploadType(): void {
    const today = new Date();
    const cm = today.getMonth() + 1;
    const cy = today.getFullYear();

    if (this.selectedUploadId === 3) {
      const months: { name: string; value: number }[] = [];
      const yearsSet = new Set<number>();
      for (let offset = -1; offset <= 5; offset++) {
        const d = new Date(cy, cm - 1 + offset, 1);
        const mo = this.allMonths.find(m => m.value === d.getMonth() + 1);
        if (mo) { months.push(mo); yearsSet.add(d.getFullYear()); }
      }
      this.availableMonths = months;
      this.years = Array.from(yearsSet).sort((a, b) => a - b);
      return;
    }

    if (this.selectedUploadId === 4) {
    
      const months: { name: string; value: number }[] = [];
      const yearsSet = new Set<number>();
      const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();

      //const dayOffset = today.getDate() >= 19 ? 1 : 0;
      const dayOffset = today.getDate() >= endOfMonth ? 0 : 0;
      for (let i = 0; i <= 4; i++) {
        const d = new Date(cy, cm - 1 + i + dayOffset, 1);
        const mo = this.allMonths.find(m => m.value === d.getMonth() + 1);
        if (mo) { months.push(mo); yearsSet.add(d.getFullYear()); }
      }
      this.availableMonths = months;
      this.years = Array.from(yearsSet).sort((a, b) => a - b);
      return;
    }

    if (this.selectedUploadId === 5) {
      this.availableMonths = [...this.allMonths];
      this.years = [];
      for (let y = 2023; y <= cy; y++) this.years.push(y);
      return;
    }

    this.setDynamicMonthsAndYears();
  }

  private resetAfterSave(): void {
    this.bdrcRows = [];
    this.forecastRows = [];
    this.talukaRows = [];
    this.hasSearched = false;
    this.selectedState = null;
    this.selectedMonth = null;
    this.selectedYear = null;
    this.selectedUploadId = null;
    this.filterSubmitted = false;
  }

  private buildBDRCPayload(row: BDRCRow, isEdit: string): any {
    return {
      uploadId: this.selectedUploadId,
      month: Number(this.selectedMonth),
      year: this.selectedYear,
      stateName: (row as any).StateName,
      dealerCode: (row as any).DealerCode,
      dealerName: (row as any).DealerName,
      status: (row as any).Status,
      batchId: (row as any).BatchId,
      billPlan_W1: (row as any).BillPlan_W1, billPlan_W2: (row as any).BillPlan_W2,
      billPlan_W3: (row as any).BillPlan_W3, billPlan_W4: (row as any).BillPlan_W4, billPlan_W5: (row as any).BillPlan_W5,
      delPlan_W1: (row as any).DelPlan_W1, delPlan_W2: (row as any).DelPlan_W2,
      delPlan_W3: (row as any).DelPlan_W3, delPlan_W4: (row as any).DelPlan_W4, delPlan_W5: (row as any).DelPlan_W5,
      retPlan_W1: (row as any).RetPlan_W1, retPlan_W2: (row as any).RetPlan_W2,
      retPlan_W3: (row as any).RetPlan_W3, retPlan_W4: (row as any).RetPlan_W4, retPlan_W5: (row as any).RetPlan_W5,
      collPlan_W1: (row as any).CollPlan_W1, collPlan_W2: (row as any).CollPlan_W2,
      collPlan_W3: (row as any).CollPlan_W3, collPlan_W4: (row as any).CollPlan_W4, collPlan_W5: (row as any).CollPlan_W5,
      bgPlan_W1: (row as any).BGPlan_W1, bgPlan_W2: (row as any).BGPlan_W2,
      bgPlan_W3: (row as any).BGPlan_W3, bgPlan_W4: (row as any).BGPlan_W4, bgPlan_W5: (row as any).BGPlan_W5,
      IsEdit: isEdit
    };
  }

  private buildForecastPayload(row: ForecastRow, isEdit: string): any {
    return {
      uploadId: this.selectedUploadId,
      month: Number(this.selectedMonth),
      year: this.selectedYear,
      stateName: row.StateName,
      batchId: row.BatchId,
      modelCode: row.ModelCode,
      modelName: row.ModelName,
      w1_BillingPlan: row.W1_BillingPlan,
      w2_BillingPlan: row.W2_BillingPlan,
      w3_BillingPlan: row.W3_BillingPlan,
      w4_BillingPlan: row.W4_BillingPlan,
      w5_BillingPlan: row.W5_BillingPlan,
      total_BillingPlan: row.Total_BillingPlan,
      isEdit: isEdit
    };
  }

  private buildTalukaPayload(row: TalukaRow, isEdit: string): any {
    return {
      uploadId: this.selectedUploadId,
      stateName: row.StateName,
      districtName: (row as any).DistrictName,
      talukaName: row.TalukaName,
      batchId: row.BatchId,
      dealerCode: (row as any).DealerCode,
      industry_LY: (row as any).Industry_LY,
      isEdit: isEdit
    };
  }

  onStateChanges(mail: string): void {
    this.selectedAM = ''; this.selectedTM = '';
    this.apis.getHOFilter({ ShMail: mail, AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.')
    });
  }

  onAreaChange(mail: string): void {
    this.selectedTM = '';
    this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: mail, TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.')
    });
  }

  onTerritoryChange(mail: string): void {
    this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: this.selectedAM, TmMail: mail, DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.')
    });
  }

  GetStateHeadByState(StateName: string | null): void {
    this.bdrcRows = [];
    this.forecastRows = [];
    this.talukaRows = [];
    this.hasSearched = false;
    
    this.apis.GetStateHeadByState({ stateName: StateName }).subscribe(
      {

        next: (data) => {
        
          this.apiresponse = data as filterApisResponse;
          if (this.apiresponse.message?.toLowerCase() === 'success') {
            this.stateHead = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.stateHead || [])];
            this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
            this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];

          }
        },
        error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.')
      }
    )
  }

  canEditPricePosition(row: any): boolean {
    // Sirf pending rows editable hain
    return row.IsCommited !== 1 && row.IsCommited !== -1;
  }

  canEditPricePositionv1(row: any): boolean {
    // Sirf pending rows editable hain
    return row.IsCommited !== -1;
  }

  approvePricePosition(row: any): void {
    const request = {
      iDs: [row.Id],
      isCommited: 1,
      remark: null
    };
   

    this.apis.approvalPricePosition(request).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          row.IsCommited = 1;
          row.pendingon = 'No';
          this.apis.showAlert('success', 'Approved', 'Record approved successfully.');
        } else {
          this.apis.showAlert('error', 'Error', res?.message || 'Approval failed.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'Something went wrong.');
      }
    });
  }

  approveAllPricePosition(): void {
    const pendingRows = this.pricePositionRows.filter(r => this.canEditPricePosition(r));
    if (pendingRows.length === 0) return;

    const requests = {
      iDs: pendingRows.map(row => row.Id),
      isCommited: 1,
      remark: null
    };
    

    this.apis.approvalPricePosition(requests).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          pendingRows.forEach(row => {
            row.IsCommited = 1;
            row.pendingon = 'No';
          });
          this.apis.showAlert('success', 'Approved', 'All records approved successfully.');
        } else {
          this.apis.showAlert('error', 'Error', res?.message || 'Approval failed.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'Something went wrong.');
      }
    });
  }

  openRejectModalPrice(row: any): void {
    this.selectedRejectRow = row;
    this.rejectRemark = '';
    this.rejectRemarkError = false;
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedRejectRow = null;
    this.rejectRemark = '';
    this.rejectRemarkError = false;
  }

  confirmRejectPricePosition(): void {
    if (!this.rejectRemark?.trim()) {
      this.rejectRemarkError = true;
      return;
    }
    const request = {
      iDs: [this.selectedRejectRow.Id],
      isCommited: -1,
      remark: this.rejectRemark.trim()
    };
    

    this.apis.approvalPricePosition(request).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.selectedRejectRow.IsCommited = -1;
          this.selectedRejectRow.Remark = this.rejectRemark.trim();
          this.selectedRejectRow.pendingon = 'No';
          this.closeRejectModal();
          this.apis.showAlert('success', 'Rejected', 'Record rejected successfully.');
        } else {
          this.apis.showAlert('error', 'Error', res?.message || 'Rejection failed.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'Something went wrong.');
      }
    });
  }

  rejectAllPricePosition(): void {
    //debugger;
    const pendingRows = this.pricePositionRows.filter(r => this.canEditPricePosition(r));
    if (pendingRows.length === 0) return;

    // Reject all ke liye ek common remark lo
    const remark = prompt('Enter rejection reason for all records:');
    if (!remark?.trim()) return;
    const requests = {
      iDs: pendingRows.map(row => row.Id),
      isCommited: -1,
      remark: remark?.trim() || null
    };
   

    this.apis.approvalPricePosition(requests).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          pendingRows.forEach(row => {
            row.IsCommited = -1;
            row.Remark = remark.trim();
            row.pendingon = 'No';
          });
          this.apis.showAlert('success', 'Rejected', 'All records rejected successfully.');
        } else {
          this.apis.showAlert('error', 'Error', res?.message || 'Rejection failed.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'Something went wrong.');
      }
    });
  }

  startEditPricePosition(index: number): void {
    //debugger;
    const row = this.pricePositionRows[index];
    if (!this.canEditPricePositionv1(row))
      return;
    row._original = {
      BOM: row.BOM,
      NDP: row.NDP,
      ACC: row.ACC,
      Freight: row.Freight,
      DM: row.DM,
      MOP: row.MOP,
      AvgVolPerMonth: row.AvgVolPerMonth,
      OfferPrice: row.offerPrice


    };
    row._editing = true;
    row._dirty = false;
    row._dirty = false;
  }

  cancelEditPricePosition(index: number): void {
    const row = this.pricePositionRows[index];
    if (row._original) {
      Object.assign(row, row._original);
    }
    row._editing = false;
    row._dirty = false;
    row._original = null;
  }

  cancelAllEditsPricePosition(): void {
    this.pricePositionRows.forEach((row: any, i: number) => {
      if (row._editing) this.cancelEditPricePosition(i);
    });
  }

  onPricePositionCellChange(row: any): void {
    row._dirty = true;
  }

  saveAllPricePosition(): void {
    const dirtyRows = this.pricePositionRows.filter((r: any) => r._editing && r._dirty);
    if (dirtyRows.length === 0) return;
 

    const requests = dirtyRows.map((row: any) => ({
      id: row.Id,
      stateName: row.StateName,
      hpRange: row.HPRange,
      hp: row.SubHPRange,
      make: row.Make,
      bom: row.Model,

      variantCode: row.BOM,

      ndp: row.NDP ? Number(row.NDP) : 0,
      accessories: row.ACC ? Number(row.ACC) : 0,
      freight: row.Freight ? Number(row.Freight) : 0,
      dlrMargin: row.DM ? Number(row.DM) : 0,
      mop: row.MOP ? Number(row.MOP) : 0,

      avgVolPerMonth: row.AvgVolPerMonth ? Number(row.AvgVolPerMonth) : 0,

      mopProof: '',
      rcCopy: '',
      driveType: row.Drive,
      implementPrice: row.implementPrice ? Number(row.implementPrice) : 0,
      rtoInsurance: row.rtoInsurance ? Number(row.rtoInsurance) : 0,
      offerPrice: row.offerPrice ? Number(row.offerPrice) : 0
    }));

    //console.log("SaveAll PricePosition", JSON.stringify(requests));
    this.isSavingAllPricePosition = true;

    // API call yahan:
    this.apis.updatePricePosition(requests).subscribe({
      next: (res: any) => {
    
        if (res?.message?.toLowerCase() === 'success') {
          dirtyRows.forEach((row: any) => {
            row._editing = false;
            row._dirty = false;
            row._original = null;
            row.pendingon = 'No';
          });
          this.apis.showAlert('success', 'Saved', 'Changes saved successfully.');
        } else {
          this.apis.showAlert('error', 'Error', res?.message || 'Save failed.');
        }
        this.isSavingAllPricePosition = false;
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'Something went wrong.');
        this.isSavingAllPricePosition = false;
      }
    });

    // Temporary (API se pehle test ke liye):
    setTimeout(() => {
      dirtyRows.forEach((row: any) => {
        row._editing = false;
        row._dirty = false;
        row._original = null;
      });
      this.isSavingAllPricePosition = false;
    }, 500);
  }
}
