import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { ClosedJobCard, WarrantyClaimPart, WarrantyClaim, WarrantyClaimSpare, WarrantyClaimCount } from '../../model/apiresponse';

declare var bootstrap: any;

@Component({
  selector: 'app-warrantyclaim',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './warrantyclaim.component.html',
  styleUrl: './warrantyclaim.component.css'
})
export class WarrantyclaimComponent implements OnInit, AfterViewInit, OnDestroy {

  // ================= CONSTANTS =================
  readonly ROLE_HO = 'National Service Head';
  readonly ROLE_CCM = 'Service CCM';
  readonly ROLE_DEALER = 'Dealer';

  readonly jobCardTypes: string[] = ['Warranty Job Card', 'Post Warranty Job Card'];
  readonly MAX_LABOUR = 99999.99;
  readonly MAX_QTY = 999;
  readonly today: string = this.formatDate(new Date());

  readonly stepMeta: any = {
    done: { icon: 'fa-solid fa-check', label: 'Submitted' },
    approved: { icon: 'fa-solid fa-check', label: 'Approved' },
    rejected: { icon: 'fa-solid fa-xmark', label: 'Rejected' },
    pending: { icon: 'fa-solid fa-hourglass-half', label: 'Pending' },
    waiting: { icon: 'fa-regular fa-circle', label: 'Not Started' },
    skipped: { icon: 'fa-solid fa-minus', label: 'Not Required' }
  };

  @ViewChild('claimModalEl') claimModalEl!: ElementRef;
  @ViewChild('reviewModalEl') reviewModalEl!: ElementRef;

  positionName: string = '';
  activeTab: 'jobcards' | 'claims' = 'claims';

  // ================= JOB CARDS (Dealer) =================
  jobCardNo: string = '';
  chassisNumber: string = '';
  selectedJobType: string = '';
  selectedDuration: string = 'this Month';
  customStartDate: string = '';
  customEndDate: string = '';

  jobCardList: ClosedJobCard[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  // ================= CLAIM FILL (Dealer) =================
  selectedJobCard: ClosedJobCard | null = null;
  partList: WarrantyClaimPart[] = [];
  selectedPartIds = new Set<string>();
  claimRemarks: string = '';
  labourCharge: string = '';
  isSubmitting = false;

  // ================= CLAIM LIST =================
  allClaims: WarrantyClaim[] = [];
  filteredClaims: WarrantyClaim[] = [];
  claimList: WarrantyClaim[] = [];
  claimSearch: string = '';
  claimTotalItems = 0;
  claimCurrentPage = 1;
  claimItemsPerPage = 20;

  // ================= CLAIM REVIEW =================
  selectedClaim: WarrantyClaim | null = null;
  claimSpares: WarrantyClaimSpare[] = [];
  claimTimeline: any[] = [];
  modifyMode = false;
  editQty = new Map<string, number>();
  includedSpareIds = new Set<string>();
  editLabour: string = '';
  editRemarks: string = '';
  isUpdating = false;

  // ================= APPROVE / REJECT =================
  confirmAction: 'approve' | 'reject' | null = null;
  actionRemarks: string = '';
  actionTouched = false;
  isActing = false;

  private claimModal: any;
  private reviewModal: any;
  private onClaimHidden = () => this.handleClaimModalHidden();
  private onReviewHidden = () => this.handleReviewModalHidden();

  readonly claimStatusCards = [
    { status: 0, key: 'PendingCount', label: 'Pending', icon: 'fa-solid fa-hourglass-half', cls: 'sc-pending' },
    { status: 1, key: 'ApprovedCount', label: 'Approved', icon: 'fa-solid fa-circle-check', cls: 'sc-approved' },
    { status: -1, key: 'RejectedCount', label: 'Rejected', icon: 'fa-solid fa-circle-xmark', cls: 'sc-rejected' }
  ];

  claimStatus: number = 0;   // 0 = Pending, 1 = Approved, -1 = Rejected
  claimCount: WarrantyClaimCount = { PendingCount: 0, ApprovedCount: 0, RejectedCount: 0 };

  constructor(private apis: AuthService) { }

  ngOnInit(): void {
    this.positionName = sessionStorage.getItem('possitionId') || '';
    if (this.isDealer) {
      this.activeTab = 'jobcards';
      this.getClosedJobCards(1);
    } else {
      this.activeTab = 'claims';
      this.getWarrantyClaims();
    }
  }

  ngAfterViewInit(): void {
    this.claimModal = this.initModal(this.claimModalEl, this.onClaimHidden);
    this.reviewModal = this.initModal(this.reviewModalEl, this.onReviewHidden);
  }

  ngOnDestroy(): void {
    this.claimModalEl?.nativeElement?.removeEventListener('hidden.bs.modal', this.onClaimHidden);
    this.reviewModalEl?.nativeElement?.removeEventListener('hidden.bs.modal', this.onReviewHidden);
    this.claimModal?.dispose();
    this.reviewModal?.dispose();
  }

  private initModal(ref: ElementRef, onHidden: () => void): any {
    const el = ref?.nativeElement;
    if (!el) return null;
    el.addEventListener('hidden.bs.modal', onHidden);
    return bootstrap.Modal.getOrCreateInstance(el, { backdrop: 'static', keyboard: false });
  }

  // ================= ROLE =================

  private roleIs(name: string): boolean {
    return (this.positionName || '').trim().toLowerCase() === name.toLowerCase();
  }

  get isDealer(): boolean { return this.roleIs(this.ROLE_DEALER); }
  get isCcm(): boolean { return this.roleIs(this.ROLE_CCM); }
  get isHo(): boolean { return this.roleIs(this.ROLE_HO); }

  get roleLabel(): string {
    if (this.isHo) return 'HO';
    if (this.isCcm) return 'CCM';
    if (this.isDealer) return 'Dealer';
    return this.positionName || '-';
  }

  switchTab(tab: 'jobcards' | 'claims'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    if (tab === 'claims') this.getWarrantyClaims();
    else this.getClosedJobCards(this.currentPage);
  }

  // ================= JOB CARDS =================

  onDurationChange(): void {
    if (this.selectedDuration !== 'custom') {
      this.customStartDate = '';
      this.customEndDate = '';
      return;
    }
    const now = new Date();
    this.customStartDate = this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    this.customEndDate = this.today;
  }

  private validateFilters(): boolean {
    if (this.selectedDuration !== 'custom') return true;
    if (!this.customStartDate || !this.customEndDate) {
      this.apis.showAlert('error', 'Required', 'Please select start date and end date.');
      return false;
    }
    if (this.customStartDate > this.customEndDate) {
      this.apis.showAlert('error', 'Invalid Date', 'Start date cannot be greater than end date.');
      return false;
    }
    return true;
  }

  getClosedJobCards(page: number = 1): void {
    if (!this.validateFilters()) return;

    const isCustom = this.selectedDuration === 'custom';
    const filters = {
      JobCardNo: this.jobCardNo,
      ChassisNumber: this.chassisNumber,
      JobCardType: this.selectedJobType,
      Duration: this.selectedDuration,
      StartDate: isCustom ? this.customStartDate : '',
      EndDate: isCustom ? this.customEndDate : '',
      Offset: page,
      PageSize: this.itemsPerPage
    };

    this.apis.getClosedJobCardList(filters).subscribe({
      next: (res: any) => {
        if (res?.statusCode === 200 && res?.message?.toLowerCase() === 'success') {
          const d = res.data;
          this.jobCardList = Array.isArray(d) ? d : (d?.data || []);
          this.totalItems = this.jobCardList[0]?.TotalCount ?? 0;
          this.currentPage = page;
        } else {
          this.resetJobCards();
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed fetching job cards.');
        }
      },
      error: (err: any) => {
        this.resetJobCards();
        this.apis.showAlert('error', 'Error!', this.getErrMsg(err, 'Something went wrong while fetching job cards.'));
      }
    });
  }

  onShowReport(): void {
    this.getClosedJobCards(1);
  }

  onReset(): void {
    this.jobCardNo = '';
    this.chassisNumber = '';
    this.selectedJobType = '';
    this.selectedDuration = 'this Month';
    this.customStartDate = '';
    this.customEndDate = '';
    this.getClosedJobCards(1);
  }

  private resetJobCards(): void {
    this.jobCardList = [];
    this.totalItems = 0;
    this.currentPage = 1;
  }

  onPageChange(page: number): void {
    this.getClosedJobCards(page);
  }

  // ================= CLAIM FILL (Dealer) =================

  onSelect(item: ClosedJobCard): void {
    this.selectedJobCard = item;
    this.partList = [];
    this.selectedPartIds.clear();
    this.claimRemarks = '';
    this.labourCharge = '';
    this.getPartsByJobCard(item.Id);
    this.claimModal?.show();
  }

  closeClaimModal(): void {
    if (this.isSubmitting) return;
    this.claimModal?.hide();
  }

  private handleClaimModalHidden(): void {
    this.selectedJobCard = null;
    this.partList = [];
    this.selectedPartIds.clear();
    this.claimRemarks = '';
    this.labourCharge = '';
  }

  getPartsByJobCard(jobCardId: string): void {
    this.apis.getSparePartListByJobCardId(jobCardId).subscribe({
      next: (res: any) => {
        if (res?.statusCode === 200 && res?.message?.toLowerCase() === 'success') {
          this.partList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.partList = [];
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed fetching spare parts.');
        }
      },
      error: (err: any) => {
        this.partList = [];
        this.apis.showAlert('error', 'Error!', this.getErrMsg(err, 'Something went wrong while fetching spare parts.'));
      }
    });
  }

  // TotalPrice GST inclusive hai (175 = 148.31 + 26.69)
  taxableAmount(p: WarrantyClaimPart): number {
    return this.round2((Number(p.TotalPrice) || 0) - (Number(p.GstAmount) || 0));
  }

  isPartSelected(p: WarrantyClaimPart): boolean {
    return this.selectedPartIds.has(p.Id);
  }

  togglePart(p: WarrantyClaimPart): void {
    if (this.isSubmitting) return;
    this.selectedPartIds.has(p.Id) ? this.selectedPartIds.delete(p.Id) : this.selectedPartIds.add(p.Id);
  }

  get allSelected(): boolean {
    return this.partList.length > 0 && this.selectedPartIds.size === this.partList.length;
  }

  get someSelected(): boolean {
    return this.selectedPartIds.size > 0 && !this.allSelected;
  }

  toggleAll(): void {
    if (this.isSubmitting) return;
    if (this.allSelected) this.selectedPartIds.clear();
    else this.partList.forEach(p => this.selectedPartIds.add(p.Id));
  }

  get selectedParts(): WarrantyClaimPart[] {
    return this.partList.filter(p => this.selectedPartIds.has(p.Id));
  }

  get claimSummary(): { count: number; qty: number; taxable: number; gst: number; total: number } {
    return this.selectedParts.reduce((s, p) => ({
      count: s.count + 1,
      qty: s.qty + (Number(p.Qty) || 0),
      taxable: this.round2(s.taxable + this.taxableAmount(p)),
      gst: this.round2(s.gst + (Number(p.GstAmount) || 0)),
      total: this.round2(s.total + (Number(p.TotalPrice) || 0))
    }), { count: 0, qty: 0, taxable: 0, gst: 0, total: 0 });
  }

  onLabourInput(e: Event): void {
    this.labourCharge = this.applyDecimalInput(e);
  }

  onLabourBlur(): void {
    this.labourCharge = this.formatDecimal(this.labourCharge);
  }

  get labourAmount(): number {
    return this.toAmount(this.labourCharge);
  }

  get labourError(): string {
    return this.decimalError(this.labourCharge);
  }

  get claimTotal(): number {
    return this.round2(this.claimSummary.total + this.labourAmount);
  }

  submitClaim(): void {
    if (this.isSubmitting || !this.selectedJobCard) return;

    const parts = this.selectedParts;
    if (!parts.length) {
      this.apis.showAlert('error', 'Required', 'Please select at least one part for warranty claim.');
      return;
    }
    if (this.labourError) {
      this.apis.showAlert('error', 'Invalid', this.labourError);
      return;
    }

    const payload = {
      jobCardId: this.selectedJobCard.Id,
      claimRemarks: (this.claimRemarks || '').trim(),
      labourCharge: this.labourAmount,
      parts: parts.map(p => ({
        sparePartId: p.Id,
        partCode: p.PartNumber,
        claimQty: Number(p.Qty) || 0,
        rate: Number(p.BasePrice) || 0,
        gstPercentage: Number(p.GstRate) || 0
      }))
    };

    this.isSubmitting = true;
    this.apis.saveWarrantyClaim(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res?.statusCode === 200) {
          this.apis.showAlert('success', 'Success!', res?.message || 'Warranty claim submitted successfully.');
          this.claimModal?.hide();
          this.getClosedJobCards(this.currentPage);
        } else {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to submit warranty claim.');
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.apis.showAlert('error', 'Error!', this.getErrMsg(err, 'Something went wrong while submitting claim.'));
      }
    });
  }

  // ================= CLAIM LIST =================

  getWarrantyClaims(keepPage = false): void {
    this.apis.getPendingWarrantyClaimList(this.claimStatus).subscribe({
      next: (res: any) => {
        if (res?.statusCode === 200 && res?.message?.toLowerCase() === 'success') {
          const d = res.data;
          this.allClaims = Array.isArray(d) ? d : (d?.claims || []);

          const cnt = d?.count?.[0];
          this.claimCount = {
            PendingCount: Number(cnt?.PendingCount) || 0,
            ApprovedCount: Number(cnt?.ApprovedCount) || 0,
            RejectedCount: Number(cnt?.RejectedCount) || 0
          };

          this.applyClaimSearch(keepPage ? this.claimCurrentPage : 1);

          // Modal khula hai to fresh data se sync
          if (this.selectedClaim) {
            const fresh = this.allClaims.find(c => c.Id === this.selectedClaim!.Id);
            if (fresh) this.setSelectedClaim(fresh);
          }
        } else {
          this.resetClaims();
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed fetching warranty claims.');
        }
      },
      error: (err: any) => {
        this.resetClaims();
        this.apis.showAlert('error', 'Error!', this.getErrMsg(err, 'Something went wrong while fetching warranty claims.'));
      }
    });
  }

  onClaimSearch(): void {
    this.applyClaimSearch(1);
  }

  onClaimRefresh(): void {
    this.claimSearch = '';
    this.getWarrantyClaims();
  }

  onStatusCardClick(status: number): void {
    if (this.claimStatus === status) return;
    this.claimStatus = status;
    this.claimSearch = '';
    this.getWarrantyClaims();
  }

  getStatusCount(key: string): number {
    return Number((this.claimCount as any)?.[key]) || 0;
  }

  get claimStatusName(): string {
    return this.claimStatus === 1 ? 'approved' : this.claimStatus === -1 ? 'rejected' : 'pending';
  }

  private applyClaimSearch(page: number): void {
    const s = (this.claimSearch || '').trim().toLowerCase();
    this.filteredClaims = !s ? [...this.allClaims] : this.allClaims.filter(c =>
      (c.WarrantyClaimNo || '').toLowerCase().includes(s) ||
      (c.ChasisNo || '').toLowerCase().includes(s) ||
      (c.DealerCode || '').toLowerCase().includes(s) ||
      (c.CreatedBy || '').toLowerCase().includes(s)
    );
    this.claimTotalItems = this.filteredClaims.length;
    const maxPage = Math.max(1, Math.ceil(this.claimTotalItems / this.claimItemsPerPage));
    this.onClaimPageChange(Math.min(page, maxPage));
  }

  onClaimPageChange(page: number): void {
    this.claimCurrentPage = page;
    const start = (page - 1) * this.claimItemsPerPage;
    this.claimList = this.filteredClaims.slice(start, start + this.claimItemsPerPage);
  }

  private resetClaims(): void {
    this.allClaims = [];
    this.filteredClaims = [];
    this.claimList = [];
    this.claimTotalItems = 0;
    this.claimCurrentPage = 1;
  }

  // ================= STATUS HELPERS =================

  statusKey(v: any): 'pending' | 'approved' | 'rejected' {
    const s = String(v ?? '').trim().toLowerCase();
    if (s === 'approved' || s === '1') return 'approved';
    if (s === 'rejected' || s === '-1' || s === 'cancelled') return 'rejected';
    return 'pending';
  }

  statusLabel(v: any): string {
    const k = this.statusKey(v);
    return k === 'approved' ? 'Approved' : k === 'rejected' ? 'Rejected' : 'Pending';
  }

  statusClass(v: any): string {
    const k = this.statusKey(v);
    return k === 'approved' ? 'st-success' : k === 'rejected' ? 'st-danger' : 'st-warning';
  }

  hoStatusLabel(c: WarrantyClaim): string {
    return this.statusKey(c.CCMApprovalStatus) === 'approved' ? this.statusLabel(c.FinalApprovalStatus) : '—';
  }

  hoStatusClass(c: WarrantyClaim): string {
    return this.statusKey(c.CCMApprovalStatus) === 'approved' ? this.statusClass(c.FinalApprovalStatus) : 'st-default';
  }

  private stageKey(c: WarrantyClaim): string {
    const ccm = this.statusKey(c.CCMApprovalStatus);
    const ho = this.statusKey(c.FinalApprovalStatus);
    if (ccm === 'rejected') return 'ccm-rejected';
    if (ccm === 'pending') return this.statusKey(c.ClaimStatus) === 'rejected' ? 'rejected' : 'ccm';
    if (ho === 'rejected') return 'ho-rejected';
    if (ho === 'pending') return 'ho';
    return 'approved';
  }

  stageLabel(c: WarrantyClaim): string {
    switch (this.stageKey(c)) {
      case 'ccm': return 'Pending at CCM';
      case 'ho': return 'Pending at HO';
      case 'ccm-rejected': return 'Rejected by CCM';
      case 'ho-rejected': return 'Rejected by HO';
      case 'rejected': return 'Rejected';
      default: return 'Approved';
    }
  }

  stageClass(c: WarrantyClaim): string {
    const k = this.stageKey(c);
    if (k === 'ccm' || k === 'ho') return 'st-warning';
    if (k === 'approved') return 'st-success';
    return 'st-danger';
  }

  canCcmAct(c: WarrantyClaim | null): boolean {
    return !!c && this.isCcm && this.stageKey(c) === 'ccm';
  }

  canHoAct(c: WarrantyClaim | null): boolean {
    return !!c && this.isHo && this.stageKey(c) === 'ho';
  }

  canAct(c: WarrantyClaim | null): boolean {
    return this.canCcmAct(c) || this.canHoAct(c);
  }

  // ================= CLAIM REVIEW =================

  openClaimReview(c: WarrantyClaim): void {
    this.setSelectedClaim(c);
    this.claimSpares = [];
    this.resetModify();
    this.confirmAction = null;
    this.getClaimSpares(c.Id);
    this.reviewModal?.show();
  }

  closeReviewModal(): void {
    if (this.isUpdating || this.isActing) return;
    this.reviewModal?.hide();
  }

  private handleReviewModalHidden(): void {
    this.selectedClaim = null;
    this.claimSpares = [];
    this.claimTimeline = [];
    this.confirmAction = null;
    this.resetModify();
  }

  private setSelectedClaim(c: WarrantyClaim): void {
    this.selectedClaim = c;
    const ccm = this.statusKey(c.CCMApprovalStatus);
    const ho = this.statusKey(c.FinalApprovalStatus);

    this.claimTimeline = [
      {
        title: 'Claim Submitted', role: 'Dealer', state: 'done',
        by: c.CreatedBy, date: c.ClaimDate || c.CreatedDate, remarks: c.DealerRemarks
      },
      {
        title: 'CCM Approval', role: 'Service CCM', state: ccm,
        by: c.CCMApprovedBy, date: c.CCMApprovedDate, remarks: c.CCMRemarks
      },
      {
        title: 'Final Approval', role: 'HO',
        state: ccm === 'rejected' ? 'skipped' : ccm === 'pending' ? 'waiting' : ho,
        by: c.FinalApprovedBy, date: c.FinalApprovedDate, remarks: c.FinalApprovalRemarks
      }
    ];
  }

  getClaimSpares(claimId: string): void {
    this.apis.getWarrantySparesByMasterId(claimId).subscribe({
      next: (res: any) => {
        if (res?.statusCode === 200 && res?.message?.toLowerCase() === 'success') {
          this.claimSpares = Array.isArray(res.data) ? res.data : [];
        } else {
          this.claimSpares = [];
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed fetching claim parts.');
        }
      },
      error: (err: any) => {
        this.claimSpares = [];
        this.apis.showAlert('error', 'Error!', this.getErrMsg(err, 'Something went wrong while fetching claim parts.'));
      }
    });
  }

  // ----- Modify (CCM only) -----



  private resetModify(): void {
    this.modifyMode = false;
    this.editQty.clear();
    this.includedSpareIds.clear();
    this.editLabour = '';
    this.editRemarks = '';
  }



  blockInvalidKeys(e: KeyboardEvent): void {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
  }



  spareGst(s: WarrantyClaimSpare): number {
    if (!this.modifyMode) return Number(s.GSTAmount) || 0;
    const total = this.spareTotal(s);
    const rate = Number(s.GSTPercentage) || 0;
    return this.round2(total - total / (1 + rate / 100));
  }

  spareTaxable(s: WarrantyClaimSpare): number {
    return this.round2(this.spareTotal(s) - this.spareGst(s));
  }

  onReviewLabourInput(e: Event): void {
    this.editLabour = this.applyDecimalInput(e);
  }

  onReviewLabourBlur(): void {
    this.editLabour = this.formatDecimal(this.editLabour);
  }

  get reviewLabourError(): string {
    return this.modifyMode ? this.decimalError(this.editLabour) : '';
  }







  // ----- Approve / Reject (CCM + HO) -----

  openConfirm(action: 'approve' | 'reject'): void {
    if (!this.canAct(this.selectedClaim) || this.modifyMode) return;
    this.confirmAction = action;
    this.actionRemarks = '';
    this.actionTouched = false;
  }

  cancelConfirm(): void {
    if (this.isActing) return;
    this.confirmAction = null;
  }

  get actionRemarksError(): string {
    if (this.confirmAction === 'reject' && !(this.actionRemarks || '').trim()) return 'Remarks are required to reject the claim.';
    return '';
  }

  submitAction(): void {
    const c = this.selectedClaim;
    if (!c || !this.confirmAction || this.isActing) return;

    this.actionTouched = true;
    if (this.actionRemarksError) return;

    const isApprove = this.confirmAction === 'approve';
    const payload = {
      warrantyClaimId: c.Id,
      positionName: this.positionName,
      action: isApprove ? 1 : -1,
      remarks: (this.actionRemarks || '').trim()
    };

    this.isActing = true;
    this.apis.updateWarrantyClaimApproval(payload).subscribe({
      next: (res: any) => {
        this.isActing = false;
        if (res?.statusCode === 200) {
          this.apis.showAlert('success', isApprove ? 'Approved!' : 'Rejected!',
            res?.message || `Warranty claim ${isApprove ? 'approved' : 'rejected'} successfully.`);
          this.confirmAction = null;
          this.reviewModal?.hide();
          this.getWarrantyClaims(true);
        } else {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to update claim status.');
        }
      },
      error: (err: any) => {
        this.isActing = false;
        this.apis.showAlert('error', 'Error!', this.getErrMsg(err, 'Something went wrong while updating claim status.'));
      }
    });
  }

  // ================= COMMON HELPERS =================

  // Sirf digits + ek dot + max 2 decimal
  private applyDecimalInput(e: Event): string {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const intPart = v.slice(0, firstDot);
      const decPart = v.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
      v = (intPart || '0') + '.' + decPart;
    }
    v = v.replace(/^0+(?=\d)/, '');
    input.value = v;
    return v;
  }

  private formatDecimal(v: string): string {
    if (!v) return '';
    if (v.endsWith('.')) v = v.slice(0, -1);
    const n = parseFloat(v);
    return isNaN(n) ? '' : n.toFixed(2);
  }

  private toAmount(v: string): number {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : this.round2(n);
  }

  private decimalError(v: string): string {
    if (!v) return '';
    const n = parseFloat(v);
    if (isNaN(n)) return 'Enter a valid amount.';
    if (n < 0) return 'Labour charge cannot be negative.';
    if (n > this.MAX_LABOUR) return `Labour charge cannot exceed ₹${this.MAX_LABOUR.toLocaleString('en-IN')}.`;
    return '';
  }

  private getErrMsg(err: any, fallback: string): string {
    return err?.error?.errorCode ? (err?.error?.message || err.error.errorCode) : (err?.error?.message || fallback);
  }

  private round2(n: number): number {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
  }

  trackById = (_: number, it: ClosedJobCard) => it.Id;
  trackByPart = (_: number, p: WarrantyClaimPart) => p.Id;
  trackByClaim = (_: number, c: WarrantyClaim) => c.Id;


  // ----- Spare key + selection -----

  private spareKey(s: WarrantyClaimSpare): string {
    return s.SparePartId;
  }

  isOriginallySelected(s: WarrantyClaimSpare): boolean {
    return Number(s.IsSelected) === 1;
  }

  // View mode me sirf claimed parts, modify mode me job card ke saare parts
  get visibleSpares(): WarrantyClaimSpare[] {
    return this.modifyMode ? this.claimSpares : this.claimSpares.filter(s => this.isOriginallySelected(s));
  }

  get selectedSpareCount(): number {
    return this.claimSpares.filter(s => this.isOriginallySelected(s)).length;
  }

  private defaultQty(s: WarrantyClaimSpare): number {
    return Number(s.ClaimQty) || Number(s.JobCardQty) || 1;
  }

  onModifyToggle(): void {
    if (!this.canCcmAct(this.selectedClaim)) {
      this.modifyMode = false;
      return;
    }
    if (this.modifyMode) {
      this.editQty.clear();
      this.includedSpareIds.clear();
      this.claimSpares.forEach(s => {
        const key = this.spareKey(s);
        this.editQty.set(key, this.defaultQty(s));
        if (this.isOriginallySelected(s)) this.includedSpareIds.add(key);
      });
      this.editLabour = this.formatDecimal(String(this.selectedClaim?.LabourCharge ?? 0));
      this.editRemarks = '';
    } else {
      this.resetModify();
    }
  }

  spareQty(s: WarrantyClaimSpare): number {
    return this.modifyMode ? (this.editQty.get(this.spareKey(s)) ?? this.defaultQty(s)) : Number(s.ClaimQty);
  }

  isSpareIncluded(s: WarrantyClaimSpare): boolean {
    return this.modifyMode ? this.includedSpareIds.has(this.spareKey(s)) : this.isOriginallySelected(s);
  }

  toggleSpare(s: WarrantyClaimSpare): void {
    if (!this.modifyMode || this.isUpdating) return;
    const key = this.spareKey(s);
    this.includedSpareIds.has(key) ? this.includedSpareIds.delete(key) : this.includedSpareIds.add(key);
  }

  incSpareQty(s: WarrantyClaimSpare): void {
    const q = this.spareQty(s);
    if (q < this.MAX_QTY) this.editQty.set(this.spareKey(s), q + 1);
  }

  decSpareQty(s: WarrantyClaimSpare): void {
    const q = this.spareQty(s);
    if (q > 1) this.editQty.set(this.spareKey(s), q - 1);
  }

  onSpareQtyChange(s: WarrantyClaimSpare, e: Event): void {
    const input = e.target as HTMLInputElement;
    let v = Math.floor(Number((input.value || '').replace(/[^0-9]/g, '')));
    if (!v || v < 1) v = 1;
    if (v > this.MAX_QTY) v = this.MAX_QTY;
    input.value = String(v);
    this.editQty.set(this.spareKey(s), v);
  }

  // Modify me Rate*Qty se calculate, view me server values
  spareTotal(s: WarrantyClaimSpare): number {
    return this.modifyMode ? this.round2(Number(s.Rate) * this.spareQty(s)) : Number(s.TotalAmount) || 0;
  }

  get reviewSummary(): { count: number; qty: number; taxable: number; gst: number; total: number; labour: number; grand: number } {
    const c = this.selectedClaim;
    const labour = this.modifyMode ? this.toAmount(this.editLabour) : Number(c?.TotalLabourAmount ?? c?.LabourCharge ?? 0);

    if (!this.claimSpares.length) {
      const total = Number(c?.TotalPartsAmount) || 0;
      const gst = Number(c?.PartsGSTAmount) || 0;
      return { count: 0, qty: 0, taxable: this.round2(total - gst), gst, total, labour, grand: this.round2(total + labour) };
    }

    const s = this.claimSpares.filter(x => this.isSpareIncluded(x)).reduce((a, x) => ({
      count: a.count + 1,
      qty: a.qty + this.spareQty(x),
      taxable: this.round2(a.taxable + this.spareTaxable(x)),
      gst: this.round2(a.gst + this.spareGst(x)),
      total: this.round2(a.total + this.spareTotal(x))
    }), { count: 0, qty: 0, taxable: 0, gst: 0, total: 0 });

    return { ...s, labour, grand: this.round2(s.total + labour) };
  }

  get hasReviewChanges(): boolean {
    if (!this.modifyMode || !this.selectedClaim) return false;

    // Selection change (koi add / remove hua)
    const selectionChanged = this.claimSpares.some(s => this.isOriginallySelected(s) !== this.includedSpareIds.has(this.spareKey(s)));
    if (selectionChanged) return true;

    // Qty change (sirf selected rows me)
    const qtyChanged = this.claimSpares
      .filter(s => this.includedSpareIds.has(this.spareKey(s)))
      .some(s => this.spareQty(s) !== Number(s.ClaimQty));
    if (qtyChanged) return true;

    return this.toAmount(this.editLabour) !== this.round2(Number(this.selectedClaim.LabourCharge) || 0);
  }

  saveModification(): void {
    const c = this.selectedClaim;
    if (!c || this.isUpdating || !this.canCcmAct(c)) return;

    const included = this.claimSpares.filter(s => this.includedSpareIds.has(this.spareKey(s)));
    if (!included.length) {
      this.apis.showAlert('error', 'Required', 'At least one part must be selected in the claim.');
      return;
    }
    if (this.reviewLabourError) {
      this.apis.showAlert('error', 'Invalid', this.reviewLabourError);
      return;
    }
    if (!this.hasReviewChanges) {
      this.apis.showAlert('error', 'No Changes', 'Nothing has been modified.');
      return;
    }

    const payload = {
      warrantyClaimId: c.Id,
      claimRemarks: (this.editRemarks || '').trim(),
      labourCharge: this.toAmount(this.editLabour),
      parts: included.map(s => ({
        sparePartId: s.SparePartId,
        partCode: s.PartCode,
        claimQty: this.spareQty(s),
        rate: Number(s.Rate) || 0,
        gstPercentage: Number(s.GSTPercentage) || 0
      }))
    };

    this.isUpdating = true;
    this.apis.updateWarrantyClaim(payload).subscribe({
      next: (res: any) => {
        this.isUpdating = false;
        if (res?.statusCode === 200) {
          this.apis.showAlert('success', 'Updated!', res?.message || 'Warranty claim updated successfully.');
          this.resetModify();
          this.getClaimSpares(c.Id);
          this.getWarrantyClaims(true);
        } else {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to update warranty claim.');
        }
      },
      error: (err: any) => {
        this.isUpdating = false;
        this.apis.showAlert('error', 'Error!', this.getErrMsg(err, 'Something went wrong while updating claim.'));
      }
    });
  }

  trackBySpare = (_: number, s: WarrantyClaimSpare) => s.SparePartId;
}
