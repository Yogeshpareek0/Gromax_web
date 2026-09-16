import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getApisResponse, LeadCount, SalesTarget, EnquiryBox, Metric } from '../../model/apiresponse';
declare var bootstrap: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  leadCount: LeadCount[] = [];
  salesTargetList: SalesTarget[] = [];
  enquiryBox: EnquiryBox[] = [];
  apiresponse: getApisResponse = { message: null, data: null };

  selectedFilter: string = 'This Month';
  activeLead: string = '';
  activeType: string = '';
  startdate_val: string = '';
  enddate_val: string = '';
  dealerCode: any;
  dealerName: any;
  possitionId: any;
  mobileNo: any;
  displayDateInputs: boolean = false;
  popupTitle: string = '';
  lastUpdated: string = '';
  tickerItems: string[] = [];

  unassignedCount: number = 0;
  threeDaysOveEnq: number = 0;


  metrics: Metric[] = [
    {
      key: '90+ O/S', label: '90+ Outstanding', icon: 'fa-solid fa-hourglass-half', color: '#ef4444', bg: '#fef2f2', border: '#f39292', keyActiveValue: 0, keyInActiveValue: 0
    },

    {
      key: '90+ Adv', label: '90+ Advance', icon: 'fa-solid fa-calendar-check', color: '#f97316', bg: '#fff7ed', border: '#cd9e69', keyActiveValue: 0, keyInActiveValue: 0
    },

    {
      key: '90+ Stk', label: '90+ Stock', icon: 'fa-solid fa-boxes-stacked', color: '#eab308', bg: '#fefce8', border: '#c1ad5d', keyActiveValue: 0, keyInActiveValue: 0
    },

    {
      key: '90+ Exc', label: '90+ Exchange', icon: 'fa-solid fa-right-left', color: '#8b5cf6', bg: '#f5f3ff', border: '#9e93d5', keyActiveValue: 0, keyInActiveValue: 0
    },

    {
      key: 'OD Enq', label: 'OD Enquiry', icon: 'fa-solid fa-file-circle-question', color: '#0ea5e9', bg: '#f0f9ff', border: '#72a7c3', keyActiveValue: 0, keyInActiveValue: 0
    },

    {
      key: 'Todays Follow Up Enq', label: "Today's Follow Up", icon: 'fa-solid fa-phone-volume', color: '#10b981', bg: '#f0fdf4', border: '#60b78f', keyActiveValue: 0, keyInActiveValue: 0
    },
  ];

  constructor(private http: HttpClient, private router: Router, private apis: AuthService) { }

  ngOnInit(): void {
    this.getLeadsFollowup();
    this.getsalesTarget(this.selectedFilter);
    this.getBusinessPerformance(this.selectedFilter);

    this.dealerCode = sessionStorage.getItem('dealerCode');
    this.dealerName = sessionStorage.getItem('name') || '';
    this.possitionId = sessionStorage.getItem('possitionId') || '';
    this.mobileNo = sessionStorage.getItem('mobileNo') || '';

    this.loadPopUpCount();
    this.reportLastDateHeading();
  }

  loadPopUpCount() {
    this.apis.getPopUpCount().subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          this.metrics.forEach(m => {
            switch (m.key) {
              case '90+ O/S':
                m.keyActiveValue = data.OutStandingAbove90 || 0;
                m.keyInActiveValue = data.InOutStandingAbove90 || 0;
                break;
              case '90+ Adv':
                m.keyActiveValue = data.AdvanceAbove60 || 0;
                m.keyInActiveValue = data.InAdvanceAbove60 || 0;
                break;
              case '90+ Stk':
                m.keyActiveValue = data.StockAbove60 || 0;
                m.keyInActiveValue = data.InStockAbove60 || 0;
                break;
              case '90+ Exc':
                m.keyActiveValue = data.ExchangeAbove90 || 0;
                m.keyInActiveValue = data.InExchangeAbove90 || 0;
                break;
              case 'OD Enq':
                m.keyActiveValue = data.OdEnquiry || 0;
                m.keyInActiveValue = data.InOdEnquiry || 0;
                break;
              case 'Todays Follow Up Enq':
                m.keyActiveValue = data.TodayEnquiry || 0;
                m.keyInActiveValue = data.InTodayEnquiry || 0;
                break;
            }
          });
          this.lastUpdated = new Date().toLocaleTimeString();
          this.openModal();
        }
        else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  //get totalActive(): number {
  //  return this.metrics.reduce((sum, m) => sum + (m.keyActiveValue || 0), 0);
  //}

  //get totalInactive(): number {
  //  return this.metrics.reduce((sum, m) => sum + (m.keyInActiveValue || 0), 0);
  //}

  reportLastDateHeading() {
    this.apis.reportLastDateHeading().subscribe({
      next: (res: any) => {
       
        if (res.statusCode === 200 && res.data) {
          this.tickerItems = Object.values(res.data).map(
            (value) => value
          ) as string[];
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  openModal() {
    const el = document.getElementById('dlrPopupModal');
    if (el) {
      const modal = new bootstrap.Modal(el, { backdrop: 'static', keyboard: false });
      modal.show();
    }
  }

  closeModal(): void {
  
    const el = document.getElementById('dlrPopupModal');
    if (el) {
      const modal = bootstrap.Modal.getInstance(el);
      modal?.hide();
      if ((this.possitionId || '').toLowerCase() === 'state head') {
        this.openUnassignedModal();
      }
      else if ((this.possitionId || '').toLowerCase() === 'territory manager' || (this.possitionId || '').toLowerCase() === 'area manager') {
        this.openoverdueModalModal();
      }
    }
  }

  datefilterchange(value: string): void {
    this.displayDateInputs = value === 'Custom';
  }

  onDurationChange(value: string): void {
    this.selectedFilter = value;
    this.getsalesTarget(value);
    this.getBusinessPerformance(value);
  }

  getLeadsFollowup(): void {
    this.apis.getLeadsFollowup().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.leadCount = res.data as LeadCount[];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  getsalesTarget(value: string): void {
    this.apis.getsalesTarget(value).subscribe({
      next: (res: any) => {
        if (res?.length) {
          this.salesTargetList = res as SalesTarget[];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  getBusinessPerformance(filter: string): void {
    const { startDateISO, endDateISO } = this.getDateRange();
    const request = {
      Startdate: startDateISO,
      Enddate: endDateISO,
      Source: '',
      ShMail: '',
      AmMail: '',
      TmMail: '',
      DealerMail: '',
      BoxFilter: '',
      PageSize: '10',
      RowStart: '0'
    };
    this.apis.getBusinessPerformance(request).subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase()?.trim() === 'success') {
          this.enquiryBox = response.data?.getBoxes || [];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data');
        }
      },
      error: (err: any) => {
        this.apis.showAlert('error', 'Error!', err);
      }
    });
  }

  setActiveLead(type: string): void {
    this.activeLead = type;
    this.activeType = '';
    this.router.navigate(['/main/enquiryfollowup'], {
      queryParams: { EnquiryStatus: this.activeLead, EnquiryType: this.activeType }
    });
  }

  setActiveType(type: string): void {
    this.activeType = type;
    this.activeLead = '';
    this.router.navigate(['/main/enquiryfollowup'], {
      queryParams: { EnquiryStatus: this.activeLead, EnquiryType: this.activeType }
    });
  }

  setActiveEnquiryType(type: string): void {
    const durationMap: { [key: string]: string } = {
      'This Month': 'Month',
      'This Quarter': 'Quarter',
      'This Year': 'Financial Year'
    };

    this.router.navigate(['/main/business_performance'], {
      queryParams: {
        ActiveLead: type,
        Duration: durationMap[this.selectedFilter] || 'Month'
      }
    });
  }

  getProgress(achieved: number | string, target: number | string): number {
    const a = Number(achieved) || 0;
    const t = Number(target) || 0;
    if (t === 0) return 0;
    return Math.min((a / t) * 100, 100);
  }

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }

  private getDateRange(): { startDateISO: string; endDateISO: string } {
    let startDateISO = '';
    let endDateISO = '';

    if (this.selectedFilter === 'This Month') {
      const now = new Date();
      startDateISO = this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
      endDateISO = this.formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      this.startdate_val = '';
      this.enddate_val = '';
      this.displayDateInputs = false;
    }
    else if (this.selectedFilter === 'This Quarter') {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3);
      startDateISO = this.formatDate(new Date(now.getFullYear(), q * 3, 1));
      endDateISO = this.formatDate(new Date(now.getFullYear(), (q + 1) * 3, 0));
      this.startdate_val = '';
      this.enddate_val = '';
      this.displayDateInputs = false;
    }
    else if (this.selectedFilter === 'This Year') {
      const now = new Date();
      const fyStart = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
      startDateISO = this.formatDate(new Date(fyStart, 3, 1));
      endDateISO = this.formatDate(new Date(fyStart + 1, 2, 31));
      this.startdate_val = '';
      this.enddate_val = '';
      this.displayDateInputs = false;
    }
    else if (this.selectedFilter === 'Custom') {
      startDateISO = this.startdate_val;
      endDateISO = this.enddate_val;
      this.displayDateInputs = true;
    }
    else {
      this.startdate_val = '';
      this.enddate_val = '';
      this.displayDateInputs = false;
    }

    return { startDateISO, endDateISO };
  }


  // Modal open karo
  openUnassignedModal(): void {
    this.apis.getUnassignedCount().subscribe({
      next: (res: any) => {
        this.unassignedCount = res.data._count ?? 0;
        //this.threeDaysOveEnq = res.data.threeDaysOveEnq ?? 0;
        //this.unassignedCount = 25;
        if (this.unassignedCount > 0) {
          const el = document.getElementById('unassignedModal');
          if (el) {
            const modal = new bootstrap.Modal(el, { backdrop: 'static' });
            modal.show();
          }
        }
      }
    });

    //const el = document.getElementById('unassignedModal');
    //if (el) {
    //  const modal = new bootstrap.Modal(el, { backdrop: 'static'});
    //  modal.show();
    //}
    //this.unassignedCount = 25;
  }


  // Modal open karo
  openoverdueModalModal(): void {
    this.apis.getUnassignedCount().subscribe({
      next: (res: any) => {
        //this.unassignedCount = res.data._count ?? 0;
        this.threeDaysOveEnq = res.data.threeDaysOveEnq ?? 0;
        //this.unassignedCount = 25;
        if (this.threeDaysOveEnq > 0) {
          const el = document.getElementById('overdueModal');
          if (el) {
            const modal = new bootstrap.Modal(el, { backdrop: 'static' });
            modal.show();
          }
        }
      }
    });

    //const el = document.getElementById('unassignedModal');
    //if (el) {
    //  const modal = new bootstrap.Modal(el, { backdrop: 'static'});
    //  modal.show();
    //}
    //this.unassignedCount = 25;
  }

  closeUnassignedModal(): void {
    const el = document.getElementById('unassignedModal');
    if (!el) return;

    const modal = bootstrap.Modal.getInstance(el);
    modal?.hide();

    // Backdrop manually hata do — safety ke liye
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }

  closeoverdueModalModal(): void {
    const el = document.getElementById('overdueModal');
    if (!el) return;

    const modal = bootstrap.Modal.getInstance(el);
    modal?.hide();

    // Backdrop manually hata do — safety ke liye
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }

  goToUnassigned(): void {
    this.closeUnassignedModal();
    this.router.navigate(['main/assigndealerenquiry']);
  }

  goToOverdue() {
    this.closeUnassignedModal();
    this.router.navigate(['main/threedaysodenqu']);
  }
}
