import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getApisResponse, filterApisResponse, PersonModel, exchangeModelMaster } from '../../model/apiresponse';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-generateenquiry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enquirygenerate.component.html',
  styleUrl: './enquirygenerate.component.css'
})
export class EnquirygenerateComponent implements OnInit {
  // VARIABLES DECLARATION
  apiresponse: getApisResponse = { message: null, data: null };
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  stateHead: PersonModel[] = [];
  positionId: any;
  userName: any;
  subSourceOptions: string[] = [];
  enquirySource: string[] = [];
  modalList: any[] = [];
  salesmanList: any[] = [];
  uniqueHpCategories: string[] = [];
  driveTypesForSelectedHP: string[] = [];
  modelsForSelectedDrive: any[] = [];
  isAutoFilling: boolean = false;

  // Role visibility flags
  showAM = false;
  showTM = false;
  showSH = false;
  showDealer = false;
  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';

  // Basic fields
  mobileNo: string = '';
  customerName: string = '';
  customerSurname: string = '';
  fatherName: string = '';
  remark: string = '';
  prospectPin: string = '';
  otherVillageName: string = '';

  // Model selection
  interestedHP: string = '';
  interestedDrive: string = '';
  interestedModel: string = '';
  variantCode: string = '';

  // Source
  selectedSource: string = '';
  selectedSubSource: string = '';

  // Dates & Type
  nextFollowupDate: string = '';
  expectedDeliveryDate: string = '';
  enquiryType: string = '';

  // Conversion Challenge
  conversionChallenge: string = '';
  actionPlanned: string = '';
  actionPlannedOptions: string[] = [];
  otherActionRemark: string = '';
  showOtherActionRemark: boolean = false;

  // Enquiry Current Status
  enquiryCurrentStatus: string = '';
  showBookingFields: boolean = false;
  showClosedFields: boolean = false;
  bookingDate: string = '';
  bookingAmount: string = '';
  enquiryClosedStatus: string = '';

  // Sale Lost
  showSaleLostFields: boolean = false;
  saleLostReason: string = '';
  showSaleLostOtherRemark: boolean = false;
  saleLostOtherRemark: string = '';

  // Dropped
  showDroppedFields: boolean = false;
  droppedReason: string = '';

  // Delivered
  showDeliveredFields: boolean = false;
  deliveryDate: string = '';
  expectedRetailDate: string = '';
  chassisNumber: string = '';
  chassisOptions: string[] = [];
  prospectType: string = '';

  // Exchange Tractor
  showExchangeFields: boolean = false;
  exchangeMake: string = '';
  exchangeModel: string = '';
  exchangeMfgYear: string = '';
  exchangeModelOptions: string[] = [];
  mfgYearOptions: string[] = [];
  mktValueExchangeTractor: string = '';
  finalPriceExchangeTractor: string = '';
  exchangeStockEntryType: string = '';
  exchangeStockEntryValue: string = '';
  customerAskExcTractor: string = '';
  exchangeHpCategorie: string = '';

  // Final Sale & Payment
  finalSalePrice: string = '';
  paymentType: string = '';
  additionalPayment: string = '';
  showAdditionalPayment: boolean = false;
  // Cash
  showCashFields: boolean = false;
  cashDpAmount: string = '';
  cashDueAmount: string = '';

  // Loan
  showLoanFields: boolean = false;
  loanDpAmount: string = '';
  loanRequired: string = '';
  customerDues: string = '';
  financerName: string = '';
  financerNameOther: string = '';
  showFinancerOtherInput: boolean = false;
  loanType: string = '';
  financeStatus: string = '';
  showFinanceSubStatus: boolean = false;
  showDisbursedAmount: boolean = false;
  financeSubStatus: string = '';
  disbursedAmount: string = '';

  // Dealer / Location
  selectedDealer: string = '';
  selectedSaleDealer: string = '';
  selectedState: string = '';
  selectedStateName: string = '';
  selectedDistrict: any;
  selectedTehsil: any;
  selectedVillage: any;

  // Salesman
  salesmanName: string = '';
  salesmanNumber: string = '';
  newSalesmanName: string = '';
  newSalesmanMobile: string = '';
  excFile: File | null = null;

  // Lists
  stateList: any[] = [];
  districtList: any[] = [];
  tehsilList: any[] = [];
  villageList: any[] = [];
  duplicateDealerList: any[] = [];
  originalDealersList: any[] = [];
  dealersList: PersonModel[] = [];
  variantOptions: any[] = [];

  // UI flags
  isMobileValid: boolean = false;
  todayDate: string = '';

  // Autofill temp holders
  autoFillStateCode: string | null = null;
  autoFillDistrictCode: string | null = null;
  autoFillTehsilCode: string | null = null;
  autoFillVillageCode: string | null = null;
  autoFillVillageName: string | null = null;
  autoFillSalesmanName: string = '';
  autoFillSalesmanNumber: string = '';

  // Update Mode
  isUpdateMode: boolean = false;
  updateSalesEnquiryId: string = '';
  updateFinanceMasterId: string = '';

  minDate: string = '';
  maxDate: string = '';
  misstatus: string = '';
  exchangeGapValid: boolean = true;
  exchangeMakeOther: string = '';
  showExchangeMakeOtherInput: boolean = false;

  followupError = '';
  deliveryError = '';
  actualDeliveryError = '';
  expectedRetailError = '';
  BookingError = '';


  showExcModelDrop: boolean = false;
  showExcModelInput: boolean = true;


  isHOLogin: boolean = false;
  selectedHOState: string = '';
  hoStateList: any[] = [];
  constructor(private router: Router, private http: HttpClient, private apis: AuthService) { }

  // STATIC MAPPINGS
  subSourceMapping: any = {
    'HO': ['FB/Insta', 'WhatsApp', 'Toll-Free', 'Website', 'Google', 'Others'],
    'AGGREGATOR': ['Tractor Junction', 'Tractor Guru', 'CMV 360', 'Tractor Gyaan', 'Plantix', 'Other'],
    'TM': ['Field Visit', 'BTL', 'HO Digital', 'Other'],
    'FO': ['Field Visit', 'BTL', 'HO Digital', 'Other'],
    'DEALER': ['Walkin', 'DSP', 'Sales Manager', 'HO Digital', 'Dealer Digital', 'MID', 'Local Expo', 'Van Campaign', 'Display', 'Field Demo', 'Other BTL'],
    'DES': ['Field Demo', 'Display', 'MID', 'Other'],
    'GPL CAMPAIGN': ['GPL VAN']
  };

  conversionChallengeMapping: any = {
    'Low Brand Recall': ['Dealership Visit Plan', 'Demo Plan', 'Existing Customer Visit Plan'],
    'Low Coverage': ['TM/FO Visit Plan', 'DSP Visit Plan', 'Dealership Visit Plan'],
    'Price Gap Issue': ['10000', '20000', '30000', '40000', '50000', '60000', '70000'],
    'Not Listed in Subsidy': ['Suggested Listed Model', 'Awaiting Subsidy Listing Update'],
    'Waiting for Mahurat': ['Continuous Follow-up', 'Trying to Prepone'],
    'Low LTV': ['Continuous Follow-up', 'Checking with other financer'],
    'Negative Area': ['Share case with Retail Head', 'Checking with other financer'],
    'Exchange Demand': ['10000', '20000', '30000', '40000', '50000', '60000', '70000'],
    'Model Availability Issue': ['Share case with State Head', 'Billing Request Shared', 'Model in Transit'],
    'Other': ['Others']
  };

  saleLostReasons: string[] = [
    'Brand Image', 'Better Price from Competition', 'Better Exchange Value from Competition',
    'Better Feature in Competition Model', 'DP Issue', 'Finance Issue', 'Other'
  ];

  droppedReasons: string[] = [
    'Plan Changed', 'Purchased Used Tractor', 'Planning After 6 Months', 'MM Issue', 'Fund Issue'
  ];

  exchangeMakeOptions: exchangeModelMaster[] = [];
  makeList: string[] = [];
  //exchangeMakeOptions: string[] = [
  //  'ITL', 'Solis', 'MM', 'PTL', 'TMTL', 'JD', 'CNH', 'TAFE', 'SDF', 'CAPTAIN', 'VST', 'IFARM', 'PREET', 'ACE', 'FT', 'PT', 'KUBOTA', 'GAEL', 'OTHER'
  //];

  financerOptions: string[] = ['MFSL', 'LTF', 'HDFC', 'ICICI', 'KOTAK', 'AU', 'YES', 'OTHER'];

  financeSubStatusOptions: string[] = ['FI Pending', 'Login Pending', 'Approval Pending', 'Disbursement Pending'];

  /*  exchangeHpCategories: string[] = ['< 20', '21–30', '31–40', '41–50', '> 50'];*/
  exchangeHpCategories: string[] = [];
  exchangeModels: string[] = [];
  // INITIALIZATION
  ngOnInit(): void {
    const now = new Date();

    const pad = (n: number): string => String(n).padStart(2, '0');

    const formatDate = (date: Date): string => {
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.minDate = formatDate(firstDay);
    this.maxDate = formatDate(lastDay);
    this.todayDate = formatDate(now);

    // Generate manufacturing year options (current year to 2000)
    const currentYear = now.getFullYear();
    this.mfgYearOptions = [];
    for (let year = currentYear; year >= 2000; year--) {
      this.mfgYearOptions.push(year.toString());
    }

    // Get user position and setup role-based visibility
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    const dealerCode = sessionStorage.getItem('dealerCode');
    this.misstatus = sessionStorage.getItem('misstatus') || '';

    // Show fields based on user role
    if (this.positionId === 'National Sales Head') {
      this.showSH = true; this.showAM = true; this.showTM = true; this.showDealer = true;
      this.isHOLogin = true;
      //this.getStateList();
    } else if (this.positionId === 'State Head') {
      this.showAM = true; this.showTM = true; this.showDealer = true;
    } else if (this.positionId === 'Area Manager') {
      this.showTM = true; this.showDealer = true;
    } else if (this.positionId === 'Territory Manager') {
      this.showDealer = true;
    } else {
      // Dealer role - auto-select dealer
      if (dealerCode) {
        this.selectedDealer = dealerCode;
        this.selectedSaleDealer = dealerCode;
        this.onDealerChange(this.selectedDealer);
      }
    }

    // Get enquiry source options based on role
    this.enquirySource = this.getEnquirySourceOptions(this.positionId);

    // Load initial data
    //if (this.positionId !== 'National Sales Head') {
    //  this.getHOFilter();

    //}
    this.getHOFilter();
    this.getModelList();
    this.exchangeModelList();


  }

  // GET ENQUIRY SOURCE OPTIONS BASED ON ROLE
  getEnquirySourceOptions(role: string): string[] {
    switch (role) {
      case 'National Sales Head':
        return ['HO', 'Aggregator', 'GPL CAMPAIGN'];
      case 'State Head':
        return ['AM', 'TM', 'FO', 'DES', 'Dealer', 'GPL CAMPAIGN'];
      case 'Area Manager':
      case 'Territory Manager':
      case 'FO':
        return ['Dealer', 'DES', 'FO', 'GPL CAMPAIGN'];
      case 'Dealer':
        return ['DES', 'Dealer', 'GPL CAMPAIGN'];
      default:
        return ['HO', 'TM', 'AM', 'FO', 'DES', 'Dealer', 'Aggregator', 'GPL CAMPAIGN'];
    }
  }

  // SOURCE CHANGE - UPDATE SUB-SOURCE OPTIONS
  onSourceChange() {
    const sourceKey = (this.selectedSource || '').toUpperCase();
    const mappingKey = sourceKey === 'AM' ? 'TM' : sourceKey;
    this.subSourceOptions = this.subSourceMapping[mappingKey] || [];
    this.selectedSubSource = '';
  }

  // GET MODEL LIST FROM API
  getModelList(): void {
    this.apis.getModelList().subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase() === 'success') {
          this.modalList = response.data;
          if (this.modalList.length > 0) {
            // Extract unique HP categories and group into ranges
            const categories = [...new Set(this.modalList.map((item: any) => parseInt(item.HpCategory)).filter((num: number) => !isNaN(num)))].sort((a: number, b: number) => a - b);
            this.uniqueHpCategories = this.groupIntoRanges(categories);
          }
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.');
      }
    });
  }

  // GROUP HP CATEGORIES INTO RANGES (21-25, 26-30, etc.)
  private groupIntoRanges(categories: number[]): string[] {
    const ranges: string[] = [];
    if (!categories.length) return ranges;
    const min = categories[0];
    const max = categories[categories.length - 1];
    let rangeStart = Math.floor((min - 1) / 5) * 5 + 1;
    let rangeEnd = rangeStart + 4;
    while (rangeStart <= max) {
      if (categories.some((cat: number) => cat >= rangeStart && cat <= rangeEnd)) {
        ranges.push(`${rangeStart}-${rangeEnd}`);
      }
      rangeStart += 5;
      rangeEnd += 5;
    }
    return ranges;
  }

  // HP CATEGORY CHANGE - LOAD DRIVE TYPES
  onHpChange() {
    this.interestedDrive = '';
    this.interestedModel = '';
    this.variantCode = '';
    this.variantOptions = [];
    this.modelsForSelectedDrive = [];
    if (!this.interestedHP) { this.driveTypesForSelectedHP = []; return; }
    this.fillDriveTypes(this.interestedHP);
  }

  // DRIVE TYPE CHANGE - LOAD MODELS
  onDriveChange() {
    this.interestedModel = '';
    this.variantCode = '';
    this.variantOptions = [];
    if (!this.interestedDrive || !this.interestedHP) { this.modelsForSelectedDrive = []; return; }
    this.fillModels(this.interestedHP, this.interestedDrive);
  }

  // MODEL CHANGE - SET VARIANT CODE
  onModelChange() {
    this.variantCode = '';
    this.variantOptions = [];
    if (!this.interestedModel || !this.interestedHP || !this.interestedDrive) return;

    const [start, end] = this.interestedHP.split('-').map(x => parseInt(x));
    this.variantOptions = this.modalList.filter((item: any) => {
      const hp = parseInt(item.HpCategory);
      return hp >= start && hp <= end &&
        item.DriveType === this.interestedDrive &&
        item.ModelName === this.interestedModel;
    });

    // Agar sirf ek hi BOM code hai to auto-select karo
    if (this.variantOptions.length === 1) {
      this.variantCode = this.variantOptions[0].ModelCode;
    }
  }

  // FILL DRIVE TYPES BASED ON HP RANGE
  private fillDriveTypes(hpRange: string) {
    if (!hpRange) { this.driveTypesForSelectedHP = []; return; }
    const [start, end] = hpRange.split('-').map(x => parseInt(x));
    this.driveTypesForSelectedHP = [...new Set(
      this.modalList
        .filter((item: any) => { const hp = parseInt(item.HpCategory); return hp >= start && hp <= end; })
        .map((item: any) => item.DriveType)
    )];
  }

  // FILL MODELS BASED ON HP RANGE AND DRIVE TYPE
  private fillModels(hpRange: string, driveType: string) {
    if (!hpRange || !driveType) { this.modelsForSelectedDrive = []; return; }
    const [start, end] = hpRange.split('-').map(x => parseInt(x));
    const filtered = this.modalList.filter((item: any) => {
      const hp = parseInt(item.HpCategory);
      return hp >= start && hp <= end && item.DriveType === driveType;
    });
    const map = new Map<string, any>();
    filtered.forEach((item: any) => { if (!map.has(item.ModelName)) map.set(item.ModelName, item); });
    this.modelsForSelectedDrive = Array.from(map.values());
  }

  // MOBILE NUMBER ENTERED - CHECK FOR EXISTING ENQUIRY
  onMobileEntered() {
    if (this.mobileNo && this.mobileNo.length === 10 && /^[0-9]{10}$/.test(this.mobileNo)) {
      this.getStateListNew();
      this.apis.getSalesEnquiry({ ProspectMobileNumber: this.mobileNo }).subscribe({
        next: (res: any) => {
          this.duplicateDealerList = [];

          if (res?.statusCode === 200 && res?.data && res.data.length > 0) {
            // Show modal for ANY existing enquiry (1 or more)
            this.duplicateDealerList = res.data;
            const modalEl = document.getElementById('dealerModal');
            if (modalEl) new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false }).show();
            this.applyDuplicateFilter();
          } else {
            // No enquiry found - allow new entry
            this.isMobileValid = true;
            this.clearEnquiryForm();
            this.applyDuplicateFilter();
            if (this.positionId === 'Dealer') {
              const dc = sessionStorage.getItem('dealerCode');
              if (dc) {
                this.selectedDealer = dc;
                this.onDealerChange(this.selectedDealer);
              }
            }
          }
        },
        error: () => {
          this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.');
        }
      });
    } else {
      this.isMobileValid = false;
      this.clearEnquiryForm();
      this.duplicateDealerList = [];
      this.applyDuplicateFilter();
    }
  }

  // AUTOFILL FORM WITH EXISTING ENQUIRY DATA
  autoFillForm(data: any): void {
    //if (this.positionId === 'National Sales Head') {
    //  debugger;
    //  this.getHOFilter();
    //}

    this.customerName = data.prospectName || '';
    this.prospectPin = data.prospectPINCode || '';
    this.otherVillageName = data.otherVillageName || '';

    // Store data for later use
    this.autoFillStateCode = data.stateCode;
    this.autoFillDistrictCode = data.prospectDistrictCode;
    this.autoFillTehsilCode = data.prospectTehsilCode;
    this.autoFillVillageCode = data.prospectVillageCode;
    this.autoFillVillageName = data.prospectVillage;
    this.autoFillSalesmanName = data.salesmenName || '';
    this.autoFillSalesmanNumber = data.salesmenNumber || '';

    // Step 1: Match State Head by name (case-insensitive)
    if (data.stateHead && this.showSH) {
      const foundSH = this.stateHead.find(sh =>
        sh.Name?.toLowerCase() === data.stateHead?.toLowerCase()
      );
      if (foundSH) {
        this.selectedSH = foundSH.Mail;

        // Load AM list and continue
        this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
          next: (response: any) => {
            if (response.message?.toLowerCase() === 'success') {
              this.areaManagersList = response.data.areaManagers || [];
              this.territoryManagersList = response.data.territoryManagers || [];
              this.originalDealersList = response.data.dealers || [];
              this.applyDuplicateFilter();

              // Step 2: Match Area Manager
              if (data.nameAm && this.showAM) {
                const foundAM = this.areaManagersList.find(am =>
                  am.Name?.toLowerCase() === data.nameAm?.toLowerCase()
                );
                if (foundAM) {
                  this.selectedAM = foundAM.Mail;

                  // Load TM list and continue
                  this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: this.selectedAM, TmMail: '', DealerMail: '' }).subscribe({
                    next: (resp2: any) => {
                      if (resp2.message?.toLowerCase() === 'success') {
                        this.territoryManagersList = resp2.data.territoryManagers || [];
                        this.originalDealersList = resp2.data.dealers || [];
                        this.applyDuplicateFilter();

                        // Step 3: Match Territory Manager
                        if (data.nameTm && this.showTM) {
                          const foundTM = this.territoryManagersList.find(tm =>
                            tm.Name?.toLowerCase() === data.nameTm?.toLowerCase()
                          );
                          if (foundTM) {
                            this.selectedTM = foundTM.Mail;

                            // Load Dealer list and continue
                            this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: this.selectedAM, TmMail: this.selectedTM, DealerMail: '' }).subscribe({
                              next: (resp3: any) => {
                                if (resp3.message?.toLowerCase() === 'success') {
                                  this.originalDealersList = resp3.data.dealers || [];
                                  this.applyDuplicateFilter();

                                  // Step 4: Load Dealer
                                  this.loadDealerData(data);
                                }
                              }
                            });
                          } else {
                            this.loadDealerData(data);
                          }
                        } else {
                          this.loadDealerData(data);
                        }
                      }
                    }
                  });
                } else {
                  this.loadDealerData(data);
                }
              } else {
                this.loadDealerData(data);
              }
            }
          }
        });
      } else {
        this.loadDealerData(data);
      }
    } else if (data.nameAm && this.showAM) {
      // Direct AM selection (no SH)
      const foundAM = this.areaManagersList.find(am =>
        am.Name?.toLowerCase() === data.nameAm?.toLowerCase()
      );
      if (foundAM) {
        this.selectedAM = foundAM.Mail;
        this.onAreaChange(this.selectedAM);

        setTimeout(() => {
          if (data.nameTm && this.showTM) {
            const foundTM = this.territoryManagersList.find(tm =>
              tm.Name?.toLowerCase() === data.nameTm?.toLowerCase()
            );
            if (foundTM) {
              this.selectedTM = foundTM.Mail;
              this.onTerritoryChange(this.selectedTM);
              setTimeout(() => this.loadDealerData(data), 500);
            } else {
              this.loadDealerData(data);
            }
          } else {
            this.loadDealerData(data);
          }
        }, 500);
      } else {
        this.loadDealerData(data);
      }
    } else if (data.nameTm && this.showTM) {
      // Direct TM selection (no SH, no AM)
      const foundTM = this.territoryManagersList.find(tm =>
        tm.Name?.toLowerCase() === data.nameTm?.toLowerCase()
      );
      if (foundTM) {
        this.selectedTM = foundTM.Mail;
        this.onTerritoryChange(this.selectedTM);
        setTimeout(() => this.loadDealerData(data), 500);
      } else {
        this.loadDealerData(data);
      }
    } else {
      // No hierarchy selection
      this.loadDealerData(data);
    }

    // HP / Drive / Model chain
    this.interestedHP = data.hpCategory || '';
    if (this.interestedHP) {
      this.isAutoFilling = true;
      this.fillDriveTypes(this.interestedHP);
    }
    this.interestedDrive = data.driveType || '';
    if (this.interestedDrive && this.interestedHP) {
      this.fillModels(this.interestedHP, this.interestedDrive);
    }

    this.interestedModel = data.interestedModel || '';
    this.variantCode = data.variant || '';

    // Autofill ke liye variant options load karo
    if (this.interestedModel && this.interestedHP && this.interestedDrive) {
      const [start, end] = this.interestedHP.split('-').map(x => parseInt(x));
      this.variantOptions = this.modalList.filter((item: any) => {
        const hp = parseInt(item.HpCategory);
        return hp >= start && hp <= end &&
          item.DriveType === this.interestedDrive &&
          item.ModelName === this.interestedModel;
      });
    }

    if (data.enquirySource && !this.enquirySource.some(s => s.toLowerCase() === data.enquirySource.toLowerCase())) {
      this.enquirySource = [...this.enquirySource, data.enquirySource];
    }

    // Source (case-insensitive match)
    this.setSourceAndSubSource(data.enquirySource, data.enquirySubSource);

    // Dates - convert from DD-MM-YYYY to YYYY-MM-DD
    this.nextFollowupDate = this.parseDateToISO(data.nextFollowupDate) || '';
    this.expectedDeliveryDate = this.parseDateToISO(data.expDeliveryDate) || '';
    this.updateEnquiryType();

    // Conversion challenge (case-insensitive)
    this.conversionChallenge = this.findCaseInsensitiveMatch(data.conversionChallenge, Object.keys(this.conversionChallengeMapping)) || '';
    if (this.conversionChallenge) {
      this.actionPlannedOptions = this.conversionChallengeMapping[this.conversionChallenge] || [];
    }
    this.actionPlanned = data.actionPlanned || '';
    this.showOtherActionRemark = (this.actionPlanned === 'Others');

    // Enquiry current status (case-insensitive)
    this.enquiryCurrentStatus = this.findCaseInsensitiveMatch(data.enquiryCurrentStatus, ['Open', 'Booking', 'Closed']) || '';

    if (this.enquiryCurrentStatus === 'Booking') {
      this.showBookingFields = true;
      this.bookingDate = this.parseDateToISO(data.bookingDate) || '';
      this.bookingAmount = data.bookingAmount ? data.bookingAmount.toString() : '';
    } else if (this.enquiryCurrentStatus === 'Closed') {
      this.showClosedFields = true;

      // Enquiry closed status (case-insensitive)
      const closedStatusOptions = ['Sale Lost', 'Dropped', 'Delivered', 'Purchased Used Tractor'];
      this.enquiryClosedStatus = this.findCaseInsensitiveMatch(data.enquiryStatus || data.closedDroppedStatus, closedStatusOptions) || '';

      if (this.enquiryClosedStatus) {
        this.applyClosedSubStatus();

        // Autofill Delivered section data
        if (this.enquiryClosedStatus === 'Delivered') {
          this.deliveryDate = this.parseDateToISO(data.enquiryDate) || '';
          this.chassisNumber = ''; // Will be filled from dropdown

          // Prospect type (case-insensitive)
          const prospectTypeOptions = ['1st Time Tractor Buyer', 'Exchange', 'Multi Tractor Owner', 'Existing Gromax Customer'];
          this.prospectType = this.findCaseInsensitiveMatch(data.prospectType, prospectTypeOptions) || '';

          this.finalSalePrice = data.finalSalePrice ? data.finalSalePrice.toString() : '';

          // Payment type (case-insensitive)
          this.paymentType = this.findCaseInsensitiveMatch(data.paymentType, ['Cash', 'Loan']) || '';

          // Autofill Exchange fields if prospect type is Exchange
          if (this.prospectType === 'Exchange') {
            this.showExchangeFields = true;

            // Exchange make (case-insensitive)
            const matchedMake = this.findCaseInsensitiveMatch(data.exchangeMake, this.makeList);
            if (matchedMake) {
              this.exchangeMake = matchedMake;
              this.showExchangeMakeOtherInput = (matchedMake?.toLowerCase() === 'other');
              if (this.showExchangeMakeOtherInput) {
                this.exchangeMakeOther = data.exchangeMake || '';
              }
            } else if (data.exchangeMake) {
              this.exchangeMake = 'Other';
              this.showExchangeMakeOtherInput = true;
              this.exchangeMakeOther = data.exchangeMake;
            } else {
              this.exchangeMake = '';
              this.showExchangeMakeOtherInput = false;
              this.exchangeMakeOther = '';
            }

            this.exchangeModel = data.exchangeModel || '';
            this.exchangeMfgYear = data.mfgYear || '';
            this.exchangeHpCategorie = data.exchangeHpCategory || '';
            this.mktValueExchangeTractor = data.mktValueExchange ? data.mktValueExchange.toString() : '';
            this.finalPriceExchangeTractor = data.finalPriceExchange ? data.finalPriceExchange.toString() : '';
            this.customerAskExcTractor = data.customerAskExchange ? data.customerAskExchange.toString() : '';

            // Exchange stock entry type (case-insensitive)
            const stockEntryOptions = ['Serial No', 'Registration No', 'Other'];
            this.exchangeStockEntryType = this.findCaseInsensitiveMatch(data.exchangeStockEntry, stockEntryOptions) || '';

            this.exchangeStockEntryValue = data.exchangeStockEntryValue || '';
          }

          // Autofill Payment fields
          if (this.paymentType === 'Cash') {
            this.showCashFields = true;
            this.cashDpAmount = data.dpAmount ? data.dpAmount.toString() : '';
            this.cashDueAmount = data.dueAmount ? data.dueAmount.toString() : '';
          } else if (this.paymentType === 'Loan') {
            this.showLoanFields = true;
            this.loanDpAmount = data.dpAmount ? data.dpAmount.toString() : '';
            this.loanRequired = data.loanRequired ? data.loanRequired.toString() : '';
            this.customerDues = data.dueAmount ? data.dueAmount.toString() : '';

            // Financer name (case-insensitive)
            this.financerName = this.findCaseInsensitiveMatch(data.financerName, this.financerOptions) || '';

            //if (this.financerName === 'OTHER') {
            //  this.showFinancerOtherInput = true;
            //  this.financerNameOther = data.manualFinancerName || '';
            //}

            // Loan type (case-insensitive)
            this.loanType = this.findCaseInsensitiveMatch(data.loanType, ['KYC', 'Normal']) || '';

            // Finance status (case-insensitive)
            const financeStatusOptions = ['In-Process', 'Approved', 'Not Approved', 'Disbursed'];
            this.financeStatus = this.findCaseInsensitiveMatch(data.financeStatus, financeStatusOptions) || '';

            if (this.financeStatus === 'In-Process') {
              this.showFinanceSubStatus = true;
              this.financeSubStatus = this.findCaseInsensitiveMatch(data.financeStatusDetail, this.financeSubStatusOptions) || '';
            }
            if (this.financeStatus === 'Disbursed') {
              this.showDisbursedAmount = true;
              this.disbursedAmount = data.disbursedAmount || '';
            }
          }
        }

        // Autofill Sale Lost
        if (this.enquiryClosedStatus === 'Sale Lost') {
          this.saleLostReason = this.findCaseInsensitiveMatch(data.saleLostReason, this.saleLostReasons) || '';
          if (this.saleLostReason === 'Other') {
            this.showSaleLostOtherRemark = true;
            this.saleLostOtherRemark = data.saleLostReason || '';
          }
        }

        // Autofill Dropped
        if (this.enquiryClosedStatus === 'Dropped') {
          this.droppedReason = this.findCaseInsensitiveMatch(data.saleLostReason, this.droppedReasons) || '';
        }
      }
    }

    this.selectedState = data.stateCode || '';
    // SET UPDATE MODE AND IDs
    this.isUpdateMode = true;

    this.updateSalesEnquiryId = data.SalesEnquiryId || '';
    this.updateFinanceMasterId = data.FinanceMasterId || '';
  }

  private loadDealerData(data: any): void {
    this.selectedDealer = data.dealershipCode || '';
    if (this.selectedDealer) {
      this.onDealerChange(this.selectedDealer);
    }
  }

  // CASE-INSENSITIVE MATCH HELPER
  private findCaseInsensitiveMatch(value: string, options: string[]): string {
    if (!value) return '';
    const lowerValue = value.toLowerCase();
    const found = options.find(opt => opt.toLowerCase() === lowerValue);
    return found || '';
  }

  // PARSE DATE FROM DD-MM-YYYY TO YYYY-MM-DD
  private parseDateToISO(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // DD-MM-YYYY to YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  // APPLY CLOSED SUB-STATUS FIELDS
  private applyClosedSubStatus(): void {
    this.showSaleLostFields = false;
    this.showDroppedFields = false;
    this.showDeliveredFields = false;

    if (this.enquiryClosedStatus === 'Sale Lost') {
      this.showSaleLostFields = true;
    } else if (this.enquiryClosedStatus === 'Dropped') {
      this.showDroppedFields = true;
    } else if (this.enquiryClosedStatus === 'Delivered') {
      this.showDeliveredFields = true;
      this.loadChassisOptions();
    }
  }

  private setSourceAndSubSource(source: string, subSource: string) {
    const matchedSource = this.findCaseInsensitiveMatch(source, this.enquirySource);
    this.selectedSource = matchedSource || source || '';

    const sourceKey = (this.selectedSource || '').toUpperCase();
    this.subSourceOptions = this.subSourceMapping[sourceKey] || [];

    if (subSource && !this.subSourceOptions.some(s => s.toLowerCase() === subSource.toLowerCase())) {
      this.subSourceOptions = [...this.subSourceOptions, subSource];
    }

    const matchedSubSource = this.findCaseInsensitiveMatch(subSource, this.subSourceOptions);
    this.selectedSubSource = matchedSubSource || subSource || '';
  }

  // DEALER SELECTED FROM MODAL
  onDealerSelected(selectedItem: any) {
    this.autoFillForm(selectedItem);
    this.isMobileValid = true;
    this.dealersList = this.originalDealersList.filter((d: any) => {
      return d.Name === selectedItem.dealershipCode || !this.duplicateDealerList.some((dd: any) => dd.dealershipCode === d.Name);
    });
    const modalEl = document.getElementById('dealerModal');
    if (modalEl) { const m = bootstrap.Modal.getInstance(modalEl); if (m) m.hide(); }
    this.duplicateDealerList = [];
  }

  // GENERATE NEW ENQUIRY FROM MODAL
  generateNewEnquiry() {

    const modalEl = document.getElementById('dealerModal');
    if (modalEl) { const m = bootstrap.Modal.getInstance(modalEl); if (m) m.hide(); }

    this.isMobileValid = true;

    // Filter and set dealers FIRST
    this.dealersList = this.duplicateDealerList?.length > 0
      ? this.originalDealersList.filter((dealer: any) => {
        const hasEnquiry = this.duplicateDealerList.some((duplicate: any) => {
          return duplicate.dealershipCode === dealer.Name ||
            duplicate.dealershipCode === dealer.DealerCode ||
            duplicate.dealerCode === dealer.Name;
        });
        return !hasEnquiry;
      })
      : [...this.originalDealersList];

    this.clearEnquiryForm();
  }

  // CLOSE DEALER MODAL
  closeDealerModal() {
    const modalEl = document.getElementById('dealerModal');
    if (modalEl) { const m = bootstrap.Modal.getInstance(modalEl); if (m) m.hide(); }
    this.mobileNo = '';
  }

  // GET HO FILTER (State Head, Area Manager, Territory Manager, Dealer)
  getHOFilter(): void {
    this.selectedSH = '';
    this.apis.getHOFilter({ ShMail: '', AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.stateHead = this.apiresponse.data.stateHead || [];
          this.areaManagersList = this.apiresponse.data.areaManagers || [];
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.originalDealersList = this.apiresponse.data.dealers || [];
          this.applyDuplicateFilter();
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.'); }
    });
  }

  // APPLY DUPLICATE DEALER FILTER - FIXED VERSION
  applyDuplicateFilter() {
    if (this.duplicateDealerList?.length > 0) {


      this.dealersList = this.originalDealersList.filter((dealer: any) => {
        const isDuplicate = this.duplicateDealerList.some((duplicate: any) =>
          duplicate.dealershipCode === dealer.Name
        );

        if (isDuplicate) {
          /*console.log(`Filtering out dealer: ${dealer.Name} (${dealer.DealerName})`);*/
        }

        return !isDuplicate;
      });


    } else {
      this.dealersList = [...this.originalDealersList];
    }
  }

  // STATE HEAD CHANGE
  onStateChange(mail: string): void {

    this.selectedAM = ''; this.selectedTM = ''; this.selectedDealer = '';
    this.villageList = []; this.districtList = []; this.tehsilList = []; this.dealersList = []; this.territoryManagersList = [];
    this.apis.getHOFilter({ ShMail: mail, AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {

        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.areaManagersList = this.apiresponse.data.areaManagers || [];
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.originalDealersList = this.apiresponse.data.dealers || [];
          this.applyDuplicateFilter();
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred.'); }
    });
  }

  // AREA MANAGER CHANGE
  onAreaChange(mail: string): void {
    this.selectedTM = ''; this.selectedDealer = '';
    this.villageList = []; this.districtList = []; this.tehsilList = []; this.dealersList = [];
    this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: mail, TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.originalDealersList = this.apiresponse.data.dealers || [];
          this.applyDuplicateFilter();
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred.'); }
    });
  }

  // TERRITORY MANAGER CHANGE
  onTerritoryChange(mail: string): void {
    this.selectedDealer = '';
    this.villageList = []; this.districtList = []; this.tehsilList = [];
    this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: this.selectedAM, TmMail: mail, DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.originalDealersList = this.apiresponse.data.dealers || [];
          this.applyDuplicateFilter();
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred.'); }
    });
  }

  onDealerChange(dealerCode: string): void {

    if (dealerCode === 'Not Assigned') {
      this.salesmanList = [];
      this.chassisOptions = [];
      this.enquiryCurrentStatus = 'Open';
      this.onEnquiryCurrentStatusChange();
      return;
    }

    if (this.positionId === 'National Sales Head') {
      if (!this.isUpdateMode) {
        this.getSalesmanList();
        return;
      }
    }

    this.districtList = []; this.tehsilList = []; this.villageList = []; this.salesmanList = [];
    this.chassisOptions = [];
    this.getSalesmanList();
    this.apis.getStateList(dealerCode).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.selectedState = this.apiresponse.data?.[0]?.StateCode || '';
          this.selectedStateName = this.apiresponse.data?.[0]?.State || '';
          if (this.selectedState) this.loadDistrictsByState();
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching dealer state.'); }
    });
  }

  // LOAD DISTRICTS BY STATE
  loadDistrictsByState(): void {
    this.districtList = [];
    if (!this.selectedState) return;
    this.apis.getDistrictList('State', this.selectedStateName, this.selectedState).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.districtList = this.apiresponse.data;
          if (this.autoFillDistrictCode) {
            this.selectedDistrict = this.districtList.find((d: any) => d.DistrictCode === this.autoFillDistrictCode);
            this.autoFillDistrictCode = null;
            this.onDistrictChange();
          }
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching districts.'); }
    });
  }

  // DISTRICT CHANGE - LOAD TEHSILS
  onDistrictChange(event?: any): void {
    this.selectedTehsil = null; this.tehsilList = []; this.villageList = [];
    if (!this.selectedDistrict?.DistrictCode) return;
    this.apis.getDistrictList('District', this.selectedDistrict.DistrictName, this.selectedDistrict.DistrictCode).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.tehsilList = this.apiresponse.data;
          if (this.autoFillTehsilCode) {
            this.selectedTehsil = this.tehsilList.find((t: any) => t.TehsilCode === this.autoFillTehsilCode);
            this.autoFillTehsilCode = null;
            this.onTehsilChange();
          }
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching tehsils.'); }
    });
  }

  // TEHSIL CHANGE - LOAD VILLAGES
  onTehsilChange(event?: any): void {
    this.selectedVillage = null; this.villageList = [];
    if (!this.selectedTehsil?.TehsilCode) return;
    this.apis.getDistrictList('Tehsil', this.selectedTehsil.TehsilName, this.selectedTehsil.TehsilCode).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.villageList = this.apiresponse.data;
          if (this.autoFillVillageCode) {
            const found = this.villageList.find((v: any) => v.VillageCode === this.autoFillVillageCode);
            if (found) {
              this.selectedVillage = found;
            } else {
              this.selectedVillage = { VillageCode: this.autoFillVillageCode, VillageName: this.autoFillVillageName };
              this.villageList.push(this.selectedVillage);
            }
            this.autoFillVillageCode = null;
            this.autoFillVillageName = null;
          }
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching villages.'); }
    });
  }

  // FOLLOWUP DATE CHANGE
  onFollowupChange(event: any) {
    const value = event.target.value;

    // Reset errors
    this.followupError = '';
    this.deliveryError = '';

    // ❌ Case 1: Followup < Today
    if (value && value < this.todayDate) {
      this.followupError = 'Followup date cannot be in the past';
      this.nextFollowupDate = '';
      return;
    }

    // ✅ Assign valid followup date
    this.nextFollowupDate = value;

    // ❌ Case 2: Delivery < Followup
    if (this.expectedDeliveryDate && this.expectedDeliveryDate < this.nextFollowupDate) {
      this.deliveryError = 'Delivery date must be greater than or equal to Followup date';
      this.expectedDeliveryDate = '';
    }

    this.updateEnquiryType();
  }

  // FOLLOWUP DATE CHANGE
  expeRetailChange(event: any) {

    const value = event.target.value;

    // Reset errors
    this.expectedRetailDate = '';
    this.expectedRetailError = '';

    // ❌ Case 1: Followup < Today
    if (value && value < this.todayDate) {
      this.expectedRetailError = 'Retail date cannot be in the past';
      return;
    }

    // ✅ Assign valid followup date
    this.expectedRetailDate = value;


  }

  // DELIVERY DATE CHANGE
  onDeliveryChange(event: any) {
    const value = event.target.value;

    // Reset error
    this.deliveryError = '';

    const minDate = this.nextFollowupDate || this.todayDate;

    // ❌ Invalid: Delivery < Followup / Today
    if (value && value < minDate) {
      this.deliveryError = 'Delivery date must be on or after the followup date';
      this.expectedDeliveryDate = '';
      return;
    }

    // ✅ Valid case
    this.expectedDeliveryDate = value;

    this.updateEnquiryType();
  }

  //onActulDeliveryDateChange
  onActulDeliveryDateChange(event: any) {
   
    const value = event.target.value;
    this.actualDeliveryError = '';

    // ✅ Helper function - local timezone ke sath kaam karega
    const toLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const todayDate = toLocalDateString(today);

    // ✅ Current month start (1st date) - sahi timezone ke sath
    const currentMonthStart = toLocalDateString(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    console.log('today', todayDate);
    console.log('startDate', currentMonthStart);
    // ❌ Invalid cases
    if (
      value &&
      (
        value > todayDate ||          // future not allowed
        value < currentMonthStart     // not in current month
      )
    ) {
      this.actualDeliveryError = 'Please select a date within the current month and not in the future';
      this.deliveryDate = '';
      return;
    }

    // ✅ Valid case
    this.deliveryDate = value;
  }

  onBookingDateChange(event: any) {
    const value = event.target.value;

    // Reset error
    this.BookingError = '';
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];

    // ✅ current month start (1st date)
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    ).toISOString().split('T')[0];

    // ❌ Invalid: Delivery < Followup / Today
    if (value && (value < today || value > todayDate)) {
      this.BookingError = 'Booking date must be within the current month and on or before today.';
      this.bookingDate = '';
      return;
    }

    // ✅ Valid case
    this.bookingDate = value;

    this.updateEnquiryType();
  }

  // UPDATE ENQUIRY TYPE (Hot/Warm/Cold) BASED ON DATE DIFFERENCE
  updateEnquiryType() {
    if (this.expectedDeliveryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expected = new Date(this.expectedDeliveryDate);
      expected.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      this.enquiryType = diffDays <= 7 ? 'SuperHot' : diffDays <= 30 ? 'Hot' : diffDays <= 60 ? 'Warm' : 'Cold';
    } else {
      this.enquiryType = '';
    }
  }

  // CONVERSION CHALLENGE CHANGE
  onConversionChallengeChange(): void {
    this.actionPlanned = '';
    this.otherActionRemark = '';
    this.showOtherActionRemark = false;
    this.actionPlannedOptions = this.conversionChallenge ? (this.conversionChallengeMapping[this.conversionChallenge] || []) : [];
  }

  // ACTION PLANNED CHANGE
  onActionPlannedChange(): void {
    this.showOtherActionRemark = (this.actionPlanned === 'Others');
    if (!this.showOtherActionRemark) this.otherActionRemark = '';
  }

  // ENQUIRY CURRENT STATUS CHANGE
  onEnquiryCurrentStatusChange(): void {
    this.showBookingFields = false;
    this.showClosedFields = false;
    this.bookingDate = '';
    this.resetClosedFields();

    if (this.enquiryCurrentStatus === 'Booking') {
      this.showBookingFields = true;
    } else if (this.enquiryCurrentStatus === 'Closed') {
      this.showClosedFields = true;
      if (this.bookingAmount) {
        this.showBookingFields = true;
      }
    }
  }

  // ENQUIRY CLOSED STATUS CHANGE
  onEnquiryClosedStatusChange(): void {
    // Reset all closed fields
    this.showSaleLostFields = false;
    this.showDroppedFields = false;
    this.showDeliveredFields = false;
    this.saleLostReason = '';
    this.saleLostOtherRemark = '';
    this.showSaleLostOtherRemark = false;
    this.droppedReason = '';
    this.deliveryDate = '';
    this.chassisNumber = '';
    this.chassisOptions = [];
    this.prospectType = '';
    this.showExchangeFields = false;
    this.exchangeMake = '';
    this.exchangeMakeOther = '';
    this.showExchangeMakeOtherInput = false;
    this.exchangeModel = '';
    this.exchangeMfgYear = '';
    this.exchangeHpCategorie = '';
    this.mktValueExchangeTractor = '';
    this.finalPriceExchangeTractor = '';
    this.customerAskExcTractor = '';
    this.exchangeStockEntryType = '';
    this.exchangeStockEntryValue = '';
    this.finalSalePrice = '';
    this.resetPaymentFields();
    this.exchangeGapValid = true;
    // Show appropriate fields based on closed status
    if (this.enquiryClosedStatus === 'Sale Lost') {
      this.showSaleLostFields = true;
    } else if (this.enquiryClosedStatus === 'Dropped') {
      this.showDroppedFields = true;
    } else if (this.enquiryClosedStatus === 'Delivered') {

      this.showDeliveredFields = true;
      this.deliveryDate = this.todayDate;
      this.loadChassisOptions();
    }
  }

  // LOAD CHASSIS OPTIONS FROM API
  loadChassisOptions(): void {
    if (!this.selectedDealer) {
      this.chassisOptions = [];
      return;
    }
    this.apis.getChassisNumber({ dealerCode: this.selectedDealer }).subscribe({
      next: (data: any) => {
        if (data?.message?.toLowerCase() === 'success') {
          this.chassisOptions = data.data?.map((item: any) => item.chasisno) || [];
        } else {
          this.chassisOptions = [];
        }
      },
      error: () => {
        this.chassisOptions = [];
        this.apis.showAlert('error', 'Error!', 'Error fetching chassis numbers.');
      }
    });
  }

  // SALE LOST REASON CHANGE
  onSaleLostReasonChange(): void {
    this.showSaleLostOtherRemark = (this.saleLostReason === 'Other');
    if (!this.showSaleLostOtherRemark) {
      this.saleLostOtherRemark = '';
    }
  }

  // PROSPECT TYPE CHANGE
  onProspectTypeChange(): void {
    // Show exchange fields only for "Exchange" prospect type
    this.showExchangeFields = (this.prospectType === 'Exchange');

    // Reset exchange data
    this.exchangeMake = '';
    this.exchangeMakeOther = '';
    this.showExchangeMakeOtherInput = false;
    this.exchangeModel = '';
    this.exchangeMfgYear = '';
    this.exchangeHpCategorie = '';
    this.mktValueExchangeTractor = '';
    this.finalPriceExchangeTractor = '';
    this.customerAskExcTractor = '';
    this.exchangeStockEntryType = '';
    this.exchangeStockEntryValue = '';
    this.exchangeGapValid = true;
    this.exchangeModels = [];
    this.exchangeHpCategories = [];
    this.excFile = null;
    // Recalculate due amounts
    if (this.paymentType === 'Cash') {
      this.calculateCashDueAmount();
    } else if (this.paymentType === 'Loan') {
      this.calculateCustomerDues();
    }
  }

  // EXCHANGE STOCK ENTRY TYPE CHANGE
  onExchangeStockEntryTypeChange(): void {
    this.exchangeStockEntryValue = '';
  }

  // FINAL SALE PRICE CHANGE
  onFinalSalePriceChange(): void {
    if (this.paymentType === 'Cash') {
      this.calculateCashDueAmount();
    } else if (this.paymentType === 'Loan') {
      this.calculateCustomerDues();
    }
  }

  // MARKET VALUE CHANGE
  onfinalPriceChange(): void {
    if (this.paymentType === 'Cash') {
      this.calculateCashDueAmount();
    } else if (this.paymentType === 'Loan') {
      this.calculateCustomerDues();
    }
  }

  // PAYMENT TYPE CHANGE
  onPaymentTypeChange(): void {
    this.showCashFields = (this.paymentType === 'Cash');
    this.showLoanFields = (this.paymentType === 'Loan');

    // Reset all payment fields
    this.cashDpAmount = '';
    this.cashDueAmount = '';
    this.loanDpAmount = '';
    this.loanRequired = '';
    this.customerDues = '';
    this.financerName = '';
    this.financerNameOther = '';
    this.showFinancerOtherInput = false;
    this.loanType = '';
    this.financeStatus = '';
    this.showFinanceSubStatus = false;
    this.showDisbursedAmount = false;
    this.financeSubStatus = '';
    this.disbursedAmount = '';
  }

  // CASH DP AMOUNT CHANGE
  onCashDpAmountChange(): void {
    this.calculateCashDueAmount();
  }

  // CALCULATE CASH DUE AMOUNT
  calculateCashDueAmount(): void {
    const finalSale = parseFloat(this.finalSalePrice) || 0;
    const mktValue = (this.prospectType === 'Exchange') ? (parseFloat(this.finalPriceExchangeTractor) || 0) : 0;
    const dp = parseFloat(this.cashDpAmount) || 0;
    const additional = parseFloat(this.additionalPayment) || 0;
    const booking = parseFloat(this.bookingAmount) || 0;
    const due = finalSale - (dp + mktValue + additional + booking);
    this.cashDueAmount = due > 0 ? due.toString() : '0';
    if (+this.cashDueAmount > 0) this.showAdditionalPayment = true;
  }

  // LOAN DP AMOUNT CHANGE
  onLoanDpAmountChange(): void {
    this.calculateCustomerDues();
  }

  // LOAN REQUIRED CHANGE
  onLoanRequiredChange(): void {
    this.calculateCustomerDues();
  }

  // CALCULATE CUSTOMER DUES
  calculateCustomerDues(): void {
    const finalSale = parseFloat(this.finalSalePrice) || 0;
    const dp = parseFloat(this.loanDpAmount) || 0;
    const mktValue = (this.prospectType === 'Exchange') ? (parseFloat(this.finalPriceExchangeTractor) || 0) : 0;
    const additional = parseFloat(this.additionalPayment) || 0;
    const disbursed = (this.financeStatus === 'Disbursed') ? (parseFloat(this.disbursedAmount) || 0) : 0;
    const booking = parseFloat(this.bookingAmount) || 0;
    const dues = finalSale - (dp + mktValue + additional + disbursed + booking);
    this.customerDues = dues > 0 ? dues.toString() : '0';
    if (+this.customerDues > 0) this.showAdditionalPayment = true;
  }

  // FINANCER NAME CHANGE
  onFinancerNameChange(): void {
    //this.showFinancerOtherInput = (this.financerName === 'OTHER');
    //if (!this.showFinancerOtherInput) {
    //  this.financerNameOther = '';
    //}
  }

  // FINANCE STATUS CHANGE
  onFinanceStatusChange(): void {
    this.calculateCustomerDues();

    this.showFinanceSubStatus = (this.financeStatus === 'In-Process');
    if (!this.showFinanceSubStatus) {
      this.financeSubStatus = '';
    }
    this.showDisbursedAmount = (this.financeStatus === 'Disbursed');
    if (!this.showDisbursedAmount) {
      this.disbursedAmount = '';
    }
  }

  // RESET CLOSED FIELDS
  resetClosedFields(): void {
    this.enquiryClosedStatus = '';
    this.showSaleLostFields = false;
    this.saleLostReason = '';
    this.showSaleLostOtherRemark = false;
    this.saleLostOtherRemark = '';
    this.showDroppedFields = false;
    this.droppedReason = '';
    this.showDeliveredFields = false;
    this.deliveryDate = '';
    this.chassisNumber = '';
    this.chassisOptions = [];
    this.prospectType = '';
    this.showExchangeFields = false;
    this.exchangeMake = '';
    this.exchangeMakeOther = '';
    this.showExchangeMakeOtherInput = false;
    this.exchangeModel = '';
    this.exchangeMfgYear = '';
    this.exchangeHpCategorie = '';
    this.mktValueExchangeTractor = '';
    this.finalPriceExchangeTractor = '';
    this.customerAskExcTractor = '';
    this.exchangeStockEntryType = '';
    this.exchangeStockEntryValue = '';
    this.finalSalePrice = '';
    this.resetPaymentFields();
  }

  // RESET PAYMENT FIELDS
  resetPaymentFields(): void {
    this.paymentType = '';
    this.showCashFields = false;
    this.showLoanFields = false;
    this.cashDpAmount = '';
    this.cashDueAmount = '';
    this.loanDpAmount = '';
    this.loanRequired = '';
    this.customerDues = '';
    this.financerName = '';
    this.financerNameOther = '';
    this.showFinancerOtherInput = false;
    this.loanType = '';
    this.financeStatus = '';
    this.showFinanceSubStatus = false;
    this.showDisbursedAmount = false;
    this.financeSubStatus = '';
    this.disbursedAmount = '';
    this.additionalPayment = '';
    this.showAdditionalPayment = false;
  }

  // GET SALESMAN LIST BY DEALER CODE
  getSalesmanList(): void {
    if (!this.selectedDealer) {
      if (this.positionId === 'Dealer' || this.positionId === 'Territory Manager') this.salesmanList = [];
      return;
    }
    this.apis.getSalesmanByDealerCode({ DealerCode: this.selectedDealer }).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.salesmanList = this.apiresponse.data || [];
          // Autofill salesman if available
          if (this.autoFillSalesmanName) {
            this.salesmanName = this.autoFillSalesmanName;
            this.salesmanNumber = this.autoFillSalesmanNumber;
            this.autoFillSalesmanName = '';
            this.autoFillSalesmanNumber = '';
          } else if (this.salesmanName) {
            this.onSalesmanChange(this.salesmanName);
          }
        } else {
          this.salesmanList = [];
        }
      },
      error: () => { this.salesmanList = []; }
    });
  }

  onSalesmanChange(salesmanName: string): void {
    if (!salesmanName) { this.salesmanNumber = ''; return; }

    // Open add salesman modal
    if (salesmanName === '__add__') {
      this.salesmanName = '';
      setTimeout(() => this.openAddSalesmanModal(), 100);
      return;
    }

    // Set salesman number
    if (!this.salesmanList?.length) { this.salesmanNumber = ''; return; }
    const selected = this.salesmanList.find((x: any) => x.SalesmanName === salesmanName);
    this.salesmanNumber = selected?.MobileNo || '';
  }

  openAddSalesmanModal() {
    const modalEl = document.getElementById('addSalesmanModal');
    if (!modalEl) return;
    try {
      const existing = bootstrap.Modal.getInstance(modalEl);
      if (existing) existing.dispose();
      new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false }).show();
    } catch (e) { }
  }

  onSubmitSalesman() {
    if (!this.newSalesmanName || !this.newSalesmanMobile) {
      this.apis.showAlert('error', 'Error!', 'Please fill all fields'); return;
    }
    if (!/^\d{10}$/.test(this.newSalesmanMobile)) {
      this.apis.showAlert('error', 'Error!', 'Mobile number must be 10 digits'); return;
    }
    this.apis.insertSalesman({
      DealerCode: this.selectedSaleDealer,
      SalesmanName: this.newSalesmanName,
      DealerName: '',
      MobileNo: this.newSalesmanMobile
    }).subscribe({
      next: (res: any) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success', 'Salesman created successfully!').then(() => {
            const modalEl = document.getElementById('addSalesmanModal');
            if (modalEl) { const m = bootstrap.Modal.getInstance(modalEl); m?.hide(); }
            this.newSalesmanName = ''; this.newSalesmanMobile = '';
            this.getSalesmanList();
          });
        } else {
          this.apis.showAlert('error', 'Error!', res.message || 'Failed to add salesman');
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error occurred while adding salesman'); }
    });
  }

  closeSalesman(): void {
    this.newSalesmanName = ''; this.newSalesmanMobile = ''; this.selectedSaleDealer = '';
    const modalEl = document.getElementById('addSalesmanModal');
    if (modalEl) { const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl); modal.hide(); }
  }

  allowNumbersOnly(event: KeyboardEvent) {
    if (event.charCode < 48 || event.charCode > 57) event.preventDefault();
  }

  isDeliveredValid(): boolean {
    if (!this.showDeliveredFields) return true;
    if (!this.deliveryDate || !this.chassisNumber || !this.prospectType) return false;
    if (!this.expectedRetailDate) {
      this.expectedRetailError = 'Expected Retail is required.';
      return false;
    }

    if (this.prospectType === 'Exchange') {
      if (!this.exchangeMake || !this.exchangeModel || !this.exchangeMfgYear || !this.exchangeHpCategorie || !this.excFile ||
        this.excFile.size === 0) return false;
      if (this.exchangeMake?.toLowerCase() === 'other' && !this.exchangeMakeOther?.trim()) return false;
      // Min 5, Max 6 digits (no leading zero, no 0 value)
      const mktVal = this.mktValueExchangeTractor?.replace(/^0+/, '');
      const finalPrice = this.finalPriceExchangeTractor?.replace(/^0+/, '');
      const custAsk = this.customerAskExcTractor?.replace(/^0+/, '');

      if (!mktVal || mktVal.length < 5 || mktVal.length > 6) return false;
      const mktNum = parseFloat(this.mktValueExchangeTractor) || 0;
      const dealNum = parseFloat(this.finalPriceExchangeTractor) || 0;
      if (mktNum > 0 && dealNum > 0 && Math.abs(mktNum - dealNum) > 100000) return false;

      if (!finalPrice || finalPrice.length < 5 || finalPrice.length > 6) return false;
      if (!custAsk || custAsk.length < 5 || custAsk.length > 6) return false;

      if (!this.exchangeStockEntryType || !this.exchangeStockEntryValue) return false;
    }

    // On Road Final Sale Price — min 6 digits, no 0, no leading zero
    const salePrice = this.finalSalePrice?.replace(/^0+/, '');
    if (!salePrice || salePrice.length < 6) return false;

    if (!this.paymentType) return false;

    // Cash DP — 0 allowed, min 4 digits if > 0, no negative
    if (this.paymentType === 'Cash') {
      if (this.cashDpAmount === '' || this.cashDpAmount === null || this.cashDpAmount === undefined) return false;
      if (isNaN(Number(this.cashDpAmount))) return false;
    }

    if (this.paymentType === 'Loan') {
      if (this.loanDpAmount === '' || this.loanDpAmount === null || this.loanDpAmount === undefined) return false;
      if (isNaN(Number(this.loanDpAmount))) return false;

      if (!this.loanRequired || this.loanRequired.length < 6) return false;
      if (!this.financerName) return false;
      //if (this.financerName === 'OTHER' && !this.financerNameOther?.trim()) return false;
      if (!this.loanType) return false;
      if (!this.financeStatus) return false;
      if (this.financeStatus === 'In-Process' && !this.financeSubStatus) return false;

      if (this.financeStatus === 'Disbursed') {
        if (!this.disbursedAmount || this.disbursedAmount.toString().replace('-', '').length < 6) return false;
      }
    }

    return true;
  }

  isFormValid(): boolean {
    // Check village field
    const isVillageFilled = this.selectedVillage
      ? (this.selectedVillage === 'Other'
        ? (this.otherVillageName?.trim() ?? '').length > 0
        : (this.selectedVillage?.VillageName?.trim() ?? '').length > 0)
      : false;

    // Basic validation
    const basicValid = !!(
      (this.mobileNo ?? '').length === 10 &&
      (this.customerName ?? '').trim() !== '' &&
      (this.selectedDealer ?? '').trim() !== '' &&
      (this.selectedDistrict?.DistrictName?.trim() ?? '').length > 0 &&
      (this.selectedTehsil?.TehsilName?.trim() ?? '').length > 0 &&
      isVillageFilled &&
      (this.interestedHP ?? '').trim() !== '' &&
      (this.interestedDrive ?? '').trim() !== '' &&
      (this.interestedModel ?? '').trim() !== '' &&
      (this.variantCode ?? '').trim() !== '' &&
      (this.selectedSource ?? '').trim() !== '' &&
      (this.selectedSubSource ?? '').trim() !== '' &&
      //(this.conversionChallenge ?? '').trim() !== '' &&
      //(this.actionPlanned ?? '').trim() !== '' &&

      (
        !this.isUpdateMode ||
        (
          (this.conversionChallenge ?? '').trim() !== '' &&
          (this.actionPlanned ?? '').trim() !== '')
        //(this.actionPlanned !== 'Others' ||
        //  (this.otherActionRemark ?? '').trim() !== ''))
      ) &&
      (this.actionPlanned !== 'Others' || (this.otherActionRemark ?? '').trim() !== '') &&
      !!this.nextFollowupDate &&
      !!this.selectedDealer &&
      !!this.expectedDeliveryDate &&
      (this.enquiryCurrentStatus ?? '').trim() !== ''
    );

    if (!basicValid) return false;

    // Booking validation
    if (this.enquiryCurrentStatus === 'Booking') {
      if (!this.bookingDate || (this.bookingAmount ?? '').trim() === '') return false;
    }

    // Closed validation
    if (this.enquiryCurrentStatus === 'Closed') {
      if (!(this.enquiryClosedStatus ?? '').trim()) return false;

      // Sale Lost validation
      if (this.enquiryClosedStatus === 'Sale Lost') {
        if (!(this.saleLostReason ?? '').trim()) return false;
        if (this.saleLostReason === 'Other' && !(this.saleLostOtherRemark ?? '').trim()) return false;
      }

      // Dropped validation
      if (this.enquiryClosedStatus === 'Dropped') {
        if (!(this.droppedReason ?? '').trim()) return false;
      }

      // Delivered validation
      if (this.enquiryClosedStatus === 'Delivered') {
        if (!this.isDeliveredValid()) return false;
      }
    }

    return true;
  }

  clearEnquiryForm(): void {
    this.customerName = '';
    this.customerSurname = '';
    this.fatherName = '';
    this.selectedDealer = '';
    this.autoFillStateCode = null;
    this.autoFillDistrictCode = null;
    this.autoFillTehsilCode = null;
    this.autoFillVillageCode = null;
    this.autoFillVillageName = null;
    this.selectedState = '';
    this.selectedStateName = '';
    this.selectedDistrict = null;
    this.selectedTehsil = null;
    this.selectedVillage = null;
    this.villageList = [];
    this.districtList = [];
    this.tehsilList = [];
    this.stateList = [];
    this.variantOptions = [];
    this.interestedHP = '';
    this.interestedDrive = '';
    this.interestedModel = '';
    this.variantCode = '';
    this.driveTypesForSelectedHP = [];
    this.modelsForSelectedDrive = [];
    this.remark = '';
    this.nextFollowupDate = '';
    this.expectedDeliveryDate = '';
    this.enquiryType = '';
    this.salesmanName = '';
    this.salesmanNumber = '';
    this.prospectPin = '';
    this.otherVillageName = '';
    this.selectedSource = '';
    this.selectedSubSource = '';
    this.subSourceOptions = [];
    this.conversionChallenge = '';
    this.actionPlanned = '';
    this.actionPlannedOptions = [];
    this.otherActionRemark = '';
    this.showOtherActionRemark = false;
    this.enquiryCurrentStatus = '';
    this.showBookingFields = false;
    this.bookingDate = '';
    this.bookingAmount = '';
    this.showClosedFields = false;
    this.exchangeMakeOther = '';
    this.showExchangeMakeOtherInput = false;
    this.resetClosedFields();

    // Reset update mode
    this.isUpdateMode = false;
    this.updateSalesEnquiryId = '';
    this.updateFinanceMasterId = '';
  }

  stripLeadingZeroFromEvent(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    // Sirf leading zeros hatao, akela '0' preserve karo
    const stripped = input.value === '0' ? '0' : input.value.replace(/^0+/, '');
    input.value = stripped;
    (this as any)[field] = stripped;
  }

  stripLeadingZeroNoZero(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    const stripped = input.value.replace(/^0+/, '');
    input.value = stripped;
    (this as any)[field] = stripped;
  }

  onSubmit() {

    const enquiryDate = new Date().toISOString().split('T')[0];

    // Determine closed status types
    const isSaleLost = (this.enquiryCurrentStatus === 'Closed' && this.enquiryClosedStatus === 'Sale Lost');
    const isDropped = (this.enquiryCurrentStatus === 'Closed' && this.enquiryClosedStatus === 'Dropped');
    const isDelivered = (this.enquiryCurrentStatus === 'Closed' && this.enquiryClosedStatus === 'Delivered');


    // Build payload
    //    const payload: any
    const payload = {
      // Root level
      nameAm: this.selectedAM || '',
      nameTm: this.selectedTM || '',
      dealershipCode: this.selectedDealer,
      dealershipName: '',
      dealershipLocation: '',
      salesmenName: this.salesmanName,
      salesmenNumber: this.salesmanNumber,
      stateHead: this.selectedSH || '',
      nameStateHead: '',
      areaManager: this.selectedAM || '',
      territoryManager: this.selectedTM || '',
      dealer: this.selectedDealer,
      dealerName: '',
      dealerMail: '',

      // Enquiry object
      enquiry: {
        enquiryDate: enquiryDate,
        enquirySource: this.selectedSource,
        enquirySubSource: this.selectedSubSource,
        prospectName: this.customerName,
        prospectMobile: this.mobileNo,
        prospectDistrict: this.selectedDistrict?.DistrictName || '',
        prospectDistrictCode: this.selectedDistrict?.DistrictCode || '',
        prospectTehsil: this.selectedTehsil?.TehsilName || '',
        prospectTehsilCode: this.selectedTehsil?.TehsilCode || '',
        prospectVillage: this.selectedVillage === 'Other' ? this.otherVillageName : (this.selectedVillage?.VillageName || ''),
        prospectVillageCode: this.selectedVillage === 'Other' ? 'Other' : (this.selectedVillage?.VillageCode || ''),
        otherVillageName: this.selectedVillage === 'Other' ? this.otherVillageName : '',
        prospectPINCode: this.prospectPin,
        stateCode: this.selectedState,
        hpCategory: this.interestedHP,
        driveType: this.interestedDrive,
        interestedModel: this.interestedModel,
        variant: this.variantCode,
        enquiryType: this.enquiryType,
        enquiryCurrentStatus: this.enquiryCurrentStatus,
        nextFollowupDate: this.nextFollowupDate || null,
        expDeliveryDate: this.expectedDeliveryDate || null,
        bookingDate: this.enquiryCurrentStatus === 'Booking' ? this.bookingDate : null,
        bookingAmount: this.enquiryCurrentStatus === 'Booking' ? (Number(this.bookingAmount) || 0) : 0,
        enquiryStatus: this.enquiryClosedStatus || '',
      },

      // Finance object
      finance: {
        paymentType: isDelivered ? this.paymentType : '',
        finalSalePrice: isDelivered ? (Number(this.finalSalePrice) || 0) : 0,
        dpAmount: isDelivered
          ? (this.paymentType === 'Cash' ? (Number(this.cashDpAmount) || 0) : (Number(this.loanDpAmount) || 0))
          : 0,
        dueAmount: isDelivered && this.paymentType === 'Cash' ? (Number(this.cashDueAmount) || 0) : (Number(this.customerDues) || 0),
        loanRequired: isDelivered && this.paymentType === 'Loan' ? (Number(this.loanRequired) || 0) : 0,
        financerName: isDelivered && this.paymentType === 'Loan'
          ? (this.financerName === 'OTHER' ? 'OTHER' : this.financerName)
          : '',
        manualFinancerName: isDelivered && this.paymentType === 'Loan' && this.financerName === 'OTHER'
          ? this.financerNameOther
          : '',
        loanType: isDelivered && this.paymentType === 'Loan' ? this.loanType : '',
        financeStatus: isDelivered && this.paymentType === 'Loan' ? this.financeStatus : '',
        financeStatusDetail: isDelivered && this.paymentType === 'Loan' && this.financeStatus === 'In-Process'
          ? this.financeSubStatus
          : '',
        disbursedAmount: isDelivered && this.paymentType === 'Loan' && this.financeStatus === 'Disbursed'
          ? this.disbursedAmount : 0,

        AdditionalCash: isDelivered ? (Number(this.additionalPayment) || 0) : 0,
      },

      // Sale object
      sale: {
        chassisNumber: isDelivered ? this.chassisNumber : '',
        prospectType: isDelivered ? this.prospectType : '',
        deliveryDate: isDelivered ? this.deliveryDate : null,
        expectedRetailDate: isDelivered ? this.expectedRetailDate : null,
        exchangeMake: isDelivered && this.prospectType === 'Exchange'
          ? (this.exchangeMake?.toLowerCase() === 'other' ? this.exchangeMakeOther : this.exchangeMake)
          : '',
        exchangeHpCategory: isDelivered && this.prospectType === 'Exchange' ? this.exchangeHpCategorie : '',
        exchangeModel: isDelivered && this.prospectType === 'Exchange' ? this.exchangeModel : '',
        mfgYear: isDelivered && this.prospectType === 'Exchange' ? this.exchangeMfgYear : '',
        customerAskExchange: isDelivered && this.prospectType === 'Exchange' ? (Number(this.customerAskExcTractor) || 0) : 0,
        mktValueExchange: isDelivered && this.prospectType === 'Exchange' ? (Number(this.mktValueExchangeTractor) || 0) : 0,
        finalPriceExchange: isDelivered && this.prospectType === 'Exchange' ? (Number(this.finalPriceExchangeTractor) || 0) : 0,
        exchangeStockEntry: isDelivered && this.prospectType === 'Exchange' ? this.exchangeStockEntryType : '',
        exchangeStockEntryValue: isDelivered && this.prospectType === 'Exchange' ? this.exchangeStockEntryValue : '',
        //excFile: isDelivered && this.prospectType === 'Exchange' ? this.excFile : '',
      },

      // Close object
      close: {
        closedDroppedStatus: this.droppedReason,
        saleLostReason: this.saleLostReason === 'Other' ? this.saleLostOtherRemark : this.saleLostReason,
      },

      // Root level challenge
      conversionChallenge: this.conversionChallenge,
      actionPlanned: this.actionPlanned === 'Others' ? this.otherActionRemark : this.actionPlanned
    };

    const formData = new FormData();
    formData.append('EnquiryMainModels', JSON.stringify(payload));

    // file add karo
    if (this.excFile) {
      formData.append('file', this.excFile);
    }
    //console.log('generate payload', payload);
    // Submit API call
    this.apis.insertGenerateEnquiryv1(formData).subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase() === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Enquiry Generated Successfully',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonText: 'OK',
            customClass: { title: 'swal-title-small', htmlContainer: 'swal-text-small' }
          }).then((result) => {
            if (result.isConfirmed) window.location.reload();
          });
        } else {
          this.apis.showAlert('error', 'Error!', response?.message || 'Failed to generate enquiry.');
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.'); }
    });
  }

  onUpdate() {

    const enquiryDate = new Date().toISOString().split('T')[0];

    const isSaleLost = (this.enquiryCurrentStatus === 'Closed' && this.enquiryClosedStatus === 'Sale Lost');
    const isDropped = (this.enquiryCurrentStatus === 'Closed' && this.enquiryClosedStatus === 'Dropped');
    const isDelivered = (this.enquiryCurrentStatus === 'Closed' && this.enquiryClosedStatus === 'Delivered');


    // Build update payload
    const updatePayload: any = {
      SalesEnquiryId: this.updateSalesEnquiryId,
      FinanceMasterId: this.updateFinanceMasterId,
      callstatus: '',
      Remarks: '',
      enquiryMainModel: {
        stateHead: this.selectedSH || '',
        nameStateHead: '',
        areaManager: this.selectedAM || '',
        nameAm: '',
        territoryManager: this.selectedTM || '',
        nameTm: '',
        dealer: this.selectedDealer,
        dealerName: '',
        dealerMail: '',
        dealershipCode: this.selectedDealer,
        dealershipName: '',
        dealershipLocation: '',
        salesmenName: this.salesmanName,
        salesmenNumber: this.salesmanNumber,

        // Enquiry object
        enquiry: {
          enquiryDate: enquiryDate,
          enquirySource: this.selectedSource,
          enquirySubSource: this.selectedSubSource,
          prospectName: this.customerName,
          prospectMobile: this.mobileNo,
          prospectDistrict: this.selectedDistrict?.DistrictName || '',
          prospectDistrictCode: this.selectedDistrict?.DistrictCode || '',
          prospectTehsil: this.selectedTehsil?.TehsilName || '',
          prospectTehsilCode: this.selectedTehsil?.TehsilCode || '',
          prospectVillage: this.selectedVillage === 'Other' ? this.otherVillageName : (this.selectedVillage?.VillageName || ''),
          prospectVillageCode: this.selectedVillage === 'Other' ? 'Other' : (this.selectedVillage?.VillageCode || ''),
          otherVillageName: this.selectedVillage === 'Other' ? this.otherVillageName : '',
          prospectPINCode: this.prospectPin,
          stateCode: this.selectedState,
          hpCategory: this.interestedHP,
          driveType: this.interestedDrive,
          interestedModel: this.interestedModel,
          variant: this.variantCode,
          enquiryType: this.enquiryType,
          enquiryCurrentStatus: this.enquiryCurrentStatus,
          nextFollowupDate: this.nextFollowupDate || null,
          expDeliveryDate: this.expectedDeliveryDate || null,
          bookingDate: this.enquiryCurrentStatus === 'Booking' ? this.bookingDate : null,
          bookingAmount: this.enquiryCurrentStatus === 'Booking' ? (Number(this.bookingAmount) || 0) : 0,
          enquiryStatus: this.enquiryClosedStatus || ''
        },

        // Finance object
        finance: {
          paymentType: isDelivered ? this.paymentType : '',
          finalSalePrice: isDelivered ? (Number(this.finalSalePrice) || 0) : 0,
          dpAmount: isDelivered
            ? (this.paymentType === 'Cash' ? (Number(this.cashDpAmount) || 0) : (Number(this.loanDpAmount) || 0))
            : 0,
          dueAmount: isDelivered && this.paymentType === 'Cash' ? (Number(this.cashDueAmount) || 0) : (Number(this.customerDues) || 0),
          loanRequired: isDelivered && this.paymentType === 'Loan' ? (Number(this.loanRequired) || 0) : 0,
          financerName: isDelivered && this.paymentType === 'Loan'
            ? (this.financerName === 'OTHER' ? 'OTHER' : this.financerName)
            : '',
          manualFinancerName: isDelivered && this.paymentType === 'Loan' && this.financerName === 'OTHER'
            ? this.financerNameOther
            : '',
          loanType: isDelivered && this.paymentType === 'Loan' ? this.loanType : '',
          financeStatus: isDelivered && this.paymentType === 'Loan' ? this.financeStatus : '',
          financeStatusDetail: isDelivered && this.paymentType === 'Loan' && this.financeStatus === 'In-Process'
            ? this.financeSubStatus
            : '',
          disbursedAmount: isDelivered && this.paymentType === 'Loan' && this.financeStatus === 'Disbursed'
            ? this.disbursedAmount
            : 0,
          customerDues: 0
        },

        // Sale object
        sale: {
          chassisNumber: isDelivered ? this.chassisNumber : '',
          prospectType: isDelivered ? this.prospectType : '',
          deliveryDate: isDelivered ? this.deliveryDate : null,
          expectedRetailDate: isDelivered ? this.expectedRetailDate : null,
          exchangeMake: isDelivered && this.prospectType === 'Exchange'
            ? (this.exchangeMake?.toLowerCase() === 'other' ? this.exchangeMakeOther : this.exchangeMake)
            : '',
          exchangeHpCategory: isDelivered && this.prospectType === 'Exchange' ? this.exchangeHpCategorie : '',
          exchangeModel: isDelivered && this.prospectType === 'Exchange' ? this.exchangeModel : '',
          mfgYear: isDelivered && this.prospectType === 'Exchange' ? this.exchangeMfgYear : '',
          customerAskExchange: isDelivered && this.prospectType === 'Exchange' ? (Number(this.customerAskExcTractor) || 0) : 0,
          mktValueExchange: isDelivered && this.prospectType === 'Exchange' ? (Number(this.mktValueExchangeTractor) || 0) : 0,
          finalPriceExchange: isDelivered && this.prospectType === 'Exchange' ? (Number(this.finalPriceExchangeTractor) || 0) : 0,
          exchangeStockEntry: isDelivered && this.prospectType === 'Exchange' ? this.exchangeStockEntryType : '',
          exchangeStockEntryValue: isDelivered && this.prospectType === 'Exchange' ? this.exchangeStockEntryValue : ''
        },

        // Close object
        close: {
          closedDroppedStatus: this.droppedReason,
          saleLostReason: this.saleLostReason === 'Other' ? this.saleLostOtherRemark : this.saleLostReason,
        },

        // Root level challenge
        conversionChallenge: this.conversionChallenge,
        actionPlanned: this.actionPlanned === 'Others' ? this.otherActionRemark : this.actionPlanned
      }
    };

    const formData = new FormData();
    formData.append('UpdateEnquiryMainModels', JSON.stringify(updatePayload));

    // file add karo
    if (this.excFile) {
      formData.append('file', this.excFile);
    }
    //console.log(JSON.stringify(updatePayload, null, 2));
    this.apis.updateGenerateEnquiry(formData).subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase() === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Enquiry Updated Successfully',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonText: 'OK',
            customClass: { title: 'swal-title-small', htmlContainer: 'swal-text-small' }
          }).then((result) => {
            if (result.isConfirmed) window.location.reload();
          });
        } else {
          this.apis.showAlert('error', 'Error!', response?.message || 'Failed to update enquiry.');
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.'); }
    });
  }

  allowOnlyEnglish(event: KeyboardEvent): void {
    const char = event.key;
    if (!/^[a-zA-Z ]$/.test(char) && char !== 'Backspace') {
      event.preventDefault();
    }
  }

  onPasteEnglishOnly(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const cleaned = text.replace(/[^a-zA-Z ]/g, '');
    this.customerName = cleaned;
  }

  removeNonEnglish(event: any, field: string): void {
    const cleaned = event.target.value.replace(/[^a-zA-Z ]/g, '');
    event.target.value = cleaned;
    (this as any)[field] = cleaned;
  }

  checkExchangeGap(): number {
    const mkt = parseFloat(this.mktValueExchangeTractor) || 0;
    const deal = parseFloat(this.finalPriceExchangeTractor) || 0;
    return Math.abs(mkt - deal);
  }

  onExchangeMakeChange(): void {
    this.exchangeHpCategories = [];
    this.exchangeHpCategorie = '';
    this.exchangeModels = [];
    this.exchangeModel = '';
    this.showExchangeMakeOtherInput = (this.exchangeMake?.toLowerCase() === 'other');
    if (!this.showExchangeMakeOtherInput) {
      this.exchangeMakeOther = '';
    }
    this.exchangeHpCategories = [...new Set(this.exchangeMakeOptions.filter(x => x.Mfg?.toLowerCase() ===
      this.exchangeMake?.toLowerCase()).map(x => x.Hp).filter(x => x != null))];
    if (this.exchangeHpCategories.length === 0) {
      this.exchangeHpCategories = ['< 20', '21–30', '31–40', '41–50', '> 50'];
      this.showExcModelInput = true;
      this.showExcModelDrop = false;
    }
    else {
      this.showExcModelInput = false;
      this.showExcModelDrop = true;
    }

  }

  exchangeModelList() {

    this.apis.getExchangeModel().subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase() === 'success') {

          this.exchangeMakeOptions = response?.data || [];
          this.makeList = [...new Set(this.exchangeMakeOptions.map(x => x.Mfg))];

        } else {
          this.apis.showAlert('error', 'Error!', response?.message || 'Failed to generate enquiry.');
        }
      },

      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.');
      }
    });

  }
  onExchHpChange() {
    if (this.showExcModelDrop) {
      this.exchangeModels = [
        ...new Set(
          this.exchangeMakeOptions
            .filter(x =>
              x.Mfg?.toLowerCase() === this.exchangeMake?.toLowerCase() &&
              x.Hp?.toString().toLowerCase() === this.exchangeHpCategorie?.toLowerCase()
            )
            .map(x => x.Model)
            .filter(x => x != null)
        )
      ];
    }
    //this.exchangeHpCategorie;
  }

  onFileChange(event: any, field: string): void {
    const input = event.target;
    const file = input.files[0];

    // 🔴 Cancel case handle
    if (!file) {
      (this as any)[field] = null;
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, JPG, PNG files allowed');
      input.value = '';
      (this as any)[field] = null; // also clear variable
      return;
    }

    (this as any)[field] = file;
  }

  onHOStateChange(selectedHOState: string) {
    this.districtList = [];
    this.tehsilList = [];
    this.villageList = [];
    this.selectedState = selectedHOState || '';
    this.selectedStateName =
      this.hoStateList.find(x => x.stateCode === selectedHOState)?.stateName || '';
    this.loadDistrictsByState()
  }
  getStateListNew(): void {

    this.apis.getStateListReportNew().subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.hoStateList = this.apiresponse.data;

          //this.selectedState = this.apiresponse.data?.[0]?.StateCode || '';
          //this.selectedStateName = this.apiresponse.data?.[0]?.State || '';

        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching dealer state.'); }
    });
  }

  getDealerByTehsil(): void {
    var payload =
    {
      stateName: this.selectedStateName,
      districtName: this.selectedDistrict.DistrictName,
      tehsilName: this.selectedTehsil.TehsilName
    }
    this.apis.getDealerByLocation(payload).subscribe({
      next: (data) => {

        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.originalDealersList = this.apiresponse.data;
          this.applyDuplicateFilter();

          //this.selectedState = this.apiresponse.data?.[0]?.StateCode || '';
          //this.selectedStateName = this.apiresponse.data?.[0]?.State || '';

        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching dealer state.'); }
    });
  }

  onTehsilChangev1(event?: any): void {
    this.selectedVillage = null; this.villageList = [];
    if (!this.selectedTehsil?.TehsilCode) return;
    this.apis.getDistrictList('Tehsil', this.selectedTehsil.TehsilName, this.selectedTehsil.TehsilCode).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.villageList = this.apiresponse.data;
          if (this.autoFillVillageCode) {
            const found = this.villageList.find((v: any) => v.VillageCode === this.autoFillVillageCode);
            if (found) {
              this.selectedVillage = found;
            } else {
              this.selectedVillage = { VillageCode: this.autoFillVillageCode, VillageName: this.autoFillVillageName };
              this.villageList.push(this.selectedVillage);
            }
            this.autoFillVillageCode = null;
            this.autoFillVillageName = null;
          }
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching villages.'); }
    });
    this.getDealerByTehsil();
  }
}
