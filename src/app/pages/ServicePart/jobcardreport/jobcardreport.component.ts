import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';

@Component({
  selector: 'app-jobcardreport',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './jobcardreport.component.html',
  styleUrl: './jobcardreport.component.css'
})
export class JobcardreportComponent implements OnInit {

  readonly jobCardTypes: string[] = ['Free Service', 'Paid Service', 'Warranty Job Card', 'Post Warranty Job Card', 'Accidental Job card', 'PDI job card'];

  summaryCards = [
    { key: 'totalJobCard', label: 'Total Job Card', color: '#215378', icon: 'fa-solid fa-clipboard-list' },
    { key: 'freeService', label: 'Free Service', color: '#4D963A', icon: 'fa-solid fa-gift' },
    { key: 'paidService', label: 'Paid Service', color: '#4796BD', icon: 'fa-solid fa-indian-rupee-sign' },
    { key: 'warrantyJobCard', label: 'Warranty', color: '#D59D3E', icon: 'fa-solid fa-shield-halved' },
    { key: 'postWarrantyJobCard', label: 'Post Warranty', color: '#8a5cc7', icon: 'fa-solid fa-shield' },
    { key: 'accidentalJobCard', label: 'Accidental', color: '#E45E2E', icon: 'fa-solid fa-car-burst' },
    { key: 'pdiJobCard', label: 'PDI', color: '#518cc7', icon: 'fa-solid fa-clipboard-check' }
  ];

  allReportList: any[] = [];
  filteredList: any[] = [];
  reportList: any[] = [];
  jobCardCount: any = {};

  positionId: any;
  userName: any;

  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  stateList: any[] = [];
  dealerList: any[] = [];
  selectedState: string = 'All';
  selectedDealership: string = 'All';
  selectedJobType: string = 'All';
  selectedDuration: string = 'this Month';
  searchText: string = '';

  customStartMonth: number;
  customStartYear: number;
  customEndMonth: number;
  customEndYear: number;

  isLoading: boolean = false;

  generatingPdfId: string | null = null;

  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  years: number[] = [];

  constructor(private apis: AuthService) {
    const now = new Date();
    this.customStartMonth = now.getMonth() + 1;
    this.customStartYear = now.getFullYear();
    this.customEndMonth = now.getMonth() + 1;
    this.customEndYear = now.getFullYear();
    for (let y = now.getFullYear(); y >= now.getFullYear() - 11; y--) this.years.push(y);
  }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    this.getStateList();
    this.getJobCardReport();
  }

  getStateList(): void {
    this.apis.getStateListReport().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.stateList = res.data;
          this.getDealersByState('All');
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching state list.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Something went wrong while fetching state list.')
    });
  }

  onStateChange(): void {
    this.selectedDealership = 'All';
    this.dealerList = [];
    if (this.selectedState) this.getDealersByState(this.selectedState);
  }

  getDealersByState(stateName: string): void {
    this.apis.getDealerAccByState({ stateName }).subscribe({
      next: (res: any) => {
        this.dealerList = (res?.statusCode === 200 && Array.isArray(res.data)) ? res.data : [];
      },
      error: () => {
        this.dealerList = [];
        this.apis.showAlert('error', 'Error!', 'Something went wrong while fetching dealers.');
      }
    });
  }

  onDurationChange(): void {
    if (this.selectedDuration !== 'custom') return;
    const now = new Date();
    this.customStartMonth = now.getMonth() + 1;
    this.customStartYear = now.getFullYear();
    this.customEndMonth = now.getMonth() + 1;
    this.customEndYear = now.getFullYear();
  }

  getDateRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const cm = now.getMonth();
    const cy = now.getFullYear();
    let startDate: Date;
    let endDate: Date;

    switch (this.selectedDuration) {
      case 'this Month':
        startDate = new Date(cy, cm, 1);
        endDate = new Date(cy, cm + 1, 0);
        break;
      case 'this Quarter': {
        const qStart = Math.floor(cm / 3) * 3;
        startDate = new Date(cy, qStart, 1);
        endDate = new Date(cy, qStart + 3, 0);
        break;
      }
      case 'this FY': {
        const fyStartYear = cm >= 3 ? cy : cy - 1;
        startDate = new Date(fyStartYear, 3, 1);
        endDate = new Date(fyStartYear + 1, 2, 31);
        break;
      }
      case 'last Quarter': {
        const lqStart = Math.floor(cm / 3) * 3 - 3;
        if (lqStart < 0) {
          startDate = new Date(cy - 1, 9, 1);
          endDate = new Date(cy - 1, 12, 0);
        } else {
          startDate = new Date(cy, lqStart, 1);
          endDate = new Date(cy, lqStart + 3, 0);
        }
        break;
      }
      case 'custom':
        startDate = new Date(this.customStartYear, this.customStartMonth - 1, 1);
        endDate = new Date(this.customEndYear, this.customEndMonth, 0);
        break;
      default:
        startDate = new Date(cy, cm, 1);
        endDate = new Date(cy, cm + 1, 0);
    }
    return { startDate: this.formatDate(startDate), endDate: this.formatDate(endDate) };
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
  }

  getJobCardReport(): void {
    const { startDate, endDate } = this.getDateRange();

    const request = {
      DealerMail: this.selectedDealership || 'All',
      StateName: this.selectedState || 'All',
      Duration: this.selectedDuration,
      StDate: startDate,
      EnDate: endDate,
      JobType: this.selectedJobType || 'All'
    };

    this.isLoading = true;
    this.apis.getJobCardReport(request).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.statusCode === 200 && res?.message?.toLowerCase() === 'success') {
          this.allReportList = res.data?.report || [];
          this.jobCardCount = res.data?.count?.[0] || {};
          this.applySearch();
        } else {
          this.resetData();
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.resetData();
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  private resetData(): void {
    this.allReportList = [];
    this.filteredList = [];
    this.reportList = [];
    this.jobCardCount = {};
    this.totalItems = 0;
  }

  onShowReport(): void {
    this.getJobCardReport();
  }

  searchValue(input: HTMLInputElement): void {
    this.searchText = input.value?.trim().toLowerCase() || '';
    this.applySearch();
  }

  // API me pagination nahi hai, isliye client side search + paging
  private applySearch(): void {
    const s = this.searchText;
    this.filteredList = !s ? [...this.allReportList] : this.allReportList.filter(r =>
      (r.JobCardNo || '').toLowerCase().includes(s) ||
      (r.CustomerName || '').toLowerCase().includes(s) ||
      (r.CustomerMobile || '').toLowerCase().includes(s)
    );
    this.totalItems = this.filteredList.length;
    this.onPageChange(1);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    const start = (page - 1) * this.itemsPerPage;
    this.reportList = this.filteredList.slice(start, start + this.itemsPerPage);
  }

  exportToExcel(): void {
    if (!this.filteredList.length) {
      this.apis.showAlert('error', 'Info', 'No data available to download.');
      return;
    }

    const rows = this.filteredList.map((r, i) => ({
      'S.No.': i + 1,
      'State': r.StateName ?? '',
      'Dealer Code': r.DealerCode ?? '',
      'Dealer Name': r.DealerName ?? '',
      'Location': r.Location ?? '',
      'Job Card No': r.JobCardNo ?? '',
      'Job Card Date': this.toDDMMYYYY(r.JobCardDate),
      'Job Card Type': r.JobCardType ?? '',
      'Customer Name': (r.CustomerName ?? '').trim(),
      'Customer Mobile': r.CustomerMobile ?? '',
      'Regn No': r.RegnNo ?? '',
      'Model': r.Model ?? '',
      'Work Hours': r.WorkHours ?? '',
      'Date Of Sale': this.toDDMMYYYY(r.DateOfSale),
      'Work Nature': r.WorkNature ?? '',
      'PDF URL': r.pdfURL ?? ''
    }));

    const { startDate, endDate } = this.getDateRange();
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'JobCard');
      XLSX.writeFile(wb, `JobCardReport_${this.selectedJobType}_${startDate}_to_${endDate}.xlsx`);
    });
  }

  private toDDMMYYYY(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  }

  openJobCardPdf(item: any): void {
    // URL pehle se hai to API call nahi, seedha open
    if (item.pdfURL) {
      window.open(item.pdfURL, '_blank');
      return;
    }

    if (this.generatingPdfId) return;

    // Popup blocker se bachne ke liye tab pehle hi khol do
    const win = window.open('', '_blank');
    this.generatingPdfId = item.jobCardMasterId;

    this.apis.addJobCardPdf(item.jobCardMasterId).subscribe({
      next: (res: any) => {
        this.generatingPdfId = null;
        const url = res?.data;

        if (res?.statusCode === 200 && url) {
          item.pdfURL = url;   // row me set ho jayega (same reference, to allReportList/Excel me bhi)
          if (win) win.location.href = url;
          else window.open(url, '_blank');
        } else {
          win?.close();
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to generate PDF.');
        }
      },
      error: () => {
        this.generatingPdfId = null;
        win?.close();
        this.apis.showAlert('error', 'Error!', 'Something went wrong while generating PDF.');
      }
    });
  }
}
