import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { getApisResponse, PersonModel, filterApisResponse, ExchangeStock } from '../../model/apiresponse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

declare var bootstrap: any;

@Component({
  selector: 'app-exchangestock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent],
  templateUrl: './exchangestock.component.html',
  styleUrl: './exchangestock.component.css'
})
export class ExchangestockComponent implements OnInit, OnDestroy {

  positionId: any;
  userName: any;
  dealercode: any;
  selectedStockType: string = 'In Stock';
  selectedStockTypeAfterFilter: string = 'In Stock';

  apiresponse: getApisResponse = { message: null, data: null };
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];
  locationlist: PersonModel[] = [];
  statelist: PersonModel[] = [];
  stateHead: PersonModel[] = [];

  showAM = false;
  showTM = false;
  showSH = false;
  showDealer = false;
  showStatename = false;

  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = '';
  selectedStateName: string = '';

  showLocation = false;
  selectedLocation: string = '';

  paginatedExchangeStockList: ExchangeStock[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;
  globalFilter: string = '';

  private modal: any;
  selectedItem: ExchangeStock | null = null;
  liquidationForm!: FormGroup;
  isSubmitted = false;
  isSold = false;

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
    { key: 'Action', label: 'Action' },
    { key: 'SHName', label: 'SH Name' },
    { key: 'AmName', label: 'AM Name' },
    { key: 'TmName', label: 'TM Name' },
    { key: 'DealerCode', label: 'SAP' },
    { key: 'DealerName', label: 'Dealer Name' },
    { key: 'Mobile', label: 'Mobile' },
    { key: 'DlrLoc', label: 'Dealer Location' },
    { key: 'DlrCat', label: 'Dealer Category' },
    { key: 'CustomerName', label: 'Customer Name' },
    { key: 'ChassisNumber', label: 'Chassis No.' },
    { key: 'DeliveryDate', label: 'Delivery Date' },
    { key: 'ExchangeMake', label: 'Make' },
    { key: 'ExchangeModel', label: 'Model' },
    { key: 'ExchangeMfgYear', label: 'Mfg Year' },
    { key: 'MktExchValue', label: 'Market Value' },
    { key: 'DealPrice', label: 'Deal Price' },
    { key: 'ExchangeHPCategory', label: 'HP Category' },
    { key: 'exchangeStockEntry', label: 'Document Type' },
    { key: 'exchangeStockEntryValue', label: 'Document Number' },
    { key: 'ExcBuyerName', label: 'Exchange Buyer Name' },
    { key: 'ExcBuyerMob', label: 'Exchange Buyer Mobile' },
    { key: 'SellingPrice', label: 'Liquidation Value' },
    { key: 'LiquidationDate', label: 'Liquidation Date' },
    { key: 'Exchangetrcimage', label: 'excFile' },
  ];

  freezableColumns = [
    { key: 'sno', label: 'S.No.' },
    { key: 'Action', label: 'Action' },
    { key: 'SHName', label: 'SH Name' },
    { key: 'AmName', label: 'AM Name' },
    { key: 'TmName', label: 'TM Name' },
    { key: 'DealerCode', label: 'SAP' },
    { key: 'DealerName', label: 'Dealer Name' },
    { key: 'Mobile', label: 'Mobile' },
    { key: 'ChassisNumber', label: 'Chassis No.' },
  ];

  private colLabelMap: Map<string, string> = new Map([
    ['sno', 'S.No.'], ['Action', 'Action'], ['SHName', 'SH Name'], ['AmName', 'AM Name'],
    ['TmName', 'TM Name'], ['DealerCode', 'SAP'], ['DealerName', 'Dealer Name'],
    ['Mobile', 'Mobile'], ['DlrLoc', 'Dealer Location'], ['DlrCat', 'Dealer Category'],
    ['CustomerName', 'Customer Name'], ['ChassisNumber', 'Chassis No.'],
    ['DeliveryDate', 'Delivery Date'], ['ExchangeMake', 'Make'], ['ExchangeModel', 'Model'],
    ['ExchangeMfgYear', 'Mfg Year'], ['MktExchValue', 'Market Value'], ['DealPrice', 'Deal Price'],
    ['ExchangeHPCategory', 'HP Category'], ['exchangeStockEntry', 'Document Type'],
    ['exchangeStockEntryValue', 'Document Number'], ['ExcBuyerName', 'Exchange Buyer Name'],
    ['ExcBuyerMob', 'Exchange Buyer Mobile'], ['SellingPrice', 'Liquidation Value'],
    ['LiquidationDate', 'Liquidation Date'],
    ['Exchangetrcimage', 'excFile'],
  ]);

  private colWidths: Map<string, number> = new Map([
    ['sno', 60], ['Action', 70], ['SHName', 120], ['AmName', 120], ['TmName', 120],
    ['DealerCode', 80], ['DealerName', 160], ['Mobile', 120], ['DlrLoc', 130],
    ['DlrCat', 120], ['CustomerName', 140], ['ChassisNumber', 140], ['DeliveryDate', 120],
    ['ExchangeMake', 100], ['ExchangeModel', 100], ['ExchangeMfgYear', 100],
    ['MktExchValue', 120], ['DealPrice', 110], ['ExchangeHPCategory', 110],
    ['exchangeStockEntry', 130], ['exchangeStockEntryValue', 150],
    ['ExcBuyerName', 160], ['ExcBuyerMob', 160], ['SellingPrice', 140], ['LiquidationDate', 140],
    ['Exchangetrcimage', 50],
  ]);

  private orderedColKeys = [
    'sno', 'Action', 'SHName', 'AmName', 'TmName', 'DealerCode', 'DealerName',
    'Mobile', 'DlrLoc', 'DlrCat', 'CustomerName', 'ChassisNumber', 'DeliveryDate',
    'ExchangeMake', 'ExchangeModel', 'ExchangeMfgYear', 'MktExchValue', 'DealPrice',
    'ExchangeHPCategory', 'exchangeStockEntry', 'exchangeStockEntryValue',
    'ExcBuyerName', 'ExcBuyerMob', 'SellingPrice', 'LiquidationDate', 'Exchangetrcimage'
  ];

  @ViewChild('filterDropdownEl') filterDropdownElRef!: ElementRef<HTMLElement>;
  @ViewChild('tableWrapper') tableWrapperRef!: ElementRef<HTMLElement>;

  private activeFilterBtn: HTMLElement | null = null;
  private tableScrollListener: (() => void) | null = null;

  constructor(
    private http: HttpClient,
    private apis: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    this.dealercode = sessionStorage.getItem('dealerCode');

    if (this.positionId === 'National Sales Head') {
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

    }

    this.getHOFilter();
    this.exchangeStockList();

    this.liquidationForm = this.fb.group({
      sellingPrice: [null, [Validators.required, Validators.min(1), Validators.max(999999)]],
      customerName: ['', Validators.required],
      customerMobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      district: ['', Validators.required],
      tehsil: ['', Validators.required],
      village: ['', Validators.required],
      liquidationDate: ['']
    });

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
    const isVisible = Math.min(btnRect.right, wRect.right) > Math.max(btnRect.left, wRect.left)
      && Math.min(btnRect.bottom, wRect.bottom) > Math.max(btnRect.top, wRect.top);
    if (!isVisible) {
      dd.style.display = 'none';
      this.activeFilterBtn = null;
    } else {
      dd.style.top = (btnRect.bottom + 4) + 'px';
      dd.style.left = Math.min(Math.max(btnRect.left, wRect.left), window.innerWidth - 224) + 'px';
    }
  }

  onDocumentClick(event: MouseEvent): void { this.closeFilterDropdown(); }

  @HostListener('document:click', ['$event'])

  onGlobalClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.tool-panel') && !target.closest('.btn-freeze')) this.freezePanelOpen = false;
    if (!target.closest('.tool-panel') && !target.closest('.btn-customize')) this.customizePanelOpen = false;
    this.closeFilterDropdown();
  }

  private closeFilterDropdown(): void {
    const dd = this.filterDropdownElRef?.nativeElement;
    if (dd) dd.style.display = 'none';
    this.activeFilterBtn = null;
  }

  get displayData(): ExchangeStock[] {
    if (this.activeFilters.size === 0) return this.paginatedExchangeStockList;
    return this.paginatedExchangeStockList.filter(item => {
      for (const [col, vals] of this.activeFilters.entries()) {
        if (!vals.has(String((item as any)[col] ?? ''))) return false;
      }
      return true;
    });
  }

  openColumnFilter(event: MouseEvent, col: string): void {
    event.stopPropagation();
    const dd = this.filterDropdownElRef?.nativeElement;
    const btn = event.currentTarget as HTMLElement;
    if (this.activeFilterBtn === btn && dd?.style.display === 'block') { this.closeFilterDropdown(); return; }
    this.currentFilterCol = col;
    this.activeFilterBtn = btn;
    const allVals = [...new Set(this.paginatedExchangeStockList.map(item => String((item as any)[col] ?? '')))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    this.allDropdownValues = allVals;
    this.filteredDropdownValues = [...allVals];
    this.filterSearchText = '';
    const existing = this.activeFilters.get(col);
    this.tempSelectedValues = existing ? new Set(existing) : new Set(allVals);
    if (dd) {
      const wRect = this.tableWrapperRef.nativeElement.getBoundingClientRect();
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
    if (checked) this.tempSelectedValues.add(val); else this.tempSelectedValues.delete(val);
  }

  selectAllFilterValues(): void { this.tempSelectedValues = new Set(this.allDropdownValues); this.filteredDropdownValues = [...this.allDropdownValues]; this.filterSearchText = ''; }
  clearAllFilterValues(): void { this.tempSelectedValues = new Set(); }

  applyColumnFilter(): void {
    if (this.tempSelectedValues.size === 0 || this.tempSelectedValues.size === this.allDropdownValues.length)
      this.activeFilters.delete(this.currentFilterCol);
    else
      this.activeFilters.set(this.currentFilterCol, new Set(this.tempSelectedValues));
    this.closeFilterDropdown();
    this.cdr.detectChanges();
  }

  cancelFilter(): void { this.closeFilterDropdown(); }
  getActiveFilterCols(): string[] { return [...this.activeFilters.keys()]; }

  getFilterSummary(col: string): string {
    const vals = this.activeFilters.get(col);
    if (!vals) return '';
    const arr = [...vals];
    return arr.length <= 2 ? arr.join(', ') : `${arr[0]}, ${arr[1]} +${arr.length - 2} more`;
  }

  removeFilter(col: string): void { this.activeFilters.delete(col); this.cdr.detectChanges(); }
  clearAllFilters(): void { this.activeFilters.clear(); this.cdr.detectChanges(); }
  getColumnLabel(key: string): string { return this.colLabelMap.get(key) ?? key; }

  toggleFreezePanel(event: MouseEvent): void { event.stopPropagation(); this.freezePanelOpen = !this.freezePanelOpen; this.customizePanelOpen = false; }

  toggleFreezeColumn(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.frozenColumnKeys.add(key); else this.frozenColumnKeys.delete(key);
    this.recalcFrozenLeft();
  }

  clearAllFreeze(): void { this.frozenColumnKeys.clear(); this.frozenLeftMap.clear(); }

  private recalcFrozenLeft(): void {
    this.frozenLeftMap.clear();
    let offset = 0;
    for (const key of this.orderedColKeys) {
      if (this.frozenColumnKeys.has(key)) { this.frozenLeftMap.set(key, offset); offset += this.colWidths.get(key) ?? 120; }
    }
  }

  getFrozenLeft(colKey: string): number { return this.frozenLeftMap.get(colKey) ?? 0; }

  toggleCustomizePanel(event: MouseEvent): void { event.stopPropagation(); this.customizePanelOpen = !this.customizePanelOpen; this.freezePanelOpen = false; }
  toggleColumnVisibility(key: string, event: Event): void { const checked = (event.target as HTMLInputElement).checked; if (checked) this.hiddenColumns.delete(key); else this.hiddenColumns.add(key); }
  showAllColumns(): void { this.hiddenColumns.clear(); }

  get f() { return this.liquidationForm.controls; }

  onRowClick(item: any) {
    this.selectedItem = item;
    this.isSubmitted = false;
    this.isSold = this.selectedStockType === 'Sold';
    this.liquidationForm.reset();
    if (this.isSold) {
      this.liquidationForm.patchValue({
        sellingPrice: item.SellingPrice,
        customerName: item.CustomerName,
        customerMobile: item.CustomerMobile,
        district: item.District,
        tehsil: item.Tehsil,
        village: item.Village,
        liquidationDate: item.LiquidationDate ? item.LiquidationDate.split('T')[0] : ''
      });
    }
    const modalEl = document.getElementById('viewExchangeStockModal');
    if (modalEl) { this.modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false }); this.modal.show(); }
  }

  formatDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${day}-${month}-${date.getFullYear()}`;
  }

  onPageChange(page: number) { this.exchangeStockList(page); }

  exchangeStockList(page: number = 1) {
    const offset = (page - 1) * this.itemsPerPage;
    const payload = {
      shMail: this.showSH ? this.selectedSH : '',
      amMail: this.showAM ? this.selectedAM : '',
      tmMail: this.showTM ? this.selectedTM : '',
      dealerMail: this.showDealer ? this.selectedDealer : '',
      pageSize: this.itemsPerPage,
      rowStart: offset,
      SearchText: this.globalFilter?.trim() || '',
      Status: this.selectedStockType || '',
      location: this.selectedLocation || '',
      StateCode: this.selectedStateName || ''
    };
    this.apis.exchangeStockList(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.paginatedExchangeStockList = res.data;
          this.totalItems = res.data[0]?.TotalCount ?? res.data.length;
        } else {
          this.paginatedExchangeStockList = []; this.totalItems = 0; this.globalFilter = '';
        }
        this.currentPage = page;
        this.selectedStockTypeAfterFilter = this.selectedStockType;
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'We were unable to retrieve the exchange stock data. Please try again.');
        this.paginatedExchangeStockList = []; this.totalItems = 0;
      }
    });
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

  searchFilter() { this.exchangeStockList(); }
  onShowReport() { this.exchangeStockList(); }

  closeModal() {
    this.isSubmitted = false;
    this.liquidationForm.reset();
    if (this.modal) this.modal.hide();
  }

  onSubmit() {
    this.isSubmitted = true;
    if (this.liquidationForm.invalid) return;
    const payload = {
      sellingPrice: this.liquidationForm.value.sellingPrice,
      customerName: this.liquidationForm.value.customerName,
      customerMobile: this.liquidationForm.value.customerMobile,
      district: this.liquidationForm.value.district,
      tehsil: this.liquidationForm.value.tehsil,
      village: this.liquidationForm.value.village,
      liquidationDate: null,
      salesId: this.selectedItem?.['SalesId']
    };
    this.apis.submitExcgange(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          this.apis.showAlert('success', 'Success!', 'Exchange stock liquidated successfully.');
          this.closeModal();
          this.exchangeStockList();
        } else { this.apis.showAlert('error', 'Error!', res.message || 'Submission failed.'); }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while submitting.')
    });
  }

  exportToExcel(): void {
    const payload = {
      shMail: this.showSH ? this.selectedSH : '',
      amMail: this.showAM ? this.selectedAM : '',
      tmMail: this.showTM ? this.selectedTM : '',
      dealerMail: this.showDealer ? this.selectedDealer : '',
      SearchText: this.globalFilter?.trim() || '',
      Status: this.selectedStockType || '',
      location: this.selectedLocation || '',
      StateCode: this.selectedStateName || ''
    };
    this.apis.DownloadExch(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data && res.data.length > 0) {
          const exportData = res.data; const maxRows = 1048576; let part = 1;
          for (let i = 0; i < exportData.length; i += maxRows) {
            const chunk = exportData.slice(i, i + maxRows);
            const worksheet = XLSX.utils.json_to_sheet(chunk, { header: Object.keys(chunk[0]) });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            saveAs(blob, exportData.length > maxRows
              ? `ExchangeList_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx`
              : `Exchange_${new Date().toISOString().split('T')[0]}.xlsx`);
            part++;
          }
        } else { this.apis.showAlert('error', 'Error!', 'No data found to export.'); }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.')
    });
  }
}
