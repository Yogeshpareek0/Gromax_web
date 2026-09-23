import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PDIResponse } from '../../../model/apiresponse'
import { PDIReport } from '../../../model/apiresponse'
import { PdiDataResponse } from '../../../model/apiresponse'
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-pdi-report',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './pdi-report.component.html',
  styleUrl: './pdi-report.component.css'
})
export class PdiReportComponent implements OnInit, OnDestroy {

  pdiData: PDIReport[] = [];
  apiResponse: PDIResponse = {
    statusCode: 0, message: '', data: {
      countResponse: {
        totalTractorsCount: 0,
        pdiPendingCount: 0,
        pdiCompletedCount: 0,
        defectFoundCount: 0
      },
      pdiReport: []
    }
  };
  paginatedPDIData: PDIReport[] = [];

  selectedFilter: string = 'This Month';
  startdate_val: string = '';
  enddate_val: string = '';
  displayDateInputs: boolean = false;
  selectedState: string = '';
  selectedDealer: string = '';
  selectedSection: string = '';
  selectedChassis: string = '';
  statelist: any[] = [];
  dealerlist: any[] = [];

  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;


  totalTractorsCount: number = 0;
  pdiPendingCount: number = 0;
  pdiCompletedCount: number = 0;
  defectFoundCount: number = 0;

  currentFilterCol = '';
  filterSearchText = '';
  allDropdownValues: string[] = [];
  filteredDropdownValues: string[] = [];
  tempSelectedValues: Set<string> = new Set();
  activeFilters: Map<string, Set<string>> = new Map();

  freezePanelOpen = false;
  frozenColumnKeys: Set<string> = new Set();
  frozenLeftMap: Map<string, number> = new Map();

  customizePanelOpen = false;
  hiddenColumns: Set<string> = new Set();

  allTableColumns = [
    { key: 'DealerCode', label: 'Dealer Code' },
    { key: 'DealerName', label: 'Dealer Name' },
    { key: 'StateName', label: 'State' },
    { key: 'ModelCode', label: 'Model Code' },
    { key: 'ModelName', label: 'Model Name' },
    { key: 'engineNo', label: 'Engine No' },
    { key: 'runningHours', label: 'Running Hours' },
    { key: 'Name', label: 'Issue' },
    { key: 'section', label: 'Section' },
    { key: 'brand', label: 'Brand' },
    { key: 'remark', label: 'Remark' },
    { key: 'photo1', label: 'Photo 1' },
    { key: 'photo2', label: 'Photo 2' },
    { key: 'pdiDate', label: 'PDI Date' },
    { key: 'chasisno', label: 'Chassis No' },
  ];

  freezableColumns = [
    { key: 'sno', label: 'S.No.' },
    { key: 'DealerCode', label: 'Dealer Code' },
    { key: 'DealerName', label: 'Dealer Name' },
    { key: 'ModelName', label: 'Model Name' },
    { key: 'engineNo', label: 'Engine No' },
    { key: 'section', label: 'Section' },
  ];

  private colLabelMap: Map<string, string> = new Map([
    ['sno', 'S.No.'],
    ['DealerCode', 'Dealer Code'],
    ['DealerName', 'Dealer Name'],
    ['StateName', 'State'],
    ['ModelCode', 'Model Code'],
    ['ModelName', 'Model Name'],
    ['engineNo', 'Engine No'],
    ['runningHours', 'Running Hours'],
    ['Name', 'Issue'],
    ['section', 'Section'],
    ['brand', 'Brand'],
    ['remark', 'Remark'],
    ['pdiDate', 'PDI Date'],
    ['chasisno', 'Chassis No'],
  ]);

  private colWidths: Map<string, number> = new Map([
    ['sno', 60],
    ['DealerCode', 110],
    ['DealerName', 160],
    ['StateName', 100],
    ['ModelCode', 120],
    ['ModelName', 140],
    ['engineNo', 130],
    ['runningHours', 110],
    ['Name', 200],
    ['section', 100],
    ['brand', 100],
    ['remark', 150],
    ['pdiDate', 130],
    ['chasisno', 100],
  ]);

  private orderedColKeys = [
    'sno', 'DealerCode', 'DealerName', 'StateName', 'ModelCode', 'ModelName',
    'engineNo', 'runningHours', 'Name', 'section', 'brand', 'remark', 'pdiDate','chasisno'
  ];

  @ViewChild('filterDropdownEl') filterDropdownElRef!: ElementRef<HTMLElement>;
  @ViewChild('tableWrapper') tableWrapperRef!: ElementRef<HTMLElement>;

  private activeFilterBtn: HTMLElement | null = null;
  private tableScrollListener: (() => void) | null = null;

  constructor(
    private http: HttpClient,
    private apis: AuthService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.getPDIReport();
    this.getStateListNew();
    this.allDealerList();

    setTimeout(() => {
      const wrapper = this.tableWrapperRef?.nativeElement;
      if (wrapper) {
        this.tableScrollListener = () => this.onTableScroll();
        wrapper.addEventListener('scroll', this.tableScrollListener, { passive: true });
      }
    }, 300);
  }

  ngOnDestroy(): void {
    const wrapper = this.tableWrapperRef?.nativeElement;
    if (wrapper && this.tableScrollListener) {
      wrapper.removeEventListener('scroll', this.tableScrollListener);
    }
  }

  private onTableScroll(): void {
    if (!this.activeFilterBtn) return;
    const dd = this.filterDropdownElRef?.nativeElement;
    if (!dd) return;

    const wrapper = this.tableWrapperRef.nativeElement;
    const wRect = wrapper.getBoundingClientRect();
    const btnRect = this.activeFilterBtn.getBoundingClientRect();

    const isFullyVisible =
      btnRect.left >= wRect.left &&
      btnRect.right <= wRect.right &&
      btnRect.top >= wRect.top &&
      btnRect.bottom <= wRect.bottom;

    if (!isFullyVisible) {
      dd.style.display = 'none';
      this.activeFilterBtn = null;
    } else {
      const newTop = btnRect.bottom + 4;
      const newLeft = Math.min(Math.max(btnRect.left, wRect.left), window.innerWidth - 224);
      dd.style.top = newTop + 'px';
      dd.style.left = newLeft + 'px';
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.onTableScroll();
  }

  @HostListener('document:click', ['$event'])
  onGlobalClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const inFreezePanel = target.closest('.tool-panel') || target.closest('.btn-freeze');
    const inCustomizePanel = target.closest('.tool-panel') || target.closest('.btn-customize');
    if (!inFreezePanel) this.freezePanelOpen = false;
    if (!inCustomizePanel) this.customizePanelOpen = false;
    this.closeFilterDropdown();
  }

  private closeFilterDropdown(): void {
    const dd = this.filterDropdownElRef?.nativeElement;
    if (dd) dd.style.display = 'none';
    this.activeFilterBtn = null;
  }

  get displayData(): PDIReport[] {
    if (this.activeFilters.size === 0) return this.paginatedPDIData;
    return this.paginatedPDIData.filter(item => {
      for (const [col, vals] of this.activeFilters.entries()) {
        const cellVal = String((item as any)[col] ?? '');
        if (!vals.has(cellVal)) return false;
      }
      return true;
    });
  }

  openColumnFilter(event: MouseEvent, col: string): void {
    event.stopPropagation();

    const dd = this.filterDropdownElRef?.nativeElement;
    const btn = event.currentTarget as HTMLElement;

    if (this.activeFilterBtn === btn && dd?.style.display === 'block') {
      this.closeFilterDropdown();
      return;
    }

    this.currentFilterCol = col;
    this.activeFilterBtn = btn;

    const allVals = [...new Set(
      this.paginatedPDIData.map(item => {
        const v = (item as any)[col];
        return v != null ? String(v) : '';
      })
    )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    this.allDropdownValues = allVals;
    this.filteredDropdownValues = [...allVals];
    this.filterSearchText = '';
    const existing = this.activeFilters.get(col);
    this.tempSelectedValues = existing ? new Set(existing) : new Set(allVals);

    if (dd) {
      const wrapper = this.tableWrapperRef.nativeElement;
      const wRect = wrapper.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      dd.style.top = (btnRect.bottom + 4) + 'px';
      dd.style.left = Math.min(Math.max(btnRect.left, wRect.left), window.innerWidth - 224) + 'px';
      dd.style.display = 'block';
    }

    this.cdr.detectChanges();
  }

  onFilterSearch(): void {
    const q = this.filterSearchText.toLowerCase();
    this.filteredDropdownValues = this.allDropdownValues.filter(v => v.toLowerCase().includes(q));
  }

  toggleFilterValue(val: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.tempSelectedValues.add(val);
    else this.tempSelectedValues.delete(val);
  }

  selectAllFilterValues(): void {
    this.tempSelectedValues = new Set(this.allDropdownValues);
    this.filteredDropdownValues = [...this.allDropdownValues];
    this.filterSearchText = '';
  }

  clearAllFilterValues(): void {
    this.tempSelectedValues = new Set();
  }

  applyColumnFilter(): void {
    if (this.tempSelectedValues.size === 0 || this.tempSelectedValues.size === this.allDropdownValues.length) {
      this.activeFilters.delete(this.currentFilterCol);
    } else {
      this.activeFilters.set(this.currentFilterCol, new Set(this.tempSelectedValues));
    }
    this.closeFilterDropdown();
    this.cdr.detectChanges();
  }

  cancelFilter(): void {
    this.closeFilterDropdown();
  }

  getActiveFilterCols(): string[] { return [...this.activeFilters.keys()]; }

  getFilterSummary(col: string): string {
    const vals = this.activeFilters.get(col);
    if (!vals) return '';
    const arr = [...vals];
    return arr.length <= 2 ? arr.join(', ') : `${arr[0]}, ${arr[1]} +${arr.length - 2} more`;
  }

  removeFilter(col: string): void {
    this.activeFilters.delete(col);
    this.cdr.detectChanges();
  }

  clearAllFilters(): void {
    this.activeFilters.clear();
    this.cdr.detectChanges();
  }

  getColumnLabel(key: string): string {
    return this.colLabelMap.get(key) ?? key;
  }

  toggleFreezePanel(event: MouseEvent): void {
    event.stopPropagation();
    this.freezePanelOpen = !this.freezePanelOpen;
    this.customizePanelOpen = false;
  }

  toggleFreezeColumn(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.frozenColumnKeys.add(key);
    else this.frozenColumnKeys.delete(key);
    this.recalcFrozenLeft();
  }

  clearAllFreeze(): void {
    this.frozenColumnKeys.clear();
    this.frozenLeftMap.clear();
  }

  private recalcFrozenLeft(): void {
    this.frozenLeftMap.clear();
    let offset = 0;
    for (const key of this.orderedColKeys) {
      if (this.frozenColumnKeys.has(key)) {
        this.frozenLeftMap.set(key, offset);
        offset += this.colWidths.get(key) ?? 120;
      }
    }
  }

  getFrozenLeft(colKey: string): number {
    return this.frozenLeftMap.get(colKey) ?? 0;
  }

  toggleCustomizePanel(event: MouseEvent): void {
    event.stopPropagation();
    this.customizePanelOpen = !this.customizePanelOpen;
    this.freezePanelOpen = false;
  }

  toggleColumnVisibility(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.hiddenColumns.delete(key);
    else this.hiddenColumns.add(key);
  }

  showAllColumns(): void {
    this.hiddenColumns.clear();
  }

  onShowReport(): void {
    this.activeFilters.clear();
    this.getPDIReport();
  }

  getPDIReport(page: number = 1): void {
    const offset = (page - 1) * this.itemsPerPage;
    //const { startDateISO, endDateISO } = this.getDateRange();
    this.paginatedPDIData = [];
    this.totalItems = 0;

    //this.totalTractorsCount = 0;
    //this.pdiPendingCount = 0;
    //this.pdiCompletedCount = 0;
    //this.defectFoundCount = 0;

    const request = {
      state: this.selectedState || '',
      dealerCode: this.selectedDealer || '',
      duration: this.selectedFilter || '',
      stDate: this.startdate_val,
      enDate: this.enddate_val,
      pageSize: this.itemsPerPage,
      rowStart: offset,
      chasisNo: this.selectedChassis
    };

    this.apis.getPDIReport(request).subscribe({
      next: (res) => {
        this.apiResponse = res as PDIResponse;
        if (this.apiResponse.message?.toLowerCase() === 'success') {

          this.totalTractorsCount = this.apiResponse.data?.countResponse?.totalTractorsCount;
          this.pdiPendingCount = this.apiResponse.data?.countResponse?.pdiPendingCount;
          this.pdiCompletedCount = this.apiResponse.data?.countResponse?.pdiCompletedCount;
          this.defectFoundCount = this.apiResponse.data?.countResponse?.defectFoundCount;

          if (this.apiResponse && this.apiResponse.data?.pdiReport?.length > 0) {
            this.paginatedPDIData = this.apiResponse.data?.pdiReport;
            this.totalItems = this.apiResponse.data?.pdiReport[0].length;

            this.currentPage = page;
          }
          else {
            this.toastr.info(
              'No PDI Data are available at the moment.',
            );

          }

          //console.log('paginatedPDIData', this.paginatedPDIData);
        } else {
          this.toastr.error('Failed fetching PDI data.', 'Error!');
         /* this.apis.showAlert('error', 'Error!', 'Failed fetching PDI data.');*/
        }
      },
      error: () => {
        this.toastr.error('An error occurred while fetching PDI data.', 'Error!');
        /*this.apis.showAlert('error', 'Error!', 'An error occurred while fetching PDI data.');*/
      }
    });
  }

  //private getDateRange(): { startDateISO: string; endDateISO: string } {
  //  let s = '', e = '';
  //  const now = new Date();

  //  if (this.selectedFilter === 'Month') {
  //    s = this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
  //    e = this.formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  //  } else if (this.selectedFilter === 'Quarter') {
  //    const q = Math.floor(now.getMonth() / 3);
  //    s = this.formatDate(new Date(now.getFullYear(), q * 3, 1));
  //    e = this.formatDate(new Date(now.getFullYear(), (q + 1) * 3, 0));
  //  } else if (this.selectedFilter === 'Custom') {
  //    s = this.startdate_val; e = this.enddate_val;
  //  }

  //  return { startDateISO: s, endDateISO: e };
  //}

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }

  onPageChange(page: number): void {
    this.getPDIReport(page);
  }

  exportToExcel(): void {
    if (!this.paginatedPDIData?.length) {
      this.apis.showAlert('info', 'No Data', 'No data found to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(this.paginatedPDIData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PDIReport');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `PDIReport_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  searchValue(): void {
    this.currentPage = 1;
    this.getPDIReport();
  }

  getStateListNew(): void {
    this.apis.getStateListReportNew().subscribe({
      next: (data: any) => {
        this.statelist = (data.data ?? []).filter(
          (x: any) => x.stateCode != null
        );
      },
      error: () => {
        this.apis.showAlert(
          'error',
          'Error!',
          'Error fetching dealer state.'
        );
      }
    });
  }

  datefilterchange(value: string): void {
    this.displayDateInputs = value === 'Custom';
    if (!this.displayDateInputs) { this.startdate_val = ''; this.enddate_val = ''; }
  }


  allDealerList(): void {
    this.apis.allDealerList(1).subscribe({
      next: (data: any) => {
        this.dealerlist = data.data ?? [];
      },
      error: () => {
        this.apis.showAlert(
          'error',
          'Error!',
          'Error fetching dealer dealer.'
        );
      }
    });
  }
  viewPhoto(photoUrl: string) {
    window.open(photoUrl, '_blank');
  }
}
