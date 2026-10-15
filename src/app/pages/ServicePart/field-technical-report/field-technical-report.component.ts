import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { timeout } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import { FtrOption, FtrRecord, FtrServiceRows, FtrSubmitPayload, FtrTractor, FtrUpdatePayload } from '../../../model/apiresponse';
import { PermissionService } from '../../../services/userpermission/permission.service'

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


  showRaiseList = false;
  showFtrList = false;

  // ─── List ───
  selectedType: 'IN' | 'OUT' = 'OUT';
  tractorList: FtrTractor[] = [];
  loading = false;
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  private requestId = 0;


  stDate = '';
  enDate = '';
  chassisNo = '';
  private appliedChassisNo = '';


  ftrList: FtrRecord[] = [];
  ftrLoading = false;
  ftrCurrentPage = 1;
  ftrItemsPerPage = 20;
  ftrTotalItems = 0;
  private ftrRequestId = 0;


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


  editingFtr: FtrRecord | null = null;
  get isEditMode(): boolean { return !!this.editingFtr; }
  get activeLoading(): boolean {
    return this.showRaiseList ? this.loading : this.ftrLoading;
  }

  get activeTotal(): number {
    return this.showRaiseList ? this.totalItems : this.ftrTotalItems;
  }

  constructor(private apis: AuthService, private toastr: ToastrService, private permission: PermissionService) { }

  ngOnInit(): void {
    if (this.permission.hasSubmenuPermission('AddFTR'))
      this.showRaiseList = true;
    else if (this.permission.hasSubmenuPermission('UpdateFTR'))
      this.showFtrList = true;
    const now = new Date();
    this.stDate = this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    this.enDate = this.today;

    if (this.showRaiseList) this.fetchTractorList(1);
    if (this.showFtrList) this.fetchFtrList(1);
    if (this.showRaiseList || this.showFtrList) this.fetchNatureOfWork();
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

    this.apis.getChassisDetailsForFTR(this.selectedType, page, this.stDate, this.enDate, this.appliedChassisNo)
      .pipe(timeout(this.LIST_TIMEOUT_MS))
      .subscribe({
        next: (res: any) => {
          if (reqId !== this.requestId) return;

          const rows = Array.isArray(res?.data) ? res.data : [];
          const total = this.extractTotalCount(res);

          // Page size auto-detect: page 1 ke rows = server ka page size
          if (page === 1 && rows.length > 0 && total !== null && total > rows.length) this.itemsPerPage = rows.length;

          this.totalItems = total !== null
            ? total
            : (page - 1) * this.itemsPerPage + rows.length + (rows.length >= this.itemsPerPage ? 1 : 0);

          this.tractorList = rows.map((r: any) => this.mapChassisToTractor(r));
          this.currentPage = page;
          this.loading = false;
        },
        error: (err: any) => {
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
    if (this.showRaiseList)
      this.fetchTractorList(1);
    else if (this.showFtrList)
      this.fetchFtrList(1)
  }

  onPageChange(page: number): void {
    this.fetchTractorList(page);
  }

  //refreshList(): void {
  //  this.fetchTractorList(this.currentPage);
  //}

  // ─── NATURE OF WORK ─────────────────────────────────────────

  fetchNatureOfWork(): void {
    this.natureOfWorkLoading = true;
    this.apis.getWorkNature().subscribe({
      next: (res: any) => {
        const list = res?.data || [];
        this.natureOfWorkOptions = list.map((e: any) => ({ label: e.natureOfWorkName, value: e.masterId }));
        this.natureOfWorkLoading = false;
        this.applyNatureFromEditing();
      },
      error: () => {
        this.natureOfWorkLoading = false;
        this.toastr.error('Failed to load Nature of Work options.', 'Error');
      }
    });
  }

  private applyNatureFromEditing(): void {
    if (!this.editingFtr || this.natureOfWork) return;
    const label = (this.editingFtr.NatureOfWorkDone || '').trim().toLowerCase();
    this.natureOfWork = this.natureOfWorkOptions.find(o => o.label.trim().toLowerCase() === label) || null;
  }

  compareOption = (a: FtrOption | null, b: FtrOption | null) => a?.value === b?.value;

  // ─── FORM OPEN ──────────────────────────────────────────────

  openForm(item: FtrTractor): void {
    this.resetForm();
    this.editingFtr = null;
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
    this.editingFtr = null;
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
      this.isEditMode ? 'Verify Before Update' : 'Verify Before Submission',
      this.isEditMode
        ? 'Please confirm the updated details of this Field Technical Report are correct.'
        : 'Please confirm all details entered in this Field Technical Report are correct. Once submitted, the report will be visible to CCM/HO for action.',
      this.isEditMode ? 'Confirm & Update' : 'Confirm & Submit',
      'Review Again'
    ).then(r => {
      if (!r.isConfirmed) return;
      this.isEditMode ? this.confirmUpdate() : this.confirmSubmit();
    });
  }
  private confirmUpdate(): void {
    const rec = this.editingFtr;
    if (!rec) return;

    const payload: FtrUpdatePayload = {
      id: rec.Id,
      sseName: this.sseName.trim(),
      failureDate: this.toISO(this.dateOfFailure),
      hoursWorked: Number(this.hoursWorked) || 0,
      repairDate: this.toISO(this.dateOfRepair),
      natureOfWorkDone: this.natureOfWork?.label ?? '',
      implementTrolleySize: this.implementSize.trim(),
      customerComplaints: this.customerComplaints.trim(),
      problemDefinition: this.problemDefinition.trim(),
      modifiedBy: sessionStorage.getItem('userName') || '',
      positionName: sessionStorage.getItem('possitionId') || '',
      stockStatus: this.isInStock ? 'IN' : 'OUT'
    };

    this.submitting = true;
    this.apis.updateFTR(payload).pipe(timeout(this.REQUEST_TIMEOUT_MS)).subscribe({
      next: () => {
        this.submitting = false;
        this.toastr.success('Field Technical Report updated successfully.', 'Updated');
        this.closeForm();
        this.fetchFtrList(this.ftrCurrentPage);
      },
      error: (err: any) => {
        this.submitting = false;
        this.toastr.error(err?.error?.message || 'Failed to update report. Please try again.', 'Error');
      }
    });
  }

  private confirmSubmit(): void {
    const item = this.selectedTractor;
    if (!item) return;
    const inStock = this.isInStock;

    const payload: FtrSubmitPayload = {
      sseName: this.sseName.trim(),
      dealerCode: item.DealerCode || '',
      tractorModelBOMCode: item.ModelCode || '',
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
        if (this.showRaiseList) this.fetchTractorList(this.currentPage);
        if (this.showFtrList) this.fetchFtrList(1);
      },
      error: (err: any) => {
        this.submitting = false;
        this.toastr.error(err?.error?.message || 'Failed to submit report. Please try again.', 'Error');
      }
    });
  }

  // ─── SUBMITTED FTR LIST ─────────────────────────────────────

  fetchFtrList(page: number = 1): void {
    if (this.stDate && this.enDate && this.stDate > this.enDate) {
      this.toastr.warning('From date cannot be after To date.', 'Validation');
      return;
    }
    const reqId = ++this.ftrRequestId;
    this.ftrLoading = true;
    this.ftrList = [];

    this.apis.getFTRData(page, this.stDate, this.enDate, this.appliedChassisNo)
      .pipe(timeout(this.LIST_TIMEOUT_MS))
      .subscribe({
        next: (res: any) => {
          if (reqId !== this.ftrRequestId) return;
          const rows: FtrRecord[] = Array.isArray(res?.data) ? res.data : [];
          const total = this.extractTotalCount(res);

          if (page === 1 && rows.length > 0 && total !== null && total > rows.length) this.ftrItemsPerPage = rows.length;

          this.ftrTotalItems = total !== null
            ? total
            : (page - 1) * this.ftrItemsPerPage + rows.length + (rows.length >= this.ftrItemsPerPage ? 1 : 0);

          this.ftrList = rows;
          this.ftrCurrentPage = page;
          this.ftrLoading = false;
        },
        error: (err: any) => {
          if (reqId !== this.ftrRequestId) return;
          this.ftrLoading = false;
          this.ftrList = [];
          this.toastr.error(
            err?.name === 'TimeoutError'
              ? 'Loading is taking too long. Please check your connection and try again.'
              : (err?.error?.message || 'Failed to load FTR list.'),
            'Error'
          );
        }
      });
  }

  onFtrPageChange(page: number): void {
    this.fetchFtrList(page);
  }

  isRecordInStock(rec: FtrRecord): boolean {
    return !!rec.StockMasterId && !rec.SalesCustomerMasterId;
  }

  openUpdateForm(rec: FtrRecord): void {
    this.resetForm();
    this.editingFtr = rec;
    this.isInStock = this.isRecordInStock(rec);

    this.selectedTractor = {
      Id: rec.SalesCustomerMasterId || rec.StockMasterId || '',
      TractorSrNumber: rec.TractorSerialNo,
      ChassisNo: rec.TractorSerialNo,
      Model: rec.TractorModelBOMCode,
      DealerCode: rec.DealerCode,
      DealerName: rec.DealerName,
      DealerAddress: rec.DealerAddress,
      CustomerName: rec.CustomerName,
      CustomerAddress: rec.CustomerAddress,
      MobileNo: rec.MobileNo,
      Village: rec.Village,
      PostOffice: rec.Post,
      District: rec.District,
      StockMasterId: rec.StockMasterId
    } as FtrTractor;

    this.sseName = rec.SSEName || '';
    this.dateOfFailure = (rec.FailureDate || '').substring(0, 10);
    this.dateOfRepair = (rec.RepairDate || '').substring(0, 10);
    this.hoursWorked = rec.HoursWorked != null ? String(rec.HoursWorked) : '';
    this.implementSize = rec.ImplementTrolleySize || '';
    this.customerComplaints = rec.CustomerComplaints || '';
    this.problemDefinition = rec.ProblemDefinition || '';

    if (this.natureOfWorkOptions.length) this.applyNatureFromEditing();
    else if (!this.natureOfWorkLoading) this.fetchNatureOfWork();

    const el = document.getElementById('ftrFormModal');
    if (el) bootstrap.Modal.getOrCreateInstance(el).show();

    if (!this.isInStock && rec.SalesCustomerMasterId) this.loadServiceTimeline(rec.SalesCustomerMasterId);
  }

  onSearch(): void {
    if (!this.stDate || !this.enDate) {
      this.toastr.warning('Please select Start and End date.', 'Validation');
      return;
    }
    if (this.stDate > this.enDate) {
      this.toastr.warning('Start date cannot be after End date.', 'Validation');
      return;
    }
    this.appliedChassisNo = (this.chassisNo || '').trim();
    if (this.showRaiseList) { this.currentPage = 1; this.fetchTractorList(1); }
    if (this.showFtrList) { this.ftrCurrentPage = 1; this.fetchFtrList(1); }
  }

  clearChassis(): void {
    this.chassisNo = '';
    this.onSearch();
  }
}
