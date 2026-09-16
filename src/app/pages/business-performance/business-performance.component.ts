import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { getApisResponse, filterApisResponse, PersonModel, BusinessPerformanceResponse, EnquiryBox, EnquiryItem, SourceSubSource } from '../../model/apiresponse';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-business-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './business-performance.component.html',
  styleUrl: './business-performance.component.css'
})
export class BusinessPerformanceComponent implements OnInit {
  apiresponse: getApisResponse = { message: null, data: null };
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];
  locationlist: PersonModel[] = [];
  statelist: PersonModel[] = [];
  stateHead: PersonModel[] = [];
  enquiryBox: EnquiryBox[] = [];
  enquiryItem: EnquiryItem[] = [];
  selectedFilter: string = 'Month';
  startdate_val: string = '';
  enddate_val: string = '';
  displayDateInputs: boolean = false;
  positionId: any;
  userName: any;

  showAM = false;
  showTM = false;
  showSH = false;
  showDealer = false;
  showLocation = false;
  showStatename = false;

  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = '';
  selectedLocation: string = '';
  selectedStateName: string = '';
  selectSource: string = '';
  selectSubSource: string = '';

  activeLead: string = 'CurrentOpenEnquiry';

  paginatedEnquiryList: EnquiryItem[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;


  sourceList: string[] = [];
  subSourceList: string[] = [];
  apiressourceSubSource: SourceSubSource[] = [];


  constructor(private http: HttpClient, private apis: AuthService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    const dealercode = sessionStorage.getItem('dealerCode');

    if (this.positionId === 'National Sales Head') {
      this.showSH = true;
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;
    }
    else if (this.positionId === 'State Head') {
      this.showSH = false;
      this.showAM = true;
      this.showTM = true;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;
    }
    else if (this.positionId === 'Area Manager') {
      this.showSH = false;
      this.showAM = false;
      this.showTM = true;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;
    }
    else if (this.positionId === 'Territory Manager') {
      this.showSH = false;
      this.showAM = false;
      this.showTM = false;
      this.showDealer = true;
      this.showLocation = true;
      this.showStatename = true;
    }
    else {
      this.showSH = false;
      this.showAM = false;
      this.showTM = false;
      this.showDealer = false;
      this.showLocation = false;
      this.showStatename = false;
      this.selectedDealer = dealercode || '';
    }
    this.getHOFilter();
    this.route.queryParams.subscribe(params => {
    this.activeLead = params['ActiveLead'] !== undefined ? params['ActiveLead'] : 'CurrentOpenEnquiry';

      if (params['Duration']) {
        this.selectedFilter = params['Duration'];
      } else {
        this.selectedFilter = 'Month';
      }

      this.getBusinessPerformance();
      this.getSourceSubsource();
    });
  }

  datefilterchange(value: string) {
    if (value === 'Custom') {
      this.displayDateInputs = true;
    } else {
      this.displayDateInputs = false;
      this.startdate_val = '';
      this.enddate_val = '';
    }
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

  onShowReport() {
    this.activeLead = 'CurrentOpenEnquiry';
    this.getBusinessPerformance();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
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

  getBusinessPerformance(page: number = 1): void {
 
    const offset = (page - 1) * this.itemsPerPage;
    const { startDateISO, endDateISO } = this.getDateRange();
    var request = {
      Startdate: startDateISO,
      Enddate: endDateISO,
      Source: this.selectSource,
      subSource: this.selectSubSource,
      ShMail: this.showSH ? this.selectedSH || '' : '',
      AmMail: this.showAM ? this.selectedAM || '' : '',
      TmMail: this.showTM ? this.selectedTM || '' : '',
      DealerMail: this.showDealer ? this.selectedDealer || '' : '',
      Location: this.showLocation ? this.selectedLocation || '' : '',
      StateCode: this.showStatename ? this.selectedStateName || '' : '',
      BoxFilter: this.activeLead,
      PageSize: this.itemsPerPage.toString(),
      RowStart: offset.toString()
    }
    this.apis.getBusinessPerformance(request).subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase() === 'success') {
          this.enquiryBox = response.data?.getBoxes || [];
          this.paginatedEnquiryList = response.data?.getList || [];

          if (this.enquiryBox && this.enquiryBox.length > 0) {
            this.totalItems = this.enquiryBox[0].TotalCounts ?? 0;
          } else {
            this.totalItems = 0;
          }
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

  onBussinessClick(name: any): void {
    this.activeLead = name;
    this.getBusinessPerformance();
  }

  onPageChange(page: number) {
    this.getBusinessPerformance(page);
  }

  exportToExcel(): void {
    const { startDateISO, endDateISO } = this.getDateRange();

    const request = {
      Startdate: startDateISO,
      Enddate: endDateISO,
      ShMail: this.showSH ? this.selectedSH || '' : '',
      AmMail: this.showAM ? this.selectedAM || '' : '',
      TmMail: this.showTM ? this.selectedTM || '' : '',
      subSource: this.selectSubSource,
      DealerMail: this.showDealer ? this.selectedDealer || '' : '',
      Location: this.showLocation ? this.selectedLocation || '' : '',
      StateCode: this.showStatename ? this.selectedStateName || '' : '',
      BoxFilter: this.activeLead,
      Source: this.selectSource
    };

    this.apis.getDownloadBusinessPerformance(request).subscribe({
      next: (res: any) => {
       
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.enquiryItem = res.data?.getList || [];
          if (!this.enquiryItem || this.enquiryItem.length === 0) {
            this.apis.showAlert('info', 'No Enquiries Found!', 'No enquiries found for the selected range.');
            return;
          }

          const maxRows = 1048576;
          let part = 1;

          for (let i = 0; i < this.enquiryItem.length; i += maxRows) {
            const chunk = this.enquiryItem.slice(i, i + maxRows);

            const headers = Object.keys(chunk[0]);
            const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(chunk, { header: headers });
            const workbook: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'BusinessPerformance');

            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });

            const fileName = this.enquiryItem.length > maxRows
              ? `BusinessPerformance_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx`
              : `BusinessPerformance_${new Date().toISOString().split('T')[0]}.xlsx`;

            saveAs(blob, fileName);
            part++;
          }

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  searchValue(): void {

  }

  getSourceSubsource() {
    this.apis.getSourceSubSourceForRepFilter().subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.apiressourceSubSource = this.apiresponse.data as SourceSubSource[];
          this.sourceList = [...new Set(this.apiressourceSubSource.map(x => x.sourceName))];
          //console.log('Source list', this.apiressourceSubSource);
        } else { this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.'); }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.')
    });
  }

  onSourceChange() {
    if (!this.selectSource) {
      // Agar "All" select hai → sab dikhao
      this.subSourceList = [
        ...new Set(this.apiressourceSubSource.map(x => x.subSourceName))
      ];
    } else {
      // Selected source ke hisaab se filter
      this.subSourceList = [
        ...new Set(
          this.apiressourceSubSource
            .filter(x => x.sourceName === this.selectSource)
            .map(x => x.subSourceName)
        )
      ];
    }

    // Reset selected subsource
    this.selectSubSource = '';
  }
}
