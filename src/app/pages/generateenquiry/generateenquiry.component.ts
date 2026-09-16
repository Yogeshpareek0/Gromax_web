import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { getApisResponse, filterApisResponse, PersonModel } from '../../model/apiresponse';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-generateenquiry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generateenquiry.component.html',
  styleUrl: './generateenquiry.component.css'
})
export class GenerateenquiryComponent implements OnInit {
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
  currentStep: number = 1;
  isAutoFilling: boolean = false;

  showAM = false;
  showTM = false;
  showSH = false;
  showDealer = false;
  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';

  mobileNo: string = '';
  remark: string = '';
  customerName: string = '';
  customerSurname: string = '';
  fatherName: string = '';
  interestedHP: string = '';
  interestedDrive: string = '';
  interestedModel: string = '';
  variantCode: string = '';
  selectedSource: string = '';
  selectedSubSource: string = '';
  customerType: string = '';
  nextFollowupDate: string = '';
  expectedDeliveryDate: string = '';


  // Additional fields
  otherAction: string = '';
  selectedDealer: string = '';
  selectedSaleDealer: string = '';
  selectedState: string = '';
  selectedStateName: string = '';
  selectedDistrict: any;
  selectedTehsil: any;
  selectedVillage: any;
  prospectPin: string = '';
  actionPlanned: string = '';
  productUse: string = '';
  salesmanName: string = '';
  salesmanNumber: string = '';
  enquiryStatus: string = '';
  subSubSource: string = '';
  otherVillageName: string = '';

  stateList: any[] = [];
  districtList: any[] = [];
  tehsilList: any[] = [];
  villageList: any[] = [];

  showAdditional: boolean = false;
  isMobileValid: boolean = false;
  todayDate: string = '';
  newSalesmanName: string = '';
  newSalesmanMobile: string = '';

  autoFillStateCode: string | null = null;
  autoFillDistrictCode: string | null = null;
  autoFillTehsilCode: string | null = null;
  autoFillVillageCode: string | null = null;
  autoFillVillageName: string | null = null;
  autoFillSalesmanName: string = '';
  autoFillSalesmanNumber: string = '';

  duplicateDealerList: any[] = [];
  originalDealersList: any[] = [];
  dealersList: PersonModel[] = [];
  constructor(private router: Router, private http: HttpClient, private apis: AuthService) { }

  ngOnInit(): void {
    
    const now = new Date();
    this.todayDate = now.toISOString().split('T')[0];

    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    const dealerCode = sessionStorage.getItem('dealerCode');

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
      if (dealerCode) {
        this.selectedDealer = dealerCode;
        this.selectedSaleDealer = dealerCode;
        this.onDealerChange(this.selectedDealer);
      }
    }

    switch (this.positionId) {
      case 'National Sales Head':
        this.enquirySource = ['HO','REFERRAL', 'OTHERS'];
        break;
      case 'State Head':
        this.enquirySource = ['REFERRAL', 'OTHERS'];
        break;
      case 'Area Manager':
        this.enquirySource = ['REFERRAL', 'OTHERS'];
        break;
      case 'Territory Manager':
        this.enquirySource = ['REFERRAL', 'TM', 'OTHERS'];
        break;
      case 'Dealer':
        this.enquirySource = ['REFERRAL', 'DEALER'];
        break;
      default:
        this.enquirySource = ['REFERRAL','OTHERS'];
        break;
    }
    this.getHOFilter();
    this.getModelList()
  }

  isBasicValid(): boolean {

    const isVillageFilled = this.selectedVillage
      ? (this.selectedVillage === 'Other'
        ? (this.otherVillageName?.trim() ?? '').length > 0
        : (this.selectedVillage?.VillageName?.trim() ?? '').length > 0)
      : false;
    return !!(
      (this.selectedDistrict?.DistrictName?.trim() ?? '').length > 0 &&
      (this.selectedTehsil?.TehsilName?.trim() ?? '').length > 0 &&
      isVillageFilled &&
      (this.mobileNo ?? '').length === 10 &&
      (this.customerName ?? '').trim() !== '' &&
      (this.customerSurname ?? '').trim() !== '' &&
      (this.fatherName ?? '').trim() !== '' &&
      //(this.selectedSH ?? '').trim() !== '' &&
      //(this.selectedAM ?? '').trim() !== '' &&
      //(this.selectedTM ?? '').trim() !== '' &&
      (this.selectedDealer ?? '').trim() !== '' &&
      (this.interestedHP ?? '').trim() !== '' &&
      (this.interestedDrive ?? '').trim() !== '' &&
      (this.interestedModel ?? '').trim() !== '' &&
      (this.variantCode ?? '').trim() !== '' &&
      (this.selectedSource ?? '').trim() !== '' &&
      (this.selectedSubSource ?? '').trim() !== '' &&
      (this.customerType ?? '').trim() !== '' &&
      !!this.nextFollowupDate &&
      !!this.expectedDeliveryDate &&
      (!(
        this.selectedSource === 'Others' &&
        this.selectedSubSource === 'Others'
      ) || (this.subSubSource ?? '').trim() !== '')
    );
  }

  isAdditionalValid(): boolean {

    return !!(
      (this.actionPlanned ?? '').trim() !== '' &&
      (this.productUse ?? '').trim() !== '' &&
      (this.salesmanName ?? '').trim() !== '' &&
      (this.salesmanNumber ?? '').trim() !== '' &&
      (!(
        this.actionPlanned === 'Others'
      ) || (this.otherAction ?? '').trim() !== '')
    );
  }

  isFormValid(): boolean {
    if (!this.isBasicValid()) {
      return false;
    }
    if (this.showAdditional) {
      return this.isAdditionalValid();
    }
    return true;
  }

  subSourceMapping: any = {
    HO: [
      'DIGITAL LEAD GEN',
      'WEBSITE',
      'TOLL-FREE',
      'EXPO',
      'WHATSAPP',
      'REFERRAL',
      'OTHERS'
    ],
    TM: [
      'TM REFERRAL',
      'TM FIELD VISIT',
      'OTHERS'
    ],
    DEALER: [
      'WALKIN',
      'DEALER DIGITAL',
      'DSP',
      'LOCAL EXPO',
      'REFERRAL',
      'HINDUSTAN CLUB',
      'LOCAL MARKETING ACTIVITY',
      'VAN CAMPAIGN',
      'OTHERS'
    ],
    REFERRAL: [
      'HO',
      'DIGITAL',
    ],
    OTHERS: [
      'OTHERS'
    ]
  };

  toggleAdditional() {
    this.showAdditional = true;
    this.currentStep = 2;
  }

  goBack() {
    this.showAdditional = false;
    this.currentStep = 1;
  }

  getModelList(): void {
    this.apis.getModelList().subscribe({
      next: (response: any) => {
        if (response?.message?.toLowerCase() === 'success') {
          this.modalList = response.data;

          if (this.modalList.length > 0) {
            const categories = [...new Set(this.modalList.map(item => parseInt(item.HpCategory)).filter(num => !isNaN(num)))].sort((a, b) => a - b);

            const groupIntoRanges = (categories: number[]) => {
              const ranges: string[] = [];
              if (!categories.length) return ranges;

              const min = categories[0];
              const max = categories[categories.length - 1];

              let rangeStart = Math.floor((min - 1) / 5) * 5 + 1;
              let rangeEnd = rangeStart + 5 - 1;

              while (rangeStart <= max) {
                const hasCategory = categories.some(cat => cat >= rangeStart && cat <= rangeEnd);
                if (hasCategory) {
                  ranges.push(`${rangeStart}-${rangeEnd}`);
                }
                rangeStart += 5;
                rangeEnd += 5;
              }

              return ranges;
            };

            this.uniqueHpCategories = groupIntoRanges(categories);
          }
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onHpChange() {
    if (!this.interestedHP) {
      this.driveTypesForSelectedHP = [];
      this.modelsForSelectedDrive = [];
      this.interestedDrive = '';
      this.interestedModel = '';
      this.variantCode = '';
      return;
    }

    this.interestedDrive = '';
    this.interestedModel = '';
    this.variantCode = '';
    this.modelsForSelectedDrive = [];

    const [start, end] = this.interestedHP.split('-').map(x => parseInt(x));

    const filteredByHp = this.modalList.filter(item => {
      const hp = parseInt(item.HpCategory);
      return hp >= start && hp <= end;
    });

    this.driveTypesForSelectedHP = [...new Set(filteredByHp.map(item => item.DriveType))];

    if (this.isAutoFilling) {
      this.isAutoFilling = false;
    }
  }

  onDriveChange() {
    if (!this.interestedDrive || !this.interestedHP) {
      this.modelsForSelectedDrive = [];
      this.interestedModel = '';
      this.variantCode = '';
      return;
    }

    this.interestedModel = '';
    this.variantCode = '';

    const [start, end] = this.interestedHP.split('-').map(x => parseInt(x));

    const filtered = this.modalList.filter(item => {
      const hp = parseInt(item.HpCategory);
      return hp >= start && hp <= end && item.DriveType === this.interestedDrive;
    });

    const uniqueModelsMap = new Map<string, any>();
    filtered.forEach(item => {
      if (!uniqueModelsMap.has(item.ModelName)) {
        uniqueModelsMap.set(item.ModelName, item);
      }
    });

    this.modelsForSelectedDrive = Array.from(uniqueModelsMap.values());

    if (this.isAutoFilling) {
      this.isAutoFilling = false;
    }
  }

  onModelChange() {
    if (!this.interestedModel) {
      this.variantCode = '';
      return;
    }

    const model = this.modelsForSelectedDrive.find(item => item.ModelName === this.interestedModel);
    this.variantCode = model ? model.ModelCode : '';
  }

  onSourceChange() {
    const sourceKey = (this.selectedSource || '').toUpperCase();
    this.subSourceOptions = this.subSourceMapping[sourceKey] || [];
    this.selectedSubSource = '';
  }

  onMobileEntered() {
    if (this.mobileNo && this.mobileNo.length === 10 && /^[0-9]{10}$/.test(this.mobileNo)) {
      const request = { ProspectMobile: this.mobileNo };

      this.apis.getSalesEnquiry(request).subscribe({
        next: (res: any) => {
          this.duplicateDealerList = [];

          if (res && res.length === 1) {
            const data = res[0];
            this.autoFillForm(data);
            this.isMobileValid = true;
          }
          else if (res && res.length > 1) {
            this.duplicateDealerList = res;
            const modalEl = document.getElementById('dealerModal');
            if (modalEl) {
              const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
              modal.show();
            }
            this.applyDuplicateFilter();
          }
          else {
            this.isMobileValid = true;
            this.clearEnquiryForm();
            this.applyDuplicateFilter();
            if (this.positionId === 'Dealer') {
              const dealerCode = sessionStorage.getItem('dealerCode');
              if (dealerCode) {
                this.selectedDealer = dealerCode;
                this.onDealerChange(this.selectedDealer);
              }
            } else {
              this.selectedDealer = '';
            }
          }
        },
        error: (err) => {
          this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
        }
      });
    } else {
      this.isMobileValid = false;
      this.clearEnquiryForm();
      this.duplicateDealerList = [];
      this.applyDuplicateFilter();
    }
  }

  onDealerSelected(selectedItem: any) {
    this.autoFillForm(selectedItem);
    this.isMobileValid = true;

    const selectedDealerCode = selectedItem.DealerCode;

    this.dealersList = this.originalDealersList.filter(d => {
      const isSelected = d.Name === selectedDealerCode;
      const isNotDuplicate = !this.duplicateDealerList.some(dd => dd.DealerCode === d.Name);
      return isSelected || isNotDuplicate;
    });

    const modalEl = document.getElementById('dealerModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    this.duplicateDealerList = [];
  }

  generateNewEnquiry() {
    const modalEl = document.getElementById('dealerModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }
    this.isMobileValid = true;
    this.clearEnquiryForm();

    if (this.duplicateDealerList?.length > 0 && this.originalDealersList?.length > 0) {
      this.dealersList = this.originalDealersList.filter(
        d => !this.duplicateDealerList.some(dd => dd.DealerCode === d.Name)
      );
    } else {
      this.dealersList = [...this.originalDealersList];
    }

    // 🔥 duplicateDealerList reset
    this.duplicateDealerList = [];
  }

  autoFillForm(data: any): void {
    this.customerName = data.ProspectName || '';
    this.customerSurname = data.Surname || '';
    this.fatherName = data.FatherName || '';

    this.selectedDealer = data.DealerCode || '';
    if (this.selectedDealer) {
      this.autoFillStateCode = data.StateCode;
      this.autoFillDistrictCode = data.DistrictCode;
      this.autoFillTehsilCode = data.TehsilCode;
      this.autoFillVillageCode = data.VillageCode;
      this.autoFillVillageName = data.ProspectVillage;
      this.onDealerChange(this.selectedDealer);
    }

    this.interestedHP = data.HPCategory || '';
    if (this.interestedHP) {
      this.isAutoFilling = true;
      this.fillDriveTypes(this.interestedHP);
    }

    this.interestedDrive = data.DriveType || '';
    if (this.interestedDrive && this.interestedHP) {
      this.fillModels(this.interestedHP, this.interestedDrive);
    }

    this.interestedModel = data.InterestedModel || '';
    this.variantCode = data.VarientOrBOMCode || '';

    this.setSourceAndSubSource(data.EnquirySource, data.EnquirySubSource);

    this.selectedState = data.StateCode;

    this.customerType = data.ProspectType || '';
    this.remark = data.Remark || '';
    this.nextFollowupDate = data.NextFollowUpDate || '';
    this.expectedDeliveryDate = data.ExpectedDeliveryDate || '';
    this.enquiryStatus = data.EnquiryStatus || '';
    this.actionPlanned = data.ActionPlanned || '';
    this.productUse = data.ProductUse || '';
    this.autoFillSalesmanName = data.SalesmanName || '';
    this.autoFillSalesmanNumber = data.SalesmanNumber || '';
    this.prospectPin = data.ProspectPinCode;
    this.subSubSource = data.SubSubSource || '';
  }

  closeDealerModal() {
    const modalEl = document.getElementById('dealerModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      }
    }
    this.mobileNo = '';
  }

  getHOFilter(): void {
    this.selectedSH = '';
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
          this.originalDealersList = this.apiresponse.data.dealers || [];

          this.applyDuplicateFilter();
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  applyDuplicateFilter() {
    if (this.duplicateDealerList?.length > 0) {
      this.dealersList = this.originalDealersList.filter(
        d => !this.duplicateDealerList.some(dd => dd.DealerCode === d.Name)
      );
    } else {
      this.dealersList = [...this.originalDealersList];
    }
  }

  onStateChange(mail: string): void {
    this.selectedAM = '';
    this.selectedTM = '';
    this.selectedDealer = '';
    this.villageList = [];
    this.districtList = [];
    this.tehsilList = [];
    this.stateList = [];
    this.dealersList = [];
    this.territoryManagersList = [];

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
          this.originalDealersList = this.apiresponse.data.dealers || [];

          this.applyDuplicateFilter();

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
    this.villageList = [];
    this.districtList = [];
    this.tehsilList = [];
    this.stateList = [];
    this.dealersList = [];

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
          this.territoryManagersList = this.apiresponse.data.territoryManagers || [];
          this.originalDealersList = this.apiresponse.data.dealers || [];

          this.applyDuplicateFilter();

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
    this.villageList = [];
    this.districtList = [];
    this.tehsilList = [];
    this.stateList = [];

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
          this.originalDealersList = this.apiresponse.data.dealers || [];

          this.applyDuplicateFilter();

        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onDealerChange(dealerCode: string): void {
    this.districtList = [];
    this.tehsilList = [];
    this.villageList = [];
    this.salesmanList = [];
    this.getSalesmanList();

    this.apis.getStateList(dealerCode).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          const dealerStateCode = this.apiresponse.data?.[0]?.StateCode;
          const dealerStateName = this.apiresponse.data?.[0]?.State;
          if (dealerStateCode) {
            this.selectedState = dealerStateCode;
            this.selectedStateName = dealerStateName;

            this.loadDistrictsByState();
          }
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching dealer state.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Error occurred while fetching dealer state.');
      }
    });
  }

  loadDistrictsByState(): void {
    this.districtList = [];
    if (!this.selectedState) return;

    this.apis.getDistrictList('State', this.selectedStateName, this.selectedState).subscribe({
      next: (data) => {
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.districtList = this.apiresponse.data;

          if (this.autoFillDistrictCode) {
            this.selectedDistrict = this.districtList.find(d => d.DistrictCode === this.autoFillDistrictCode);
            this.autoFillDistrictCode = null;
            this.onDistrictChange();
          }
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching districts.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Error occurred while fetching districts.');
      }
    });
  }

  onDistrictChange(event?: any): void {
    this.selectedTehsil = null;
    this.tehsilList = [];
    this.villageList = [];

    if (!this.selectedDistrict?.DistrictCode) return;

    this.apis.getDistrictList('District', this.selectedDistrict.DistrictName, this.selectedDistrict.DistrictCode)
      .subscribe({
        next: (data) => {
          this.apiresponse = data as getApisResponse;
          if (this.apiresponse.message?.toLowerCase() === 'success') {
            this.tehsilList = this.apiresponse.data;

            if (this.autoFillTehsilCode) {
              this.selectedTehsil = this.tehsilList.find(t => t.TehsilCode === this.autoFillTehsilCode);
              this.autoFillTehsilCode = null;

              this.onTehsilChange();
            }
          } else {
            this.apis.showAlert('error', 'Error!', 'Failed fetching tehsils.');
          }
        },
        error: () => {
          this.apis.showAlert('error', 'Error!', 'Error occurred while fetching tehsils.');
        }
      });
  }

  onTehsilChange(event?: any): void {
    this.selectedVillage = null;
    this.villageList = [];

    if (!this.selectedTehsil?.TehsilCode) return;

    this.apis.getDistrictList('Tehsil', this.selectedTehsil.TehsilName, this.selectedTehsil.TehsilCode)
      .subscribe({
        next: (data) => {
          this.apiresponse = data as getApisResponse;
          if (this.apiresponse.message?.toLowerCase() === 'success') {
            this.villageList = this.apiresponse.data;

            if (this.autoFillVillageCode) {
              const foundVillage = this.villageList.find(v => v.VillageCode === this.autoFillVillageCode);

              if (foundVillage) {
                this.selectedVillage = foundVillage;
              } else {
                this.selectedVillage = {
                  VillageCode: this.autoFillVillageCode,
                  VillageName: this.autoFillVillageName
                };
                this.villageList.push(this.selectedVillage);
              }

              this.autoFillVillageCode = null;
              this.autoFillVillageName = null;
            }
          } else {
            this.apis.showAlert('error', 'Error!', 'Failed fetching villages.');
          }
        },
        error: () => {
          this.apis.showAlert('error', 'Error!', 'Error occurred while fetching villages.');
        }
      });
  }

  onFollowupChange(event: any) {
    this.nextFollowupDate = event.target.value;

    if (this.expectedDeliveryDate && this.expectedDeliveryDate < this.nextFollowupDate) {
      this.expectedDeliveryDate = '';
    }

    this.updateStatus();
  }

  onDeliveryChange(event: any) {
    this.expectedDeliveryDate = event.target.value;
    this.updateStatus();
  }

  updateStatus() {
    if (this.nextFollowupDate && this.expectedDeliveryDate) {
      const followup = new Date(this.nextFollowupDate);
      const delivery = new Date(this.expectedDeliveryDate);

      const diffTime = delivery.getTime() - followup.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        this.enquiryStatus = 'Hot';
      } else if (diffDays <= 60) {
        this.enquiryStatus = 'Warm';
      } else {
        this.enquiryStatus = 'Cold';
      }
    } else {
      this.enquiryStatus = '';
    }
  }

  onSubmit() {
    const payload = {
      ProspectMobile: this.mobileNo,
      ProspectName: this.customerName,
      fatherName: this.fatherName,
      HPCategory: this.interestedHP,
      DriveType: this.interestedDrive,
      InterestedModel: this.interestedModel,
      VarientOrBOMCode: this.variantCode,
      EnquirySource: this.selectedSource,
      EnquirySubSource: this.selectedSubSource,
      ProspectType: this.customerType,
      NextFollowUpDate: this.nextFollowupDate,
      ExpectedPurchaseDate: this.expectedDeliveryDate,
      StateCode: this.selectedState,
      DistrictCode: this.selectedDistrict?.DistrictCode,
      TehsilCode: this.selectedTehsil?.TehsilCode,
      VillageCode: this.selectedVillage === 'Other'
        ? 'Other'
        : this.selectedVillage?.VillageCode,
      ProspectPinCode: this.prospectPin,
      ActionPlanned: this.actionPlanned,
      ProductUse: this.productUse,
      SalesmanName: this.salesmanName,
      SubSubSource: this.subSubSource,
      EnquiryStatus: this.enquiryStatus,
      SalesmanNumber: this.salesmanNumber,
      DealerCode: this.selectedDealer,
      ProspectDistrict: this.selectedDistrict?.DistrictName,
      ProspectTehsil: this.selectedTehsil?.TehsilName,
      ProspectVillage: this.selectedVillage === 'Other'
        ? this.otherVillageName
        : this.selectedVillage?.VillageName,
      customAction: this.otherAction,
      Surname: this.customerSurname,
      Remark: this.remark,
    };

    this.apis.insertGenerateEnquiry(payload).subscribe({
      next: (response: any) => {
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Enquiry Saved Successfully',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonText: 'OK',
            customClass: {
              title: 'swal-title-small',
              htmlContainer: 'swal-text-small'
            }
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload();
            }
          });
        }
        else {
          this.apis.showAlert('error', 'Error!', 'Failed to insert enquiry data. Please try again.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  private fillDriveTypes(hpRange: string) {
    if (!hpRange) {
      this.driveTypesForSelectedHP = [];
      return;
    }

    const [start, end] = hpRange.split('-').map(x => parseInt(x));
    this.driveTypesForSelectedHP = [
      ...new Set(this.modalList.filter(item => {
        const hp = parseInt(item.HpCategory);
        return hp >= start && hp <= end;
      }).map(item => item.DriveType)
      )
    ];
  }

  private fillModels(hpRange: string, driveType: string) {
    if (!hpRange || !driveType) {
      this.modelsForSelectedDrive = [];
      return;
    }

    const [start, end] = hpRange.split('-').map(x => parseInt(x));

    const filtered = this.modalList.filter(item => {
      const hp = parseInt(item.HpCategory);
      return hp >= start && hp <= end && item.DriveType === driveType;
    });

    const uniqueModelsMap = new Map<string, any>();
    filtered.forEach(item => {
      if (!uniqueModelsMap.has(item.ModelName)) {
        uniqueModelsMap.set(item.ModelName, item);
      }
    });

    this.modelsForSelectedDrive = Array.from(uniqueModelsMap.values());
  }

  private setSourceAndSubSource(source: string, subSource: string) {
    this.selectedSource = (source || '').toUpperCase();
    this.subSourceOptions = this.subSourceMapping[this.selectedSource] || [];
    this.selectedSubSource = (subSource || '').toUpperCase();
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

    this.selectedState = '';
    this.villageList = [];
    this.districtList = [];
    this.tehsilList = [];
    this.stateList = [];

    this.interestedHP = '';
    this.interestedDrive = '';
    this.interestedModel = '';
    this.variantCode = '';

    this.customerType = '';
    this.remark = '';
    this.nextFollowupDate = '';
    this.expectedDeliveryDate = '';
    this.enquiryStatus = '';
    this.actionPlanned = '';
    this.productUse = '';
    this.salesmanName = '';
    this.salesmanNumber = '';
    this.prospectPin = '';
    this.selectedSource = '';
    this.selectedSubSource = '';
  }

  getSalesmanList(): void {
 
    if (!this.selectedDealer) return;

    const request = { DealerCode: this.selectedDealer };

    this.apis.getSalesmanByDealerCode(request).subscribe({
      next: (data) => {
        
        this.apiresponse = data as getApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.salesmanList = this.apiresponse.data;

          if (this.autoFillSalesmanName) {
            this.salesmanName = this.autoFillSalesmanName;
            this.salesmanNumber = this.autoFillSalesmanNumber;

            this.autoFillSalesmanName = '';
            this.autoFillSalesmanNumber = '';
          }
          else if (this.salesmanName) {
            this.onSalesmanChange(this.salesmanName);
          }
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching salesman data.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Error occurred while fetching salesman data.');
      }
    });
  }

  onSalesmanChange(salesmanName: string): void {

    if (!salesmanName || !this.salesmanList?.length) {
      this.salesmanNumber = '';
      return;
    }

    if (salesmanName === '__add__') {
      this.salesmanName = '';

      this.openAddSalesmanModal();
      return;
    }

    const selected = this.salesmanList.find(
      (x: any) => x.SalesmanName === salesmanName
    );

    this.salesmanNumber = selected?.MobileNo || '';
  }

  openAddSalesmanModal() {
    const modalEl = document.getElementById('addSalesmanModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
      modal.show();
    }
  }

  onSubmitSalesman() {
    if (!this.newSalesmanName || !this.newSalesmanMobile) {
      this.apis.showAlert('error', 'Error!', 'Please fill all fields');
      return;
    }

    if (!/^\d{10}$/.test(this.newSalesmanMobile)) {
      this.apis.showAlert('error', 'Error!', 'Mobile number must be 10 digits');
      return;
    }

    const request = {
      DealerCode: this.selectedSaleDealer,
      SalesmanName: this.newSalesmanName,
      DealerName: '',
      MobileNo: this.newSalesmanMobile
    };

    this.apis.insertSalesman(request).subscribe({
      next: (res: any) => {
        this.apiresponse = res as getApisResponse;
        if (this.apiresponse.message && this.apiresponse.message.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success', 'Salesman created successfully!').then(() => {

            const modalEl = document.getElementById('addSalesmanModal');
            if (modalEl) {
              const modal = bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
            }
            this.newSalesmanName = '';
            this.newSalesmanMobile = '';

            this.getSalesmanList();
          });
        }
        else {
          this.apis.showAlert('error', 'Error!', res.message || 'Failed to add salesman');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Error occurred while adding salesman');
      }
    });
  }

  closeSalesman(): void {
    this.newSalesmanName = '';
    this.newSalesmanMobile = '';
    this.selectedSaleDealer = '';

    const modalEl = document.getElementById('addSalesmanModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.hide();
    }
  }

  allowNumbersOnly(event: KeyboardEvent) {
    const charCode = event.charCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }
}
