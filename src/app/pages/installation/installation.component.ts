import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getApisResponse, UploadSlot } from '../../model/apiresponse';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';


declare var bootstrap: any;


@Component({
  selector: 'app-installation',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './installation.component.html',
  styleUrl: './installation.component.css'
})


export class InstallationComponent implements OnInit {


  readonly IMAGE_LABELS: string[] = ['Cluster Meter Photo', 'Tractor with Implements Photo', 'Photo with Customer', 'Chassis Plate Photo'];

  uploadSlots: UploadSlot[] = [];
  selectedInstallation: any = null;
  workingHrs: string = '';
  installAddress: string = '';
  latitude: string = '';
  longitude: string = '';
  locationStatus: 'idle' | 'fetching' | 'done' | 'failed' = 'idle';
  isUploading: boolean = false;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  readonly MAX_REMARK_CHARS = 100;

  isAddressLoading: boolean = false;

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
  selectedChassis: string = '';


  IsEditablePermission: boolean = false;
  IsAddPermission: boolean = false;


  approvalItem: any = null;
  approvalRemark: string = '';
  isApproving: boolean = false;
  isApprovalImgLoading: boolean = false;

  mobileNo: string = '';

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
  get remarkWordCount(): number {
    const text = this.approvalRemark?.trim();
    return text ? text.split(/\s+/).length : 0;
  }
  constructor(private http: HttpClient, private apis: AuthService, private toaster: ToastrService) {
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
    if (this.positionId === 'Dealer' || this.positionId === 'National Sales Head') {
      this.IsAddPermission = true;
    }
    //if (this.positionId === 'National Service Head' || this.positionId === 'National Sales Head') {
    //  this.IsEditablePermission = true;
    //}
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
      IsDownload: 'No',
      ChassisNo: this.selectedChassis?.trim() || null
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
          }
          else if (this.activeLead === 'ApprovalPending') {
            this.totalItems = this.installationCount[0]?.ApprovalPending || 0;
          }
          else {
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
      IsDownload: 'Yes',
      ChassisNo: this.selectedChassis || null
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
    if (!lightboxEl) return;

    // Blur focus before lightbox hides to prevent aria-hidden warning
    lightboxEl.addEventListener('hide.bs.modal', () => {
      (document.activeElement as HTMLElement)?.blur();
    }, { once: true });

    // Restore parent modal's open state after lightbox fully closes
    lightboxEl.addEventListener('hidden.bs.modal', () => {
      setTimeout(() => {
        if (document.querySelector('.modal.show')) {
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


  /*  upload Installation*/

  onClickAddIcon(item: any): void {
    this.selectedInstallation = item;
    this.resetUploadForm();
    this.fetchLocation();

    //if (this.IsEditablePermission) {
    //  this.workingHrs = item?.workHrs != null ? item.workHrs.toString() : '';


    //  const request = { Id: item?.InstallationId };
    //  this.apis.getImagesOnId(request).subscribe({
    //    next: (res: any) => {
    //      if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
    //        this.installAddress = res?.data[0]?.Address;
    //        this.bindExistingImages(res.data);
    //      } else {
    //        this.toaster.error('Failed fetching images. Please try again.', 'Error');
    //      }
    //    },
    //    error: () => {
    //      this.toaster.error('An error occurred while fetching images. Please try again.', 'Error');
    //    }
    //  });
    //}

    const modalEl = document.getElementById('addInstallationModal');
    if (!modalEl) return;

    modalEl.addEventListener('hide.bs.modal', () => {
      (document.activeElement as HTMLElement)?.blur();
    }, { once: true });

    modalEl.addEventListener('hidden.bs.modal', () => {
      this.resetUploadForm();
    }, { once: true });

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  //private bindExistingImages(data: any[]): void {
  //  data.filter(d => d?.ImgUrl).forEach(d => {
  //    const tag = (d.TagName || '').trim().toLowerCase();
  //    let slot = this.uploadSlots.find(s => s.label.trim().toLowerCase() === tag);

  //    // TagName IMAGE_LABELS mein nahi mila to naya slot bana do
  //    if (!slot) {
  //      slot = { label: d.TagName || 'Image', file: null, preview: null, existingUrl: null };
  //      this.uploadSlots.push(slot);
  //    }

  //    slot.existingUrl = d.ImgUrl;
  //    slot.preview = d.ImgUrl;
  //  });
  //}

  private resetUploadForm(): void {
    this.uploadSlots?.forEach(s => s.file && s.preview && URL.revokeObjectURL(s.preview));
    this.uploadSlots = this.IMAGE_LABELS.map(label => ({
      label, file: null, preview: null, existingUrl: null
    }));
    this.workingHrs = '';
    this.installAddress = '';
    this.isUploading = false;
  }

  fetchLocation(): void {
    if (!navigator.geolocation) {
      this.locationStatus = 'failed';
      return;
    }
    this.locationStatus = 'fetching';
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.latitude = pos.coords.latitude.toString();
        this.longitude = pos.coords.longitude.toString();
        this.locationStatus = 'done';
        this.getAddressFromLatLng(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        this.latitude = '';
        this.longitude = '';
        this.locationStatus = 'failed';
        this.installAddress = '';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private getAddressFromLatLng(lat: number, lng: number): void {
    this.isAddressLoading = true;
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`;

    this.http.get<any>(url).subscribe({
      next: res => {
        this.isAddressLoading = false;
        if (this.installAddress?.trim()) return;

        const a = res?.address || {};
        const parts = [
          a.house_number,
          a.road,
          a.neighbourhood || a.suburb,
          a.village || a.town || a.city,
          a.state_district || a.county,
          a.state,
          a.postcode
        ].filter(Boolean);

        this.installAddress = parts.length ? parts.join(', ') : (res?.display_name || '');
      },
      error: () => {
        this.isAddressLoading = false;
      }
    });
  }

  onImageSelect(event: Event, idx: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // same file dobara select ho sake

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toaster.warning('Please select an image file only.', 'Invalid File');
      return;
    }
    if (file.size > this.MAX_FILE_SIZE) {
      this.toaster.warning('Image size should be less than 10 MB.', 'File Too Large');
      return;
    }

    const slot = this.uploadSlots[idx];
    if (slot.file && slot.preview) URL.revokeObjectURL(slot.preview);
    slot.file = file;
    slot.preview = URL.createObjectURL(file);
  }

  removeImage(idx: number): void {
    const slot = this.uploadSlots[idx];
    if (slot.file && slot.preview) URL.revokeObjectURL(slot.preview);
    slot.file = null;
    slot.preview = null;
    slot.existingUrl = null;
  }

  get selectedImageCount(): number {
    return this.uploadSlots.filter(s => s.file || s.existingUrl).length;
  }

  saveInstallation(): void {

    if (this.isUploading) return;

    if (!this.workingHrs?.toString().trim()) {
      this.toaster.warning('Please enter Working Hours.', 'Required');
      return;
    }
    if (!this.validateMobileNo()) {
      return;
    }

    const hasAnyImage = this.uploadSlots.some(s => s.file || s.existingUrl);
    if (!hasAnyImage) {
      this.toaster.warning('Please upload at least one image.', 'Required');
      return;
    }

    // API ko sirf naye / replace kiye hue files jaate hain
    const filled = this.uploadSlots.filter(s => s.file);
    if (filled.length !== 4) {
      this.toaster.warning('Please upload All images.', 'Required');
      return;
    }

    const formData = new FormData();
    formData.append('InstallationMasterId', this.selectedInstallation?.InstallationId ?? '');
    formData.append('Latitude', this.latitude || '');
    formData.append('Longitude', this.longitude || '');
    formData.append('Address', this.installAddress || '');
    formData.append('WorkingHrs', this.workingHrs.toString().trim());
    formData.append('MobileNo', this.mobileNo || '');

    // Index continuous hona chahiye (0,1,2...), warna .NET list binding toot jaati hai
    const ts = Date.now();
    filled.forEach((slot, i) => {
      formData.append(`installationImages[${i}].TagName`, slot.label);
      formData.append(`installationImages[${i}].Image`, slot.file as File, `image_${ts}_${i + 1}.jpg`);
    });

    this.isUploading = true;

    this.apis.uploadInstallationImage(formData).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        if (res?.statusCode === 200) {
          this.toaster.success('Images Uploaded Successfully!', 'Success');
          const modalEl = document.getElementById('addInstallationModal');
          if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
          this.getInstallationv1(this.currentPage);
        } else {
          this.toaster.error('Failed to upload images.', 'Error');
        }
      },
      error: () => {
        this.isUploading = false;
        this.toaster.error('Failed to upload images. Please try again.', 'Error');
      }
    });
  }

  searchValue(input: HTMLInputElement) {
    this.selectedChassis = input.value;
    this.getInstallationv1();
  }

  validateMobileNo(): boolean {

    // Remove anything other than digits
    this.mobileNo = this.mobileNo.replace(/\D/g, '');

    if (!this.mobileNo) {
      this.toaster.warning('Mobile number is required.', 'Required');
      return false;
    }

    if (this.mobileNo.length !== 10) {
      this.toaster.warning('Mobile number must be exactly 10 digits.', 'Required');

      return false;
    }

    if (!/^[6-9]\d{9}$/.test(this.mobileNo)) {
      this.toaster.warning('Please enter a valid mobile number.', 'Required');

      return false;
    }

    return true;
  }

  IsApprovalPermission(item: any): boolean {
    if (item.Status === 'Done' && item.ApprovalStatus === 0 && (this.positionId === 'National Service Head' || this.positionId === 'National Sales Head'))
      return true;
    return false;
  }





  onApprovalClick(item: any): void {
    this.approvalItem = item;
    this.approvalRemark = '';
    this.isApproving = false;
    this.installationImages = [];
    this.isApprovalImgLoading = true;

    this.apis.getImagesOnId({ Id: item.InstallationId }).subscribe({
      next: (res: any) => {
        this.isApprovalImgLoading = false;
        if (res?.message?.toLowerCase() === 'success') {
          this.installationImages = res.data
            ?.filter((i: any) => i?.ImgUrl)
            .map((i: any) => ({ Url: i.ImgUrl })) || [];
        }
      },
      error: () => {
        this.isApprovalImgLoading = false;
        this.toaster.error('Failed fetching images.', 'Error');
      }
    });

    const modalEl = document.getElementById('approvalModal');
    if (!modalEl) return;

    modalEl.addEventListener('hide.bs.modal', () => {
      (document.activeElement as HTMLElement)?.blur();
    }, { once: true });

    modalEl.addEventListener('hidden.bs.modal', () => {
      this.approvalItem = null;
      this.approvalRemark = '';
    }, { once: true });

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  onApprovalAction(action: 'Approve' | 'Reject'): void {
    if (this.isApproving) return;

    if (action === 'Reject' && !this.approvalRemark?.trim()) {
      this.toaster.warning('Please enter remark for rejection.', 'Required');
      return;
    }
    if ((this.approvalRemark?.length || 0) > this.MAX_REMARK_CHARS) {
      this.toaster.warning(`Remark can have maximum ${this.MAX_REMARK_CHARS} characters.`, 'Required');
      return;
    }

    const isApprove = action === 'Approve';

    Swal.fire({
      title: isApprove ? 'Approve Installation?' : 'Reject Installation?',
      html: `Chassis No: <b>${this.approvalItem?.ChassisNumber ?? ''}</b><br/>Are you sure you want to ${action.toLowerCase()} this installation?`,
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'Yes, Approve' : 'Yes, Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: isApprove ? '#4D963A' : '#E45E2E',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) this.submitApproval(action);
    });
  }

  private submitApproval(action: 'Approve' | 'Reject'): void {
    const request = {
      InstallationId: this.approvalItem?.InstallationId,
      ApprovalStatus: action === 'Approve' ? 1 : -1,   // 1 = Approved, 2 = Rejected
      Remark: this.approvalRemark?.trim() || '',
    };

    this.isApproving = true;

    this.apis.updateInstallationApproval(request).subscribe({
      next: (res: any) => {
        this.isApproving = false;
        if (res?.statusCode === 200) {
          this.toaster.success(`Installation ${action === 'Approve' ? 'Approved' : 'Rejected'} Successfully!`, 'Success');
          const modalEl = document.getElementById('approvalModal');
          if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
          this.getInstallationv1(this.currentPage);
        } else {
          this.toaster.error(res?.message || 'Action failed.', 'Error');
        }
      },
      error: () => {
        this.isApproving = false;
        this.toaster.error('Something went wrong. Please try again.', 'Error');
      }
    });
  }



}

