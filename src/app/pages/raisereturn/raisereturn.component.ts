import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { getApisResponse, EnquiryList, filterApisResponse, PersonModel, Leads, getEnquiryApisResponse } from '../../model/apiresponse';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-raisereturn',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './raisereturn.component.html',
  styleUrl: './raisereturn.component.css'
})
export class RaisereturnComponent implements OnInit {
  searchValue: string = '';
  searchType: string = '';
  isDealer: boolean = false;

  showTableSection: boolean = true;

  searchHistoryValue: string = '';
  searchHistoryType: string = '';
  message: string = '';

  name: string = '';
  saleDate: any = '';
  model: string = '';
  remark: string = '';
  status: string = '';
  returnDate: any = '';
  returnType: string = 'Pending';

  apiresponse: getApisResponse = { message: null, data: null };
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];
  stateHead: PersonModel[] = [];

  returnList: any[] = [];
  statusHistoryList: any[] = [];
  saleHistoryList: any[] = [];
  menuList: any[] = [];

  positionId: any;
  userName: any;
  showAM = false;
  showTM = false;
  showSH = false;
  showDealer = false;
  dealercode: any;
  enquiryStatus: any = '';
  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = 'All';

  customerName: string = '';
  chassisNumber: string = '';
  mobileNumber: string = '';
  modelSales: string = '';
  saleDateReturn: string = '';
  soldBy: string = '';
  returnReason: string = '';
  remarkReturn: string = '';
  SalesEnquiryMasterId: string = '';

  tmStatus: string = '';
  nationalSalesHeadStatus: string = '';
  tmRemarks: string = '';
  stateHeadStatus: string = '';
  stateHeadRemarks: string = '';
  NationalSalesHeadRemarks: string = '';
  returnRequestId: string = '';
  showButtons = false;
  submitted = false;
  misstatus = '';

  isSuperAdmin: boolean = false;



  activeTab: 'vehicle' | 'history' = 'vehicle';

  constructor(private http: HttpClient, private apis: AuthService, private fb: FormBuilder,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    this.misstatus = sessionStorage.getItem('misstatus') || '';
    this.dealercode = sessionStorage.getItem('dealerCode');
    if (this.positionId === 'National Sales Head') {
      this.showSH = true;
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
    }
    else if (this.positionId === 'State Head') {
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
      this.selectedDealer = this.dealercode;
    }

    const data = sessionStorage.getItem('MenuList');

    this.menuList = data ? JSON.parse(data) : [];
    this.isSuperAdmin = this.hasSubMenu('SuperAdmin', 'SuperAdmin');
   
    this.isDealer = (
      this.positionId === 'Dealer' || this.misstatus.toLowerCase() === 'yes'
    );

    this.getReturnRequestmaster();
    this.getHOFilter();
  }

  onTerritoryChange(mail: string): void {

    this.selectedDealer = 'All';

    const payload = {
      ShMail: this.selectedSH,
      AmMail: this.selectedAM,
      TmMail: mail,
      DealerMail: ""
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.dealersList = this.apiresponse.data.dealers || [];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to fetch filter data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onStateChange(mail: string): void {

    this.selectedAM = '';
    this.selectedTM = '';
    this.selectedDealer = 'All';

    const payload = {
      ShMail: mail,
      AmMail: "",
      TmMail: "",
      DealerMail: ""
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.areaManagersList = this.apiresponse.data.areaManagers || [];
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.dealersList = this.apiresponse.data.dealers || [];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to fetch filter data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  getHOFilter(): void {

    const request = {
      ShMail: "",
      AmMail: "",
      TmMail: "",
      DealerMail: "",
    };

    this.apis.getHOFilter(request).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.stateHead = this.apiresponse.data.stateHead || [];
          this.areaManagersList = this.apiresponse.data.areaManagers || [];
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.dealersList = this.apiresponse.data.dealers || [];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to fetch filter data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onSearchTypeChange() {
    this.searchValue = '';
  }

  onSearchHistoryTypeChange() {
    this.searchHistoryValue = ''
  }

  openEnquiryModal(enquiryId: string): void {
    this.activeTab = 'vehicle';
    this.message = '';
    this.remark = '';
    this.getStatusHistory(enquiryId);

    var request = {
      DealerCode: this.selectedDealer,
      SearchType: this.searchType,
      SearchValue: this.searchValue,
      ReturnType: this.returnType
    }
    this.apis.getReturnRequestmaster(request).subscribe({
      next: (res: any) => {

        if (res && res.message.toLowerCase() === 'success') {
          const data = res.data.find((x: any) => x.Id === enquiryId);

          if (!data) {
            this.apis.showAlert('error', 'Error!', 'No data found for selected enquiry.');
            return;
          }

          this.returnRequestId = enquiryId;
          this.name = data.CustomerName || '';
          this.model = data.Model || '';
          this.saleDate = this.formatDate(data.SaleDate);
          this.returnDate = this.formatDate(data.ReturnDate);
          this.status = data.ReturnStatus || '';

          this.tmStatus = data.TmStatus || '';
          this.tmRemarks = data.TmRemarks || '';
          this.nationalSalesHeadStatus = data.NationalsalesHeadStatus || '';
          this.stateHeadStatus = data.StateHeadStatus || '';
          this.stateHeadRemarks = data.StateHeadRemarks || '';
          this.NationalSalesHeadRemarks = data.NationalSalesHeadRemarks || '';

          if (this.positionId === 'Territory Manager') {
            this.remark = this.tmRemarks || '';
            if (this.tmStatus === 'Pending') {
              this.showButtons = true;
            }
            else if (this.stateHeadStatus === 'Reject') {
              this.message = 'The request has been rejected by the State Head(SH). You can`t approve or reject this request';
              this.showButtons = false;
            }
            else {
              this.showButtons = false;
            }
          }
          else if (this.positionId === 'State Head') {
            this.remark = this.stateHeadRemarks || '';
            if (this.tmStatus === 'Approved' &&
              (this.stateHeadStatus !== 'Approved' && this.stateHeadStatus !== 'Reject')
            ) {
              this.showButtons = true;
            }
            else if (this.tmStatus === 'Reject') {
              this.message = 'The request has been rejected by the Territory Manager(TM). You can`t approve or reject this request';
            }
            else {
              this.showButtons = false;
            }
          }

          else if (this.positionId === 'National Sales Head') {
            this.remark = this.NationalSalesHeadRemarks || '';
            if (this.tmStatus === 'Approved' && this.stateHeadStatus === 'Approved' &&
              (this.nationalSalesHeadStatus !== 'Approved' && this.nationalSalesHeadStatus !== 'Reject')
            ) {
              this.showButtons = true;
            }
            else if (this.stateHeadStatus === 'Reject') {
              this.message = 'The request has been rejected by the State Head(SH). You can`t approve or reject this request';
            }
            else {
              this.showButtons = false;
            }
          }


          const modalEl = document.getElementById('viewMoreModal');
          if (modalEl) {
            const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
            modal.show();
          }
        } else {
          this.apis.showAlert('error', 'Error!', 'Data fetching failed. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.');
      }
    });
  }

  formatDate(dateStr: any): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }

  getReturnRequestmaster(): void {

    var request = {
      DealerCode: this.selectedDealer,
      SearchType: this.searchType,
      SearchValue: this.searchValue,
      ReturnType: this.returnType
    }

    this.apis.getReturnRequestmaster(request).subscribe({
      next: (res) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.returnList = this.apiresponse.data as [];

        }
        else {
          this.apis.showAlert('error', 'Error!', 'Data fetching failed. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while submitting data. Please try again.');
      }
    });
  }

  onShowReport(): void {
    this.getReturnRequestmaster();
  }

  onHistoryReport(): void {

    this.showTableSection = true;

    var request = {
      DealerCode: this.selectedDealer,
      SearchType: this.searchHistoryType,
      SearchValue: this.searchHistoryValue
    }

    this.apis.getSalesDetailsForReturnRequest(request).subscribe({
      next: (res) => {
        this.apiresponse = res as getApisResponse;

        if (Array.isArray(res)) {
          this.saleHistoryList = res;
        }

        else {
          this.apis.showAlert('error', 'Error!', 'Data fetching failed. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.');
      }
    });
  }

  getStatusHistory(enquiryId: string): void {
    var request = {
      ReturnRequestId: enquiryId
    }

    this.apis.getStatusHistory(request).subscribe({
      next: (res) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {

          this.statusHistoryList = this.apiresponse.data as [];
        }
        else {
          this.apis.showAlert('error', 'Error!', 'Data fetching failed. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while submitting data. Please try again.');
      }
    });
  }

  onAddNew(): void {
    const modalEl = document.getElementById('saleHistoryList');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      modal.show();
    }
  }

  onRowClick(id: number): void {
    const selectedItem = this.saleHistoryList.find(item => item.Id === id);
    if (!selectedItem) return;

    this.SalesEnquiryMasterId = selectedItem.SalesEnquiryID;
    this.customerName = selectedItem.CustomerName;
    this.customerName = selectedItem.CustomerName;
    this.chassisNumber = selectedItem.ChassisNumber;
    this.mobileNumber = selectedItem.Mobile;
    this.modelSales = selectedItem.Model;
    this.saleDateReturn = this.formatDateForInput(selectedItem.CreateDate);
    this.soldBy = selectedItem.SoldBy;
    this.returnReason = '';
    this.remarkReturn = '';

    this.showTableSection = false;
  }

  submitReturn(): void {
    this.submitted = true;

    if (!this.returnReason || this.returnReason.trim() === '' ||
      !this.remarkReturn || this.remarkReturn.trim() === '') {
      this.apis.showAlert('error', 'Validation', 'Please fill all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('CustomerName', this.customerName || '');
    formData.append('ChasisNumber', this.chassisNumber || '');
    formData.append('Mobile', this.mobileNumber || '');
    formData.append('Modeln', this.modelSales || '');
    formData.append('SaleDate', this.saleDateReturn || '');
    formData.append('SoldBy', this.soldBy || '');
    formData.append('Reason', this.returnReason || '');
    formData.append('Remarks', this.remarkReturn || '');
    formData.append('DealerCode', this.selectedDealer || '');
    formData.append('SalesEnquiryMasterId', this.SalesEnquiryMasterId?.toString() || '');

    this.apis.generateReturnRequest(formData).subscribe({
      next: (res) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          const result = this.apiresponse.data?.toString().toLowerCase() || '';

          if (result.includes('inserted successfully')) {
            this.apis.showAlert('success', 'Success', 'Return inserted successfully').then(() => {
              this.closeSaleModal();
              window.location.reload();
            });
          }
          else if (result.includes('not inserted')) {
            this.apis.showAlert('error', 'Failed', 'Return inserted failed').then(() => {
              this.closeSaleModal();
              window.location.reload();
            });
          }
          else {
            this.apis.showAlert('error', 'Failed', 'Return inserted failed').then(() => {
              this.closeSaleModal();
              window.location.reload();
            });
          }
        }
        else {
          this.apis.showAlert('error', 'Error!', 'Return failed. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.');
      }
    });
  }

  formatDateForInput(date: string | Date): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  closeSaleModal(): void {
    const modalEl = document.getElementById('saleHistoryList');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    this.showTableSection = true;
    this.searchHistoryValue = '';
    this.searchHistoryType = '';
    this.saleHistoryList = [];
  }

  onStatusChange(status: string): void {

    if (!this.remark || this.remark.trim() === '') {
      this.message = 'Please enter a remark before proceeding.';
      return;
    }
    this.message = '';

    const request = {
      ReturnRequestId: this.returnRequestId,
      Remarks: this.remark,
      Status: status,
      Position: this.positionId
    };

    this.apis.returnRequestApproval(request).subscribe({
      next: (res: any) => {

        if (res.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success', `Return ${status} successfully!`).then(() => {
            const modalEl = document.getElementById('viewMoreModal');
            if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
            }
            this.getReturnRequestmaster();
          });
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to update status.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while submitting data. Please try again.');
      }
    });
  }

  getPendingOn(item: any): string {

    if (item.TmStatus === 'Pending') {
      return 'Territory Manager';
    } else if (item.StateHeadStatus === 'Pending') {
      return 'State Head';
    }
    else if (item.NationalsalesHeadStatus === 'Pending') {
      return 'National Sales Head';
    }
    else {
      return 'NONE';
    }
  }

  hasSubMenu(mainMenu: string, subMenu: string): boolean {
    return this.menuList.some(
      (x: any) =>
        x.MainMenu === mainMenu &&
        x.SubMenu === subMenu
    );
  }

}
