import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getApisResponse, InventoryData } from '../../model/apiresponse';

declare var bootstrap: any;
@Component({
  selector: 'app-stocktransfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stocktransfer.component.html',
  styleUrl: './stocktransfer.component.css'
})
export class StocktransferComponent implements OnInit {
  stockTransferList: InventoryData[] = [];
  transferredList: any[] = [];
  totalTransferredList: any[] = [];
  transferredReceivedList: any[] = [];
  dealerList: any[] = [];
  apiresponse!: getApisResponse;
  dealerCode: any;
  positionId: any;
  userName: any;
  stateCode: any;

  selectedStock: any;
  activeTab: string = 'myStock';
  selectedDealer: string = '';
  stockId: string = '';


  menuList: any[] = [];
  isSuperAdmin: boolean = false;

  constructor(private http: HttpClient, private apis: AuthService) { }

  ngOnInit(): void {
    this.dealerCode = sessionStorage.getItem('dealerCode');
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    this.stateCode = sessionStorage.getItem('stateCode');

    const data = sessionStorage.getItem('MenuList');

    this.menuList = data ? JSON.parse(data) : [];
    this.isSuperAdmin = this.hasSubMenu('SuperAdmin', 'SuperAdmin');

    if (this.positionId === 'Dealer') {
      this.activeTab = 'myStock';
      this.getStockForStockTransfer();
    } else {
      this.activeTab = '';
      this.getStockTransferredList();
    }
  }

  getStockForStockTransfer(): void {

    var request = {
      SearchBy: '',
    }

    this.apis.getStockForStockTransfer(request).subscribe({
      next: (res) => {

        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.stockTransferList = this.apiresponse.data;

        }
        else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;

    if (tab === 'myStock') {
      this.getStockForStockTransfer();
    } else if (tab === 'transferred') {
      this.getStockTransferredList();
    }
    else if (tab === 'received') {
      this.getStockTransferredList();
    }
  }

  searchValue(input: HTMLInputElement): void {
    const request = {
      SearchBy: input.value
    };
    this.apis.getStockForStockTransfer(request).subscribe({
      next: (res) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.stockTransferList = this.apiresponse.data;
        }
        else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  getStockTransferredList(): void {
    this.apis.getStockTrfApproval().subscribe({
      next: (res) => {

        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.totalTransferredList = this.apiresponse.data
          if (this.dealerCode) {
            this.transferredList = this.apiresponse.data.filter(
              (x: any) => x.DealerCodeFrom == this.dealerCode
            );

            this.transferredReceivedList = this.apiresponse.data.filter(
              (x: any) => x.DealerCodeTo == this.dealerCode
            );
          }


        }
        else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  dealerListStatewise(): void {

    var request = {
      StateCode: this.stateCode,
    }

    this.apis.dealerListStatewise(request).subscribe({
      next: (res) => {

        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          if (this.dealerCode || this.isSuperAdmin) {
            this.dealerList = this.apiresponse.data.filter(
              (x: any) => x.DealerCode !== this.dealerCode
            );
          }

        }
        else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  transferStock(item: any) {

    this.selectedStock = item;
    const modalEl = document.getElementById('stocktransferModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      this.dealerListStatewise();
      modal.show();
    }
  }

  closetransferModal(): void {
    const modalEl = document.getElementById('stocktransferModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
      this.selectedStock = null;
    }
  }

  confirmTransfer(): void {
    if (!this.selectedDealer || !this.selectedStock) {
      this.apis.showAlert('warning', 'Required', 'Please select dealer before proceeding.');
      return;
    }

    const request = {
      ChassisNo: this.selectedStock.chasisno,
      DealerCodeFrom: this.dealerCode,
      DealerCodeTo: this.selectedDealer,
      StockId: this.selectedStock.Id
    };

    this.apis.dlrToDlrStockTransfer(request).subscribe({
      next: (res) => {

        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success', 'Stock transferred successfully!')
            .then(() => {
              this.closetransferModal();
              this.getStockForStockTransfer();
            });
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to transfer stock.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  approveStock(item: any, status: string) {

    const request = {
      Position: item.PendingOn,
      Status: status,
      Reason: '',
      Remarks: '',
      DlrToDlrStkTrfMasterId: item.Id
    };

    this.apis.stockTrfApproval(request).subscribe({
      next: (res: any) => {

        if (res.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success', 'Stock approved successfully!')
            .then(() => {
              if (item.PendingOn == 'Dealer To' && !this.isSuperAdmin) {
                this.activeTab = 'received';
                this.getStockTransferredList();
              }
              else {
                this.activeTab = '';
                this.getStockTransferredList();
              }
            });
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed to approve stock.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while approving stock.');
      }
    });
  }

  hasSubMenu(mainMenu: string, subMenu: string): boolean {
    return this.menuList.some(
      (x: any) =>
        x.MainMenu === mainMenu &&
        x.SubMenu === subMenu
    );
  }
}
