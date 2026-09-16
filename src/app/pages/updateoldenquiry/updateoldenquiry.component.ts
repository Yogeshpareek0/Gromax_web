import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { getApisResponse, PersonModel, filterApisResponse, DeliveryEnquiryList } from '../../model/apiresponse';

declare var bootstrap: any;

@Component({
  selector: 'app-updateoldenquiry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent],
  templateUrl: './updateoldenquiry.component.html',
  styleUrl: './updateoldenquiry.component.css'
})
export class UpdateoldenquiryComponent implements OnInit {
  positionId: any;
  userName: any;
  dealercode: any;
  selectedCategory: string = '';

  apiresponse: getApisResponse = { message: null, data: null };
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];
  locationlist: PersonModel[] = [];
  statelist: PersonModel[] = [];
  stateHead: PersonModel[] = [];

  showAM = false;
  showTM = false;
  showSH = false;
  showDealer = false;
  showStatename = false;

  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = '';
  selectedStateName: string = '';

  showLocation = false;
  selectedLocation: string = '';

  paginatedDeliveryEnquiryList: DeliveryEnquiryList[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  globalFilter: string = '';

  private modal: any;

  selectedItem: DeliveryEnquiryList | null = null;
  liquidationForm!: FormGroup;
  isSubmitted = false;
  isSubmitting = false;

  constructor(
    private http: HttpClient,
    private apis: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    this.dealercode = sessionStorage.getItem('dealerCode');

    if (this.positionId === 'National Sales Head') {
      this.showSH = true;
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;

    } else if (this.positionId === 'State Head') {
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;

    } else if (this.positionId === 'Area Manager') {
      this.showTM = true;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;

    } else if (this.positionId === 'Territory Manager') {
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;
    }

    this.getHOFilter();
    this.exchangeStockList();

    this.liquidationForm = this.fb.group({
      finalSellingPrice: [null, [Validators.required, Validators.min(100000), Validators.max(999999)]],
      dpAmount: [null, [Validators.required, Validators.max(999999)]]
    });
  }

  get f() { return this.liquidationForm.controls; }

  formatDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onRowClick(item: DeliveryEnquiryList) {
    this.selectedItem = item;
    this.liquidationForm.reset();
    const modalEl = document.getElementById('viewExchangeStockModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      this.modal.show();
    }
  }

  onPageChange(page: number) {
    this.exchangeStockList(page);
  }

  exchangeStockList(page: number = 1) {
    const offset = (page - 1) * this.itemsPerPage;
    const payload = {
      shMail: this.showSH ? this.selectedSH : '',
      amMail: this.showAM ? this.selectedAM : '',
      tmMail: this.showTM ? this.selectedTM : '',
      dealerMail: this.showDealer ? this.selectedDealer : '',
      pageSize: this.itemsPerPage,
      rowStart: offset,
      SearchText: this.globalFilter?.trim() || '',
      selectedCategory: this.selectedCategory?.trim() || '',
      location: this.selectedLocation?.trim() || '',
      StateCode: this.selectedStateName?.trim() || ''
    };

    this.apis.getOldEnquiry(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.paginatedDeliveryEnquiryList = res.data;
          this.totalItems = res.data[0]?.TotalCount ?? res.data.length;
        } else {
          this.paginatedDeliveryEnquiryList = [];
          this.totalItems = 0;
        }
        this.currentPage = page;
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'We were unable to retrieve the enquiry data. Please try again.');
        this.paginatedDeliveryEnquiryList = [];
        this.totalItems = 0;
      }
    });
  }

  getHOFilter(): void {
    const request = {
      ShMail: "",
      AmMail: "",
      TmMail: "",
      DealerMail: "",
      StateName: ""
    };

    this.apis.getHOFilter(request).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.stateHead = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.stateHead || [])];
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];
          this.statelist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.states || [])];

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
    this.selectedStateName = '';
    this.selectedLocation = '';

    const payload = {
      ShMail: mail,
      AmMail: "",
      TmMail: "",
      DealerMail: "",
      StateName: ""
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];
          this.statelist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.states || [])];

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
    this.selectedStateName = '';
    this.selectedLocation = '';

    const payload = {
      ShMail: this.selectedSH,
      AmMail: mail,
      TmMail: "",
      DealerMail: "",
      StateName: ""
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];
          this.statelist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.states || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while submitting data. Please try again.');
      }
    });
  }

  onTerritoryChange(mail: string): void {
    this.selectedDealer = '';
    this.selectedStateName = '';
    this.selectedLocation = '';

    const payload = {
      ShMail: this.selectedSH,
      AmMail: this.selectedAM,
      TmMail: mail,
      DealerMail: "",
      StateName: ""
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];
          this.statelist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.states || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onStateNameChange(mail: string): void {
    this.selectedDealer = '';
    this.selectedLocation = '';

    const payload = {
      ShMail: this.selectedSH,
      AmMail: this.selectedAM,
      TmMail: this.selectedTM,
      DealerMail: "",
      StateName: mail
    };
    this.apis.getHOFilter(payload).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;

        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.dealersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.dealers || [])];
          this.locationlist = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.location || [])];

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  searchFilter() {
    this.exchangeStockList();
  }

  onShowReport() {
    this.exchangeStockList();
  }

  closeModal() {
    this.liquidationForm.reset();
    if (this.modal) this.modal.hide();
    this.selectedItem = null;
  }

  onSubmit() {
   
    if (this.liquidationForm.invalid) {
      this.liquidationForm.markAllAsTouched();
      return;
    }

    const payload = {
      FinalSellingPrice: this.liquidationForm.value.finalSellingPrice,
      DpAmount: this.liquidationForm.value.dpAmount,
      SalesId: this.selectedItem?.['SalesId']
    };

    this.apis.updateOldEnquiry(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          this.apis.showAlert('success', 'Success!', 'Enquiry updated successfully.');
          this.closeModal();
          this.exchangeStockList();
        } else {
          this.apis.showAlert('error', 'Error!', res.message || 'Submission failed.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while submitting.');
      }
    });
  }
}
