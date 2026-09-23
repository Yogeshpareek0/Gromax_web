export interface LoginResponse {
  message: string;
  data: LoginData;
}

export interface getApisResponse {
  message: any;
  data: any;
}

export interface getEnquiryApisResponse {
  message: any;
  data: any;
  leads: any;
  totalCount: any;
}

export interface filterApisResponse {
  message: string;
  data: {
    stateHead: PersonModel[];
    areaManagers: PersonModel[];
    territoryManagers: PersonModel[];
    dealers: PersonModel[];
    location: PersonModel[];
    states: PersonModel[];
  };
}

export interface PersonModel {
  Mail: string;
  Type: string;
  Name: string;
  DealerName: string;
  ActiveSatus: string;
}

//export interface locationlist {
//  Name: string;

//}

export interface LoginData {
  id: string;
  dealerCode: string;
  userName: string;
  possitionId: string;
  mobileNo: string;
  state: string;
  city: string;
  name: string;
  platformType: any;
  activeStatus: string;
  salesPermission: string;
  enquiryGeneration: string;
  salesFollowUp: string;
  installation: string;
  createDate: any;
  modelDevice: any;
  deviceBrand: any;
  deviceId: any;
  stateCode: string;
  token: string;
}

export interface EnquiryList {
  Id: string;
  DealerCode: string;
  AOName: string | null;
  Mobile: string;
  City: string;
  StateHead: string;
  DealerName: string;
  Am: string;
  Tm: string;
  EnquiryNumber: string;
  EnquiryName: string | null;
  EnquiryFor: string | null;
  Remark: string | null;
  CustomerType: string | null;
  ProspectDistrict: string;
  ProspectTehsil: string;
  ProspectVillage: string;
  ProspectPinCode: string;
  ProspectAddress: string | null;
  ProspectName: string;
  ProspectMobile: string;
  ProspectType: string;
  SalesmanNumber: string;
  SalesmanName: string;
  EnquiryDateV1: string;
  EnquiryGeneratedBy: string;
  EnquirySource: string;
  EnquirySubSource: string;
  EnquiryStatus: string;
  EnquiryCurrentStatus: string;
  ReferalCustomerName: string | null;
  ReferalCustomerNumber: string | null;
  ReferalCustomerId: string | null;
  ExpectedPurchaseDate: string | null;
  InterestedModel: string;
  ProductUse: string;
  LandHolding: string;
  ProposedModel: string | null;
  PurchaseType: string | null;
  ExchangeMake: string | null;
  ExchangeModel: string | null;
  ExchangeMfgYear: string | null;
  ExpectedExchangeValue: string | null;
  OfferedExchangeValue: string | null;
  FinalExchangeValue: string | null;
  FinalQuotation: string | null;
  PaymentType: string | null;
  DPAmount: string | null;
  LoanAmount: string | null;
  FinancerName: string | null;
  FinanceStatus: string | null;
  NextFollowupDatev1: string | null;
  FollowUpStatus: string | null;
  Username: string | null;
  VarientOrBOMCode: string;
  ExpectedDeliveryDate: string | null;
  ActionPlanned: string;
  CalledStatus: string;
  LastCallTime: string | null;
  FatherName: string;
  CreatedDate: string;
  bookingDate: string;
  bookingAmount: string;
  HPCategory: string;
  DriveType: string;
  SubSubSource: string;
  customAction: string;
  StateCode: string | null;
  DistrictCode: string | null;
  TehsilCode: string | null;
  VillageCode: string | null;
  closureReason: string | null;
  subClosureReason: string | null;
  ChassisNumber: string;
  StateName: string;
  Surname: string;
  DateOfSale: string;
  CustomerAskExchTracAmt: string;
  MktExchTracAmt: string;
  Deal_ExchTracAmt: string;
  FinalSellingPrice: string;
  dueAmount: string;
  LoanType: string;
  saleLostReason: string;
  closedDroppedStatus: string;
  RetailedDate: string;
  RetailStatus: string;
}

export interface Leads {
  TotalLeads: any,
  TotalHot: any,
  TotalWarm: any,
  TotalCold: any,
  TotalCounts: any,
  OpeningCount: any,
  TotalCountsss: any,
}

export interface leadApiResponse {
  message: string;
  data: LeadStats;
}

export interface LeadStats {
  TotalLeads: number;
  OverDueTarget: number;
  TodayLeads: number;
  HotLeads: number;
  WarmLeads: number;
  ColdLeads: number;
  Remaining: number;
  Achieve: number;
  Target: number;
}

export interface BusinessPerformanceResponse {
  message: string;
  data: BusinessPerformanceData;
}

export interface BusinessPerformanceData {
  getBoxes: EnquiryBox[];
  getList: EnquiryItem[];
}

export interface EnquiryBox {
  EnquiryBaseTillThisPeriod: number;
  EnquiryGeneratedInThisPeriod: number;
  TotalOpenEnquiry: number;
  CurrentOpenEnquiry: number;
  TotalHotEnquiry: number;
  TotalWarmEnquiry: number;
  TotalColdEnquiry: number;
  TotalClosedEnquiry: number;
  TotalBookingEnquiry: number;
  Cancelled: number;
  CompetitionLost: number;
  Delivered: number;
  TotalCounts: any;
  NetDelivery: number;
}

export interface EnquiryItem {
  StateHead: string;
  DealerCode: string;
  DealerName: string;
  Remark: string;
  DeliveryDate: string;
  ConvertedDate: string;
  ChassisNumber: string;
  City: string;
  Am: string;
  Tm: string;
  EnquiryNumber: string;
  EnquiryName: string;
  EnquiryFor: string;
  CustomerType: string;
  ProspectDistrict: string;
  ProspectTehsil: string;
  ProspectVillage: string;
  ProspectPinCode: string;
  ProspectAddress: string;
  ProspectName: string;
  ProspectMobile: string;
  ProspectType: string;
  SalesmanNumber: string;
  SalesmanName: string;
  EnquiryDateV1: string;
  EnquiryGeneratedBy: string;
  EnquirySource: string;
  EnquirySubSource: string;
  EnquiryStatus: string;
  EnquiryCurrentStatus: string;
  ReferalCustomerName: string;
  ReferalCustomerNumber: string;
  ReferalCustomerId: string;
  ExpectedPurchaseDate: string;
  InterestedModel: string;
  ProductUse: string;
  LandHolding: string;
  ProposedModel: string;
  PurchaseType: string;
  ExchangeMake: string;
  ExchangeModel: string;
  ExchangeMfgYear: string;
  CustomerAskExchTracAmt: string;
  MktExchTracAmt: string;
  Deal_ExchTracAmt: string;
  FinalSellingPrice: string;
  dueAmount: string;
  LoanType: string;
  PaymentType: string;
  AdditionalAmount: string;
  DPAmount: string;
  LoanAmount: string;
  DisburseAmount: string;
  FinancerName: string;
  FinanceStatus: string;
  NextFollowupDatev1: string;
  NextFollowUpDate: string;
  saleLostReason: string;
  closedDroppedStatus: string;
  FollowUpStatus: string;
  Username: string;
  VarientOrBOMCode: string;
  ExpectedDeliveryDate: string;
  ActionPlanned: string;
  CalledStatus: string;
  LastCallTime: string;
  FatherName: string;
  bookingDate: string;
  bookingAmount: string;
  HPCategory: string;
  DriveType: string;
  SubSubSource: string;
  customAction: string;
  StateCode: string;
  DistrictCode: string;
  TehsilCode: string;
  VillageCode: string;
  closureReason: string;
  subClosureReason: string;
  followenquiryStatus: string;
  Surname: string;
  FollowUpDate: string;
  DateOfSale: string;
  FollowUpRemark: string;
  create_date: string;
  RetailStatus: string;
  RetailedDate: string;
  StateName: string;
  ReturnStatus: string;
}

export interface InventoryDataResponse {
  message: any;
  data: InventoryData[];
  totalCount: any
}

export interface InventoryData {
  Id: string;
  StateHead: string;
  DealerName: string;
  Am: string;
  Tm: string;
  DealerCode: string;
  DealershipName: string;
  Location: string;
  BillingDate: string;
  TractorSrNumber: string;
  Model: string;
  DriveType: string;
  Colour: string;
  ProductDetails: string;
  StockAging: string;
  TransferBy: string;
  Status: string;
  EntryTime: string;
  CustomerId: string;
  SaleDate: string;
  SoldBy: string;
  chasisno: string;
  DlrCat: string;
}

export interface FollowUpList {
  Id: any;
  StateHead: string;
  DealerName: string;
  Am: string;
  Tm: string;
  DealerLocation: string;
  DealerCode: any;

  InterestedModel: any;

  NextFollowUpDate: any;
  VarientOrBOMCode: any;
  ProspectMobile: any;
  EnquirySource: any;
  EnquiryStatus: any;
  ProspectName: any;
  state: any;
  followenquiryStatus: string;
  enquiryDate: any;
  ExpectedDeliveryDate?: string;
  NextFollowupDate?: string;
  TotalCounts?: number;
}


export interface LeadCount {
  TotalLeads: any;
  HotLeads: any;
  WarmLeads: any;
  ColdLeads: any;
  OverDueTarget: any;
  TodayLeads: any;
}
export interface SalesTarget {
  Target: number;
  Achieve: number;
  Remaining: number;
}

// ========== DASHBOARD MODELS ==========
export interface DashboardListItem {
  Id: number;
  Name: string;
  Theme: string;
  CreatedAt?: string;
}

export interface DashboardViewModel {
  dashboardId?: number;
  name: string;
  theme: string;
  sections: DashboardSection[];
  ConfigJson?: string;
  CreatedAt?: Date;
  UpdatedAt?: Date;
}

export interface DashboardSection {
  id: number;
  columnWidth: number;
  title: string;
  files?: string[];
  savedReportId?: number;
  reportConfigJson?: string;
  report?: any[];
}

// ========== API RESPONSE MODELS ==========
export interface ApiDashboardResponse {
  statusCode: number;
  message: string;
  data: {
    dashboardId: number;
    name: string;
    theme: string;
    sections: ApiDashboardSection[];
  };
}

export interface ApiDashboardSection {
  id: number;
  columnWidth: number;
  title: string;
  files?: string[];
  savedReportId: number;
  reportConfigJson: string;
  report: any[];
}

export interface ReportConfig {
  SourceType?: string;
  Parameters?: ReportParameter[];
  ViewConfig: ViewConfiguration;
  BaseTable?: string;
  Tables?: string[];
  Columns?: any[];
  Filters?: any[];
  Joins?: any[];
  GroupBy?: string[];
  OrderBy?: any[];
  Where?: any[];
  Having?: any[];
  StoredProcedureName?: string;
  Distinct?: boolean;
  Top?: number;
}

export interface ReportParameter {
  Name: string;
  DisplayName: string;
  DataType: string;
  DefaultValue?: string;
  IsRequired: boolean;
  DropdownQuery?: string;
}

export interface ViewConfiguration {
  ViewType: 'Table' | 'Summary' | 'Details' | 'Chart';
  ChartType?: 'Bar' | 'Line' | 'Pie' | 'Doughnut' | 'Area';
  Theme?: string;
  PrimaryColor: string;
  SecondaryColor: string;
  BackgroundColor: string;
  TextColor: string;
  XAxisColumn?: string;
  YAxisColumn?: string;
  SummaryBoxes?: SummaryBox[];
  ExportOptions: ExportOptions;
}

export interface SummaryBox {
  Title: string;
  Column: string;
  Aggregate: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  Icon?: string;
  Color?: string;
}

export interface ExportOptions {
  AllowExcelExport: boolean;
  AllowPDFExport: boolean;
  AllowCSVExport: boolean;
  AllowCopyToClipboard: boolean;
  DefaultExportFormat?: string;
  PDFOrientation?: string;
  ExcelSheetName?: string;
  CSVDelimiter?: string;
}

export interface ReportData {
  success: boolean;
  columns: string[];
  rows: any[];
  message?: string;
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface SectionReportInfo {
  name: string;
  config: ReportConfig;
  reportId: number;
  reportData?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
}

export interface DashboardRequest {
  Id: number;
}

export interface ExecuteQueryRequest {
  req: ReportConfig;
  paramValues: any;
}


export interface UploadReport {
  UploadID: number;
  UploadName: string;
  permission: string | null;
  userpermission: string | null;
}

export interface MonthYearRange {
  stDate: string;
  enDate: string;
}

export interface NotRetaildList {
  FinanceMasterId?: string;
  SalesEnquiryID?: string;
  salesId?: string;
  SalesId?: string;
  BackDateDay?: number;
  Mobile?: string;
  DealerCode?: string;
  ChasisNo?: string;
  ModelName?: string;
  Modelcode?: string;
  DriveType?: string;
  DeliveryDate?: string;
  DisburseAmount?: number;
  DpAmount?: number;
  FinalSellingPrice?: number;
  FinanceStatus?: string;
  FinancerName?: string;
  LoanAmount?: number;
  LoanType?: string;
  MktExchTracAmt?: number | null;
  Deal_ExchTracAmt?: number | null;
  CustomerAskExchTracAmt?: number | null;
  PaymentMode?: string;
  ProspectDistrict?: string;
  ProspectVillage?: string;
  EnquirySource?: string;
  EnquirySubSource?: string;
  SalesmanName?: string;
  SalesmanNumber?: string;
  ExchangeMake?: string;
  ExchangeMfgYear?: string;
  State?: string;
  City?: string;
  CustomerName?: string;
  ProspectType?: string;
  ProspectTehsil?: string;
  ProspectPinCode?: string;
  ExchangeChassisNo?: string;
  ExchangeModel?: string;
  ExchangeHpCategory?: string;
  InterestedHPCategory?: string;
  ConversionChallenge?: string;
  ActionPlanned?: string;
  OtherActionRemark?: string;
  NextFollowupDate?: string;
  EnquiryType?: string;
  EnquiryCurrentStatus?: string;
  EnquiryStatus?: string;
  exchangeStockEntry: string;
  exchangeStockEntryValue: string;
  dueAmount?: number;
  AgeingofAdvance?: number;
  MktOsleft?: number;
  FinanceSubStatus?: string;
  Remarks?: string;
  IsRetailedSales?: string;
  retailedDate?: string;
  exchStSold?: string;
  additionalcash?: number | null;
  bookingAmount?: number | null;
  DlrCat?: string;
  DealerName?: string;
  DlrLoc?: string;
  LastUpdt?: Date;
  SHName?: Date;
  AmName?: Date;
  TmName?: Date;
  expectedRetailDate?: Date;
}

export interface RetailForm {
  PaymentMode: string;
  DpAmount: number;
  LoanAmount: number;
  FinancerName: string;
  DisburseAmount: number;
  LoanType: string;
  RetailedDate: string;
  FinalSellingPrice: number;
  ProspectType: string;
  ExchangeChassisNo: string;
  ExchangeMake: string;
  ExchangeModel: string;
  ExchangeHpCategory: string;
  ExchangeMfgYear: string;
  MktExchTracAmt: number | null;
  DealExchTracAmt: number | null;
  FinanceStatus: string;
  FinanceSubStatus: string;
  Remarks: string;
  exchangeStockEntry: string;
  exchangeStockEntryValue: string;
  AgeingofAdvance: number;
  MktOsleft: number;
  AdditionalPayment: number | null;
  CustomerAskExchTracAmt: number | null;
  bookingAmount: number | null;
  expectedRetailDate: Date | null;
  //excFile?: File | null;
}

export interface FormErrors {
  [key: string]: string;
}

export interface Metric {
  key: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  keyActiveValue: number;
  keyInActiveValue: number;
}

export interface ExchangeStock {
  SalesId: string;
  Mobile: string;
  DealerCode: string;
  ExchangeMake: string;
  ExchangeMfgYear: string;
  ExchangeModel: string;
  MktExchValue: number;
  DealPrice: number;
  CustomerAskExchValue: number;
  ExchangeHPCategory: string;
  exchangeStockEntry: string;
  exchangeStockEntryValue: string;
  TotalCount: number;

  Village: string;
  Tehsil: string;
  SellingPrice: string;
  LiquidationDate: string;
  District: string;
  CustomerMobile: string;
  CustomerName: string;
  ChassisNumber: string;
  Modelcode: string;
  Model: string;
  DeliveryDate: string;
  SHName: string;
  AmName: string;
  TmName: string;
  DlrLoc: string;
  DlrCat: string;
  ExcBuyerMob: string;
  ExcBuyerName: string;
  DealerName: string;
  excFile: string;
}

export interface DeliveryEnquiryList {
  SalesId?: string;
  DealerCode?: string;
  CustomerName?: string;
  Mobile?: string;
  ProspectDistName?: string;
  State?: string;
  ProspectTehName?: string;
  DeliveryDate?: string;
  PaymentMode?: string;
  FinalSellingPrice?: number | null;
  DpAmount?: number | null;
  FinancerName?: string | null;
  ChassisNumber?: string;
  ProsVillageName?: string;
  TotalCount?: number;
  DlrCat?: string;
  DlrLoc?: string;
  DealerName?: string;
  AmName?: string;
  TmName?: string;
  SHName?: string;

}

export interface BDRCRow {
  RowId?: number;
  BatchId?: number;
  StateName: string;
  DealerName: string;
  DlrLoc: string;
  DealerCode: string;
  Remark: string;
  Status: string;
  IsCommited?: number;
  lastReviewBy?: string;
  BillPlan_W1: number; BillPlan_W2: number; BillPlan_W3: number;
  BillPlan_W4: number; BillPlan_W5: number; BillPlan_TTL?: number;

  DelPlan_W1: number; DelPlan_W2: number; DelPlan_W3: number;
  DelPlan_W4: number; DelPlan_W5: number; DelPlan_TTL?: number;

  RetPlan_W1: number; RetPlan_W2: number; RetPlan_W3: number;
  RetPlan_W4: number; RetPlan_W5: number; RetPlan_TTL?: number;

  CollPlan_W1: number; CollPlan_W2: number; CollPlan_W3: number;
  CollPlan_W4: number; CollPlan_W5: number; CollPlan_TTL?: number;

  BGPlan_W1: number; BGPlan_W2: number; BGPlan_W3: number;
  BGPlan_W4: number; BGPlan_W5: number; BGPlan_TTL?: number;

  _editing?: boolean;
  _original?: Partial<BDRCRow>;
  _dirty?: boolean;
}

export interface ForecastRow {
  StateName?: string;
  ModelName?: string;
  ModelCode?: string;
  HP?: string;
  FR?: string;
  RR?: string;
  Status?: string;
  W1_BillingPlan: number;
  W2_BillingPlan: number;
  W3_BillingPlan: number;
  W4_BillingPlan: number;
  W5_BillingPlan: number;
  Total_BillingPlan?: number;
  UploadByPosition?: string;
  UploadName?: string;
  pendingon?: string;
  PendingName?: string;
  IsCommited?: number;
  lastReviewBy?: string;
  Remark?: string;
  BatchId?: any;
  _editing?: boolean;
  _original?: Partial<ForecastRow>;
  _dirty?: boolean;
}

export interface TalukaRow {
  StateName: string;
  DistrictName: string;
  TalukaName: string;
  DealerCode?: string;
  BatchId?: any;
  IsCommited?: number;
  Remark?: string;
  pendingon?: string;
  PendingName?: string;
  UploadByPosition?: string;
  UploadName?: string;
  lastReviewBy?: string;
  [key: string]: any;
  _editing: boolean;
  _dirty: boolean;
  _original?: any;
}

export interface TalukaPivotRow {
  StateName: string;
  DistrictName: string;
  TalukaName: string;
  DealerCode?: string;
  BatchId?: any;
  IsCommited?: number;
  Remark?: string;
  pendingon?: string;
  PendingName?: string;
  UploadByPosition?: string;
  UploadName?: string;
  lastReviewBy?: string;
  monthData: { [monthKey: string]: number | null };
  _editing: boolean;
  _dirty: boolean;
  _original?: any;
}

export interface StockRecord {
  Id: string;
  chasisno: string;
  BillingDealerCode: string;
  currentDealercode: string;
  currenyDealerName: string;
  currentDealerState: string;
  modelcode: string;
  DriveType: string;
  Colour: string;
  model: string;
  HpCategory: string;
  InvoiceNo: string;
  BillDate: string;
  Totalcount: number;
}


export interface exchangeModelMaster {
  Mfg: string,
  Hp: string,
  Model: string
}

export interface SourceSubSource {
  sourceName: string,
  subSourceName: string
}

export interface BillingReqData {

  Dealer: string;
  DealerCode: string;
  DateOfAppointment: Date | null;

  Tenure: number;

  opOSasOn1stJul23: number;
  opOSasOn1stApr24: number;
  opOSCurrentMonth: number;

  BillingTillDate: number;
  CollTillDate: number;

  OSasOnDate: number;

  _0To30os: number;
  _31To60os: number;
  _61To90os: number;
  _91To120os: number;
  _121To150os: number;
  _151To180os: number;

  Above180os: number;

  PDD: number;
  PDD_YTD: number;
  PDD_CLosingLastYear: number;

  OPStock: number;
  OPAdvance: number;

  OPStockMoreThan60: number;
  OPAdvanceMoreThan60: number;

  BG: number;

  OP_Pfs1stApr24: number;
  OP_Pfs1stApr26: number;

  PendingCNHold: number;

  _YBillingCount: number;
  _YBillingInv: number;
  _YSalesCount: number;
  _QBillingCount: number;
  _QBillingInv: number;
  _QSalesCount: number;
  YearlyBDCHeader: string;
  QuartlyBDCHeader: string;
  opOSasOn1stApr25: number;
  opOSasOn1stApr26: number;
  OP_PfsCurrentMonth: number;
  YCollection: number;
  QCollection: number;
  BGCurrentMonth: number;
}

const COLUMN_MAP: Record<number, string> = {
  // Identity
  0: 'state',
  1: 'dealerCode',
  2: 'tmName',
  3: 'dealerName',
  4: 'dealerLocation',
  5: 'status',

  // Common
  6: 'divFactor',

  // May'26 Opening
  7: 'opening_opStkTrs',
  8: 'opening_opnAdvTr',
  9: 'opening_osAmtLakh',
  10: 'opening_bgL',

  // May'26 Plan
  11: 'plan_b',
  12: 'plan_d',
  13: 'plan_r',
  14: 'plan_cL',
  15: 'plan_collTr',

  // May'26 MTD
  16: 'mtd_bgL',
  17: 'mtd_b',
  18: 'mtd_d',
  19: 'mtd_cL',

  // May'26 Outlook
  20: 'outlook_bg',
  21: 'outlook_b',
  22: 'outlook_d',
  23: 'outlook_r',
  24: 'outlook_collL',
  25: 'outlook_collTr',

  // Collection Breakup: Outlook submission day to 28th
  26: 'coll28_bg',
  27: 'coll28_rtgs',
  28: 'coll28_ownFund',
  29: 'coll28_do',
  30: 'coll28_taMfsl',
  31: 'coll28_taHdfc',
  32: 'coll28_taLtf',
  33: 'coll28_taIcici',
  34: 'coll28_total',

  // Collection Breakup: 29th
  35: 'coll29_rtgs',
  36: 'coll29_ownFund',
  37: 'coll29_do',
  38: 'coll29_taMfsl',
  39: 'coll29_taHdfc',
  40: 'coll29_taLtf',
  41: 'coll29_taIcici',
  42: 'coll29_total',

  // Collection Breakup: 30th
  43: 'coll30_rtgs',
  44: 'coll30_ownFund',
  45: 'coll30_do',
  46: 'coll30_taMfsl',
  47: 'coll30_taHdfc',
  48: 'coll30_taLtf',
  49: 'coll30_taIcici',
};

const HEADER_ROWS = 3;           // skip first 3 rows (multi-level headers)
const NUMERIC_START_COL = 6;     // col 6 onwards are numeric → blank fills 0

// ─── Public Types ────────────────────────────────────────────
export interface OutlookRecord {
  state: string | null;
  dealerCode: string | null;
  tmName: string | null;
  dealerName: string | null;
  dealerLocation: string | null;
  status: string | null;
  divFactor: number;
  opening_opStkTrs: number;
  opening_opnAdvTr: number;
  opening_osAmtLakh: number;
  opening_bgL: number;
  plan_b: number;
  plan_d: number;
  plan_r: number;
  plan_cL: number;
  plan_collTr: number;
  mtd_bgL: number;
  mtd_b: number;
  mtd_d: number;
  mtd_cL: number;
  outlook_bg: number;
  outlook_b: number;
  outlook_d: number;
  outlook_r: number;
  outlook_collL: number;
  outlook_collTr: number;
  coll28_bg: number;
  coll28_rtgs: number;
  coll28_ownFund: number;
  coll28_do: number;
  coll28_taMfsl: number;
  coll28_taHdfc: number;
  coll28_taLtf: number;
  coll28_taIcici: number;
  coll28_total: number;
  coll29_rtgs: number;
  coll29_ownFund: number;
  coll29_do: number;
  coll29_taMfsl: number;
  coll29_taHdfc: number;
  coll29_taLtf: number;
  coll29_taIcici: number;
  coll29_total: number;
  coll30_rtgs: number;
  coll30_ownFund: number;
  coll30_do: number;
  coll30_taMfsl: number;
  coll30_taHdfc: number;
  coll30_taLtf: number;
  coll30_taIcici: number;
  [key: string]: any;
}


export interface NtirStockItem {
  Id: number;
  TractorSrNumber: string;
  chasisno: string;
  DriveType?: string;
  Colour?: string;
  DealershipName?: string;
  DealerCode?: string;
  Status?: string; // 'Done' | 'Pending'
  PDISequence?: string;
  PDIDate?: string;
  EngineNo?: string;
  RunningHrs?: string;
  NTIRMasterId?: string;
}

export interface PdiStockItem {
  Id: number;
  TractorSrNumber: string;
  chasisno: string;
  DriveType?: string;
  Colour?: string;
  DealershipName?: string;
  DealerCode?: string;
  Status?: string; // 'Done' | 'Pending'
  PDISequence?: string;
  PDIDate?: string;
  EngineNo?: string;
  RunningHrs?: string;
  PDIMasterId?: string;
  PdiDoneBy: string;
}

export interface SerialBrandField {
  serial: string;
  brand: string;
}

export interface PdiFieldPayload {
  name: string;
  section: string;
  status: string;
  remark: string;
  photo1: string;
  photo2: string;
  serial: string;
  brand: string;
  id?: string | null;
}

export interface PdiSubmitPayload {
  stockMasterId: number | string;
  runningHrs: string;
  doneBy: string;
  engineNo: string;
  ntirMasterId?: string | null;
  other: string;
  fields: PdiFieldPayload[];
}


export interface NtirFieldPayload {
  name: string;
  section: string;
  status: string;
  remark: string;
  photo1: string;
  photo2: string;
  serial: string;
  brand: string;
  id?: string | null;
}

export interface NtirSubmitPayload {
  stockMasterId: number | string;
  runningHrs: string;
  ntirMasterId?: string | null;
  other: string;
  fields: NtirFieldPayload[];
}

export interface PhotoSlot {
  previewUrl?: string;
  serverUrl?: string;
  uploading?: boolean;
  file?: File;
}

export interface PartRow {
  id: string;
  query: string;
  results: any[];
  selected: any | null;
  saved: boolean;
  qty: string;
  /* labour: string;*/
  remark: string;
  errors?: Record<string, string>;
}

export interface LocalPartRow {
  id: string;
  partName: string;
  partNumber: string;
  qty: string;
  price: string;
  gst: string;
  /*labour: string;*/
  remark: string;
  saved: boolean;
  errors?: Record<string, string>;
}

export interface SubletPartRow {
  id: string;
  descriptionSublet: string;
  costSublet: string;
  saved: boolean;
  errors?: Record<string, string>;
}

export interface ComplaintRow {
  id: string;
  complaint: string;
  actionTaken: string;
  remark: string;
}

export interface MissingPartRow {
  id: string;
  value: string;
}

export interface DealerRequestModel {
  dealerCode: string;
  dealerName: string;
  gstNo: string;
  panNo: string;
  dealerMobile: string;
  dealerAlternateMobile: string;
  dealerEmail: string;
  address: string;
  stateCode: string;
  stateName: string;
  districtCode: string;
  district: string;
  city: string;
  tehsilCodes: string[];
  tehsils: string[];
  stateHeadMail: string;
  stateHeadName: string;
  stateHeadMobile: string;
  amMail: string;
  amName: string;
  amMobile: string;
  tmMail: string;
  tmName: string;
  tmMobile: string;
  serviceCcmName: string;
  serviceCcmEmail: string;
  serviceCcmMobile: string;
  dateOfAppointment: string;
  activeStatus: string;
}

export interface PDIReport {
  DealerCode: string;
  DealerName: string;
  StateName: string;
  ModelCode: string;
  ModelName: string;
  engineNo: string;
  runningHours: string;
  Name: string;
  section: string;
  brand: string;
  photo1: string;
  photo2: string;
  remark: string;
  pdiDate: string;
  length: number;
  chasisno: string;


}
export interface PdiCount {
  totalTractorsCount: number;
  pdiPendingCount: number;
  pdiCompletedCount: number;
  defectFoundCount: number;
}

export interface PdiDataResponse {
  countResponse: PdiCount,
  pdiReport: PDIReport[]
}
export interface PDIResponse {
  statusCode: number;
  message: string;
  data: PdiDataResponse;
}

export interface NTIRReport {
  DealerCode: string;
  DealerName: string;
  StateName: string;
  ModelCode: string;
  ModelName: string;
  engineNo: string;
  runningHours: string;
  Name: string;
  section: string;
  brand: string;
  photo1: string;
  photo2: string;
  remark: string;
  ntirDate: string;
  length: number;
  chasisno: string;
}

export interface NtirCount {
  totalTractorsCount: number;
  ntirPendingCount: number;
  ntirCompletedCount: number;
  defectFoundCount: number;
}

export interface NtirDataResponse {
  countResponse: NtirCount,
  ntirReport: NTIRReport[]
}

export interface NTIRResponse {
  statusCode: number;
  message: string;
  data: NtirDataResponse;
}
