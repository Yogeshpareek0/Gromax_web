import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getApisResponse, FollowUpList, LeadCount, PersonModel, filterApisResponse, SourceSubSource } from '../../model/apiresponse';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-enquiryfollowup',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './enquiryfollowup.component.html',
  styleUrl: './enquiryfollowup.component.css'
})
export class EnquiryfollowupComponent implements OnInit {
  followupList: FollowUpList[] = [];
  leadCount: LeadCount[] = [];
  apiresponse !: getApisResponse;
  apiressourceSubSource: SourceSubSource[] = [];
  sourceList: string[] = [];
  subSourceList: string[] = [];


  positionId: any;
  userName: any;
  activeLead: string = '';
  activeType: string = '';
  activeSource: string = '';
  selectSource: string = '';
  selectSubSource: string = '';
  selectType: string = '';
  selectStatus: string = '';


  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = '';
  selectedCategory: string = '';
  selectedStateName: string = '';


  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  dealersList: PersonModel[] = [];
  stateHead: PersonModel[] = [];
  statelist: PersonModel[] = [];

  paginatedfollowupList: FollowUpList[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;

  showAM = false;
  showTM = false;
  showSH = false;
  showDealer = false;
  showStatename = false;
  showLocation = false;

  selectedLocation: string = '';
  locationlist: PersonModel[] = [];

  constructor(private http: HttpClient, private route: ActivatedRoute, private apis: AuthService,
    private router: Router) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
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

    this.route.queryParams.subscribe(params => {
      this.activeLead = params['EnquiryStatus'] !== undefined ? params['EnquiryStatus'] : '';
      this.activeType = params['EnquiryType'] !== undefined ? params['EnquiryType'] : '';
      this.getfollowup();
    });
    this.getLeadsFollowup();
    this.getHOFilter();
    this.getSourceSubsource();
  }

  getfollowup(page: number = 1): void {
    const offset = (page - 1) * this.itemsPerPage;

    const request = {
      EnquirySource: this.activeSource,
      EnquirySubSource: this.selectSubSource,
      InterestedModel: '',
      EnquiryStatus: this.activeLead,
      EnquiryType: this.activeType,
      PageSize: this.itemsPerPage.toString(),
      RowStart: offset.toString(),
      DealerCode: this.selectedDealer,
      AMName: this.selectedAM,
      TMName: this.selectedTM,
      SHName: this.selectedSH,
      DealerCategory: this.selectedCategory,
      location: this.selectedLocation || '',
      StateCode: this.selectedStateName || ''
    };

    this.apis.getfollowup(request).subscribe({
      next: (res: any) => {
        //console.log('Formatted JSON:', JSON.stringify(res));
        if (res?.message && res.message.toLowerCase() === 'success') {

          this.paginatedfollowupList = res.data as FollowUpList[];
          //console.log('follow up', this.paginatedfollowupList)

          if (res.totalCount && res.totalCount > 0) {
            this.totalItems = res.totalCount;
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

  getLeadsFollowup(): void {
    this.apis.getLeadsFollowup().subscribe({
      next: (res: any) => {
        if (res?.message && res.message.toLowerCase() === 'success') {
          this.leadCount = res.data as LeadCount[];
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

  onShowReport() {

    this.activeLead = this.selectStatus;
    this.activeType = this.selectType;
    this.activeSource = this.selectSource;
    this.getfollowup();
  }

  setActiveLead(type: string) {
 
    this.activeLead = type;
    this.activeType = '';
    this.selectSource = '';
    this.selectStatus = '';
    this.selectType = '';
    this.getfollowup();
  }

  setActiveType(type: string) {

    this.activeType = type;
    this.activeLead = '';
    this.selectSource = '';
    this.selectStatus = '';
    this.selectType = '';
    this.getfollowup();
  }

  onPageChange(page: number) {
    this.getfollowup(page);
  }

  onRowClick(id: number) {
    this.router.navigate(['main/perenquiryfollowdetails', id]);
  }

  searchValue(input: HTMLInputElement): void {
    const request = {
      ProspectMobileNumber: input.value
    };
    this.apis.getSalesEnqForFollowByMobileNo(request).subscribe({
      next: (res) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.paginatedfollowupList = this.apiresponse.data as FollowUpList[];
          this.totalItems = 0;
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

  exportToExcel(): void {
    const request = {
      EnquirySource: this.activeSource,
      EnquirySubSource: this.selectSubSource,
      InterestedModel: '',
      EnquiryStatus: this.activeLead,
      EnquiryType: this.activeType,
      DealerCode: this.selectedDealer,
      AMName: this.selectedAM,
      TMName: this.selectedTM,
      SHName: this.selectedSH,
      DealerCategory: this.selectedCategory,
      location: this.selectedLocation || '',
      StateCode: this.selectedStateName || ''
    };

    this.apis.getFollowUpDownloadWeb(request).subscribe({
      next: (res: any) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {

          const exportList = res.data as FollowUpList[];

          if (!exportList || exportList.length === 0) {
            this.apis.showAlert('info', 'No FollowUp Found!', 'No followup found for the export.');
            return;
          }

          const maxRows = 1048576;
          let part = 1;

          for (let i = 0; i < exportList.length; i += maxRows) {
            const chunk = exportList.slice(i, i + maxRows);
            const headers = Object.keys(chunk[0]);

            const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(chunk, { header: headers });
            const workbook: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'FollowUp');

            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });

            const fileName = exportList.length > maxRows
              ? `FollowUp_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx`
              : `FollowUp_${new Date().toISOString().split('T')[0]}.xlsx`;

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
