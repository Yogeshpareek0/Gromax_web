import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getApisResponse } from '../../model/apiresponse';

declare var bootstrap: any;

@Component({
  selector: 'app-installation',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './installation.component.html',
  styleUrl: './installation.component.css'
})
export class InstallationComponent implements OnInit {

  installationList: any[] = [];
  installationCount: any[] = [];
  apiresponse: getApisResponse = { message: null, data: null };

  positionId: any;
  userName: any;

  activeLead: string = 'TotalDelivery';

  installationImages: { Url: string }[] = [];
  lightboxIndex: number = 0;

  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  stateList: any[] = [];
  dealerList: any[] = [];
  selectedState: string = 'All';
  selectedDealership: string = 'All';

  selectedDuration: string = 'thisMonth';

  customStartMonth: number;
  customStartYear: number;
  customEndMonth: number;
  customEndYear: number;

  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  years: number[] = [];

  constructor(private http: HttpClient, private apis: AuthService) {
    const now = new Date();
    this.customStartMonth = now.getMonth() + 1;
    this.customStartYear = now.getFullYear();
    this.customEndMonth = now.getMonth() + 1;
    this.customEndYear = now.getFullYear();

    for (let y = now.getFullYear(); y >= now.getFullYear() - 11; y--) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    this.getStateList();
    this.getInstallationv1();
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
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Something went wrong while fetching state list.');
      }
    });
  }

  onStateChange(): void {
    this.selectedDealership = 'All';
    this.dealerList = [];
    if (this.selectedState) {
      this.getDealersByState(this.selectedState);
    }
  }

  getDealersByState(stateName: string): void {
    this.apis.getDealerAccByState({ stateName }).subscribe({
      next: (res: any) => {
        if (res?.statusCode === 200 && Array.isArray(res.data)) {
          this.dealerList = res.data;
        } else {
          this.dealerList = [];
        }
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
        startDate = new Date(this.customStartYear, this.customStartMonth - 1, 1);
        endDate = new Date(this.customEndYear, this.customEndMonth, 0);
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

  getInstallationv1(page: number = 1): void {
   
    const offset = (page - 1) * this.itemsPerPage;
    const { startDate, endDate } = this.getDateRange();

    const request = {
      Status: this.activeLead,
      PageSize: this.itemsPerPage.toString(),
      RowStart: offset.toString(),
      StateName: this.selectedState || 'All',
      Dealership: this.selectedDealership || 'All',
      StartDate: startDate,
      EndDate: endDate,
      IsDownload:'No'
    };

    this.apis.getInstallationv1(request).subscribe({
      next: (res: any) => {
        
        if (res.Message && res.Message.toLowerCase() === 'success') {
          this.installationList = res.InstallationList || [];
          this.installationCount = res.InstallationCount || [];

          if (this.activeLead === 'TotalPending') {
            this.totalItems = this.installationCount[0]?.TotalPending || 0;
          } else if (this.activeLead === 'TotalDelivery') {
            this.totalItems = this.installationCount[0]?.TotalDelivery || 0;
          } else if (this.activeLead === 'TotalDone') {
            this.totalItems = this.installationCount[0]?.TotalDone || 0;
          } else {
            this.totalItems = this.installationList.length > 0
              ? (this.installationList[0].TotalCounts || this.installationList.length)
              : 0;
          }
          this.currentPage = page;
          
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onShowReport(): void {
    this.activeLead = 'TotalDelivery';
    this.getInstallationv1();
  }

  setActiveLead(type: string): void {
    this.activeLead = type;
    this.getInstallationv1();
  }

  onPageChange(page: number): void {
    this.getInstallationv1(page);
  }

  exportToExcel(): void {
    const { startDate, endDate } = this.getDateRange();

    const request = {
      Status: this.activeLead,
      PageSize: '0',
      RowStart: '0',
      StateName: this.selectedState || 'All',
      Dealership: this.selectedDealership || 'All',
      StartDate: startDate,
      EndDate: endDate,
      IsDownload: 'Yes'
    };

    this.apis.getInstallationv1(request).subscribe({
      next: (res: any) => {
        if (res.Message && res.Message.toLowerCase() === 'success') {
          const data: any[] = res.InstallationList || [];

          if (!data.length) {
            this.apis.showAlert('error', 'Info', 'No data available to download.');
            return;
          }

          const excludeKeys = ['InstallationId', 'TotalCounts'];
          const headers = Object.keys(data[0]).filter(k => !excludeKeys.includes(k));

          const rows = data.map(item => {
            const row: any = {};
            headers.forEach(h => row[h] = item[h] ?? '');
            return row;
          });

          import('xlsx').then(XLSX => {
            const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Installation');
            const fileName = `Installation_${this.activeLead}_${startDate}_to_${endDate}.xlsx`;
            XLSX.writeFile(wb, fileName);
          });

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to fetch data for download.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while downloading.');
      }
    });
  }

  onRowClick(installationId: string): void {
    const request = { Id: installationId };

    this.apis.getImagesOnId(request).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && res.data) {
          this.installationImages = res.data
            ?.filter((i: any) => i?.ImgUrl)
            .map((i: any) => ({ Url: i.ImgUrl })) || [];

          const modalEl = document.getElementById('installationModal');
          if (modalEl) {
            // Blur focus before hide to prevent aria-hidden warning
            modalEl.addEventListener('hide.bs.modal', () => {
              (document.activeElement as HTMLElement)?.blur();
            }, { once: true });

            bootstrap.Modal.getOrCreateInstance(modalEl).show();
          }
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching images. Please try again.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching images. Please try again.');
      }
    });
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;

    const lightboxEl = document.getElementById('lightboxModal');
    const installModal = document.getElementById('installationModal');
    if (!lightboxEl) return;

    // Blur focus before lightbox hides to prevent aria-hidden warning
    lightboxEl.addEventListener('hide.bs.modal', () => {
      (document.activeElement as HTMLElement)?.blur();
    }, { once: true });

    // Restore parent modal's open state after lightbox fully closes
    lightboxEl.addEventListener('hidden.bs.modal', () => {
      setTimeout(() => {
        if (installModal?.classList.contains('show')) {
          document.body.classList.add('modal-open');
        }
      }, 10);
    }, { once: true });

    bootstrap.Modal.getOrCreateInstance(lightboxEl).show();
  }

  prevImage(): void {
    if (this.lightboxIndex > 0) this.lightboxIndex--;
  }

  nextImage(): void {
    if (this.lightboxIndex < this.installationImages.length - 1) this.lightboxIndex++;
  }
}
