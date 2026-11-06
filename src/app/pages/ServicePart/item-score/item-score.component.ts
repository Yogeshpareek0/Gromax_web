import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import {
  DraftPoint, ItemScoreDraft, ItemScorePhotoSlot, GroupStatus,
  ItemScoreColumn, ItemScoreReportRow
} from '../../../model/apiresponse';

const DRAFT_KEY = 'itemScoreDraft';
const ROLE_CCM = 'Service CCM';
const ROLE_NSH = 'National Service Head';

type ApprovalAction = 'Approved' | 'Rejected';

@Component({
  selector: 'app-item-score',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './item-score.component.html',
  styleUrl: './item-score.component.css'
})
export class ItemScoreComponent implements OnInit, OnDestroy {

  mode: 'add' | 'approval' = 'add';
  view: 'dealers' | 'groups' | 'items' = 'dealers';
  positionId: string = '';

  // Dealer list
  dealers: any[] = [];
  filteredDealers: any[] = [];
  dealerSearch: string = '';
  dealerLoading: boolean = false;
  selectedDealer: any = null;

  // Groups
  allItems: any[] = [];
  groupNames: string[] = [];
  groupStatusMap: { [group: string]: GroupStatus | undefined } = {};
  groupLoading: boolean = false;
  catType: any = null;

  // Group items
  selectedGroup: string = '';
  groupItems: any[] = [];

  // Draft (web replacement of SQLite)
  draft: ItemScoreDraft | null = null;

  // Modal
  showModal: boolean = false;
  modalItem: any = null;
  tempAnswer: string | null = null;
  tempSlots: ItemScorePhotoSlot[] = [];
  activeSlotIndex: number = -1;

  yesNoOptions = [
    { label: 'Yes', value: '1' },
    { label: 'No', value: '0' }
  ];

  submitting: boolean = false;

  // ─── Approval list ───
  readonly halfYearOptions = [
    { label: 'Apr - Sep', value: 1 },
    { label: 'Oct - Mar', value: 2 }
  ];
  private readonly FIXED_KEYS = [
    'ItemScoreId', 'Id', 'Status', 'CateType',
    'StateName', 'DealerCode', 'DealerName', 'Location',
    'TotalGetScore', 'MaxScore', 'Percentage', 'TotalCount'
  ];
  private readonly TIMEOUT_MS = 60000;

  yearOptions: number[] = [];
  selectedYear!: number;
  selectedHalfYear!: number;
  approvalRows: ItemScoreReportRow[] = [];
  scoreColumns: ItemScoreColumn[] = [];
  maxTotal = 0;
  approvalLoading = false;
  actionLoadingId: string | null = null;
  private approvalReqId = 0;
  currentPage = 1;
  itemsPerPage = 20;

  // ─── Approve / Reject Modal ───
  readonly REMARK_MAX = 500;
  showActionModal = false;
  actionRow: ItemScoreReportRow | null = null;
  actionType: ApprovalAction = 'Approved';
  actionRemark = '';
  actionRemarkTouched = false;
  actionSubmitting = false;

  // ─── Edit (NSH) ───
  editMode = false;
  editItemScoreId: string | null = null;
  private originalPoints: { [pointId: string]: { score: string; images: string[] } } = {};

  constructor(private apis: AuthService) { }

  ngOnInit(): void {
    this.positionId = (sessionStorage.getItem('possitionId') || '').trim();
    this.initYearAndHalf();

    if (this.canAdd) {
      this.mode = 'add';
      this.draft = this.readDraft();
      this.loadDealers();
    } else {
      this.mode = 'approval';
      this.fetchApprovalList();
    }
  }

  ngOnDestroy(): void {
    this.revokeTempPreviews();
    document.body.style.overflow = 'auto';
  }

  // ===================== ROLE =====================

  get isCCM(): boolean { return this.positionId === ROLE_CCM; }
  get isNSH(): boolean { return this.positionId === ROLE_NSH; }
  get canAdd(): boolean { return !this.isNSH; }
  get canTakeAction(): boolean { return this.isNSH; }

  switchMode(mode: 'add' | 'approval'): void {
    if (this.mode === mode) return;
    if (mode === 'add' && !this.canAdd) return;

    this.mode = mode;
    this.view = 'dealers';

    if (mode === 'add') {
      this.draft = this.readDraft();
      if (!this.dealers.length && !this.dealerLoading) this.loadDealers();
    } else {
      this.fetchApprovalList();
    }
  }

  // ===================== COMMON =====================

  private isOk(res: any): boolean {
    return res?.statusCode === 200 || res?.message?.toLowerCase() === 'success';
  }

  private readDraft(): ItemScoreDraft | null {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.dealerCode ? parsed : null;
    } catch {
      return null;
    }
  }

  private writeDraft(): void {
    if (this.editMode) return;   // edit me draft sirf memory me
    try {
      if (this.draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(this.draft));
    } catch (e) {
      console.error('DRAFT save error', e);
    }
  }

  private clearDraft(): void {
    localStorage.removeItem(DRAFT_KEY);
    this.draft = null;
  }

  private draftHasData(draft: ItemScoreDraft | null): boolean {
    return !!draft && Object.keys(draft.points || {}).length > 0;
  }

  isDealerInProgress(dealer: any): boolean {
    return this.draft?.dealerCode === dealer?.DealerCode && this.draftHasData(this.draft);
  }

  // ===================== DEALER LIST =====================

  loadDealers(): void {
    this.dealerLoading = true;
    this.dealers = [];
    this.filteredDealers = [];

    this.apis.allDealerList(2).subscribe({
      next: (res: any) => {
        this.dealerLoading = false;
        if (this.isOk(res)) {
          this.dealers = res.data || [];
          this.filterDealers();
        } else {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to fetch dealer list.');
        }
      },
      error: () => {
        this.dealerLoading = false;
        this.apis.showAlert('error', 'Error!', 'Failed to fetch dealer list.');
      }
    });
  }

  filterDealers(): void {
    const q = (this.dealerSearch || '').trim().toLowerCase();
    if (!q) {
      this.filteredDealers = [...this.dealers];
      return;
    }
    this.filteredDealers = this.dealers.filter(d =>
      (d.DealerCode || '').toLowerCase().includes(q) ||
      (d.DealerName || '').toLowerCase().includes(q) ||
      (d.Location || '').toLowerCase().includes(q) ||
      (d.StateName || '').toLowerCase().includes(q)
    );
  }

  onDealerClick(dealer: any): void {
    const saved = this.readDraft();

    if (this.draftHasData(saved) && saved!.dealerCode !== dealer?.DealerCode) {
      this.apis.showConfirm(
        'Switch Dealer?',
        `You have previously filled data for Dealer Code: ${saved!.dealerCode} (${saved!.dealerName}). ` +
        `Proceeding with ${dealer.DealerCode} (${dealer.DealerName}) will clear all previously entered data.`,
        'Yes',
        'Cancel'
      ).then(result => {
        if (result.isConfirmed) {
          this.clearDraft();
          this.openDealer(dealer);
        }
      });
      return;
    }

    this.openDealer(dealer);
  }

  private openDealer(dealer: any): void {
    this.selectedDealer = dealer;
    const saved = this.readDraft();

    this.draft = saved?.dealerCode === dealer.DealerCode
      ? saved
      : { dealerCode: dealer.DealerCode, dealerName: dealer.DealerName, points: {} };

    this.view = 'groups';
    this.loadItems();
  }

  // ===================== GROUPS =====================

  loadItems(): void {
    if (!this.selectedDealer?.DealerCode) return;

    this.groupLoading = true;
    this.allItems = [];
    this.groupNames = [];
    this.catType = null;

    this.apis.getReimbursementList(this.selectedDealer.DealerCode).subscribe({
      next: (res: any) => {
        this.groupLoading = false;
        if (this.isOk(res)) {
          this.allItems = res.data || [];
          this.catType = this.allItems[0]?.catType ?? null;
          this.groupNames = [...new Set(this.allItems.map(x => x.groupName).filter(Boolean))] as string[];
          this.refreshGroupStatus();
        } else {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to fetch item score list.');
        }
      },
      error: () => {
        this.groupLoading = false;
        this.apis.showAlert('error', 'Error!', 'Failed to fetch item score list.');
      }
    });
  }

  refreshGroupStatus(): void {
    const map: { [group: string]: GroupStatus } = {};
    this.groupNames.forEach(g => {
      const items = this.allItems.filter(x => x.groupName === g);
      const done = items.filter(x => !!this.getPoint(x)).length;
      map[g] = { total: items.length, done, complete: items.length > 0 && done === items.length };
    });
    this.groupStatusMap = map;
  }

  get allGroupsComplete(): boolean {
    return this.groupNames.length > 0 && this.groupNames.every(g => this.groupStatusMap[g]?.complete);
  }

  openGroup(groupName: string): void {
    this.selectedGroup = groupName;
    this.groupItems = this.allItems.filter(x => x.groupName === groupName);
    this.view = 'items';
  }

  backToDealers(): void {
    if (this.editMode) {
      if (!this.hasEditChanges()) {
        this.exitEdit(false);
        return;
      }
      this.apis.showConfirm('Discard Changes?', 'Your changes will be lost. Do you want to go back?', 'Yes', 'Cancel')
        .then(r => { if (r.isConfirmed) this.exitEdit(false); });
      return;
    }

    this.view = 'dealers';
    this.selectedDealer = null;
    this.selectedGroup = '';
    this.draft = this.readDraft();
  }

  backToGroups(): void {
    this.view = 'groups';
    this.selectedGroup = '';
    this.groupItems = [];
    this.refreshGroupStatus();
  }

  // ===================== ITEM HELPERS =====================

  isInputType(item: any): boolean {
    return Number(item?.isInput) === 1;
  }

  isPrefilled(item: any): boolean {
    if (this.editMode) return false;   // NSH sab edit kar sakta hai
    const v = item?.filledValue;
    return v !== null && v !== undefined && String(v).trim() !== '';
  }

  private getFilledValue(item: any): string {
    return String(item?.filledValue).trim();
  }

  getMinPhoto(item: any): number {
    return Number(item?.minPhoto) || 0;
  }

  getMaxPhoto(item: any): number {
    const max = Number(item?.maxPhoto) || 0;
    const min = this.getMinPhoto(item);
    return max > 0 ? max : min;
  }

  getRequiredPhoto(item: any, answer: string | null | undefined): number {
    const min = this.getMinPhoto(item);
    if (min === 0) return 0;
    if (this.isZeroScore(answer)) return 0;
    return this.isInputType(item) || String(answer) === '1' ? min : 0;
  }

  getItemAnswer(item: any): string | null {
    if (this.isPrefilled(item)) return this.getFilledValue(item);
    return this.draft?.points[String(item?.id)]?.score ?? null;
  }

  getPoint(item: any): DraftPoint | null {
    const saved = this.draft?.points[String(item?.id)] || null;

    if (this.isPrefilled(item)) {
      const filled = this.getFilledValue(item);
      if (saved) return { ...saved, score: filled };
      if (this.getRequiredPhoto(item, filled) === 0) {
        return { groupName: item.groupName, score: filled, images: [] };
      }
      return null;
    }
    return saved;
  }

  getSavedRequiredPhoto(item: any): number {
    return this.getRequiredPhoto(item, this.getItemAnswer(item));
  }

  isPendingYes(item: any): boolean {
    return !this.isPrefilled(item) && !this.isInputType(item) && this.getMinPhoto(item) > 0 && !this.getPoint(item);
  }

  getAnswerLabel(item: any): string {
    const ans = this.getItemAnswer(item);
    if (ans === null || ans === undefined || ans === '') return '-';
    if (this.isInputType(item)) {
      return `${ans}${item.units ? ' ' + item.units : ''}`;
    }
    return String(ans) === '1' ? 'Yes' : 'No';
  }

  isItemChanged(item: any): boolean {
    if (!this.editMode) return false;
    const p = this.getPoint(item);
    return !!p && this.isPointChanged(String(item.id), p);
  }

  // ===================== MODAL =====================

  openScoreModal(item: any): void {
    const point = this.getPoint(item);
    this.modalItem = item;
    this.tempAnswer = this.isPrefilled(item)
      ? this.getFilledValue(item)
      : (point ? String(point.score) : null);

    const max = this.getMinPhoto(item) > 0 ? this.getMaxPhoto(item) : 0;
    this.tempSlots = Array.from({ length: max }, (_, i) => ({
      preview: point?.images?.[i] || null,
      serverUrl: point?.images?.[i] || null,
      uploading: false
    }));

    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.revokeTempPreviews();
    this.showModal = false;
    this.modalItem = null;
    this.tempAnswer = null;
    this.tempSlots = [];
    this.activeSlotIndex = -1;
    document.body.style.overflow = 'auto';
  }

  private revokeTempPreviews(): void {
    this.tempSlots.forEach(s => {
      if (s.preview?.startsWith('blob:')) URL.revokeObjectURL(s.preview);
    });
  }

  onAnswerInput(event: Event): void {
    if (this.isPrefilled(this.modalItem)) return;
    const el = event.target as HTMLInputElement;
    const value = el.value.replace(/[^0-9.]/g, '').slice(0, 7);
    el.value = value;
    this.tempAnswer = value;
  }

  selectYesNo(value: string): void {
    if (this.isPrefilled(this.modalItem)) return;
    this.tempAnswer = value;
  }

  get modalRequiredPhoto(): number {
    return this.modalItem ? this.getRequiredPhoto(this.modalItem, this.tempAnswer) : 0;
  }

  get isModalPhotoEnabled(): boolean {
    return this.modalRequiredPhoto > 0;
  }

  get uploadedCount(): number {
    return this.tempSlots.filter(s => !!s.serverUrl).length;
  }

  get anySlotUploading(): boolean {
    return this.tempSlots.some(s => s.uploading);
  }

  isAnswered(): boolean {
    if (!this.modalItem || this.tempAnswer === null || this.tempAnswer === undefined) return false;
    return this.isInputType(this.modalItem) ? String(this.tempAnswer).trim().length > 0 : true;
  }

  canMarkDone(): boolean {
    if (!this.modalItem) return false;
    const required = this.modalRequiredPhoto;
    const photoOk = required === 0 || this.uploadedCount >= required;
    return this.isAnswered() && photoOk && !this.anySlotUploading;
  }

  // ===================== PHOTO =====================

  pickPhoto(slotIndex: number, input: HTMLInputElement): void {
    if (this.tempSlots[slotIndex]?.uploading) return;
    this.activeSlotIndex = slotIndex;
    input.value = '';
    input.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const idx = this.activeSlotIndex;
    if (!file || idx < 0 || !this.modalItem) return;

    if (!file.type.startsWith('image/')) {
      this.apis.showAlert('warning', 'Invalid File', 'Only image files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.apis.showAlert('warning', 'File Too Large', 'Image size should be less than 5 MB.');
      return;
    }

    const slot = this.tempSlots[idx];
    if (slot.preview?.startsWith('blob:')) URL.revokeObjectURL(slot.preview);
    slot.preview = URL.createObjectURL(file);
    slot.serverUrl = null;
    slot.uploading = true;

    const itemId = this.modalItem.id;
    const fileName = `ITEM_${itemId}_slot${idx}`;
    const formData = new FormData();
    formData.append('file', file, `${fileName}.jpg`);

    this.apis.uploadItemScoreImage(formData, fileName).subscribe({
      next: (res: any) => {
        const url = this.extractUploadUrl(res);
        slot.uploading = false;
        if (url) {
          slot.serverUrl = url;
        } else {
          this.resetSlot(slot);
          this.apis.showAlert('error', 'Upload Failed', 'Could not upload photo. Please try again.');
        }
      },
      error: () => {
        slot.uploading = false;
        this.resetSlot(slot);
        this.apis.showAlert('error', 'Upload Failed', 'Could not upload photo. Please try again.');
      }
    });
  }

  private extractUploadUrl(res: any): string | null {
    let data: any = res;
    if (typeof res === 'string') {
      try { data = JSON.parse(res); } catch { return res.trim() || null; }
    }
    if (typeof data === 'string') return data || null;
    return data?.url || data?.filePath || data?.data || null;
  }

  private resetSlot(slot: ItemScorePhotoSlot): void {
    if (slot.preview?.startsWith('blob:')) URL.revokeObjectURL(slot.preview);
    slot.preview = null;
    slot.serverUrl = null;
  }

  removePhoto(slotIndex: number): void {
    const slot = this.tempSlots[slotIndex];
    if (!slot || slot.uploading) return;
    this.resetSlot(slot);
  }

  // ===================== DONE (save to draft) =====================

  onDone(): void {
    if (!this.canMarkDone() || !this.draft) return;

    const images = this.isModalPhotoEnabled
      ? this.tempSlots.map(s => s.serverUrl).filter((u): u is string => !!u)
      : [];

    const score = this.isPrefilled(this.modalItem)
      ? this.getFilledValue(this.modalItem)
      : this.isInputType(this.modalItem)
        ? String(this.tempAnswer).trim()
        : String(this.tempAnswer);

    this.draft.points[String(this.modalItem.id)] = {
      groupName: this.modalItem.groupName || this.selectedGroup,
      score,
      images
    };
    this.writeDraft();
    this.refreshGroupStatus();
    this.closeModal();
  }

  // ===================== FINAL SUBMIT =====================

  private getAllEntries(): [string, DraftPoint][] {
    return this.allItems
      .map(item => [String(item.id), this.getPoint(item)] as [string, DraftPoint | null])
      .filter((e): e is [string, DraftPoint] => !!e[1]);
  }

  submitAll(): void {
    if (!this.draft || !this.allGroupsComplete || this.submitting) return;

    if (this.editMode) {
      this.submitEdit();
      return;
    }

    const entries = this.getAllEntries();

    if (entries.length === 0) {
      this.apis.showAlert('warning', 'Warning!', 'No scores found to submit.');
      return;
    }

    const payload = {
      dealerCode: this.draft.dealerCode,
      date: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace(' ', 'T'),
      CateType: this.catType,
      points: entries.map(([pointId, p]) => ({
        pointId,
        groupName: p.groupName,
        score: p.score
      })),
      pointImages: entries.flatMap(([pointId, p]) =>
        p.images.map(imageUrl => ({ pointId, image: imageUrl }))
      )
    };

    this.apis.showConfirm('Submit Score?', `Submit final score for ${this.draft.dealerCode}?`, 'Submit', 'Cancel')
      .then(result => {
        if (!result.isConfirmed) return;

        this.submitting = true;
        this.apis.insertReimbursementScore(payload).subscribe({
          next: (res: any) => {
            this.submitting = false;
            if (this.isOk(res)) {
              this.clearDraft();
              this.apis.showAlert('success', 'Success', 'Score submitted successfully.')
                .then(() => {
                  this.loadDealers();
                  this.backToDealers();
                });
            } else {
              this.apis.showAlert('error', 'Submit Failed', res?.message || 'Could not submit score.');
            }
          },
          error: () => {
            this.submitting = false;
            this.apis.showAlert('error', 'Submit Failed', 'Could not submit score.');
          }
        });
      });
  }

  private isZeroScore(answer: string | null | undefined): boolean {
    if (answer === null || answer === undefined) return false;
    const s = String(answer).trim();
    if (s === '' || s === '.') return false;
    const n = Number(s);
    return !isNaN(n) && n === 0;
  }

  // ===================== APPROVAL LIST =====================

  private initYearAndHalf(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    this.yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
    this.selectedYear = currentYear;
    this.selectedHalfYear = now.getMonth() >= 3 && now.getMonth() <= 8 ? 1 : 2;
  }

  get halfYearLabel(): string {
    return this.halfYearOptions.find(h => h.value === this.selectedHalfYear)?.label ?? '';
  }

  get pagedRows(): ItemScoreReportRow[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.approvalRows.slice(start, start + this.itemsPerPage);
  }

  get approvalColspan(): number {
    return this.scoreColumns.length + 9 + (this.canTakeAction ? 1 : 0);
  }

  private parseScoreKey(key: string): ItemScoreColumn {
    const idx = key.lastIndexOf('-');
    const maxPart = idx > -1 ? Number(key.substring(idx + 1)) : NaN;
    return {
      key,
      label: idx > -1 && !isNaN(maxPart) ? key.substring(0, idx) : key,
      max: isNaN(maxPart) ? 0 : maxPart
    };
  }

  private buildScoreColumns(rows: ItemScoreReportRow[]): void {
    if (!rows.length) {
      this.scoreColumns = [];
      this.maxTotal = 0;
      return;
    }
    this.scoreColumns = Object.keys(rows[0])
      .filter(k => !this.FIXED_KEYS.includes(k))
      .map(k => this.parseScoreKey(k));
    this.maxTotal = Number(rows[0].MaxScore) || 0;
  }

  scoreValue(row: ItemScoreReportRow, key: string): number {
    const n = Number(row[key]);
    return isNaN(n) ? 0 : n;
  }

  getMaxScore(row: ItemScoreReportRow): number {
    return Number(row.MaxScore) || 0;
  }

  getTotal(row: ItemScoreReportRow): number {
    return Number(row.TotalGetScore) || 0;
  }

  getPercent(row: ItemScoreReportRow): number {
    const p = Number(row.Percentage);
    return isNaN(p) ? 0 : Math.round(p * 100) / 100;
  }

  percentClass(row: ItemScoreReportRow): string {
    const p = this.getPercent(row);
    if (p >= 75) return 'pct-good';
    if (p >= 40) return 'pct-mid';
    return 'pct-low';
  }

  getRowId(row: any): string | null {
    const id = row?.ItemScoreId;
    return id !== null && id !== undefined && String(id).trim() !== '' ? String(id) : null;
  }

  // Abhi report wali API hi use ho rahi hai
  fetchApprovalList(): void {
    const reqId = ++this.approvalReqId;
    this.approvalLoading = true;
    this.approvalRows = [];
    this.currentPage = 1;

    this.apis.getItemScorePendingReport()
      .pipe(timeout(this.TIMEOUT_MS))
      .subscribe({
        next: (res: any) => {
          if (reqId !== this.approvalReqId) return;
          const rows: ItemScoreReportRow[] = Array.isArray(res?.data) ? res.data : [];
          this.buildScoreColumns(rows);
          this.approvalRows = rows;
          this.approvalLoading = false;
        },
        error: (err) => {
          if (reqId !== this.approvalReqId) return;
          this.approvalLoading = false;
          this.approvalRows = [];
          this.scoreColumns = [];
          this.apis.showAlert('error', 'Error!',
            err?.name === 'TimeoutError'
              ? 'Loading is taking too long. Please check your connection and try again.'
              : (err?.error?.message || 'Failed to fetch approval list.'));
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // ===================== APPROVE / REJECT (single modal) =====================

  get isApproveAction(): boolean {
    return this.actionType === 'Approved';
  }

  get isRemarkRequired(): boolean {
    return !this.isApproveAction;   // Reject pe remark mandatory
  }

  get remarkLength(): number {
    return (this.actionRemark || '').length;
  }

  get showRemarkError(): boolean {
    return this.actionRemarkTouched && this.isRemarkRequired && !(this.actionRemark || '').trim();
  }

  get canSubmitAction(): boolean {
    if (!this.actionRow || this.actionSubmitting) return false;
    if (this.isRemarkRequired && !(this.actionRemark || '').trim()) return false;
    return true;
  }

  // Table ke Approve / Reject button se yahi call hota hai
  onApprovalAction(row: ItemScoreReportRow, action: ApprovalAction): void {
    if (!this.canTakeAction) return;
    if (!this.getRowId(row)) {
      this.apis.showAlert('error', 'Error!', 'Item score id not found.');
      return;
    }

    this.actionRow = row;
    this.actionType = action;
    this.actionRemark = '';
    this.actionRemarkTouched = false;
    this.actionSubmitting = false;
    this.showActionModal = true;
    document.body.style.overflow = 'hidden';
  }

  setActionType(action: ApprovalAction): void {
    if (this.actionSubmitting || this.actionType === action) return;
    this.actionType = action;
    this.actionRemarkTouched = false;
  }

  closeActionModal(force: boolean = false): void {
    if (this.actionSubmitting && !force) return;
    this.showActionModal = false;
    this.actionRow = null;
    this.actionType = 'Approved';
    this.actionRemark = '';
    this.actionRemarkTouched = false;
    this.actionSubmitting = false;
    document.body.style.overflow = 'auto';
  }

  submitAction(): void {
    if (!this.actionRow || this.actionSubmitting) return;

    this.actionRemarkTouched = true;
    if (!this.canSubmitAction) return;

    const row = this.actionRow;
    const id = this.getRowId(row);
    if (!id) {
      this.apis.showAlert('error', 'Error!', 'Item score id not found.');
      return;
    }

    const isApprove = this.isApproveAction;
    const dealerText = `${row.DealerName || ''} (${row.DealerCode || '-'})`.trim();

    const payload = {
      approvalId: id,
      status: isApprove ? 1 : -1,          // Approve = 1, Reject = -1
      remark: (this.actionRemark || '').trim()
    };

    this.actionSubmitting = true;
    this.actionLoadingId = id;

    this.apis.approveReimbursementScore(payload)
      .pipe(timeout(this.TIMEOUT_MS))
      .subscribe({
        next: (res: any) => {
          this.actionSubmitting = false;
          this.actionLoadingId = null;

          if (this.isOk(res)) {
            this.closeActionModal(true);
            this.apis.showAlert(
              'success',
              isApprove ? 'Approved Successfully' : 'Rejected Successfully',
              isApprove
                ? `Item score for ${dealerText} has been approved.`
                : `Item score for ${dealerText} has been rejected.`
            ).then(() => this.fetchApprovalList());
          } else {
            this.apis.showAlert('error', 'Action Failed',
              res?.message || `Could not ${isApprove ? 'approve' : 'reject'} the item score. Please try again.`);
          }
        },
        error: (err) => {
          this.actionSubmitting = false;
          this.actionLoadingId = null;
          this.apis.showAlert('error', 'Action Failed',
            err?.name === 'TimeoutError'
              ? 'Request is taking too long. Please check your connection and try again.'
              : (err?.error?.message || `Could not ${isApprove ? 'approve' : 'reject'} the item score. Please try again.`));
        }
      });
  }

  // ===================== EDIT (NSH) =====================

  onEditClick(row: ItemScoreReportRow): void {
    if (!this.canTakeAction) return;
    const id = this.getRowId(row);
    if (!id) {
      this.apis.showAlert('error', 'Error!', 'Item score id not found.');
      return;
    }

    this.actionLoadingId = id;
    this.apis.getItemScoreById(id).subscribe({
      next: (res: any) => {
        this.actionLoadingId = null;
        const list = res?.data?.report ?? res?.data?.Report;
        const rows = Array.isArray(list) ? list : [];

        if (!this.isOk(res)) {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to fetch item score details.');
          return;
        }
        if (!rows.length) {
          this.apis.showAlert('warning', 'No Data', 'No item score data found.');
          return;
        }
        this.startEdit(id, row, rows);
      },
      error: () => {
        this.actionLoadingId = null;
        this.apis.showAlert('error', 'Error!', 'Failed to fetch item score details.');
      }
    });
  }

  private startEdit(id: string, row: ItemScoreReportRow, rawRows: any[]): void {
    const rows = rawRows.map(r => ({
      ...r,
      id: r.Id ?? r.id,                          // detail Id
      dealerCode: r.DealerCode ?? r.dealerCode
    }));

    this.editMode = true;
    this.editItemScoreId = id;

    const dealerCode = row.DealerCode ?? rows[0]?.dealerCode;
    const dealerName = row.DealerName ?? rows[0]?.dealerName;
    this.selectedDealer = { DealerCode: dealerCode, DealerName: dealerName };

    this.allItems = rows;
    this.catType = rows[0]?.catType ?? row['CateType'] ?? null;
    this.groupNames = [...new Set(rows.map(x => x.groupName).filter(Boolean))] as string[];

    const points: { [id: string]: DraftPoint } = {};
    this.originalPoints = {};

    rows.forEach(r => {
      if (r.score === null || r.score === undefined || String(r.score).trim() === '') return;
      const pid = String(r.id);
      const score = this.normalizeScore(r, r.score);
      const images = this.parseImages(r.images);
      points[pid] = { groupName: r.groupName, score, images };
      this.originalPoints[pid] = { score, images: [...images] };
    });

    this.draft = { dealerCode, dealerName, points };
    this.selectedGroup = '';
    this.groupItems = [];
    this.view = 'groups';
    this.refreshGroupStatus();
  }

  private parseImages(val: any): string[] {
    if (Array.isArray(val)) {
      return val.map(x => typeof x === 'string' ? x : (x?.image || x?.imageUrl)).filter(Boolean);
    }
    if (typeof val === 'string' && val.trim()) {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  private isPointChanged(pointId: string, p: DraftPoint): boolean {
    const o = this.originalPoints[pointId];
    if (!o) return true;
    const sameScore = String(o.score).trim() === String(p.score).trim();
    const sameImages = [...o.images].sort().join('|') === [...(p.images || [])].sort().join('|');
    return !(sameScore && sameImages);
  }

  private hasEditChanges(): boolean {
    return this.getAllEntries().some(([id, p]) => this.isPointChanged(id, p));
  }

  private submitEdit(): void {
    const entries = this.getAllEntries();
    const changedIds = new Set(entries.filter(([id, p]) => this.isPointChanged(id, p)).map(([id]) => id));

    if (changedIds.size === 0) {
      this.apis.showAlert('info', 'No Changes', 'You have not changed any item score.');
      return;
    }

    const payload = {
      itemScoreId: this.editItemScoreId,
      dealerCode: this.draft!.dealerCode,
      date: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace(' ', 'T'),
      CateType: this.catType,
      points: entries.map(([pointId, p]) => ({
        pointId,
        groupName: p.groupName,
        score: p.score,
        status: changedIds.has(pointId) ? 'Changed' : 'Unchanged'
      })),
      // Sabhi points ki images (purani + nayi), kyunki SP har aaye point ki images delete karke wapas insert karta hai
      pointImages: entries.flatMap(([pointId, p]) =>
        (p.images || []).map(imageUrl => ({ pointId, image: imageUrl }))
      )
    };

    this.apis.showConfirm('Update Score?',
      `${changedIds.size} item(s) changed for ${this.draft!.dealerCode}. Update score?`, 'Update', 'Cancel')
      .then(result => {
        if (!result.isConfirmed) return;

        this.submitting = true;
        this.apis.updateItemScore(payload).subscribe({
          next: (res: any) => {
            this.submitting = false;
            if (this.isOk(res)) {
              this.apis.showAlert('success', 'Success', 'Score updated successfully.')
                .then(() => this.exitEdit(true));
            } else {
              this.apis.showAlert('error', 'Update Failed', res?.message || 'Could not update score.');
            }
          },
          error: () => {
            this.submitting = false;
            this.apis.showAlert('error', 'Update Failed', 'Could not update score.');
          }
        });
      });
  }

  private exitEdit(reload: boolean): void {
    this.editMode = false;
    this.editItemScoreId = null;
    this.originalPoints = {};
    this.allItems = [];
    this.groupNames = [];
    this.groupStatusMap = {};
    this.selectedDealer = null;
    this.selectedGroup = '';
    this.groupItems = [];
    this.catType = null;
    this.draft = this.readDraft();
    this.mode = 'approval';
    this.view = 'dealers';
    if (reload) this.fetchApprovalList();
  }

  private normalizeScore(item: any, score: any): string {
    const n = Number(score);
    if (isNaN(n)) return String(score).trim();

    // Yes/No → '1' / '0'
    if (!this.isInputType(item)) return n >= 1 ? '1' : '0';

    // Input → "5.00" -> "5", "12.50" -> "12.5"
    return String(n);
  }
}