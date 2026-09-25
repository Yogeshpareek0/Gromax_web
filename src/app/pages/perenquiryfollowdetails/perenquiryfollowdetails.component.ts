import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { exchangeModelMaster, getApisResponse, PersonModel } from '../../model/apiresponse';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-perenquiryfollowdetails',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perenquiryfollowdetails.component.html',
  styleUrls: ['./perenquiryfollowdetails.component.css']
})
export class PerenquiryfollowdetailsComponent implements OnInit {
  activeCard: string = 'Enquiry';
  enquiryBox: boolean = true;
  followUpBox: boolean = false;
  followUpReport: boolean = true;
  positionId: any;

  apiresponse!: getApisResponse;
  enquiryId: string | null = null;
  salesmanList: any[] = [];

  enquirySource: string[] = [];
  subSourceOptions: string[] = [];
  stateCode: string = '';
  stateName: string = '';
  modalList: any[] = [];
  followUpList: any[] = [];

  uniqueHpCategories: string[] = [];
  driveTypesForSelectedHP: string[] = [];
  modelsForSelectedDrive: any[] = [];

  mobileNo: string = '';
  folloUpRemark: string = '';
  callStatus: string = '';
  customerName: string = '';
  prospectPin: string = '';
  otherVillageName: string = '';

  interestedHP: string = '';
  interestedDrive: string = '';
  interestedModel: string = '';
  variantCode: string = '';

  selectedSource: string = '';
  selectedSubSource: string = '';

  nextFollowupDate: string = '';
  expectedDeliveryDate: string = '';
  enquiryType: string = '';
  enquiryDate: string = '';

  conversionChallenge: string = '';
  actionPlanned: string = '';
  actionPlannedOptions: string[] = [];
  otherActionRemark: string = '';
  showOtherActionRemark: boolean = false;

  enquiryCurrentStatus: string = '';
  showBookingFields: boolean = false;
  showClosedFields: boolean = false;
  bookingDate: string = '';
  bookingAmount: string = '';
  enquiryClosedStatus: string = '';

  showSaleLostFields: boolean = false;
  saleLostReason: string = '';
  showSaleLostOtherRemark: boolean = false;
  saleLostOtherRemark: string = '';

  showDroppedFields: boolean = false;
  droppedReason: string = '';

  showDeliveredFields: boolean = false;
  deliveryDate: string = '';
  chassisNumber: string = '';
  chassisOptions: string[] = [];
  prospectType: string = '';

  showExchangeFields: boolean = false;
  exchangeMake: string = '';
  exchangeModel: string = '';
  exchangeMfgYear: string = '';
  mfgYearOptions: string[] = [];
  mktValueExchangeTractor: string = '';
  finalPriceExchangeTractor: string = '';
  exchangeStockEntryType: string = '';
  exchangeStockEntryValue: string = '';
  customerAskExcTractor: string = '';
  exchangeHpCategorie: string = '';

  finalSalePrice: string = '';
  paymentType: string = '';

  showCashFields: boolean = false;
  cashDpAmount: string = '';
  cashDueAmount: string = '';

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
  additionalCash: string = '';

  selectedDealer: string = '';
  dealerName: string = '';
  selectedDistrict: any;
  selectedTehsil: any;
  selectedVillage: any;

  salesmanName: string = '';
  salesmanNumber: string = '';
  newSalesmanName: string = '';
  newSalesmanMobile: string = '';
  showTM: boolean = false;
  showDealer: boolean = false;
  selectedTM: string = '';
  territoryManagersList: any[] = [];

  districtList: any[] = [];
  tehsilList: any[] = [];
  villageList: any[] = [];
  dealersList: PersonModel[] = [];

  financeMasterId: string = '';

  dealershipCode: string = '';
  dealershipName: string = '';
  dealershipLocation: string = '';
  nameAm: string = '';
  nameTm: string = '';
  stateHead: string = '';

  todayDate: string = '';
  maxDate: string = '';
  minDate: string = '';

  selectedSaleDealer: string = '';
  areaManagersList: PersonModel[] = [];
  selectedAM: string = '';
  selectedSH: string = '';
  misstatus: string = '';
  showAM: boolean = false;
  showSH: boolean = false;




  showExchangeMakeOtherInput: boolean = false;
  exchangeMakeOther: string = '';
  showExcModelDrop: boolean = false;
  showExcModelInput: boolean = true;
  exchangeModels: string[] = [];
  exchangeMakeOptions: exchangeModelMaster[] = [];
  makeList: string[] = [];


  followupError = '';
  deliveryError = '';
  actualDeliveryError = '';
  BookingError = '';

  excFile: File | null = null;


  expectedRetailDate = '';
  expectedRetailError = '';

  constructor(
    private http: HttpClient,
    private apis: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const now = new Date();
    const pad = (n: number): string => String(n).padStart(2, '0');
    const formatDate = (date: Date): string =>
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.minDate = formatDate(firstDay);
    this.maxDate = formatDate(lastDay);
    this.todayDate = formatDate(now);

    const currentYear = now.getFullYear();
    for (let year = currentYear; year >= 2000; year--) {
      this.mfgYearOptions.push(year.toString());
    }

    this.positionId = sessionStorage.getItem('possitionId');
    this.misstatus = sessionStorage.getItem('misstatus') || '';

    if (this.positionId === 'National Sales Head' ||
      this.positionId === 'State Head' ||
      this.positionId === 'Area Manager') {
      this.showTM = true;
      this.showDealer = true;
    } else if (this.positionId === 'Territory Manager') {
      this.showTM = false;
      this.showDealer = true;
    } else {
      this.showTM = false;
      this.showDealer = false;
    }

    this.route.paramMap.subscribe(params => {
      this.enquiryId = params.get('id');
      if (this.enquiryId) this.loadInitialData();
    });

    this.enquirySource = this.getEnquirySourceOptions(this.positionId);
    this.getHOFilter();
    this.exchangeModelList();

  }

  getEnquirySourceOptions(role: string): string[] {
    switch (role) {
      case 'National Sales Head': return ['HO', 'Aggregator'];
      case 'State Head': return ['AM', 'TM', 'FO', 'DES', 'Dealer'];
      case 'Area Manager':
      case 'Territory Manager':
      case 'FO': return ['Dealer', 'DES', 'FO'];
      case 'Dealer': return ['DES', 'Dealer'];
      default: return ['HO', 'TM', 'AM', 'FO', 'DES', 'Dealer', 'Aggregator'];
    }
  }

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

  //exchangeMakeOptions: string[] = [
  //  'ITL', 'Solis', 'MM', 'PTL', 'TMTL', 'JD', 'CNH', 'TAFE', 'SDF',
  //  'CAPTAIN', 'VST', 'IFARM', 'PREET', 'ACE', 'FT', 'PT', 'KUBOTA', 'GAEL'
  //];

  financerOptions: string[] = ['MFSL', 'LTF', 'HDFC', 'ICICI', 'KOTAK', 'AU', 'YES', 'OTHER'];
  financeSubStatusOptions: string[] = ['FI Pending', 'Login Pending', 'Approval Pending', 'Disbursement Pending'];
  exchangeHpCategories: string[] = ['< 20', '21–30', '31–40', '41–50', '> 50'];

  subSourceMapping: any = {
    'HO': ['FB/Insta', 'WhatsApp', 'Toll-Free', 'Website', 'Google', 'Others'],
    'AGGREGATOR': ['Tractor Junction', 'Tractor Guru', 'CMV 360', 'Tractor Gyaan', 'Plantix', 'Other'],
    'TM': ['Field Visit', 'BTL', 'HO Digital', 'Other'],
    'FO': ['Field Visit', 'BTL', 'HO Digital', 'Other'],
    'DEALER': ['Walkin', 'DSP', 'Sales Manager', 'HO Digital', 'Dealer Digital', 'MID', 'Local Expo', 'Van Campaign', 'Display', 'Field Demo', 'Other BTL'],
    'DES': ['Field Demo', 'Display', 'MID', 'Other']
  };

  onSourceChange(): void {
    const sourceKey = (this.selectedSource || '').toUpperCase();
    const mappingKey = sourceKey === 'AM' ? 'TM' : sourceKey;
    this.subSourceOptions = this.subSourceMapping[mappingKey] || [];
    this.selectedSubSource = '';
  }

  onCardClick(cardName: string): void {
    this.activeCard = cardName;
    if (cardName === 'Enquiry') {
      this.followUpBox = false;
      this.enquiryBox = true;
      if (this.modalList.length === 0) this.loadInitialData();
      else this.getEnquiryData();
    } else if (cardName === 'FollowUp History') {
      this.enquiryBox = false;
      this.followUpBox = true;
      this.followUpReport = true;
      this.getFollowUpData();
    }
  }

  loadInitialData(): void {
    this.apis.getModelList().subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase() === 'success' && response.data) {
          this.modalList = response.data;
          const categories = [...new Set(
            this.modalList.map(item => parseInt(item.HpCategory)).filter(num => !isNaN(num))
          )].sort((a, b) => a - b);
          this.uniqueHpCategories = this.groupIntoRanges(categories);
          this.getEnquiryData();
          this.getFollowUpData();
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Failed to load model list.')
    });
  }

  getEnquiryData(): void {
    this.apis.getSalesEnquiryById2({ Id: this.enquiryId }).subscribe({
      next: (res: any) => {
        let data = null;
        if (res?.statusCode === 200 && res?.message?.toLowerCase() === 'success') {
          if (Array.isArray(res.data) && res.data.length > 0) data = res.data[0];
          else if (res.data && typeof res.data === 'object') data = res.data;
        }

        if (data) {
          this.loadLocationData(data);
          this.mobileNo = data.prospectMobile || '';
          this.customerName = data.prospectName || '';
          this.prospectPin = data.prospectPINCode || '';
          this.dealershipCode = data.dealershipCode || '';
          this.dealershipName = data.dealershipName || '';
          this.selectedDealer = data.dealershipCode || '';
          this.dealershipLocation = data.dealershipLocation || '';
          this.stateName = data.dealerStateName || '';
          this.stateCode = data.stateCode || '';
          this.stateHead = data.stateHead || '';
          this.nameAm = data.nameAm || '';
          this.nameTm = data.nameTm || '';
          this.salesmanName = data.salesmenName || '';
          this.salesmanNumber = data.salesmenNumber || '';
          this.selectedSource = data.enquirySource || '';
          this.onSourceChange();
          this.selectedSubSource = data.enquirySubSource || '';
          this.enquiryDate = this.formatDateForInput(data.enquiryDate);
          this.nextFollowupDate = this.formatDateForInput(data.nextFollowupDate);
          this.expectedDeliveryDate = this.formatDateForInput(data.expDeliveryDate);
          this.bookingDate = this.formatDateForInput(data.bookingDate);
          this.interestedHP = data.hpCategory || '';
          this.interestedDrive = data.driveType || '';
          this.interestedModel = data.interestedModel || '';
          this.variantCode = data.variant || '';

          if (this.interestedHP) {
            this.fillDriveTypes(this.interestedHP);
            if (this.interestedDrive) this.fillModels(this.interestedHP, this.interestedDrive);
          }

          this.conversionChallenge = data.conversionChallenge || '';
          if (this.conversionChallenge) {
            this.actionPlannedOptions = this.conversionChallengeMapping[this.conversionChallenge] || [];
            this.actionPlanned = data.actionPlanned || '';
            if (this.actionPlanned && !this.actionPlannedOptions.includes(this.actionPlanned)) {
              this.otherActionRemark = this.actionPlanned;
              this.actionPlanned = 'Others';
              this.showOtherActionRemark = true;
            }
          }

          this.enquiryType = data.enquiryType || '';
          this.enquiryCurrentStatus = data.enquiryCurrentStatus || '';

          if (this.enquiryCurrentStatus === 'Booking') {
            this.showBookingFields = true;
            this.bookingAmount = data.bookingAmount ? data.bookingAmount.toString() : '';
          }

          this.enquiryClosedStatus = data.closedDroppedStatus || '';

          if (this.enquiryCurrentStatus === 'Closed' && this.enquiryClosedStatus) {
            this.showClosedFields = true;

            if (this.enquiryClosedStatus === 'Sale Lost') {
              this.showSaleLostFields = true;
              this.saleLostReason = data.saleLostReason || '';
              if (this.saleLostReason === 'Other') {
                this.showSaleLostOtherRemark = true;
                this.saleLostOtherRemark = data.saleLostOtherRemark || '';
              }
            } else if (this.enquiryClosedStatus === 'Dropped') {
              this.showDroppedFields = true;
              this.droppedReason = data.droppedReason || '';
            } else if (this.enquiryClosedStatus === 'Delivered') {
              this.showDeliveredFields = true;
              this.deliveryDate = this.formatDateForInput(data.deliveryDate);
              this.chassisNumber = data.chassisNumber || '';
              this.prospectType = data.prospectType || '';
              this.loadChassisOptions();

              if (this.prospectType === 'Exchange') {
                this.showExchangeFields = true;
                this.exchangeMake = data.exchangeMake || '';
                this.exchangeModel = data.exchangeModel || '';
                this.exchangeHpCategorie = data.exchangeHpCategory || '';
                this.exchangeMfgYear = data.mfgYear || '';
                this.customerAskExcTractor = data.customerAskExchange ? data.customerAskExchange.toString() : '';
                this.mktValueExchangeTractor = data.mktValueExchange ? data.mktValueExchange.toString() : '';
                this.finalPriceExchangeTractor = data.finalPriceExchange ? data.finalPriceExchange.toString() : '';
                this.exchangeStockEntryType = data.exchangeStockEntry || '';
                this.exchangeStockEntryValue = data.exchangeStockEntryValue || '';
              }

              this.finalSalePrice = data.finalSalePrice ? data.finalSalePrice.toString() : '';
              this.paymentType = data.paymentType || '';

              if (this.paymentType === 'Cash') {
                this.showCashFields = true;
                this.cashDpAmount = data.dpAmount ? data.dpAmount.toString() : '';
                this.cashDueAmount = data.dueAmount ? data.dueAmount.toString() : '';
              } else if (this.paymentType === 'Loan') {
                this.showLoanFields = true;
                this.loanDpAmount = data.dpAmount ? data.dpAmount.toString() : '';
                this.loanRequired = data.loanRequired ? data.loanRequired.toString() : '';
                this.customerDues = data.dueAmount ? data.dueAmount.toString() : '';
                this.financerName = data.financerName || '';
                this.financerNameOther = data.manualFinancerName || '';
                this.loanType = data.loanType || '';
                this.financeStatus = data.financeStatus || '';
                this.financeSubStatus = data.financeStatusDetail || '';
                this.disbursedAmount = data.disbursedAmount || '';
                //if (this.financerName === 'OTHER') this.showFinancerOtherInput = true;
                if (this.financeStatus === 'In-Process') this.showFinanceSubStatus = true;
                if (this.financeStatus === 'Disbursed') this.showDisbursedAmount = true;
              }
            }
          }

          this.financeMasterId = data.FinanceMasterId || '';
          this.otherVillageName = data.otherVillageName || '';
          if (this.dealershipCode) this.getSalesmanList();
        } else {
          this.apis.showAlert('warning', 'Warning', 'No enquiry data found.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching enquiry data.')
    });
  }

  formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3 && parts[0].length <= 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (dateString.includes('T')) return dateString.split('T')[0];
    return dateString;
  }

  loadLocationData(data: any): void {
    if (!data.prospectDistrictCode) return;
    this.apis.getDistrictList('State', data.dealerStateName, data.stateCode).subscribe({
      next: (districtRes: any) => {
        if (districtRes?.message?.toLowerCase() === 'success') {
          this.districtList = districtRes.data || [];
          const districtObj = this.districtList.find((d: any) => d.DistrictCode === data.prospectDistrictCode);
          if (districtObj) {
            this.selectedDistrict = districtObj;
            this.apis.getDistrictList('District', districtObj.DistrictName, data.prospectDistrictCode).subscribe({
              next: (tehsilRes: any) => {
                if (tehsilRes?.message?.toLowerCase() === 'success') {
                  this.tehsilList = tehsilRes.data || [];
                  const tehsilObj = this.tehsilList.find((t: any) => t.TehsilCode === data.prospectTehsilCode);
                  if (tehsilObj) {
                    this.selectedTehsil = tehsilObj;
                    this.apis.getDistrictList('Tehsil', tehsilObj.TehsilName, data.prospectTehsilCode).subscribe({
                      next: (villageRes: any) => {
                        if (villageRes?.message?.toLowerCase() === 'success') {
                          this.villageList = villageRes.data || [];
                          if (data.prospectVillageCode === 'Other') {
                            this.selectedVillage = 'Other';
                          } else {
                            const villageObj = this.villageList.find((v: any) => v.VillageCode === data.prospectVillageCode);
                            if (villageObj) this.selectedVillage = villageObj;
                          }
                        }
                      }
                    });
                  }
                }
              }
            });
          }
        }
      }
    });
  }

  onSubmitEnquiry(): void {

    const isOpenStatus = this.enquiryCurrentStatus === 'Open';
    const isBookingStatus = this.enquiryCurrentStatus === 'Booking';
    const isClosedStatus = this.enquiryCurrentStatus === 'Closed';

    if (!this.enquiryCurrentStatus) {
      this.apis.showAlert('error', 'Error!', 'Please select Enquiry Current Status.');
      return;
    }

    if (isOpenStatus) {
      if (!this.conversionChallenge || !this.actionPlanned || !this.nextFollowupDate || !this.expectedDeliveryDate) {
        this.apis.showAlert('error', 'Error!', 'Please fill all required fields for Open status.');
        return;
      }
      if (this.actionPlanned === 'Others' && !this.otherActionRemark) {
        this.apis.showAlert('error', 'Error!', 'Please provide Other Action Remark.');
        return;
      }
    }

    if (isBookingStatus) {
      if (!this.bookingDate || !this.bookingAmount) {
        this.apis.showAlert('error', 'Error!', 'Please fill Booking Date and Amount.');
        return;
      }
    }

    if (isClosedStatus) {
      if (!this.enquiryClosedStatus) {
        this.apis.showAlert('error', 'Error!', 'Please select Enquiry Closed Status.');
        return;
      }
      if (this.enquiryClosedStatus === 'Sale Lost' && !this.saleLostReason) {
        this.apis.showAlert('error', 'Error!', 'Please select Sale Lost Reason.');
        return;
      }
      if (this.enquiryClosedStatus === 'Dropped' && !this.droppedReason) {
        this.apis.showAlert('error', 'Error!', 'Please select Dropped Reason.');
        return;
      }

      if (this.enquiryClosedStatus === 'Delivered') {
        if (!this.deliveryDate || !this.chassisNumber || !this.prospectType || !this.finalSalePrice || !this.paymentType) {
          this.apis.showAlert('error', 'Error!', 'Please fill all Delivered fields.');
          return;
        }
        if (!this.expectedRetailDate) {
          this.apis.showAlert('error', 'Error!', 'Ratail date is required');
          return;
        }

        if (this.prospectType === 'Exchange') {
          if (!this.exchangeMake || !this.exchangeModel || !this.exchangeHpCategorie || !this.exchangeMfgYear ||
            !this.mktValueExchangeTractor || !this.finalPriceExchangeTractor || !this.customerAskExcTractor ||
            !this.exchangeStockEntryType || !this.exchangeStockEntryValue || !this.excFile ||
            this.excFile.size === 0) {
            this.apis.showAlert('error', 'Error!', 'Please fill all Exchange fields.');
            return;
          }

          // Exchange digit validation - min 5, max 6
          const excFields = [
            { val: this.mktValueExchangeTractor, name: 'Mkt Value' },
            { val: this.finalPriceExchangeTractor, name: 'Deal Price' },
            { val: this.customerAskExcTractor, name: 'Customer Ask' }
          ];
          for (const f of excFields) {
            if (f.val.length < 5 || f.val.length > 6) {
              this.apis.showAlert('error', 'Error!', `${f.name} must be 5 or 6 digits.`);
              return;
            }
          }
        }

        if (!this.finalSalePrice || this.finalSalePrice.length < 6) {
          this.apis.showAlert('error', 'Error!', 'Final Sale Price must be at least 6 digits.');
          return;
        }

        // DP validation - 0 allowed, negative allowed, no min/max
        const dpVal = this.paymentType === 'Cash' ? this.cashDpAmount : this.loanDpAmount;
        if (dpVal === '' || dpVal === null || dpVal === undefined) {
          this.apis.showAlert('error', 'Error!', 'Please fill DP Amount.');
          return;
        }

        if (this.paymentType === 'Loan') {
          if (!this.loanRequired || !this.financerName || !this.loanType || !this.financeStatus) {
            this.apis.showAlert('error', 'Error!', 'Please fill all Loan fields.');
            return;
          }

          // Loan Required min 6 digits
          if (this.loanRequired.length < 6) {
            this.apis.showAlert('error', 'Error!', 'Loan Required must be at least 6 digits.');
            return;
          }

          //if (this.financerName === 'OTHER' && !this.financerNameOther) {
          //  this.apis.showAlert('error', 'Error!', 'Please enter Financer Name.');
          //  return;
          //}
          if (this.financeStatus === 'In-Process' && !this.financeSubStatus) {
            this.apis.showAlert('error', 'Error!', 'Please select Finance Sub Status.');
            return;
          }
          if (this.financeStatus === 'Disbursed') {
            if (!this.disbursedAmount) {
              this.apis.showAlert('error', 'Error!', 'Please fill Disbursed Amount.');
              return;
            }
            // Disbursed min 6 digits
            if (this.disbursedAmount.toString().length < 6) {
              this.apis.showAlert('error', 'Error!', 'Disbursed Amount must be at least 6 digits.');
              return;
            }
          }
        }
      }
    }

    const updatePayload = {
      SalesEnquiryId: this.enquiryId,
      FinanceMasterId: this.financeMasterId || '',
      callstatus: this.callStatus || '',
      Remarks: this.folloUpRemark || '',
      enquiryMainModel: {
        stateHead: this.stateHead || '',
        nameStateHead: '',
        areaManager: '',
        nameAm: this.nameAm || '',
        territoryManager: '',
        nameTm: this.nameTm || '',
        dealer: this.dealershipCode || '',
        dealerName: this.dealershipName || '',
        dealerMail: '',
        dealershipCode: this.dealershipCode || '',
        dealershipName: this.dealershipName || '',
        dealershipLocation: this.dealershipLocation || '',
        salesmenName: this.salesmanName || '',
        salesmenNumber: this.salesmanNumber || '',
        enquiry: {
          enquiryDate: this.enquiryDate || this.todayDate,
          enquirySource: this.selectedSource || '',
          enquirySubSource: this.selectedSubSource || '',
          prospectName: this.customerName || '',
          prospectMobile: this.mobileNo || '',
          prospectDistrict: this.selectedDistrict?.DistrictName || '',
          prospectDistrictCode: this.selectedDistrict?.DistrictCode || '',
          prospectTehsil: this.selectedTehsil?.TehsilName || '',
          prospectTehsilCode: this.selectedTehsil?.TehsilCode || '',
          prospectVillage: this.selectedVillage === 'Other' ? this.otherVillageName : (this.selectedVillage?.VillageName || ''),
          prospectVillageCode: this.selectedVillage === 'Other' ? 'Other' : (this.selectedVillage?.VillageCode || ''),
          otherVillageName: this.selectedVillage === 'Other' ? this.otherVillageName : '',
          prospectPINCode: this.prospectPin || '',
          stateCode: this.stateCode || '',
          hpCategory: this.interestedHP || '',
          driveType: this.interestedDrive || '',
          interestedModel: this.interestedModel || '',
          variant: this.variantCode || '',
          enquiryType: this.enquiryType || '',
          enquiryCurrentStatus: this.enquiryCurrentStatus || '',
          nextFollowupDate: this.nextFollowupDate || null,
          expDeliveryDate: this.expectedDeliveryDate || null,
          bookingDate: this.bookingDate || null,
          bookingAmount: this.bookingAmount ? parseFloat(this.bookingAmount) : null,
          enquiryStatus: this.enquiryClosedStatus || this.enquiryCurrentStatus || ''
        },
        finance: {
          paymentType: this.paymentType || '',
          finalSalePrice: this.finalSalePrice ? parseFloat(this.finalSalePrice) : 0,
          dpAmount: this.paymentType === 'Cash'
            ? (this.cashDpAmount !== '' ? parseFloat(this.cashDpAmount) : 0)
            : (this.loanDpAmount !== '' ? parseFloat(this.loanDpAmount) : 0),
          dueAmount: this.paymentType === 'Cash'
            ? (this.cashDueAmount ? parseFloat(this.cashDueAmount) : 0)
            : (this.customerDues ? parseFloat(this.customerDues) : 0),
          loanRequired: this.loanRequired ? parseFloat(this.loanRequired) : 0,
          financerName: this.financerName === 'OTHER' ? 'OTHER' : this.financerName,
          manualFinancerName: this.financerName === 'OTHER' ? this.financerNameOther : '',
          loanType: this.loanType || '',
          financeStatus: this.financeStatus || '',
          financeStatusDetail: this.financeSubStatus || '',
          disbursedAmount: this.disbursedAmount || 0,
          customerDues: this.customerDues ? parseFloat(this.customerDues) : null,
          AdditionalCash: this.additionalCash ? parseFloat(this.additionalCash) : 0,
        },
        sale: {
          chassisNumber: this.chassisNumber || '',
          prospectType: this.prospectType || '',
          deliveryDate: this.deliveryDate || null,
          expectedRetailDate: this.expectedRetailDate || null,
          exchangeMake: this.prospectType === 'Exchange'
            ? (this.exchangeMake?.toLowerCase() === 'other' ? this.exchangeMakeOther : this.exchangeMake)
            : '',
          exchangeHpCategory: this.exchangeHpCategorie || '',
          exchangeModel: this.exchangeModel || '',
          mfgYear: this.exchangeMfgYear || '',
          customerAskExchange: this.customerAskExcTractor ? parseFloat(this.customerAskExcTractor) : 0,
          mktValueExchange: this.mktValueExchangeTractor ? parseFloat(this.mktValueExchangeTractor) : 0,
          finalPriceExchange: this.finalPriceExchangeTractor ? parseFloat(this.finalPriceExchangeTractor) : 0,
          exchangeStockEntry: this.exchangeStockEntryType || '',
          exchangeStockEntryValue: this.exchangeStockEntryValue || ''
          //excFile: this.excFile || '',

        },
        close: {
          closedDroppedStatus: this.enquiryClosedStatus === 'Dropped' ? this.droppedReason : this.enquiryClosedStatus,
          saleLostReason: this.saleLostReason === 'Other' ? this.saleLostOtherRemark : this.saleLostReason
        },
        conversionChallenge: this.conversionChallenge || '',
        actionPlanned: this.actionPlanned === 'Others' ? this.otherActionRemark : this.actionPlanned
      }
    };
    const formData = new FormData();
    formData.append('UpdateEnquiryMainModels', JSON.stringify(updatePayload));

    // file add karo
    if (this.excFile) {
      formData.append('file', this.excFile);
    }

    this.apis.updateGenerateEnquiry(formData).subscribe({
      next: (res: any) => {
        Swal.fire({
          icon: 'success', title: 'Success', text: 'Enquiry updated successfully!',
          showConfirmButton: true, allowOutsideClick: false,
          customClass: { title: 'swal-title-small', htmlContainer: 'swal-text-small' }
        }).then(() => {
          if (this.enquiryCurrentStatus === 'Closed') {
            this.router.navigate(['/main/enquiryfollowup']);
          } else {
            this.activeCard = 'Enquiry';
            this.enquiryBox = true;
            this.followUpBox = false;
            this.followUpReport = true;
            this.callStatus = '';
            this.folloUpRemark = '';
            this.getFollowUpData();
          }
        });
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while updating enquiry.')
    });
  }

  onDistrictChange(event: any): void {
    this.selectedTehsil = null;
    this.selectedVillage = null;
    this.tehsilList = [];
    this.villageList = [];
    if (event?.DistrictCode) {
      this.apis.getDistrictList('District', event.DistrictName, event.DistrictCode).subscribe({
        next: (data) => this.tehsilList = (data as getApisResponse).data || [],
        error: (err) => console.error('Error loading tehsil:', err)
      });
    }
  }

  onTehsilChange(event: any): void {
    this.selectedVillage = null;
    this.villageList = [];
    if (event?.TehsilCode) {
      this.apis.getDistrictList('Tehsil', event.TehsilName, event.TehsilCode).subscribe({
        next: (data) => this.villageList = (data as getApisResponse).data || [],
        error: (err) => console.error('Error loading village:', err)
      });
    }
  }

  groupIntoRanges(categories: number[]): string[] {
    const ranges: string[] = [];
    if (!categories.length) return ranges;
    const min = categories[0];
    const max = categories[categories.length - 1];
    let rangeStart = Math.floor((min - 1) / 5) * 5 + 1;
    let rangeEnd = rangeStart + 5 - 1;
    while (rangeStart <= max) {
      if (categories.some(cat => cat >= rangeStart && cat <= rangeEnd)) ranges.push(`${rangeStart}-${rangeEnd}`);
      rangeStart += 5;
      rangeEnd += 5;
    }
    return ranges;
  }

  onDriveChange(): void {
    this.interestedModel = '';
    this.variantCode = '';
    if (!this.interestedDrive || !this.interestedHP) { this.modelsForSelectedDrive = []; return; }
    this.fillModels(this.interestedHP, this.interestedDrive);
  }

  getFollowUpData(): void {
    this.apis.getHistoryEnquiry({ SalesEnquiryMasterId: this.enquiryId }).subscribe({
      next: (res: any) => this.followUpList = res,
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching follow-up data.')
    });
  }

  allowNumbersOnly(event: KeyboardEvent): void {
    if (event.charCode < 48 || event.charCode > 57) event.preventDefault();
  }

  allowDpInput(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const isMinusAllowed = event.key === '-' && input.value === '';
    const isNumber = event.charCode >= 48 && event.charCode <= 57;
    if (!isMinusAllowed && !isNumber) event.preventDefault();
  }

  onDpInput(event: any, field: 'cashDpAmount' | 'loanDpAmount'): void {
    let val: string = event.target.value;
    const isNegative = val.startsWith('-');
    let digits = val.replace(/[^0-9]/g, '');
    // Leading zero remove but standalone 0 allowed
    if (digits.length > 1) digits = digits.replace(/^0+/, '');
    const result = isNegative ? '-' + digits : digits;
    this[field] = result;
    event.target.value = result;
    if (field === 'cashDpAmount') this.calculateCashDueAmount();
    else this.calculateCustomerDues();
  }

  onExchangeAmtInput(event: any, field: 'mktValueExchangeTractor' | 'finalPriceExchangeTractor' | 'customerAskExcTractor'): void {
    let val: string = event.target.value.replace(/[^0-9]/g, '');
    // Remove all leading zeros
    val = val.replace(/^0+/, '');
    if (val.length > 6) val = val.slice(0, 6);
    this[field] = val;
    event.target.value = val;
    // Recalculate dues when finalPriceExchangeTractor changes
    if (field === 'finalPriceExchangeTractor') {
      if (this.paymentType === 'Cash') this.calculateCashDueAmount();
      else if (this.paymentType === 'Loan') this.calculateCustomerDues();
    }
  }

  onLoanRequiredInput(event: any): void {
    let val: string = event.target.value.replace(/[^0-9]/g, '');
    val = val.replace(/^0+/, '');
    if (val.length > 8) val = val.slice(0, 8);
    this.loanRequired = val;
    event.target.value = val;
    this.calculateCustomerDues();
  }

  onDisbursedInput(event: any): void {
    let val: string = event.target.value.replace(/[^0-9]/g, '');
    val = val.replace(/^0+/, '');
    if (val.length > 8) val = val.slice(0, 8);
    this.disbursedAmount = val;
    event.target.value = val;
    this.calculateCustomerDues();
  }

  onSalesmanChange(salesmanName: string): void {
    if (!salesmanName) { this.salesmanNumber = ''; return; }
    if (salesmanName === '__add__') {
      this.salesmanName = '';
      setTimeout(() => this.openAddSalesmanModal(), 100);
      return;
    }
    if (!this.salesmanList?.length) { this.salesmanNumber = ''; return; }
    const selected = this.salesmanList.find((x: any) => x.SalesmanName === salesmanName);
    this.salesmanNumber = selected?.MobileNo || '';
  }

  openAddSalesmanModal(): void {
    this.selectedTM = '';
    this.selectedSaleDealer = '';
    if (this.showTM) this.getHOFilter();
    const modalEl = document.getElementById('addSalesmanModal');
    if (!modalEl) return;
    try {
      const existing = bootstrap.Modal.getInstance(modalEl);
      if (existing) existing.dispose();
      new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false }).show();
    } catch (e) { console.error('Error opening modal:', e); }
  }

  getHOFilter(): void {
    this.apis.getHOFilter({ ShMail: '', AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.dealersList = this.apiresponse.data.dealers || [];
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching hierarchy data.')
    });
  }

  onTerritoryChange(mail: string): void {
    this.selectedSaleDealer = '';
    this.apis.getHOFilter({ ShMail: '', AmMail: '', TmMail: mail, DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') this.dealersList = this.apiresponse.data.dealers || [];
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred.')
    });
  }

  getSalesmanList(): void {
    if (!this.dealershipCode) { this.salesmanList = []; return; }
    this.apis.getSalesmanByDealerCode({ DealerCode: this.dealershipCode }).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        this.salesmanList = this.apiresponse.message?.toLowerCase() === 'success' ? (this.apiresponse.data || []) : [];
      },
      error: () => this.salesmanList = []
    });
  }

  onHpChange(): void {
    this.interestedDrive = '';
    this.interestedModel = '';
    this.variantCode = '';
    this.modelsForSelectedDrive = [];
    if (!this.interestedHP) { this.driveTypesForSelectedHP = []; return; }
    this.fillDriveTypes(this.interestedHP);
  }

  private fillDriveTypes(hpRange: string): void {
    if (!hpRange) { this.driveTypesForSelectedHP = []; return; }
    const [start, end] = hpRange.split('-').map(x => parseInt(x));
    this.driveTypesForSelectedHP = [...new Set(
      this.modalList.filter((item: any) => { const hp = parseInt(item.HpCategory); return hp >= start && hp <= end; })
        .map((item: any) => item.DriveType)
    )];
  }

  private fillModels(hpRange: string, driveType: string): void {
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

  onModelChange(): void {
    if (!this.interestedModel) { this.variantCode = ''; return; }
    const model = this.modelsForSelectedDrive.find((item: any) => item.ModelName === this.interestedModel);
    this.variantCode = model ? model.ModelCode : '';
  }

  onConversionChallengeChange(): void {
    this.actionPlanned = '';
    this.otherActionRemark = '';
    this.showOtherActionRemark = false;
    this.actionPlannedOptions = this.conversionChallenge ? (this.conversionChallengeMapping[this.conversionChallenge] || []) : [];
  }

  onActionPlannedChange(): void {
    this.showOtherActionRemark = (this.actionPlanned === 'Others');
    if (!this.showOtherActionRemark) this.otherActionRemark = '';
  }

  //onFollowupChange(event: any): void {
  //  this.nextFollowupDate = event.target.value;
  //  if (this.expectedDeliveryDate && this.expectedDeliveryDate < this.nextFollowupDate) this.expectedDeliveryDate = '';
  //  this.updateEnquiryType();
  //}

  //onDeliveryChange(event: any): void {
  //  this.expectedDeliveryDate = event.target.value;
  //  this.updateEnquiryType();
  //}

  updateEnquiryType(): void {
    if (this.expectedDeliveryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expected = new Date(this.expectedDeliveryDate);
      expected.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      this.enquiryType = diffDays <= 7 ? 'SuperHot'
        : diffDays <= 30 ? 'Hot'
          : diffDays <= 60 ? 'Warm'
            : 'Cold';
    } else {
      this.enquiryType = '';
    }
  }

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
    this.additionalCash = '';
  }

  onEnquiryClosedStatusChange(): void {
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

    if (this.enquiryClosedStatus === 'Sale Lost') this.showSaleLostFields = true;
    else if (this.enquiryClosedStatus === 'Dropped') this.showDroppedFields = true;
    else if (this.enquiryClosedStatus === 'Delivered') {
      this.showDeliveredFields = true;
      this.deliveryDate = this.todayDate;
      this.loadChassisOptions();
    }
  }

  loadChassisOptions(): void {
    if (!this.dealershipCode) { this.chassisOptions = []; return; }
    this.apis.getChassisNumber({ dealerCode: this.dealershipCode }).subscribe({
      next: (data: any) => {
        this.chassisOptions = data?.message?.toLowerCase() === 'success'
          ? (data.data?.map((item: any) => item.chasisno) || []) : [];
      },
      error: () => {
        this.chassisOptions = [];
        this.apis.showAlert('error', 'Error!', 'Error fetching chassis numbers.');
      }
    });
  }

  onSaleLostReasonChange(): void {
    this.showSaleLostOtherRemark = (this.saleLostReason === 'Other');
    if (!this.showSaleLostOtherRemark) this.saleLostOtherRemark = '';
  }

  onProspectTypeChange(): void {
    this.showExchangeFields = (this.prospectType === 'Exchange');
    if (!this.showExchangeFields) {
      this.exchangeHpCategories = [];
      this.exchangeModels = [];
      this.exchangeMake = '';
      this.exchangeModel = '';
      this.exchangeMfgYear = '';
      this.exchangeHpCategorie = '';
      this.mktValueExchangeTractor = '';
      this.finalPriceExchangeTractor = '';
      this.customerAskExcTractor = '';
      this.exchangeStockEntryType = '';
      this.exchangeStockEntryValue = '';
      this.excFile = null;
    }
    if (this.paymentType === 'Cash') this.calculateCashDueAmount();
    else if (this.paymentType === 'Loan') this.calculateCustomerDues();
  }

  onFinalSalePriceChange(): void {
    if (this.paymentType === 'Cash') this.calculateCashDueAmount();
    else if (this.paymentType === 'Loan') this.calculateCustomerDues();
  }

  onMktValueChange(): void {
    if (this.paymentType === 'Cash') this.calculateCashDueAmount();
    else if (this.paymentType === 'Loan') this.calculateCustomerDues();
  }

  onPaymentTypeChange(): void {
    this.showCashFields = (this.paymentType === 'Cash');
    this.showLoanFields = (this.paymentType === 'Loan');
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

  onCashDpAmountChange(): void {
    this.calculateCashDueAmount();
  }

  calculateCashDueAmount(): void {
    const finalSale = parseFloat(this.finalSalePrice) || 0;
    const excValue = (this.prospectType === 'Exchange') ? (parseFloat(this.finalPriceExchangeTractor) || 0) : 0;
    const dp = parseFloat(this.cashDpAmount) || 0;
    const additional = parseFloat(this.additionalCash) || 0;
    const booking = parseFloat(this.bookingAmount) || 0;
    const due = finalSale - (excValue + dp + additional + booking);
    this.cashDueAmount = due > 0 ? due.toString() : '0';
  }

  calculateCustomerDues(): void {
    const finalSale = parseFloat(this.finalSalePrice) || 0;
    const dp = parseFloat(this.loanDpAmount) || 0;
    const excValue = (this.prospectType === 'Exchange') ? (parseFloat(this.finalPriceExchangeTractor) || 0) : 0;
    const additional = parseFloat(this.additionalCash) || 0;
    const disbursed = (this.financeStatus === 'Disbursed') ? (parseFloat(this.disbursedAmount) || 0) : 0;
    const booking = parseFloat(this.bookingAmount) || 0;
    const dues = finalSale - (dp + excValue + additional + disbursed + booking);
    this.customerDues = dues > 0 ? dues.toString() : '0';
  }

  onLoanDpAmountChange(): void {
    this.calculateCustomerDues();
  }

  onLoanRequiredChange(): void {
    this.calculateCustomerDues();
  }

  onFinancerNameChange(): void {
    //this.showFinancerOtherInput = (this.financerName === 'OTHER');
    //if (!this.showFinancerOtherInput) this.financerNameOther = '';
  }

  onFinanceStatusChange(): void {
    this.showFinanceSubStatus = (this.financeStatus === 'In-Process');
    if (!this.showFinanceSubStatus) this.financeSubStatus = '';
    this.showDisbursedAmount = (this.financeStatus === 'Disbursed');
    if (!this.showDisbursedAmount) this.disbursedAmount = '';
    this.calculateCustomerDues();
  }

  onFinalSalePriceInput(event: any): void {
    let val: string = event.target.value.replace(/[^0-9]/g, '');
    val = val.replace(/^0+/, '');
    if (val.length > 8) val = val.slice(0, 8);
    this.finalSalePrice = val;
    event.target.value = val;
    if (this.paymentType === 'Cash') this.calculateCashDueAmount();
    else if (this.paymentType === 'Loan') this.calculateCustomerDues();
  }

  onExchangeStockEntryTypeChange(): void {
    this.exchangeStockEntryValue = '';
  }

  onAdditionalCashChange(): void {
    if (this.paymentType === 'Cash') this.calculateCashDueAmount();
    else if (this.paymentType === 'Loan') this.calculateCustomerDues();
  }

  onSubmitSalesman(): void {
    if (this.showDealer && !this.selectedSaleDealer) {
      this.apis.showAlert('error', 'Error!', 'Please select a dealer');
      return;
    }
    if (!this.newSalesmanName || !this.newSalesmanMobile) {
      this.apis.showAlert('error', 'Error!', 'Please fill all fields');
      return;
    }
    if (!/^\d{10}$/.test(this.newSalesmanMobile)) {
      this.apis.showAlert('error', 'Error!', 'Mobile number must be 10 digits');
      return;
    }
    const dealerCode = this.showDealer ? this.selectedSaleDealer : this.dealershipCode;
    this.apis.insertSalesman({ DealerCode: dealerCode, SalesmanName: this.newSalesmanName, DealerName: '', MobileNo: this.newSalesmanMobile }).subscribe({
      next: (res: any) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success', 'Salesman created successfully!').then(() => {
            const modalEl = document.getElementById('addSalesmanModal');
            if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
            this.newSalesmanName = '';
            this.newSalesmanMobile = '';
            this.selectedSaleDealer = '';
            this.selectedTM = '';
            this.getSalesmanList();
          });
        } else {
          this.apis.showAlert('error', 'Error!', res.message || 'Failed to add salesman');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'Error occurred while adding salesman')
    });
  }

  closeSalesman(): void {
    this.newSalesmanName = '';
    this.newSalesmanMobile = '';
    this.selectedSaleDealer = '';
    this.selectedTM = '';
    const modalEl = document.getElementById('addSalesmanModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.hide();
    }
  }

  isFormValid(): boolean {
    //debugger;
    if (!this.enquiryCurrentStatus) return false;
    //if (!this.selectedSource) return false;
    if (this.enquiryCurrentStatus === 'Open') {
      if (!this.conversionChallenge || !this.actionPlanned || !this.nextFollowupDate || !this.expectedDeliveryDate) return false;
      if (this.actionPlanned === 'Others' && !this.otherActionRemark) return false;
    }

    if (this.enquiryCurrentStatus === 'Booking') {
      if (!this.bookingDate || !this.bookingAmount || !this.nextFollowupDate || !this.expectedDeliveryDate) return false;
    }

    if (this.enquiryCurrentStatus === 'Closed') {
      if (!this.enquiryClosedStatus) return false;
      if (this.enquiryClosedStatus === 'Sale Lost' && !this.saleLostReason) return false;
      if (this.enquiryClosedStatus === 'Dropped' && !this.droppedReason) return false;

      if (this.enquiryClosedStatus === 'Delivered') {
        if (!this.deliveryDate || !this.chassisNumber || !this.prospectType || !this.paymentType) return false;

        // Final Sale Price - min 6 digits, 0 not allowed
        if (!this.finalSalePrice || this.finalSalePrice.length < 6) return false;

        if (this.prospectType === 'Exchange') {
          if (!this.exchangeMake || !this.exchangeModel || !this.exchangeHpCategorie || !this.exchangeMfgYear ||
            !this.mktValueExchangeTractor || !this.finalPriceExchangeTractor || !this.customerAskExcTractor ||
            !this.exchangeStockEntryType || !this.exchangeStockEntryValue || !this.excFile ||
            this.excFile.size === 0) return false;
          // min 5 digits check
          if (this.mktValueExchangeTractor.length < 5 || this.finalPriceExchangeTractor.length < 5 || this.customerAskExcTractor.length < 5) return false;
          if (this.mktValueExchangeTractor && this.finalPriceExchangeTractor && this.checkExchangeGap()) return false;
        }

        // DP - sirf empty check, 0/negative allowed
        const dpVal = this.paymentType === 'Cash' ? this.cashDpAmount : this.loanDpAmount;
        if (dpVal === '' || dpVal === null || dpVal === undefined) return false;

        if (this.paymentType === 'Loan') {
          if (!this.loanRequired || !this.financerName || !this.loanType || !this.financeStatus) return false;
          if (this.loanRequired.length < 6) return false;
          //if (this.financerName === 'OTHER' && !this.financerNameOther) return false;
          if (this.financeStatus === 'In-Process' && !this.financeSubStatus) return false;
          if (this.financeStatus === 'Disbursed') {
            if (!this.disbursedAmount || this.disbursedAmount.toString().length < 6) return false;
          }
        }
      }
    }

    return true;
  }

  checkExchangeGap(): boolean {
    const mkt = parseFloat(this.mktValueExchangeTractor) || 0;
    const deal = parseFloat(this.finalPriceExchangeTractor) || 0;
    if (mkt <= 0 || deal <= 0) return false;
    return Math.abs(mkt - deal) > 100000;
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

    //console.log('today', todayDate);
    //console.log('startDate', currentMonthStart);
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
}
