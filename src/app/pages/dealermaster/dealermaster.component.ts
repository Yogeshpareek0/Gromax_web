import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { getApisResponse, filterApisResponse, PersonModel, DealerRequestModel } from '../../model/apiresponse';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dealermaster',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dealermaster.component.html',
  styleUrl: './dealermaster.component.css'
})
export class DealermasterComponent implements OnInit {

  dealerForm!: FormGroup;
  baseLocationForm!: FormGroup;

  // Lists (same APIs jo enquiry component me use hue the)
  hoStateList: any[] = [];
  districtList: any[] = [];
  tehsilList: any[] = [];

  stateHeadList: PersonModel[] = [];
  areaManagersList: PersonModel[] = [];
  territoryManagersList: PersonModel[] = [];
  ccmList: any[] = [];

  // Tehsil multi-select dropdown open/close flag
  isTehsilDropdownOpen: boolean = false;

  // "+ Add New" mode flags
  // false = List mode (dropdown se sirf Name select hota hai, payload me Mail jaata hai)
  // true  = Add New mode (Name + Mobile + Email teeno manually enter hote hain)
  isAddingStateHead: boolean = false;
  isAddingAm: boolean = false;
  isAddingTm: boolean = false;
  isAddingCcm: boolean = false;

  todayDate: string = '';

  /*update*/
  dealersList: any[] = [];
  updateDealerForm!: FormGroup;
  updateDealerId: string = '';

  // Toggle flags for update tab
  isAddingStateHeadUpdate: boolean = false;
  isAddingAmUpdate: boolean = false;
  isAddingTmUpdate: boolean = false;
  isAddingCcmUpdate: boolean = false;


  activeTab: 'add' | 'update' = 'add';

  employeeTypeOptions = [
    { value: 'AM', label: 'Area Manager' },
    { value: 'TM', label: 'Territory Manager' }
  ];


  employeeList: any[] = [];
  districtListBaseLocation: any[] = [];
  tehsilListBaseLocation: any[] = [];
  villageList: any[] = [];



  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private apis: AuthService,
    private eRef: ElementRef,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    const now = new Date();
    this.todayDate = now.toISOString().split('T')[0];

    this.buildForm();
    this.getStateList();
    this.getHOFilter();
    this.getCcmList();

  }

  // BUILD REACTIVE FORM (FormGroup)
  buildForm(): void {
    this.dealerForm = this.fb.group({
      dealerCode: ['', Validators.required],
      dealerName: ['', Validators.required],
      gstNo: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
      panNo: ['', [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      dealerMobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      dealerAlternateMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      dealerEmail: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],

      stateCode: ['', Validators.required],
      stateName: [''],
      district: [null, Validators.required],
      city: ['', Validators.required],
      tehsils: [[], Validators.required],

      // StateHead / AM / TM / CCM - ab koi bhi khali chal sakta hai,
      // lekin agar Name ya Mail me se ek bhara to dono required ho jayenge (conditional pair validation)
      stateHeadMail: ['', [Validators.email]],
      stateHeadName: [''],
      stateHeadMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],

      amMail: ['', [Validators.email]],
      amName: [''],
      amMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],

      tmMail: ['', [Validators.email]],
      tmName: [''],
      tmMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],

      serviceCcmName: [''],
      serviceCcmEmail: ['', [Validators.email]],
      serviceCcmMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],

      dateOfAppointment: ['', Validators.required],
      activeStatus: ['Active', Validators.required]
    });

    this.updateDealerForm = this.fb.group({
      dealerId: ['', Validators.required],
      stateHeadName: [''],
      stateHeadMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      stateHeadMail: ['', [Validators.email]],
      amName: [''],
      amMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      amMail: ['', [Validators.email]],
      tmName: [''],
      tmMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      tmMail: ['', [Validators.email]],
      serviceCcmName: [''],
      serviceCcmMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      serviceCcmEmail: ['', [Validators.email]]
    });

    this.baseLocationForm = this.fb.group({
      employeeType: ['', Validators.required],
      employeeId: ['', Validators.required],
      stateCode: ['', Validators.required],
      stateName: [''],
      districtCode: [null, Validators.required],
      districtName: [''],
      tehsilCode: [null, Validators.required],
      tehsilName: [''],
      villageCode: [null, Validators.required],
      villageName: [''],
      otherLocation: ['']
    });


    // Conditional pair validation setup — 4 pairs (Add form ke liye)
    this.setupConditionalPairValidation('stateHeadName', 'stateHeadMail');
    this.setupConditionalPairValidation('amName', 'amMail');
    this.setupConditionalPairValidation('tmName', 'tmMail');
    this.setupConditionalPairValidation('serviceCcmName', 'serviceCcmEmail');
  }

  // GET STATE LIST (same API jo HO login case me use hoti hai)
  getStateList(): void {
    this.apis.getStateListReportNew().subscribe({
      next: (data) => {
        const res = data as getApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.hoStateList = res.data || [];
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching state list.'); }
    });
  }

  // GET STATE HEAD / AM / TM HIERARCHY (SAME getHOFilter API AS ENQUIRY COMPONENT)
  getHOFilter(): void {
    this.apis.getHOFilter({ ShMail: '', AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        const res = data as filterApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.stateHeadList = res.data.stateHead || [];
          this.areaManagersList = res.data.areaManagers || [];
          this.territoryManagersList = res.data.territoryManagers || [];
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching hierarchy list.'); }
    });
  }

  // GET SERVICE CCM LIST
  // TODO: apna actual "Service CCM list" wala API call yaha kar dena, e.g.:
  // this.apis.getServiceCcmList().subscribe({
  //   next: (data: any) => { if (data?.message?.toLowerCase() === 'success') this.ccmList = data.data || []; }
  // });
  getCcmList(): void {
    this.ccmList = [];
  }

  // STATE CHANGE - LOAD DISTRICTS (same getDistrictList API)
  onStateChange(event: any): void {
    const stateCode = this.dealerForm.get('stateCode')?.value;
    const stateObj = this.hoStateList.find(x => x.stateCode === stateCode);

    this.dealerForm.patchValue({
      stateName: stateObj?.stateName || '',
      district: null,
      tehsils: []
    });
    this.districtList = [];
    this.tehsilList = [];

    if (!stateCode) return;

    this.apis.getDistrictList('State', this.dealerForm.get('stateName')?.value, stateCode).subscribe({
      next: (data) => {
        const res = data as getApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.districtList = res.data;
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching districts.'); }
    });
  }

  // DISTRICT CHANGE - LOAD TEHSILS (same getDistrictList API, Tehsil ab MULTI-select hai)
  onDistrictChange(): void {
    const district = this.dealerForm.get('district')?.value;
    this.dealerForm.patchValue({ tehsils: [] });
    this.tehsilList = [];

    if (!district?.DistrictCode) return;

    this.apis.getDistrictList('District', district.DistrictName, district.DistrictCode).subscribe({
      next: (data) => {
        const res = data as getApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.tehsilList = res.data;
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching tehsils.'); }
    });
  }

  // TEHSIL MULTISELECT - TOGGLE DROPDOWN OPEN/CLOSE
  toggleTehsilDropdown(): void {
    if (!this.tehsilList.length) return;
    this.isTehsilDropdownOpen = !this.isTehsilDropdownOpen;
  }

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isTehsilDropdownOpen = false;
    }
  }

  // CHECK IF A TEHSIL IS ALREADY SELECTED
  isTehsilSelected(tehsil: any): boolean {
    const selected: any[] = this.dealerForm.get('tehsils')?.value || [];
    return selected.some(t => t.TehsilCode === tehsil.TehsilCode);
  }

  // TOGGLE TEHSIL SELECTION (ADD/REMOVE FROM ARRAY)
  onTehsilToggle(tehsil: any, event: any): void {
    const selected: any[] = [...(this.dealerForm.get('tehsils')?.value || [])];
    if (event.target.checked) {
      if (!selected.some(t => t.TehsilCode === tehsil.TehsilCode)) {
        selected.push(tehsil);
      }
    } else {
      const idx = selected.findIndex(t => t.TehsilCode === tehsil.TehsilCode);
      if (idx > -1) selected.splice(idx, 1);
    }
    this.dealerForm.patchValue({ tehsils: selected });
  }

  // SELECTED TEHSIL DISPLAY LABEL
  get selectedTehsilLabel(): string {
    const selected: any[] = this.dealerForm.get('tehsils')?.value || [];
    if (!selected.length) return '';
    if (selected.length <= 2) return selected.map(t => t.TehsilName).join(', ');
    return `${selected[0].TehsilName} +${selected.length - 1} more`;
  }

  // ===================== STATE HEAD =====================

  // List <-> Add New toggle (button click se)
  toggleAddStateHead(isAdding: boolean): void {
    this.isAddingStateHead = isAdding;
    this.dealerForm.patchValue({
      stateHeadMail: '', stateHeadName: '', stateHeadMobile: '',
      amMail: '', amName: '', amMobile: '',
      tmMail: '', tmName: '', tmMobile: ''
    });
    this.areaManagersList = [];
    this.territoryManagersList = [];
    this.isAddingAm = false;
    this.isAddingTm = false;
  }

  // LIST MODE - dropdown se select hone par Name/Mobile auto-fill + AM list load
  onStateHeadChange(): void {
    const mail = this.dealerForm.get('stateHeadMail')?.value;
    const sh = this.stateHeadList.find(x => x.Mail === mail);

    this.dealerForm.patchValue({
      stateHeadName: sh?.Name || '',
      stateHeadMobile: (sh as any)?.MobileNo || '',
      amMail: '', amName: '', amMobile: '',
      tmMail: '', tmName: '', tmMobile: ''
    });
    this.territoryManagersList = [];
    this.isAddingAm = false;
    this.isAddingTm = false;

    this.apis.getHOFilter({ ShMail: mail, AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        const res = data as filterApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.areaManagersList = res.data.areaManagers || [];
          this.territoryManagersList = res.data.territoryManagers || [];
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching Area Managers.'); }
    });
  }

  // ===================== AREA MANAGER =====================

  toggleAddAm(isAdding: boolean): void {
    this.isAddingAm = isAdding;
    this.dealerForm.patchValue({
      amMail: '', amName: '', amMobile: '',
      tmMail: '', tmName: '', tmMobile: ''
    });
    this.territoryManagersList = [];
    this.isAddingTm = false;
  }

  onAmChange(): void {
    const mail = this.dealerForm.get('amMail')?.value;
    const am = this.areaManagersList.find(x => x.Mail === mail);

    this.dealerForm.patchValue({
      amName: am?.Name || '',
      amMobile: (am as any)?.MobileNo || '',
      tmMail: '', tmName: '', tmMobile: ''
    });
    this.isAddingTm = false;

    this.apis.getHOFilter({ ShMail: this.dealerForm.get('stateHeadMail')?.value, AmMail: mail, TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        const res = data as filterApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.territoryManagersList = res.data.territoryManagers || [];
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching Territory Managers.'); }
    });
  }

  // ===================== TERRITORY MANAGER =====================

  toggleAddTm(isAdding: boolean): void {
    this.isAddingTm = isAdding;
    this.dealerForm.patchValue({ tmMail: '', tmName: '', tmMobile: '' });
  }

  onTmChange(): void {
    const mail = this.dealerForm.get('tmMail')?.value;
    const tm = this.territoryManagersList.find(x => x.Mail === mail);

    this.dealerForm.patchValue({
      tmName: tm?.Name || '',
      tmMobile: (tm as any)?.MobileNo || ''
    });
  }

  // ===================== SERVICE CCM =====================

  toggleAddCcm(isAdding: boolean): void {
    this.isAddingCcm = isAdding;
    this.dealerForm.patchValue({ serviceCcmName: '', serviceCcmEmail: '', serviceCcmMobile: '' });
  }

  onCcmChange(): void {
    const mail = this.dealerForm.get('serviceCcmEmail')?.value;
    const ccm = this.ccmList.find(x => x.Mail === mail);

    this.dealerForm.patchValue({
      serviceCcmName: ccm?.Name || '',
      serviceCcmMobile: (ccm as any)?.MobileNo || ''
    });
  }

  // FIELD ERROR HELPER (FormGroup ke liye)
  hasError(controlName: string): boolean {
    const control = this.dealerForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  nullIfBlank(value: any): any {
    return value === null || value === undefined || value === ''
      ? null
      : value;
  }

  // SUBMIT
  onSubmit(): void {
    if (this.dealerForm.invalid) {
      this.dealerForm.markAllAsTouched();
      this.apis.showAlert('error', 'Error!', 'Please fill all required fields correctly.');
      return;
    }

    const formValue = this.dealerForm.value;

    // Backend field-names ke exact match me payload
    const payload: DealerRequestModel = {
      dealerCode: this.nullIfBlank(formValue.dealerCode),
      dealerName: this.nullIfBlank(formValue.dealerName),
      gstNo: this.nullIfBlank(formValue.gstNo),
      panNo: this.nullIfBlank(formValue.panNo),
      dealerMobile: this.nullIfBlank(formValue.dealerMobile),
      dealerAlternateMobile: this.nullIfBlank(formValue.dealerAlternateMobile),
      dealerEmail: this.nullIfBlank(formValue.dealerEmail),

      address: this.nullIfBlank(formValue.address),

      stateCode: this.nullIfBlank(formValue.stateCode),
      stateName: this.nullIfBlank(formValue.stateName),
      districtCode: this.nullIfBlank(formValue.district?.DistrictCode),
      district: this.nullIfBlank(formValue.district?.DistrictName),
      city: this.nullIfBlank(formValue.city),

      tehsilCodes: formValue.tehsils?.length
        ? formValue.tehsils.map((t: any) => t.TehsilCode)
        : null,

      tehsils: formValue.tehsils?.length
        ? formValue.tehsils.map((t: any) => t.TehsilName)
        : null,

      stateHeadName: this.nullIfBlank(formValue.stateHeadName),
      stateHeadMail: this.nullIfBlank(formValue.stateHeadMail),
      stateHeadMobile: this.nullIfBlank(formValue.stateHeadMobile),

      amName: this.nullIfBlank(formValue.amName),
      amMail: this.nullIfBlank(formValue.amMail),
      amMobile: this.nullIfBlank(formValue.amMobile),

      tmName: this.nullIfBlank(formValue.tmName),
      tmMail: this.nullIfBlank(formValue.tmMail),
      tmMobile: this.nullIfBlank(formValue.tmMobile),

      serviceCcmName: this.nullIfBlank(formValue.serviceCcmName),
      serviceCcmEmail: this.nullIfBlank(formValue.serviceCcmEmail),
      serviceCcmMobile: this.nullIfBlank(formValue.serviceCcmMobile),

      dateOfAppointment: this.nullIfBlank(formValue.dateOfAppointment),
      activeStatus: this.nullIfBlank(formValue.activeStatus)
    };

    this.apis.addDealerMaster(payload).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          Swal.fire({ icon: 'success', title: 'Success', text: 'Dealer Saved Successfully', confirmButtonText: 'OK' })
            .then(() => this.resetForm());
        } else {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to save dealer.');
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.'); }
    });
  }

  // RESET FORM
  resetForm(): void {
    this.dealerForm.reset({ activeStatus: 'Active' });
    this.districtList = [];
    this.tehsilList = [];
    this.areaManagersList = [];
    this.territoryManagersList = [];
    this.isAddingStateHead = false;
    this.isAddingAm = false;
    this.isAddingTm = false;
    this.isAddingCcm = false;
  }

  // GENERIC: agar in dono field (Name / Mail) me se koi ek bhara hai to dono required ho jayenge,
  // dono khali hai to koi bhi required nahi (optional pair)
  setupConditionalPairValidation(nameField: string, mailField: string): void {
    const nameCtrl = this.dealerForm.get(nameField);
    const mailCtrl = this.dealerForm.get(mailField);
    if (!nameCtrl || !mailCtrl) return;

    const revalidate = () => {
      const nameVal = (nameCtrl.value || '').toString().trim();
      const mailVal = (mailCtrl.value || '').toString().trim();

      if (nameVal || mailVal) {
        nameCtrl.addValidators(Validators.required);
        mailCtrl.addValidators(Validators.required);
      } else {
        nameCtrl.removeValidators(Validators.required);
        mailCtrl.removeValidators(Validators.required);
      }

      nameCtrl.updateValueAndValidity({ emitEvent: false });
      mailCtrl.updateValueAndValidity({ emitEvent: false });
    };

    nameCtrl.valueChanges.subscribe(revalidate);
    mailCtrl.valueChanges.subscribe(revalidate);

    // Edit mode ya "Add New" toggle ke baad bhi initial state sahi ho, isliye ek baar turant bhi chala do
    revalidate();
  }

  // UPDATE FORM KE LIYE SAME CONDITIONAL PAIR VALIDATION
  setupConditionalPairValidationUpdate(nameField: string, mailField: string): void {
    const nameCtrl = this.updateDealerForm.get(nameField);
    const mailCtrl = this.updateDealerForm.get(mailField);
    if (!nameCtrl || !mailCtrl) return;

    const revalidate = () => {
      const nameVal = (nameCtrl.value || '').toString().trim();
      const mailVal = (mailCtrl.value || '').toString().trim();

      if (nameVal || mailVal) {
        nameCtrl.addValidators(Validators.required);
        mailCtrl.addValidators(Validators.required);
      } else {
        nameCtrl.removeValidators(Validators.required);
        mailCtrl.removeValidators(Validators.required);
      }

      nameCtrl.updateValueAndValidity({ emitEvent: false });
      mailCtrl.updateValueAndValidity({ emitEvent: false });
    };

    nameCtrl.valueChanges.subscribe(revalidate);
    mailCtrl.valueChanges.subscribe(revalidate);

    revalidate();
  }

  // LOAD DEALERS FOR UPDATE TAB
  loadDealersForUpdate(): void {
    const payload = { statusCode: null };

    this.apis.dealerListStatewise(payload).subscribe({
      next: (data: any) => {
        const res = data as getApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.dealersList = (res.data || []).sort((a: any, b: any) =>
            a.DealerCode.localeCompare(b.DealerCode)
          );
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Error fetching dealers list.');
      }
    });
  }


  getDealerDetail(): void {
    this.apis.GetDealerDetailByDealerCode(this.updateDealerId).subscribe({
      next: (data: any) => {
        const res = data;
        if (res.message?.toLowerCase() === 'success') {
          const dealer = res.data[0] || [];
          if (dealer) {
            this.updateDealerForm.patchValue({
              stateHeadMail: dealer.stateHeadMail,
              amMail: dealer.amMail,
              tmMail: dealer.tmMail,
              serviceCcmEmail: dealer.serviceCcmEmail
            });
          }
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'Error fetching dealers detail.');
      }
    });
  }

  // UPDATE ERROR HELPER
  hasUpdateError(fieldName: string): boolean {
    const field = this.updateDealerForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  // ===================== UPDATE DEALER FUNCTIONS =====================

  // UPDATE DEALER - DEALER SELECT KAR KE DATA LOAD KARNA
  onSelectDealerForUpdate(): void {
    this.updateDealerId = this.updateDealerForm.get('dealerId')?.value || '';

    if (!this.updateDealerId) {
      this.resetUpdateForm();
      return;
    }


    // Form ko reset karo pehle
    this.updateDealerForm.patchValue({
      stateHeadName: '',
      stateHeadMobile: '',
      stateHeadMail: '',
      amName: '',
      amMobile: '',
      amMail: '',
      tmName: '',
      tmMobile: '',
      tmMail: '',
      serviceCcmName: '',
      serviceCcmMobile: '',
      serviceCcmEmail: ''
    });
    this.getDealerDetail();

  }

  // UPDATE MODE - TERRITORY MANAGERS LOAD KARNA
  private loadTerritoryManagersForUpdate(shMail: string, amMail: string, tmMail?: string): void {
    this.apis.getHOFilter({
      ShMail: shMail,
      AmMail: amMail,
      TmMail: '',
      DealerMail: ''
    }).subscribe({
      next: (data) => {
        const res = data as filterApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.territoryManagersList = res.data.territoryManagers || [];

          if (tmMail) {
            this.updateDealerForm.patchValue({
              tmMail: tmMail,
              tmName: this.updateDealerForm.get('tmName')?.value || '',
              tmMobile: this.updateDealerForm.get('tmMobile')?.value || ''
            });
            this.isAddingTmUpdate = false;
          }
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching Territory Managers.'); }
    });
  }

  // UPDATE - STATE HEAD DROPDOWN CHANGE
  onStateHeadChangeUpdate(): void {
    const mail = this.updateDealerForm.get('stateHeadMail')?.value;
    const sh = this.stateHeadList.find(x => x.Mail === mail);

    this.updateDealerForm.patchValue({
      stateHeadName: sh?.Name || '',
      stateHeadMobile: (sh as any)?.MobileNo || '',
      amMail: '',
      amName: '',
      amMobile: '',
      tmMail: '',
      tmName: '',
      tmMobile: ''
    });

    this.territoryManagersList = [];
    this.isAddingAmUpdate = false;
    this.isAddingTmUpdate = false;

    this.apis.getHOFilter({ ShMail: mail, AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        const res = data as filterApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.areaManagersList = res.data.areaManagers || [];
          this.territoryManagersList = res.data.territoryManagers || [];
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching Area Managers.'); }
    });
  }

  // UPDATE - AREA MANAGER DROPDOWN CHANGE
  onAmChangeUpdate(): void {
    const mail = this.updateDealerForm.get('amMail')?.value;
    const am = this.areaManagersList.find(x => x.Mail === mail);

    this.updateDealerForm.patchValue({
      amName: am?.Name || '',
      amMobile: (am as any)?.MobileNo || '',
      tmMail: '',
      tmName: '',
      tmMobile: ''
    });
    this.isAddingTmUpdate = false;

    this.apis.getHOFilter({
      ShMail: this.updateDealerForm.get('stateHeadMail')?.value,
      AmMail: mail,
      TmMail: '',
      DealerMail: ''
    }).subscribe({
      next: (data) => {
        const res = data as filterApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.territoryManagersList = res.data.territoryManagers || [];
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching Territory Managers.'); }
    });
  }

  // UPDATE - TERRITORY MANAGER DROPDOWN CHANGE
  onTmChangeUpdate(): void {
    const mail = this.updateDealerForm.get('tmMail')?.value;
    const tm = this.territoryManagersList.find(x => x.Mail === mail);

    this.updateDealerForm.patchValue({
      tmName: tm?.Name || '',
      tmMobile: (tm as any)?.MobileNo || ''
    });
  }

  // UPDATE - SERVICE CCM DROPDOWN CHANGE
  onCcmChangeUpdate(): void {
    const mail = this.updateDealerForm.get('serviceCcmEmail')?.value;
    const ccm = this.ccmList.find(x => x.Mail === mail);

    this.updateDealerForm.patchValue({
      serviceCcmName: ccm?.Name || '',
      serviceCcmMobile: (ccm as any)?.MobileNo || ''
    });
  }

  // UPDATE - STATE HEAD "Add New" TOGGLE
  toggleAddStateHeadUpdate(isAdding: boolean): void {
    this.isAddingStateHeadUpdate = isAdding;
    if (isAdding) {
      this.updateDealerForm.patchValue({
        stateHeadName: '',
        stateHeadMail: '',
        stateHeadMobile: ''
      });
    }
  }

  // UPDATE - AREA MANAGER "Add New" TOGGLE
  toggleAddAmUpdate(isAdding: boolean): void {
    this.isAddingAmUpdate = isAdding;
    if (isAdding) {
      this.updateDealerForm.patchValue({
        amName: '',
        amMail: '',
        amMobile: ''
      });
    }
  }

  // UPDATE - TERRITORY MANAGER "Add New" TOGGLE
  toggleAddTmUpdate(isAdding: boolean): void {
    this.isAddingTmUpdate = isAdding;
    if (isAdding) {
      this.updateDealerForm.patchValue({
        tmName: '',
        tmMail: '',
        tmMobile: ''
      });
    }
  }

  // UPDATE - SERVICE CCM "Add New" TOGGLE
  toggleAddCcmUpdate(isAdding: boolean): void {
    this.isAddingCcmUpdate = isAdding;
    if (isAdding) {
      this.updateDealerForm.patchValue({
        serviceCcmName: '',
        serviceCcmEmail: '',
        serviceCcmMobile: ''
      });
    }
  }

  // UPDATE SUBMIT
  private submitUpdateDealerPayload(): void {

    const formValue = this.updateDealerForm.value;

    const payload: any = {
      dealerId: this.updateDealerId,
      stateHeadName: this.nullIfBlank(formValue.stateHeadName),
      stateHeadMail: this.nullIfBlank(formValue.stateHeadMail),
      stateHeadMobile: this.nullIfBlank(formValue.stateHeadMobile),
      amName: this.nullIfBlank(formValue.amName),
      amMail: this.nullIfBlank(formValue.amMail),
      amMobile: this.nullIfBlank(formValue.amMobile),
      tmName: this.nullIfBlank(formValue.tmName),
      tmMail: this.nullIfBlank(formValue.tmMail),
      tmMobile: this.nullIfBlank(formValue.tmMobile),
      serviceCcmName: this.nullIfBlank(formValue.serviceCcmName),
      serviceCcmEmail: this.nullIfBlank(formValue.serviceCcmEmail),
      serviceCcmMobile: this.nullIfBlank(formValue.serviceCcmMobile)
    };

    this.apis.updateDealerAssignments(payload).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          Swal.fire({ icon: 'success', title: 'Success', text: 'Dealer Updated Successfully', confirmButtonText: 'OK' })
            .then(() => this.resetUpdateForm());
        } else {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to update dealer.');
        }
      },
      error: (err: any) => {
        const errorMessage = err?.error?.message || err?.error?.Message || err?.message || 'An error occurred. Please try again.';
        this.apis.showAlert('error', 'Error!', errorMessage);
      }
    });
  }

  onUpdateSubmit(): void {
    // Sirf dealerId required hai
    if (!this.updateDealerId) {
      this.apis.showAlert('error', 'Error!', 'Please select a dealer first.');
      return;
    }

    // Form validation - sirf email aur mobile pattern check karo
    if (this.updateDealerForm.invalid) {
      this.updateDealerForm.markAllAsTouched();
      this.apis.showAlert('error', 'Error!', 'Please check email and mobile formats.');
      return;
    }

    // Confirmation popup
    Swal.fire({
      title: 'Confirm Update',
      text: 'Are you sure you want to update dealer Mapping?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.submitUpdateDealerPayload();
      }
    });
  }

  // RESET UPDATE FORM
  resetUpdateForm(): void {
    this.updateDealerForm.reset();
    this.updateDealerId = '';
    this.dealersList = [];
    this.areaManagersList = [];
    this.territoryManagersList = [];
    this.isAddingStateHeadUpdate = false;
    this.isAddingAmUpdate = false;
    this.isAddingTmUpdate = false;
    this.isAddingCcmUpdate = false;
  }

  // TAB CHANGE
  tabChange(tab: string): void {
    if (tab === 'update') {
      this.dealerForm.reset({ activeStatus: 'Active' });
      this.resetForm();
      this.loadDealersForUpdate();
      this.resetBaseLocationForm();

      this.getHOFilter();
      this.getCcmList();

    }
    else {
      this.resetUpdateForm();
      this.resetBaseLocationForm();
      this.dealerForm.reset({ activeStatus: 'Active' });
    }
  }



  loadEmployeeList(employeeType: string): void {
    const params = new HttpParams()
      .set('position', employeeType);
    this.apis.getEmployeeListByPosition(params).subscribe({
      next: (res: any) => {

        if (res?.statusCode === 200 && res?.data) {

          this.employeeList = res.data ? res.data : null;

        } else {
          this.employeeList = [];

          this.toastr.error(
            res?.message || 'Unable to load Employee list.',
            'Error'
          );
        }
      },

      error: (err) => {
        console.error('Get Employee List Error:', err);

        this.employeeList = [];

        this.toastr.error(
          err?.error?.message || 'Unable to load Employee list.',
          'Error'
        );
      }
    });
  }

  onEmployeeTypeChange(): void {
    const empType = this.baseLocationForm.get('employeeType')?.value;
    this.baseLocationForm.patchValue({ employeeId: '' });
    this.baseLocationForm.patchValue({ stateCode: '' });
    this.districtListBaseLocation = [];
    this.tehsilListBaseLocation = [];
    this.villageList = [];

    if (empType) {
      this.loadEmployeeList(empType);
    }
  }

  onEmployeeChange(): void {
    const empType = this.baseLocationForm.get('employeeId')?.value;
    this.baseLocationForm.patchValue({ stateCode: '' });

    this.districtListBaseLocation = [];
    this.tehsilListBaseLocation = [];
    this.villageList = [];

    //if (empType) {
    //  this.loadEmployeeList(empType);
    //}
  }

  hasBaseLocationError(controlName: string): boolean {
    const control = this.baseLocationForm.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  // ==================== SUBMIT BASE LOCATION ====================

  submitBaseLocation(): void {
    if (this.baseLocationForm.invalid) {
      this.baseLocationForm.markAllAsTouched();
      this.apis.showAlert('error', 'Error!', 'Please fill all required fields.');
      return;
    }

    const formValue = this.baseLocationForm.value;

    const payload = {
      employeeType: this.nullIfBlank(formValue.employeeType),
      employeeId: this.nullIfBlank(formValue.employeeId)
        ? Number(formValue.employeeId) : null,
      stateCode: this.nullIfBlank(formValue.stateCode)
        ? Number(formValue.stateCode) : null,
      districtCode: this.nullIfBlank(formValue.districtCode)
        ? Number(formValue.districtCode) : null,
      tehsilCode: this.nullIfBlank(formValue.tehsilCode)
        ? Number(formValue.tehsilCode) : null,
      villageCode: this.nullIfBlank(formValue.villageCode)
        ? Number(formValue.villageCode) : null,
      otherLocation: this.nullIfBlank(formValue.otherLocation)
    };

    // TODO: API call - save base location
    this.apis.addBaseLocation(payload).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.apis.showAlert('success', 'Success!', 'Base Location Added Successfully.').then(() => this.resetBaseLocationForm());
        } else {
          this.apis.showAlert('error', 'Error!', res?.message || 'Failed to add base location.');
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'An error occurred. Please try again.'); }
    });
  }


  resetBaseLocationForm(): void {
    this.baseLocationForm.reset();
    this.employeeList = [];
    this.districtListBaseLocation = [];
    this.tehsilListBaseLocation = [];
    this.villageList = [];
  }


  //loadLocationData(data: any): void {
  //  if (!data.prospectDistrictCode) return;
  //  this.apis.getDistrictList('State', data.dealerStateName, data.stateCode).subscribe({
  //    next: (districtRes: any) => {
  //      if (districtRes?.message?.toLowerCase() === 'success') {
  //        this.districtList = districtRes.data || [];
  //        const districtObj = this.districtList.find((d: any) => d.DistrictCode === data.prospectDistrictCode);
  //        if (districtObj) {
  //          this.selectedDistrict = districtObj;
  //          this.apis.getDistrictList('District', districtObj.DistrictName, data.prospectDistrictCode).subscribe({
  //            next: (tehsilRes: any) => {
  //              if (tehsilRes?.message?.toLowerCase() === 'success') {
  //                this.tehsilList = tehsilRes.data || [];
  //                const tehsilObj = this.tehsilList.find((t: any) => t.TehsilCode === data.prospectTehsilCode);
  //                if (tehsilObj) {
  //                  this.selectedTehsil = tehsilObj;
  //                  this.apis.getDistrictList('Tehsil', tehsilObj.TehsilName, data.prospectTehsilCode).subscribe({
  //                    next: (villageRes: any) => {
  //                      if (villageRes?.message?.toLowerCase() === 'success') {
  //                        this.villageList = villageRes.data || [];
  //                        if (data.prospectVillageCode === 'Other') {
  //                          this.selectedVillage = 'Other';
  //                        } else {
  //                          const villageObj = this.villageList.find((v: any) => v.VillageCode === data.prospectVillageCode);
  //                          if (villageObj) this.selectedVillage = villageObj;
  //                        }
  //                      }
  //                    }
  //                  });
  //                }
  //              }
  //            }
  //          });
  //        }
  //      }
  //    }
  //  });
  //}

  onBaseStateChange(): void {
    const stateCode = this.baseLocationForm.get('stateCode')?.value;
    const stateObj = this.hoStateList.find(x => x.stateCode === stateCode);

    this.baseLocationForm.patchValue({
      stateName: stateObj?.stateName || '',
      district: null,

    });
    this.districtListBaseLocation = [];
    this.tehsilListBaseLocation = [];
    this.villageList = [];



    if (!stateCode) return;

    this.apis.getDistrictList('State', this.dealerForm.get('stateName')?.value, stateCode).subscribe({
      next: (data) => {
        const res = data as getApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.districtListBaseLocation = res.data;
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching districts.'); }
    });
  }

  onBaseDistrictChange(): void {
    const districtCode = this.baseLocationForm.get('districtCode')?.value;
    const districtObj = this.districtListBaseLocation.find(x => x.DistrictCode === districtCode);

    this.baseLocationForm.patchValue({
      districtName: districtObj?.DistrictName || '',
      tehsilCode: null,

    });
    this.tehsilListBaseLocation = [];
    this.villageList = [];


    if (!districtCode) return;

    this.apis.getDistrictList('District', this.baseLocationForm.get('districtName')?.value, districtCode).subscribe({
      next: (data) => {
        const res = data as getApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.tehsilListBaseLocation = res.data;
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching districts.'); }
    });
  }


  onBasetehsilCodeChange(): void {
    const tehsilCode = this.baseLocationForm.get('tehsilCode')?.value;
    const tehsilObj = this.tehsilListBaseLocation.find(x => x.TehsilCode === tehsilCode);

    this.baseLocationForm.patchValue({
      tehsilName: tehsilObj?.TehsilName || '',
      villageCode: null,

    });
    this.villageList = [];

    if (!tehsilCode) return;

    this.apis.getDistrictList('Tehsil', tehsilObj?.TehsilName || '', tehsilCode).subscribe({
      next: (data) => {
        const res = data as getApisResponse;
        if (res.message?.toLowerCase() === 'success') {
          this.villageList = res.data;
        }
      },
      error: () => { this.apis.showAlert('error', 'Error!', 'Error fetching districts.'); }
    });
  }



}
