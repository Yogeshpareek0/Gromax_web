import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import {
  getApisResponse, PersonModel, filterApisResponse,
  NotRetaildList, RetailForm, FormErrors, exchangeModelMaster
} from '../../model/apiresponse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

declare var bootstrap: any;

@Component({
  selector: 'app-retailpunch',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent],
  templateUrl: './retailpunch.component.html',
  styleUrl: './retailpunch.component.css'
})
export class RetailpunchComponent implements OnInit, OnDestroy {

  activeTab: string = 'retail';
  positionId: any;
  userName: any;
  dealercode: any;
  searchError: boolean = false;

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

  notRetaildList: NotRetaildList[] = [];
  paginatedEnquiryList: NotRetaildList[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  globalFilter: string = '';
  filteredList: NotRetaildList[] = [];

  registrationNumber: string = '';
  selectedRcStatus: string = '';
  selectedItem: NotRetaildList | null = null;
  isSubmitting = false;
  minDate: string = '';
  maxDate: string = '';
  todayDate: string = '';


  retailForm: RetailForm = this.getEmptyForm();
  formErrors: FormErrors = {};
  customFinancerName: string = '';

  customerDues: number = 0;
  baseAdditionalCash: number = 0;
  exchangeStockEntryType: string = '';
  exchangeStockEntryValue: string = '';
  apiExchStSold: string = '';
  customExchangeMake: string = '';
  showFinanceSubStatus: boolean = false;
  additionalHistoryList: any[] = [];

  financeSubStatusOptions: string[] = ['FI Pending', 'Login Pending', 'Approval Pending', 'Disbursement Pending'];
  //exchangeMakeOptions: string[] = ['ITL', 'Solis', 'MM', 'PTL', 'TMTL', 'JD', 'CNH', 'TAFE', 'SDF', 'CAPTAIN', 'VST', 'IFARM', 'PREET', 'ACE', 'FT', 'PT', 'KUBOTA', 'GAEL', 'OTHER'];
  exchangeHpCategories: string[] = ['< 20', '21–30', '31–40', '41–50', '> 50'];
  mfgYearOptions: string[] = [];
  prospectTypeOptions: string[] = ['1st Time Tractor Buyer', 'Exchange', 'Multi Tractor Owner', 'Existing Gromax Customer'];
  selectedCategory: string = '';

  private modal: any;

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
    { key: 'Mobile', label: 'Mobile' },
    { key: 'SHName', label: 'SH Name' },
    { key: 'AmName', label: 'AM Name' },
    { key: 'TmName', label: 'TM Name' },
    { key: 'DealerCode', label: 'SAP' },
    { key: 'DealerName', label: 'Dealer Name' },
    { key: 'DlrLoc', label: 'Dealer Location' },
    { key: 'DlrCat', label: 'Dealer Category' },
    { key: 'CustomerName', label: 'Customer Name' },
    { key: 'ModelName', label: 'Model Name' },
    { key: 'DriveType', label: 'Drive Type' },
    { key: 'DeliveryDate', label: 'Delivery Date' },
    { key: 'AgeingofAdvance', label: 'Ageing of Advance' },
    { key: 'ChasisNo', label: 'Chassis Number' },
    { key: 'LastUpdt', label: 'Last Update Date' },
  ];

  freezableColumns = [
    { key: 'sno', label: 'S.No.' },
    { key: 'Action', label: 'Action' },
    { key: 'Mobile', label: 'Mobile' },
    { key: 'SHName', label: 'SH Name' },
    { key: 'AmName', label: 'AM Name' },
    { key: 'TmName', label: 'TM Name' },
    { key: 'DealerCode', label: 'SAP' },
    { key: 'DealerName', label: 'Dealer Name' },
    { key: 'DlrLoc', label: 'Dealer Location' },
    { key: 'DlrCat', label: 'Dealer Category' },
    { key: 'ChasisNo', label: 'Chassis Number' },
  ];

  private colLabelMap: Map<string, string> = new Map([
    ['sno', 'S.No.'], ['Action', 'Action'], ['Mobile', 'Mobile'],
    ['SHName', 'SH Name'], ['AmName', 'AM Name'], ['TmName', 'TM Name'],
    ['DealerCode', 'SAP'], ['DealerName', 'Dealer Name'], ['DlrLoc', 'Dealer Location'],
    ['DlrCat', 'Dealer Category'], ['CustomerName', 'Customer Name'],
    ['ModelName', 'Model Name'], ['DriveType', 'Drive Type'],
    ['DeliveryDate', 'Delivery Date'], ['AgeingofAdvance', 'Ageing of Advance'],
    ['ChasisNo', 'Chassis Number'], ['LastUpdt', 'Last Update Date'],
  ]);

  private colWidths: Map<string, number> = new Map([
    ['sno', 60], ['Action', 70], ['Mobile', 120], ['SHName', 120], ['AmName', 120],
    ['TmName', 120], ['DealerCode', 80], ['DealerName', 160], ['DlrLoc', 130],
    ['DlrCat', 120], ['CustomerName', 140], ['ModelName', 120], ['DriveType', 100],
    ['DeliveryDate', 120], ['AgeingofAdvance', 130], ['ChasisNo', 150], ['LastUpdt', 140],
  ]);

  private orderedColKeys = [
    'sno', 'Action', 'Mobile', 'SHName', 'AmName', 'TmName',
    'DealerCode', 'DealerName', 'DlrLoc', 'DlrCat', 'CustomerName',
    'ModelName', 'DriveType', 'DeliveryDate', 'AgeingofAdvance', 'ChasisNo', 'LastUpdt'
  ];

  @ViewChild('filterDropdownEl') filterDropdownElRef!: ElementRef<HTMLElement>;
  @ViewChild('tableWrapper') tableWrapperRef!: ElementRef<HTMLElement>;

  private activeFilterBtn: HTMLElement | null = null;
  private tableScrollListener: (() => void) | null = null;




  showExchangeMakeOtherInput: boolean = false;
  exchangeMakeOther: string = '';
  expectedRetailError: string = '';
  //expectedRetailDate: Date | null = null;
  showExcModelDrop: boolean = false;
  showExcModelInput: boolean = true;
  exchangeModels: string[] = [];
  exchangeMakeOptions: exchangeModelMaster[] = [];
  makeList: string[] = [];

  constructor(
    private http: HttpClient,
    private apis: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const now = new Date();
    this.todayDate = this.formatDate(now);
    this.maxDate = this.todayDate;
    const currentYear = now.getFullYear();
    for (let year = currentYear; year >= 2000; year--) this.mfgYearOptions.push(year.toString());

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
    this.notRetailedList();
    this.exchangeModelList();
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
    const visLeft = Math.max(btnRect.left, wRect.left);
    const visRight = Math.min(btnRect.right, wRect.right);
    const visTop = Math.max(btnRect.top, wRect.top);
    const visBottom = Math.min(btnRect.bottom, wRect.bottom);
    const isVisible = visRight > visLeft && visBottom > visTop;
    if (!isVisible) {
      dd.style.display = 'none';
      this.activeFilterBtn = null;
    } else {
      dd.style.top = (btnRect.bottom + 4) + 'px';
      dd.style.left = Math.min(Math.max(btnRect.left, wRect.left), window.innerWidth - 224) + 'px';
    }
  }

  onDocumentClick(event: MouseEvent): void {
    this.closeFilterDropdown();
  }

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

  get displayData(): NotRetaildList[] {
    if (this.activeFilters.size === 0) return this.paginatedEnquiryList;
    return this.paginatedEnquiryList.filter(item => {
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
      this.closeFilterDropdown(); return;
    }
    this.currentFilterCol = col;
    this.activeFilterBtn = btn;
    const allVals = [...new Set(
      this.paginatedEnquiryList.map(item => String((item as any)[col] ?? ''))
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

  clearAllFilterValues(): void { this.tempSelectedValues = new Set(); }

  applyColumnFilter(): void {
    if (this.tempSelectedValues.size === 0 || this.tempSelectedValues.size === this.allDropdownValues.length) {
      this.activeFilters.delete(this.currentFilterCol);
    } else {
      this.activeFilters.set(this.currentFilterCol, new Set(this.tempSelectedValues));
    }
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

  clearAllFreeze(): void { this.frozenColumnKeys.clear(); this.frozenLeftMap.clear(); }

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

  getFrozenLeft(colKey: string): number { return this.frozenLeftMap.get(colKey) ?? 0; }

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

  showAllColumns(): void { this.hiddenColumns.clear(); }

  private formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  formatDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${day}-${month}-${date.getFullYear()}`;
  }

  getEmptyForm(): RetailForm {
    return {
      PaymentMode: '', DpAmount: 0, LoanAmount: 0, FinancerName: '',
      DisburseAmount: 0, LoanType: '', RetailedDate: '', FinalSellingPrice: 0,
      ProspectType: '', ExchangeChassisNo: '', ExchangeMake: '', ExchangeModel: '',
      ExchangeHpCategory: '', ExchangeMfgYear: '', MktExchTracAmt: null,
      DealExchTracAmt: null, FinanceStatus: '', FinanceSubStatus: '',
      exchangeStockEntry: '', exchangeStockEntryValue: '', AgeingofAdvance: 0,
      MktOsleft: 0, bookingAmount: 0, AdditionalPayment: null,
      CustomerAskExchTracAmt: null, Remarks: '', expectedRetailDate: null
      //, excFile: null
    };
  }

  onPageChange(page: number) { this.notRetailedList(page); }

  notRetailedList(page: number = 1) {
    const offset = (page - 1) * this.itemsPerPage;
    const payload = {
      shMail: this.showSH ? this.selectedSH : '',
      amMail: this.showAM ? this.selectedAM : '',
      tmMail: this.showTM ? this.selectedTM : '',
      dealerMail: this.showDealer ? this.selectedDealer : '',
      PageSize: this.itemsPerPage, RowStart: offset,
      SearchText: this.globalFilter?.trim() || '',
      selectedCategory: this.selectedCategory?.trim() || '',
      location: this.selectedLocation?.trim() || '',
      StateCode: this.selectedStateName?.trim() || ''
    };
    this.apis.notRetailedList(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.paginatedEnquiryList = res.data;
          //console.log('notretailedlist', this.paginatedEnquiryList);
          this.totalItems = res.data[0]?.TotalCount ?? res.data.length;
          //this.globalFilter = '';
        } else {
          this.paginatedEnquiryList = []; this.totalItems = 0; this.globalFilter = '';
        }
        this.currentPage = page;
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'We were unable to retrieve the retail punch data. Please try again.');
        this.paginatedEnquiryList = []; this.totalItems = 0;
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

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'retail' && this.selectedItem) this.refillFormFromItem(this.selectedItem);
    if (tab === 'history' && this.selectedItem) this.paymentHistoryList();
  }

  refillFormFromItem(item: NotRetaildList): void {
 
    const raw = item as any;
    let rawMode = (item.PaymentMode || '').trim();
    let paymentMode = !rawMode ? ((item.LoanAmount ?? 0) > 0 ? 'Loan' : ((item.FinalSellingPrice ?? 0) > 0 ? 'Cash' : ''))
      : (rawMode === 'Finance' ? 'Loan' : rawMode);
    const standardFinancers = ['MFSL', 'LTF', 'HDFC', 'ICICI', 'KOTAK', 'AU', 'YES', 'OTHER'];
    let financerName = item.FinancerName || '';
    if (financerName && !standardFinancers.includes(financerName)) { this.customFinancerName = financerName; financerName = 'OTHER'; }
    else this.customFinancerName = '';
    const standardMakes = this.makeList.filter(m => m !== 'OTHER');
    const rawMake = item.ExchangeMake || '';
    let finalExchangeMake: string;
    if (rawMake && !standardMakes.includes(rawMake)) { finalExchangeMake = 'OTHER'; this.customExchangeMake = rawMake; }
    else { finalExchangeMake = rawMake; this.customExchangeMake = ''; }
    const exchangeModel = this.findField(raw, ['exchangemodel', 'exc_model', 'exchangemodelname', 'excmodel']);
    const exchangeHpCategory = this.findField(raw, ['exchangehpcategory', 'exchangehp', 'exc_hp_category', 'exchpcategory', 'exchange_hp', 'exchpcategoryname']);
    const exchangeChassisNo = this.findField(raw, ['exchangechassisno', 'exchangechasino', 'exchangechasisno', 'exc_chassisno']);
    const stockEntry = this.findField(raw, ['exchangestockentry', 'exc_stockentry', 'stockentrytype', 'exchangeStockEntry']) || item.exchangeStockEntry || '';
    const stockEntryValue = this.findField(raw, ['exchangestockentryvalue', 'exc_stockentryvalue', 'stockentryvalue', 'exchangeStockEntryValue']) || item.exchangeStockEntryValue || '';
    const apiFinanceStatus = raw.FinanceStatus || '';
    const apiFinanceSubStatus = raw.FinanceSubStatus || '';
    this.showFinanceSubStatus = apiFinanceStatus === 'In-Process';
    this.retailForm = {
      PaymentMode: paymentMode, FinalSellingPrice: item.FinalSellingPrice || 0, DpAmount: item.DpAmount || 0,
      LoanAmount: item.LoanAmount || 0, FinancerName: financerName, LoanType: item.LoanType || '',
      DisburseAmount: item.DisburseAmount || 0, RetailedDate: '', ProspectType: raw.ProspectType || '',
      CustomerAskExchTracAmt: item.CustomerAskExchTracAmt ?? null, ExchangeChassisNo: exchangeChassisNo,
      ExchangeMake: finalExchangeMake, ExchangeModel: exchangeModel, ExchangeHpCategory: exchangeHpCategory,
      ExchangeMfgYear: item.ExchangeMfgYear || '', exchangeStockEntry: stockEntry,
      exchangeStockEntryValue: stockEntryValue, MktExchTracAmt: item.MktExchTracAmt ?? null,
      DealExchTracAmt: item.Deal_ExchTracAmt ?? null, FinanceStatus: apiFinanceStatus,
      FinanceSubStatus: apiFinanceSubStatus, AgeingofAdvance: raw.AgeingofAdvance ?? 0,
      MktOsleft: raw.MktOsleft ?? 0, bookingAmount: raw.bookingAmount ?? 0,
      Remarks: raw.Remarks || '', AdditionalPayment: null, expectedRetailDate: item.expectedRetailDate ?? null
    };
    this.exchangeStockEntryType = stockEntry;
    this.exchangeStockEntryValue = stockEntryValue;
    this.baseAdditionalCash = raw.additionalcash ?? 0;
    this.customerDues = raw.dueAmount ? parseFloat(raw.dueAmount) : 0;
    this.apiExchStSold = (item as any).exchStSold ?? 'In Stock';
    this.formErrors = {} as FormErrors;
  }

  searchFilter() { this.notRetailedList(); }
  onShowReport() { this.notRetailedList(); }
  onRcStatusChange() { if (this.selectedRcStatus !== 'Done') this.registrationNumber = ''; }

  private findField(obj: any, candidates: string[]): string {
    if (!obj) return '';
    const keyMap: Record<string, string> = {};
    Object.keys(obj).forEach(k => { keyMap[k.toLowerCase().replace(/_/g, '')] = k; });
    for (const c of candidates) {
      const n = c.toLowerCase().replace(/_/g, '');
      if (keyMap[n] !== undefined && obj[keyMap[n]] !== null && obj[keyMap[n]] !== undefined) return obj[keyMap[n]].toString();
    }
    return '';
  }

  calculateCustomerDues(): void {
    const finalSale = this.retailForm.FinalSellingPrice || 0;
    const dp = this.retailForm.DpAmount || 0;
    const mktValue = this.retailForm.ProspectType === 'Exchange' ? (this.retailForm.DealExchTracAmt || 0) : 0;
    const additional = this.baseAdditionalCash + (this.retailForm.AdditionalPayment || 0);
    const disbursed = (this.retailForm.PaymentMode === 'Loan' && this.retailForm.FinanceStatus === 'Disbursed' && this.retailForm.DisburseAmount > 0) ? (this.retailForm.DisburseAmount || 0) : 0;
    const booking = this.retailForm.bookingAmount || 0;
    const dues = finalSale - (dp + mktValue + additional + disbursed + booking);
    this.customerDues = dues > 0 ? dues : 0;
  }

  onProspectTypeChange(): void {
    if (this.retailForm.ProspectType !== 'Exchange') {
      this.exchangeHpCategories = [];
      this.exchangeModels = [];
      this.retailForm.ExchangeChassisNo = ''; this.retailForm.ExchangeMake = ''; this.retailForm.ExchangeModel = '';
      this.retailForm.ExchangeHpCategory = ''; this.retailForm.ExchangeMfgYear = '';
      this.retailForm.MktExchTracAmt = null; this.retailForm.DealExchTracAmt = null;
      this.exchangeStockEntryType = ''; this.exchangeStockEntryValue = ''; this.customExchangeMake = '';
      ['ExchangeMake', 'ExchangeModel', 'ExchangeMfgYear', 'MktExchTracAmt', 'DealExchTracAmt'].forEach(k => delete (this.formErrors as any)[k]);
    }
    this.calculateCustomerDues();
  }

  onPaymentModeChange(): void {
    this.retailForm.LoanAmount = 0; this.retailForm.FinancerName = ''; this.retailForm.DisburseAmount = 0;
    this.retailForm.LoanType = ''; this.retailForm.FinanceStatus = ''; this.retailForm.FinanceSubStatus = '';
    this.retailForm.AdditionalPayment = null; this.customFinancerName = ''; this.showFinanceSubStatus = false;
    ['LoanAmount', 'FinancerName', 'LoanType', 'DisburseAmount', 'FinanceStatus', 'FinanceSubStatus', 'gap'].forEach(k => delete (this.formErrors as any)[k]);
    this.calculateCustomerDues();
  }

  onFinanceStatusChange(): void {
    const status = this.retailForm.FinanceStatus;
    this.showFinanceSubStatus = status === 'In-Process';
    this.retailForm.FinanceSubStatus = '';
    if (status !== 'Disbursed') { this.retailForm.DisburseAmount = 0; delete (this.formErrors as any)['DisburseAmount']; }
    if (!this.showFinanceSubStatus) delete (this.formErrors as any)['FinanceSubStatus'];
    this.calculateCustomerDues();
  }

  onExchangeStockEntryTypeChange(): void {
    this.exchangeStockEntryType = this.retailForm.exchangeStockEntry;
    this.exchangeStockEntryValue = ''; this.retailForm.exchangeStockEntryValue = '';
  }

  onFinancerChange(): void {
    /*if (this.retailForm.FinancerName !== 'OTHER') this.customFinancerName = '';*/
  }

  onRowClick(item: NotRetaildList) {
    this.activeTab = 'retail'; this.additionalHistoryList = [];
    this.selectedItem = item; this.customerDues = 0; this.baseAdditionalCash = 0;
    this.exchangeStockEntryType = ''; this.exchangeStockEntryValue = ''; this.showFinanceSubStatus = false;
    const backDays = (item as any).BackDateDay ?? 0;
    const minD = new Date(); minD.setDate(minD.getDate() - backDays);
    this.minDate = this.formatDate(minD); this.maxDate = this.todayDate;
    this.refillFormFromItem(item);
    const modalEl = document.getElementById('viewMoreModal');
    if (modalEl) { this.modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false }); this.modal.show(); }
  }

  closeModal() {
    if (this.modal) this.modal.hide();
    this.selectedItem = null; this.retailForm = this.getEmptyForm(); this.formErrors = {} as FormErrors;
    this.customFinancerName = ''; this.customerDues = 0; this.baseAdditionalCash = 0;
    this.exchangeStockEntryType = ''; this.exchangeStockEntryValue = ''; this.showFinanceSubStatus = false;
    this.apiExchStSold = ''; this.customExchangeMake = '';
  }

  validateForm(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.formErrors = {} as FormErrors;
    let valid = true;
    if (!this.retailForm.expectedRetailDate) { this.formErrors['expectedRetailDate'] = 'Expected RetailDate type is required.'; valid = false; };
    if (!this.retailForm.expectedRetailDate) {
      this.formErrors['expectedRetailDate'] = 'Expected Retail Date is required.';
      valid = false;
    } else {
      const expectedDate = new Date(this.retailForm.expectedRetailDate);
      expectedDate.setHours(0, 0, 0, 0);

      if (expectedDate < today) {
        this.formErrors['expectedRetailDate'] = 'Expected Retail Date cannot be earlier than today.';
        valid = false;
      }
    }
    if (!this.retailForm.ProspectType) { this.formErrors['ProspectType'] = 'Prospect type is required.'; valid = false; }
    if (!this.retailForm.PaymentMode) { this.formErrors['PaymentMode'] = 'Payment type is required.'; valid = false; }
    if (this.retailForm.PaymentMode === 'Loan') {
      const loanStr = this.retailForm.LoanAmount?.toString().replace('-', '') || '';
      if (!this.retailForm.LoanAmount || loanStr.length != 6) { this.formErrors['LoanAmount'] = 'Loan Amount must be exactly 6 digits.'; valid = false; }
      if (!this.retailForm.FinancerName?.trim()) { this.formErrors['FinancerName'] = 'Financer name is required.'; valid = false; }
      //else if (this.retailForm.FinancerName === 'OTHER' && !this.customFinancerName?.trim()) { this.formErrors['FinancerName'] = 'Please enter financer name.'; valid = false; }
      if (!this.retailForm.LoanType) { this.formErrors['LoanType'] = 'Loan type is required.'; valid = false; }
      if (!this.retailForm.FinanceStatus) { this.formErrors['FinanceStatus'] = 'Finance status is required.'; valid = false; }
      if (this.showFinanceSubStatus && !this.retailForm.FinanceSubStatus) { this.formErrors['FinanceSubStatus'] = 'Finance sub status is required.'; valid = false; }
      if (this.retailForm.FinanceStatus === 'Disbursed') {
        if (!this.retailForm.DisburseAmount || this.retailForm.DisburseAmount <= 0) { this.formErrors['DisburseAmount'] = 'Disburse amount is required.'; valid = false; }
        else if (this.retailForm.DisburseAmount.toString().replace('-', '').length != 6) { this.formErrors['DisburseAmount'] = 'Disburse amount must be exactly 6 digits.'; valid = false; }
      }
    }
    if (this.retailForm.PaymentMode === 'Cash') {
      if (this.retailForm.FinalSellingPrice && this.retailForm.DpAmount) {
        const mktVal = this.retailForm.ProspectType === 'Exchange' ? (this.retailForm.MktExchTracAmt || 0) : 0;
        const additional = this.baseAdditionalCash + (this.retailForm.AdditionalPayment || 0);
        if (this.retailForm.FinalSellingPrice - this.retailForm.DpAmount - mktVal - additional < 0) { this.formErrors['gap'] = 'DP amount cannot exceed Final Selling Price.'; valid = false; }
      }
    }
    if (this.retailForm.ProspectType === 'Exchange') {
      if (!this.retailForm.ExchangeMake) { this.formErrors['ExchangeMake'] = 'Exchange make is required.'; valid = false; }
      if (!this.retailForm.ExchangeModel?.trim()) { this.formErrors['ExchangeModel'] = 'Exchange model is required.'; valid = false; }
      if (!this.retailForm.ExchangeMfgYear) { this.formErrors['ExchangeMfgYear'] = 'Manufacturing year is required.'; valid = false; }
      if (!this.retailForm.ExchangeHpCategory) { this.formErrors['ExchangeHpCategory'] = 'HP Category is required.'; valid = false; }
      if (!this.retailForm.exchangeStockEntry) { this.formErrors['exchangeStockEntry'] = 'Exchange stock entry type is required.'; valid = false; }
      if (this.retailForm.exchangeStockEntry && !this.retailForm.exchangeStockEntryValue?.trim()) { this.formErrors['exchangeStockEntryValue'] = 'Exchange stock entry value is required.'; valid = false; }
      if (!this.retailForm.MktExchTracAmt || this.retailForm.MktExchTracAmt < 10000 || this.retailForm.MktExchTracAmt > 999999) { this.formErrors['MktExchTracAmt'] = 'Market value must be between 5 and 6 digits.'; valid = false; }
      if (!this.retailForm.DealExchTracAmt || this.retailForm.DealExchTracAmt < 10000 || this.retailForm.DealExchTracAmt > 999999) { this.formErrors['DealExchTracAmt'] = 'Deal price must be between 5 and 6 digits.'; valid = false; }
      if ((this.retailForm.CustomerAskExchTracAmt || 0) !== 0) {
        if ((this.retailForm.CustomerAskExchTracAmt || 0) < 0) { this.formErrors['CustomerAskExchTracAmt'] = 'Customer Ask Amount cannot be less than 0'; valid = false; }
        if ((this.retailForm.CustomerAskExchTracAmt || 0) > 999999) { this.formErrors['CustomerAskExchTracAmt'] = 'Customer Ask must not exceed 6 digits'; valid = false; }
      }
      if (this.retailForm.MktExchTracAmt && this.retailForm.DealExchTracAmt && Math.abs(this.retailForm.MktExchTracAmt - this.retailForm.DealExchTracAmt) > 100000) { this.formErrors['exchangeGap'] = 'Difference cannot exceed ₹1,00,000.'; valid = false; }
    }
    return valid;
  }

  onSubmit() {

    if (!this.validateForm() || !this.selectedItem) return;
    const isCash = this.retailForm.PaymentMode === 'Cash';
    const isLoan = this.retailForm.PaymentMode === 'Loan';
    const isExchange = this.retailForm.ProspectType === 'Exchange';
    const isDisbursed = this.retailForm.FinanceStatus === 'Disbursed';
    const isInProcess = this.retailForm.FinanceStatus === 'In-Process';
    const payload: any = {
      SalesId: (this.selectedItem as any).SalesId || (this.selectedItem as any).salesId,
      SalesEnquiryId: (this.selectedItem as any).SalesEnquiryID || (this.selectedItem as any).SalesEnquiryId,
      FinanceMasterId: (this.selectedItem as any).FinanceMasterId,
      RetailedDate: null, ProspectType: this.retailForm.ProspectType,
      PaymentType: this.retailForm.PaymentMode, DueAmount: this.customerDues,
      LoanRequired: isLoan ? this.retailForm.LoanAmount : 0,
      //FinancerName: isLoan ? (this.retailForm.FinancerName === 'OTHER' ? this.customFinancerName : this.retailForm.FinancerName) : '',
      FinancerName: isLoan ? this.retailForm.FinancerName : '',
      ManualFinancerName: (isLoan && this.retailForm.FinancerName === 'OTHER') ? this.customFinancerName : '',
      LoanType: isLoan ? this.retailForm.LoanType : '',
      FinanceStatus: isLoan ? this.retailForm.FinanceStatus : '',
      AdditionalCash: this.retailForm.AdditionalPayment ?? 0,
      FinanceStatusDetail: (isLoan && isInProcess) ? this.retailForm.FinanceSubStatus : '',
      DisbursedAmount: (isLoan && isDisbursed) ? this.retailForm.DisburseAmount : 0,
      ExchangeMake: isExchange ? (this.retailForm.ExchangeMake === 'OTHER' ? this.customExchangeMake : this.retailForm.ExchangeMake) : '',
      ExchangeModel: isExchange ? this.retailForm.ExchangeModel : '',
      ExchangeHpCategory: isExchange ? this.retailForm.ExchangeHpCategory : '',
      MfgYear: isExchange ? this.retailForm.ExchangeMfgYear : '',
      CustomerAskExchange: isExchange ? (this.retailForm.CustomerAskExchTracAmt ?? 0) : 0,
      MktValueExchange: isExchange ? this.retailForm.MktExchTracAmt : null,
      FinalPriceExchange: isExchange ? this.retailForm.DealExchTracAmt : null,
      ExchangeStockEntry: isExchange ? this.retailForm.exchangeStockEntry : '',
      ExchangeStockEntryValue: isExchange ? this.retailForm.exchangeStockEntryValue : '',
      expectedRetailDate: this.retailForm.expectedRetailDate
    };
    this.isSubmitting = true;
    this.apis.updateRetailSale(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        const message = res?.message?.toLowerCase();
        if (res?.statusCode === 200 || message === 'success') { this.apis.showAlert('success', 'Success!', 'Retail sale updated successfully.'); this.closeModal(); this.notRetailedList(); this.globalFilter = ''; }
        else if (message === 'no pending due found.') { this.apis.showAlert('warning', 'No Pending Due', 'Customer has no pending dues. Retail sale update is not allowed.'); }
        else { this.apis.showAlert('error', 'Error!', res?.message || 'Failed to update retail sale.'); }
      },
      error: () => { this.isSubmitting = false; this.apis.showAlert('error', 'Error!', 'An error occurred while submitting. Please try again.'); }
    });
  }

  paymentHistoryList() {
    const payload = { Id: (this.selectedItem as any).SalesId || (this.selectedItem as any).salesId };
    this.apis.paymentHistoryList(payload).subscribe({
      next: (res: any) => { this.additionalHistoryList = (res.statusCode === 200 && res.data) ? res.data : []; },
      error: () => { this.apis.showAlert('error', 'Error!', 'Failed to load payment history data'); this.additionalHistoryList = []; }
    });
  }

  exportToExcel(): void {
    const payload = {
      shMail: this.showSH ? this.selectedSH : '',
      amMail: this.showAM ? this.selectedAM : '',
      tmMail: this.showTM ? this.selectedTM : '',
      dealerMail: this.showDealer ? this.selectedDealer : '',
      SearchText: this.globalFilter?.trim() || '',
      selectedCategory: this.selectedCategory?.trim() || '',
      location: this.selectedLocation?.trim() || '',
      StateCode: this.selectedStateName?.trim() || ''

    };
    this.apis.DownloadNotRetailedList(payload).subscribe({
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
            saveAs(blob, exportData.length > maxRows ? `NotRetailedList_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx` : `NotRetailedList_${new Date().toISOString().split('T')[0]}.xlsx`);
            part++;
          }
        } else { this.apis.showAlert('error', 'Error!', 'No data found to export.'); }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.')
    });
  }

  onExchangeMakeChange(): void {
    this.exchangeHpCategories = [];
    this.retailForm.ExchangeHpCategory = '';
    this.exchangeModels = [];
    this.retailForm.ExchangeModel = '';
    this.showExchangeMakeOtherInput = (this.retailForm.ExchangeMake?.toLowerCase() === 'other');
    if (!this.showExchangeMakeOtherInput) {
      this.exchangeMakeOther = '';
    }
    this.exchangeHpCategories = [...new Set(this.exchangeMakeOptions.filter(x => x.Mfg?.toLowerCase() ===
      this.retailForm.ExchangeMake?.toLowerCase()).map(x => x.Hp).filter(x => x != null))];
    if (this.exchangeHpCategories.length === 0) {
      this.exchangeHpCategories = ['< 20', '21–30', '31–40', '41–50', '> 50'];
      this.showExcModelInput = true;
      this.showExcModelDrop = false;
    }
    else {
      this.showExcModelInput = false;
      this.showExcModelDrop = true;
    }

  }

  exchangeModelList() {

    this.apis.getExchangeModel().subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase() === 'success') {

          this.exchangeMakeOptions = response?.data || [];
          this.makeList = [...new Set(this.exchangeMakeOptions.map(x => x.Mfg))];

        } else {
          this.apis.showAlert('error', 'Error!', response?.message || 'Failed to generate enquiry.');
        }
      },

      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.');
      }
    });

  }

  onExchHpChange() {
    if (this.showExcModelDrop) {
      this.exchangeModels = [
        ...new Set(
          this.exchangeMakeOptions
            .filter(x =>
              x.Mfg?.toLowerCase() === this.retailForm.ExchangeMake?.toLowerCase() &&
              x.Hp?.toString().toLowerCase() === this.retailForm.ExchangeHpCategory?.toLowerCase()
            )
            .map(x => x.Model)
            .filter(x => x != null)
        )
      ];
    }
    //this.exchangeHpCategorie;
  }

  onFileChange(event: any, field: string): void {
    const input = event.target;
    const file = input.files[0];

    // 🔴 Cancel case handle
    if (!file) {
      (this as any)[field] = null;
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, JPG, PNG files allowed');
      input.value = '';
      (this as any)[field] = null; // also clear variable
      return;
    }

    (this as any)[field] = file;
  }

  expeRetailChange(event: any) {

    const value = event.target.value;

    // Reset errors
    this.retailForm.expectedRetailDate = null;
    this.formErrors['expectedRetailDate'] = '';

    // ❌ Case 1: Followup < Today
    if (value && value < this.todayDate) {
      this.formErrors['expectedRetailDate'] = 'Expected RetailDate type is required.'
      return;
    }

    // ✅ Assign valid followup date
    this.retailForm.expectedRetailDate = value;


  }
}
