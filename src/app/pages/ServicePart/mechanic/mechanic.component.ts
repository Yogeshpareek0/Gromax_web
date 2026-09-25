import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-mechanic',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './mechanic.component.html',
  styleUrl: './mechanic.component.css'
})
export class MechanicComponent implements OnInit {

  // ── Tab & Navigation ──────────────────────────────────────────────────────
  activeTab: string = 'list';
  positionId: string | null = ''; // 'Dealer' || 'CCM' || 'Service Head'

  // ── Form Fields ────────────────────────────────────────────────────────────
  mechanicName: string = '';
  contactNo: string = '';
  aadharNo: string = '';
  typeOfMechanic: string = '';
  education: string = '';
  experienceInDealership: number | null = null;
  priorExperience: string = '';
  priorExperienceYears: number | null = null;
  totalExperience: number | null = null;
  physicalTraining: number | null = null;
  virtualTraining: number | null = null;
  installationAttendance: string = '';
  hydraulicAttendance: string = '';
  engineAttendance: string = '';
  completeTraining: string = '';
  systemProcess: string = '';
  currentStatus: string = '';
  inactiveDate: any = null;

  // ── Form State ─────────────────────────────────────────────────────────────
  submitClicked: boolean = false;
  approvalStatus: string = '';
  mechanicId: string = '';

  filterApprovalStatus: string = 'Approved';
  filterStartDate: string = this.getFirstDateOfCurrentMonth();
  filterEndDate: string = this.getLastDateOfCurrentMonth();


  // ── Data Lists ─────────────────────────────────────────────────────────────
  mechanicList: any[] = [];
  approvalList: any[] = [];

  // ── Approval Filtering ─────────────────────────────────────────────────────
  selectedApprovalStatus: string = 'Pending';

  // ── Reject Modal ───────────────────────────────────────────────────────────
  showRejectModal: boolean = false;
  rejectTargetItem: any = null;
  rejectRemark: string = '';
  rejectSubmitClicked: boolean = false;

  constructor(private apis: AuthService, private toastr: ToastrService) { }

  ngOnInit(): void {
    // SessionStorage se position lane wala code tu apne handle karega
    this.positionId = sessionStorage.getItem('possitionId') ?? null;
    this.loadMechanicList();
  }


  getFirstDateOfCurrentMonth(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }

  getLastDateOfCurrentMonth(): string {
    const date = new Date();

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  // ── Tab Navigation ────────────────────────────────────────────────────────
  showList(): void {
    this.activeTab = 'list';
    this.submitClicked = false;
    this.loadMechanicList();
  }

  showCreate(): void {
    this.resetFormFields();
    this.mechanicId = '';
    this.approvalStatus = '';
    this.activeTab = 'create';
  }

  showApproval(): void {
    this.activeTab = 'approval';
    this.selectedApprovalStatus = 'Pending';
    this.loadApprovalList();
  }

  loadMechanicList(): void {
    const params = new HttpParams()
      .set('stDate', this.filterStartDate)
      .set('enDate', this.filterEndDate)
      .set('status', this.filterApprovalStatus);

    this.apis.getMechanicList(params).subscribe({
      next: (res: any) => {

        if (res?.statusCode === 200 && res?.data) {

          this.mechanicList = res.data ? res.data : null;

        } else {
          this.mechanicList = [];

          this.toastr.error(
            res?.message || 'Unable to load mechanic list.',
            'Error'
          );
        }
      },

      error: (err) => {
        //console.error('Get Mechanic List Error:', err);

        this.mechanicList = [];

        this.toastr.error(
          err?.error?.message || 'Unable to load mechanic list.',
          'Error'
        );
      }
    });
  }

  loadApprovalList(): void {
    // Filter karega apna backend se based on selectedApprovalStatus
    this.apis.getMechanicPendingList().subscribe({
      next: (res: any) => {

        if (res?.statusCode === 200 && res?.data) {

          this.approvalList = res.data ? res.data : null;

        } else {
          this.approvalList = [];

          this.toastr.error(
            res?.message || 'Unable to load mechanic list.',
            'Error'
          );
        }
      },

      error: (err) => {
        //console.error('Get Mechanic List Error:', err);

        this.approvalList = [];

        this.toastr.error(
          err?.error?.message || 'Unable to load mechanic list.',
          'Error'
        );
      }
    });

  }

  onApprovalStatusChange(): void {
    this.loadApprovalList();
  }

  private validateMechanicForm(): boolean {
    if (
      !this.mechanicName ||
      !this.contactNo ||
      !this.isPhoneValid(this.contactNo) ||
      !this.aadharNo ||
      !this.typeOfMechanic ||
      !this.education ||
      !this.experienceInDealership ||
      !this.currentStatus
    ) {
      return false;
    }

    // Inactive hai to inactiveDate required hai
    if (this.currentStatus === 'Inactive' && !this.inactiveDate) {
      return false;
    }

    return true;
  }

  private getMechanicPayload(): any {
    return {
      ...(this.activeTab === 'update' && {
        mechanicId: this.mechanicId,
        currentStatus: this.currentStatus,
        deletedStatusDate: this.inactiveDate ?? null
      }),
      mechanicName: this.mechanicName,
      contactNo: this.contactNo,
      aadharCardNo: this.aadharNo,
      typeOfMechanic: this.typeOfMechanic,

      education: this.education,

      experienceInGromax: this.experienceInDealership
        ? Number(this.experienceInDealership)
        : null,

      priorExperience: this.priorExperience || null,

      priorExperienceYears: this.priorExperienceYears
        ? Number(this.priorExperienceYears)
        : null,

      totalExperience: this.totalExperience
        ? Number(this.totalExperience)
        : null,

      physicalTrainingCount: this.physicalTraining
        ? Number(this.physicalTraining)
        : 0,

      virtualTrainingCount: this.virtualTraining
        ? Number(this.virtualTraining)
        : 0,

      installationAttendance: this.installationAttendance || null,
      hydraulicAttendance: this.hydraulicAttendance || null,
      engineAttendance: this.engineAttendance || null,

      completeTractorTraining: this.completeTraining || null,
      systemAndProcess: this.systemProcess || null
    };
  }

  onSubmitMechanic(): void {
    this.submitClicked = true;

    // Validation
    if (!this.validateMechanicForm()) {
      return;
    }
    else if (this.activeTab === 'create')
      this.insertMechanic()
    else if (this.activeTab === 'update')
      this.updateMechanic()

  }

  insertMechanic() {
    // Prepare payload
    const payload = this.getMechanicPayload();

    // API call
    this.apis.insertMechanic(payload).subscribe({
      next: (res: any) => {
        if (res.message === 'Success') {
          this.toastr.success(
            res.message || 'Mechanic saved successfully!',
            'Success'
          );

          this.resetFormFields();
          this.showList();
        }
        else {
          this.toastr.error(
            res?.message || 'Unable to save mechanic details.',
            'Error'
          );
        }
      },
      error: (err) => {
        //console.error('Mechanic API Error:', err);

        this.toastr.error(
          err?.message || 'Unable to save mechanic details.',
          'Error'
        );
      }
    });
  }
  updateMechanic() {
    // Prepare payload
    const payload = this.getMechanicPayload();

    // API call
    this.apis.updateMechanic(payload).subscribe({
      next: (res: any) => {
        if (res.message === 'Success') {
          this.toastr.success(
            res.message || 'Mechanic saved successfully!',
            'Success'
          );

          this.resetFormFields();
          this.showList();
        }
        else {
          this.toastr.error(
            res?.message || 'Unable to save mechanic details.',
            'Error'
          );
        }
      },
      error: (err) => {
        //console.error('Mechanic API Error:', err);

        this.toastr.error(
          err?.message || 'Unable to save mechanic details.',
          'Error'
        );
      }
    });
  }
  // ── Row Click (Update mode) ────────────────────────────────────────────────
  onRowClick(item: any): void {
    this.resetFormFields();
    this.mechanicId = item.mechanicID; // Ya ID use karna chahte ho
    this.mechanicName = item.mechanicName;
    this.contactNo = item.contactNo;
    this.aadharNo = item.aadharCardNo;
    this.typeOfMechanic = item.typeOfMechanic;
    this.education = item.education;
    this.experienceInDealership = item.experienceInGromax;
    this.priorExperience = item.priorExperience;
    this.priorExperienceYears = item.priorExperienceYears;
    this.totalExperience = item.totalExperience;
    this.physicalTraining = item.physicalTrainingCount;
    this.virtualTraining = item.virtualTrainingCount;
    this.installationAttendance = item.installationAttendance;
    this.hydraulicAttendance = item.hydraulicAttendance;
    this.engineAttendance = item.engineAttendance;
    this.completeTraining = item.completeTractorTraining;
    this.systemProcess = item.systemAndProcess;
    this.currentStatus = item.isDeleted === false ? 'Active' : 'Inactive';
    this.inactiveDate = item.deletedDate;
    this.approvalStatus = item.approvalStatus;

    this.activeTab = 'update';
  }

  // ── Reset Form ─────────────────────────────────────────────────────────────
  resetFormFields(): void {
    this.mechanicName = '';
    this.contactNo = '';
    this.aadharNo = '';
    this.typeOfMechanic = '';
    this.education = '';
    this.experienceInDealership = null;
    this.priorExperience = '';
    this.priorExperienceYears = null;
    this.totalExperience = null;
    this.physicalTraining = null;
    this.virtualTraining = null;
    this.installationAttendance = '';
    this.hydraulicAttendance = '';
    this.engineAttendance = '';
    this.completeTraining = '';
    this.systemProcess = '';
    this.currentStatus = '';
    this.inactiveDate = null;
    this.approvalStatus = '';
    this.mechanicId = '';
    this.submitClicked = false;
  }

  // ── Validation Helpers ────────────────────────────────────────────────────
  isPhoneValid(phone: string): boolean {
    return /^[0-9]{10}$/.test(phone);
  }

  allowNumbersOnly(event: KeyboardEvent): void {
    const charCode = event.charCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  // ── Approval Actions ──────────────────────────────────────────────────────
  onApproveAction(item: any): void {
    const payload = {
      mechanicId: item.mechanicID,
      status: 'Approved',
      remark: ''
    };

    this.apis.showConfirm(
      'Approve Mechanic?',
      'Are you sure you want to approve this mechanic?',
      'Yes, Approve',
      'Cancel'
    ).then((result: any) => {

      if (!result.isConfirmed) {
        return;
      }

      this.approvalStatusApis(payload);
      this.loadApprovalList();

    });
  }

  // ── Reject Modal ──────────────────────────────────────────────────────────
  openRejectModal(item: any): void {
    this.rejectTargetItem = item;
    this.rejectRemark = '';
    this.rejectSubmitClicked = false;
    this.showRejectModal = true;
  }


  approvalStatusApis(payload: any): void {
    this.apis.approvalMechanicStatus(payload).subscribe({
      next: (res: any) => {
        if (res.message === 'Success') {
          this.toastr.success(
            payload.status === 'Approved'
              ? 'Mechanic approved successfully.'
              : 'Mechanic rejected successfully.',
            'Success'
          );

          this.resetFormFields();
          this.showList();
        } else {
          this.toastr.error(
            res?.message || 'Unable to update mechanic approval status.',
            'Error'
          );
        }
      },
      error: (err) => {
        //console.error('Mechanic Approval API Error:', err);

        this.toastr.error(
          err?.error?.message || 'Unable to update mechanic approval status.',
          'Error'
        );
      }
    });
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectTargetItem = null;
    this.rejectRemark = '';
    this.rejectSubmitClicked = false;
  }
  onRemarkInput(): void {
    if (this.rejectRemark && this.rejectRemark.length > 100) {
      this.rejectRemark = this.rejectRemark.substring(0, 100);
    }
  }

  get remarkWordCount(): number {
    return this.rejectRemark ? this.rejectRemark.length : 0;
  }

  get remarkHasContent(): boolean {
    return this.rejectRemark.trim().length > 0;
  }
  confirmReject(): void {
    this.rejectSubmitClicked = true;

    if (!this.remarkHasContent) {
      return;
    }

    const item = this.rejectTargetItem;
    const payload = {
      mechanicId: item.mechanicID,
      status: 'Rejected',
      remark: this.rejectRemark.trim()
    };

    // API call karega tu
    // this.apis.submitMechanicApproval(payload).subscribe({...})

    this.approvalStatusApis(payload);
    this.closeRejectModal();
    this.loadApprovalList();
  }

  // ── Export to Excel ────────────────────────────────────────────────────────
  exportToExcel(): void {
    let dataToExport: any = [];

    if (this.activeTab === 'list') {
      dataToExport = this.mechanicList.map(item => ({
        "Mechanic Name": item.mechanicName,
        "Contact No.": item.contactNo,
        "Aadhar Card No.": item.aadharNo,
        "Type": item.typeOfMechanic,
        "Education": item.education,
        "Exp. in Dealership": item.experienceInDealership,
        "Prior Exp.": item.priorExperience,
        "Prior Exp. Years": item.priorExperienceYears,
        "Total Experience": item.totalExperience,
        "Physical Training": item.physicalTraining,
        "Virtual Training": item.virtualTraining,
        "Installation": item.installationAttendance,
        "Hydraulic": item.hydraulicAttendance,
        "Engine": item.engineAttendance,
        "Complete Training": item.completeTraining,
        "System & Process": item.systemProcess,
        "Current Status": item.currentStatus,
        "Approval Status": item.approvalStatus
      }));
    } else if (this.activeTab === 'approval') {
      dataToExport = this.approvalList.map(item => ({
        "Mechanic Name": item.mechanicName,
        "Contact No.": item.contactNo,
        "Type": item.typeOfMechanic,
        "Education": item.education,
        "Total Experience": item.totalExperience,
        "Status": item.approvalStatus,
        "Remark": item.remark || '-',
        "Last Reviewed By": item.lastReviewedBy || '—',
        "Pending On": item.pendingOn || '—'
      }));
    }

    if (!dataToExport || dataToExport.length === 0) {
      alert('No data available to download.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet,
      this.activeTab === 'list' ? 'Mechanic List' : 'Approval List');

    const wbout = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([wbout], {
      type: 'application/octet-stream'
    });

    const fileName = this.activeTab === 'list'
      ? `Mechanic_List_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Mechanic_Approval_${new Date().toISOString().split('T')[0]}.xlsx`;

    saveAs(blob, fileName);
  }


}
