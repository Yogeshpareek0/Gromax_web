import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../../services/userpermission/permission.service';

declare var bootstrap: any;

@Component({
  selector: 'app-reimbersement-inv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reimbersement-inv.component.html',
  styleUrl: './reimbersement-inv.component.css'
})
export class ReimbersementInvComponent implements OnInit {

  freeServiceList: any[] = [];
  installationList: any[] = [];
  generatedInvoices: any[] = [];

  selectedFreeServiceIds: string[] = [];
  selectedInstallationIds: string[] = [];

  activeTab: string = '';
  isLoadingFS = false;
  isLoadingINST = false;
  isGenerating = false;


  selectedDuration: string = 'This Month';
  customStartDate: string = '';
  customEndDate: string = '';
  positionId: string | null = '';
  userName: string | null = '';

  constructor(private http: HttpClient, private apis: AuthService, public permission: PermissionService) { }

  ngOnInit(): void {

    this.positionId = sessionStorage.getItem('possitionId');
    if (this.positionId === 'Dealer') {
      this.activeTab = 'free-services';
      this.getFreeServiceList();
    }
    else {
      this.activeTab = 'generated';
      this.getGeneratedList();
    }
    //this.userName = sessionStorage.getItem('userName');
    //this.getInstallationList();
  }

  // ============ API Service Functions ============

  getFreeServiceList(): void {
    this.isLoadingFS = true;
    this.apis.getFreeServiceList().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.freeServiceList = res.data || [];
        } else {
          this.freeServiceList = [];
          this.apis.showAlert('error', 'Error', 'Failed to load free service list');
        }
        this.isLoadingFS = false;
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'An error occurred while fetching free services');
        this.isLoadingFS = false;
      }
    });
  }

  getInstallationList(): void {
    this.isLoadingINST = true;
    this.apis.getInstallationList().subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.installationList = res.data || [];
        } else {
          this.installationList = [];
          this.apis.showAlert('error', 'Error', 'Failed to load installation list');
        }
        this.isLoadingINST = false;
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'An error occurred while fetching installations');
        this.isLoadingINST = false;
      }
    });
  }

  generateInvoice(type: string): void {
    const selectedIds = type === 'free-services' ? this.selectedFreeServiceIds : this.selectedInstallationIds;

    if (selectedIds.length === 0) {
      this.apis.showAlert('error', 'Error', 'Please select at least one row');
      return;
    }

    this.isGenerating = true;
    const endpoint = type === 'free-services' ? 'generateServiceInvoice' : 'generateInstallationInvoice';

    this.apis.generateInvoice(endpoint, selectedIds).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && res?.data) {
          const invUrl = res.data;
          this.apis.showAlert('success', 'Success', 'Invoice generated successfully!');
          this.switchTab("generated");
          if (type === 'free-services') {
            this.selectedFreeServiceIds = [];
          } else {
            this.selectedInstallationIds = [];
          }
        } else {
          this.apis.showAlert('error', 'Error', res?.message || 'Failed to generate invoice');
        }
        this.isGenerating = false;
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'An error occurred while generating invoice');
        this.isGenerating = false;
      }
    });
  }

  downloadInvoice(downloadUrl: string): void {
    if (!downloadUrl) {
      this.apis.showAlert('error', 'Error', 'Download URL not available');
      return;
    }

    // Open in new tab or trigger download
    window.open(downloadUrl, '_blank');
  }

  // ============ Selection Logic ============

  isSelected(id: string, type: string): boolean {
    const selectedIds = type === 'free-services' ? this.selectedFreeServiceIds : this.selectedInstallationIds;
    return selectedIds.includes(id);
  }

  onSelectRow(event: any, id: string, type: string): void {
    const selectedIds = type === 'free-services' ? this.selectedFreeServiceIds : this.selectedInstallationIds;

    if (event.target.checked) {
      if (!selectedIds.includes(id)) {
        selectedIds.push(id);
      }
    } else {
      const index = selectedIds.indexOf(id);
      if (index > -1) {
        selectedIds.splice(index, 1);
      }
    }
  }

  isAllSelected(type: string): boolean {
    const list = type === 'free-services' ? this.freeServiceList : this.installationList;
    const selectedIds = type === 'free-services' ? this.selectedFreeServiceIds : this.selectedInstallationIds;

    return list.length > 0 && list.every(item => selectedIds.includes(item.Id));
  }

  onSelectAll(event: any, type: string): void {
    const list = type === 'free-services' ? this.freeServiceList : this.installationList;
    const selectedIds = type === 'free-services' ? this.selectedFreeServiceIds : this.selectedInstallationIds;

    if (event.target.checked) {
      const ids = list.map(item => item.Id);
      if (type === 'free-services') {
        this.selectedFreeServiceIds = [...new Set([...selectedIds, ...ids])];
      } else {
        this.selectedInstallationIds = [...new Set([...selectedIds, ...ids])];
      }
    } else {
      if (type === 'free-services') {
        this.selectedFreeServiceIds = [];
      } else {
        this.selectedInstallationIds = [];
      }
    }
  }

  // ============ Tab Switch ============

  switchTab(tabName: string): void {
    this.activeTab = tabName;
    if (tabName === 'free-services')
      this.getFreeServiceList();
    else if (tabName === 'installations')
      this.getInstallationList();
    else if (tabName === 'generated')
      this.getGeneratedList();


  }

  getGeneratedList() {
    this.isLoadingFS = true;

    let startDate = '';
    let endDate = '';
    let duration = this.selectedDuration;

    // Custom dates select kiye hain to bhej do
    if (this.selectedDuration === 'Custom') {
      startDate = this.customStartDate;
      endDate = this.customEndDate;
    }
    this.apis.getInvoiceList(startDate, endDate, duration).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success') {
          this.generatedInvoices = res.data || [];

        } else {
          this.generatedInvoices = [];
          this.apis.showAlert('error', 'Error', 'Failed to load free service list');
        }
        this.isLoadingFS = false;
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'An error occurred while fetching free services');
        this.isLoadingFS = false;
      }
    });

  };


  getSelectedCount(type: string): number {
    return type === 'free-services' ? this.selectedFreeServiceIds.length : this.selectedInstallationIds.length;
  }

  getGeneratedCount(): number {
    return this.generatedInvoices.length;
  }



  onDurationChange() {
    // Custom dates clear karo jab koi aur duration select kro
    if (this.selectedDuration !== 'Custom') {
      this.customStartDate = '';
      this.customEndDate = '';
    }
  }

  applyFilter() {
    // Validation - Custom ke case mein dates required hain
    if (this.selectedDuration === 'Custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.apis.showAlert('error', 'Error', 'Please select both dates');
        return;
      }

      // Start date aur End date check karo
      const startDate = new Date(this.customStartDate);
      const endDate = new Date(this.customEndDate);

      if (startDate > endDate) {
        this.apis.showAlert('error', 'Error', 'Start date cannot be greater than end date');
        return;
      }
    }

    // Generated Invoices load karo with filter
    this.getGeneratedList();
  }

  clearFilter() {
    this.selectedDuration = 'This Month';
    this.customStartDate = '';
    this.customEndDate = '';
    this.getGeneratedList();
  }

  async updateReimbursementStatus(invoice: string): Promise<void> {

    const result = await this.apis.showConfirm(
      'Are you sure?',
      'Do you want to update the reimbursement payment status?',
      'Yes, Update',
      'Cancel'
    );

    if (!result.isConfirmed) {
      return;
    }
    this.apis.updateReimbursementPaymentStatus(invoice).subscribe({
      next: (res: any) => {
        if (res?.message?.toLowerCase() === 'success' && res?.data) {
          this.apis.showAlert('success', 'Success', 'Reimbursement payment status updated successfully!');
          this.switchTab("generated");

        } else {
          this.apis.showAlert('error', 'Error', res?.message || 'Failed to update reimbursement payment status.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error', 'An error occurred while updating the reimbursement payment status.');
        this.isGenerating = false;
      }
    });

  }


}
