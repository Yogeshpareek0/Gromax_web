import { Component } from '@angular/core';
import { BillingReqData } from '../../model/apiresponse';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-billingrequest',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './billingrequest.component.html',
  styleUrl: './billingrequest.component.css'
})
export class BillingrequestComponent {
  dealerCode: string = '';
  previousFY: string = '';
  currentMonth: string = '';
  previousMonth: string = '';
  currentFY: string = '';

  billingReqData: BillingReqData = {
    Dealer: '',
    DealerCode: '',
    DateOfAppointment: null,

    Tenure: 0,

    opOSasOn1stJul23: 0,
    opOSasOn1stApr24: 0,
    opOSCurrentMonth: 0,

    BillingTillDate: 0,
    CollTillDate: 0,

    OSasOnDate: 0,

    _0To30os: 0,
    _31To60os: 0,
    _61To90os: 0,
    _91To120os: 0,
    _121To150os: 0,
    _151To180os: 0,

    Above180os: 0,

    PDD: 0,
    PDD_YTD: 0,
    PDD_CLosingLastYear: 0,

    OPStock: 0,
    OPAdvance: 0,

    OPStockMoreThan60: 0,
    OPAdvanceMoreThan60: 0,

    BG: 0,

    OP_Pfs1stApr24: 0,
    OP_Pfs1stApr26: 0,

    PendingCNHold: 0,
    _YBillingCount: 0,
    _YBillingInv: 0,
    _YSalesCount: 0,
    _QBillingCount: 0,
    _QBillingInv: 0,
    _QSalesCount: 0,
    YearlyBDCHeader: '',
    QuartlyBDCHeader: '',
    opOSasOn1stApr25: 0,
    opOSasOn1stApr26: 0,
    OP_PfsCurrentMonth: 0,
    YCollection: 0,
    QCollection: 0,
    BGCurrentMonth: 0,

  };
  // Manual Fields
  reqBilling: number = 0;
  todayCollection: number = 0;
  furtherCollection: number = 0;
  newBG: number = 0;
  furtherBilling: number = 0;

  // Formula Fields
  osAfterBilling: number = 0;
  closingOS: number = 0;
  unsecuredOS: number = 0;
  finalClosingOS: number = 0;
  furtherCollectionPlan: number = 0;

  closingNetSecurity: number = 0;
  closingUnseOs: number = 0;
  PfsImprovPlan: number = 0;
  constructor(private apis: AuthService) { }

  ngOnInit(): void {
    this.getFinancialYears();
  }
  getbillingreqdata() {

    if (!this.dealerCode) {
      this.resetBillingData();
      this.apis.showAlert(
        'warning',
        'Warning!',
        'Please enter the dealer code before proceeding.'
      );
      return;
    }
    if (this.dealerCode === this.billingReqData.DealerCode) {
      return;
    }
    const request = {
      dealerCode: this.dealerCode
    };

    this.apis.getbillingReqData(request).subscribe({

      next: (response: any) => {

       

        if (response?.message &&
          response.data.length > 0 &&
          response.message.toLowerCase() === 'success') {

          this.billingReqData = response.data[0];
          this.calculateAll();
          

        } else {
          this.resetBillingData();
          this.apis.showAlert(
            'error',
            'Error!',
            'Failed fetching billing request data.'
          );
        }
      },

      error: (err) => {
        this.apis.showAlert(
          'error',
          'Error!',
          'An error occurred while fetching billing request data.'
        );
      }
    });
  }

  calculateOSAsOnDate(): void {

    const openingOS =
      Number(this.billingReqData.opOSCurrentMonth || 0);

    const billingTillDate =
      Number(this.billingReqData.BillingTillDate || 0);

    const collectionTillDate =
      Number(this.billingReqData.CollTillDate || 0);

    // OP OS + Billing - Collection

    this.billingReqData.OSasOnDate = Number(
      (openingOS + billingTillDate - collectionTillDate).toFixed(2)
    );
  }

  calculateOSAfterBilling(): void {

    const osAsOnDate =
      Number(this.billingReqData.OSasOnDate || 0);

    const reqBilling =
      Number(this.reqBilling || 0);

    const collToday =
      Number(this.todayCollection || 0);

    // OS As On Date + Req Billing - Coll Today

    this.osAfterBilling = Number(
      (osAsOnDate + reqBilling - collToday).toFixed(2)
    );
  }

  calculateClosingOS(): void {

    const osAfterBilling =
      Number(this.osAfterBilling || 0);

    const furtherCollection =
      Number(this.furtherCollectionPlan || 0);


    // OS After Billing - Further Collection

    this.closingOS = Number(
      (osAfterBilling - furtherCollection).toFixed(2)
    );
  }

  calculateUnsecuredOS(): void {

    const closingOS =
      Number(this.closingOS || 0);

    const bg =
      Number(this.billingReqData.BG || 0);
    const PendingCN = Number(this.billingReqData.PendingCNHold || 0);


    // Closing OS - BG

    this.unsecuredOS = Number(
      (closingOS - bg - PendingCN).toFixed(2)
    );
  }

  calculateFinalClosingOS(): void {

    const closingOS =
      Number(this.closingOS || 0);

    const furtherBilling =
      Number(this.furtherBilling || 0);

    //const furtherCollectionPlan =
    //  Number(this.furtherCollectionPlan || 0);

    // Closing OS + Further Billing - Further Collection Plan

    this.finalClosingOS = Number(
      (closingOS + furtherBilling).toFixed(2)
    );
  }

  calculateClosingNetSecurity(): void {
    const d = this.billingReqData;
    const openingPFS = Number(d.OP_PfsCurrentMonth || 0);

    const PendingCN = Number(d.PendingCNHold || 0);

    //const finalClosingOS =
    //  Number(this.finalClosingOS || 0);

    const bg =
      Number(this.billingReqData.BG || 0);

    // Final CL OS - BG Value

    this.closingNetSecurity = Number(
      (openingPFS + bg + PendingCN + this.newBG).toFixed(2)
    );
  }

  calculateClosingUnseOs(): void {
    const d = this.billingReqData;
    const PendingCN = Number(d.PendingCNHold || 0);

    const finalClosingOS =
      Number(this.finalClosingOS || 0);

    const bg =
      Number(this.billingReqData.BG || 0);

    // Final CL OS - BG Value

    this.closingUnseOs = Number(
      (finalClosingOS - bg - PendingCN - this.newBG).toFixed(2)
    );
  }


  calculateAll(): void {

    this.calculateOSAsOnDate();

    this.calculateOSAfterBilling();

    this.calculateClosingOS();

    this.calculateUnsecuredOS();

    this.calculateFinalClosingOS();
    this.calculateClosingNetSecurity();
    this.calculateClosingUnseOs();
  }

  async downloadExcel(): Promise<void> {


    const d = this.billingReqData;
    if (!d.DealerCode) {

      this.apis.showAlert(
        'warning',
        'Warning!',
        'Please enter the dealer code before proceeding.'
      );
      return;
    }
    const wb = new ExcelJS.Workbook();
    wb.creator = 'DEP System';
    wb.created = new Date();

    const ws = wb.addWorksheet('Dealer Report', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    });

    // ── Column widths ──────────────────────────────────────
    ws.columns = [
      { key: 'A', width: 2 },   // A - indent spacer
      { key: 'B', width: 36 },   // B - label
      { key: 'C', width: 18 },   // C - value
      { key: 'D', width: 14 },   // D - extra
    ];

    // ── Style helpers ──────────────────────────────────────
    const COLORS = {
      darkBlue: '1F3864',
      medBlue: '2E75B6',
      lightBlue: 'BDD7EE',
      veryLtBlue: 'DEEAF1',
      teal: '1F6B75',
      ltTeal: 'C6EFEF',
      orange: 'C55A11',
      ltOrange: 'FCE4D6',
      green: '375623',
      ltGreen: 'E2EFDA',
      red: '9C0006',
      ltRed: 'FFC7CE',
      yellow: 'FFF2CC',
      white: 'FFFFFF',
      lightGray: 'F2F2F2',
      midGray: 'D9D9D9',
      darkGray: '595959',
    };

    const border = (style: any = 'thin', color = '595959') => ({
      top: { style, color: { argb: color } },
      left: { style, color: { argb: color } },
      bottom: { style, color: { argb: color } },
      right: { style, color: { argb: color } },
    });

    const thinBorder = border('thin');
    const medBorder = border('medium', '1F3864');

    const font = (bold = false, size = 10, color = '000000', name = 'Calibri') =>
      ({ name, size, bold, color: { argb: color } });

    const fill = (argb: string): ExcelJS.Fill =>
      ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

    const centerAlign: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };
    const leftAlign: Partial<ExcelJS.Alignment> = { horizontal: 'left', vertical: 'middle', wrapText: true };
    const rightAlign: Partial<ExcelJS.Alignment> = { horizontal: 'right', vertical: 'middle' };

    // Helper: style a single cell
    const styleCell = (
      cell: ExcelJS.Cell,
      opts: {
        value?: any;
        bold?: boolean;
        size?: number;
        fontColor?: string;
        bg?: string;
        align?: Partial<ExcelJS.Alignment>;
        borders?: any;
        numFmt?: string;
      }
    ) => {
      if (opts.value !== undefined) cell.value = opts.value;
      cell.font = font(opts.bold ?? false, opts.size ?? 10, opts.fontColor ?? '000000');
      if (opts.bg) cell.fill = fill(opts.bg);
      if (opts.align) cell.alignment = opts.align;
      if (opts.borders) cell.border = opts.borders;
      if (opts.numFmt) cell.numFmt = opts.numFmt;
    };

    // Helper: add a section header row (merged B:C)
    const addSectionHeader = (label: string, bgColor: string, fontColor = 'FFFFFF') => {
      const row = ws.addRow(['', label, '', '']);
      row.height = 22;
      ws.mergeCells(`B${row.number}:D${row.number}`);
      styleCell(row.getCell(2), {
        bold: true, size: 10, fontColor, bg: bgColor,
        align: centerAlign, borders: medBorder,
      });
      return row;
    };

    // Helper: add a label-value data row
    const addDataRow = (
      label: string, value: any,
      labelBg = COLORS.veryLtBlue, valueBg = COLORS.white,
      highlight = false
    ) => {
      const row = ws.addRow(['', label, value, '']);
      row.height = 18;
      styleCell(row.getCell(2), {
        bold: highlight, size: 10, fontColor: highlight ? COLORS.darkBlue : '000000',
        bg: labelBg, align: leftAlign, borders: thinBorder,
      });
      styleCell(row.getCell(3), {
        bold: highlight, size: 10,
        fontColor: typeof value === 'number' && value < 0 ? COLORS.red : (highlight ? COLORS.darkBlue : '333333'),
        bg: highlight ? COLORS.lightBlue : valueBg,
        align: rightAlign, borders: thinBorder,
        numFmt: typeof value === 'number' ? '#,##0.00' : '@',
      });
      ws.mergeCells(`C${row.number}:D${row.number}`);
      return row;
    };

    const addBlankRow = () => {
      const row = ws.addRow(['', '', '', '']);
      row.height = 6;
    };

    // ══════════════════════════════════════════════════════
    // ROW 1 — Main Title Banner
    // ══════════════════════════════════════════════════════
    ws.addRow(['']);
    const titleRow = ws.addRow(['', `Billing Request`, '', `Date: ${new Date().toLocaleDateString('en-GB')}`]);
    titleRow.height = 28;
    ws.mergeCells(`B${titleRow.number}:C${titleRow.number}`);
    styleCell(titleRow.getCell(2), {
      bold: true, size: 12, fontColor: COLORS.white, bg: COLORS.darkBlue,
      align: centerAlign, borders: medBorder,
    });
    styleCell(titleRow.getCell(4), {
      bold: true, size: 10, fontColor: COLORS.white, bg: COLORS.darkBlue,
      align: centerAlign, borders: medBorder,
    });

    // ROW — Dealer Name Banner
    const nameRow = ws.addRow(['', `${d.Dealer}`]);
    nameRow.height = 22;
    ws.mergeCells(`B${nameRow.number}:D${nameRow.number}`);
    styleCell(nameRow.getCell(2), {
      bold: true, size: 10, fontColor: COLORS.white, bg: COLORS.medBlue,
      align: centerAlign, borders: medBorder,
    });
    styleCell(nameRow.getCell(4), {
      bold: true, size: 10, fontColor: COLORS.white, bg: COLORS.medBlue,
      align: centerAlign, borders: medBorder,
    });

    // ROW — Report Month Banner
    //const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    this.getFinancialYears();
    const monthRow = ws.addRow(['', `Report Month: ${this.currentMonth}`, '', '']);
    monthRow.height = 18;
    ws.mergeCells(`B${monthRow.number}:D${monthRow.number}`);
    styleCell(monthRow.getCell(2), {
      bold: false, size: 10, fontColor: COLORS.darkBlue, bg: COLORS.lightBlue,
      align: centerAlign, borders: thinBorder,
    });

    addBlankRow();

    // ══════════════════════════════════════════════════════
    // SECTION 1 — Dealer Info
    // ══════════════════════════════════════════════════════
    addSectionHeader('DEALER INFORMATION', COLORS.darkBlue);
    addDataRow('D. Code', d.DealerCode ? d.DealerCode : 'N/A', COLORS.veryLtBlue);
    addDataRow('D.O.A.', d.DateOfAppointment
      ? new Date(d.DateOfAppointment).toLocaleDateString('en-GB')
      : 'N/A', COLORS.veryLtBlue);
    addDataRow('Tenure (Yr)', d.Tenure, COLORS.veryLtBlue);

    addBlankRow();

    // ══════════════════════════════════════════════════════
    // SECTION 2 — Outstanding Summary
    // ══════════════════════════════════════════════════════
    addSectionHeader('OUTSTANDING SUMMARY (L)', COLORS.teal);
    addDataRow('OP Os (L) — 1st Jul 23', d.opOSasOn1stJul23, COLORS.ltTeal);
    addDataRow('OP Os (L) — 1st Apr 24', d.opOSasOn1stApr24, COLORS.ltTeal);
    addDataRow('OP Os (L) — 1st Apr 25', d.opOSasOn1stApr25, COLORS.ltTeal);
    addDataRow('OP Os (L) — 1st Apr 26', d.opOSasOn1stApr26, COLORS.ltTeal);


    addDataRow('OP Os (L)', d.opOSCurrentMonth, COLORS.ltTeal, COLORS.lightBlue, true);
    addDataRow('Billing Till Date (L)', d.BillingTillDate, COLORS.ltTeal);
    addDataRow('Coll Till Date (L)', d.CollTillDate, COLORS.ltTeal);

    // Highlight row
    const osRow = ws.addRow(['', 'Os as on Date (L)', d.OSasOnDate, '']);
    osRow.height = 20;
    ws.mergeCells(`C${osRow.number}:D${osRow.number}`);
    styleCell(osRow.getCell(2), { bold: true, size: 10, fontColor: COLORS.white, bg: COLORS.teal, align: leftAlign, borders: medBorder });
    styleCell(osRow.getCell(3), { bold: true, size: 10, fontColor: COLORS.white, bg: COLORS.teal, align: rightAlign, borders: medBorder, numFmt: '#,##0.00' });

    addBlankRow();

    // ══════════════════════════════════════════════════════
    // SECTION 3 — Overdue Ageing
    // ══════════════════════════════════════════════════════
    addSectionHeader('OVERDUE AGEING (L)', COLORS.orange);
    addDataRow('OP  0 Days  To 30 D (L)', d._0To30os, COLORS.ltOrange);
    addDataRow('OP  31 Days  To 60 D (L)', d._31To60os, COLORS.ltOrange);
    addDataRow('OP 61 To 90 Days (L)', d._61To90os, COLORS.ltOrange);
    addDataRow('OP 91 To 120 Days (L)', d._91To120os, COLORS.ltOrange);
    addDataRow('OP  121 To 150 Days (L)', d._121To150os, COLORS.ltOrange);
    addDataRow('OP  151 To 180 Days (L)', d._151To180os, COLORS.ltOrange);
    addDataRow('OP  Above 180 (L)', d.Above180os, COLORS.ltOrange);

    addBlankRow();

    // ══════════════════════════════════════════════════════
    // SECTION 4 — PDD & Billing Plan
    // ══════════════════════════════════════════════════════
    addSectionHeader('PDD & BILLING PLAN', COLORS.medBlue);
    addDataRow(`PDD - likely ${this.currentMonth}`, d.PDD, COLORS.veryLtBlue);
    addDataRow(`PDD YTD ${this.previousMonth} - ${this.currentFY}`, d.PDD_YTD, COLORS.veryLtBlue);
    addDataRow(`PDD - ${this.previousFY}`, d.PDD_CLosingLastYear, COLORS.veryLtBlue);
    addDataRow('Req. Billing (Val)', this.reqBilling, COLORS.veryLtBlue, COLORS.yellow, true);
    addDataRow('Coll Today (L)', this.todayCollection, COLORS.veryLtBlue);
    addDataRow('After Billing Os will Be (L)', this.osAfterBilling, COLORS.lightBlue, COLORS.lightBlue, true);

    addBlankRow();

    // ══════════════════════════════════════════════════════
    // SECTION 5 — Stock & Advance
    // ══════════════════════════════════════════════════════
    addSectionHeader('STOCK & ADVANCE (Tr)', COLORS.darkGray);
    addDataRow('OP Stock (Tr)', d.OPStock, COLORS.lightGray);
    addDataRow('OP Adv (Tr)', d.OPAdvance, COLORS.lightGray);
    addDataRow('OP Stock - > 60 Days', d.OPStockMoreThan60, COLORS.lightGray);
    addDataRow('OP Adv - > 60 Days', d.OPAdvanceMoreThan60, COLORS.lightGray);

    addBlankRow();

    // ══════════════════════════════════════════════════════
    // SECTION 6 — Collection & Closing
    // ══════════════════════════════════════════════════════
    addSectionHeader('COLLECTION & CLOSING PLAN (L)', COLORS.green);
    //addDataRow('Further Coll (L)', this.furtherCollection, COLORS.ltGreen);
    addDataRow('CL Os Will Be (L)', this.closingOS, COLORS.ltGreen, COLORS.lightBlue, true);
    addDataRow('BG', d.BG, COLORS.ltGreen);
    addDataRow('Un Sec OS', this.unsecuredOS, COLORS.ltGreen, this.unsecuredOS < 0 ? COLORS.ltGreen : COLORS.ltRed, true);
    addDataRow("OP PFS - 1st-Apr-24", d.OP_Pfs1stApr24, COLORS.ltGreen);
    addDataRow("OP PFS - 1st-Apr'26", d.OP_Pfs1stApr26, COLORS.ltGreen, COLORS.ltGreen, true);
    addDataRow("OP PFS - Current Month", d.OP_PfsCurrentMonth, COLORS.ltGreen, COLORS.ltGreen, true);
    addDataRow('Pending CN', d.PendingCNHold, COLORS.ltGreen);
    addDataRow('PFS Improvement plan', this.PfsImprovPlan, COLORS.ltGreen);
    addDataRow('New Add BG', this.newBG, COLORS.ltGreen);
    addDataRow('Further Billing Value', this.furtherBilling, COLORS.ltGreen);
    addDataRow('Further Coll Plan', this.furtherCollectionPlan, COLORS.ltGreen);

    // Final closing OS — prominent row
    const finalRow = ws.addRow(['', "Final CL Os", this.finalClosingOS, '']);
    finalRow.height = 22;
    ws.mergeCells(`C${finalRow.number}:D${finalRow.number}`);
    styleCell(finalRow.getCell(2), { bold: true, size: 10, fontColor: COLORS.darkBlue, bg: COLORS.ltGreen, align: leftAlign, borders: thinBorder });
    styleCell(finalRow.getCell(3), { bold: true, size: 10, fontColor: COLORS.darkBlue, bg: COLORS.ltGreen, align: rightAlign, borders: thinBorder, numFmt: '#,##0.00' });

    // Closing Net Security — distinct accent row
    const clounsOsRow = ws.addRow(['', 'closing unsecured Os', this.closingUnseOs, '']);
    clounsOsRow.height = 22;
    ws.mergeCells(`C${clounsOsRow.number}:D${clounsOsRow.number}`);
    styleCell(clounsOsRow.getCell(2), { bold: true, size: 10, fontColor: COLORS.darkBlue, bg: COLORS.ltGreen, align: leftAlign, borders: thinBorder });
    styleCell(clounsOsRow.getCell(3), { bold: true, size: 10, fontColor: COLORS.darkBlue, bg: COLORS.ltGreen, align: rightAlign, borders: thinBorder, numFmt: '#,##0.00' });




    const netSecRow = ws.addRow(['', 'Closing Net Security', this.closingNetSecurity, '']);
    netSecRow.height = 22;
    ws.mergeCells(`C${netSecRow.number}:D${netSecRow.number}`);
    styleCell(netSecRow.getCell(2), { bold: true, size: 10, fontColor: COLORS.darkBlue, bg: COLORS.ltGreen, align: leftAlign, borders: thinBorder });
    styleCell(netSecRow.getCell(3), { bold: true, size: 10, fontColor: COLORS.darkBlue, bg: COLORS.ltGreen, align: rightAlign, borders: thinBorder, numFmt: '#,##0.00' });

    addBlankRow();

    // ══════════════════════════════════════════════════════
    // SECTION 7 — Last 3 Month BDC
    // ══════════════════════════════════════════════════════
    addSectionHeader(`LAST 3 MONTHS — ${d.QuartlyBDCHeader}`, COLORS.orange);
    addDataRow('Billing (No.)', d._QBillingCount, COLORS.ltOrange);
    addDataRow('Billing (Val)', d._QBillingInv, COLORS.ltOrange);
    addDataRow('Delivery', d._QSalesCount, COLORS.ltOrange);
    addDataRow('Coll (L)', d.QCollection, COLORS.ltOrange, COLORS.ltGreen, true);

    addBlankRow();

    // ══════════════════════════════════════════════════════
    // SECTION 8 — Last 12 Month BDC
    // ══════════════════════════════════════════════════════
    addSectionHeader(`LAST 12 MONTHS — ${d.YearlyBDCHeader}`, COLORS.teal);
    addDataRow('Billing (No.)', d._YBillingCount, COLORS.ltTeal);
    addDataRow('Billing (Val)', d._YBillingInv, COLORS.ltTeal);
    addDataRow('Delivery', d._YSalesCount, COLORS.ltTeal);
    addDataRow('Coll (L)', d.YCollection, COLORS.ltTeal, COLORS.ltGreen, true);

    addBlankRow();

    // ── Footer ────────────────────────────────────────────
    const footerRow = ws.addRow(['', `Generated on ${new Date().toLocaleDateString('en-IN')}  |  Gromax Portal`, '', '']);
    footerRow.height = 16;
    ws.mergeCells(`B${footerRow.number}:D${footerRow.number}`);
    styleCell(footerRow.getCell(2), {
      bold: false, size: 9, fontColor: COLORS.darkGray, bg: COLORS.lightGray,
      align: centerAlign, borders: thinBorder,
    });

    // ── Download ──────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${d.DealerCode}_DealerReport_${new Date().toLocaleString('default', { month: 'long' })}.xlsx`);
  }


  getFinancialYears() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // Jan = 0, Apr = 3

    // Financial year starts from April
    const currentFYYear = month >= 3 ? year + 1 : year;

    this.currentFY = `F${String(currentFYYear).slice(-2)}`;
    this.previousFY = `F${String(currentFYYear - 1).slice(-2)}`;
    this.currentMonth = new Date().toLocaleString('default', { month: 'long' })
    const previousMonthDate = new Date(today);
    previousMonthDate.setMonth(today.getMonth() - 1);

    this.previousMonth = previousMonthDate.toLocaleString('default', {
      month: 'long'
    });

  }

  resetBillingData(): void {

    this.dealerCode = '';
    this.billingReqData = {
      Dealer: '',
      DealerCode: '',
      DateOfAppointment: null,

      Tenure: 0,

      opOSasOn1stJul23: 0,
      opOSasOn1stApr24: 0,
      opOSCurrentMonth: 0,

      BillingTillDate: 0,
      CollTillDate: 0,
      OSasOnDate: 0,

      _0To30os: 0,
      _31To60os: 0,
      _61To90os: 0,
      _91To120os: 0,
      _121To150os: 0,
      _151To180os: 0,
      Above180os: 0,

      PDD: 0,
      PDD_YTD: 0,
      PDD_CLosingLastYear: 0,

      OPStock: 0,
      OPAdvance: 0,
      OPStockMoreThan60: 0,
      OPAdvanceMoreThan60: 0,

      BG: 0,

      OP_Pfs1stApr24: 0,
      OP_Pfs1stApr26: 0,

      PendingCNHold: 0,

      _YBillingCount: 0,
      _YBillingInv: 0,
      _YSalesCount: 0,

      _QBillingCount: 0,
      _QBillingInv: 0,
      _QSalesCount: 0,

      YearlyBDCHeader: '',
      QuartlyBDCHeader: '',

      opOSasOn1stApr25: 0,
      opOSasOn1stApr26: 0,

      OP_PfsCurrentMonth: 0,

      YCollection: 0,
      QCollection: 0,
      BGCurrentMonth: 0
    };

    // Manual Fields
    this.reqBilling = 0;
    this.todayCollection = 0;
    this.furtherCollection = 0;
    this.newBG = 0;
    this.furtherBilling = 0;

    // Formula Fields
    this.osAfterBilling = 0;
    this.closingOS = 0;
    this.unsecuredOS = 0;
    this.finalClosingOS = 0;
    this.furtherCollectionPlan = 0;

    this.closingNetSecurity = 0;
    this.PfsImprovPlan = 0;
  }

}
