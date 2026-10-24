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
  @ViewChild('invoiceFileInput') invoiceFileInput?: ElementRef<HTMLInputElement>;




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

  kpiCards = [
    { title: 'TOTAL ORDER', count: 0, value: 0, icon: 'fa-solid fa-store', colorClass: 'kpi-blue' },
    { title: 'PAYMENT PENDING', count: 0, value: 0, icon: 'fa-solid fa-wallet', colorClass: 'kpi-orange' },
    { title: 'INVOICE PENDING', count: 0, value: 0, icon: 'fa-solid fa-file-invoice', colorClass: 'kpi-purple' },
    { title: 'DELIVERY PENDING', count: 0, value: 0, icon: 'fa-solid fa-truck', colorClass: 'kpi-green' }
  ];

  // Frontend checkbox
  isDelivery = false;

  // Selected PDF
  selectedInvoiceFile: File | null = null;

  // UI state
  invoiceTouched = false;
  docketTouched = false;
  InvoiceView = false;
  AddDeliveryView = false;
  InvoiceViewButton = false;


  isInvoiceSubmitting = false;
  private orderModal: any;
  private invoiceModal: any;
  private onModalHidden = () => this.handleModalHidden();

  today = new Date().toISOString().split('T')[0];


  stateList: any[] = [];
  dealerList: any[] = [];
  selectedState: string = 'All';
  selectedDealership: string = 'All';
  selectedDuration: string = 'this Month';
  orderIdSearch: string = '';

  customStartMonth: number = new Date().getMonth() + 1;
  customStartYear: number = new Date().getFullYear();
  customEndMonth: number = new Date().getMonth() + 1;
  customEndYear: number = new Date().getFullYear();

  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  years: number[] = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i);

  constructor(private apis: AuthService, private permission: PermissionService, private toast: ToastrService) { }

  ngOnInit(): void {
    this.getStateList();
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
    const { startDate, endDate } = this.getDateRange();

    const filters = {
      DealerCode: this.selectedDealership || 'All',
      StateName: this.selectedState || 'All',
      Duration: this.selectedDuration,
      StDate: startDate,
      EnDate: endDate,
      OrderNo: (this.orderIdSearch || '').trim()
    };

    this.apis.getSparePartsOrders(page, this.itemsPerPage, filters).subscribe({
      next: (res: any) => {
        if (res?.statusCode === 200 && res?.message?.toLowerCase() === 'success') {
          this.orderList = res.data?.data || [];
          this.totalItems = res.data?.totalRecords || 0;
          this.currentPage = page;
          this.kpiCards[0].count = res.data?.totalRecords ?? 0;
          this.kpiCards[0].value = res.data?.totalRecordsValue ?? 0;
          this.kpiCards[1].count = res.data?.totalPendingPayment ?? 0;
          this.kpiCards[1].value = res.data?.totalPendingPaymentValue ?? 0;
          this.kpiCards[2].count = res.data?.totalPendingInvoice ?? 0;
          this.kpiCards[2].value = res.data?.totalPendingInvoiceValue ?? 0;
          this.kpiCards[3].count = res.data?.totalPendingDelivered ?? 0;
          this.kpiCards[3].value = res.data?.totalPendingDeliveredValue ?? 0;
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




  canInvoiceView(order: any): boolean {
    return (
      (this.permission.hasSubmenuPermission('UpdateOrderedSparePartHO') && order?.isPaymentSuccess) ||
      (
        this.permission.hasSubmenuPermission('UpdateOrderedSparePartDealer') && order?.isInvoicing
      )
    );
  }

  AddDeliveryDetailsView(order: any): boolean {
    return (
      (this.permission.hasSubmenuPermission('UpdateOrderedSparePartHO') && order?.isPaymentSuccess) ||
      (
        this.permission.hasSubmenuPermission('UpdateOrderedSparePartDealer') && order?.isDelivered
      )
    );
  }

  canInvoiceViewButton(order: any): boolean {
    return (
      this.permission.hasSubmenuPermission('UpdateOrderedSparePartHO') && !order.isDelivered && order?.isPaymentSuccess);
  }

  onRowClick(order: any): void {
    // 1. only Dealer: Payment pending / unpaid
    if (this.canUpdate(order)) {
      this.openUpdateModal(order);
      return;
    }
    this.openInvoiceModal(order);
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
          this.invoice.taxableAmount = this.orderItems.reduce(
            (sum: number, item: any) => sum + Number(item.totalTaxableAmount ?? 0),
            0
          );

          this.invoice.taxAmount = this.orderItems.reduce(
            (sum: number, item: any) => sum + Number(item.taxAmount ?? 0),
            0
          );

          this.invoice.totalAmount = this.orderItems.reduce(
            (sum: number, item: any) => sum + Number(item.totalAmount ?? 0),
            0
          );
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

  totalTaxableChangedAmount(it: any, useSaved = false): number {
    const q = useSaved ? this.savedQty(it) : Number(it.quantity) || 0;
    const price = Number(it.ndp || it.rate) || 0;
    return this.round2(price * q);
  }
  totalTaxChangedAmount(it: any, useSaved = false): number {
    const q = useSaved ? this.savedQty(it) : Number(it.quantity) || 0;
    const price = Number(it.ndp || it.rate) || 0;
    const gst = Number(it.gstRate) || 0;
    return this.round2(price * q * (gst / 100));
  }

  get itemsTotalQty(): number {
    return this.orderItems.reduce((s, it) => s + this.savedQty(it), 0);
  }

  get itemsTotalTaxable(): number {
    return this.orderItems.reduce(
      (sum, item) => sum + (Number(item.totalTaxableAmount) || 0),
      0
    );
  }


  get itemsTotalTax(): number {
    return this.orderItems.reduce(
      (sum, item) => sum + (Number(item.taxAmount) || 0),
      0
    );
  }

  get itemsGrandTotal(): number {
    return this.round2(this.orderItems.reduce((s, it) => s + this.lineAmount(it, true), 0));
  }
  get itemsTaxable(): number {
    return this.round2(this.orderItems.reduce((s, it) => s + this.totalTaxableChangedAmount(it, true), 0));
  }
  get itemsTax(): number {
    return this.round2(this.orderItems.reduce((s, it) => s + this.totalTaxChangedAmount(it, true), 0));
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

    // if (!this.canInvoiceView(order)&&!this.canInvoicing(order)) { return; }
    this.InvoiceView = this.canInvoiceView(order);
    this.InvoiceViewButton = this.canInvoiceViewButton(order);
    this.AddDeliveryView = this.AddDeliveryDetailsView(order);


    this.selectedOrder = order;
    this.getOrderItems(order.orderId);

    this.resetInvoiceModal();

    if (this.selectedOrder.isInvoicing) {
      this.getInvoiceDetails(this.selectedOrder?.orderId);
    }

    // Reset selected file
    this.selectedInvoiceFile = null;
    if (this.invoiceFileInput?.nativeElement) {
      this.invoiceFileInput.nativeElement.value = '';
    }

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
    this.invoice = {
      invoiceNumber: '', invoiceDate: '', taxableAmount: 0, taxAmount: 0,
      totalAmount: 0, invoiceFileName: '', invoiceFileUrl: '', docketNumber: ''
    };
    /* this.selectedInvoiceFile = null;*/
    this.isDelivery = false;
    this.selectedInvoiceFile = null;
    this.invoiceTouched = false;
    this.docketTouched = false;
    this.isInvoiceSubmitting = false;


    if (this.invoiceFileInput?.nativeElement) {
      this.invoiceFileInput.nativeElement.value = '';
    }
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

    if (this.invoice.invoiceDate?.trim() > this.today) {
      this.toast.warning('Invoice date cannot be a future date.');
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
    if (this.selectedInvoiceFile) { formData.append('PDF', this.selectedInvoiceFile, this.selectedInvoiceFile.name); }

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
          this.invoice.invoiceDate = data.invoiceDate
            ? data.invoiceDate.split('T')[0]
            : '';
          this.invoice.taxAmount = Number(data.taxAmount ?? 0);
          this.invoice.totalAmount = Number(data.totalAmount ?? 0);
          this.invoice.docketNumber = data.docketNumber || '';
          this.invoice.invoiceFileUrl = data.pdfUrl || '';
          this.invoice.invoiceFileName = this.selectedInvoiceFile?.name || 'View Invoice';
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

  // ================= FILTER METHODS =================

  getStateList(): void {
    this.apis.getStateListReport().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && Array.isArray(res.data)) {
          this.stateList = res.data;
          this.getDealersByState('All');
        } else {
          this.toast.error('Failed fetching state list.');
        }
      },
      error: () => this.toast.error('Something went wrong while fetching state list.')
    });
  }

  getDealersByState(stateName: string): void {
    this.apis.getDealerAccByState({ stateName }).subscribe({
      next: (res: any) => {
        this.dealerList = (res?.statusCode === 200 && Array.isArray(res.data)) ? res.data : [];
      },
      error: () => {
        this.dealerList = [];
        this.toast.error('Something went wrong while fetching dealers.');
      }
    });
  }

  onStateChange(): void {
    this.selectedDealership = 'All';
    this.dealerList = [];
    if (this.selectedState) this.getDealersByState(this.selectedState);
  }

  onDurationChange(): void {
    if (this.selectedDuration !== 'custom') return;
    const now = new Date();
    this.customStartMonth = now.getMonth() + 1;
    this.customStartYear = now.getFullYear();
    this.customEndMonth = now.getMonth() + 1;
    this.customEndYear = now.getFullYear();
  }

  getDateRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const cm = now.getMonth();
    const cy = now.getFullYear();
    let startDate: Date;
    let endDate: Date;

    switch (this.selectedDuration) {
      case 'this Month':
        startDate = new Date(cy, cm, 1);
        endDate = new Date(cy, cm + 1, 0);
        break;
      case 'this Quarter': {
        const qStart = Math.floor(cm / 3) * 3;
        startDate = new Date(cy, qStart, 1);
        endDate = new Date(cy, qStart + 3, 0);
        break;
      }
      case 'this FY': {
        const fyStartYear = cm >= 3 ? cy : cy - 1;
        startDate = new Date(fyStartYear, 3, 1);
        endDate = new Date(fyStartYear + 1, 2, 31);
        break;
      }
      case 'last Quarter': {
        const lqStart = Math.floor(cm / 3) * 3 - 3;
        if (lqStart < 0) {
          startDate = new Date(cy - 1, 9, 1);
          endDate = new Date(cy - 1, 12, 0);
        } else {
          startDate = new Date(cy, lqStart, 1);
          endDate = new Date(cy, lqStart + 3, 0);
        }
        break;
      }
      case 'custom':
        startDate = new Date(this.customStartYear, this.customStartMonth - 1, 1);
        endDate = new Date(this.customEndYear, this.customEndMonth, 0);
        break;
      default:
        startDate = new Date(cy, cm, 1);
        endDate = new Date(cy, cm + 1, 0);
    }
    return { startDate: this.formatDate(startDate), endDate: this.formatDate(endDate) };
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
  }

  onSearch(): void {
    this.getOrders(1);
  }

  clearFilters(): void {
    const now = new Date();
    this.selectedDuration = 'this Month';
    this.selectedState = 'All';
    this.selectedDealership = 'All';
    this.orderIdSearch = '';
    this.customStartMonth = now.getMonth() + 1;
    this.customStartYear = now.getFullYear();
    this.customEndMonth = now.getMonth() + 1;
    this.customEndYear = now.getFullYear();
    this.getDealersByState('All');
    this.getOrders(1);
  }
  canInvoicing(order: any): boolean {
    return (
      (order?.paymentStatus || '').toLowerCase() === 'paid' &&
      !(order?.isInvoicing === true && order?.isDelivered === true) &&
      this.permission.hasSubmenuPermission('UpdateOrderedSparePartHO')
    );
  }
}
