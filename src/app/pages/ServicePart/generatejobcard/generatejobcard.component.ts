import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MissingPartRow, ComplaintRow, SubletPartRow, LocalPartRow, PartRow } from '../../../model/apiresponse';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

interface LabourPartRow {
  id: string;
  description: string;
  cost: string;
  saved: boolean;
  errors?: Record<string, string>;
}

@Component({
  selector: 'app-generatejobcard',
  imports: [CommonModule, FormsModule],
  templateUrl: './generatejobcard.component.html',
  styleUrl: './generatejobcard.component.css'
})
export class GeneratejobcardComponent {

  jobCardTypes = ['Free Service', 'Paid Service', 'Warranty Job Card', 'Post Warranty Job Card', 'Accidental Job card', 'PDI job card'];
  fuelTypes = ['Full', 'Half', 'Low'];
  fuelDropdownOpen = false;
  gstOptions = ['5%', '12%', '18%'];
  serviceColumns = ['Installation', 'PDI', '1', '2', '3', '4', '5', '6'];

  // ═══════════════════════════════════════════════════════════════
  // ── PAYLOAD DATATYPE MAPPING ──
  // ═══════════════════════════════════════════════════════════════
  payloadFieldTypes: Record<string, string> = {
    'fuel': 'decimal',
    'frontTyrePressureLeft': 'decimal',
    'frontTyrePressureRight': 'decimal',
    'rearTyrePressureLeft': 'decimal',
    'rearTyrePressureRight': 'decimal',
    'hours': 'decimal',
    'timeEstimate': 'decimal',
    'timeActual': 'decimal',
    'costEstimate': 'decimal',
    'costActual': 'decimal',
    'totalAmountPaid': 'decimal',
    'mobileNo': 'phone',
    'alternateMobileNo': 'phone',
    'workDoneBy': 'alphanumeric',
    'workshopManagerName': 'alphanumeric',
    'customerAckName': 'alphanumeric',
    'dealerName': 'string',
    'customerName': 'string',
    'customerAddress': 'string',
    'model': 'string',
    'tractorSlNo': 'string',
    'regnNo': 'string',
    'dateOfSale': 'date',
  };

  // ═══════════════════════════════════════════════════════════════
  // ── FIELD-LEVEL ERROR TRACKING ──
  // ═══════════════════════════════════════════════════════════════

  fieldErrors: Record<string, string> = {};

  fieldCharRules: Record<string, { pattern: RegExp; message: string; exactLength?: number }> = {
    fuel: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    alternateMobileNo: { pattern: /^[0-9]*$/, message: 'Only numeric digits allowed (0-9)', exactLength: 10 },
    frontTyrePressureLeft: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    frontTyrePressureRight: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    rearTyrePressureLeft: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    rearTyrePressureRight: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    hours: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    timeEstimate: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    timeActual: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    costEstimate: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    costActual: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    totalAmountPaid: { pattern: /^[0-9]*\.?[0-9]*$/, message: 'Only numbers and single decimal point allowed (0-9.)' },
    workDoneBy: { pattern: /^[a-zA-Z0-9\s\-]*$/, message: 'Only letters, numbers, spaces and hyphens allowed' },
    workshopManagerName: { pattern: /^[a-zA-Z0-9\s\-]*$/, message: 'Only letters, numbers, spaces and hyphens allowed' },
    customerAckName: { pattern: /^[a-zA-Z0-9\s\-]*$/, message: 'Only letters, numbers, spaces and hyphens allowed' },
    jobCardType: { pattern: /^.+$/, message: 'Job Card Type is required' },
    dateTime: { pattern: /^\d{4}-\d{2}-\d{2}$/, message: 'Please select a valid date' },
  };

  validateAndFilter(field: string, rawValue: string, filterFn: (v: string) => string): string {
    const rule = this.fieldCharRules[field];
    const filtered = filterFn(rawValue || '');

    if (!rule) return filtered;

    const typedInvalidChar = !!rawValue && !rule.pattern.test(rawValue);

    if (typedInvalidChar) {
      this.fieldErrors[field] = rule.message;
    } else if (rule.exactLength && filtered.length > 0 && filtered.length < rule.exactLength) {
      this.fieldErrors[field] = `${rule.exactLength} digit ka number hona chahiye (abhi ${filtered.length} hai)`;
    } else {
      delete this.fieldErrors[field];
    }

    return filtered;
  }

  hasFieldError(field: string): boolean {
    return !!this.fieldErrors[field];
  }

  getFieldError(field: string): string {
    return this.fieldErrors[field] || '';
  }

  get hasAnyFieldError(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // ── ROW-LEVEL VALIDATION ──
  // ═══════════════════════════════════════════════════════════════

  validateRowField(
    row: any,
    field: string,
    rawValue: string,
    filterFn: (v: string) => string,
    pattern: RegExp,
    message: string
  ): string {
    if (!row.errors) row.errors = {};
    const filtered = filterFn(rawValue || '');
    const typedInvalidChar = !!rawValue && !pattern.test(rawValue);

    if (typedInvalidChar) {
      row.errors[field] = message;
    } else {
      delete row.errors[field];
    }
    return filtered;
  }

  hasRowFieldError(row: any, field: string): boolean {
    return !!(row?.errors && row.errors[field]);
  }

  getRowFieldError(row: any, field: string): string {
    return row?.errors?.[field] || '';
  }

  get hasAnyRowError(): boolean {
    const allRows: any[] = [...this.sparePartsRows, ...this.localPartsRows, ...this.subletPartsRows];
    return allRows.some(r => r.errors && Object.keys(r.errors).length > 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // ── SEARCH MODE STATE ──
  // ═══════════════════════════════════════════════════════════════
  mode: 'search' | 'form' = 'search';

  searchBy: string = 'Chassis';
  searchQuery: string = '';
  searchResults: any[] = [];
  searchLoading = false;
  searchPageNo = 1;
  dataFound: boolean = false;

  // ── Readonly / prefilled item details ──
  item: any = {};
  jobCardNo = '';
  dateTime: string = new Date().toISOString().split('T')[0];
  dealerName = '';
  customerName = '';
  customerAddress = '';
  model = '';
  tractorSlNo = '';
  regnNo = '';
  dateOfSale = '';
  historyCardNo = '';

  openJobListTag: boolean = false;

  // ── Service record ──
  serviceRecord: { date: Record<string, string>; hmr: Record<string, string> } = { date: {}, hmr: {} };
  serviceRecordLoading = true;

  // ── Form fields ──
  jobCardType = '';
  fuel = '';
  workDoneBy = '';
  mobileNo = '';
  alternateMobileNo = '';
  frontTyrePressureLeft = '';
  frontTyrePressureRight = '';
  rearTyrePressureLeft = '';
  rearTyrePressureRight = '';
  hours = '';
  timeEstimate = '';
  timeActual = '';
  costEstimate = '';
  costActual = ''; // ← Will be auto-calculated from grand total
  totalAmountPaid = '';
  workshopManagerName = '';
  customerAckName = '';

  // ── Labour Cost (Simple field - NOT REQUIRED) ──
  labourCost: string = '';

  // ── Dropdown open states ──
  jobCardTypeDropdownOpen = false;

  // ── Catalog / loading / submit state ──
  partsCatalog: any[] = [];
  partsCatalogLoading = true;
  confirmVisible = false;
  submitting = false;

  // ═══════════════════════════════════════════════════════════════
  // ── DYNAMIC ROWS (NO MORE "SAVED" STATE) ──
  // ═══════════════════════════════════════════════════════════════
  complaintRows: ComplaintRow[] = [this.emptyComplaintRow('1')];
  missingPartsRows: MissingPartRow[] = [{ id: '1', value: '' }];
  sparePartsRows: PartRow[] = [this.emptyPartRow()];
  localPartsRows: LocalPartRow[] = [this.emptyLocalPartRow()];
  subletPartsRows: SubletPartRow[] = [this.emptySubletPartRow()];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobCardService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const navItem = nav?.extras?.state?.['item'] || history.state?.item;

    if (navItem?.Id) {
      this.item = navItem;
      this.resetAllFormData();
      this.populateFormFromItem();
      this.loadPartsCatalog();
      this.loadServiceTimeline();
      this.mode = 'form';
    } else {
      this.mode = 'search';
    }
    this.OpenJobCardList();
  }

  // ═══════════════════════════════════════════════════════════════
  // ── SEARCH MODE METHODS ──
  // ═══════════════════════════════════════════════════════════════

  searchJobCardEligible() {
    if (!this.searchQuery.trim()) {
      this.toastr.warning(
        `Please enter ${this.searchBy === 'ChassisNo' ? 'Chassis No.' : 'Mobile No.'}`,
        'Empty Search'
      );
      return;
    }

    this.openJobListTag = false;
    this.searchLoading = true;
    const mappedSearchBy = this.searchBy === 'Chassis' ? 'Chassis' : 'Mobile';
    this.dataFound = true;

    this.jobCardService.getJobCardEligibleChassis(this.searchPageNo, this.searchQuery, mappedSearchBy).subscribe({
      next: (res: any) => {
        this.searchResults = res?.data || [];
        this.searchLoading = false;

        if (this.searchResults.length === 0) {
          this.toastr.info(
            'No eligible job cards found for the given search.',
            'No Results'
          );
        }
      },
      error: (err) => {
        this.searchLoading = false;
        this.toastr.error(
          'Failed to fetch search results. Please try again.',
          'Search Error'
        );
        console.error('Search error:', err);
      },
    });
  }

  OpenJobCardList() {
    this.searchLoading = true;
    this.dataFound = true;
    this.openJobListTag = true;

    this.jobCardService.getOpenJobCardList(this.searchPageNo).subscribe({
      next: (res: any) => {
        this.searchResults = res?.data || [];
        this.searchLoading = false;

        if (this.searchResults.length === 0) {
          this.toastr.info(
            'No open job cards are available at the moment.',
          );
        }
      },
      error: (err) => {
        this.searchLoading = false;
        this.toastr.error(
          'Something went wrong while fetching open job cards. Please try again.',
          'Unable to Load Job Cards'
        );
        console.error('Error fetching open job cards:', err);
      },
    });
  }

  selectSearchResult(result: any) {
    this.resetAllFormData();
    this.item = result;
    this.populateFormFromItem();
    this.loadServiceTimeline();
    this.loadPartsCatalog();
    if (this.item.IsClosed === false)
      this.getJobCardMasterById();
    this.mode = 'form';
  }

  // ═══════════════════════════════════════════════════════════════
  // ── RESET ALL FORM DATA ──
  // ═══════════════════════════════════════════════════════════════

  resetAllFormData() {
    this.mode = 'search';
    this.searchQuery = '';
    this.searchResults = [];
    this.searchLoading = false;
    this.searchPageNo = 1;
    this.item = {};
    this.fieldErrors = {};

    this.jobCardNo = '';
    this.dateTime = new Date().toISOString().split('T')[0];
    this.dealerName = '';
    this.customerName = '';
    this.customerAddress = '';
    this.model = '';
    this.tractorSlNo = '';
    this.regnNo = '';
    this.dateOfSale = '';
    this.mobileNo = '';
    this.historyCardNo = '';
    this.workshopManagerName = '';

    this.jobCardType = '';
    this.fuel = '';
    this.workDoneBy = '';
    this.alternateMobileNo = '';

    this.frontTyrePressureLeft = '';
    this.frontTyrePressureRight = '';
    this.rearTyrePressureLeft = '';
    this.rearTyrePressureRight = '';

    this.hours = '';
    this.timeEstimate = '';
    this.timeActual = '';
    this.costEstimate = '';
    this.costActual = '';
    this.totalAmountPaid = '';
    this.labourCost = '';

    this.complaintRows = [{ id: this.generateId(), complaint: '', actionTaken: '', remark: '' }];
    this.missingPartsRows = [{ id: this.generateId(), value: '' }];

    this.sparePartsRows = [{
      id: this.generateId(),
      query: '',
      results: [],
      selected: null,
      qty: '',
      remark: '',
      saved: false,
      errors: {}
    }];

    this.localPartsRows = [{
      id: this.generateId(),
      partName: '',
      partNumber: '',
      qty: '',
      price: '',
      gst: '',
      remark: '',
      saved: false,
      errors: {}
    }];

    this.subletPartsRows = [this.emptySubletPartRow()];

    this.serviceRecordLoading = false;
    this.serviceRecord = { date: {}, hmr: {} };

    this.submitting = false;
    this.confirmVisible = false;
    this.jobCardTypeDropdownOpen = false;
    this.dataFound = false;
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).slice(2, 6);
  }

  backToSearch() {
    this.mode = 'search';
    this.searchQuery = '';
    this.searchResults = [];
    this.resetFormFields();
    this.OpenJobCardList();
  }

  resetFormFields() {
    this.dealerName = '';
    this.customerName = '';
    this.customerAddress = '';
    this.model = '';
    this.tractorSlNo = '';
    this.regnNo = '';
    this.dateOfSale = '';
    this.mobileNo = '';
    this.item = {};
  }

  populateFormFromItem() {
    this.dealerName = this.item?.DealerName || '';
    this.customerName = this.item?.CustomerName || '';
    this.customerAddress = this.item?.CustomerAddress || '';
    this.model = this.item?.Model || '';
    this.tractorSlNo = this.item?.ChassisNo || '';
    this.regnNo = this.item?.RegnNo || '';
    this.dateOfSale = this.item?.DateOfSale || '';
    this.historyCardNo = this.item?.HistoryCardNo || '';
    this.mobileNo = this.item?.MobileNo || '';
  }

  // ═══════════════════════════════════════════════════════════════
  // ── HELPERS: FORMATTING ──
  // ═══════════════════════════════════════════════════════════════

  safeDate(iso: string): Date {
    if (!iso) return new Date();
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  formatShortDate(iso: string): string {
    if (!iso) return '';
    const d = this.safeDate(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  }

  formatDateDMY(iso: string): string {
    return this.formatShortDate(iso);
  }

  formatDateTimeDisplay(iso: string): string {
    const d = this.safeDate(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ── HELPERS: INPUT FILTERS ──
  // ═══════════════════════════════════════════════════════════════

  filterInteger(text: string): string {
    return (text || '').replace(/[^0-9]/g, '');
  }

  filterDecimal(text: string): string {
    let cleaned = (text || '').replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    return cleaned;
  }

  filterPhoneNumber(text: string): string {
    return (text || '').replace(/[^0-9]/g, '').slice(0, 10);
  }

  filterAlphanumeric(text: string): string {
    return (text || '').replace(/[^a-zA-Z0-9\s\-]/g, '');
  }

  filterAlphanumericSpace(text: string): string {
    return (text || '').replace(/[^a-zA-Z0-9\s\-_.]/g, '');
  }

  applyFieldValidation(field: string, value: string): string {
    const fieldType = this.payloadFieldTypes[field] || 'string';

    switch (fieldType) {
      case 'decimal':
        return this.filterDecimal(value);
      case 'phone':
        return this.filterPhoneNumber(value);
      case 'alphanumeric':
        return this.filterAlphanumeric(value);
      case 'string':
        return value;
      case 'date':
        return value;
      default:
        return value;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ── INDIVIDUAL FIELD VALIDATION FUNCTIONS ──
  // ═══════════════════════════════════════════════════════════════

  validatePhone(value: string): string {
    return this.filterPhoneNumber(value);
  }

  onAlternateMobileNoChange(value: string) {
    this.alternateMobileNo = this.validateAndFilter('alternateMobileNo', value, v => this.filterPhoneNumber(v));
  }

  validateDecimal(value: string): string {
    return this.filterDecimal(value);
  }

  onFuelChange(value: string) {
    this.fuel = this.validateAndFilter('fuel', value, v => this.filterDecimal(v));
  }

  validateAlphanumeric(value: string): string {
    return this.filterAlphanumeric(value);
  }

  onWorkDoneByChange(value: string) {
    this.workDoneBy = this.validateAndFilter('workDoneBy', value, v => this.filterAlphanumeric(v));
  }

  onFrontTyrePressureLeftChange(value: string) {
    this.frontTyrePressureLeft = this.validateAndFilter('frontTyrePressureLeft', value, v => this.filterDecimal(v));
  }

  onFrontTyrePressureRightChange(value: string) {
    this.frontTyrePressureRight = this.validateAndFilter('frontTyrePressureRight', value, v => this.filterDecimal(v));
  }

  onRearTyrePressureLeftChange(value: string) {
    this.rearTyrePressureLeft = this.validateAndFilter('rearTyrePressureLeft', value, v => this.filterDecimal(v));
  }

  onRearTyrePressureRightChange(value: string) {
    this.rearTyrePressureRight = this.validateAndFilter('rearTyrePressureRight', value, v => this.filterDecimal(v));
  }

  onHoursChange(value: string) {
    this.hours = this.validateAndFilter('hours', value, v => this.filterDecimal(v));
  }

  onTimeEstimateChange(value: string) {
    this.timeEstimate = this.validateAndFilter('timeEstimate', value, v => this.filterDecimal(v));
  }

  onTimeActualChange(value: string) {
    this.timeActual = this.validateAndFilter('timeActual', value, v => this.filterDecimal(v));
  }

  onCostEstimateChange(value: string) {
    this.costEstimate = this.validateAndFilter('costEstimate', value, v => this.filterDecimal(v));
  }

  onLabourCostChange(value: string) {
    this.labourCost = this.validateAndFilter('fuel', value, v => this.filterDecimal(v));
  }

  // ═══════════════════════════════════════════════════════════════
  // ── API CALLS ──
  // ═══════════════════════════════════════════════════════════════

  loadPartsCatalog() {
    this.partsCatalogLoading = true;

    this.jobCardService.getSpareParts().subscribe({
      next: (res: any) => {
        const savedParts: any[] = res?.data ?? res ?? [];
        this.partsCatalog = savedParts.map(p => ({
          partNumber: p.material,
          partName: p.desc,
          basePrice: Number(p.mrp) || 0,
          hsnCode: p.hsnCode,
          gstRate: p.gstRate,
        }));
        this.partsCatalogLoading = false;
      },
      error: () => {
        this.partsCatalog = [];
        this.partsCatalogLoading = false;
      },
    });
  }

  loadServiceTimeline() {
    this.serviceRecord = {
      date: {},
      hmr: {}
    };
    const salesMasterId = this.item?.Id;
    if (!salesMasterId) {
      this.serviceRecordLoading = false;
      return;
    }
    this.serviceRecordLoading = true;
    this.jobCardService.getServiceTimeline(salesMasterId).subscribe({
      next: (res: any) => {
        this.serviceRecord = this.mapTimelineToServiceRecord(res?.data || []);
        this.serviceRecordLoading = false;
      },
      error: () => {
        this.serviceRecord = { date: {}, hmr: {} };
        this.serviceRecordLoading = false;
      },
    });
  }

  mapTimelineToServiceRecord(timeline: any[]) {
    const date: Record<string, string> = {};
    const hmr: Record<string, string> = {};
    (timeline || []).forEach((entry) => {
      const type = entry.Type;
      const srNo = entry.SrNo;
      const createdDate = entry.CreatedDate === '-' ? '' : entry.CreatedDate;
      const hours = entry.Hours === '-' ? '' : entry.Hours;
      if (type === 'Installation') {
        date['Installation'] = createdDate;
        hmr['Installation'] = hours;
      } else if (type === 'PDI') {
        if (!date['PDI'] && createdDate) {
          date['PDI'] = createdDate;
          hmr['PDI'] = hours;
        }
      } else if (type === 'Service') {
        date[srNo] = createdDate;
        hmr[srNo] = hours;
      }
    });
    return { date, hmr };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── COMPLAINT ROWS (NO SAVE BUTTON) ──
  // ═══════════════════════════════════════════════════════════════

  emptyComplaintRow(id: string): ComplaintRow {
    return { id, complaint: '', actionTaken: '', remark: '' };
  }

  hasComplaintData(): boolean {
    return this.complaintRows.some(r => r.complaint.trim() || r.actionTaken.trim() || r.remark.trim());
  }

  addComplaintRow() {
    this.complaintRows.push(this.emptyComplaintRow(Date.now().toString()));
  }

  removeComplaintRow(id: string) {
    if (this.complaintRows.length === 1) {
      this.toastr.warning('At least one complaint row must remain.', 'Cannot Remove');
      return;
    }
    this.complaintRows = this.complaintRows.filter((r) => r.id !== id);
  }

  // ═══════════════════════════════════════════════════════════════
  // ── MISSING PARTS ROWS (NO SAVE BUTTON) ──
  // ═══════════════════════════════════════════════════════════════

  hasMissingPartsData(): boolean {
    return this.missingPartsRows.some(r => r.value.trim());
  }

  addMissingPartRow() {
    this.missingPartsRows.push({ id: Date.now().toString(), value: '' });
  }

  removeMissingPartRow(id: string) {
    if (this.missingPartsRows.length === 1) {
      this.toastr.warning('At least one missing parts row must remain.', 'Cannot Remove');
      return;
    }
    this.missingPartsRows = this.missingPartsRows.filter((r) => r.id !== id);
  }

  // ═══════════════════════════════════════════════════════════════
  // ── SPARE PARTS (REQUIRED) ──
  // ═══════════════════════════════════════════════════════════════

  emptyPartRow(): PartRow {
    return {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      query: '',
      results: [],
      selected: null,
      saved: false,
      qty: '',
      remark: '',
      errors: {},
    } as PartRow;
  }

  searchPartsCatalog(query: string): any[] {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    return (this.partsCatalog || [])
      .filter((p) => (p.partNumber || '').toLowerCase().includes(q) || (p.partName || '').toLowerCase().includes(q))
      .slice(0, 6);
  }

  hasSparePartsData(): boolean {
    return this.sparePartsRows.some(r => r.selected && r.qty && parseFloat(r.qty) > 0);
  }

  addSpareRow() {
    this.sparePartsRows.push(this.emptyPartRow());
  }

  removeSpareRow(id: string) {
    if (this.sparePartsRows.length === 1) {
      this.toastr.warning('At least one spare part row must remain.', 'Cannot Remove');
      return;
    }
    this.sparePartsRows = this.sparePartsRows.filter((r) => r.id !== id);
  }

  onSpareSearchChange(row: PartRow, text: string) {
    row.query = text;
    row.results = this.searchPartsCatalog(text);
  }

  selectSparePart(row: PartRow, part: any) {
    row.selected = part;
    row.query = '';
    row.results = [];
  }

  clearSpareSelection(row: PartRow) {
    row.selected = null;
    row.qty = '';
    row.query = '';
    row.results = [];
  }

  computeGstBreakup(mrp: number, gstRate: number) {
    const mrpNum = parseFloat(String(mrp)) || 0;
    const rate = parseFloat(String(gstRate)) || 0;
    if (!rate) return { priceExGst: mrpNum, gstAmount: 0 };
    const priceExGst = mrpNum / (1 + rate / 100);
    const gstAmount = mrpNum - priceExGst;
    return { priceExGst, gstAmount };
  }

  formatGstRate(gstRate: any): string {
    return gstRate === null || gstRate === undefined || gstRate === '' ? '-' : `${gstRate}%`;
  }

  computeRowTotal(row: PartRow): number {
    const qty = parseFloat(row.qty) || 0;
    const price = row.selected?.basePrice || 0;
    return qty * price;
  }

  // Spare parts auto-included in payload based on qty filled

  get spareTotal(): number {
    return this.sparePartsRows.reduce((sum, r) => sum + this.computeRowTotal(r), 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // ── LOCAL PARTS (OPTIONAL - NO SAVE BUTTON) ──
  // ═══════════════════════════════════════════════════════════════

  emptyLocalPartRow(): LocalPartRow {
    return {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      partName: '',
      partNumber: '',
      qty: '',
      price: '',
      gst: '',
      remark: '',
      saved: false,
      errors: {},
    } as LocalPartRow;
  }

  hasLocalPartsData(): boolean {
    return this.localPartsRows.some(r => r.saved);
  }

  addLocalPartRow() {
    this.localPartsRows.push(this.emptyLocalPartRow());
  }

  removeLocalPartRow(id: string) {
    if (this.localPartsRows.length === 1) {
      this.toastr.warning('At least one local part row must remain.', 'Cannot Remove');
      return;
    }
    this.localPartsRows = this.localPartsRows.filter((r) => r.id !== id);
  }

  computeLocalRowTotal(row: LocalPartRow): number {
    const qty = parseFloat(row.qty) || 0;
    const price = parseFloat(row.price) || 0;
    const base = qty * price;
    const gstPercent = parseFloat(row.gst) || 0;
    const gstAmount = (base * gstPercent) / 100;
    return base + gstAmount;
  }

  saveLocalPart(row: LocalPartRow) {
    if (!row.partName || !row.partName.trim()) {
      this.toastr.warning('Please enter the part name before saving.', 'Missing Part Name');
      return;
    }

    if (!row.qty || !row.qty.trim() || parseFloat(row.qty) <= 0) {
      this.toastr.warning('Please enter a valid quantity (must be greater than 0).', 'Missing Quantity');
      return;
    }

    if (!row.price || !row.price.trim() || parseFloat(row.price) <= 0) {
      this.toastr.warning('Please enter a valid price (must be greater than 0).', 'Missing Price');
      return;
    }

    row.saved = true;
  }

  editLocalPart(row: LocalPartRow) {
    row.saved = false;
  }

  get localTotal(): number {
    return this.localPartsRows.reduce((sum, r) => sum + this.computeLocalRowTotal(r), 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // ── LABOUR COST (SIMPLE FIELD - OPTIONAL) ──
  // ═══════════════════════════════════════════════════════════════

  get labourTotal(): number {
    return parseFloat(this.labourCost) || 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // ── SUBLET PARTS (OPTIONAL) ──
  // ═══════════════════════════════════════════════════════════════

  emptySubletPartRow(): SubletPartRow {
    return {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      descriptionSublet: '',
      costSublet: '',
      saved: false,
      errors: {},
    } as SubletPartRow;
  }

  computeSubletRowTotal(row: SubletPartRow): number {
    return parseFloat(row.costSublet) || 0;
  }

  get subletRow(): SubletPartRow {
    return this.subletPartsRows[0];
  }

  editSubletPart() {
    this.subletRow.saved = false;
  }

  get subletTotal(): number {
    return this.subletPartsRows.reduce((sum, r) => sum + this.computeSubletRowTotal(r), 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // ── GRAND TOTAL + AUTO-CALCULATED COST ACTUAL ──
  // ═══════════════════════════════════════════════════════════════

  get grandTotal(): number {
    return this.spareTotal + this.localTotal + this.labourTotal + this.subletTotal;
  }

  get computedCostActual(): number {
    return this.grandTotal;
  }

  // ═══════════════════════════════════════════════════════════════
  // ── DROPDOWN ──
  // ═══════════════════════════════════════════════════════════════

  toggleJobCardTypeDropdown() {
    this.jobCardTypeDropdownOpen = !this.jobCardTypeDropdownOpen;
    this.fuelDropdownOpen = false;
  }

  selectJobCardType(opt: string) {
    this.jobCardType = opt;
    this.jobCardTypeDropdownOpen = false;
    this.onJobCardTypeChange(this.jobCardType);
  }

  // ═══════════════════════════════════════════════════════════════
  // ── ALL REQUIRED SECTIONS CHECK (AUTO-VALIDATE) ──
  // ═══════════════════════════════════════════════════════════════

  allRequiredSectionsFilled(): boolean {
    // REQUIRED: Complaints (at least one with complaint + action)
    const complaintsOk = this.complaintRows.some(r =>
      r.complaint?.trim() && r.actionTaken?.trim()
    );

    // REQUIRED: Missing Parts (at least one)
    const missingOk = this.missingPartsRows.some(r => r.value?.trim());

    // REQUIRED: Spare Parts (at least one selected with qty)
    const spareOk = this.sparePartsRows.some(r =>
      r.selected && r.qty && parseFloat(r.qty) > 0
    );

    return complaintsOk && missingOk && spareOk;
  }

  allSectionsSaved(): boolean {
    return this.allRequiredSectionsFilled();
  }

  // ═══════════════════════════════════════════════════════════════
  // ── SUBMIT ──
  // ═══════════════════════════════════════════════════════════════

  handleSubmitPress() {
    this.validateJobCardType();

    if (this.hasAnyFieldError || this.hasAnyRowError) {
      this.toastr.warning(
        'Please correct all invalid fields highlighted in red before proceeding.',
        'Invalid Fields'
      );
      return;
    }

    if (!this.allSectionsSaved()) {
      this.toastr.warning(
        'Please fill all required sections:\n1. Complaints (description + action)\n2. Missing Parts (at least one)\n3. Spare Parts (at least one with quantity)',
        'Incomplete Sections'
      );
      return;
    }

    this.confirmVisible = true;
  }

  cancelConfirm() {
    this.confirmVisible = false;
  }

  onJobCardTypeChange(value: string) {
    this.validateJobCardType();
  }

  validateJobCardType() {
    if (!this.jobCardType || this.jobCardType.trim() === '') {
      this.fieldErrors['jobCardType'] = this.fieldCharRules['jobCardType'].message;
    } else {
      delete this.fieldErrors['jobCardType'];
    }
  }

  buildJobCardPayload(): any {
    // Include spare parts - check if qty is filled, not just if manually saved
    const spareParts = this.sparePartsRows
      .filter((r) => r.selected && r.qty && parseFloat(r.qty) > 0) // ✅ Check qty filled
      .map((r) => {
        const { gstAmount } = this.computeGstBreakup(r.selected.basePrice, r.selected.gstRate);
        return {
          id: r.id,
          partNumber: r.selected.partNumber,
          partName: r.selected.partName,
          qty: parseFloat(r.qty) || 0,
          gstAmount: Number(gstAmount.toFixed(2)),
          totalPrice: Number(this.computeRowTotal(r).toFixed(2)),
          remark: r.remark || null,
        };
      });

    // Include local parts even if not in saved state (user filled them in update)
    const localParts = this.localPartsRows
      .filter((r) => r.partName || r.partNumber || r.qty || r.price) // Filter out completely empty rows
      .map((r) => ({
        id: r.id,
        partName: r.partName,
        partNumber: r.partNumber,
        qty: parseFloat(r.qty) || 0,
        price: parseFloat(r.price) || 0,
        gstRate: parseFloat((r.gst || '0').replace('%', '')) || 0,
        remark: r.remark || null,
      }));

    // Include sublet data even if not in saved state
    const subletPartRow = this.subletPartsRows[0];
    const subletDescription = subletPartRow?.descriptionSublet || null;
    const subletCost = parseFloat(subletPartRow?.costSublet) || 0;

    const complaints = this.complaintRows
      .filter((r) => r.complaint && r.complaint.trim())
      .map((r) => ({
        id: r.id,
        complaint: r.complaint,
        actionTaken: r.actionTaken || null,
        remark: r.remark || null
      }));

    const missingParts = this.missingPartsRows
      .filter((r) => r.value && r.value.trim())
      .map((r) => ({
        partDescription: r.value,
        id: r.id
      }));

    return {
      salesMasterId: this.item?.Id || null,
      chassiNumber: this.tractorSlNo,
      jobCardDate: this.dateTime || new Date().toISOString().split('T')[0],
      jobCardType: this.jobCardType,
      fuel: this.fuel || null,
      dealerCode: this.item?.DealerCode || null,
      dealerName: this.dealerName || null,
      customerName: this.item?.CustomerName || null,
      customerAddress: this.item?.CustomerAddress || null,
      tractorSlNo: this.tractorSlNo || null,
      regnNo: this.regnNo || null,
      dateOfSale: this.dateOfSale || null,
      workDoneBy: this.workDoneBy || null,
      mobileNo: this.mobileNo || null,
      alternateMobileNo: this.alternateMobileNo || null,
      frontTyrePressureLeft: parseFloat(this.frontTyrePressureLeft) || 0,
      frontTyrePressureRight: parseFloat(this.frontTyrePressureRight) || 0,
      rearTyrePressureLeft: parseFloat(this.rearTyrePressureLeft) || 0,
      rearTyrePressureRight: parseFloat(this.rearTyrePressureRight) || 0,
      hours: parseFloat(this.hours) || 0,
      timeEstimate: parseFloat(this.timeEstimate) || 0,
      timeActual: parseFloat(this.timeActual) || 0,
      costEstimate: parseFloat(this.costEstimate) || 0,
      costActual: this.computedCostActual,
      spareTotal: Number(this.spareTotal.toFixed(2)) || 0,
      localTotal: Number(this.localTotal.toFixed(2)) || 0,
      labourTotal: Number(this.labourTotal.toFixed(2)) || 0,
      subletTotal: subletCost || 0,
      subletDescription: subletDescription || null,
      grandTotal: Number(this.grandTotal.toFixed(2)) || 0,
      totalAmountPaid: parseFloat(this.totalAmountPaid) || 0,
      createdBy: this.workshopManagerName || null,
      platformType: 'Web',
      complaints,
      missingParts,
      spareParts,
      localParts,
      id: this.item.JobCardMasterId
    };
  }

  addJobCardSubmit(payload: any) {
    this.submitting = true;

    this.jobCardService.addJobCard(payload).subscribe({
      next: () => {
        this.submitting = false;
        Swal.fire('Submitted', 'Job Card saved successfully.', 'success').then(() => {
          this.resetAllFormData();
          this.router.navigate(['/job-card-search']);
        });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.handleSubmitError(err);
      }
    });
  }

  updateJobCardSubmit(payload: any) {
    this.submitting = true;

    this.jobCardService.updateJobCard(payload).subscribe({
      next: () => {
        this.submitting = false;
        Swal.fire('Updated', 'Job Card updated successfully.', 'success').then(() => {
          this.resetAllFormData();
          this.router.navigate(['/job-card-search']);
        });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.handleSubmitError(err);
      }
    });
  }

  handleSubmitError(err: HttpErrorResponse) {
    if (err.status === 403) {
      this.toastr.warning(
        err.error?.message || 'You are not authorized to perform this action.',
        'Access Denied'
      );
    } else {
      this.toastr.error(
        err.error?.message || 'Something went wrong while saving Job Card.',
        'Error'
      );
    }
  }

  handleConfirmSubmit() {
    this.confirmVisible = false;

    const payload = this.buildJobCardPayload();

    if (this.item?.IsClosed === false) {
      this.updateJobCardSubmit(payload);
    } else {
      this.addJobCardSubmit(payload);
    }
  }

  getJobCardMasterById() {
    this.jobCardService.getJobCardMasterById(this.item.JobCardMasterId).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.message === 'Success') {
          const data = res.data;
          const master = data.resJobCardMaster?.[0];

          if (master) {
            this.mapMasterData(master);
            this.mapSubletData(master);
          }

          this.mapComplaintRows(data.resJobCardComplaint);
          this.mapMissingPartRows(data.resJobCardMissingPart);
          this.mapSparePartRows(data.resJobCardSparePart);
          this.mapLocalPartRows(data.resJobCardLocalPart);
        }
      },
      error: (error) => {
        console.error('Error while fetching Job Card:', error);
      }
    });
  }

  mapMasterData(master: any): void {
    this.jobCardType = master.jobCardType || '';
    this.fuel = master.fuel ?? 0;

    this.dealerName = master.dealerName || '';
    this.tractorSlNo = master.tractorSlNo || '';
    this.regnNo = master.regnNo || '';

    this.dateOfSale = master.dateOfSale
      ? master.dateOfSale.split('T')[0]
      : '';

    this.workDoneBy = master.workDoneBy || '';
    this.mobileNo = master.mobileNo || '';
    this.alternateMobileNo = master.alternateMobileNo || '';

    this.frontTyrePressureLeft = master.frontTyrePressureLeft ?? 0;
    this.frontTyrePressureRight = master.frontTyrePressureRight ?? 0;
    this.rearTyrePressureLeft = master.rearTyrePressureLeft ?? 0;
    this.rearTyrePressureRight = master.rearTyrePressureRight ?? 0;

    this.hours = master.hours ?? 0;
    this.timeEstimate = master.timeEstimate ?? 0;
    this.timeActual = master.timeActual ?? 0;

    this.costEstimate = master.costEstimate ?? 0;
    this.labourCost = String(master.labourTotal ?? '');

    this.customerName = master.customerName || '';
    this.customerAddress = master.customerAddress || '';
    this.dateTime = master.jobCardDate
      ? master.jobCardDate.split('T')[0]
      : new Date().toISOString().split('T')[0];
  }

  mapSubletData(master: any): void {
    // Optional section - always show input fields, never saved card
    this.subletPartsRows = [{
      id: master.id || '',
      descriptionSublet: master.subletDescription || '',
      costSublet: String(master.subletTotal ?? ''),
      saved: false, // Always false for optional sections - show input fields
      errors: {}
    } as SubletPartRow];
  }

  mapComplaintRows(complaints: any[]): void {
    this.complaintRows = (complaints || []).map((r: any) => ({
      id: r.id || '',
      complaint: r.complaint || '',
      actionTaken: r.actionTaken || '',
      remark: r.remark || '',
      saved: true
    }));
  }

  mapMissingPartRows(missingParts: any[]): void {
    this.missingPartsRows = (missingParts || []).map((r: any) => ({
      id: r.id || '',
      value: r.partDescription || '',
      saved: true
    }));
  }

  mapSparePartRows(spareParts: any[]): void {
    this.sparePartsRows = (spareParts || []).map((r: any) => {
      return {
        id: r.id || '',
        query: '',
        results: [],
        selected: {
          partNumber: r.partNumber || '',
          partName: r.partName || '',
          basePrice: r.basePrice || 0,
          gstRate: r.gstRate || 0
        },
        qty: String(r.qty ?? ''),
        remark: r.remark || '',
        saved: true,
        errors: {},
        gstAmount: r.gstAmount ?? 0,
        totalPrice: r.totalPrice ?? 0
      } as PartRow;
    });
  }

  mapLocalPartRows(localParts: any[]): void {
    // Optional section - always show input fields
    if (localParts && localParts.length > 0) {
      this.localPartsRows = localParts.map((r: any) => ({
        id: r.id || '',
        partName: r.partName || '',
        partNumber: r.partNumber || '',
        qty: String(r.qty ?? ''),
        price: String(r.price ?? ''),
        gst: `${r.gstRate ?? 0}%`,
        remark: r.remark || '',
        saved: false, // Always false - show input fields, not saved cards
        errors: {}
      }));
    } else {
      // If no local parts in response, show empty input row
      this.localPartsRows = [this.emptyLocalPartRow()];
    }
  }

  toggleFuelDropdown() {
    this.fuelDropdownOpen = !this.fuelDropdownOpen;
    this.jobCardTypeDropdownOpen = false;
  }

  selectFuel(fuelOption: string) {
    this.fuel = fuelOption;
    this.fuelDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.form-floating-custom')) {
      this.jobCardTypeDropdownOpen = false;
      this.fuelDropdownOpen = false;
    }
  }

  onDateChange(newDate: string) {
    this.dateTime = newDate;
    this.validateDate();
  }

  validateDate() {
    if (!this.dateTime || this.dateTime.trim() === '') {
      this.fieldErrors['dateTime'] = 'Date is required';
    } else {
      delete this.fieldErrors['dateTime'];
    }
  }
}
