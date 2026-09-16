import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/* ================= INTERFACES ================= */

interface Section {
  id: number;
  columnWidth: number;
  title: string;
  files: string[];
  savedReportId?: number | null;
  reportConfigJson?: string | null;
}

interface SectionReport {
  reportId: number;
  reportName: string;
  config: any;
}

interface DashboardModel {
  name: string;
  theme: string;
  sections: Section[];
}

interface ReportConfig {
  sourceType: 'StoredProcedure' | 'Query';
  storedProcedureName?: string;
  baseTable?: string;
}

/* ================= COMPONENT ================= */

@Component({
  selector: 'app-createreport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './createreport.component.html',
  styleUrls: ['./createreport.component.css']
})
export class CreatereportComponent implements OnInit {

  /* UI helpers */
  grid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  themes = ['Purple', 'Blue', 'Green', 'Dark', 'Light'];

  /* Dashboard */
  dashboardName = '';
  theme = '';

  /* Sections */
  sections: Section[] = [];
  sectionCounter = 0;
  sectionReports: Record<number, SectionReport> = {};

  /* Modal */
  showReportBuilder = false;
  currentSectionId: number | null = null;

  /* Report Builder */
  currentReport: ReportConfig = { sourceType: 'Query' };
  tables: string[] = [];
  procedures: string[] = [];

  /* API */
  private apiBaseUrl = 'https://your-api-url.com/api/Dashboard';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.addSection();
  }

  /* ================= Sections ================= */

  addSection(): void {
    this.sectionCounter++;
    this.sections.push({
      id: this.sectionCounter,
      columnWidth: 12,
      title: '',
      files: []
    });
  }

  removeSection(id: number): void {
    this.sections = this.sections.filter(s => s.id !== id);
    delete this.sectionReports[id];
  }

  /* ================= Modal ================= */

  async openReportBuilder(section: Section): Promise<void> {
    this.currentSectionId = section.id;
    this.currentReport = section.reportConfigJson
      ? JSON.parse(section.reportConfigJson)
      : { sourceType: 'Query' };

    await this.loadReportBuilderData();
    this.showReportBuilder = true;
  }

  closeReportBuilder(): void {
    this.showReportBuilder = false;
    this.currentSectionId = null;
    this.currentReport = { sourceType: 'Query' };
  }

  /* ================= API ================= */

  private async loadReportBuilderData(): Promise<void> {
    const res: any = await firstValueFrom(
      this.http.get(`${this.apiBaseUrl}/GetReportBuilderData`)
    );

    this.tables = res?.tables ?? [];
    this.procedures = res?.storedProcedures ?? [];
  }

  /* ================= Save Section Report ================= */

  async saveSectionReport(): Promise<void> {

    if (!this.currentSectionId) return;

    if (
      this.currentReport.sourceType === 'Query' &&
      !this.currentReport.baseTable
    ) {
      alert('Select base table');
      return;
    }

    if (
      this.currentReport.sourceType === 'StoredProcedure' &&
      !this.currentReport.storedProcedureName
    ) {
      alert('Select stored procedure');
      return;
    }

    const reportName = prompt('Enter report name');
    if (!reportName) return;

    const res: any = await firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/SaveSectionReport`, {
        sectionId: this.currentSectionId,
        reportName,
        reportConfigJson: JSON.stringify(this.currentReport)
      })
    );

    this.sectionReports[this.currentSectionId] = {
      reportId: res.reportId,
      reportName,
      config: this.currentReport
    };

    const section = this.sections.find(s => s.id === this.currentSectionId);
    if (section) {
      section.savedReportId = res.reportId;
      section.reportConfigJson = JSON.stringify(this.currentReport);
      section.title = reportName;
    }

    this.closeReportBuilder();
  }

  /* ================= Save Dashboard ================= */

  async saveDashboard(): Promise<void> {

    if (!this.dashboardName) {
      alert('Dashboard name required');
      return;
    }

    const model: DashboardModel = {
      name: this.dashboardName,
      theme: this.theme,
      sections: this.sections
    };

    await firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/Save`, {
        modelJson: JSON.stringify(model)
      })
    );

    alert('Dashboard saved successfully');
  }
}
