import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { timeout } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import { FtrOption, FtrReportColumn, FtrReportRequest, FtrReportRow } from '../../../model/apiresponse';

@Component({
  selector: 'app-ftr-report',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './ftr-report.component.html',
  styleUrl: './ftr-report.component.css'
})
export class FtrReportComponent implements OnInit {

  readonly durationOptions = ['This Month', 'This Quarter', 'Last Quarter', 'This FY', 'Custom'];

  readonly columns: FtrReportColumn[] = [
    { key: 'srNo', label: 'Sr No' },
    { key: 'SSEName', label: 'Name of SSE' },
    { key: 'stockType', label: 'Stock Type', type: 'stock' },
    { key: 'DealerCode', label: 'Dealer Code' },
    { key: 'DealerName', label: 'Dealer Name' },
    { key: 'DealerAddress', label: 'Dealer Address', wide: true },
    { key: 'TractorModelBOMCode', label: 'Tractor Model (BOM Code)' },
    { key: 'TractorSerialNo', label: 'Tractor Sl. No. (Chassis No)' },
    { key: 'FailureDate', label: 'Date of Failure', type: 'date' },
    { key: 'HoursWorked', label: 'Hours Worked' },
    { key: 'RepairDate', label: 'Date of Repair', type: 'date' },
    { key: 'NatureOfWorkDone', label: 'Nature of Work Done' },
    { key: 'ImplementTrolleySize', label: 'Implement / Trolley Size' },
    { key: 'CustomerName', label: 'Customer Name' },
    { key: 'CustomerAddress', label: 'Customer Address', wide: true },
    { key: 'MobileNo', label: 'Mobile No' },
    { key: 'Village', label: 'Village' },
    { key: 'Post', label: 'Post Office' },
    { key: 'District', label: 'District' },
    { key: 'CustomerComplaints', label: 'Customer Complaints', wide: true },
    { key: 'ProblemDefinition', label: 'Problem Definition', wide: true }
  ];

  private readonly LIST_TIMEOUT_MS = 60000;

  // ─── Filters ───
  selectedDuration = 'This Month';
  startDate = '';
  endDate = '';
  selectedState = '';
  chassisSearch = '';
  stateList: FtrOption[] = [];
  stateLoading = false;
  appliedRange = { start: '', end: '' };

  // ─── List ───
  reportRows: FtrReportRow[] = [];
  loading = false;
  exporting = false;
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  private requestId = 0;

  constructor(private apis: AuthService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getStateList();
    this.applyRange();
    this.fetchReport(1);
  }

  // ─── HELPERS ────────────────────────────────────────────────

  private toYMD(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private getDateRange(period: string): { start: string; end: string } {
    const now = new Date();
    const qStartMonth = Math.floor(now.getMonth() / 3) * 3;   // current quarter ka pehla month

    switch (period) {
      case 'This Month':
        return { start: this.toYMD(new Date(now.getFullYear(), now.getMonth(), 1)), end: this.toYMD(now) };

      case 'This Quarter':
        return { start: this.toYMD(new Date(now.getFullYear(), qStartMonth, 1)), end: this.toYMD(now) };

      case 'Last Quarter': {
        const start = new Date(now.getFullYear(), qStartMonth - 3, 1);   // negative month = pichla saal, JS khud handle karta hai
        const end = new Date(now.getFullYear(), qStartMonth, 0);         // current quarter se ek din pehle
        return { start: this.toYMD(start), end: this.toYMD(end) };
      }

      case 'This FY': {
        const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;   // 1 April se
        return { start: this.toYMD(new Date(fyStartYear, 3, 1)), end: this.toYMD(now) };
      }

      default:   // Custom
        return { start: this.startDate, end: this.endDate };
    }
  }

  private applyRange(): void {
    this.appliedRange = this.getDateRange(this.selectedDuration);
  }

  private extractTotalCount(res: any): number | null {
    const candidates = [
      res?.data?.[0]?.TotalCount, res?.data?.[0]?.totalCount,
      res?.totalCount, res?.TotalCount, res?.totalRecords, res?.TotalRecords
    ];
    for (const c of candidates) {
      const n = Number(c);
      if (c !== undefined && c !== null && !isNaN(n) && n >= 0) return n;
    }
    return null;
  }

  private formatDate(value: string | null): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return value || '-';
    const [y, m, d] = value.substring(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }

  getStockType(row: FtrReportRow): 'IN' | 'OUT' {
    return row.StockMasterId ? 'IN' : 'OUT';
  }

  cellValue(row: FtrReportRow, col: FtrReportColumn, index: number): string {
    if (col.key === 'srNo') return String((this.currentPage - 1) * this.itemsPerPage + index + 1);
    if (col.key === 'stockType') return this.getStockType(row) === 'IN' ? 'In Stock' : 'Sold';
    const v = row[col.key as keyof FtrReportRow];
    if (col.type === 'date') return this.formatDate(v as string | null);
    return v !== null && v !== undefined && v !== '' ? String(v) : '-';
  }

  private buildRequest(pageNo: number, isDownload: boolean): FtrReportRequest {
    return {
      pageNo,
      duration: this.selectedDuration,
      stDate: this.appliedRange.start,
      enDate: this.appliedRange.end,
      stateId: this.selectedState,
      chassisNo: this.chassisSearch.trim(),
      isDownload
    };
  }

  private validateFilters(): boolean {
    if (this.selectedDuration !== 'Custom') return true;
    if (!this.startDate || !this.endDate) {
      this.toastr.warning('Please select start and end date.', 'Validation');
      return false;
    }
    if (this.startDate > this.endDate) {
      this.toastr.warning('Start date cannot be after end date.', 'Validation');
      return false;
    }
    return true;
  }

  // ─── STATE LIST ─────────────────────────────────────────────

  getStateList(): void {
    this.stateLoading = true;
    this.apis.getStateListReportNew().subscribe({
      next: (res: any) => {
        const list = res?.data || [];
        this.stateList = list.map((s: any) => {
          const label = s.stateName ?? '';
          const value = s.stateCode ?? '';
          return { label, value };
        });
        this.stateLoading = false;
      },
      error: () => {
        this.stateLoading = false;
        this.toastr.error('Failed to load states.', 'Error');
      }
    });
  }

  // ─── FILTER EVENTS ──────────────────────────────────────────

  onDurationChange(): void {
    if (this.selectedDuration !== 'Custom') {
      this.startDate = '';
      this.endDate = '';
    }
  }

  onShowReport(): void {
    if (!this.validateFilters()) return;
    this.applyRange();
    this.totalItems = 0;
    this.fetchReport(1);
  }

  clearSearch(): void {
    this.chassisSearch = '';
    this.onShowReport();
  }

  onPageChange(page: number): void {
    this.fetchReport(page);
  }

  // ─── REPORT LIST ────────────────────────────────────────────

  fetchReport(page: number = 1): void {
    const reqId = ++this.requestId;
    this.loading = true;
    this.reportRows = [];

    this.apis.getFTRReport(this.buildRequest(page, false))
      .pipe(timeout(this.LIST_TIMEOUT_MS))
      .subscribe({
        next: (res: any) => {
          if (reqId !== this.requestId) return;

          const rows: FtrReportRow[] = Array.isArray(res?.data) ? res.data : [];
          const total = this.extractTotalCount(res);

          if (page === 1 && rows.length > 0 && total !== null && total > rows.length) {
            this.itemsPerPage = rows.length;
          }

          this.totalItems = total !== null
            ? total
            : (page - 1) * this.itemsPerPage + rows.length + (rows.length >= this.itemsPerPage ? 1 : 0);

          this.reportRows = rows;
          this.currentPage = page;
          this.loading = false;
        },
        error: (err) => {
          if (reqId !== this.requestId) return;
          this.loading = false;
          this.reportRows = [];
          this.toastr.error(
            err?.name === 'TimeoutError'
              ? 'Loading is taking too long. Please check your connection and try again.'
              : (err?.error?.message || 'Failed to fetch FTR report data.'),
            'Error'
          );
        }
      });
  }

  // ─── EXPORT ─────────────────────────────────────────────────

  exportToExcel(): void {
    if (!this.validateFilters()) return;
    this.applyRange();
    this.exporting = true;

    this.apis.getFTRReport(this.buildRequest(1, true))
      .pipe(timeout(this.LIST_TIMEOUT_MS))
      .subscribe({
        next: (res: any) => {
          this.exporting = false;
          const rows: FtrReportRow[] = Array.isArray(res?.data) ? res.data : [];
          if (!rows.length) {
            this.toastr.info('No data found for the selected filters.', 'No Data');
            return;
          }

          const sheetData = rows.map((r, i) => {
            const obj: Record<string, string | number> = {};
            this.columns.forEach(c => {
              obj[c.label] = c.key === 'srNo' ? i + 1 : this.cellValue(r, c, i);
            });
            return obj;
          });

          const worksheet = XLSX.utils.json_to_sheet(sheetData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'FTR Report');
          const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          saveAs(new Blob([wbout], { type: 'application/octet-stream' }),
            `FTR_Report_${this.toYMD(new Date())}.xlsx`);
          this.toastr.success(`${rows.length} records exported.`, 'Success');
        },
        error: () => {
          this.exporting = false;
          this.toastr.error('Failed to export. Please try again.', 'Error');
        }
      });
  }
}
