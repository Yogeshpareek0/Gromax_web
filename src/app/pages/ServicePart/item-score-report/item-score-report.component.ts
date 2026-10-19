import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { timeout } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import { DealerOption, ItemScoreColumn, ItemScoreReportRow } from '../../../model/apiresponse';

@Component({
  selector: 'app-item-score-report',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './item-score-report.component.html',
  styleUrl: './item-score-report.component.css'
})
export class ItemScoreReportComponent implements OnInit {

  readonly halfYearOptions = [
    { label: 'Apr - Sep', value: 1 },
    { label: 'Oct - Mar', value: 2 }
  ];

  private readonly FIXED_KEYS = [
    'StateName', 'DealerCode', 'DealerName', 'Location',
    'TotalGetScore', 'MaxScore', 'Percentage', 'TotalCount'
  ];
  private readonly TIMEOUT_MS = 60000;

  // ─── Filters ───
  dealerList: DealerOption[] = [];
  dealerLoading = false;
  selectedDealer: string | null = null;   // null = All
  yearOptions: number[] = [];
  selectedYear!: number;
  selectedHalfYear!: number;

  // ─── Data ───
  allRows: ItemScoreReportRow[] = [];
  scoreColumns: ItemScoreColumn[] = [];
  maxTotal = 0;
  loading = false;
  exporting = false;
  private requestId = 0;

  // ─── Pagination (client side) ───
  currentPage = 1;
  itemsPerPage = 20;

  constructor(private apis: AuthService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.initYearAndHalf();
    this.getDealerList();
    this.fetchReport();
  }

  // ─── INIT ───────────────────────────────────────────────────

  private initYearAndHalf(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    this.yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);   // current + past 5
    this.selectedYear = currentYear;
    this.selectedHalfYear = now.getMonth() >= 3 && now.getMonth() <= 8 ? 1 : 2;  // Apr–Sep = 1, warna 2
  }

  getDealerList(): void {
    this.dealerLoading = true;
    this.apis.allDealerList(1).subscribe({
      next: (res: any) => {
        this.dealerList = (res?.data || []) as DealerOption[];
        this.dealerLoading = false;
      },
      error: () => {
        this.dealerLoading = false;
        this.toastr.error('Failed to load dealer list.', 'Error');
      }
    });
  }

  // ─── HELPERS ────────────────────────────────────────────────

  get halfYearLabel(): string {
    return this.halfYearOptions.find(h => h.value === this.selectedHalfYear)?.label ?? '';
  }

  get pagedRows(): ItemScoreReportRow[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.allRows.slice(start, start + this.itemsPerPage);
  }

  // "Envir-150" -> { label: "Envir", max: 150 }
  private parseScoreKey(key: string): ItemScoreColumn {
    const idx = key.lastIndexOf('-');
    const maxPart = idx > -1 ? Number(key.substring(idx + 1)) : NaN;
    return {
      key,
      label: idx > -1 && !isNaN(maxPart) ? key.substring(0, idx) : key,
      max: isNaN(maxPart) ? 0 : maxPart
    };
  }

  private buildScoreColumns(rows: ItemScoreReportRow[]): void {
    if (!rows.length) {
      this.scoreColumns = [];
      this.maxTotal = 0;
      return;
    }
    this.scoreColumns = Object.keys(rows[0])
      .filter(k => !this.FIXED_KEYS.includes(k))
      .map(k => this.parseScoreKey(k));
    this.maxTotal = Number(rows[0].MaxScore) || 0;
  }

  scoreValue(row: ItemScoreReportRow, key: string): number {
    const n = Number(row[key]);
    return isNaN(n) ? 0 : n;
  }

  getMaxScore(row: ItemScoreReportRow): number {
    return Number(row.MaxScore) || 0;
  }
  getTotal(row: ItemScoreReportRow): number {
    return Number(row.TotalGetScore) || 0;
  }

  getPercent(row: ItemScoreReportRow): number {
    const p = Number(row.Percentage);
    return isNaN(p) ? 0 : Math.round(p * 100) / 100;   // 33.3333333 -> 33.33
  }
  percentClass(row: ItemScoreReportRow): string {
    const p = this.getPercent(row);
    if (p >= 75) return 'pct-good';
    if (p >= 40) return 'pct-mid';
    return 'pct-low';
  }

  // ─── REPORT ─────────────────────────────────────────────────

  onShowReport(): void {
    this.fetchReport();
  }

  fetchReport(): void {
    const reqId = ++this.requestId;
    this.loading = true;
    this.allRows = [];
    this.currentPage = 1;

    this.apis.getItemScoreReport(this.selectedHalfYear, this.selectedYear, this.selectedDealer)
      .pipe(timeout(this.TIMEOUT_MS))
      .subscribe({
        next: (res: any) => {
          if (reqId !== this.requestId) return;
          const rows: ItemScoreReportRow[] = Array.isArray(res?.data) ? res.data : [];
          this.buildScoreColumns(rows);
          this.allRows = rows;
          this.loading = false;
        },
        error: (err) => {
          if (reqId !== this.requestId) return;
          this.loading = false;
          this.allRows = [];
          this.scoreColumns = [];
          this.toastr.error(
            err?.name === 'TimeoutError'
              ? 'Loading is taking too long. Please check your connection and try again.'
              : (err?.error?.message || 'Failed to fetch item score report.'),
            'Error'
          );
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // ─── EXPORT ─────────────────────────────────────────────────

  exportToExcel(): void {
    if (!this.allRows.length) {
      this.toastr.info('No data available to export.', 'No Data');
      return;
    }
    this.exporting = true;

    const sheetData = this.allRows.map((r, i) => {
      const obj: Record<string, string | number> = {
        'Sr No': i + 1,
        'State': r.StateName ?? '',
        'Dealer Code': r.DealerCode ?? '',
        'Dealer Name': r.DealerName ?? '',
        'Location': r.Location ?? ''
      };
      this.scoreColumns.forEach(c => obj[`${c.label} (${c.max})`] = this.scoreValue(r, c.key));
      obj['Total Score'] = this.getTotal(r);
      obj['Max Score'] = this.getMaxScore(r);
      obj['Percentage'] = this.getPercent(r);
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Item Score Report');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const half = this.selectedHalfYear === 1 ? 'Apr-Sep' : 'Oct-Mar';
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }),
      `Item_Score_Report_${half}_${this.selectedYear}.xlsx`);

    this.exporting = false;
    this.toastr.success(`${this.allRows.length} records exported.`, 'Success');
  }
}
