import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { InventoryDataResponse, getApisResponse, InventoryData, filterApisResponse, PersonModel } from '../../model/apiresponse';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})
export class StockComponent implements OnInit {
  inventryData: InventoryData[] = [];
  apiresponse: getApisResponse = { message: null, data: null };
  apiresponses: InventoryDataResponse = { message: null, data: [], totalCount: 0 };
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];
  stateHead: PersonModel[] = [];
  dealerCode: any;
  selectedFilter: string = '';
  startdate_val: string = '';
  enddate_val: string = '';
  displaymodelStyle: string = 'none';
  displayDateInputs: boolean = false;
  positionId: any;
  userName: any;
  showSH = false;
  showAM = false;
  showTM = false;
  showDealer = false;
  selectedSH: string = '';
  enquiryStatus: any = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = '';
  activeAging: string = '-';
  startDay: string = '';
  endDay: string = '';

  paginatedInventryData: InventoryData[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;
  constructor(private http: HttpClient, private apis: AuthService) { }

  ngOnInit(): void {
    this.dealerCode = sessionStorage.getItem('dealerCode');
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');

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
      this.selectedDealer = this.dealerCode;
    }

    this.getinventory();
    this.getHOFilter();
  }

  getinventory(page: number = 1): void {

    const offset = (page - 1) * this.itemsPerPage;
    const { startDateISO, endDateISO } = this.getDateRange();
    var request = {
      Startdate: startDateISO,
      Enddate: endDateISO,
      ShMail: this.showSH ? this.selectedSH || '' : '',
      AmMail: this.showAM ? this.selectedAM || '' : '',
      TmMail: this.showTM ? this.selectedTM || '' : '',
      DealerMail: this.showDealer ? this.selectedDealer || '' : '',
      PageSize: this.itemsPerPage.toString(),
      AgingStartDay: '',
      AgingEndDay: '',
      RowStart: offset.toString()
    }

    this.apis.getAvailableStockData(request).subscribe({
      next: (res) => {
       
        this.apiresponses = res as InventoryDataResponse;
        if (this.apiresponses.message && this.apiresponses.message.toLowerCase() === 'success') {
          this.paginatedInventryData = this.apiresponses.data;
          this.totalItems = this.apiresponses.totalCount;
          this.currentPage = page;
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
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
          this.stateHead = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.stateHead || [])];
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          //console.log('stateHead', this.stateHead);
          //console.log('areaManagersList', this.areaManagersList);
          //console.log('territoryManagersList', this.territoryManagersList);
          //console.log('dealersList', this.dealersList);
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
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
    this.selectedDealer = '';

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
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onAreaChange(mail: string): void {
    
    this.selectedTM = '';
    this.selectedDealer = '';

    const payload = {
      ShMail: this.selectedSH,
      AmMail: mail,
      TmMail: "",
      DealerMail: ""
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onTerritoryChange(mail: string): void {
    this.selectedDealer = '';

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
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onShowReport() {
    this.getinventory();
  }

  getAgeing(billingDate: string | Date): number {
    const billDate = new Date(billingDate);
    const today = new Date();

    const diffTime = today.getTime() - billDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  datefilterchange(value: string) {
    if (value === 'Custom') {
      this.displayDateInputs = true;
    } else {
      this.displayDateInputs = false;
    }
  }

  private getDateRange(): { startDateISO: string, endDateISO: string } {
    let startDateISO = '';
    let endDateISO = '';

    if (this.selectedFilter === 'Month') {
      this.startdate_val = '';
      this.enddate_val = '';
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      startDateISO = this.formatDate(start);
      endDateISO = this.formatDate(end);
      this.displayDateInputs = false;
    }

    else if (this.selectedFilter === 'Quarter') {
      this.startdate_val = '';
      this.enddate_val = '';
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      startDateISO = this.formatDate(start);
      endDateISO = this.formatDate(end);
      this.displayDateInputs = false;
    }

    else if (this.selectedFilter === 'Financial Year') {
      this.startdate_val = '';
      this.enddate_val = '';
      const now = new Date();
      let fyStartYear: number;
      let fyEndYear: number;
      if (now.getMonth() + 1 >= 4) {
        fyStartYear = now.getFullYear();
        fyEndYear = now.getFullYear() + 1;
      } else {
        fyStartYear = now.getFullYear() - 1;
        fyEndYear = now.getFullYear();
      }
      const start = new Date(fyStartYear, 3, 1, 0, 0, 0);
      const end = new Date(fyEndYear, 2, 31, 23, 59, 59);
      startDateISO = this.formatDate(start);
      endDateISO = this.formatDate(end);
      this.displayDateInputs = false;
    }

    else if (this.selectedFilter === 'Custom') {
      this.displayDateInputs = true;
      startDateISO = this.startdate_val;
      endDateISO = this.enddate_val;
    }

    else {
      this.startdate_val = '';
      this.enddate_val = '';
      startDateISO = '';
      endDateISO = '';
      this.displayDateInputs = false;
    }

    return { startDateISO, endDateISO };
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  onPageChange(page: number) {
    this.getinventory(page);
  }

  exportToExcel(): void {
   
    const { startDateISO, endDateISO } = this.getDateRange();

    var request = {
      Startdate: startDateISO,
      Enddate: endDateISO,
      ShMail: this.showSH ? this.selectedSH || '' : '',
      AmMail: this.showAM ? this.selectedAM || '' : '',
      TmMail: this.showTM ? this.selectedTM || '' : '',
      DealerMail: this.showDealer ? this.selectedDealer || '' : '',
      AgingStartDay: '',
      AgingEndDay: ''
    };

    this.apis.getDownloadStockData(request).subscribe({
      next: (res) => {
       
        this.apiresponses = res as InventoryDataResponse;

        if (this.apiresponses.message && this.apiresponses.message.toLowerCase() === 'success') {
          this.inventryData = this.apiresponses.data as InventoryData[];

          if (!this.inventryData || this.inventryData.length === 0) {

            this.apis.showAlert('info', 'No Inventory Found', 'No data found for the selected range.');
            return;
          }

          const maxRows = 1048576;
          let part = 1;

          for (let i = 0; i < this.inventryData.length; i += maxRows) {
            const chunk = this.inventryData.slice(i, i + maxRows);
            const headers = Object.keys(chunk[0]);

            const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(chunk, { header: headers });
            const workbook: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'StockData');

            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });

            const fileName = this.inventryData.length > maxRows
              ? `StockData_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx`
              : `StockData_${new Date().toISOString().split('T')[0]}.xlsx`;

            saveAs(blob, fileName);
            part++;
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

  searchValue(input: HTMLInputElement): void {
    
    const request = {
      ChassisNo: input.value
    };
    this.apis.searchAvailableInventoryReport(request).subscribe({
      next: (res) => {
        
        this.apiresponses = res as InventoryDataResponse;
        if (this.apiresponses.message && this.apiresponses.message.toLowerCase() === 'success') {
          this.paginatedInventryData = this.apiresponses.data;
          this.totalItems = this.paginatedInventryData.length;
          this.currentPage = 1;
          input.value = '';
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

}
