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
  selector: 'app-sevendayenquiry',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './sevendayenquiry.component.html',
  styleUrl: './sevendayenquiry.component.css'
})
export class SevendayenquiryComponent implements OnInit {
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

    this.getSevenDaySalesEnquiryDelivery();
  }

  getSevenDaySalesEnquiryDelivery(page: number = 1): void {
    const offset = (page - 1) * this.itemsPerPage;
    const payload = {
      PageSize: Number(this.itemsPerPage),
      RowStart: Number(offset),
      Download:'No'
    };
    this.apis.getSevenDaySalesEnquiryDelivery(payload).subscribe({
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

  exportToExcel(): void {
    const request = {
      PageSize: 20,
      RowStart: 0,
      Download: 'Yes'
    };

    this.apis.getSevenDaySalesEnquiryDelivery(request).subscribe({
      next: (res: any) => {
        if (!res || !Array.isArray(res) || res.length === 0) {
          this.apis.showAlert('warning', 'No Enquiries Found!', 'No enquiries found for the download.');
          return;
        }

        const maxRows = 1048576;
        let part = 1;

        for (let i = 0; i < res.length; i += maxRows) {
          const chunk = res.slice(i, i + maxRows).map((row: any) => {
            const { Id, TotalCounts, ...rest } = row;
            return rest;
          });

          const headers = Object.keys(chunk[0]);
          const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(chunk, { header: headers });
          const workbook: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'SevenDayDelivery');

          const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: 'application/octet-stream' });

          const fileName = res.length > maxRows
            ? `SevenDayDelivery_Part${part}_${new Date().toISOString().split('T')[0]}.xlsx`
            : `SevenDayDelivery_${new Date().toISOString().split('T')[0]}.xlsx`;

          saveAs(blob, fileName);
          part++;
        }
      },
      error: () => {
        this.apis.showAlert('error', 'Error!', 'An error occurred while downloading.');
      }
    });
  }

  onPageChange(page: number) {
    this.getSevenDaySalesEnquiryDelivery(page);
  }
}
