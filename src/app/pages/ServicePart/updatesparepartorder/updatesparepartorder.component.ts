import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service'
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import { SparePartOrderList, SparePartOrderDetail, InvoiceDetail } from '../../../model/apiresponse';
import { PermissionService } from '../../../services/userpermission/permission.service';
import { ToastrService } from 'ngx-toastr';


declare var bootstrap: any;

@Component({
  selector: 'app-updatesparepartorder',
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './updatesparepartorder.component.html',
  styleUrl: './updatesparepartorder.component.css'
})
export class UpdatesparepartorderComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('orderModalEl') orderModalEl!: ElementRef;
  @ViewChild('invoiceModalEl') invoiceModalEl!: ElementRef;


  readonly MAX_QTY = 9999;
  private origQtyMap = new Map<string, number>();

  // Main list
  orderList: SparePartOrderList[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;
  paymentModesOption: any[] = []

  // Modal
  selectedOrder: any = null;
  orderItems: SparePartOrderDetail[] = [];
  rowBusyId: any = null;
  hasChanges = false;   // modal band hone par list refresh karni hai ya nahi

  // Delete confirm
  deleteTarget: any = null;
  isDeleting = false;
  cancelOrderTarget: any = null;
  isCancelling = false;

  // Payment
  paymentRequired = false;
  payment: any = this.emptyPayment();
  paymentTouched = false;
  isSubmitting = false;

  invoice: InvoiceDetail = {
    invoiceNumber: '',
    invoiceDate: '',
    taxableAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    invoiceFileName: '',
    invoiceFileUrl: '',
    docketNumber: ''
  };

  // Frontend checkbox
  isDelivery = false;

  // Selected PDF
  selectedInvoiceFile: File | null = null;

  // UI state
  invoiceTouched = false;
  docketTouched = false;

  isInvoiceSubmitting = false;
  private orderModal: any;
  private invoiceModal: any;
  private onModalHidden = () => this.handleModalHidden();

  constructor(private apis: AuthService, private permission: PermissionService, private toast: ToastrService) { }

  ngOnInit(): void {
    this.getOrders(1);
  }

  ngAfterViewInit(): void {
    const el = this.orderModalEl?.nativeElement;
    if (!el) return;
    this.orderModal = bootstrap.Modal.getOrCreateInstance(el, { backdrop: 'static', keyboard: false });
    el.addEventListener('hidden.bs.modal', this.onModalHidden);
  }

  ngOnDestroy(): void {
    this.orderModalEl?.nativeElement?.removeEventListener('hidden.bs.modal', this.onModalHidden);
    this.orderModal?.dispose();
    this.invoiceModal?.dispose();
  }

  // ================= MAIN LIST =================

  getOrders(page: number): void {

    this.apis.getSparePartsOrders(page, this.itemsPerPage).subscribe({
      next: (res: any) => {

        if (res?.statusCode === 200 && res?.message?.toLowerCase() === 'success') {
          this.orderList = res.data?.data || [];
          this.totalItems = res.data?.totalRecords || 0;
          this.currentPage = page;
        } else {
          this.resetList();
          this.toast.error(res?.message || 'Failed fetching orders.');
        }
      },
      error: (err: any) => {

        this.resetList();
        this.toast.error(err?.error?.message || 'Something went wrong while fetching orders.');
      }
    });
  }

  private resetList(): void {
    this.orderList = [];
    this.totalItems = 0;
  }

  onPageChange(page: number): void {
    this.getOrders(page);
  }

  canUpdate(order: any): boolean {
    return (order?.paymentStatus || '').toLowerCase() !== 'paid' && this.permission.hasSubmenuPermission('UpdateOrderedSparePartDealer');
  }

  canInvoicing(order: any): boolean {
    return (order?.paymentStatus || '').toLowerCase() === 'paid' && !(order?.isInvoicing === true && order?.isDelivered === true) && this.permission.hasSubmenuPermission('UpdateOrderedSparePartHO');
  }

  statusClass(status: any): string {
    switch ((status || '').toLowerCase()) {
      case 'paid': case 'completed': case 'approved': case 'delivered': return 'st-success';
      case 'unpaid': case 'rejected': case 'cancelled': return 'st-danger';
      case 'partial': case 'partially paid': return 'st-warning';
      case 'pending': return 'st-pending';
      default: return 'st-default';
    }
  }

  // ================= MODAL =================

  openUpdateModal(order: any): void {
    if (!this.canUpdate(order)) return;
    this.selectedOrder = order;
    this.orderItems = [];
    this.hasChanges = false;
    this.deleteTarget = null;
    this.paymentRequired = false;
    this.payment = this.emptyPayment();
    this.paymentTouched = false;
    this.getOrderItems(order.orderId);
    this.orderModal?.show();
  }

  closeModal(): void {
    if (this.isSubmitting || this.isDeleting) return;
    this.orderModal?.hide();
  }

  private handleModalHidden(): void {
    this.deleteTarget = null;
    this.selectedOrder = null;
    this.orderItems = [];
    this.origQtyMap.clear();
    if (this.hasChanges) this.getOrders(this.currentPage);
    this.hasChanges = false;
  }

  getOrderItems(orderId: string): void {

    this.apis.getSparePartsOrderDetails(orderId).subscribe({
      next: (res: any) => {

        if (res?.statusCode === 200) {

          this.orderItems = res?.data || [];
          this.origQtyMap.clear();

          this.orderItems.forEach(x => this.origQtyMap.set(x.orderDetailId, x.quantity));

        } else {
          this.orderItems = [];
          this.toast.error(res?.message || 'Failed fetching order items.');
        }
      },
      error: (err: any) => {

        this.orderItems = [];
        this.toast.error(err?.error?.message || 'Something went wrong while fetching order items.');
      }
    });
  }

  private savedQty(it: SparePartOrderDetail): number {
    return this.origQtyMap.get(it.orderDetailId) ?? Number(it.quantity) ?? 0;
  }

  lineAmount(it: any, useSaved = false): number {
    const q = useSaved ? this.savedQty(it) : Number(it.quantity) || 0;
    const price = Number(it.ndp || it.rate) || 0;
    const gst = Number(it.gstRate) || 0;
    return this.round2(price * q * (1 + gst / 100));
  }

  get itemsTotalQty(): number {
    return this.orderItems.reduce((s, it) => s + this.savedQty(it), 0);
  }

  get itemsGrandTotal(): number {
    return this.round2(this.orderItems.reduce((s, it) => s + this.lineAmount(it, true), 0));
  }

  get payableAmount(): number {
    if (!this.orderItems.length && !this.hasChanges) return Number(this.selectedOrder?.balanceAmount || 0);
    const paid = Number(this.selectedOrder?.paidAmount || 0);
    return Math.max(this.round2(this.itemsGrandTotal - paid), 0);
  }

  get hasUnsavedQty(): boolean {
    return this.orderItems.some(it => this.isDirty(it));
  }

  isDirty(it: SparePartOrderDetail): boolean {
    return Number(it.quantity) !== this.savedQty(it);
  }

  // ================= QTY =================

  incQty(it: SparePartOrderDetail): void {
    if (it.quantity < this.MAX_QTY) it.quantity = Number(it.quantity) + 1;
  }

  decQty(it: SparePartOrderDetail): void {
    if (it.quantity > 1) it.quantity = Number(it.quantity) - 1;
  }

  onQtyInput(it: SparePartOrderDetail): void {
    let v = Math.floor(Number(it.quantity));
    if (!v || v < 1) v = 1;
    if (v > this.MAX_QTY) v = this.MAX_QTY;
    it.quantity = v;
  }

  blockInvalidKeys(e: KeyboardEvent): void {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
  }

  // ================= ITEM DELETE =================

  askDelete(it: any): void {
    if (this.rowBusyId) return;
    this.deleteTarget = it;
  }

  cancelDelete(): void {
    if (this.isDeleting) return;
    this.deleteTarget = null;
  }

  updateSparePartOrder(action: 'UPDATE' | 'DELETE' | 'CANCEL_ORDER', it?: SparePartOrderDetail): void {

    const payload = {
      orderId: action === 'CANCEL_ORDER' ? this.selectedOrder?.orderId : null,
      orderDetailId: action === 'CANCEL_ORDER' ? null : it?.orderDetailId,
      action: action,
      quantity: action === 'UPDATE' ? Number(it?.quantity) : action === 'DELETE' ? this.savedQty(it!) : null
    };

    this.apis.updateSparePartsOrderItem(payload).subscribe({
      next: (res: any) => {

        if (res?.statusCode === 200) {

          if (action === 'UPDATE' && it) {
            this.origQtyMap.set(it.orderDetailId, Number(it.quantity));

            this.hasChanges = true;
            this.syncPaymentAmount();
            this.toast.success(res?.message || 'Quantity updated successfully.');
          }

          else if (action === 'DELETE' && it) {
            this.orderItems = this.orderItems.filter(x => x.orderDetailId !== it.orderDetailId);

            this.origQtyMap.delete(it.orderDetailId);
            this.deleteTarget = null;
            this.hasChanges = true;
            this.syncPaymentAmount();

            this.toast.success(res?.message || 'Item deleted successfully.');
          }

          else if (action === 'CANCEL_ORDER') {
            this.hasChanges = true;
            this.isCancelling = false;
            this.toast.success(res?.message || 'Order cancelled successfully.');

            this.orderModal?.hide();
            this.getOrders(1);
          }

        } else {
          if (action === 'UPDATE' && it) {
            it.quantity = this.savedQty(it);
          }

          this.toast.error(res?.message || 'Operation failed.');
        }

        this.rowBusyId = null;
        this.isDeleting = false;
      },

      error: (err: any) => {

        this.rowBusyId = null;
        this.isDeleting = false;

        if (action === 'UPDATE' && it) {
          it.quantity = this.savedQty(it);
        }

        this.toast.error(err?.error?.message || 'Something went wrong.');
      }
    });
  }

  confirmDelete(): void {
    const it = this.deleteTarget;

    if (!it || this.isDeleting) return;

    this.isDeleting = true;
    this.rowBusyId = it.orderDetailId;

    this.updateSparePartOrder('DELETE', it);
  }

  askCancelOrder(): void {
    if (!this.selectedOrder || this.isCancelling) return;

    this.cancelOrderTarget = this.selectedOrder;
  }

  cancelOrderConfirmation(): void {
    if (this.isCancelling) return;

    this.cancelOrderTarget = null;
  }

  confirmCancelOrder(): void {
    if (!this.cancelOrderTarget || this.isCancelling) return;

    this.isCancelling = true;
    this.cancelOrderTarget = null;

    this.updateSparePartOrder(
      'CANCEL_ORDER',
      undefined
    );
  }
  // ================= PAYMENT =================

  loadPaymentMode(): void {
    this.apis.getCategory().subscribe({
      next: (res: any) => {
        if (res?.statusCode === 200 && !res?.errorCode) {

          const data = res.data || [];


          this.paymentModesOption = data.filter(
            (x: any) => x.columnName === 'PaymentMode'
          );

        } else {

          this.paymentModesOption = [];
        }
      },
      error: () => {

        this.paymentModesOption = [];
      }
    });
  }

  private emptyPayment(): any {
    return { paymentAmount: null, paymentMode: '', transactionId: '', referenceNo: '', paymentRemarks: '' };
  }

  onPaymentToggle(): void {
    if (this.paymentRequired) {
      this.paymentTouched = false;
      this.payment.paymentAmount = this.payableAmount;
      this.loadPaymentMode()
    } else {
      this.payment = this.emptyPayment();
      this.paymentTouched = false;
    }
  }

  private syncPaymentAmount(): void {
    if (this.paymentRequired) this.payment.paymentAmount = this.payableAmount;
  }

  get amountError(): string {
    const amt = Number(this.payment.paymentAmount);
    if (this.payment.paymentAmount === null || this.payment.paymentAmount === '' || isNaN(amt)) return 'Payment amount is required.';
    if (amt <= 0) return 'Amount must be greater than 0.';
    if (amt > this.payableAmount + 0.01) return `Amount cannot exceed balance ₹${this.payableAmount.toFixed(2)}.`;
    return '';
  }

  get modeError(): string {
    return this.payment.paymentMode ? '' : 'Payment mode is required.';
  }

  submitOrder(): void {
    if (this.isSubmitting) return;

    if (this.hasUnsavedQty) {
      this.toast.warning('Some item quantities have been updated but not saved. Please click the Update button for each changed item before continuing.');
      return;
    }

    // Payment check nahi kiya to sirf modal band
    if (!this.paymentRequired) {
      this.orderModal?.hide();
      return;
    }

    this.paymentTouched = true;
    if (this.amountError || this.modeError) return;

    const payload = {
      orderId: this.selectedOrder?.orderId,
      paymentStatus: 1,
      paymentAmount: this.round2(Number(this.payment.paymentAmount)),
      paymentMode: this.payment.paymentMode,
      transactionId: (this.payment.transactionId || '').trim(),
      referenceNo: (this.payment.referenceNo || '').trim(),
      paymentRemarks: (this.payment.paymentRemarks || '').trim()
    };

    this.isSubmitting = true;
    this.apis.updateSparePartsOrderPayment(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res?.statusCode === 200) {
          this.hasChanges = true;
          this.toast.success(res?.message || 'Payment updated successfully.');
          this.orderModal?.hide();
        } else {
          this.toast.error(res?.message || 'Failed to update payment.');
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toast.error(err?.error?.message || 'Something went wrong while updating payment.');
      }
    });
  }

  private round2(n: number): number {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  trackByOrder = (_: number, o: any) => o.orderId;
  trackByItem = (_: number, it: SparePartOrderDetail) => it.orderDetailId;

  // ================= Invoice =================

  openInvoiceModal(order: any): void {

    if (!this.canInvoicing(order)) { return; }

    this.selectedOrder = order;
    this.getOrderItems(order.orderId);

    if(this.selectedOrder.isInvoicing){
      this.getInvoiceDetails(this.selectedOrder?.orderId);
    }

    // Reset selected file
    this.selectedInvoiceFile = null;

    // Delivery
    this.isDelivery = !!order?.docketNumber;

    // Validation reset
    this.invoiceTouched = false;
    this.docketTouched = false;

    // Get invoice modal
    const modalElement = this.invoiceModalEl?.nativeElement;

    if (!modalElement) {
      this.toast.warning('Invoice modal element not found.');
      return;
    }
    this.invoiceModal = bootstrap.Modal.getOrCreateInstance(modalElement, { backdrop: 'static', keyboard: false });
    this.invoiceModal.show();
  }

  closeInvoiceModal(): void {

    if (this.isInvoiceSubmitting) { return; }
    this.invoiceModal?.hide();
    this.resetInvoiceModal();
  }

  private resetInvoiceModal(): void {
    this.invoice = { invoiceNumber: '', invoiceDate: '', taxableAmount: 0, taxAmount: 0,
      totalAmount: 0,invoiceFileName: '', invoiceFileUrl: '', docketNumber: ''
    };
    this.isDelivery = false;
    this.selectedInvoiceFile = null;
    this.invoiceTouched = false;
    this.docketTouched = false;
    this.isInvoiceSubmitting = false;
  }

  validateInvoice(): boolean {

    this.invoiceTouched = true;
    this.docketTouched = this.isDelivery;

    if (!this.invoice.invoiceNumber?.trim()) {
      this.toast.warning('Invoice number is required.');
      return false;
    }

    if (!this.invoice.invoiceDate?.trim()) {
      this.toast.warning('Invoice date is required.');
      return false;
    }

    const taxableAmount = Number(this.invoice.taxableAmount);

    if (this.invoice.taxableAmount == null || !Number.isFinite(taxableAmount) || taxableAmount <= 0) {
      this.toast.warning('Taxable amount is required and must be greater than 0.');
      return false;
    }
    const taxAmount = Number(this.invoice.taxAmount);

    if (this.invoice.taxAmount == null || !Number.isFinite(taxAmount) || taxAmount < 0) {
      this.toast.warning('Tax amount is required.');
      return false;
    }

    if (!this.selectedInvoiceFile && !this.invoice.invoiceFileName) {
      this.toast.warning('Invoice PDF is required.');
      return false;
    }

    if (this.isDelivery) {

      if (!this.invoice.docketNumber?.trim()) {
        this.toast.warning('Docket number is required when delivery is selected.');
        return false;
      }
    }

    this.invoice.totalAmount = this.round2(taxableAmount + taxAmount);
    return true;
  }

  submitInvoice(): void {

    if (this.isInvoiceSubmitting) { return; }

    if (!this.validateInvoice()) { return; }

    const taxableAmount = Number(this.invoice.taxableAmount);
    const taxAmount = Number(this.invoice.taxAmount);
    const totalAmount = this.round2(taxableAmount + taxAmount);
    this.invoice.totalAmount = totalAmount;

    const formData = new FormData();

    formData.append('OrderId', this.selectedOrder?.orderId || '');
    formData.append('InvoiceNumber', this.invoice.invoiceNumber.trim());
    formData.append('InvoiceDate', this.invoice.invoiceDate.trim());
    formData.append('TaxableAmount', String(taxableAmount));
    formData.append('TaxAmount', String(taxAmount));
    formData.append('TotalAmount', String(totalAmount));
    formData.append('IsDelivery', this.selectedOrder?.isDelivered);
    formData.append('IsInvoicing', this.selectedOrder?.isInvoicing);
    formData.append('DocketNumber', this.isDelivery ? this.invoice.docketNumber.trim() : '');
    if (this.selectedInvoiceFile) {formData.append('PDF', this.selectedInvoiceFile, this.selectedInvoiceFile.name);}

    this.isInvoiceSubmitting = true;

    this.apis.updateInvoice(formData).subscribe({
      next: (response: any) => {
        this.isInvoiceSubmitting = false;

        if (response?.statusCode === 200) {

          this.selectedInvoiceFile = null;
          this.toast.success(response?.message || 'Invoice created successfully.');
          this.getOrders(this.currentPage);
          this.closeInvoiceModal();
        }
        else {
          this.toast.error(response?.message || 'Unable to create invoice.');
          return;
        }
      },
      error: (error: any) => {
        this.isInvoiceSubmitting = false;
        this.toast.error(error?.error?.message || 'Something went wrong while creating invoice.');
      }
    });
  }

  calculateInvoiceTotal(): number {

    const taxableAmount = Number(this.invoice?.taxableAmount ?? 0);
    const taxAmount = Number(this.invoice?.taxAmount ?? 0);
    const total = taxableAmount + taxAmount;
    this.invoice.totalAmount = this.round2(total);
    return this.invoice.totalAmount;
  }

  onInvoiceFileSelected(event: Event): void {

    // if (this.invoiceReadonly) { return; }

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      this.selectedInvoiceFile = null;
      return;
    }
    const file = input.files[0];

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {

      input.value = '';
      this.selectedInvoiceFile = null;
      this.toast.warning('Only PDF files are allowed.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      input.value = '';
      this.selectedInvoiceFile = null;
      this.toast.warning('Invoice PDF size cannot exceed 10 MB.');
      return;
    }
    this.selectedInvoiceFile = file;
  }

  getInvoiceDetails(orderId: string): void {

    this.apis.GetSpareOrderInvoice(orderId).subscribe({
      next: (res: any) => {

        if (res?.statusCode === 200) {
          const data = res?.data;

          this.invoice.invoiceNumber = data.invoiceNumber || '';
          this.invoice.taxableAmount = Number(data.taxableAmount ?? 0);
          this.invoice.invoiceDate = data.invoiceDate || ''
          this.invoice.taxAmount = Number(data.taxAmount ?? 0);
          this.invoice.totalAmount = Number(data.totalAmount ?? 0);
          this.invoice.docketNumber = data.docketNumber || '';
          this.invoice.invoiceFileUrl = data.pdfUrl || '';
          this.invoice.invoiceFileName = this.selectedInvoiceFile?.name || 'Invoice PDF';
          this.isDelivery = !!this.invoice.docketNumber;
          
        } else {
          
          this.toast.error(res?.message);
        }
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'Something went wrong while fetching Invoice.');
      }
    });
  }
}