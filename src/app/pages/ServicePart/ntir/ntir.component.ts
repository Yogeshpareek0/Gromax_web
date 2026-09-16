import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NtirStockItem,
  SerialBrandField,
  NtirFieldPayload,
  NtirSubmitPayload,
  PhotoSlot,
} from '../../../model/apiresponse';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component'

const OK_NOT_OK = ['Ok', 'Not OK'];

const OK_PHOTO_SECTIONS: Record<string, string[]> = {
  'Oil Level': ['Engine oil level', 'TRAN oil level', 'Front Axle 4wd'],
  Radiator: ['Coolant level', 'Coolant leakage'],
  Leakage: ['Engine', 'Transmission', 'Hydraulic'],
  'Scratch & Damage': ['Bonnet / Grill', 'Fenders', 'Fuel Tank', 'Lower link', 'Wheel Rim', 'Silencer'],
  Sealing: ['Transmission drain plug', 'Hydraulic pump'],
  'Paint Quality': ['Paint peel-off', 'Paint is fading'],
};

const OK_ONLY_SECTIONS: Record<string, string[]> = {
  Shortcomings: ['Tool Kit', 'Starting Key', 'Diesel Tank Key', 'Link Pin', 'Top Link', 'Operator Manual'],
  'Water Ingress (Only During Monsoon)': ['Air Cleaner', 'Transmission', 'Hydraulic'],
  'Other Part': ['Steering', 'Front Axle', 'Grill rubber boot', 'Battery Box', 'Front Wheel Rim'],
};

interface SerialBrandFieldDef {
  key: string;
  label: string;
  section: string;
  brandOptions?: string[];
  hasSerial?: boolean;
}

const SERIAL_BRAND_FIELDS: SerialBrandFieldDef[] = [
  {
    key: 'starter', label: 'Starter Motor - Company', section: 'Electrical',
    brandOptions: ['Lukas', 'Autolek', 'Pricol', 'Other'],
    hasSerial: false
  },

  {
    key: 'alternator', label: 'Alternator - Company', section: 'Electrical',
    brandOptions: ['Lukas', 'Autolek', 'Pricol', 'Other'],
    hasSerial: false
  },

  {
    key: 'battery', label: 'Battery - Company', section: 'Electrical',
    hasSerial: true
  },

  {
    key: 'frontRH', label: 'Front RH - Company', section: 'Tyre',
    brandOptions: ['MRF', 'Apollo', 'BKT', 'Other'],
    hasSerial: true
  },

  {
    key: 'frontLH', label: 'Front LH - Company', section: 'Tyre',
    brandOptions: ['MRF', 'Apollo', 'BKT', 'Other'],
    hasSerial: true
  },

  {
    key: 'rearRH', label: 'Rear RH - Company', section: 'Tyre',
    brandOptions: ['MRF', 'Apollo', 'BKT', 'Other'],
    hasSerial: true
  },

  {
    key: 'rearLH', label: 'Rear LH - Company', section: 'Tyre',
    brandOptions: ['MRF', 'Apollo', 'BKT', 'Other'],
    hasSerial: true
  },

  {
    key: 'fip', label: 'FIP - Company', section: 'Sealing (FIP)',
    hasSerial: true
  },
];

function buildFieldKey(section: string, label: string): string {
  return `${section}__${label}`;
}

interface SectionFieldMeta {
  key: string;
  label: string;
  section: string;
}

@Component({
  selector: 'app-ntir',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './ntir.component.html',
  styleUrl: './ntir.component.css',
})
export class NtirComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  // ── view state ──
  view: 'list' | 'form' = 'list';
  loading = false;
  searchQuery = '';

  stockList: NtirStockItem[] = [];
  selectedItem: NtirStockItem | null = null;
  isDone = false;

  // ── grouped, unique-keyed field metadata exposed to template ──
  okPhotoSectionsGrouped: Record<string, SectionFieldMeta[]> = {};
  okOnlySectionsGrouped: Record<string, SectionFieldMeta[]> = {};
  serialBrandFields = SERIAL_BRAND_FIELDS;
  okOptions = OK_NOT_OK;

  // ── flat lists of unique keys (for validation / payload building) ──
  private okPhotoFieldMeta: SectionFieldMeta[] = [];
  private okOnlyFieldMeta: SectionFieldMeta[] = [];

  // ── form state (keyed by unique composite key, NOT plain field name) ──
  runningHrs = '';
  otherText = '';
  okStatus: Record<string, string> = {};
  remarks: Record<string, string> = {};
  photos1: Record<string, PhotoSlot> = {};
  photos2: Record<string, PhotoSlot> = {};
  serialBrand: Record<string, SerialBrandField> = {};
  customBrandInputs: Record<string, string> = {};
  errors: Record<string, string> = {};

  fieldIds: Record<string, string> = {};
  ntirMasterRecordId: string | null = null;

  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  constructor(private apis: AuthService) {
    this.buildFieldMeta();
  }

  private buildFieldMeta(): void {
    this.okPhotoFieldMeta = [];
    this.okPhotoSectionsGrouped = {};
    Object.entries(OK_PHOTO_SECTIONS).forEach(([section, labels]) => {
      const metaList = labels.map((label) => ({
        key: buildFieldKey(section, label),
        label,
        section,
      }));
      this.okPhotoSectionsGrouped[section] = metaList;
      this.okPhotoFieldMeta.push(...metaList);
    });

    this.okOnlyFieldMeta = [];
    this.okOnlySectionsGrouped = {};
    Object.entries(OK_ONLY_SECTIONS).forEach(([section, labels]) => {
      const metaList = labels.map((label) => ({
        key: buildFieldKey(section, label),
        label,
        section,
      }));
      this.okOnlySectionsGrouped[section] = metaList;
      this.okOnlyFieldMeta.push(...metaList);
    });
  }

  ngOnInit(): void {
    this.fetchStockList(this.currentPage);
  }

  // ══════════════ LIST ══════════════
  fetchStockList(page: number): void {
    this.apis
      .getNTIRStockList(page, this.searchQuery)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res.message === 'Success') {
            this.stockList = res?.data ?? res ?? [];
            this.totalItems = res?.data[0]?.TotalCounts ?? 0;
          } else {
            this.stockList = [];
            this.totalItems = 0;
            this.apis.showAlert('error', 'Error!', 'Data Not Found');
          }
          this.currentPage = page;
        },
        error: () => {
          this.apis.showAlert('error', 'Error!', 'Data Not Found');
        },
      });
  }

  searchData() {
    this.currentPage = 1;
    this.fetchStockList(this.currentPage);
  }

  removeSearchQuery() {
    this.searchQuery = '';
    this.fetchStockList(this.currentPage);
  }

  // ══════════════ OPEN / RESET FORM ══════════════
  openForm(item: NtirStockItem): void {
    this.selectedItem = item;
    this.isDone = item.Status === 'Done';
    this.resetForm();
    this.runningHrs = item.RunningHrs || '';
    if (item.NTIRMasterId !== null) {
      this.fetchNTIRById();
    }
    this.view = 'form';
  }

  backToList(): void {
    this.searchQuery = '';
    this.fetchStockList(1);
    this.view = 'list';
    this.selectedItem = null;
  }

  private resetForm(): void {
    this.runningHrs = '';
    this.otherText = '';
    this.okStatus = {};
    this.remarks = {};
    this.photos1 = {};
    this.photos2 = {};
    this.serialBrand = {};
    this.customBrandInputs = {};
    this.errors = {};
    this.fieldIds = {};
    this.ntirMasterRecordId = null;

    [...this.okPhotoFieldMeta, ...this.okOnlyFieldMeta].forEach((f) => {
      this.okStatus[f.key] = '';
      this.remarks[f.key] = '';
    });
    this.okPhotoFieldMeta.forEach((f) => {
      this.photos1[f.key] = {};
      this.photos2[f.key] = {};
    });
    this.serialBrandFields.forEach((f) => {
      this.serialBrand[f.key] = { serial: '', brand: '' };
      this.customBrandInputs[f.key] = '';
    });
  }

  // ══════════════ STATUS / REMARK ══════════════
  setStatus(key: string, val: string): void {
    this.okStatus[key] = val;
    delete this.errors[`${key}_status`];
  }

  setRemark(key: string, val: string): void {
    this.remarks[key] = val;
  }

  onPageChange(page: number) {
    this.fetchStockList(page);
  }

  // ══════════════ PHOTO UPLOAD ══════════════
  onPhotoSelected(event: Event, key: string, slot: 1 | 2): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const store = slot === 1 ? this.photos1 : this.photos2;

    if (store[key]?.previewUrl) {
      URL.revokeObjectURL(store[key].previewUrl!);
    }

    store[key] = {
      file,
      previewUrl: URL.createObjectURL(file),
      serverUrl: undefined,
      uploading: true,
    };

    const formData = new FormData();
    formData.append('file', file);

    this.apis
      .uploadNTIRImage(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res?.message === 'Success') {
            const url = res?.data?.url || res?.data?.filePath || res?.data || res?.url;
            if (url) {
              store[key] = { ...store[key], serverUrl: url, uploading: false };
            } else {
              store[key] = { ...store[key], uploading: false, previewUrl: undefined, file: undefined };
              this.apis.showAlert('error', 'Error!', 'Upload succeeded but no file URL was returned. Please try again.');
            }
          } else {
            store[key] = { ...store[key], uploading: false, previewUrl: undefined, file: undefined };
            this.apis.showAlert('error', 'Error!', res?.message || 'Failed to upload photo. Please try again.');
          }
        },
        error: () => {
          store[key] = { ...store[key], uploading: false, previewUrl: undefined, file: undefined };
          this.apis.showAlert('error', 'Error!', 'Something went wrong while uploading the photo. Please try again.');
        },
      });

    input.value = '';
  }

  removePhoto(key: string, slot: 1 | 2): void {
    const store = slot === 1 ? this.photos1 : this.photos2;

    if (store[key]?.previewUrl) {
      URL.revokeObjectURL(store[key].previewUrl!);
    }
    this.deleteImage(store[key]?.serverUrl);

    store[key] = {};
  }

  onImageBroken(key: string, slot: 1 | 2): void {
    const store = slot === 1 ? this.photos1 : this.photos2;
    if (store[key]?.previewUrl) {
      URL.revokeObjectURL(store[key].previewUrl!);
    }
    store[key] = {};
  }

  private deleteImage(serverUrl: string | undefined): void {
    if (!serverUrl) return;

    const fileName = serverUrl.split('/').pop()!;

    this.apis.removeImage(fileName).subscribe({
      next: (res: any) => {
        if (res.message !== 'Success') {
          this.apis.showAlert('error', 'Error!', res.message);
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Failed to delete image.');
      }
    });
  }

  // ══════════════ HELPER - CHECK IF FIELD SHOULD BE VALIDATED ══════════════
  private shouldValidateField(field: SectionFieldMeta): boolean {
    // Skip "Front Axle 4wd" if DriveType is not 4WD
    if (field.label === 'Front Axle 4wd' && this.selectedItem?.DriveType !== '4WD') {
      return false;
    }
    return true;
  }

  // ══════════════ VALIDATE ══════════════
  private validate(): boolean {
    this.errors = {};

    if (!String(this.runningHrs ?? '').trim()) this.errors['runningHrs'] = 'Required';

    this.okPhotoFieldMeta.forEach((f) => {
      // Skip validation if field should not be validated
      if (!this.shouldValidateField(f)) {
        return;
      }

      const key = f.key;
      if (!this.okStatus[key]) {
        this.errors[`${key}_status`] = 'Required';
        return;
      }
      if (this.okStatus[key] === 'Not OK') {
        if (!this.remarks[key]?.trim()) this.errors[`${key}_remark`] = 'Remark required';
        if (!this.photos1[key]?.serverUrl) this.errors[`${key}_photo`] = 'Photo 1 upload required';
        if (!this.photos2[key]?.serverUrl) this.errors[`${key}_photo`] = '2 photos required when Not OK';
      }
    });

    this.okOnlyFieldMeta.forEach((f) => {
      const key = f.key;
      if (!this.okStatus[key]) {
        this.errors[`${key}_status`] = 'Required';
        return;
      }
      if (this.okStatus[key] === 'Not OK' && !this.remarks[key]?.trim()) {
        this.errors[`${key}_remark`] = 'Remark required';
      }
    });

    // Serial and Brand validation
    this.serialBrandFields.forEach((f) => {
      const sb = this.serialBrand[f.key];
      if (!sb) {
        if (f.hasSerial !== false) {
          this.errors[`${f.key}_serial`] = 'Required';
        }
        this.errors[`${f.key}_brand`] = 'Required';
        return;
      }

      if (f.hasSerial !== false && !sb.serial?.trim()) {
        this.errors[`${f.key}_serial`] = 'Required';
      }

      if (!sb.brand?.trim()) {
        this.errors[`${f.key}_brand`] = 'Required';
      }

      // Custom brand validation - if brand is "Other", custom input is required
      if (sb.brand === 'Other' && !this.customBrandInputs[f.key]?.trim()) {
        this.errors[`${f.key}_customBrand`] = 'Please enter custom brand';
      }
    });

    return Object.keys(this.errors).length === 0;
  }

  fetchNTIRById(): void {
    const id = this.selectedItem?.NTIRMasterId;
    if (!id) {
      this.apis.showAlert('warning', 'Warning!', 'Id Is Required');
      return;
    }

    this.apis
      .getNTIRByID(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res.message === 'Success') {
            this.populateFormFromResponse(res.data);
          } else {
            this.apis.showAlert('error', 'Error!', res?.message || 'Data Not Found');
          }
        },
        error: () => {
          this.apis.showAlert('error', 'Error!', 'Data Not Found');
        },
      });
  }

  // ══════════════ POPULATE FORM (EDIT / UPDATE MODE) ══════════════
  private populateFormFromResponse(data: any): void {
    const master = data?.ntirMaster;
    if (master) {
      this.runningHrs = master.runningHrs ?? this.runningHrs;
      this.otherText = master.other ?? '';
      this.ntirMasterRecordId = master.id ?? null;
    }

    const fieldsList: any[] = data?.ntirFieldsMaster ?? [];

    fieldsList.forEach((item) => {
      const section = item.section;
      const name = item.name;

      const sbField = this.serialBrandFields.find(
        (f) => f.section === section && f.label === name
      );

      if (sbField) {
        const brandValue = item.brand ?? '';

        // Check if brand contains "other - " pattern
        if (brandValue.toLowerCase().startsWith('other - ')) {
          this.serialBrand[sbField.key] = {
            serial: item.serial ?? '',
            brand: 'Other',
          };
          this.customBrandInputs[sbField.key] = brandValue.substring(8); // Extract after "other - "
        } else {
          this.serialBrand[sbField.key] = {
            serial: item.serial ?? '',
            brand: brandValue,
          };
          this.customBrandInputs[sbField.key] = '';
        }

        this.fieldIds[sbField.key] = item.id;
        return;
      }

      const key = buildFieldKey(section, name);

      if (this.okStatus.hasOwnProperty(key)) {
        this.okStatus[key] = item.status ?? '';
        this.remarks[key] = item.remark ?? '';
        this.fieldIds[key] = item.id;

        if (this.photos1.hasOwnProperty(key)) {
          this.photos1[key] = item.photo1
            ? { serverUrl: item.photo1, previewUrl: item.photo1, uploading: false }
            : {};
          this.photos2[key] = item.photo2
            ? { serverUrl: item.photo2, previewUrl: item.photo2, uploading: false }
            : {};
        }
      }
    });
  }

  private buildPayload(isUpdate: boolean): NtirSubmitPayload {
    const fields: NtirFieldPayload[] = [
      ...this.okPhotoFieldMeta
        .filter(f => this.shouldValidateField(f))
        .map((f) => ({
          ...(isUpdate ? { id: this.fieldIds[f.key] || null } : {}),
          name: f.label,
          section: f.section,
          status: this.okStatus[f.key],
          remark: this.okStatus[f.key] === 'Not OK' ? this.remarks[f.key] || '' : '',
          photo1: this.okStatus[f.key] === 'Not OK' ? this.photos1[f.key]?.serverUrl || '' : '',
          photo2: this.okStatus[f.key] === 'Not OK' ? this.photos2[f.key]?.serverUrl || '' : '',
          serial: '',
          brand: '',
        })),
      ...this.okOnlyFieldMeta.map((f) => ({
        ...(isUpdate ? { id: this.fieldIds[f.key] || null } : {}),
        name: f.label,
        section: f.section,
        status: this.okStatus[f.key],
        remark: this.remarks[f.key] || '',
        photo1: '',
        photo2: '',
        serial: '',
        brand: '',
      })),
      ...this.serialBrandFields.map((f) => {
        const brand = this.serialBrand[f.key].brand;
        const brandValue = brand === 'Other'
          ? `other - ${this.customBrandInputs[f.key]}`
          : brand;

        return {
          ...(isUpdate ? { id: this.fieldIds[f.key] || null } : {}),
          name: f.label,
          section: f.section,
          status: '',
          remark: '',
          photo1: '',
          photo2: '',
          serial: this.serialBrand[f.key].serial,
          brand: brandValue,
        };
      }),
    ];

    return {
      stockMasterId: this.selectedItem?.Id || '',
      ...(isUpdate ? { id: this.ntirMasterRecordId } : {}),
      runningHrs: this.runningHrs.toString(),
      other: this.otherText,
      fields,
    };
  }

  // ══════════════ SUBMIT ══════════════
  onSubmit(): void {
    const anyUploading =
      this.okPhotoFieldMeta.some((f) => this.photos1[f.key]?.uploading || this.photos2[f.key]?.uploading);
    if (anyUploading) {
      this.apis.showAlert('info', 'Alert', 'Photos are still uploading. Please wait a moment.');
      return;
    }

    if (!this.validate()) {
      this.apis.showAlert('info', 'Alert', 'Please fill in all required fields.');
      return;
    }

    const payload = this.buildPayload(false);

    this.apis
      .addNTIR(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res.message === 'Success') {
            this.apis.showAlert('success', 'Success', 'NTIR has been submitted successfully.');
            this.fetchStockList(this.currentPage);
            this.backToList();
          } else {
            this.apis.showAlert('error', 'Error!', res?.message || 'Failed to submit the NTIR. Please try again.');
          }
        },
        error: () => {
          this.apis.showAlert('error', 'Error!', 'Failed to submit the NTIR.');
        },
      });
  }

  // ══════════════ UPDATE (existing NTIR edit) ══════════════
  updateNTIR(): void {
    const anyUploading =
      this.okPhotoFieldMeta.some((f) => this.photos1[f.key]?.uploading || this.photos2[f.key]?.uploading);
    if (anyUploading) {
      this.apis.showAlert('info', 'Alert', 'Photos are still uploading. Please wait a moment.');
      return;
    }

    if (!this.validate()) {
      this.apis.showAlert('info', 'Alert', 'Please fill in all required fields.');
      return;
    }

    const payload = this.buildPayload(true);

    this.apis
      .updateNTIR(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res.message === 'Success') {
            this.apis.showAlert('success', 'Success', 'NTIR has been updated successfully.');
            this.fetchStockList(this.currentPage);
            this.backToList();
          } else {
            this.apis.showAlert('error', 'Error!', res?.message || 'Failed to update the NTIR. Please try again.');
          }
        },
        error: () => {
          this.apis.showAlert('error', 'Error!', 'Failed to update the NTIR.');
        },
      });
  }
}
