import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { SparePartOrder } from '../../../model/apiresponse';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';

const CART_KEY = 'sparepart_order_draft_v1';
// hello babu   
export type SparePartCartItem = Pick<SparePartOrder, 'id' | 'material' | 'desc' | 'hsnCode' | 'gstRate' | 'ndp' | 'qty'>;

interface SparePartDraft {
  items: SparePartCartItem[];
  remarks: string;
  savedAt: string;
}

interface Totals {
  qty: number;
  subTotal: number;
  gstTotal: number;
  grandTotal: number;
}


@Component({
  selector: 'app-sparepartorder',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './sparepartorder.component.html',
  styleUrl: './sparepartorder.component.css'
})
export class SparepartorderComponent implements OnInit, OnDestroy {

  @Output() orderSubmitted = new EventEmitter<any>();

  readonly maxQty = 9999;

  /* ── Products ── */
  allProducts: SparePartOrder[] = [];

  /* ── Filters ── */
  searchText = '';
  categories: any[] = [];
  paymentModesOption: any[] = [];
  selectedCategory = '';
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;
  PaymentModeerror = '';
  Amounterror = '';



  /* ── Cart ── */
  cart: SparePartCartItem[] = [];
  private cartIndex = new Map<string, SparePartCartItem>();
  remarks = '';
  totals: Totals = { qty: 0, subTotal: 0, gstTotal: 0, grandTotal: 0 };
  submitting = false;

  // Payment Modal
  showPaymentModal = false;

  // Payment Details
  paymentStatus = 0;
  paymentAmount = 0;
  paymentMode = '';
  transactionId = '';
  referenceNo = '';
  paymentRemarks = '';

  private destroy$ = new Subject<void>();

  constructor(private ds: AuthService, private toast: ToastrService) { }

  ngOnInit(): void {
    this.restoreDraft();

    this.loadCategories();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ════════════ CATEGORY ════════════ */

  loadCategories(): void {
    this.ds.getCategory().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.statusCode === 200 && !res?.errorCode) {

          const data = res.data || [];

          this.categories = data.filter(
            (x: any) => x.columnName === 'Category'
          );

          this.paymentModesOption = data.filter(
            (x: any) => x.columnName === 'PaymentMode'
          );

        } else {
          this.categories = [];
          this.paymentModesOption = [];
        }
      },
      error: () => {
        this.categories = [];
        this.paymentModesOption = [];
      }
    });
  }


  /* ════════════ PRODUCTS ════════════ */

  loadProducts(): void {

    const page = this.currentPage;
    const pageSize = this.itemsPerPage;

    const search = (this.searchText || '').trim();
    const category = this.selectedCategory;

    this.ds.getSparePartsPagination(page, pageSize, search, category).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {

        if (!res) {
          this.allProducts = [];
          this.totalItems = 0;
          this.toast.error('Failed to load spare parts');
          return;
        }

        if (res.statusCode === 200) {
          this.allProducts = (res.data.data || []).map((p: any) => ({
            id: String(p.id ?? ''),
            material: String(p.material ?? ''),
            desc: String(p.desc ?? ''),
            hsnCode: String(p.hsnCode ?? ''),
            gstRate: Number(p.gstRate) || 0,
            mrp: this.round2(p.mrp),
            ndp: this.round2(p.ndp),
            zpmr: this.round2(p.zpmr),
            zs00: this.round2(p.zs00),
            qty: 1
          }));
          this.currentPage = res.data?.pageNumber || page;

          this.totalItems = res.data?.totalRecords || 0;

          this.syncCartWithMaster();
        } else {
          this.allProducts = [];
          this.toast.error(res?.message || 'Failed to load spare parts');
        }
      },

      error: (error: any) => {
        this.allProducts = [];
        this.toast.error(error?.error?.message || 'Failed to load spare parts');
      }
    });
  }

  onPageChange(page: number): void { this.currentPage = page; this.loadProducts(); }


  /** Backend filter hai, isliye sirf loaded items ka price/GST refresh karo — baaki cart items ko mat hatao */
  private syncCartWithMaster(): void {
    if (!this.cart.length || !this.allProducts.length) return;
    let changed = false;

    for (const p of this.allProducts) {
      const it = this.cartIndex.get(p.id);
      if (!it) continue;
      if (it.ndp !== p.ndp || it.gstRate !== p.gstRate) changed = true;
      it.ndp = p.ndp;
      it.gstRate = p.gstRate;
      it.desc = p.desc;
      it.material = p.material;
      it.hsnCode = p.hsnCode;
    }

    if (changed) {
      this.afterCartChange();
      this.toast.info('Cart prices updated as per latest NDP');
    }
  }

  submitOrder(): void {
    if (this.submitting) return;

    // Cart empty hai to modal nahi khulega
    if (!this.cart.length) {
      this.toast.warning('Please add at least one spare part');
      return;
    }

    // Quantity normalize
    this.cart.forEach(it => {it.qty = this.toQty(it.qty);});

    this.recalc();

    // Payment modal open karne se pehle values set
    this.paymentAmount = this.totals.grandTotal;

    this.paymentMode = '';
    this.transactionId = '';
    this.referenceNo = '';
    this.paymentRemarks = '';
    this.paymentStatus = 0;
    this.Amounterror = '';
    this.PaymentModeerror = '';

    // Bootstrap modal
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    if (this.submitting) return;
    this.showPaymentModal = false;
  }

  confirmSubmitOrder(): void {

    if (this.submitting) return;

    // Cart check
    if (!this.cart.length) {
      this.toast.warning('Please add at least one spare part');
      this.showPaymentModal = false;
      return;
    }

    // Payment required hai to validation
    if (this.paymentStatus === 1) {

      if (!this.paymentAmount || this.paymentAmount <= 0) {
        this.Amounterror = 'Please enter payment amount';
        return;
      }

      if (!this.paymentMode) {
        this.PaymentModeerror = 'Please select payment mode';
        return;
      }
    }

    // Quantity normalize
    this.cart.forEach(it => {
      it.qty = this.toQty(it.qty);
    });

    this.recalc();
    const isPayment = this.paymentStatus === 1;

    const payload = {
      paymentStatus: this.paymentStatus,
      remarks: (this.remarks || '').trim(),

      paymentAmount: isPayment? Number(this.paymentAmount) : 0,
      paymentMode: isPayment ? (this.paymentMode || '').trim() : '',
      transactionId: isPayment ? (this.transactionId || '').trim() : '',
      referenceNo: isPayment ? (this.referenceNo || '').trim() : '',
      paymentRemarks: isPayment ? (this.paymentRemarks || '').trim() : '',

      sparePartsOrderDetails: this.cart.map(it => ({
        sparePartId: Number(it.id),
        quantity: this.toQty(it.qty)
      }))
    };

    this.submitting = true;

    this.ds.saveSparePartsOrder(payload).pipe(takeUntil(this.destroy$), finalize(() => { this.submitting = false; })).subscribe({
      next: (res: any) => {

        if (res?.statusCode === 200 && !res?.errorCode) {

          this.showPaymentModal = false;
          this.resetCart();
          this.toast.success( res?.message || 'Order submitted successfully');

          this.orderSubmitted.emit(res?.data ?? payload);

        } else {
          this.toast.error(res?.message || 'Order submit failed');
        }
      },
      error: (err) => {

        this.toast.error(err?.error?.message ||'Something went wrong, please try again');
      }
    });
  }

  searchProducts(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchText = '';
    this.selectedCategory = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  /* ── Card qty ── */

  changeCardQty(p: SparePartOrder, delta: number): void {
    p.qty = this.toQty(Number(p.qty || 0) + delta);
  }

  commitCardQty(p: SparePartOrder): void {
    p.qty = this.toQty(p.qty);
  }

  addToCart(p: SparePartOrder): void {
    p.qty = this.toQty(p.qty);
    const existing = this.cartIndex.get(p.id);

    if (existing) {
      existing.qty = p.qty;
      this.toast.success(`${p.desc} quantity updated`);
    } else {
      this.cart.push({
        id: p.id,
        material: p.material,
        desc: p.desc,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
        ndp: p.ndp,
        qty: p.qty,
      });
      this.toast.success(`${p.desc} added to cart`);
    }
    this.afterCartChange();
  }

  inCart(id: string): boolean {
    return this.cartIndex.has(id);
  }

  /* ════════════ CART ════════════ */

  changeCartQty(it: SparePartCartItem, delta: number): void {
    it.qty = this.toQty(Number(it.qty || 0) + delta);
    this.syncCardQty(it);
    this.afterCartChange();
  }

  commitCartQty(it: SparePartCartItem): void {
    it.qty = this.toQty(it.qty);
    this.syncCardQty(it);
    this.afterCartChange();
  }

  removeItem(it: SparePartCartItem): void {
    this.cart = this.cart.filter(x => x.id !== it.id);
    const p = this.allProducts.find(x => x.id === it.id);
    if (p) p.qty = 1;
    this.afterCartChange();
  }

  clearCart(): void {
    if (!this.cart.length) return;
    this.resetCart();
  }

  /* ── Amount calc ── */

  gstAmt(p: { ndp: number; gstRate: number }): number {
    return this.round2((p.ndp * p.gstRate) / 100);
  }

  lineNdp(it: SparePartCartItem): number {
    return this.round2(it.ndp * (Number(it.qty) || 0));
  }

  lineGst(it: SparePartCartItem): number {
    return this.round2((this.lineNdp(it) * it.gstRate) / 100);
  }

  lineTotal(it: SparePartCartItem): number {
    return this.round2(this.lineNdp(it) + this.lineGst(it));
  }


  onRemarksChange(): void {
    this.saveDraft();
  }

  /* ════════════ STATE / STORAGE ════════════ */

  private afterCartChange(): void {
    this.cartIndex = new Map(this.cart.map(i => [i.id, i]));
    this.recalc();
    this.saveDraft();
  }

  private recalc(): void {
    let qty = 0, sub = 0, gst = 0;
    for (const it of this.cart) {
      qty += Number(it.qty) || 0;
      sub += this.lineNdp(it);
      gst += this.lineGst(it);
    }
    this.totals = {
      qty,
      subTotal: this.round2(sub),
      gstTotal: this.round2(gst),
      grandTotal: this.round2(sub + gst),
    };
  }

  private syncCardQty(it: SparePartCartItem): void {
    const p = this.allProducts.find(x => x.id === it.id);
    if (p) p.qty = it.qty;
  }

  private resetCart(): void {
    this.cart = [];
    this.remarks = '';
    this.allProducts.forEach(p => (p.qty = 1));
    this.cartIndex.clear();
    this.recalc();
    try { localStorage.removeItem(CART_KEY); } catch { }
  }

  private saveDraft(): void {
    try {
      if (!this.cart.length && !this.remarks) {
        localStorage.removeItem(CART_KEY);
        return;
      }
      const draft: SparePartDraft = { items: this.cart, remarks: this.remarks, savedAt: new Date().toISOString() };
      localStorage.setItem(CART_KEY, JSON.stringify(draft));
    } catch { }
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return;
      const d: SparePartDraft = JSON.parse(raw);
      this.cart = (Array.isArray(d?.items) ? d.items : [])
        .filter(i => i && i.id && i.material)
        .map(i => ({
          id: String(i.id),
          material: String(i.material),
          desc: String(i.desc || ''),
          hsnCode: String(i.hsnCode || ''),
          gstRate: Number(i.gstRate) || 0,
          ndp: Number(i.ndp) || 0,
          qty: this.toQty(i.qty),
        }));
      this.remarks = d?.remarks || '';
      this.cartIndex = new Map(this.cart.map(i => [i.id, i]));
      this.recalc();
    } catch {
      try { localStorage.removeItem(CART_KEY); } catch { }
    }
  }

  /* ════════════ HELPERS ════════════ */

  private toQty(v: any): number {
    const n = Math.floor(Number(v));
    if (!isFinite(n) || n < 1) return 1;
    return Math.min(n, this.maxQty);
  }

  private round2(n: any): number {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  fmt(n: number): string {
    return '₹ ' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  trackById = (_: number, x: { id: string }) => x.id;
}