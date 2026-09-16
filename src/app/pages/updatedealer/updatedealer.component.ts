// dealer-status.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { filterApisResponse } from '../../model/apiresponse';




@Component({
  selector: 'app-updatedealer',
  imports: [CommonModule, FormsModule],
  templateUrl: './updatedealer.component.html',
  styleUrl: './updatedealer.component.css'
})
export class UpdatedealerComponent {

  constructor(
    private apis: AuthService,
  ) { }
  selectedSH: string = '';
  selectedAM: string = '';
  selectedTM: string = '';
  selectedDealer: string = '';
  selectedDealercode: string = '';
  selectedDealerName: string = '';
  selectedStatus: string = '';

  showSH: boolean = false;
  showAM: boolean = false;
  showTM: boolean = false;
  showDealer: boolean = false;

  stateHead: any[] = [];
  areaManagersList: any[] = [];
  territoryManagersList: any[] = [];
  dealersList: any[] = [];

  apiresponse: any;
  positionId: string | null = '';
  userName: string | null = '';
  dealercode: string | null = '';
  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');
    this.dealercode = sessionStorage.getItem('dealerCode');
    if (this.positionId === 'National Sales Head') {
      this.showSH = true; this.showAM = true; this.showTM = true; this.showDealer = true;
    } else if (this.positionId === 'State Head') {
      this.showAM = true; this.showTM = true; this.showDealer = true;
    } else if (this.positionId === 'Area Manager') {
      this.showTM = true; this.showDealer = true;
    } else if (this.positionId === 'Territory Manager') {
      this.showDealer = true;
    }
    this.getHOFilter();

  }

  getHOFilter(): void {
    const request = { ShMail: '', AmMail: '', TmMail: '', DealerMail: '' };
    this.apis.getHOFilter(request).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.stateHead = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.stateHead || [])];
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [...(this.apiresponse.data.dealers || [])];
        } else {
          this.apis.showAlert('error', 'Error!', 'Failed fetching data. Please try again.');
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.')
    });
  }
  onStateChange(mail: string): void {
    this.selectedAM = ''; this.selectedTM = ''; this.selectedDealer = ''; this.selectedDealerName = '';
    this.apis.getHOFilter({ ShMail: mail, AmMail: '', TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.areaManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.areaManagers || [])];
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [...(this.apiresponse.data.dealers || [])];
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.')
    });
  }
  onAreaChange(mail: string): void {
    this.selectedTM = ''; this.selectedDealer = ''; this.selectedDealerName = '';
    this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: mail, TmMail: '', DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.territoryManagersList = [{ Mail: '', Name: 'All' }, ...(this.apiresponse.data.territoryManagers || [])];
          this.dealersList = [...(this.apiresponse.data.dealers || [])];
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.')
    });
  }
  onTerritoryChange(mail: string): void {
   
    this.selectedDealer = ''; this.selectedDealerName = '';
    this.apis.getHOFilter({ ShMail: this.selectedSH, AmMail: this.selectedAM, TmMail: mail, DealerMail: '' }).subscribe({
      next: (data) => {
        this.apiresponse = data as filterApisResponse;
        if (this.apiresponse.message?.toLowerCase() === 'success') {
          this.dealersList = [...(this.apiresponse.data.dealers || [])];
        }
      },
      error: () => this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data.')
    });
  }

  // Dealer change handler — dealer name auto-fill ke liye
  onDealerChange(mail: string): void {
    
    const found = this.dealersList.find(d => d.Mail === mail);
    this.selectedDealerName = found ? found.DealerName : '';
    this.selectedDealercode = found ? found.Name : '';
    this.selectedStatus = found ? found.ActiveSatus.toUpperCase() : '';
  }
  // ── master data (replace with API call if needed) ─────────────────────────
  onSubmit() {
    
    if (!this.selectedDealer || !this.selectedStatus) {
      return;
    }

    const payload = {
      DealerCode: this.selectedDealercode,
      DealerStatus: this.selectedStatus
    }
    this.apis.updatedealer(payload).subscribe({
      next: (res: any) => {
        if (res.statusCode === 200) {
          this.apis.showAlert('success', 'Success!', 'Enquiry updated successfully.');
          this.selectedDealer = ''; this.selectedStatus = '';
          this.getHOFilter();
        } else {
          this.apis.showAlert('error', 'Error!', res.message || 'Submission failed.');
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while submitting.');
      }
    });

  }

}
