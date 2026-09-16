import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getApisResponse, FollowUpList, LeadCount } from '../../model/apiresponse';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-threedaysodenqu',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './threedaysodenqu.component.html',
  styleUrl: './threedaysodenqu.component.css'
})
export class ThreedaysodenquComponent implements OnInit {
  followupList: FollowUpList[] = [];
  leadCount: LeadCount[] = [];
  apiresponse !: getApisResponse;
  positionId: any;
  userName: any;
  totalCount: any

  paginatedFollowUpList: FollowUpList[] = [];
  totalItems = 0;
  currentPage = 1;
  itemsPerPage = 20;
  constructor(private http: HttpClient, private route: ActivatedRoute, private apis: AuthService,
    private router: Router) { }

  ngOnInit(): void {
    this.positionId = sessionStorage.getItem('possitionId');
    this.userName = sessionStorage.getItem('userName');

    this.getThreeDaysOdEnquiries();
  }

  getThreeDaysOdEnquiries(page: number = 1): void {
    const offset = (page - 1) * this.itemsPerPage;
    const payload = {
      PageSize: Number(this.itemsPerPage),
      RowStart: Number(offset),
      Download: 'No'
    };
    this.apis.getThreeDaysOdEnquiries(payload).subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res) && res.length > 0) {
          this.paginatedFollowUpList = res as FollowUpList[];
          this.totalItems = res[0].TotalCounts ?? 0;
        } else {
          this.paginatedFollowUpList = [];
          this.totalItems = 0;
        }
        this.currentPage = page;
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while fetching data. Please try again.');
      }
    });
  }

  onRowClick(id: number) {
    
    this.router.navigate(['main/perenquiryfollowdetails', id]);
  }

  exportToExcel() {

  }

  onPageChange(page: number) {
    this.getThreeDaysOdEnquiries(page);
  }
}

