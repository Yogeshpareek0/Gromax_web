import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { getApisResponse, EnquiryList, filterApisResponse, PersonModel, Leads, getEnquiryApisResponse } from '../../model/apiresponse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


@Component({
  selector: 'app-salesman',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './salesman.component.html',
  styleUrl: './salesman.component.css'
})
export class SalesmanComponent implements OnInit {

  kycList: any[] = [];
  kycListDonwload: any[] = [];
  kycBatchId: string = '';
  selectedKycIds: string[] = [];

  // ── Reject modal state ──────────────────────────────────────────────────
  showRejectModal: boolean = false;
  rejectTargetItem: any = null;
  rejectRemark: string = '';
  rejectSubmitClicked: boolean = false;

  activeTab: string = 'list';
  salesmanList: any[] = [];

  apiresponse: getApisResponse = { message: null, data: null };
  apiresponses: getEnquiryApisResponse = { message: null, data: null, leads: null, totalCount: 0 };
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];
  stateHead: PersonModel[] = [];

  positionId: any;
  userName: any;
  showAM = false;
  showTM = false;
  showSH = false;
  isDealer: boolean = false;
  showDealer = false;
  enquiryStatus: any = '';
  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = '';
  misstatus: string = '';
  name: string = '';
  mobile: string = '';
  email: string = '';
  submitClicked = false;
  status: string = '';
  kycstatus: string = '';
  ApprovalStatus: string = '';
  kycdetail: boolean = false;
  file1: File | null = null;
  file2: File | null = null;
  file3: File | null = null;
  Id: string = '';
  selectedStatus: string = '';
  selectetdDealercode: string = '';
  dateofjoin: Date | null = null;
  dateofseperation: Date | null = null;


  constructor(private http: HttpClient, private apis: AuthService, private fb: FormBuilder,
    private route: ActivatedRoute) { }
  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    const dealercode = sessionStorage.getItem('dealerCode');
    this.misstatus = sessionStorage.getItem('misstatus') || '';
    this.isDealer = this.positionId === 'Dealer';

    //if (this.positionId === 'National Sales Head' || this.positionId === 'State Head') {
    //  this.showKyc();
    //}

    if (this.positionId === 'National Sales Head') {
      this.showSH = true;
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
    } else if (this.positionId === 'State Head') {
      this.showSH = false;
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
    } else if (this.positionId === 'Area Manager') {
      this.showSH = false;
      this.showAM = false;
      this.showTM = true;
      this.showDealer = true;
    } else if (this.positionId === 'Territory Manager') {
      this.showSH = false;
      this.showAM = false;
      this.showTM = false;
      this.showDealer = true;
    } else {
      this.showSH = false;
      this.showAM = false;
      this.showTM = false;
      this.showDealer = false;
      this.selectedDealer = dealercode || '';
    }

    this.getHOFilter();
    if (this.positionId === 'Territory Manager' || this.misstatus?.toLowerCase() === 'yes' || this.positionId?.toLowerCase() === 'dealer' || this.positionId === 'National Sales Head') {
      this.onShowReport();
    }
  }

  // ─── KYC Status dropdown change ───────────────────────────────────────────
  onKycStatusChange(): void {
    if (this.kycstatus === 'Yes') {
      this.kycdetail = true;
    } else {
      this.kycdetail = false;
      this.file1 = null;
      this.file2 = null;
      this.file3 = null;
    }
  }

  // ─── File input change ────────────────────────────────────────────────────
  onFileChange(event: any, field: string): void {
    const file = event.target.files[0];
    if (!file) return;
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];
    if (!allowedTypes.includes(file.type)) {
   /*   alert('Only PDF, JPG, PNG files allowed');*/
      this.apis.showAlert('error', 'Error!', 'Only PDF, JPG, PNG files allowed.');
      event.target.value = '';
      return;
    }
    (this as any)[field] = file;
  }

  // ─── Angular lifecycle ────────────────────────────────────────────────────

  // ─── Filter APIs ──────────────────────────────────────────────────────────
  onStateChange(mail: string): void {
    this.selectedAM = '';
    this.selectedTM = '';
    this.selectedDealer = '';

    const payload = { ShMail: mail, AmMail: '', TmMail: '', DealerMail: '' };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.areaManagersList = this.apiresponse.data.areaManagers || [];
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.dealersList = this.apiresponse.data.dealers || [];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to fetch filter data. Please try again.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.')
    });
  }

  onAreaChange(mail: string): void {
    this.selectedTM = '';
    this.selectedDealer = '';

    const payload = { ShMail: this.selectedSH, AmMail: mail, TmMail: '', DealerMail: '' };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.dealersList = this.apiresponse.data.dealers || [];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to fetch filter data. Please try again.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.')
    });
  }

  onTerritoryChange(mail: string): void {
    this.selectedDealer = '';

    const payload = { ShMail: this.selectedSH, AmMail: this.selectedAM, TmMail: mail, DealerMail: '' };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.dealersList = this.apiresponse.data.dealers || [];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to fetch filter data. Please try again.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.')
    });
  }

  getHOFilter(): void {
    const request = { ShMail: '', AmMail: '', TmMail: '', DealerMail: '' };
    this.apis.getHOFilter(request).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.stateHead = this.apiresponse.data.stateHead || [];
          this.areaManagersList = this.apiresponse.data.areaManagers || [];
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.dealersList = this.apiresponse.data.dealers || [];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to fetch filter data. Please try again.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Failed to fetch filter data. Please try again.')
    });
  }

  // ─── Tab navigation ───────────────────────────────────────────────────────
  showCreate(): void {
    this.resetFormFields();
    this.kycstatus = '';
    this.Id = '';
    this.ApprovalStatus = '';
    //this.ApprovalStatus = 'Document Pending';
    this.activeTab = 'create';
  }

  showList(): void {
    this.activeTab = 'list';
    this.submitClicked = false;
    this.onShowReport();
  }

  // ─── List / Report ────────────────────────────────────────────────────────
  onShowReport(): void {
   
    const request = {
      ShMail: this.selectedSH,
      AmMail: this.selectedAM,
      TmMail: this.selectedTM,
      DealerMail: this.selectedDealer
    };
    this.apis.getSalesmanList(request).subscribe({
      next: (res) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.salesmanList = this.apiresponse.data as [];
        } else {
          this.apis.showAlert('error', 'Error!', 'Data fetching failed. Please try again.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while submitting data. Please try again.')
    });
  }

  // ─── Row click (Update mode) ──────────────────────────────────────────────
  onRowClick(item: any): void {
  
    this.resetFormFields();
    this.Id = item.Id;
    this.selectedDealer = item.DealerCode;
    this.mobile = item.MobileNo;
    this.email = item.Email;
    this.name = item.SalesmanName;
    this.status = item.ActiveStatus;
    this.ApprovalStatus = item.ApprovalSataus;
    this.dateofjoin = item.dateofjoin
      ? item.dateofjoin.substring(0, 10)
      : '';
    //this.activeTab = 'create';

    const kycEditable = this.ApprovalStatus === 'Document Pending' || this.ApprovalStatus === 'Reject';
    if (!kycEditable) {
      this.kycstatus = '';
      this.kycdetail = false;
    } else {
      this.kycstatus = item.KycStatus === 1 ? 'Yes' : 'No';
    }

    this.activeTab = 'update';
  }

  // ─── Submit (Insert / Update) ─────────────────────────────────────────────
  onSubmitSalesman(): void {
   
    this.submitClicked = true;

    if (!this.selectedDealer || !this.name || !this.mobile || !/^[0-9]{10}$/.test(this.mobile) || !this.status || !this.dateofjoin) {
      return;
    }

    const kycRequired = this.activeTab === 'create' ||
      (this.activeTab === 'update' && (this.ApprovalStatus === 'Document Pending' || this.ApprovalStatus === 'Reject'));

    if (kycRequired && !this.kycstatus) {
      return;
    }

    if (this.kycstatus === 'Yes') {
      if (!this.file1 || !this.file2 || !this.file3) {
        return;
      }
    }

    const payload = new FormData();
    payload.append('DealerCode', this.selectedDealer);
    payload.append('DealerName', '');
    payload.append('SalesmanName', this.name);
    payload.append('MobileNo', this.mobile.toString());
    payload.append('Status', this.status);
    payload.append('KycStatus', this.kycstatus);
    payload.append('insertORupdt', this.activeTab);
    payload.append('Id', this.Id);
    payload.append('dateofjoin', String(this.dateofjoin));
    payload.append('dateofseperation', String(this.dateofseperation));

    if (this.kycstatus === 'Yes' && this.file1 && this.file2 && this.file3) {
      payload.append('File1', this.file1);
      payload.append('File2', this.file2);
      payload.append('File3', this.file3);
    }

    this.apis.insertSalesman(payload).subscribe({
      next: (res: any) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          const msg = this.activeTab === 'create' ? 'Salesman created successfully!' : 'Salesman updated successfully!';
          this.apis.showAlert('success', 'Success', msg);
          this.resetFormFields();
          this.showList();
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to save salesman. Try again.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while submitting data. Please try again.')
    });
  }

  // ─── Reset helpers ────────────────────────────────────────────────────────
  resetFormFields(): void {
    this.name = '';
    this.mobile = '';
    this.email = '';
    this.status = '';
    this.kycstatus = '';
    this.kycdetail = false;
    this.file1 = null;
    this.file2 = null;
    this.file3 = null;
    this.ApprovalStatus = '';
    this.Id = '';
    this.submitClicked = false;
    this.dateofjoin = null;
    if (this.positionId !== 'Dealer') {
      this.selectedDealer = '';
    }
  }

  // ─── Utility ─────────────────────────────────────────────────────────────
  isMobileValid(mobile: string): boolean {
    return /^[0-9]{10}$/.test(mobile);
  }

  allowNumbersOnly(event: KeyboardEvent): void {
    const charCode = event.charCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  // ─── KYC Tab ──────────────────────────────────────────────────────────────
  showKyc(): void {
    this.activeTab = 'kyc';
    this.selectedKycIds = [];
    this.onLoadKycList();
  }

  onStatusChange() {
    this.onLoadKycList();
  }

  onLoadKycList(): void {
    const payload = {
      ShMail: '',
      AmMail: '',
      TmMail: '',
      DealerMail: '',
      Status: this.selectedStatus,
      Download: 'No'
    };
    this.apis.getKycPendingList(payload).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.kycList = res.data || [];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to load KYC list.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching KYC data.')
    });
  }

  // ─── Approve action (direct — no modal) ──────────────────────────────────
  onKycAction(item: any, action: 'Reject' | 'Approved'): void {
    const payload = {
      Id: item.id,
      Status: action,
      Dealercode: item.dealercode,
      BatchId: Number(item.batchid),
      Remark: ''
    };

    this.apis.submitKycAction(payload).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success',
            `Salesman ${action === 'Approved' ? 'approved' : 'rejected'} successfully!`);
          this.selectedKycIds = this.selectedKycIds.filter(id => id !== item.id);
          this.onLoadKycList();
        } else {
          this.apis.showAlert('error', 'Error!', `Failed to ${action.toLowerCase()} salesman.`);
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.')
    });
  }

  // ─── Reject Modal methods ─────────────────────────────────────────────────

  /** Reject button click → modal kholao, item store karo */
  openRejectModal(item: any): void {
    this.rejectTargetItem = item;
    this.rejectRemark = '';
    this.rejectSubmitClicked = false;
    this.showRejectModal = true;
  }

  /** Modal band karo, state clear karo */
  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectTargetItem = null;
    this.rejectRemark = '';
    this.rejectSubmitClicked = false;
  }

  /** Textarea input pe word limit enforce karo (max 100 words) */
  onRemarkInput(): void {
    const words = this.rejectRemark.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 100) {
      this.rejectRemark = words.slice(0, 100).join(' ');
    }
  }

  /** Word count getter — template mein use hoga */
  get remarkWordCount(): number {
    return this.rejectRemark.trim() === ''
      ? 0
      : this.rejectRemark.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  /** Remark blank hai ya nahi — template mein regex avoid karne ke liye */
  get remarkHasContent(): boolean {
    return this.rejectRemark.trim().length > 0;
  }

  /** "Confirm Reject" button → validate, phir API call */
  confirmReject(): void {
    this.rejectSubmitClicked = true;

    if (!this.remarkHasContent) {
      return;
    }

    const item = this.rejectTargetItem;
    const payload = {
      Id: item.id,
      Status: 'Reject',
      Dealercode: item.dealercode,
      BatchId: Number(item.batchid),
      Remark: this.rejectRemark.trim()
    };

    this.apis.submitKycAction(payload).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success', 'Salesman rejected successfully!');
          this.selectedKycIds = this.selectedKycIds.filter(id => id !== item.id);
          this.closeRejectModal();
          this.onLoadKycList();
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to reject salesman.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.');
      }
    });
  }

  // ─── Checkbox helpers (batch select — future use) ─────────────────────────
  isKycSelected(id: string): boolean {
    return this.selectedKycIds.includes(id);
  }

  onKycCheckChange(id: string): void {
    if (this.isKycSelected(id)) {
      this.selectedKycIds = this.selectedKycIds.filter(x => x !== id);
    } else {
      this.selectedKycIds.push(id);
    }
  }

  onSelectAll(event: any): void {
    this.selectedKycIds = event.target.checked ? this.kycList.map(x => x.id) : [];
  }

  isAllSelected(): boolean {
    return this.kycList.length > 0 && this.selectedKycIds.length === this.kycList.length;
  }

  exportToExcel(): void {

    if (this.activeTab === 'list') {

      if (!this.salesmanList || this.salesmanList.length === 0) {
        /*alert('No data available to download.');*/
        this.apis.showAlert('error', 'Error!', 'No data available to download.');
        return;
      }

      const maxRows = 1048576;
      let part = 1;

      for (let i = 0; i < this.salesmanList.length; i += maxRows) {

        const chunk = this.salesmanList
          .slice(i, i + maxRows)
          .map(item => ({
            "Salesman Name": item.SalesmanName,
            "Mobile No": item.MobileNo,
            "Dealer Code": item.DealerCode,
            "Dealer Name": item.DealerName,
            "Active Status": item.ActiveStatus,
            "Date of Join": item.dateofjoin,
            "Approval Status": item.ApprovalSataus
          }));

        const worksheet = XLSX.utils.json_to_sheet(chunk, {
          header: Object.keys(chunk[0])
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Salesman List');

        const wbout = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array'
        });

        const blob = new Blob([wbout], {
          type: 'application/octet-stream'
        });

        saveAs(
          blob,
          this.salesmanList.length > maxRows
            ? `Salesman_List_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx`
            : `Salesman_List_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        part++;
      }

      return;
    }

    const payload = {
      ShMail: '',
      AmMail: '',
      TmMail: '',
      DealerMail: '',
      Status: this.selectedStatus,
      Download: 'Yes'

    };

    this.apis.getKycPendingList(payload).subscribe({
      next: (res: any) => {

        if (res?.message?.toLowerCase() !== 'success') {
          this.apis.showAlert('error', 'Error!', 'Failed to load KYC list.');
          return;
        }

        this.kycListDonwload = res.data || [];

        if (!this.kycListDonwload.length) {
          this.apis.showAlert('info', 'No Data', 'No data found.');
          return;
        }

        const maxRows = 1048576;
        let part = 1;

        for (let i = 0; i < this.kycListDonwload.length; i += maxRows) {

          const chunk = this.kycListDonwload.slice(i, i + maxRows);

          const worksheet = XLSX.utils.json_to_sheet(chunk, {
            header: Object.keys(chunk[0])
          });

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'KYC List');

          const wbout = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
          });

          const blob = new Blob([wbout], {
            type: 'application/octet-stream'
          });

          saveAs(
            blob,
            this.kycListDonwload.length > maxRows
              ? `KYC_List_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx`
              : `KYC_List_${new Date().toISOString().split('T')[0]}.xlsx`
          );

          part++;
        }
      },

      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching KYC data.');
      }
    });
  }
}
