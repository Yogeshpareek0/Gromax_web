import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PdiStockItem,
  PdiFieldPayload,
  PdiSubmitPayload,
  PhotoSlot,
} from '../../../model/apiresponse';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component'

const OK_NOT_OK = ['Ok', 'Not OK'];
const PHOTO_REQUIRED_FIELDS: { section: string; label: string }[] = [
  { section: 'Engine', label: 'Engine Oil Level ( should be between Max and Min )' },
  { section: 'Engine', label: 'Oil Leakage nearby Engine area' },
  { section: 'Transmission', label: 'Transmission oil Level ( Between Marks )' },
  { section: 'Hydraulic', label: 'Oil Leakage - Pump to Control Valve' },
  { section: 'Hydraulic', label: 'Hydraulic Housing Oil Leakage' },
  { section: 'Tractor', label: 'Oil leakage - Overall Tractor' },
  { section: 'Tractor', label: 'Sheet metal paint - Color fading' },
  { section: 'Tractor', label: 'Check Tyre Condition ( Cuts, other marks )' },
  { section: 'Tractor', label: 'RIM Condition ( for Band please measure with Dial gauge )' },
];

const OK_ONLY_SECTIONS: Record<string, string[]> = {
  Engine: [
    'Engine Oil Level ( should be between Max and Min )',
    'Coolant level in Radiator & Recovery Bottle (It should be under Mark)',
    'Fan belt Tension ( 0.5" - Measure by Thumb )',
    'Oil Leakage nearby Engine area',
    'Air Cleaner Condition',
    'Low Oil Pressure Light working condition',
    'Abnormal Noice from engine',
  ],
  Transmission: [
    'Clutch Testing - Noise while pressing',
    'Clutch free Play as per Norm',
    'Check Gear shifting noise',
    'Brake working with Free play',
    'Transmission oil Level ( Between Marks )',
    'Abnormal Noice from Transmission',
  ],
  Hydraulic: [
    'PC DC Working condition',
    'Oil Leakage - Pump to Control Valve',
    'Hydraulic Housing Oil Leakage',
  ],
  Tractor: [
    'Tractor Condition (Required in Clean condition with Wash/ Polishing )',
    'Oil leakage - Overall Tractor',
    'Sheet metal paint - Color fading',
    'Working of :-- Horn; Parking lamp; Turn signal lamp; Indicator; Hazard light; Brake',
    'Tyre Pressure 17/24 - 20/28 (On field /On road)',
    'Check Tyre Condition ( Cuts, other marks )',
    'Positive and Negative Battery wire Fitment and Battery condition',
    'Low Idle rpm & High idle rpm',
    'Bolt Condition',
    'RIM Condition ( for Band please measure with Dial gauge )',
  ],
};

// ── Unique field key: prevents collisions when same label appears in 2+ sections ──
function buildFieldKey(section: string, label: string): string {
  return `${section}__${label}`;
}

interface SectionFieldMeta {
  key: string;   // unique composite key, used for state binding
  label: string; // display text
  section: string;
}

@Component({
  selector: 'app-pdi',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './pdi.component.html',
  styleUrl: './pdi.component.css',
})
export class PdiComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  // ── view state ──
  view: 'list' | 'form' = 'list';
  loading = false;
  searchQuery = '';

  stockList: PdiStockItem[] = [];
  selectedItem: PdiStockItem | null = null;
  isDone = false;

  // ── grouped, unique-keyed field metadata exposed to template ──
  okOnlySectionsGrouped: Record<string, SectionFieldMeta[]> = {};
  okOptions = OK_NOT_OK;
  private photoFieldKeys = new Set(
    PHOTO_REQUIRED_FIELDS.map((f) => buildFieldKey(f.section, f.label))
  );

  // ── flat list of unique keys (for validation / payload building) ──
  private okOnlyFieldMeta: SectionFieldMeta[] = [];

  // ── form state (keyed by unique composite key, NOT plain field name) ──
  runningHrs = '';
  pdiDoneBy = '';
  otherText = '';
  engineNo = '';
  okStatus: Record<string, string> = {};
  remarks: Record<string, string> = {};
  photos1: Record<string, PhotoSlot> = {};
  photos2: Record<string, PhotoSlot> = {};
  errors: Record<string, string> = {};

  fieldIds: Record<string, string> = {};
  pdiMasterRecordId: string | null = null;

  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  constructor(private apis: AuthService) {
    this.buildFieldMeta();
  }

  private buildFieldMeta(): void {
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
      .getPdiStockList(page, this.searchQuery)
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
  openForm(item: PdiStockItem): void {
    this.selectedItem = item;
    this.isDone = item.Status === 'Done';
    this.resetForm();
    //this.runningHrs = item.RunningHrs || '';
    //this.pdiDoneBy = item.PdiDoneBy || '';
    //this.engineNo = item.EngineNo || '';
    if (item.PDIMasterId !== null) {
      this.fetchPDIById();
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
    this.pdiDoneBy = '';
    this.engineNo = '';
    this.otherText = '';
    this.okStatus = {};
    this.remarks = {};
    this.photos1 = {};
    this.photos2 = {};
    this.errors = {};
    this.fieldIds = {};
    this.pdiMasterRecordId = null;

    this.okOnlyFieldMeta.forEach((f) => {
      this.okStatus[f.key] = '';
      this.remarks[f.key] = '';
      this.photos1[f.key] = {};
      this.photos2[f.key] = {};
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
  isPhotoField(key: string): boolean {
    return this.photoFieldKeys.has(key);
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
      .uploadPdiImage(formData)
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

  // ══════════════ VALIDATE ══════════════
  private validate(): boolean {
    this.errors = {};

    if (!String(this.runningHrs ?? '').trim()) this.errors['runningHrs'] = 'Required';
    if (!String(this.pdiDoneBy ?? '').trim()) this.errors['pdiDoneBy'] = 'Required';
    if (!String(this.engineNo ?? '').trim()) this.errors['engineNo'] = 'Required';

    this.okOnlyFieldMeta.forEach((f) => {
      const key = f.key;
      if (!this.okStatus[key]) {
        this.errors[`${key}_status`] = 'Required';
        return;
      }
      if (this.okStatus[key] === 'Not OK') {
        if (!this.remarks[key]?.trim()) this.errors[`${key}_remark`] = 'Remark required';

        if (this.photoFieldKeys.has(key)) {
          if (!this.photos1[key]?.serverUrl) this.errors[`${key}_photo`] = 'Photo 1 upload required';
          if (!this.photos2[key]?.serverUrl) this.errors[`${key}_photo`] = '2 photos required when Not OK';
        }
      }
    });

    return Object.keys(this.errors).length === 0;
  }

  fetchPDIById(): void {
    const id = this.selectedItem?.PDIMasterId;
    if (!id) {
      this.apis.showAlert('warning', 'Warning!', 'Id Is Required');
      return;
    }

    this.apis
      .getPDIByID(id)
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
      this.pdiDoneBy = master.doneBy ?? this.pdiDoneBy;
      this.engineNo = master.engineNo ?? this.engineNo;
      this.otherText = '';
      this.pdiMasterRecordId = master.id ?? null;
    }

    const fieldsList: any[] = data?.ntirFieldsMaster ?? [];

    fieldsList.forEach((item) => {
      const key = buildFieldKey(item.section, item.name);

      if (this.okStatus.hasOwnProperty(key)) {
        this.okStatus[key] = item.status ?? '';
        this.remarks[key] = item.remark ?? '';
        this.fieldIds[key] = item.id;

        this.photos1[key] = item.photo1
          ? { serverUrl: item.photo1, previewUrl: item.photo1, uploading: false }
          : {};
        this.photos2[key] = item.photo2
          ? { serverUrl: item.photo2, previewUrl: item.photo2, uploading: false }
          : {};
      }
    });
  }

  private buildPayload(isUpdate: boolean): PdiSubmitPayload {
    const fields: PdiFieldPayload[] = this.okOnlyFieldMeta.map((f) => ({
      ...(isUpdate ? { id: this.fieldIds[f.key] || null } : {}),
      name: f.label,
      section: f.section,
      status: this.okStatus[f.key],
      remark: this.okStatus[f.key] === 'Not OK' ? this.remarks[f.key] || '' : '',
      photo1: this.okStatus[f.key] === 'Not OK' ? this.photos1[f.key]?.serverUrl || '' : '',
      photo2: this.okStatus[f.key] === 'Not OK' ? this.photos2[f.key]?.serverUrl || '' : '',
      serial: '',
      brand: '',
    }));

    return {
      stockMasterId: this.selectedItem?.Id || '',
      ...(isUpdate ? { id: this.pdiMasterRecordId } : {}),
      runningHrs: this.runningHrs.toString(),
      doneBy: this.pdiDoneBy,
      engineNo: this.engineNo,
      other: this.otherText,
      fields,
    };
  }

  // ══════════════ SUBMIT ══════════════
  onSubmit(): void {
    const anyUploading =
      this.okOnlyFieldMeta.some((f) => this.photos1[f.key]?.uploading || this.photos2[f.key]?.uploading);
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
      .addPdiv1(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res.message === 'Success') {
            this.apis.showAlert('success', 'Success', 'PDI has been submitted successfully.');
            this.fetchStockList(this.currentPage);
            this.backToList();
          } else {
            this.apis.showAlert('error', 'Error!', res?.message || 'Failed to submit the PDI. Please try again.');
          }
        },
        error: () => {
          this.apis.showAlert('error', 'Error!', 'Failed to submit the PDI.');
        },
      });
  }

  // ══════════════ UPDATE (existing PDI edit) ══════════════
  updatePDI(): void {
    const anyUploading =
      this.okOnlyFieldMeta.some((f) => this.photos1[f.key]?.uploading || this.photos2[f.key]?.uploading);
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
      .updatePDI(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res.message === 'Success') {
            this.apis.showAlert('success', 'Success', 'PDI has been updated successfully.');
            this.fetchStockList(this.currentPage);
            this.backToList();
          } else {
            this.apis.showAlert('error', 'Error!', res?.message || 'Failed to update the PDI. Please try again.');
          }
        },
        error: () => {
          this.apis.showAlert('error', 'Error!', 'Failed to update the PDI.');
        },
      });
  }
}
