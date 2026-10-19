import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { DraftPoint, ItemScoreDraft, ItemScorePhotoSlot, GroupStatus } from '../../../model/apiresponse';

const DRAFT_KEY = 'itemScoreDraft';

@Component({
  selector: 'app-item-score',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-score.component.html',
  styleUrl: './item-score.component.css'
})
export class ItemScoreComponent implements OnInit, OnDestroy {

  view: 'dealers' | 'groups' | 'items' = 'dealers';

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
  tempAnswer: string | null = null;   // isInput=1 → typed value, isInput=0 → '1' (Yes) / '0' (No)
  tempSlots: ItemScorePhotoSlot[] = [];
  activeSlotIndex: number = -1;

  yesNoOptions = [
    { label: 'Yes', value: '1' },
    { label: 'No', value: '0' }
  ];

  submitting: boolean = false;

  constructor(private apis: AuthService) { }

  ngOnInit(): void {
    this.draft = this.readDraft();
    this.loadDealers();
  }

  ngOnDestroy(): void {
    this.revokeTempPreviews();
    document.body.style.overflow = 'auto';
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

  // Input wale item me hamesha, Yes/No wale me sirf Yes ('1') par photo required
  getRequiredPhoto(item: any, answer: string | null | undefined): number {
    const min = this.getMinPhoto(item);
    if (min === 0) return 0;
    return this.isInputType(item) || String(answer) === '1' ? min : 0;
  }

  // Row ka answer: prefilled ho to API ki value, warna draft ki
  getItemAnswer(item: any): string | null {
    if (this.isPrefilled(item)) return this.getFilledValue(item);
    return this.draft?.points[String(item?.id)]?.score ?? null;
  }

  getPoint(item: any): DraftPoint | null {
    const saved = this.draft?.points[String(item?.id)] || null;

    if (this.isPrefilled(item)) {
      const filled = this.getFilledValue(item);
      if (saved) return { ...saved, score: filled };
      // Photo required nahi hai to seedha done, warna photo lagne tak pending
      if (this.getRequiredPhoto(item, filled) === 0) {
        return { groupName: item.groupName, score: filled, images: [] };
      }
      return null;
    }
    return saved;
  }

  // List view helpers
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

  // ===================== MODAL =====================

  openScoreModal(item: any): void {
    const point = this.getPoint(item);
    this.modalItem = item;
    this.tempAnswer = this.isPrefilled(item)
      ? this.getFilledValue(item)
      : (point ? String(point.score) : null);

    // Slots hamesha bana do (minPhoto > 0 ho to) — Yes/No me 'Yes' select hote hi dikh jayenge
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

  // isInput = 1 → sirf number aur '.', max 7 char
  onAnswerInput(event: Event): void {
    if (this.isPrefilled(this.modalItem)) return;
    const el = event.target as HTMLInputElement;
    const value = el.value.replace(/[^0-9.]/g, '').slice(0, 7);
    el.value = value;
    this.tempAnswer = value;
  }

  // isInput = 0 → '1' / '0'
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

    // Photo section hidden ho (Yes/No me 'No') to koi photo save nahi hogi
    const images = this.isModalPhotoEnabled
      ? this.tempSlots.map(s => s.serverUrl).filter((u): u is string => !!u)
      : [];

    const score = this.isPrefilled(this.modalItem)
      ? this.getFilledValue(this.modalItem)
      : this.isInputType(this.modalItem)
        ? String(this.tempAnswer).trim()
        : String(this.tempAnswer);

    this.draft.points[String(this.modalItem.id)] = {
      groupName: this.selectedGroup,
      score,
      images
    };
    this.writeDraft();
    this.refreshGroupStatus();
    this.closeModal();
  }

  // ===================== FINAL SUBMIT =====================

  submitAll(): void {
    if (!this.draft || !this.allGroupsComplete || this.submitting) return;

    // Draft + prefilled dono items (getPoint se)
    const entries: [string, DraftPoint][] = this.allItems
      .map(item => [String(item.id), this.getPoint(item)] as [string, DraftPoint | null])
      .filter((e): e is [string, DraftPoint] => !!e[1]);

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
}
