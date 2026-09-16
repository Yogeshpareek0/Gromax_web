import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { InventoryDataResponse, getApisResponse, InventoryData, filterApisResponse, PersonModel } from '../../model/apiresponse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-inventory-data',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './inventory-data.component.html',
  styleUrl: './inventory-data.component.css'
})
export class InventoryDataComponent implements OnInit, OnDestroy {

  inventryData: InventoryData[] = [];
  apiresponse: getApisResponse = { message: null, data: null };
  apiresponses: InventoryDataResponse = { message: null, data: [], totalCount: 0 };
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];
  locationlist: PersonModel[] = [];
  statelist: PersonModel[] = [];
  stateHead: PersonModel[] = [];
  dealerCode: any;
  selectedFilter: string = 'All';
  startdate_val: string = '';
  enddate_val: string = '';
  displayDateInputs: boolean = false;
  positionId: any;
  userName: any;

  showSH = false;
  showAM = false;
  showTM = false;
  showDealer = false;
  showLocation = false;
  showStatename = false;

  selectedSH: string = '';
  enquiryStatus: any = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = '';
  selectedLocation: string = '';
  selectedStateName: string = '';

  activeAging: string = '-';
  startDay: string = '';
  endDay: string = '';
  selectedType: string = 'In Stock';
  ChnageAfterFilterselectedType: string = '';
  Location: string = '';
  DlrCat: string = '';
  totalStockCount: number = 0;
  aging30_90_Count: number = 0;
  aging90_180_Count: number = 0;
  aging180_364_Count: number = 0;
  aging365Plus_Count: number = 0;
  paginatedInventryData: InventoryData[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

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
    { key: 'StateHead', label: 'SH Name' },
    { key: 'Am', label: 'AM Name' },
    { key: 'Tm', label: 'TM Name' },
    { key: 'DealerCode', label: 'Dealer Code' },
    { key: 'DealerName', label: 'Dealership Name' },
    { key: 'Location', label: 'Dealer Location' },
    { key: 'DlrCat', label: 'Dealer Category' },
    { key: 'BillingDate', label: 'Billing Date' },
    { key: 'TractorSrNumber', label: 'Tractor Sr.Number' },
    { key: 'Model', label: 'Model' },
    { key: 'DriveType', label: 'Drive Type' },
    { key: 'Colour', label: 'Colour' },
    { key: 'Aging', label: 'Stock Aging' },
    { key: 'chasisno', label: 'Chassis Number' },
    { key: 'Status', label: 'Status' },
  ];

  freezableColumns = [
    { key: 'sno', label: 'S.No.' },
    { key: 'StateHead', label: 'SH Name' },
    { key: 'Am', label: 'AM Name' },
    { key: 'Tm', label: 'TM Name' },
    { key: 'DealerCode', label: 'Dealer Code' },
    { key: 'DealerName', label: 'Dealership Name' },
    { key: 'Location', label: 'Dealer Location' },
    { key: 'DlrCat', label: 'Dealer Category' },
    { key: 'Model', label: 'Model' },
    { key: 'chasisno', label: 'Chassis Number' },
    { key: 'Status', label: 'Status' },
  ];

  private colLabelMap: Map<string, string> = new Map([
    ['sno', 'S.No.'], ['StateHead', 'SH Name'], ['Am', 'AM Name'], ['Tm', 'TM Name'],
    ['DealerCode', 'Dealer Code'], ['DealerName', 'Dealership Name'], ['Location', 'Dealer Location'],
    ['DlrCat', 'Dealer Category'], ['BillingDate', 'Billing Date'], ['TractorSrNumber', 'Tractor Sr.Number'],
    ['Model', 'Model'], ['DriveType', 'Drive Type'], ['Colour', 'Colour'],
    ['Aging', 'Stock Aging'], ['chasisno', 'Chassis Number'], ['Status', 'Status'],
  ]);

  private colWidths: Map<string, number> = new Map([
    ['sno', 60], ['StateHead', 120], ['Am', 120], ['Tm', 120],
    ['DealerCode', 110], ['DealerName', 160], ['Location', 130], ['DlrCat', 120],
    ['BillingDate', 120], ['TractorSrNumber', 140], ['Model', 120], ['DriveType', 100],
    ['Colour', 90], ['Aging', 110], ['chasisno', 150], ['Status', 90],
  ]);

  private orderedColKeys = [
    'sno', 'StateHead', 'Am', 'Tm', 'DealerCode', 'DealerName',
    'Location', 'DlrCat', 'BillingDate', 'TractorSrNumber',
    'Model', 'DriveType', 'Colour', 'Aging', 'chasisno', 'Status'
  ];

  @ViewChild('filterDropdownEl') filterDropdownElRef!: ElementRef<HTMLElement>;
  @ViewChild('tableWrapper') tableWrapperRef!: ElementRef<HTMLElement>;

  private activeFilterBtn: HTMLElement | null = null;
  private tableScrollListener: (() => void) | null = null;

  constructor(
    private http: HttpClient,
    private apis: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.dealerCode = sessionStorage.getItem('dealerCode');
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    const dealercode = sessionStorage.getItem('dealerCode');

    if (this.positionId === 'National Sales Head'||this.positionId === 'National Service Head') {
      this.showSH = true;
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;

    } else if (this.positionId === 'State Head') {
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;

    } else if (this.positionId === 'Area Manager') {
      this.showTM = true;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;

    } else if (this.positionId === 'Territory Manager') {
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;

    } else {
      this.selectedDealer = dealercode || '';
    }

    this.getinventory();
    this.getHOFilter();

    // Attach scroll listener after view is ready
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

    // Is ANY part of the button inside the wrapper's visible area?
    const visLeft = Math.max(btnRect.left, wRect.left);
    const visRight = Math.min(btnRect.right, wRect.right);
    const visTop = Math.max(btnRect.top, wRect.top);
    const visBottom = Math.min(btnRect.bottom, wRect.bottom);
    const isFullyVisible =
      btnRect.left >= wRect.left &&
      btnRect.right <= wRect.right &&
      btnRect.top >= wRect.top &&
      btnRect.bottom <= wRect.bottom;

    if (!isFullyVisible) {
      // Column scrolled out of view — immediately hide dropdown via direct DOM
      dd.style.display = 'none';
      this.activeFilterBtn = null;
    } else {
      // Column still visible — move dropdown to follow button
      const newTop = btnRect.bottom + 4;
      const newLeft = Math.min(Math.max(btnRect.left, wRect.left), window.innerWidth - 224);
      dd.style.top = newTop + 'px';
      dd.style.left = newLeft + 'px';
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.onTableScroll();  // same function reuse
  }

  onDocumentClick(event: MouseEvent): void {
    this.closeFilterDropdown();
  }

  @HostListener('document:click', ['$event'])

  onGlobalClick(event: MouseEvent): void {
    // freezePanelOpen/customizePanelOpen are toggled in their own buttons with stopPropagation
    // So if this fires, it means a click happened outside those panels — close them
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

  get displayData(): InventoryData[] {
    if (this.activeFilters.size === 0) return this.paginatedInventryData;
    return this.paginatedInventryData.filter(item => {
      for (const [col, vals] of this.activeFilters.entries()) {
        const cellVal = col === 'Aging'
          ? String(this.getAgeing((item as any)['BillingDate']))
          : String((item as any)[col] ?? '');
        if (!vals.has(cellVal)) return false;
      }
      return true;
    });
  }

  openColumnFilter(event: MouseEvent, col: string): void {
    event.stopPropagation();

    const dd = this.filterDropdownElRef?.nativeElement;
    const btn = event.currentTarget as HTMLElement;

    // Toggle: same button closes it
    if (this.activeFilterBtn === btn && dd?.style.display === 'block') {
      this.closeFilterDropdown();
      return;
    }

    this.currentFilterCol = col;
    this.activeFilterBtn = btn;

    // Build unique sorted values from loaded page data
    const allVals = [...new Set(
      this.paginatedInventryData.map(item => {
        if (col === 'Aging') return String(this.getAgeing((item as any)['BillingDate']));
        const v = (item as any)[col];
        return v != null ? String(v) : '';
      })
    )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    this.allDropdownValues = allVals;
    this.filteredDropdownValues = [...allVals];
    this.filterSearchText = '';
    const existing = this.activeFilters.get(col);
    this.tempSelectedValues = existing ? new Set(existing) : new Set(allVals);

    // Position and show via direct DOM
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

  onAgingClick(startDay: string, endDay: string): void {
    this.startDay = startDay;
    this.endDay = endDay;
    this.activeAging = `${startDay}-${endDay}`;
    this.getinventory();
  }

  datefilterchange(value: string): void {
    this.displayDateInputs = value === 'Custom';
    if (!this.displayDateInputs) { this.startdate_val = ''; this.enddate_val = ''; }
  }

  resetAgingCounts(): void {
    this.aging30_90_Count = 0; this.aging90_180_Count = 0;
    this.aging180_364_Count = 0; this.aging365Plus_Count = 0;
  }

  onShowReport(): void {
    this.activeAging = '-';
    this.startDay = '';
    this.endDay = '';
    this.resetAgingCounts();
    this.activeFilters.clear();
    this.getinventory();
  }

  getinventory(page: number = 1): void {
  
    const offset = (page - 1) * this.itemsPerPage;
    const { startDateISO, endDateISO } = this.getDateRange();
    const request = {
      Startdate: startDateISO, Enddate: endDateISO,
      ShMail: this.showSH ? this.selectedSH || '' : '',
      AmMail: this.showAM ? this.selectedAM || '' : '',
      TmMail: this.showTM ? this.selectedTM || '' : '',
      DealerMail: this.showDealer ? this.selectedDealer || '' : '',
      AgingStartDay: this.startDay, AgingEndDay: this.endDay,
      StockStatus: this.selectedType,
      PageSize: this.itemsPerPage.toString(),
      RowStart: offset.toString(),
      location: this.showStatename ? this.selectedLocation || '' : '',
      StateCode: this.showStatename ? this.selectedStateName || '' : ''
    };

    this.apis.getinventory(request).subscribe({
      next: (res) => {
        /*console.log('ressss', JSON.stringify(res));*/
        this.apiresponses = res as InventoryDataResponse;
        if (this.apiresponses.message?.toLowerCase() === 'success') {
          this.paginatedInventryData = this.apiresponses.data;
          this.totalItems = this.apiresponses.totalCount;
          this.currentPage = page;
          if (!this.startDay && !this.endDay) this.totalStockCount = this.apiresponses.totalCount;
          if (this.startDay === '0' && this.endDay === '120') this.aging30_90_Count = this.apiresponses.totalCount;
          else if (this.startDay === '121' && this.endDay === '180') this.aging90_180_Count = this.apiresponses.totalCount;
          else if (this.startDay === '181' && this.endDay === '364') this.aging180_364_Count = this.apiresponses.totalCount;
          else if (this.startDay === '365') this.aging365Plus_Count = this.apiresponses.totalCount;
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.'); }
    });
    this.ChnageAfterFilterselectedType = this.selectedType;
  }

  getHOFilter(): void {
    const request = {
      ShMail: "",
      AmMail: "",
      TmMail: "",
      DealerMail: "",
      StateName: ""
    };

    this.apis.getHOFilter(request).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.stateHead = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.stateHead || [])];
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];
          this.statelist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.states || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onStateChange(mail: string): void {
    this.selectedAM = '';
    this.selectedTM = '';
    this.selectedDealer = '';
    this.selectedStateName = '';
    this.selectedLocation = '';

    const payload = {
      ShMail: mail,
      AmMail: "",
      TmMail: "",
      DealerMail: "",
      StateName: ""
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];
          this.statelist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.states || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onAreaChange(mail: string): void {
    this.selectedTM = '';
    this.selectedDealer = '';
    this.selectedStateName = '';
    this.selectedLocation = '';

    const payload = {
      ShMail: this.selectedSH,
      AmMail: mail,
      TmMail: "",
      DealerMail: "",
      StateName: ""
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];
          this.statelist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.states || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while submitting data. Please try again.');
      }
    });
  }

  onTerritoryChange(mail: string): void {
    this.selectedDealer = '';
    this.selectedStateName = '';
    this.selectedLocation = '';

    const payload = {
      ShMail: this.selectedSH,
      AmMail: this.selectedAM,
      TmMail: mail,
      DealerMail: "",
      StateName: ""
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];
          this.statelist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.states || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onStateNameChange(mail: string): void {
    this.selectedDealer = '';
    this.selectedLocation = '';

    const payload = {
      ShMail: this.selectedSH,
      AmMail: this.selectedAM,
      TmMail: this.selectedTM,
      DealerMail: "",
      StateName: mail
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  private getDateRange(): { startDateISO: string; endDateISO: string } {
    let s = '', e = '';
    const now = new Date();
    if (this.selectedFilter === 'Month') {
      s = this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
      e = this.formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (this.selectedFilter === 'Quarter') {
      const q = Math.floor(now.getMonth() / 3);
      s = this.formatDate(new Date(now.getFullYear(), q * 3, 1));
      e = this.formatDate(new Date(now.getFullYear(), (q + 1) * 3, 0));
    } else if (this.selectedFilter === 'Financial Year') {
      const fy = (now.getMonth() + 1 >= 4) ? now.getFullYear() : now.getFullYear() - 1;
      s = this.formatDate(new Date(fy, 3, 1));
      e = this.formatDate(new Date(fy + 1, 2, 31));
    } else if (this.selectedFilter === 'Custom') {
      s = this.startdate_val; e = this.enddate_val;
    }
    return { startDateISO: s, endDateISO: e };
  }

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }

  onPageChange(page: number): void { this.getinventory(page); }

  exportToExcel(): void {
    const { startDateISO, endDateISO } = this.getDateRange();
    const request = {
      Startdate: startDateISO,
      Enddate: endDateISO,
      ShMail: this.showSH ? this.selectedSH || '' : '',
      AmMail: this.showAM ? this.selectedAM || '' : '',
      TmMail: this.showTM ? this.selectedTM || '' : '',
      DealerMail: this.showDealer ? this.selectedDealer || '' : '',
      AgingStartDay: this.startDay, AgingEndDay: this.endDay,
      StockStatus: this.selectedType,
      location: this.showStatename ? this.selectedLocation || '' : '',
      StateCode: this.showStatename ? this.selectedStateName || '' : ''
    };
    this.apis.getDownloadInventoryData(request).subscribe({
      next: (res) => {
        this.apiresponses = res as InventoryDataResponse;
        if (this.apiresponses.message?.toLowerCase() === 'success') {
          this.inventryData = this.apiresponses.data as InventoryData[];
          if (!this.inventryData?.length) {
            this.apis.showAlert('info', 'No Data', 'No data found for the selected range.');
            return;
          }
          const maxRows = 1048576;
          let part = 1;
          for (let i = 0; i < this.inventryData.length; i += maxRows) {
            const chunk = this.inventryData.slice(i, i + maxRows);
            const worksheet = XLSX.utils.json_to_sheet(chunk, { header: Object.keys(chunk[0]) });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'InventoryData');
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, this.inventryData.length > maxRows
              ? `InventoryData_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx`
              : `InventoryData_${new Date().toISOString().split('T')[0]}.xlsx`);
            part++;
          }
        } else { this.apis.showAlert('error', 'Error!', 'Failed fetching data.'); }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred.'); }
    });
  }

  searchValue(input: HTMLInputElement): void {
    this.apis.searchInventoryReport({ ChassisNo: input.value }).subscribe({
      next: (res) => {
        this.apiresponses = res as InventoryDataResponse;
        if (this.apiresponses.message?.toLowerCase() === 'success') {
          this.paginatedInventryData = this.apiresponses.data;
          this.totalItems = this.paginatedInventryData.length;
          this.currentPage = 1;
        } else { this.apis.showAlert('error', 'Error!', 'Failed fetching data.'); }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred.'); }
    });
  }

  getAgeing(billingDate: string | Date): number {
    return Math.floor((new Date().getTime() - new Date(billingDate).getTime()) / 86400000);
  }
}
