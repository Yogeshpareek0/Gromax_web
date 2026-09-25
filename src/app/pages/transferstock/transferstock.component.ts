import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AuthService } from '../../services/auth.service';
import { getApisResponse, StockRecord } from '../../model/apiresponse';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PaginationComponent } from '../../layout/pagination/pagination.component';
declare var bootstrap: any;


@Component({
  selector: 'app-transferstock',
  imports: [CommonModule, PaginationComponent, FormsModule],
  templateUrl: './transferstock.component.html',
  styleUrl: './transferstock.component.css'
})
export class TransferstockComponent implements OnInit {
  stockrecord: StockRecord[] = [];

  globalFilter: string = '';

  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;


  selectedFile: File | null = null;
  apiresponse: getApisResponse = { message: null, data: null };

  showReturnform: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private http: HttpClient, private apis: AuthService) { }
  dealercode: string = '';
  chassisno: string = '';
  modelcode: string = '';
  billdate: string = '';
  stockId: string = '';
  returnDate: string = '';

  formValid: boolean = false;

  errorMessage: string = '';
  minDate: string = '';
  maxDate: string = '';

  ngOnInit(): void {

    this.getstockrecords();

    const now = new Date();

    // 1st day of current month and year
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.minDate = this.formatDate(firstDayOfMonth);

    // Today’s date
    this.maxDate = this.formatDate(now);
  }

  // Helper function to format Date as yyyy-MM-dd
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;


  }


  searchFilter() {
    this.getstockrecords();
    /*this.globalFilter = '';*/
  }
  downloadExcel(): void {
    const link = document.createElement('a');
    link.href = 'assets/excel/StockFormatSheet.xlsx';
    //link.download = 'StockFormat.xlsx';
    link.download = 'StockFormat.xlsx';
    link.click();
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {

          this.apis.showAlert('warning', 'Oops...', 'Your Excel file has no data. Please upload a file with records.');

          this.selectedFile = null;
          (event.target as HTMLInputElement).value = '';
        } else {
          this.selectedFile = file;
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      this.apis.showAlert('warning', 'Oops...', 'Only .xlsx files are allowed');
      this.selectedFile = null;
      (event.target as HTMLInputElement).value = '';
    }
  }

  submitExcel(): void {
    
    if (!this.selectedFile) {

      this.apis.showAlert('question', 'Required?', 'Please upload an Excel file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const requiredColumns = [
        'DealerCode',
        'BillDate',
        'ModelCode',
        'ChassisNo',
        'InvValue',
      ];
      const sheetColumns = Object.keys(jsonData[0] || {});
      const missingColumns = requiredColumns.filter(col => !sheetColumns.includes(col));
      if (missingColumns.length > 0) {
        this.apis.showAlert(
          'error',
          'Invalid File Format!',
          `Missing required column(s): ${missingColumns.join(', ')}`
        );
        return;
      }

      const filteredData = jsonData.filter(row =>
        requiredColumns.every(col => row[col] !== null && row[col] !== undefined && row[col].toString().trim() !== '')
      );


      if (filteredData.length !== jsonData.length) {
        const invalidRows = jsonData.length - filteredData.length;
        this.apis.showAlert(
          'error',
          'Invalid Data!',
          `There are ${invalidRows} row(s) with missing mandatory values. Please fill all required fields.`
        );
        return;
      }

      const newWs = XLSX.utils.json_to_sheet(filteredData);
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newWs, 'CleanedData');

      const wbout = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
      const cleanedFile = new File([wbout], 'StockFormat.xlsx', { type: 'application/octet-stream' });

      const formData = new FormData();
      formData.append('StockFile', cleanedFile);

      this.apis.insertTransferStock(formData).subscribe({
        next: (data) => {
          
          this.apiresponse = data as getApisResponse;
          if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
            this.apis.showAlert('success', 'Success', 'Stock data has been inserted successfully.');
          } else {
            this.apis.showAlert('error', 'Error!', 'Failed Stock data inserted. Please try again.');
          }
        },
        error: (err) => {
          this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
        }
      });
      this.fileInput.nativeElement.value = '';
      this.selectedFile = null;
    };
    reader.readAsArrayBuffer(this.selectedFile);
  }

  getstockrecords(page: number = 1) {
    const offset = (page - 1) * this.itemsPerPage;

    const payload = {
      skip: offset,
      globalFilter: this.globalFilter
    };

    this.apis.getstockforReturnBilling(payload).subscribe({
      next: (res: any) => {

        if (res.statusCode === 200 && res.data) {
          this.stockrecord = res.data;
          //console.log('newww', JSON.stringify(this.stockrecord));  
          this.totalItems = res.data[0]?.Totalcount ?? res.data.length;
          //this.totalItems = res.data[0]?.TotalCount ?? res.data.length;
          //this.globalFilter = '';
          this.currentPage = page;
        } else {
          this.stockrecord = [];
        }
        //this.currentPage = page;
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'We were unable to retrieve the Stock data. Please try again.');
        this.stockrecord = [];
      }
    });

    //this.apis.getstockforReturnBilling(payload).subscribe({
    //  next: (data) => {

    //  }
  }

  onPageChange(page: number) {
    this.getstockrecords(page);
  }

  submitReturn() {
    
    const payload = {
      id: this.stockId,
      dealerCode: this.dealercode,
      chassisNo: this.chassisno,
      modelCode: this.modelcode,
      billDate: this.billdate,
      returnDate: this.returnDate
    };

    this.apis.ReturnBilling(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          // Success
          this.onCancel();
          this.searchFilter();
          this.apis.showAlert('success', 'Success!', 'Stock data has been added successfully.');

        } else {
          // Any other unexpected response
          this.apis.showAlert('error', 'Error!', 'Unable to insert stock data. Please try again.');
        }
      },
      error: (err) => {
        // Server/network error
        //console.error('Insert Stock API error:', err);
        this.apis.showAlert('error', 'Error!', 'Server error: Unable to insert stock data. Please try again later.');
      }
    });
  }
  onAction(row: StockRecord) {
   
    this.dealercode = row.currentDealercode;
    this.chassisno = row.chasisno;
    this.modelcode = row.modelcode;
    this.billdate = row.BillDate;
    this.stockId = row.Id;

    // Open the modal
    const modalElement = document.getElementById('viewMoreModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
      });
      modal.show();
    }
  }
  onCancel() {
    this.formValid = false;
    this.dealercode = '';
    this.chassisno = '';
    this.modelcode = '';
    this.billdate = '';
    this.stockId = '';
    this.returnDate = '';
    this.globalFilter = '';

    const modalElement = document.getElementById('viewMoreModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  onReturnDateBlur() {
    if (!this.returnDate) {
      this.errorMessage = 'Please select a return date.';
      this.formValid = false;

      return;
    }

    if (this.returnDate < this.minDate || this.returnDate > this.maxDate) {
      this.errorMessage = `Return date must be between ${this.minDate} and ${this.maxDate}.`;
      this.formValid = false;

      this.returnDate = '';
    } else {
      this.errorMessage = '';
      this.formValid = true;
    }
  }
}
