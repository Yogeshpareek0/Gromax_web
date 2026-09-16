import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getApisResponse, PersonModel, filterApisResponse } from '../../model/apiresponse';

declare var bootstrap: any;

@Component({
  selector: 'app-assigndealerenquiry',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './assigndealerenquiry.component.html',
  styleUrl: './assigndealerenquiry.component.css'
})
export class AssigndealerenquiryComponent implements OnInit {

  installationList: any[] = [];
  apiresponse: getApisResponse = { message: null, data: null };

  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  selectedDuration: string = 'thisMonth';
  customStartDate: string = '';
  customEndDate: string = '';

  positionId: any;
  showSH = false;
  showAM = false;
  showTM = false;

  selectedIds: string[] = [];

  modalSelectedSH: string = '';
  modalSelectedAM: string = '';
  modalSelectedTM: string = '';
  modalSelectedDealer: string = '';

  modalStateHead: PersonModel[] = [];
  modalAreaManagersList: PersonModel[] = [];
  modalTerritoryManagersList: PersonModel[] = [];
  modalDealersList: PersonModel[] = [];

  constructor(private http: HttpClient, private apis: AuthService) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');

    if (this.positionId === 'National Sales Head') {
      this.showSH = true; this.showAM = true; this.showTM = true;
    } else if (this.positionId === 'State Head') {
      this.showAM = true; this.showTM = true;
    } else if (this.positionId === 'Area Manager') {
      this.showTM = true;
    }

    this.notAssignDealerList();
  }

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  onSelectRow(event: any, id: string): void {
    if (event.target.checked) {
      if (!this.selectedIds.includes(id)) {
        this.selectedIds = [...this.selectedIds, id];
      }
    } else {
      this.selectedIds = this.selectedIds.filter(x => x !== id);
    }
  }

  isAllSelected(): boolean {
    return this.installationList.length > 0 &&
      this.installationList.every(item => this.selectedIds.includes(item.Id));
  }

  onSelectAll(event: any): void {
    if (event.target.checked) {
      const currentPageIds = this.installationList.map(item => item.Id);
      const merged = [...new Set([...this.selectedIds, ...currentPageIds])];
      this.selectedIds = merged;
    } else {
      const currentPageIds = this.installationList.map(item => item.Id);
      this.selectedIds = this.selectedIds.filter(id => !currentPageIds.includes(id));
    }
  }

  onDurationChange(): void {
    if (this.selectedDuration !== 'custom') return;
    const now = new Date();
    this.customStartDate = this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    this.customEndDate = this.formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  getDateRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const cm = now.getMonth();
    const cy = now.getFullYear();
    let startDate: Date;
    let endDate: Date;

    switch (this.selectedDuration) {
      case 'thisMonth':
        startDate = new Date(cy, cm, 1);
        endDate = new Date(cy, cm + 1, 0);
        break;
      case 'thisQuarter': {
        const qStart = Math.floor(cm / 3) * 3;
        startDate = new Date(cy, qStart, 1);
        endDate = new Date(cy, qStart + 3, 0);
        break;
      }
      case 'thisFY': {
        const fyStartYear = cm >= 3 ? cy : cy - 1;
        startDate = new Date(fyStartYear, 3, 1);
        endDate = new Date(fyStartYear + 1, 2, 31);
        break;
      }
      case 'lastQuarter': {
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
        startDate = new Date(this.customStartDate);
        endDate = new Date(this.customEndDate);
        break;
      default:
        startDate = new Date(cy, cm, 1);
        endDate = new Date(cy, cm + 1, 0);
    }

    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate)
    };
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
  }

  notAssignDealerList(page: number = 1): void {
    const offset = (page - 1) * this.itemsPerPage;
    const { startDate, endDate } = this.getDateRange();

    const request = {
      PageSize: this.itemsPerPage,
      RowStart: offset,
      StartDate: startDate,
      EndDate: endDate
    };

    this.apis.notAssignDealerList(request).subscribe({
      next: (res: any) => {
        
        if (res?.message?.toLowerCase() === 'success') {
          this.installationList = res.data || [];
          this.totalItems = res.data?.[0]?.totalCount || 0;
          this.currentPage = page;
        } else {
          this.installationList = [];
          this.totalItems = 0;
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onShowReport(): void {
    this.selectedIds = [];
    this.notAssignDealerList();
  }

  onPageChange(page: number): void {
    this.notAssignDealerList(page);
  }

  openAssignModal(item: any): void {
    this.selectedIds = [item.Id];
    this.openModal();
  }

  openAssignModalMultiple(): void {
    this.openModal();
  }

  private openModal(): void {
    this.modalSelectedSH = '';
    this.modalSelectedAM = '';
    this.modalSelectedTM = '';
    this.modalSelectedDealer = '';
    this.modalAreaManagersList = [];
    this.modalTerritoryManagersList = [];
    this.modalDealersList = [];

    this.loadModalHOFilter('', '', '', '');

    const modalEl = document.getElementById('assignDealerModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  loadModalHOFilter(sh: string, am: string, tm: string, dealer: string): void {
    this.apis.getHOFilter({ ShMail: sh, AmMail: am, TmMail: tm, DealerMail: dealer }).subscribe({
      next: (data: any) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.modalStateHead = [{ Mail: '', Name: 'Select' }, ...(this.apiresponse.data.stateHead || [])];
          this.modalAreaManagersList = [{ Mail: '', Name: 'Select' }, ...(this.apiresponse.data.areaManagers || [])];
          this.modalTerritoryManagersList = [{ Mail: '', Name: 'Select' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.modalDealersList = [{ Mail: '', Name: 'Select' }, ...(this.apiresponse.data.dealers || [])];
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Error fetching filter data.');
      }
    });
  }

  onModalStateChange(sh: string): void {
    this.modalSelectedAM = '';
    this.modalSelectedTM = '';
    this.modalSelectedDealer = '';
    this.apis.getHOFilter({ ShMail: sh, AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data: any) => {
        if (data.message?.toLowerCase() === 'success') {
          this.modalAreaManagersList = [{ Mail: '', Name: 'Select' }, ...(data.data.areaManagers || [])];
          this.modalTerritoryManagersList = [{ Mail: '', Name: 'Select' }, ...(data.data.territoryManagers || [])];
          this.modalDealersList = [{ Mail: '', Name: 'Select' }, ...(data.data.dealers || [])];
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching data.'); }
    });
  }

  onModalAreaChange(am: string): void {
    this.modalSelectedTM = '';
    this.modalSelectedDealer = '';
    this.apis.getHOFilter({ ShMail: this.modalSelectedSH, AmMail: am, TmMail: '', DealerMail: '' }).subscribe({
      next: (data: any) => {
        if (data.message?.toLowerCase() === 'success') {
          this.modalTerritoryManagersList = [{ Mail: '', Name: 'Select' }, ...(data.data.territoryManagers || [])];
          this.modalDealersList = [{ Mail: '', Name: 'Select' }, ...(data.data.dealers || [])];
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching data.'); }
    });
  }

  onModalTerritoryChange(tm: string): void {
    this.modalSelectedDealer = '';
    this.apis.getHOFilter({ ShMail: this.modalSelectedSH, AmMail: this.modalSelectedAM, TmMail: tm, DealerMail: '' }).subscribe({
      next: (data: any) => {
        if (data.message?.toLowerCase() === 'success') {
          this.modalDealersList = [{ Mail: '', Name: 'Select' }, ...(data.data.dealers || [])];
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching data.'); }
    });
  }

  onAssignDealer(): void {
    if (!this.modalSelectedDealer) {
      this.apis.showAlert('error', 'Error!', 'Please select a dealer.');
      return;
    }

    if (this.selectedIds.length === 0) {
      this.apis.showAlert('error', 'Error!', 'No enquiry selected.');
      return;
    }

    // Single ya multiple dono ke liye same payload — Ids array mein
    const payload = {
      Ids: this.selectedIds,
      DealerCode: this.modalSelectedDealer
    };

    this.apis.assignDealerToEnquiry(payload).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success', 'Dealer assigned successfully!').then(() => {
            const modalEl = document.getElementById('assignDealerModal');
            if (modalEl) { const m = bootstrap.Modal.getInstance(modalEl); m?.hide(); }
            this.selectedIds = [];
            this.notAssignDealerList(this.currentPage);
          });
        } else {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to assign dealer.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.');
      }
    });
  }
}
