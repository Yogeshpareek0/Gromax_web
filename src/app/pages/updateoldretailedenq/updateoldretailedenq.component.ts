import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { getApisResponse, PersonModel, filterApisResponse } from '../../model/apiresponse';

declare var bootstrap: any;

@Component({
  selector: 'app-updateoldretailedenq',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './updateoldretailedenq.component.html',
  styleUrl: './updateoldretailedenq.component.css'
})
export class UpdateoldretailedenqComponent implements OnInit {

  // ── Session ──────────────────────────────────────────
  positionId: any;
  userName: any;
  dealercode: any;

  // ── Filter visibility ─────────────────────────────────
  showSH = false;
  showAM = false;
  showTM = false;
  showDealer = false;

  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = '';

  // ── Filter dropdown lists ─────────────────────────────
  apiresponse: getApisResponse = { message: null, data: null };
  stateHead: PersonModel[] = [];
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];

  // ── Table / Pagination ────────────────────────────────
  paginatedEnquiryList: any[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;
  globalFilter: string = '';

  // ── Modal ─────────────────────────────────────────────
  private modal: any;
  selectedItem: any | null = null;
  activeTab: string = 'retail';

  // ── Retail form (plain object — mirrors retailpunch) ──
  retailForm: any = {
    ProspectType: '',
    PaymentMode: '',
    FinalSellingPrice: 0,
    DpAmount: 0,
    bookingAmount: 0,
    MktOsleft: 0,
    AgeingofAdvance: 0,
    LoanAmount: null,
    FinancerName: '',
    LoanType: '',
    FinanceStatus: '',
    FinanceSubStatus: '',
    DisburseAmount: null,
    AdditionalPayment: null,
    // Exchange
    ExchangeMake: '',
    ExchangeModel: '',
    ExchangeHpCategory: '',
    ExchangeMfgYear: '',
    MktExchTracAmt: null,
    DealExchTracAmt: null,
    CustomerAskExchTracAmt: null,
    exchangeStockEntry: '',
    exchangeStockEntryValue: ''

  };

  formErrors: any = {};
  customerDues: number = 0;
  baseAdditionalCash: number = 0;
  apiExchStSold: string = '';
  isSubmitting: boolean = false;

  // ── Additional Payment History ─────────────────────────
  additionalHistoryList: any[] = [];

  // ── Dropdown options ──────────────────────────────────
  showFinanceSubStatus: boolean = false;
  customExchangeMake: string = '';
  customFinancerName: string = '';

   financeSubStatusOptions: string[] = [
    'FI Pending', 'Login Pending', 'Approval Pending', 'Disbursement Pending'
  ];

  exchangeMakeOptions: string[] = [
    'ITL', 'Solis', 'MM', 'PTL', 'TMTL', 'JD', 'CNH', 'TAFE', 'SDF',
    'CAPTAIN', 'VST', 'IFARM', 'PREET', 'ACE', 'FT', 'PT', 'KUBOTA', 'GAEL','OTHER'
  ];

  exchangeHpCategories: string[] = ['< 20', '21–30', '31–40', '41–50', '> 50'];

  mfgYearOptions: number[] = [];

  prospectTypeOptions: string[] = [
    '1st Time Tractor Buyer',
    'Exchange',
    'Multi Tractor Owner',
    'Existing Gromax Customer'
  ];

  constructor(
    private http: HttpClient,
    private apis: AuthService
  ) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    this.dealercode = sessionStorage.getItem('dealerCode');

    // Role-based filter visibility
    if (this.positionId === 'National Sales Head') {
      this.showSH = true; this.showAM = true; this.showTM = true; this.showDealer = true;
    } else if (this.positionId === 'State Head') {
      this.showAM = true; this.showTM = true; this.showDealer = true;
    } else if (this.positionId === 'Area Manager') {
      this.showTM = true; this.showDealer = true;
    } else if (this.positionId === 'Territory Manager') {
      this.showDealer = true;
    }

    // Build mfg year options (current year down to 1990)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1990; y--) {
      this.mfgYearOptions.push(y);
    }

    this.getHOFilter();
    this.getEnquiryList();
  }

  // ════════════════════════════════════════════════════
  //  DATE HELPER
  // ════════════════════════════════════════════════════
  formatDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // ════════════════════════════════════════════════════
  //  FILTERS
  // ════════════════════════════════════════════════════
  getHOFilter(): void {
    const request = { ShMail: '', AmMail: '', TmMail: '', DealerMail: '' };
    this.apis.getHOFilter(request).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.stateHead = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.stateHead || [])];
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching filter data. Please try again.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching filter data.')
    });
  }

  onStateChange(mail: string): void {
    this.selectedAM = ''; this.selectedTM = ''; this.selectedDealer = '';
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
    this.selectedTM = ''; this.selectedDealer = '';
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
    this.selectedDealer = '';
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

  searchFilter(): void {
    this.getEnquiryList();
  }

  onShowReport(): void {
    this.getEnquiryList();
  }

  // ════════════════════════════════════════════════════
  //  TABLE DATA
  // ════════════════════════════════════════════════════
  getEnquiryList(page: number = 1): void {
    const offset = (page - 1) * this.itemsPerPage;
    const payload = {
      shMail: this.showSH ? this.selectedSH : '',
      amMail: this.showAM ? this.selectedAM : '',
      tmMail: this.showTM ? this.selectedTM : '',
      dealerMail: this.showDealer ? this.selectedDealer : '',
      pageSize: this.itemsPerPage,
      rowStart: offset,
      SearchText: this.globalFilter?.trim() || ''
    };

    this.apis.getOldRetailedEnquiry(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.paginatedEnquiryList = res.data;
          this.totalItems = res.data[0]?.TotalCount ?? res.data.length;
        } else {
          this.paginatedEnquiryList = [];
          this.totalItems = 0;
        }
        this.currentPage = page;
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'We were unable to retrieve the enquiry data. Please try again.');
        this.paginatedEnquiryList = [];
        this.totalItems = 0;
      }
    });
  }

  onPageChange(page: number): void {
    this.getEnquiryList(page);
  }

  // ════════════════════════════════════════════════════
  //  ROW CLICK → open modal
  // ════════════════════════════════════════════════════
  onRowClick(item: any): void {
    this.selectedItem = item;
    this.activeTab = 'retail';
    this.formErrors = {};
    this.customExchangeMake = '';
    this.customFinancerName = '';

    // Pre-fill retailForm from the selected row
    this.retailForm = {
      ProspectType: item.ProspectType || '',
      PaymentMode: item.PaymentMode || '',
      FinalSellingPrice: item.FinalSellingPrice || 0,
      DpAmount: item.DpAmount || 0,
      bookingAmount: item.BookingAmount || 0,
      MktOsleft: item.MktOsleft || 0,
      AgeingofAdvance: item.AgeingofAdvance || 0,
      LoanAmount: item.LoanAmount || null,
      FinancerName: item.FinancerName || '',
      LoanType: item.LoanType || '',
      FinanceStatus: item.FinanceStatus || '',
      FinanceSubStatus: item.FinanceSubStatus || '',
      DisburseAmount: item.DisburseAmount || null,
      AdditionalPayment: null,
      // Exchange
      ExchangeMake: item.ExchangeMake || '',
      ExchangeModel: item.ExchangeModel || '',
      ExchangeHpCategory: item.ExchangeHpCategory || '',
      ExchangeMfgYear: item.ExchangeMfgYear || '',
      MktExchTracAmt: item.MktExchTracAmt || null,
      DealExchTracAmt: item.DealExchTracAmt || null,
      CustomerAskExchTracAmt: item.CustomerAskExchTracAmt || null,
      exchangeStockEntry: item.ExchangeStockEntry || '',
      exchangeStockEntryValue: item.ExchangeStockEntryValue || ''
    };

    // Finance sub-status visibility
    this.showFinanceSubStatus = this.retailForm.FinanceStatus === 'In-Process';

    // Base additional cash already received (from API)
    this.baseAdditionalCash = item.AdditionalPaymentReceived || 0;

    // Exchange sold status
    this.apiExchStSold = item.ExchangeStockStatus || '';

    // Calculate dues from existing data
    this.calculateCustomerDues();

    // Load payment history
    this.getAdditionalPaymentHistory(item.SalesId);

    // Open modal
    const modalEl = document.getElementById('updateOldRetailedEnqModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      this.modal.show();
    }
  }

  // ════════════════════════════════════════════════════
  //  ADDITIONAL PAYMENT HISTORY
  // ════════════════════════════════════════════════════
  getAdditionalPaymentHistory(salesId: any): void {
    this.additionalHistoryList = [];
    if (!salesId) return;

    //this.apis.getAdditionalPaymentHistory({ SalesId: salesId }).subscribe({
    //  next: (res: any) => {
    //    if (res.statusCode === 200 && res.data) {
    //      this.additionalHistoryList = res.data;
    //    } else {
    //      this.additionalHistoryList = [];
    //    }
    //  },
    //  error: () => {
    //    this.additionalHistoryList = [];
    //  }
    //});
  }

  // ════════════════════════════════════════════════════
  //  TABS
  // ════════════════════════════════════════════════════
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // ════════════════════════════════════════════════════
  //  FORM CHANGE HANDLERS
  // ════════════════════════════════════════════════════
  onProspectTypeChange(): void {
    // Reset exchange fields when switching away from Exchange
    if (this.retailForm.ProspectType !== 'Exchange') {
      this.retailForm.ExchangeMake = '';
      this.retailForm.ExchangeModel = '';
      this.retailForm.ExchangeHpCategory = '';
      this.retailForm.ExchangeMfgYear = '';
      this.retailForm.MktExchTracAmt = null;
      this.retailForm.DealExchTracAmt = null;
      this.retailForm.CustomerAskExchTracAmt = null;
      this.retailForm.exchangeStockEntry = '';
      this.retailForm.exchangeStockEntryValue = '';
      this.customExchangeMake = '';
    }
    this.calculateCustomerDues();
  }

  onPaymentModeChange(): void {
    // Reset loan-specific fields when switching payment mode
    this.retailForm.LoanAmount = null;
    this.retailForm.FinancerName = '';
    this.retailForm.LoanType = '';
    this.retailForm.FinanceStatus = '';
    this.retailForm.FinanceSubStatus = '';
    this.retailForm.DisburseAmount = null;
    this.showFinanceSubStatus = false;
    this.customFinancerName = '';
    this.calculateCustomerDues();
  }

  onFinancerChange(): void {
    if (this.retailForm.FinancerName !== 'OTHER') {
      this.customFinancerName = '';
    }
  }

  onFinanceStatusChange(): void {
    this.showFinanceSubStatus = this.retailForm.FinanceStatus === 'In-Process';
    // Reset sub-status if not In-Process
    if (!this.showFinanceSubStatus) {
      this.retailForm.FinanceSubStatus = '';
    }
    // Reset disburse amount if not Disbursed
    if (this.retailForm.FinanceStatus !== 'Disbursed') {
      this.retailForm.DisburseAmount = null;
    }
    this.calculateCustomerDues();
  }

  onExchangeStockEntryTypeChange(): void {
    this.retailForm.exchangeStockEntryValue = '';
  }

  // ════════════════════════════════════════════════════
  //  CUSTOMER DUES CALCULATION
  // ════════════════════════════════════════════════════
  calculateCustomerDues(): void {
    const sp = +this.retailForm.FinalSellingPrice || 0;
    const dp = +this.retailForm.DpAmount || 0;
    const booking = +this.retailForm.bookingAmount || 0;
    const addl = (this.baseAdditionalCash || 0) + (+this.retailForm.AdditionalPayment || 0);
    const dealExch = this.retailForm.ProspectType === 'Exchange'
      ? (+this.retailForm.DealExchTracAmt || 0)
      : 0;
    const disbursed = this.retailForm.FinanceStatus === 'Disbursed'
      ? (+this.retailForm.DisburseAmount || 0)
      : 0;

    this.customerDues = sp - dp - booking - addl - dealExch - disbursed;

    // Update MktOsleft (same as customerDues in this context)
    this.retailForm.MktOsleft = this.customerDues;
  }

  // ════════════════════════════════════════════════════
  //  FORM VALIDATION
  // ════════════════════════════════════════════════════
  private validateForm(): boolean {
    this.formErrors = {};
    let valid = true;

    if (!this.retailForm.ProspectType) {
      this.formErrors['ProspectType'] = 'Prospect Type is required.';
      valid = false;
    }

    if (!this.retailForm.PaymentMode) {
      this.formErrors['PaymentMode'] = 'Payment Type is required.';
      valid = false;
    }

    // Exchange validations
    if (this.retailForm.ProspectType === 'Exchange') {
      if (!this.retailForm.ExchangeMake) {
        this.formErrors['ExchangeMake'] = 'Make is required.';
        valid = false;
      }
      if (!this.retailForm.ExchangeModel) {
        this.formErrors['ExchangeModel'] = 'Model is required.';
        valid = false;
      }
      if (!this.retailForm.ExchangeHpCategory) {
        this.formErrors['ExchangeHpCategory'] = 'HP Category is required.';
        valid = false;
      }
      if (!this.retailForm.ExchangeMfgYear) {
        this.formErrors['ExchangeMfgYear'] = 'Mfg Year is required.';
        valid = false;
      }
      if (!this.retailForm.MktExchTracAmt) {
        this.formErrors['MktExchTracAmt'] = 'Market Value is required.';
        valid = false;
      }
      if (!this.retailForm.DealExchTracAmt) {
        this.formErrors['DealExchTracAmt'] = 'Deal Price is required.';
        valid = false;
      }
      // Gap check: difference cannot exceed 1,00,000
      if (this.retailForm.MktExchTracAmt && this.retailForm.DealExchTracAmt) {
        const gap = Math.abs(+this.retailForm.MktExchTracAmt - +this.retailForm.DealExchTracAmt);
        if (gap > 100000) {
          this.formErrors['exchangeGap'] = 'Gap exceeds ₹1,00,000.';
          valid = false;
        }
      }
      if (!this.retailForm.exchangeStockEntry) {
        this.formErrors['exchangeStockEntry'] = 'Exchange Stock Entry type is required.';
        valid = false;
      }
      if (this.retailForm.exchangeStockEntry && !this.retailForm.exchangeStockEntryValue) {
        this.formErrors['exchangeStockEntryValue'] = 'This field is required.';
        valid = false;
      }
    }

    // Loan validations
    if (this.retailForm.PaymentMode === 'Loan') {
      if (!this.retailForm.LoanAmount || +this.retailForm.LoanAmount < 100000) {
        this.formErrors['LoanAmount'] = 'Loan Amount must be at least ₹1,00,000.';
        valid = false;
      }
      if (!this.retailForm.FinancerName) {
        this.formErrors['FinancerName'] = 'Financer Name is required.';
        valid = false;
      }
      if (!this.retailForm.LoanType) {
        this.formErrors['LoanType'] = 'Loan Type is required.';
        valid = false;
      }
      if (!this.retailForm.FinanceStatus) {
        this.formErrors['FinanceStatus'] = 'Finance Status is required.';
        valid = false;
      }
      if (this.showFinanceSubStatus && !this.retailForm.FinanceSubStatus) {
        this.formErrors['FinanceSubStatus'] = 'Finance Sub Status is required.';
        valid = false;
      }
      if (this.retailForm.FinanceStatus === 'Disbursed') {
        if (!this.retailForm.DisburseAmount || +this.retailForm.DisburseAmount < 100000) {
          this.formErrors['DisburseAmount'] = 'Disburse Amount must be at least ₹1,00,000.';
          valid = false;
        }
      }
    }

    return valid;
  }

  // ════════════════════════════════════════════════════
  //  SUBMIT
  // ════════════════════════════════════════════════════
  onSubmit(): void {
    if (!this.validateForm()) return;

    this.isSubmitting = true;

    const payload = {
      SalesId: this.selectedItem?.SalesId,
      ProspectType: this.retailForm.ProspectType,
      PaymentMode: this.retailForm.PaymentMode,
      AdditionalPayment: this.retailForm.AdditionalPayment || 0,

      // Loan fields
      LoanAmount: this.retailForm.PaymentMode === 'Loan' ? this.retailForm.LoanAmount : null,
      FinancerName: this.retailForm.PaymentMode === 'Loan'
        ? (this.retailForm.FinancerName === 'OTHER' ? this.customFinancerName : this.retailForm.FinancerName)
        : null,
      LoanType: this.retailForm.PaymentMode === 'Loan' ? this.retailForm.LoanType : null,
      FinanceStatus: this.retailForm.PaymentMode === 'Loan' ? this.retailForm.FinanceStatus : null,
      FinanceSubStatus: this.retailForm.PaymentMode === 'Loan' && this.showFinanceSubStatus
        ? this.retailForm.FinanceSubStatus : null,
      DisburseAmount: this.retailForm.FinanceStatus === 'Disbursed' ? this.retailForm.DisburseAmount : null,

      // Exchange fields
      ExchangeMake: this.retailForm.ProspectType === 'Exchange'
        ? (this.retailForm.ExchangeMake === 'OTHER' ? this.customExchangeMake : this.retailForm.ExchangeMake)
        : null,
      ExchangeModel: this.retailForm.ProspectType === 'Exchange' ? this.retailForm.ExchangeModel : null,
      ExchangeHpCategory: this.retailForm.ProspectType === 'Exchange' ? this.retailForm.ExchangeHpCategory : null,
      ExchangeMfgYear: this.retailForm.ProspectType === 'Exchange' ? this.retailForm.ExchangeMfgYear : null,
      MktExchTracAmt: this.retailForm.ProspectType === 'Exchange' ? this.retailForm.MktExchTracAmt : null,
      DealExchTracAmt: this.retailForm.ProspectType === 'Exchange' ? this.retailForm.DealExchTracAmt : null,
      CustomerAskExchTracAmt: this.retailForm.ProspectType === 'Exchange' ? this.retailForm.CustomerAskExchTracAmt : null,
      ExchangeStockEntry: this.retailForm.ProspectType === 'Exchange' ? this.retailForm.exchangeStockEntry : null,
      ExchangeStockEntryValue: this.retailForm.ProspectType === 'Exchange' ? this.retailForm.exchangeStockEntryValue : null
    };

    //this.apis.updateOldRetailedEnquiry(payload).subscribe({
    //  next: (res: any) => {
    //    this.isSubmitting = false;
    //    if (res.statusCode === 200) {
    //      this.apis.showAlert('success', 'Success!', 'Enquiry updated successfully.');
    //      this.closeModal();
    //      this.getEnquiryList(this.currentPage);
    //    } else {
    //      this.apis.showAlert('error', 'Error!', res.message || 'Submission failed. Please try again.');
    //    }
    //  },
    //  error: () => {
    //    this.isSubmitting = false;
    //    this.apis.showAlert('error', 'Error!', 'An error occurred while submitting. Please try again.');
    //  }
    //});
  }

  // ════════════════════════════════════════════════════
  //  CLOSE MODAL
  // ════════════════════════════════════════════════════
  closeModal(): void {
    if (this.modal) this.modal.hide();
    this.selectedItem = null;
    this.formErrors = {};
    this.retailForm = {};
    this.additionalHistoryList = [];
    this.activeTab = 'retail';
    this.isSubmitting = false;
    this.customExchangeMake = '';
    this.customFinancerName = '';
    this.showFinanceSubStatus = false;
  }
}
