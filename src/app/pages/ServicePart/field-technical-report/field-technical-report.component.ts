import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { timeout } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import { FtrOption, FtrServiceRows, FtrSubmitPayload, FtrTractor } from '../../../model/apiresponse';

declare var bootstrap: any;

@Component({
  selector: 'app-field-technical-report',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './field-technical-report.component.html',
  styleUrl: './field-technical-report.component.css'
})
export class FieldTechnicalReportComponent implements OnInit {

  readonly ftrTypeOptions: FtrOption[] = [
    { label: 'Raise FTR for In Stock Vehicle', value: 'IN' },
    { label: 'Raise FTR for Out of Sold Vehicle', value: 'OUT' }
  ];
  readonly serviceStages = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  private readonly srNoToStage: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
  private readonly LIST_TIMEOUT_MS = 60000;
  private readonly REQUEST_TIMEOUT_MS = 15000;

  // ─── List ───
  selectedType: 'IN' | 'OUT' = 'OUT';
  tractorList: FtrTractor[] = [];
  loading = false;
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  private requestId = 0;

  // ─── Form ───
  selectedTractor: FtrTractor | null = null;
  isInStock = false;
  serviceRows: FtrServiceRows = { date: {}, hrs: {} };
  serviceRecordLoading = false;

  natureOfWorkOptions: FtrOption[] = [];
  natureOfWorkLoading = false;

  sseName = '';
  dateOfFailure = '';
  hoursWorked = '';
  dateOfRepair = '';
  natureOfWork: FtrOption | null = null;
  implementSize = '';
  alternateMobileNo = '';
  customerComplaints = '';
  problemDefinition = '';

  submitted = false;
  submitting = false;
  today = this.formatDate(new Date());

  constructor(private apis: AuthService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.fetchTractorList(1);
    this.fetchNatureOfWork();
  }

  // ─── HELPERS ────────────────────────────────────────────────

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private toISO(d: string): string | null {
    if (!d) return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  formatShortDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private extractTotalCount(res: any): number | null {
    const candidates = [
      res?.totalCount, res?.TotalCount, res?.totalRecords, res?.TotalRecords,
      res?.total, res?.count, res?.data?.totalCount, res?.data?.TotalCount,
      res?.pagination?.totalCount, res?.pagination?.total,
      res?.data?.[0]?.totalCount, res?.data?.[0]?.TotalCount, res?.data?.[0]?.TotalRecords
    ];
    for (const c of candidates) {
      const n = Number(c);
      if (c !== undefined && c !== null && !isNaN(n) && n >= 0) return n;
    }
    return null;
  }

  private mapChassisToTractor(row: any): FtrTractor {
    return {
      Id: row.masterId,
      TractorSrNumber: row.chasisNo,
      ChassisNo: row.chasisNo,
      Model: (row.modelName || '').trim(),
      ModelCode: row.modelCode,
      DealerName: row.dealerName,
      DealerCode: row.dealerCode,
      DealerAddress: (row.dealerAddress || '').trim(),
      InstallationDate: row.installationDate,
      DateOfSale: row.dateOfSale,
      DriveType: row.driveType,
      Colour: row.colour,
      Status: row.status,
      CustomerName: row.customerName,
      CustomerAddress: row.customerAddress,
      MobileNo: row.customerMobile,
      Village: row.village,
      PostOffice: row.postOffice,
      District: row.district,
      StockMasterId: row.stockMasterId ?? null
    };
  }

  private mapTimelineToServiceRows(timeline: any[]): FtrServiceRows {
    const date: Record<string, string> = {};
    const hrs: Record<string, string> = {};
    (timeline || []).forEach(entry => {
      if (entry.Type !== 'Service') return;
      const stage = this.srNoToStage[Number(entry.SrNo)];
      if (!stage) return;
      date[stage] = entry.CreatedDate === '-' ? '' : entry.CreatedDate;
      hrs[stage] = entry.Hours === '-' ? '' : entry.Hours;
    });
    return { date, hrs };
  }

  get dealerNameAddress(): string {
    return [this.selectedTractor?.DealerName, this.selectedTractor?.DealerAddress].filter(Boolean).join(', ');
  }

  get customerNameAddress(): string {
    return [this.selectedTractor?.CustomerName, this.selectedTractor?.CustomerAddress].filter(Boolean).join(', ');
  }

  get selectedTypeLabel(): string {
    return this.ftrTypeOptions.find(o => o.value === this.selectedType)?.label ?? '';
  }

  // ─── LIST ───────────────────────────────────────────────────

  fetchTractorList(page: number = 1): void {
    const reqId = ++this.requestId;
    this.loading = true;
    this.tractorList = [];

    this.apis.getChassisDetailsForFTR(this.selectedType, page)
      .pipe(timeout(this.LIST_TIMEOUT_MS))
      .subscribe({
        next: (res: any) => {
          if (reqId !== this.requestId) return;

          const rows = Array.isArray(res?.data) ? res.data : [];
          const total = this.extractTotalCount(res);

          // Page size auto-detect: page 1 ke rows = server ka page size
          if (page === 1 && rows.length > 0) this.itemsPerPage = rows.length;

          this.totalItems = total !== null
            ? total
            : (page - 1) * this.itemsPerPage + rows.length + (rows.length >= this.itemsPerPage ? 1 : 0);

          this.tractorList = rows.map((r: any) => this.mapChassisToTractor(r));
          this.currentPage = page;
          this.loading = false;
        },
        error: (err:any) => {
          if (reqId !== this.requestId) return;
          this.loading = false;
          this.tractorList = [];
          this.toastr.error(
            err?.name === 'TimeoutError'
              ? 'Loading is taking too long. Please check your connection and try again.'
              : (err?.error?.message || 'Failed to load tractor list.'),
            'Error'
          );
        }
      });
  }

  onTypeChange(): void {
    this.totalItems = 0;
    this.currentPage = 1;
    this.fetchTractorList(1);
  }

  onPageChange(page: number): void {
    this.fetchTractorList(page);
  }

  refreshList(): void {
    this.fetchTractorList(this.currentPage);
  }

  // ─── NATURE OF WORK ─────────────────────────────────────────

  fetchNatureOfWork(): void {
    this.natureOfWorkLoading = true;
    this.apis.getWorkNature().subscribe({
      next: (res: any) => {
        const list = res?.data || [];
        this.natureOfWorkOptions = list.map((e: any) => ({ label: e.natureOfWorkName, value: e.masterId }));
        this.natureOfWorkLoading = false;
      },
      error: () => {
        this.natureOfWorkLoading = false;
        this.toastr.error('Failed to load Nature of Work options.', 'Error');
      }
    });
  }

  compareOption = (a: FtrOption | null, b: FtrOption | null) => a?.value === b?.value;

  // ─── FORM OPEN ──────────────────────────────────────────────

  openForm(item: FtrTractor): void {
    this.resetForm();
    this.selectedTractor = item;
    this.isInStock = this.selectedType === 'IN';

    if (!this.natureOfWorkOptions.length && !this.natureOfWorkLoading) this.fetchNatureOfWork();

    const el = document.getElementById('ftrFormModal');
    if (el) bootstrap.Modal.getOrCreateInstance(el).show();

    if (!this.isInStock && item.Id) this.loadServiceTimeline(item.Id);
  }

  private loadServiceTimeline(salesMasterId: string): void {
    this.serviceRecordLoading = true;
    this.serviceRows = { date: {}, hrs: {} };

    this.apis.getServiceTimeline(String(salesMasterId))
      .pipe(timeout(this.REQUEST_TIMEOUT_MS))
      .subscribe({
        next: (res: any) => {
          if (this.selectedTractor?.Id !== salesMasterId) return;
          this.serviceRows = this.mapTimelineToServiceRows(res?.data || []);
          this.serviceRecordLoading = false;
        },
        error: () => {
          this.serviceRows = { date: {}, hrs: {} };
          this.serviceRecordLoading = false;
        }
      });
  }

  private resetForm(): void {
    this.sseName = '';
    this.dateOfFailure = '';
    this.hoursWorked = '';
    this.dateOfRepair = '';
    this.natureOfWork = null;
    this.implementSize = '';
    this.alternateMobileNo = '';
    this.customerComplaints = '';
    this.problemDefinition = '';
    this.serviceRows = { date: {}, hrs: {} };
    this.serviceRecordLoading = false;
    this.submitted = false;
    this.submitting = false;
  }

  closeForm(): void {
    const el = document.getElementById('ftrFormModal');
    if (el) bootstrap.Modal.getInstance(el)?.hide();
    this.selectedTractor = null;
    this.resetForm();
  }

  // ─── FIELD HANDLERS ─────────────────────────────────────────

  onFailureDateChange(): void {
    if (this.dateOfFailure && this.dateOfFailure > this.today) {
      this.toastr.error('Failure date cannot be in the future.', 'Invalid Date');
      this.dateOfFailure = '';
      return;
    }
    if (this.dateOfRepair && this.dateOfFailure && this.dateOfRepair < this.dateOfFailure) {
      this.dateOfRepair = '';
      this.toastr.warning('Repair date cleared as it was before the failure date.', 'Date Updated');
    }
  }

  onRepairDateChange(): void {
    if (this.dateOfRepair && this.dateOfFailure && this.dateOfRepair < this.dateOfFailure) {
      this.toastr.error('Repair date cannot be before the failure date.', 'Invalid Date');
      this.dateOfRepair = '';
    }
  }

  onAltMobileInput(): void {
    this.alternateMobileNo = (this.alternateMobileNo || '').replace(/[^0-9]/g, '').slice(0, 10);
  }

  onHoursInput(): void {
    this.hoursWorked = (this.hoursWorked || '').replace(/[^0-9.]/g, '');
  }

  // ─── SUBMIT ─────────────────────────────────────────────────

  submitReport(): void {
    this.submitted = true;

    if (!this.sseName.trim() || !this.dateOfFailure || !this.dateOfRepair || !this.natureOfWork) {
      this.toastr.warning('Please fill all required fields.', 'Validation');
      return;
    }
    if (this.alternateMobileNo && this.alternateMobileNo.length !== 10) {
      this.toastr.warning('Alternate mobile number must be 10 digits.', 'Validation');
      return;
    }

    this.apis.showConfirm(
      'Verify Before Submission',
      'Please confirm all details entered in this Field Technical Report are correct. Once submitted, the report will be visible to CCM/HO for action.',
      'Confirm & Submit',
      'Review Again'
    ).then(r => {
      if (r.isConfirmed) this.confirmSubmit();
    });
  }

  private confirmSubmit(): void {
    const item = this.selectedTractor;
    if (!item) return;
    const inStock = this.isInStock;

    const payload: FtrSubmitPayload = {
      sseName: this.sseName.trim(),
      dealerCode: item.DealerCode || '',
      tractorModelBOMCode: item.Model || '',
      tractorSerialNo: item.ChassisNo || '',
      failureDate: this.toISO(this.dateOfFailure),
      hoursWorked: Number(this.hoursWorked) || 0,
      repairDate: this.toISO(this.dateOfRepair),
      natureOfWorkDone: this.natureOfWork?.label ?? '',
      // IN stock -> stockMasterId, OUT stock -> salesCustomerMasterId
      salesCustomerMasterId: inStock ? null : (item.Id || null),
      stockMasterId: inStock ? (item.StockMasterId || item.Id || null) : null,
      customerName: inStock ? '' : (item.CustomerName || ''),
      customerAddress: inStock ? '' : (item.CustomerAddress || ''),
      mobileNo: inStock ? '' : (item.MobileNo || ''),
      alternateMobileNo: inStock ? '' : this.alternateMobileNo,
      village: inStock ? '' : (item.Village || ''),
      post: inStock ? '' : (item.PostOffice || ''),
      district: inStock ? '' : (item.District || ''),
      implementTrolleySize: this.implementSize.trim(),
      customerComplaints: this.customerComplaints.trim(),
      problemDefinition: this.problemDefinition.trim(),
      stockStatus: this.selectedType,
      createdBy: sessionStorage.getItem('userName') || '',
      positionName: sessionStorage.getItem('possitionId') || ''
    };

    this.submitting = true;
    this.apis.addFTR(payload).pipe(timeout(this.REQUEST_TIMEOUT_MS)).subscribe({
      next: () => {
        this.submitting = false;
        this.toastr.success('Field Technical Report submitted successfully.', 'Submitted');
        this.closeForm();
        this.refreshList();
      },
      error: (err: any) => {
        this.submitting = false;
        this.toastr.error(err?.error?.message || 'Failed to submit report. Please try again.', 'Error');
      }
    });
  }
}
