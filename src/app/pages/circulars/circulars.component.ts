import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { CircularList, CircularDetail, CircularFile, MsgSentReport, FinancialYearOption } from '../../model/apiresponse';
import { PermissionService } from '../../services/userpermission/permission.service';

declare var bootstrap: any;

@Component({
  selector: 'app-circulars',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './circulars.component.html',
  styleUrl: './circulars.component.css'
})
export class CircularsComponent implements OnInit {

  financialYears: FinancialYearOption[] = [];
  circularList: CircularList[] = [];

  searchQuery = '';
  fyFilter = '';
  circularType = '';

  serviceCircularCount = 0;
  serviceCircularFilesCount = 0;
  serviceInformationCircularCount = 0;
  serviceInformationFilesCount = 0;

  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  // Add modal
  circularForm!: FormGroup;
  addFiles: File[] = [];
  submitted = false;
  saving = false;

  // Detail / Update modal
  selectedCircular: CircularDetail = this.emptyDetail();
  originalCircularName = '';
  stagedFiles: File[] = [];
  updateSubmitted = false;
  updating = false;

  // Report modal
  reportType: 'DPs' | 'Company' = 'DPs';
  selectedReportFile: CircularFile | null = null;
  pagedReportList: MsgSentReport[] = [];
  reportCurrentPage = 1;
  reportItemsPerPage = 10;
  reportTotalItems = 0;
  reportReadCount = 0;
  reportDeliveredCount = 0;
  reportSentCount = 0;
  reportFailedCount = 0;
  addCircular: boolean = false;
  circularListPermission: boolean = false;

  constructor(
    private apis: AuthService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private permission: PermissionService
  ) { }

  ngOnInit(): void {
    if (this.permission.hasSubmenuPermission('AddCircular')) {
      this.addCircular = true;
    }
    if (this.permission.hasSubmenuPermission('CircularList')) {
      this.circularListPermission = true;
      this.generateFinancialYears();
      this.fetchData();

    }
    this.initForm();
  }

  // ─── HELPERS ────────────────────────────────────────────────

  private isOk(res: any): boolean {
    return res?.statusCode === 200 || res?.message?.toLowerCase() === 'success';
  }

  private emptyDetail(): CircularDetail {
    return { Name: '', Description: '', CircularDate: '', CircularType: '', FinancialYear: '', Files: [] };
  }

  private getFY(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m] = dateStr.split('-').map(Number);
    const fromYear = m >= 4 ? y : y - 1;
    return `FY${String(fromYear).slice(-2)}-${String(fromYear + 1).slice(-2)}`;
  }

  private mergeFiles(existing: File[], list: FileList | null): File[] {
    if (!list?.length) return existing;
    const result = [...existing];
    Array.from(list).forEach(f => {
      if (f.type !== 'application/pdf') {
        this.toastr.warning(`${f.name} is not a PDF, skipped.`, 'Invalid File');
        return;
      }
      if (result.some(x => x.name === f.name && x.size === f.size)) return;
      result.push(f);
    });
    return result;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private showModal(id: string): void {
    const el = document.getElementById(id);
    if (el) bootstrap.Modal.getOrCreateInstance(el).show();
  }

  private hideModal(id: string): void {
    const el = document.getElementById(id);
    if (el) bootstrap.Modal.getInstance(el)?.hide();
  }

  generateFinancialYears(): void {
    const now = new Date();
    const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    this.financialYears = [];
    for (let i = 0; i < 6; i++) {
      const from = startYear - i;
      const fy = `FY${String(from).slice(-2)}-${String(from + 1).slice(-2)}`;
      this.financialYears.push({ value: fy, label: fy });
    }
  }

  // ─── LIST ───────────────────────────────────────────────────

  fetchData(page: number = 1): void {
    const payload = {
      RowSkip: (page - 1) * this.itemsPerPage,
      CircularName: this.searchQuery.trim(),
      FinancialYear: this.fyFilter,
      CircularType: this.circularType
    };

    this.apis.getCircularsList(payload).subscribe({
      next: (res: any) => {
        if (this.isOk(res)) {
          this.circularList = (res.data ?? []) as CircularList[];
          const first = this.circularList[0];
          this.serviceInformationCircularCount = first?.ServiceInformationCircularCount ?? 0;
          this.serviceInformationFilesCount = first?.ServiceInformationFilesCount ?? 0;
          this.serviceCircularCount = first?.ServiceCircularCount ?? 0;
          this.serviceCircularFilesCount = first?.ServiceCircularFilesCount ?? 0;
          this.totalItems = first?.TotalRecords ?? 0;
          this.currentPage = page;
        } else {
          this.toastr.error(res?.message || 'Failed fetching circulars.', 'Error');
        }
      },
      error: (err) => this.toastr.error(err.error?.message || 'Something went wrong. Please try again.', 'Error')
    });
  }

  applyFilters(): void {
    this.fetchData(1);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.fyFilter = '';
    this.circularType = '';
    this.fetchData(1);
  }

  onPageChange(page: number): void {
    this.fetchData(page);
  }

  // ─── ADD CIRCULAR ───────────────────────────────────────────

  initForm(): void {
    this.circularForm = this.fb.group({
      circularType: ['', Validators.required],
      circularName: ['', Validators.required],
      circularDate: ['', Validators.required],
      financialYear: ['', Validators.required],
      description: ['', Validators.required]
    });
    this.addFiles = [];
    this.submitted = false;
    this.saving = false;
  }

  isInvalid(field: string): boolean {
    const c = this.circularForm.get(field);
    return !!(this.submitted && c?.invalid);
  }

  onDateChange(): void {
    const date = this.circularForm.get('circularDate')?.value;
    this.circularForm.patchValue({ financialYear: this.getFY(date) });
  }

  onAddFilesSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles = this.mergeFiles(this.addFiles, input.files);
    input.value = '';
  }

  removeAddFile(index: number): void {
    this.addFiles.splice(index, 1);
  }

  openAddModal(): void {
    this.initForm();
    this.showModal('addCircularModal');
  }

  saveCircular(): void {
    this.submitted = true;
    if (this.circularForm.invalid || this.addFiles.length === 0) {
      this.toastr.warning('Please fill all required fields and attach at least one file.', 'Validation');
      return;
    }

    const v = this.circularForm.value;
    const formData = new FormData();
    formData.append('CircularName', v.circularName.trim());
    formData.append('CircularDate', v.circularDate);
    formData.append('Description', v.description.trim());
    formData.append('FinancialYear', v.financialYear);
    formData.append('CircularType', v.circularType);
    this.addFiles.forEach(f => formData.append('Files', f));

    this.saving = true;
    this.apis.addCircular(formData).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (this.isOk(res)) {
          this.toastr.success('Circular added successfully.', 'Success');
          this.closeModal('addCircularModal');
          this.clearFilters();
        } else {
          this.toastr.error(res?.message || 'Failed to add circular.', 'Error');
        }
      },
      error: (err) => {
        this.saving = false;
        this.toastr.error(err.error?.message || 'Something went wrong.', 'Error');
      }
    });
  }

  // ─── DETAIL / UPDATE ────────────────────────────────────────

  openDetail(name: string): void {
    this.selectedCircular = this.emptyDetail();
    this.stagedFiles = [];
    this.updateSubmitted = false;
    this.originalCircularName = name;

    this.apis.getCircularDetail({ CircularName: name }).subscribe({
      next: (res: any) => {
        if (this.isOk(res) && res.data) {
          const d = res.data;
          this.selectedCircular = {
            Name: d.name ?? d.Name,
            Description: d.description ?? d.Description,
            CircularDate: String(d.circularDate ?? d.CircularDate ?? '').split('T')[0],
            CircularType: d.circularType ?? d.CircularType,
            FinancialYear: d.financialYear ?? d.FinancialYear,
            Files: (d.files ?? d.Files ?? []).map((f: any) => ({
              Id: f.Id,
              PdfUrl: f.PdfUrl,
              PdfBase64: f.PdfBase64,
              PdfName: f.PdfName,
              IsSent: f.IsSent ?? 'NO',
              SentDate: f.SentDate ?? null,
              IsCompanySent: f.IsCompanySent ?? 'NO',
              CompanySentDate: f.CompanySentDate ?? null
            }))
          };
          this.showModal('detailCircularModal');
        } else {
          this.toastr.error('No data found.', 'Error');
        }
      },
      error: () => this.toastr.error('Failed to load circular details.', 'Error')
    });
  }

  onDetailDateChange(): void {
    this.selectedCircular.FinancialYear = this.getFY(this.selectedCircular.CircularDate);
  }

  onStagedFilesSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.stagedFiles = this.mergeFiles(this.stagedFiles, input.files);
    input.value = '';
  }

  removeStagedFile(index: number): void {
    this.stagedFiles.splice(index, 1);
  }

  updateCircular(): void {
    this.updateSubmitted = true;
    const c = this.selectedCircular;
    if (!c.Name?.trim() || !c.CircularType?.trim() || !c.CircularDate || !c.FinancialYear?.trim() || !c.Description?.trim()) {
      this.toastr.warning('Please fill all required fields.', 'Validation');
      return;
    }

    const formData = new FormData();
    formData.append('CircularName', this.originalCircularName);
    formData.append('NewCircularName', c.Name.trim());
    formData.append('CircularDate', c.CircularDate);
    formData.append('Description', c.Description.trim());
    formData.append('FinancialYear', c.FinancialYear);
    formData.append('CircularType', c.CircularType);
    this.stagedFiles.forEach(f => formData.append('Files', f));

    this.updating = true;
    this.apis.updateCircular(formData).subscribe({
      next: (res: any) => {
        this.updating = false;
        if (this.isOk(res)) {
          this.toastr.success('Circular updated successfully.', 'Success');
          this.closeModal('detailCircularModal');
          this.fetchData(this.currentPage);
        } else {
          this.toastr.error(res?.message || 'Failed to update.', 'Error');
        }
      },
      error: () => {
        this.updating = false;
        this.toastr.error('Something went wrong. Please try later.', 'Error');
      }
    });
  }

  openPdf(file: CircularFile): void {
    if (file?.PdfBase64) {
      const binary = atob(file.PdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      window.open(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), '_blank');
    } else if (file?.PdfUrl) {
      window.open(file.PdfUrl, '_blank');
    } else {
      this.toastr.error('PDF not available.', 'Error');
    }
  }

  // ─── SENT TOGGLE ────────────────────────────────────────────

  onSentToggle(file: CircularFile, type: 'DPs' | 'Company'): void {
    if (type === 'DPs' && file.IsSent === 'YES') return;
    if (type === 'Company' && file.IsCompanySent === 'YES') return;

    this.apis.showConfirm(
      `Send to ${type}?`,
      `Mark "${file.PdfName}" as sent to ${type}? This action cannot be undone.`,
      'Yes, Mark Sent'
    ).then(result => {
      if (result.isConfirmed) this.markSent(file, type);
    });
  }

  private markSent(file: CircularFile, type: 'DPs' | 'Company'): void {
    this.apis.updateCircularSentStatus({ CircularId: file.Id, Status: 'YES', Type: type }).subscribe({
      next: (res: any) => {
        if (this.isOk(res)) {
          if (type === 'DPs') {
            file.IsSent = 'YES';
            file.SentDate = new Date();
          } else {
            file.IsCompanySent = 'YES';
            file.CompanySentDate = new Date();
          }
          this.toastr.success(res?.message || `Marked as sent to ${type}.`, 'Success');
        } else {
          this.toastr.error(res?.message || 'Failed to update.', 'Error');
        }
      },
      error: () => this.toastr.error('Something went wrong.', 'Error')
    });
  }

  // ─── REPORT ─────────────────────────────────────────────────

  viewReport(file: CircularFile, type: 'DPs' | 'Company'): void {
    this.selectedReportFile = file;
    this.reportType = type;
    this.pagedReportList = [];
    this.resetReportCounts();
    this.getMsgSentReport(1);
    this.showModal('msgSentReportModal');
  }

  getMsgSentReport(page: number = 1): void {
    const payload = {
      RowSkip: (page - 1) * this.reportItemsPerPage,
      CircularId: this.selectedReportFile?.Id,
      Type: this.reportType,
      Download: 'No'
    };

    this.apis.getMsgSentReport(payload).subscribe({
      next: (res: any) => {
        if (this.isOk(res) && res.data?.length) {
          this.pagedReportList = res.data as MsgSentReport[];
          const first = this.pagedReportList[0];
          this.reportTotalItems = first?.TotalRecords ?? 0;
          this.reportReadCount = first?.ReadCount ?? 0;
          this.reportDeliveredCount = first?.DeliveredCount ?? 0;
          this.reportSentCount = first?.SentCount ?? 0;
          this.reportFailedCount = first?.FailedCount ?? 0;
        } else {
          this.pagedReportList = [];
          this.resetReportCounts();
        }
        this.reportCurrentPage = page;
      },
      error: (err) => {
        this.pagedReportList = [];
        this.resetReportCounts();
        this.toastr.error(err.error?.message || 'Something went wrong.', 'Error');
      }
    });
  }

  onReportPageChange(page: number): void {
    this.getMsgSentReport(page);
  }

  private resetReportCounts(): void {
    this.reportTotalItems = 0;
    this.reportReadCount = 0;
    this.reportDeliveredCount = 0;
    this.reportSentCount = 0;
    this.reportFailedCount = 0;
  }

  exportCSV(): void {
    const payload = {
      RowSkip: 0,
      CircularId: this.selectedReportFile?.Id,
      Type: this.reportType,
      Download: 'Yes'
    };

    this.apis.getMsgSentReport(payload).subscribe({
      next: (res: any) => {
        const data: MsgSentReport[] = res?.data ?? [];
        if (!data.length) {
          this.toastr.info('No data found to export.', 'No Data');
          return;
        }
        const fmt = (d: string | null) => d ? new Date(d).toLocaleString('en-IN') : '';

        if (this.reportType === 'DPs') {
          const headers = ['#', 'Region', 'RSM Service', 'RSM Sales', 'ASM Service', 'ASM Sales', 'Dealer Code', 'Dealership Name', 'DP Name', 'Sent Date', 'Status'];
          const rows = data.map((r, i) => [i + 1, r.Region, r.RsmService, r.RsmSales, r.AsmService, r.AsmSales, r.DealerCode, r.DealerName, r.DpName, fmt(r.SentDate), r.Status || 'PENDING']);
          this.downloadCSV(headers, rows, 'DPs_Report');
        } else {
          const headers = ['#', 'Region', 'RSM Name', 'RSM Mobile', 'RSM Email', 'ASM Name', 'ASM Mobile', 'ASM Email', 'Sent Date', 'Status'];
          const rows = data.map((r, i) => [i + 1, r.Region, r.RegionalName, r.RegionalMobileNo, r.RegionalEmail, r.AsmServiceName, r.AsmServiceMobileNo, r.AsmServiceEmail, fmt(r.SentDate), r.Status || 'PENDING']);
          this.downloadCSV(headers, rows, 'Company_Report');
        }
      },
      error: () => this.toastr.error('Failed to export. Please try again.', 'Error')
    });
  }

  private downloadCSV(headers: string[], rows: any[][], prefix: string): void {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}_${this.selectedReportFile?.PdfName ?? 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.toastr.success(`${rows.length} records exported.`, 'Success');
  }

  // ─── CLOSE ──────────────────────────────────────────────────

  closeModal(id: string): void {
    this.hideModal(id);
    if (id === 'addCircularModal') this.initForm();
    if (id === 'detailCircularModal') {
      this.stagedFiles = [];
      this.updateSubmitted = false;
      this.selectedCircular = this.emptyDetail();
    }
    if (id === 'msgSentReportModal') {
      this.reportType = 'DPs';
      this.selectedReportFile = null;
    }
  }
}
