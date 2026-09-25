import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { getApisResponse, EnquiryList, filterApisResponse, PersonModel, Leads, getEnquiryApisResponse } from '../../model/apiresponse';
import Swal from 'sweetalert2';
declare var bootstrap: any;

interface RcStatusItem {
  Id: string;
  ChassisNumber: string;
  Modelcode: string;
  ModelName: string;
  DriveType: string;
  CustomerName: string;
}

@Component({
  selector: 'app-rcstatus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './rcstatus.component.html',
  styleUrl: './rcstatus.component.css'
})
export class RcstatusComponent implements OnInit {
  positionId: any;
  userName: any;
  dealercode: any;
  searchValue: string = '';
  rcStatusList: RcStatusItem[] = [];
  selectedItem: RcStatusItem | null = null;

  // Modal form fields
  registrationNumber: string = '';
  selectedRcStatus: string = '';

  private modal: any;

  searchError: boolean = false;
  rcStatusError: boolean = false;
  registrationError: boolean = false;
  constructor(private http: HttpClient, private apis: AuthService, private fb: FormBuilder, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    this.dealercode = sessionStorage.getItem('dealerCode');
  }

  onShowReport() {
    if (!this.searchValue || !this.searchValue.trim()) {
      this.searchError = true;
      return;
    }

    this.searchError = false;

    const payload = {
      ChassisNo: this.searchValue.trim()
    };

    this.apis.getRcStatusList(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.rcStatusList = res.data;
          this.searchValue = '';
        } else {
          this.apis.showAlert('warning', 'Warning!', res.message || 'No data found');
          this.rcStatusList = [];
        }
      },
      error: (err) => {
        //console.error('Error loading RC status list:', err);
        this.apis.showAlert('error', 'Error!', 'Failed to load data');
        this.rcStatusList = [];
      }
    });
  }

  onRowClick(item: RcStatusItem) {
    this.resetForm();

    setTimeout(() => {
      this.selectedItem = item;

      setTimeout(() => {
        const modalEl = document.getElementById('viewMoreModal');
        if (modalEl) {
          this.modal = new bootstrap.Modal(modalEl, {
            backdrop: 'static',
            keyboard: false
          });
          this.modal.show();
        }
      }, 50);
    }, 0);
  }

  onRcStatusChange() {
    if (this.selectedRcStatus !== 'Done') {
      this.registrationNumber = '';
    }
  }

  onSubmit() {
    if (!this.selectedItem) return;

    this.rcStatusError = false;
    this.registrationError = false;

    if (!this.selectedRcStatus) {
      this.rcStatusError = true;
      return;
    }

    if (this.selectedRcStatus === 'Done' && !this.registrationNumber.trim()) {
      this.registrationError = true;
      return;
    }

    const payload = {
      RcStatus: this.selectedRcStatus,
      Id: this.selectedItem.Id,
      RegistrationNumber: this.selectedRcStatus === 'Done' ? this.registrationNumber.trim() : '000000'
    };

    this.apis.updateRcStatus(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          this.apis.showAlert('success', 'Success!', 'RC Status updated successfully');
          this.closeModal();
          this.onShowReport();
          this.searchValue = '';
        } else {
          this.apis.showAlert('error', 'Error!', res.message || 'Failed to update RC Status');
        }
      },
      error: (err) => {
        //console.error('Error updating RC status:', err);
        this.apis.showAlert('error', 'Error!', 'Failed to update RC Status');
      }
    });
  }

  closeModal() {
    if (this.modal) {
      this.modal.hide();
    }
    this.resetForm();
  }

  private resetForm() {
    this.selectedItem = null;
    this.selectedRcStatus = '';
    this.registrationNumber = '';
  }
}
