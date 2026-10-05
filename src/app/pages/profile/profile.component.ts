import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Contact, DealerProfile, InfoItem } from '../../model/apiresponse';
import { ToastrService } from 'ngx-toastr';



@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  // agar DB me sirf file path save hota hai to yaha base URL daal do (e.g. environment.imageUrl)
  private readonly signatureBaseUrl = '';

  profile: DealerProfile | null = null;
  loading = false;
  errorMsg = '';

  contactInfo: InfoItem[] = [];
  businessInfo: InfoItem[] = [];
  hierarchy: Contact[] = [];

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploading = false;
  isDragging = false;
  readonly maxSizeMB = 2;
  readonly allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

  constructor(private apis: AuthService, private toaster: ToastrService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      document.body.style.overflow = this.isOpen ? 'hidden' : '';
      if (this.isOpen) this.loadProfile();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.isOpen && !this.uploading) this.close();
  }

  loadProfile() {
    const dealerCode = sessionStorage.getItem('dealerCode') || '';
    this.loading = true;
    this.errorMsg = '';

    this.apis.getDealerProfile().subscribe({
      next: (res: any) => {
        this.loading = false;
        const data = Array.isArray(res?.data) ? res.data[0] : res?.data;
        if (res?.statusCode === 200 && data) {
          this.profile = data;
          this.buildSections(data);
        } else {
          this.errorMsg = 'Profile details not found.';
        }
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Unable to load profile. Please try again.';
      }
    });
  }

  private buildSections(p: DealerProfile) {
    this.contactInfo = [
      { label: 'Mobile', value: p.dealerMobile, icon: 'fa-phone', link: p.dealerMobile ? `tel:${p.dealerMobile}` : undefined },
      { label: 'Email', value: p.dealerEmail, icon: 'fa-envelope', link: p.dealerEmail ? `mailto:${p.dealerEmail}` : undefined },
      { label: 'City', value: p.city, icon: 'fa-city' },
      { label: 'District', value: p.district, icon: 'fa-map' },
      { label: 'State', value: p.state, icon: 'fa-flag' },
      { label: 'Address', value: p.address, icon: 'fa-location-dot' }
    ];

    this.businessInfo = [
      { label: 'GST No.', value: p.gstNo, icon: 'fa-file-invoice' },
      { label: 'PAN No.', value: p.panNo, icon: 'fa-id-card' },
      { label: 'Date of Appointment', value: p.dateOfAppointment, icon: 'fa-calendar-check' }
    ];

    this.hierarchy = [
      { role: 'State Head', name: p.stateHead, mobile: p.stateHeadMobile, icon: 'fa-user-tie' },
      { role: 'Area Manager', name: p.am, mobile: p.amMobile, icon: 'fa-user-group' },
      { role: 'Territory Manager', name: p.tm, mobile: p.tmMobile, icon: 'fa-user' },
      { role: 'Service CCM', name: p.service_CcmName, mobile: p.service_CcmMobile, icon: 'fa-headset' }
    ];
  }

  get initials(): string {
    const name = this.profile?.dealerName?.trim() || '';
    return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';
  }

  get isActive(): boolean {
    return this.profile?.activeStatus?.toLowerCase() === 'active';
  }

  get signatureSrc(): string | null {
    const sig = this.profile?.digitalSignature;
    if (!sig) return null;
    if (sig.startsWith('http') || sig.startsWith('data:')) return sig;
    if (/^[A-Za-z0-9+/=]+$/.test(sig) && sig.length > 200) return `data:image/png;base64,${sig}`; // raw base64
    return this.signatureBaseUrl + sig;
  }

  isVacant(name: string | null): boolean {
    return !name || name.trim().toUpperCase() === 'VACANT';
  }

  // ---------- Signature upload ----------
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.handleFile(input.files[0]);
    input.value = '';
  }

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragging = false; }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File) {
    if (!this.allowedTypes.includes(file.type)) {
      this.apis.showAlert('warning', 'Invalid File', 'Only PNG / JPG images are allowed.');
      return;
    }
    if (file.size > this.maxSizeMB * 1024 * 1024) {
      this.apis.showAlert('warning', 'File Too Large', `Signature image must be under ${this.maxSizeMB} MB.`);
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  removeSelected() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  uploadSignature() {
    if (!this.selectedFile || !this.profile) return;

    const formData = new FormData();
    formData.append('signatureFile', this.selectedFile, this.selectedFile.name);

    this.uploading = true;
    this.apis.uploadDigitalSignature(formData).subscribe({
      next: (res: any) => {
        this.uploading = false;
        if (res?.statusCode === 200) {
          this.profile!.digitalSignature = res?.data;
          this.removeSelected();
          this.toaster.success('Digital signature uploaded successfully.', 'Success');
        } else {
          this.toaster.error(res?.message || 'Upload failed.', 'Error');
        }
      },
      error: () => {
        this.uploading = false;
        this.toaster.error('Unable to upload signature. Please try again.', 'Error');
      }
    });
  }

  close() {
    this.removeSelected();
    document.body.style.overflow = '';
    this.closed.emit();
  }
}
