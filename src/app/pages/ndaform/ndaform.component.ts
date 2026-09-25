import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonModel } from '../../model/apiresponse';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { PermissionService } from '../../services/userpermission/permission.service';

@Component({
  selector: 'app-ndaform',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './ndaform.component.html',
  styleUrl: './ndaform.component.css'
})
export class NdaformComponent implements OnInit {

  positionId: string = '';
  userName: string = '';

  showForm: boolean = false;
  showSH: boolean = false;
  showAM: boolean = false;
  showTM: boolean = false;
  showFO: boolean = false;

  stateHeadList: PersonModel[] = [];
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  foList: PersonModel[] = [];
  ndaList: any[] = [];

  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedFO: string = '';


  districtLoad: boolean = true;

  enquirySource: string = '';
  enquirySubSource: string = '';
  prospectName: string = '';
  partyMobile: string = '';
  enquirySourceOptions: string[] = [];
  enquirySourceOptionsFilter: string[] = [];
  subSourceOptions: string[] = [];

  subSourceMapping: any = {
    'HO': ['FB/Insta', 'WhatsApp', 'Toll-Free', 'Website', 'Google', 'AI Calling', 'Others'],
    'AGGREGATOR': ['Tractor Junction', 'Tractor Guru', 'CMV 360', 'Tractor Gyaan', 'Plantix', 'Other'],
    'TM': ['Field Visit', 'BTL', 'HO Digital', 'Referral', 'Other'],
    'AM': ['Field Visit', 'BTL', 'HO Digital', 'Referral', 'Other'],
    'FO': ['Field Visit', 'BTL', 'HO Digital', 'Referral', 'Other'],
    'SH': ['Field Visit', 'BTL', 'HO Digital', 'Referral', 'Other'],
    'DEALER': ['Dealer Referral', 'DSP Referral', 'Other'],
    'DES': ['Field Demo', 'Display', 'MID', 'Other']
  };

  followupRemarks: string = '';
  stateName: string = '';
  notInterestedReason: string = '';
  closingRemarks: string = '';

  partyDistrict: string = '';
  currentBusiness: string = '';
  interestedLocation: string[] = [];
  interestedTaluka: number[] = [];
  industrySize: string = '';
  //industrySize: number = 0;
  investmentPlan: string = '';
  actionPlanned: string = '';
  nextFollowupDate: string = '';

  districtList: any[] = [];
  talukaList: any[] = [];
  locationOptions: string[] = [];

  talukaDropdownOpen: boolean = false;
  locationDropdownOpen: boolean = false;

  shInterviewDone: string = '';
  shInterviewDate: string = '';
  shRemarks: string = '';
  shRejectionRemarks: string = '';

  hoInterviewDone: string = '';
  hoInterviewDate: string = '';
  hoRemarks: string = '';
  hoRejectionRemarks: string = '';

  sdReceived: string = '';
  sdReceivingDate: string = '';
  gstStatus: string = '';
  gstRegistrationDate: string = '';
  fundsReceived: string = '';
  fundTransferDate: string = '';
  bgReceived: string = '';
  bgSubmissionDate: string = '';
  codeOpened: string = '';
  loiDate: string = '';

  isUpdateMode: boolean = false;
  isFollowupMode: boolean = false;
  updateNdaEnquiryId: string = '';
  followupNdaEnquiryId: string = '';
  followupItem: any = null;

  activeFollowupTab: string = 'followup';
  followupHistory: any[] = [];
  historyLoading: boolean = false;

  todayDate: string = '';
  max30Days: string = '';
  max60Days: string = '';

  expectedConversionDate: Date | null = null;
  conversionDateError: string = '';
  nextFollowUpDateError: string = '';
  remarksError: string = '';
  interestedLocationName: string = '';

  remarks: string = '';


  listType: string = '';


  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;


  SelectedStateCode: number | null = null;


  isSuperAdmin: boolean = false;

  showModal: boolean = false;
  selectedValue: string = '';
  selectedType: string = '';
  selectedNdaMasterId: string = '';
  employeeList: any[] = [];

  talukaIndustryList: { talukaCode: number; industryCount: number }[] = [];


  // Fields
  selectedFilter: string = 'This Month';
  stDate: string = '';
  enDate: string = '';
  displayDateInputs: boolean = false;

  // Agar Location wala commented block bhi use karna ho:
  selectedLocation: string = '';
  selectedState: string = '';
  selectedMobileNumber: string = '';
  selectedEnquirySubSource: string = '';
  selectedEnquirySource: string = '';
  selectedOverdueFilter: string = '';
  locationlist: any[] = [];
  statelist: any[] = [];
  constructor(
    private router: Router,
    private http: HttpClient,
    private apis: AuthService,
    private permission: PermissionService
  ) { }

  ngOnInit(): void {
    this.listType = 'NdaList';
    this.positionId = sessionStorage.getItem('possitionId') || '';
    this.userName = sessionStorage.getItem('userName') || '';
    this.todayDate = new Date().toISOString().split('T')[0];
    const today = new Date();

    const max30 = new Date(today);
    max30.setDate(max30.getDate() + 30);
    this.max30Days = max30.toISOString().split('T')[0];

    const max60 = new Date(today);
    max60.setDate(max60.getDate() + 60);
    this.max60Days = max60.toISOString().split('T')[0];



    switch (this.positionId) {
      case 'National Sales Head': this.showSH = true; this.showAM = true; this.showTM = true; this.showFO = true; break;
      case 'State Head': this.showAM = true; this.showTM = true; this.showFO = true; break;
      case 'Area Manager': this.showTM = true; this.showFO = true; break;
      case 'Territory Manager': this.showFO = true; break;
    }


    this.isSuperAdmin = this.permission.hasSubMenu();

    this.enquirySourceOptions = this.getSourceOptions(this.positionId);
    this.enquirySourceOptionsFilter = this.getSourceOptions('');
    //this.loadHierarchy();
    this.getStateListNew();
    this.loadNdaList(this.currentPage);
  }

  showAddForm(): void {
    this.clearForm();
    this.showForm = true;
    this.loadDistricts();
    this.loadHierarchy();
  }

  showTableView(): void {
    this.showForm = false;
    this.listType = 'NdaList';
    this.resetFilter();
    this.clearForm();
    this.loadNdaList(1);
  }

  openFollowupModal(item: any): void {
    this.clearForm();
    this.isFollowupMode = true;
    this.activeFollowupTab = 'followup';
    this.followupHistory = [];
    this.followupItem = item;
    this.followupNdaEnquiryId = item.Id || '';
    this.prospectName = item.NDAProspectName || '';
    this.partyMobile = item.MobileNo || '';
    this.enquirySource = item.EnquirySource || '';
    this.enquirySubSource = item.EnquirySubSource || '';
    this.partyDistrict = item.DistrictName || '';
    this.remarks = item.RemarksDescription;
    this.onSourceChange();
    this.showForm = true;

    this.apis.GetNDAById({ Id: item.Id }).subscribe({
      next: (response: any) => {

        if (response?.message?.toLowerCase() === 'success' && response.data?.length > 0) {
          const d = response.data[0];

          // Basic
          this.followupRemarks = d.Remarks || '';
          this.stateName = d.stateName || '';
          this.actionPlanned = d.ActionPlan || '';
          this.nextFollowupDate = d.NextFollowDate
            ? new Date(d.NextFollowDate).toISOString().split('T')[0] : '';

          // Close Remarks
          if (d.Remarks === 'Not Interested') {
            this.notInterestedReason = d.CloseEnquiryRemark || '';
          } else if (d.Remarks === 'Fake Enquiry' || d.Remarks === 'Others') {
            this.closingRemarks = d.CloseEnquiryRemark || '';
          }

          // SH Interview
          this.shInterviewDone = d.SHInterviewStatus || '';
          this.shInterviewDate = d.SHInterviewDate
            ? new Date(d.SHInterviewDate).toISOString().split('T')[0] : '';
          this.shRemarks = d.SHRemarks || '';
          this.shRejectionRemarks = d.SHRejectionRemark || '';

          // HO Interview
          this.hoInterviewDone = d.HOInterviewStatus || '';
          this.hoInterviewDate = d.HOInterviewDate
            ? new Date(d.HOInterviewDate).toISOString().split('T')[0] : '';
          this.hoRemarks = d.HORemarks || '';
          this.hoRejectionRemarks = d.HORejectionRemark || '';

          // Post Approval
          this.sdReceived = d.SDReceivedStatus || '';
          this.sdReceivingDate = d.SDReceivingDate
            ? new Date(d.SDReceivingDate).toISOString().split('T')[0] : '';
          this.gstStatus = d.GSTStatus || '';
          this.gstRegistrationDate = d.GSTRegistrationDate
            ? new Date(d.GSTRegistrationDate).toISOString().split('T')[0] : '';
          this.fundsReceived = d.FundsReceivedStatus || '';
          this.fundTransferDate = d.FundTransferDate
            ? new Date(d.FundTransferDate).toISOString().split('T')[0] : '';
          this.bgReceived = d.BGReceivedStatus || '';
          this.bgSubmissionDate = d.BGSubmissionDate
            ? new Date(d.BGSubmissionDate).toISOString().split('T')[0] : '';
          this.codeOpened = d.CodeOpenedStatus || '';
          this.loiDate = d.LOIDate
            ? new Date(d.LOIDate).toISOString().split('T')[0] : '';
          this.expectedConversionDate = d.expectedConversionDate
            ? d.expectedConversionDate : '';

        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Failed to load NDA details.')
    });
  }

  getSourceOptions(role: string): string[] {
    switch (role) {
      case 'National Sales Head': return ['HO', 'Aggregator'];
      case 'State Head': return ['SH', 'AM', 'TM', 'FO', 'DES'];
      case 'Area Manager': return ['AM', 'TM', 'FO', 'DES'];
      case 'Territory Manager': return ['TM', 'FO', 'DES'];
      default: return ['HO', 'SH', 'AM', 'TM', 'FO', 'DES', 'Aggregator'];
    }
  }

  onSourceChange(): void {
    const key = (this.enquirySource || '').toUpperCase();
    this.subSourceOptions = this.subSourceMapping[key] || [];
    this.enquirySubSource = '';
  }
  onFilterSourceChange(): void {
    const key = (this.selectedEnquirySource || '').toUpperCase();
    this.subSourceOptions = this.subSourceMapping[key] || [];
    this.selectedEnquirySubSource = '';
  }

  loadHierarchy(): void {
    this.apis.getHOFilter({ ShMail: '', AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {
          this.stateHeadList = data.data.stateHead || [];
          this.areaManagersList = data.data.areaManagers || [];
          this.territoryManagersList = data.data.territoryManagers || [];
          this.foList = data.data.fo || [];
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Failed to load hierarchy data.')
    });
  }

  loadNdaList(page: number): void {

    this.ndaList = [];
    //const payload = { value: 'No' };

    this.apis.getNdaEnquiryList('No', page, this.selectedState, this.selectedFilter, this.stDate, this.enDate,
      this.selectedEnquirySource, this.selectedEnquirySubSource, this.selectedMobileNumber,
      this.selectedOverdueFilter

    ).subscribe({
      next: (data: any) => {

        if (data?.message?.toLowerCase() === 'success') {
          this.ndaList = data.data || [];
          this.totalItems = data.data.length > 0 ? data.data[0].Total : 0;
          this.currentPage = page;

          /*console.log('ndaList', this.ndaList);*/



        }

      },
      error: () => this.apis.showAlert('error', 'Error!', 'Failed to load NDA list.')
    });
  }

  loadFollowupHistory(): void {
    if (!this.followupNdaEnquiryId) return;
    this.historyLoading = true;
    this.followupHistory = [];
    this.apis.GetNDAHistoryById({ id: this.followupNdaEnquiryId }).subscribe({
      next: (data: any) => {
        this.historyLoading = false;
        if (data?.message?.toLowerCase() === 'success') {
          this.followupHistory = data.data || [];
        }
      },
      error: () => {
        this.historyLoading = false;
        this.apis.showAlert('error', 'Error!', 'Failed to load followup history.');
      }
    });
  }

  loadDistricts(): void {
    let position: string | null = null;
    let userName: string | null = null;

    if (this.selectedTM) {
      position = 'Territory Manager';
      userName = this.territoryManagersList.find((t: PersonModel) => t.Mail === this.selectedTM)?.Mail || this.selectedTM;
    } else if (this.selectedAM) {
      position = 'Area Manager';
      userName = this.areaManagersList.find((a: PersonModel) => a.Mail === this.selectedAM)?.Mail || this.selectedAM;
    } else if (this.selectedSH) {
      position = 'State Head';
      userName = this.stateHeadList.find((s: PersonModel) => s.Mail === this.selectedSH)?.Mail || this.selectedSH;
    }

    this.apis.getNdaDistrictList({ Position: position, userName: userName }).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') this.districtList = data.data || [];
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Failed to load district data.')
    });
  }

  loadTehsil(): void {
    this.apis.getTehsilList([{ DistrictCode: Number(this.partyDistrict) }]).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {
          this.talukaList = data.data || [];
          this.interestedTaluka = [];
          this.interestedLocation = [];
          this.locationOptions = [];
          this.talukaDropdownOpen = false;
          this.locationDropdownOpen = false;
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Failed to load tehsil data.')
    });
  }

  //loadCity(talukaName: string[]): void {
  //  //debugger;
  //  //const payload = this.interestedTaluka.map(code => ({ TehsilCode: code }));
  //  //this.apis.getCityList(payload).subscribe({
  //  //  next: (data: any) => {
  //  //    if (data?.message?.toLowerCase() === 'success')
  //  //      this.locationOptions = (data.data || []).map((c: any) => c.Loc);
  //  //    console.log('location', this.locationOptions);
  //  //  },
  //  //  error: () => this.apis.showAlert('error', 'Error!', 'Failed to load city data.')
  //  //});
  //  talukaName.forEach(name => {
  //    if (name && !this.locationOptions.includes(name)) {
  //      this.locationOptions.push(name);
  //    }
  //  });
  //}

  loadCity(talukaNames: string[]): void {
    this.locationOptions = [...new Set(talukaNames)];
  }

  onStateHeadChange(mail: string): void {
    this.selectedAM = ''; this.selectedTM = ''; this.selectedFO = '';
    this.apis.getHOFilter({ ShMail: mail, AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {
          this.areaManagersList = data.data.areaManagers || [];
          this.territoryManagersList = data.data.territoryManagers || [];
          this.foList = data.data.fo || [];
        }
      }
    });
    if (this.districtLoad) {
      this.loadDistricts();
    }
    this.districtLoad = true;


  }

  onAreaManagerChange(mail: string): void {
    this.selectedTM = ''; this.selectedFO = '';
    this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: mail, TmMail: '', DealerMail: '' }).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {
          this.territoryManagersList = data.data.territoryManagers || [];
          this.foList = data.data.fo || [];
        }
      }
    });
    // Generate mode mein bhi districts reload karo
    if (this.districtLoad) {
      this.loadDistricts();
    }
    this.districtLoad = true;

  }

  onFollowupRemarksChange(): void {
    // Followup mode only
    this.notInterestedReason = '';
    this.closingRemarks = '';
    this.resetInterestedFields();
    //if (this.followupRemarks === 'Interested') this.loadDistricts();
  }

  onDistrictChange(): void {
    this.interestedTaluka = [];
    this.interestedLocation = [];
    this.talukaList = [];
    this.locationOptions = [];
    this.talukaDropdownOpen = false;
    this.locationDropdownOpen = false;
    if (this.partyDistrict) {
      this.loadTehsil();
      this.getTMByDistCode();
    };
  }

  onSHInterviewChange(): void {
    this.shInterviewDate = ''; this.shRemarks = ''; this.shRejectionRemarks = '';
    this.resetHOInterview();
  }

  onSHRemarksChange(): void {
    this.shRejectionRemarks = '';
    this.resetHOInterview();
  }

  onHOInterviewChange(): void {
    this.hoInterviewDate = ''; this.hoRemarks = ''; this.hoRejectionRemarks = '';
    this.resetPostApproval();
  }

  onHORemarksChange(): void {
    this.hoRejectionRemarks = '';
    this.resetPostApproval();
  }

  onSDReceivedChange(): void { if (this.sdReceived !== 'Yes') this.sdReceivingDate = ''; }
  onGSTChange(): void { if (this.gstStatus !== 'Yes') this.gstRegistrationDate = ''; }
  onFundsChange(): void { if (this.fundsReceived !== 'Yes') this.fundTransferDate = ''; }
  onBGChange(): void { if (this.bgReceived !== 'Yes') this.bgSubmissionDate = ''; }
  onCodeOpenedChange(): void { if (this.codeOpened !== 'Yes') this.loiDate = ''; }

  toggleTalukaDropdown(event: any): void {
    event.stopPropagation();
    this.talukaDropdownOpen = !this.talukaDropdownOpen;
    this.locationDropdownOpen = false;
  }

  toggleLocationDropdown(event: any): void {
    event.stopPropagation();
    this.locationDropdownOpen = !this.locationDropdownOpen;
    this.talukaDropdownOpen = false;
  }

  closeAllDropdowns(): void {
    this.talukaDropdownOpen = false;
    this.locationDropdownOpen = false;
  }

  getTalukaName(code: number): string {
    const t = this.talukaList.find((t: any) => +t.Tehsil === code);
    return t ? t.TehsilName : code.toString();
  }

  removeTaluka(code: number): void {

    this.interestedTaluka = this.interestedTaluka.filter(v => v !== code);
    const interestedTalukaNames = this.talukaList
      .filter(x => this.interestedTaluka.includes(x.Tehsil))
      .map(x => x.TehsilName);
    this.interestedLocation = [];
    this.locationOptions = [];
    this.talukaIndustryList = this.talukaIndustryList.filter(
      x => x.talukaCode !== code
    );
    this.industrySize = this.talukaIndustryList
      .reduce((sum, item) => sum + item.industryCount, 0)
      .toString();
    if (this.interestedTaluka.length > 0)
      this.loadCity(interestedTalukaNames);
  }

  removeLocation(loc: string): void {
    this.interestedLocation = this.interestedLocation.filter(v => v !== loc);
  }

  onTalukaCheckChange(event: any, value: any, talukaName: string): void {
    event.stopPropagation();
    const code = Number(value);
    if (isNaN(code)) return;
    this.interestedTaluka = this.interestedTaluka.includes(code)
      ? this.interestedTaluka.filter(v => v !== code)
      : [...this.interestedTaluka, code];

    // Selected Taluka Names
    const interestedTalukaNames = this.talukaList
      .filter(x => this.interestedTaluka.includes(Number(x.Tehsil)))
      .map(x => x.TehsilName);

    this.interestedLocation = [];
    this.locationOptions = [];
    this.fngetIndustryByTaluka(code);
    this.talukaIndustryList = this.talukaIndustryList.filter(
      x => x.talukaCode !== code
    );
    this.industrySize = this.talukaIndustryList
      .reduce((sum, item) => sum + item.industryCount, 0)
      .toString();
    if (this.interestedTaluka.length > 0) this.loadCity(interestedTalukaNames);
  }

  onLocationCheckChange(event: any, value: string): void {
    event.stopPropagation();
    this.interestedLocation = this.interestedLocation.includes(value)
      ? this.interestedLocation.filter(v => v !== value)
      : [...this.interestedLocation, value];
  }

  resetInterestedFields(): void {
    //this.partyDistrict = '';
    this.currentBusiness = '';
    this.interestedLocation = []; this.interestedTaluka = [];
    this.industrySize = ''; this.investmentPlan = '';
    this.actionPlanned = ''; this.nextFollowupDate = '';
    this.talukaDropdownOpen = false; this.locationDropdownOpen = false;
    this.resetSHInterview();
  }

  resetSHInterview(): void {
    this.shInterviewDone = ''; this.shInterviewDate = '';
    this.shRemarks = ''; this.shRejectionRemarks = '';
    this.resetHOInterview();
  }

  resetHOInterview(): void {
    this.hoInterviewDone = ''; this.hoInterviewDate = '';
    this.hoRemarks = ''; this.hoRejectionRemarks = '';
    this.resetPostApproval();
  }

  resetPostApproval(): void {
    this.sdReceived = ''; this.sdReceivingDate = '';
    this.gstStatus = ''; this.gstRegistrationDate = '';
    this.fundsReceived = ''; this.fundTransferDate = '';
    this.bgReceived = ''; this.bgSubmissionDate = '';
    this.codeOpened = ''; this.loiDate = '';
  }

  clearForm(): void {
    this.selectedSH = ''; this.selectedAM = ''; this.selectedTM = ''; this.selectedFO = '';
    this.enquirySource = ''; this.enquirySubSource = ''; this.subSourceOptions = [];
    this.prospectName = ''; this.partyMobile = '';
    this.followupRemarks = ''; this.notInterestedReason = ''; this.closingRemarks = '';
    this.talukaDropdownOpen = false; this.locationDropdownOpen = false;
    this.isUpdateMode = false; this.isFollowupMode = false;
    this.updateNdaEnquiryId = ''; this.followupNdaEnquiryId = '';
    this.expectedConversionDate = null;
    this.followupItem = null;
    this.activeFollowupTab = 'followup';
    this.followupHistory = [];
    this.historyLoading = false;
    this.remarks = '';
    this.partyDistrict = '';
    this.resetInterestedFields();
  }

  allowNumbersOnly(event: KeyboardEvent): void {
    if (event.charCode < 48 || event.charCode > 57) event.preventDefault();
  }

  isFormValid(): boolean {

    // ===================== FOLLOWUP MODE VALIDATION =====================
    if (this.isFollowupMode) {
      if (!this.followupRemarks) return false;
      if (this.followupRemarks === 'Not Interested' && !this.notInterestedReason) return false;
      if ((this.followupRemarks === 'Fake Enquiry' || this.followupRemarks === 'Others') && !this.closingRemarks?.trim()) return false;

      if (this.followupRemarks === 'Interested') {
        if (!this.actionPlanned || !this.nextFollowupDate) return false;
        if (!this.expectedConversionDate) return false;
        if (!this.remarks?.trim()) return false;
        if (!this.shInterviewDone) return false;
        if (this.shInterviewDone === 'Yes') {
          if (!this.shInterviewDate || !this.shRemarks) return false;
          if (this.shRemarks === 'Rejected' && !this.shRejectionRemarks?.trim()) return false;
          if (this.shRemarks === 'HO Interview') {
            if (!this.hoInterviewDone) return false;
            if (this.hoInterviewDone === 'Yes') {
              if (!this.hoInterviewDate || !this.hoRemarks) return false;
              if (this.hoRemarks === 'Rejected' && !this.hoRejectionRemarks?.trim()) return false;
              if (this.hoRemarks === 'Approved') {
                if (!this.sdReceived || !this.gstStatus || !this.fundsReceived || !this.bgReceived || !this.codeOpened) return false;
                if (this.sdReceived === 'Yes' && !this.sdReceivingDate) return false;
                if (this.gstStatus === 'Yes' && !this.gstRegistrationDate) return false;
                if (this.fundsReceived === 'Yes' && !this.fundTransferDate) return false;
                if (this.bgReceived === 'Yes' && !this.bgSubmissionDate) return false;
                if (this.codeOpened === 'Yes' && !this.loiDate) return false;
              }
            }
          }
        }
      }
      return true;
    }

    // ===================== GENERATE MODE VALIDATION =====================
    // Generate mode mein followupRemarks, notInterestedReason, closingRemarks,
    // nextFollowupDate ki zaroorat nahi — sirf niche waale fields validate honge.
    if (!this.prospectName?.trim()) return false;
    if (!this.selectedSH?.trim()) return false;
    if (
      !this.partyMobile ||
      this.partyMobile.length !== 10 ||
      !/^\d{10}$/.test(this.partyMobile)
    ) {
      return false;
    }
    if (!this.enquirySource) return false;
    if (this.subSourceOptions.length > 0 && !this.enquirySubSource) return false;
    // Interested fields (always required in generate mode)
    if (!this.partyDistrict || !this.currentBusiness || !this.investmentPlan) return false;
    //if (this.interestedLocation?.length < 1 || this.interestedTaluka?.length < 1) return false;
    if (!this.expectedConversionDate) return false;
    if (!this.nextFollowupDate) return false;
    if (!this.remarks?.trim()) return false;
    if (!this.interestedLocationName) return false;

    return true;
  }

  getFinalStatus(): string {
    // Generate mode mein followupRemarks nahi hai, to always 'Open'
    if (!this.isFollowupMode) return 'Open';

    if (this.followupRemarks === 'Not Interested') return 'Closed';
    if (this.followupRemarks === 'Fake Enquiry' || this.followupRemarks === 'Others') return 'Closed';
    if (this.shRemarks === 'Rejected') return 'Closed';
    if (this.hoRemarks === 'Rejected') return 'Closed';

    if (this.codeOpened === 'Yes') {
      const allYes = this.codeOpened === 'Yes';
      //this.sdReceived === 'Yes' &&
      //this.gstStatus === 'Yes' &&
      //this.fundsReceived === 'Yes' &&
      //this.bgReceived === 'Yes' &&
      //this.codeOpened === 'Yes';

      return allYes ? 'Appointed' : 'Open';
    }

    return 'Open';
  }

  buildBasicPayload(): any {
    // Generate mode mein followupRemarks always 'Interested' treat karo

    return {
      shName: this.selectedSH
        ? (this.stateHeadList.find((s: PersonModel) => s.Mail === this.selectedSH)?.Name || this.selectedSH)
        : null,
      amName: this.selectedAM
        ? (this.areaManagersList.find((a: PersonModel) => a.Mail === this.selectedAM)?.Name || this.selectedAM)
        : null,
      tmName: this.selectedTM
        ? (this.territoryManagersList.find((t: PersonModel) => t.Mail === this.selectedTM)?.Name || this.selectedTM)
        : null,
      foName: this.selectedFO
        ? (this.foList.find((f: PersonModel) => f.Mail === this.selectedFO)?.Name || this.selectedFO)
        : null,
      shMail: this.selectedSH || null,
      amMail: this.selectedAM || null,
      tmMail: this.selectedTM || null,
      foMail: this.selectedFO || null,
      enquirySource: this.enquirySource,
      enquirySubSource: this.enquirySubSource || null,
      ndaProspectName: this.prospectName,
      mobileNo: this.partyMobile,
      enquiryCurrentStatus: 'Open',         // generate mode mein always Open
      followupRemarks: 'Interested',          // generate mode mein always Interested
      districtName: this.districtList.find((d: any) => d.DistrictCode == this.partyDistrict)?.DistrictName || null,
      districtCode: this.districtList.find((d: any) => d.DistrictCode == this.partyDistrict)?.DistrictCode || null,
      //cityName: this.interestedLocation.join(',') || null,
      cityName: this.interestedLocationName || null,
      tehsilName: this.interestedTaluka.map(code => this.getTalukaName(code)).join(',') || null,
      currentBussiness: this.currentBusiness || null,
      industrySize: this.industrySize || null,
      investPlan: this.investmentPlan || null,
      actionPlan: null,                       // generate mode mein actionPlanned nahi
      nextFollowDate: this.nextFollowupDate || null,                   // generate mode mein nextFollowupDate nahi
      closeEnquiryRemark: null,               // generate mode mein close remark nahi
      expectedConversionDate: this.expectedConversionDate,
      remarks: this.remarks || null,
    };
  }

  buildFollowupPayload(): any {

    return {
      Id: this.followupNdaEnquiryId,
      FollowupRemarks: this.followupRemarks,
      CloseEnquiryRemark: (this.followupRemarks === 'Not Interested')
        ? this.notInterestedReason
        : (this.followupRemarks === 'Fake Enquiry' || this.followupRemarks === 'Others')
          ? this.closingRemarks
          : null,
      NextFollowUpDate: this.followupRemarks === 'Interested' ? this.nextFollowupDate : null,
      SHInterviewStatus: this.shInterviewDone || null,
      SHInterviewDate: this.shInterviewDone === 'Yes' ? this.shInterviewDate : null,
      SHRemarks: this.shInterviewDone === 'Yes' ? this.shRemarks : null,
      SHRejectionRemark: (this.shInterviewDone === 'Yes' && this.shRemarks === 'Rejected') ? this.shRejectionRemarks : null,
      HOInterviewStatus: (this.shRemarks === 'HO Interview') ? this.hoInterviewDone : null,
      HOInterviewDate: (this.shRemarks === 'HO Interview' && this.hoInterviewDone === 'Yes') ? this.hoInterviewDate : null,
      HORemarks: (this.shRemarks === 'HO Interview' && this.hoInterviewDone === 'Yes') ? this.hoRemarks : null,
      HORejectionRemark: (this.hoInterviewDone === 'Yes' && this.hoRemarks === 'Rejected') ? this.hoRejectionRemarks : null,
      SDReceivedStatus: (this.hoRemarks === 'Approved') ? this.sdReceived : null,
      SDReceivingDate: (this.hoRemarks === 'Approved' && this.sdReceived === 'Yes') ? this.sdReceivingDate : null,
      GSTStatus: (this.hoRemarks === 'Approved') ? this.gstStatus : null,
      GSTRegistrationDate: (this.hoRemarks === 'Approved' && this.gstStatus === 'Yes') ? this.gstRegistrationDate : null,
      FundsReceivedStatus: (this.hoRemarks === 'Approved') ? this.fundsReceived : null,
      FundTransferDate: (this.hoRemarks === 'Approved' && this.fundsReceived === 'Yes') ? this.fundTransferDate : null,
      BGReceivedStatus: (this.hoRemarks === 'Approved') ? this.bgReceived : null,
      BGSubmissionDate: (this.hoRemarks === 'Approved' && this.bgReceived === 'Yes') ? this.bgSubmissionDate : null,
      CodeOpenedStatus: (this.hoRemarks === 'Approved') ? this.codeOpened : null,
      LOIDate: (this.hoRemarks === 'Approved' && this.codeOpened === 'Yes') ? this.loiDate : null,
      EnquiryCurrentStatus: this.getFinalStatus(),
      ActionPlan: this.actionPlanned,
      expectedConversionDate: this.expectedConversionDate || null,
      remarks: this.remarks || null,


    };
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }
    const payload = this.buildBasicPayload();
    //console.log('Generate Payload:', JSON.stringify(payload, null, 2));

    this.apis.insertNdaEnquiry(payload).subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase() === 'success') {
          Swal.fire({
            icon: 'success', title: 'Success', text: 'NDA Enquiry Generated Successfully',
            allowOutsideClick: false, allowEscapeKey: false, confirmButtonText: 'OK',
            customClass: { title: 'swal-title-small', htmlContainer: 'swal-text-small' }
          }).then(result => { if (result.isConfirmed) this.showTableView(); });
        } else {
          this.apis.showAlert('error', 'Error!', response?.message || 'Failed to generate NDA enquiry.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.')
    });
  }

  onFollowupSubmit(): void {
    if (!this.isFormValid())
      return;
    const payload = this.buildFollowupPayload();
    //console.log('Followup Payload:', JSON.stringify(payload, null, 2));
    this.validateConversionDate();
    this.validateNextFollowDate();
    if (this.nextFollowUpDateError || this.conversionDateError) return;
    this.apis.updateNdaEnquiry(payload).subscribe({
      next: (response: any) => {

        if (response?.message?.toLowerCase() === 'success') {
          Swal.fire({
            icon: 'success', title: 'Success', text: 'NDA Enquiry Follow-up Updated Successfully',
            allowOutsideClick: false, allowEscapeKey: false, confirmButtonText: 'OK',
            customClass: { title: 'swal-title-small', htmlContainer: 'swal-text-small' }
          }).then(result => { if (result.isConfirmed) this.showTableView(); });
        } else {

          this.apis.showAlert('error', 'Error!', response?.message || 'Failed.');
        }
      },
      error: (err: any) => {

        this.apis.showAlert('error', 'Error!', 'An error occurred.');
      }
    });
  }

  validateConversionDate() {
    if (!this.expectedConversionDate) {
      this.conversionDateError = '';
      return;
    }

    const selectedDate = new Date(this.expectedConversionDate).toISOString().split('T')[0];
    if (selectedDate < this.todayDate || selectedDate > this.max60Days) {
      this.expectedConversionDate = null;
      this.conversionDateError = 'Expected Conversion Date must be between today and the next 60 days.';
    } else {
      this.conversionDateError = '';
    }
  }

  validateNextFollowDate() {

    if (!this.nextFollowupDate) {
      this.nextFollowUpDateError = '';
      return;
    }

    const selectedDate = new Date(this.nextFollowupDate).toISOString().split('T')[0];
    if (selectedDate < this.todayDate || selectedDate > this.max30Days) {
      this.nextFollowupDate = '';
      this.nextFollowUpDateError = 'Next Follow-up Date must be between today and the next 30 days.';
    } else {
      this.nextFollowUpDateError = '';
    }
  }

  exportToExcel(): void {

    //const payload = { value: 'Yes' };
    this.apis.getNdaEnquiryList('Yes', 1, this.selectedState, this.selectedFilter, this.stDate, this.enDate,
      this.selectedEnquirySource, this.selectedEnquirySubSource, this.selectedMobileNumber, this.selectedOverdueFilter
    ).subscribe({
      next: (data: any) => {

        if (data?.message?.toLowerCase() !== 'success') {
          this.apis.showAlert('error', 'Error!', 'Failed to load NDA list.');
          return;
        }

        const ndaList = data.data || [];

        if (!ndaList.length) {
          this.apis.showAlert('info', 'No Data', 'No data found.');
          return;
        }

        const maxRows = 1048576;
        let part = 1;

        for (let i = 0; i < ndaList.length; i += maxRows) {

          const chunk = ndaList.slice(i, i + maxRows);

          const worksheet = XLSX.utils.json_to_sheet(chunk, {
            header: Object.keys(chunk[0])
          });

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'NDA List');

          const wbout = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
          });

          const blob = new Blob([wbout], {
            type: 'application/octet-stream'
          });

          saveAs(
            blob,
            ndaList.length > maxRows
              ? `NDA_List_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx`
              : `NDA_List_${new Date().toISOString().split('T')[0]}.xlsx`
          );

          part++;
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Failed to download NDA list.');
      }
    });
  }

  PendingConversionByList(page: number) {
    this.resetFilter();
    this.listType = 'PendingConversion';
    this.ndaList = [];
    this.getPendingConversionByList(page);

  }

  getPendingConversionByList(page: number) {

    this.apis.getPendingConversionByList(page, this.selectedState, this.selectedFilter, this.stDate, this.enDate,
      this.selectedEnquirySource, this.selectedEnquirySubSource, this.selectedMobileNumber
    ).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {
          this.ndaList = data.data || [];
          this.totalItems = data.data.length > 0 ? data.data[0].Total : 0;
          this.currentPage = page;
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Failed to load NDA list.')
    });
  };
  //updateConversion(item: any) {

  //}

  openNdaOpenList() {
    this.resetFilter();
    this.currentPage = 1;
    this.listType = 'NdaList';
    this.loadNdaList(this.currentPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    if (this.listType === 'NdaList') {
      this.loadNdaList(this.currentPage);

    }
    else if (this.listType === 'PendingConversion') {
      this.getPendingConversionByList(this.currentPage);
    }
  }

  fngetIndustryByTaluka(talukaCode: number) {
    const code = this.talukaIndustryList.filter(x => x.talukaCode === talukaCode);
    if (code.length !== 0) return;
    /*    if (this.talukaIndustryList.filter)*/
    this.apis.getIndustryByTaluka(talukaCode).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {
          const industryValue = Number(data.data ?? 0);
          this.talukaIndustryList.push({
            talukaCode: talukaCode,
            industryCount: industryValue
          });
          this.industrySize = this.talukaIndustryList
            .reduce((sum, item) => sum + item.industryCount, 0)
            .toString();
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Failed to load Industry Value.')
    });
  };


  getTMByDistCode() {
    const distCode = Number(this.partyDistrict);
    this.districtLoad = false;
    this.apis.getTmByDistCode(distCode).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {



          this.territoryManagersList = (data.data ?? []).filter((x: any) => x.Type === 'TM');
          this.selectedTM = this.territoryManagersList[0]?.Mail ?? null;


          const areaManagersLists = (data.data ?? []).filter((x: any) => x.Type === 'AM');
          this.areaManagersList = Array.from(
            new Map<string, any>(
              areaManagersLists.map((x: any) => [`${x.Name}-${x.Mail}`, x])
            ).values()
          );

          if (this.selectedTM === null) {
            this.selectedAM = this.areaManagersList[0]?.Mail ?? null;
          }
          else {
            this.selectedAM = areaManagersLists
              .filter((x: any) => x.TMMail === this.selectedTM)[0]?.Mail ?? null;
          }

          const stateHeadLists = (data.data ?? []).filter((x: any) => x.Type === 'SH');
          this.stateHeadList = Array.from(
            new Map<string, any>(
              stateHeadLists.map((x: any) => [`${x.Name}-${x.Mail}`, x])
            ).values()
          );

          if (this.selectedTM !== null) {
            this.selectedSH =
              stateHeadLists.find((x: any) => x.TMMail === this.selectedTM)?.Mail ?? null;
          }
          else if (this.selectedAM !== null) {
            this.selectedSH =
              stateHeadLists.find((x: any) => x.AMMail === this.selectedAM)?.Mail ?? null;
          }
          else {
            this.selectedSH = this.stateHeadList[0]?.Mail ?? null;
          }

        } else {
          this.apis.showAlert('warning', 'Warning!', data?.message || 'No data found.');
        }
      },
      error: (err) => {
        //console.error(err);
        this.apis.showAlert('error', 'Error!', 'Failed to load TM data.');
      }
    });
  }

  getEmployeeList() {
    const payload = {
      stateCode: this.SelectedStateCode,
      position: this.selectedType?.trim()
    }

    this.apis.getEmployeeList(payload).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {
          this.employeeList = data?.data;
          this.selectedValue = '';
        }
        else {
          this.apis.showAlert('warning', 'Warning!', data?.message || 'No data found.');
        }
      },
      error: (err) => {
        //console.error(err);
        this.apis.showAlert('error', 'Error!', 'Failed to load Employee data.');
      }
    })

  }

  openModal(item: any) {
    this.SelectedStateCode = item.StateCode ?? null;
    this.selectedNdaMasterId = item.Id ?? null;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
    this.getEmployeeList();
  }

  closeModal() {
    this.showModal = false;
    this.selectedValue = '';
    this.selectedType = '';
    this.selectedNdaMasterId = '';
    this.SelectedStateCode = null;
    document.body.style.overflow = 'auto';
  }

  handleSubmit() {
    if (!this.selectedNdaMasterId) {
      this.apis.showAlert(
        'warning',
        'Warning!',
        'Please select an NDA record.'
      );
      return;
    }

    if (!this.selectedValue) {
      this.apis.showAlert(
        'warning',
        'Warning!',
        'Please select a conversion status.'
      );
      return;
    }

    const payload = {
      name: this.selectedValue,
      id: this.selectedNdaMasterId
    };

    this.apis.updtConversionBy(payload).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {
          this.apis.showAlert(
            'success',
            'Success!',
            'Conversion status updated successfully.'
          );

          this.closeModal();
        } else {
          this.apis.showAlert(
            'warning',
            'Warning!',
            data?.message || 'Unable to update the conversion status.'
          );
        }
      },
      error: (err) => {
        //console.error(err);
        this.apis.showAlert(
          'error',
          'Error!',
          'An unexpected error occurred while updating the conversion status. Please try again.'
        );
      }
    });
  }

  // Function
  datefilterchange(value: string): void {
    this.displayDateInputs = value === 'Custom';
    if (!this.displayDateInputs) {
      this.stDate = '';
      this.enDate = '';
    }
  }

  onShowReport() {
    this.currentPage = 1;
    if (this.listType === 'NdaList')
      this.loadNdaList(this.currentPage);
    else
      this.getPendingConversionByList(this.currentPage);
  }

  getStateListNew(): void {
    this.apis.getStateListReportNew().subscribe({
      next: (data: any) => {
        this.statelist = (data.data ?? []).filter(
          (x: any) => x.stateCode != null
        );
      },
      error: () => {
        this.apis.showAlert(
          'error',
          'Error!',
          'Error fetching dealer state.'
        );
      }
    });
  }


  resetFilter() {
    this.selectedFilter = 'This Month';
    this.stDate = '';
    this.enDate = '';
    this.selectedState = '';
    this.selectedEnquirySource = '';
    this.selectedEnquirySubSource = '';
    this.selectedMobileNumber = '';
    this.selectedOverdueFilter = '';
    this.displayDateInputs = false;

  }
}
