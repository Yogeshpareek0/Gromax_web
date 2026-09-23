import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DealerRequestModel, NtirSubmitPayload, PdiSubmitPayload } from '../model/apiresponse';
import { __param } from 'tslib';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'token';
  private readonly baseUrl = 'https://loadcrm.com/growmaxmobileapi/';
  //private readonly baseUrl = 'https://localhost:44398/';

  constructor(private http: HttpClient, private router: Router) { }

  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  loginapi(mobileno: string, password: string) {
    let options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    };
    let params = new HttpParams({
      fromObject: { MobileNo: mobileno, Password: password, grant_type: 'password' },
    });
    return this.http.post(this.baseUrl + `Webapi/Login/Loginv1`, params, options)
  }

  showAlert(
    icon: 'success' | 'error' | 'warning' | 'info' | 'question',
    title: string,
    text: string,
    confirmButtonText: string = 'OK',
    allowOutsideClick: boolean = false
  ) {
    return Swal.fire({
      icon,
      title,
      text,
      showConfirmButton: true,
      confirmButtonText,
      allowOutsideClick,
      customClass: {
        title: 'swal-title-small',
        htmlContainer: 'swal-text-small'
      }
    });
  }

  showConfirm(
    title: string,
    text: string,
    confirmButtonText: string = 'Confirm',
    cancelButtonText: string = 'Cancel',
    allowOutsideClick: boolean = false
  ) {
    return Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText,
      cancelButtonText,
      allowOutsideClick,
      customClass: {
        title: 'swal-title-small',
        htmlContainer: 'swal-text-small'
      }
    });
  }

  sendotp(message: string, mobile: string) {
    const url = 'https://loadcrm.com/SmsApi/api/OwnApi/SendSms';

    const params = new HttpParams()
      .set('key', 'G5I3U8Y0E4894VUE2S3Q5W===')
      .set('UserName', 'Gromaxagri')
      .set('SenderID', 'GROMAX')
      .set('MessageText', message)
      .set('EntityId', '1701159798537597664')
      .set('TemplateId', '1107175949534072333')
      .set('Unicode', 'false')
      .set('MobileNo', mobile.toString());

    return this.http.get<any>(url, { params });
  }

  getenquiry(value: any) {
    return this.http.post(this.baseUrl + 'Webapi/Home/WebGetSalesEnquiryMasterv1', value);
  }

  getHOFilter(value: any) {
    return this.http.post(this.baseUrl + 'Webapi/Home/PossitionFilter', value);
  }

  logout() {

    sessionStorage.clear();
    localStorage.clear();
    this.clearAllCookies();
    /*window.location.href = window.location.origin;*/

    history.pushState(null, '', location.href);
    window.onpopstate = () => {
      history.go(1);
    };
    this.router.navigate(['']);
  }

  clearAllCookies() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${location.hostname}`;
    }
  }

  getinventory(value: any) {
    return this.http.post(this.baseUrl + 'Webapi/Home/GetInventoryData', value);
  }

  getBusinessPerformance(value: any) {
    return this.http.post(this.baseUrl + 'Webapi/Home/GetBussinessPerformacev1', value);
  }

  getHpCategory(value: any) {
    return this.http.post(this.baseUrl + 'Webapi/Home/GetBussinessPerformace', value);
  }

  getStateList(value: string) {

    const url = this.baseUrl + 'Webapi/Home/GetState';
    const params = new HttpParams().set('dealercode', value);

    // final URL with params
    const fullUrl = url + '?dealercode=' + value;

    // curl generate
    const curl = `curl -X POST "${fullUrl}" \
-H "Content-Type: application/json" \
-d "{}"`;

    //console.log("Generated cURL:");
    //console.log(curl);

    // actual API call
    return this.http.post(url, {}, { params: params });
  }


  getDistrictList(type: string, name: string, code: string) {
    let params = new HttpParams().set('Type', type)
      .set('Name', name)
      .set('code', code);
    return this.http.post(this.baseUrl + 'Webapi/Home/GetCustomerAddressFilter', {}, { params: params });
  }

  insertGenerateEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/GenerateEnquiryv2', value);
  }
  insertGenerateEnquiryv1(data: FormData) {
    return this.http.post(this.baseUrl + 'api/Home/GenerateEnquiryv3', data);
  }

  getModelList() {
    return this.http.get(this.baseUrl + 'WebApi/Home/Getmodelmaster');
  }

  insertTransferStock(values: any) {
    return this.http.post(this.baseUrl + 'WebApi/Home/InsertBilling', values);
  }

  getDownloadEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'Webapi/Home/DownloadSalesEnquiryMaster', value);
  }

  getfollowup(value: any) {
    return this.http.post(this.baseUrl + 'Webapi/Home/GetPendingFillowupList', value);
  }

  getLeadsFollowup() {
    return this.http.get(this.baseUrl + 'Webapi/Home/GetLeadsFollowup');
  }

  getsalesTarget(value: any) {
    const formData = new FormData();
    formData.append('DateFilter', value);
    return this.http.post(this.baseUrl + 'Api/Home/GetsalesTarget', formData);
  }

  getSalesEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/GetSalesEnquiry2', value);
  }

  //updateGenerateEnquiry(data: any) {
  //  return this.http.post(this.baseUrl + 'api/Home/UpdtGenerateEnquiryv2', data);
  //}

  updateGenerateEnquiry(data: FormData) {
    return this.http.post(this.baseUrl + 'api/Home/UpdtGenerateEnquiryv3', data);
  }

  getSalesEnqByMobileNo(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetSalesEnqByMobileNo', value);
  }

  getDownloadInventoryData(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/DownloadInventoryReport', value);
  }

  getAvailableStockData(value: any) {
    return this.http.post(this.baseUrl + 'Webapi/Home/GetAvailableStockData', value);
  }

  getDownloadStockData(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/DownloadAvailableInventoryReport', value);
  }

  searchInventoryReport(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/SearchInventoryReport', value);
  }

  searchAvailableInventoryReport(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/SearchAvailableInventoryReport', value);
  }

  getFinanceMaster(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetFinanceMaster', value);
  }

  insertFinanceMaster(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/InsertFinanceMasterv2', value, { responseType: 'text' });
  }

  getSalesEnquiryById(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetSalesEnquiryOnPendingFollowUp', value);
  }

  getSalesEnquiryById2(request: any): Observable<any> {
    return this.http.post(this.baseUrl + 'api/Home/GetSalesEnquiryById2', request);
  }

  updateCustomerProfile(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/UpdateSalesCustomerProfile', value, { responseType: 'text' });
  }

  updateEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/UpdateSalesCustomerEnquiryv2', value, { responseType: 'text' });
  }

  getHistoryEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetHistoryEnquiry', value);
  }

  addHistoryEnquiryStatus(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/AddHistoryEnquiry', value, { responseType: 'text' });
  }

  getClosureMaster() {
    return this.http.get(this.baseUrl + 'Api/Home/GetClosureMaster');
  }

  getInstallationv1(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetInstallationv1', value);
  }

  getImagesOnId(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetImagesOnId', value);
  }

  getInStockData(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetInventoryDatawebv1', value);
  }

  convertedEnquiryStatus(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/MarkStockSoldv1', value);
  }

  getChassisNumber(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetAvailableChassisNo', value);
  }

  checkFinanceAndEnquiryStatus(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/CheckFillFinanceData', value);
  }

  getSevenDaySalesEnquiryDelivery(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/GetSevenDaySalesEnquiryDeliveryv1', value);
  }

  getSalesmanList(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/GetSalesmanList', value);
  }

  insertSalesman(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/InsertSalesmanv1', value);
  }

  getDownloadBusinessPerformance(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetBussinessPerformaceDownloadWeb', value);
  }

  getReturnRequestmaster(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetReturnRequestmasterv1', value);
  }

  checkMobileExists(value: any) {
    return this.http.post(this.baseUrl + 'webapi/Login/UserExists', value);
  }

  updatePassword(value: any) {
    return this.http.post(this.baseUrl + 'webapi/Login/UpdatePassword', value);
  }

  getSalesmanByDealerCode(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetSalesmanByDealerCode', value);
  }

  getSalesEnqForFollowByMobileNo(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetSalesEnqForFollowByMobileNo', value);
  }

  getStatusHistory(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetStatusHistory', value);
  }

  getSalesDetailsForReturnRequest(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetSalesDetailsForReturnRequest', value);
  }

  generateReturnRequest(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GenerateReturnRequest', value);
  }

  getFollowUpDownloadWeb(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/DownloadGetPendingFillowupList', value);
  }

  returnRequestApproval(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/ReturnRequestApprovalv1', value);
  }

  checkCustomerMobileExists(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/CustomerExists', value);
  }

  dealerListStatewise(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/DealerListStatewise', value);
  }

  dlrToDlrStockTransfer(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/DlrToDlrStockTransfer', value);
  }

  stockTrfApproval(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/StockTrfApproval', value);
  }

  getStockTrfApproval() {
    return this.http.get(this.baseUrl + 'api/Home/GetStockTrfApproval');
  }

  getStockForStockTransfer(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/GetStockForStockTransfer', value);
  }

  // Dynamically Report

  getAllDashboards() {
    return this.http.get(this.baseUrl + 'api/Report/GetAllDashboards');
  }

  getDashboard(value: any) {
    return this.http.post(this.baseUrl + 'api/Report/GetDashboardsConfig', value);
  }

  executeQuery(value: any) {
    return this.http.post(this.baseUrl + 'api/Report/GetSavedReport', value);
  }

  // Insert Report

  getUploadReportTable() {
    return this.http.get(this.baseUrl + 'api/Report/GetUploadMasterList');
  }

  uploadExcelReport(formData: FormData) {
    return this.http.post(this.baseUrl + 'Api/Report/Preview', formData);
  }

  commitData(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/Commitv1', value);
  }

  getReviewData(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/GetReportTracking', value);
  }

  updateBDRCDataBulk(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/BDRCReportApproval', value);
  }

  forecastReportApproval(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/ForecastReportApproval', value);
  }

  talukaIndustryApproval(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/ForecastReportApproval', value);
  }

  getDropdownData(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/GetDropdownList', value);
  }

  getStateListReport() {
    return this.http.get(this.baseUrl + 'Api/Report/GetStateListByLogin');
  }

  getDealerAccByState(request: any) {
    return this.http.post(this.baseUrl + 'Api/Report/GetDealerAccByState', request);
  }

  getStateListReportNew() {
    return this.http.get(this.baseUrl + 'Api/Report/GetStateListByLoginNew');
  }
  getDealersByState(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/GetDealerByState', value);
  }

  getDealersAccByState(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/GetDealerAccByState', value);
  }

  fetchModelByState(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/GetModelListByState', value);
  }

  fetchIndustryByState(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/GetBrandHpForIndustry', value);
  }

  fetchTalukaIndustryByState(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/GetDistrictAndTalukaList', value);
  }

  fetchSPADetails() {
    return this.http.get(this.baseUrl + 'Api/Report/GetActivityNameList');
  }

  getGroupColumnJson(value: any) {
    return this.http.post(this.baseUrl + 'Api/Report/GetGroupColumnJson', value);
  }

  getRcStatusList(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/GetRcStatusList', value);
  }

  updateRcStatus(value: any) {
    return this.http.post(this.baseUrl + 'api/Home/UpdateRcStatus', value);
  }

  notRetailedList(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/NotRetailedList', value);
  }

  updateRetailSale(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/UpdateRetailSale', value);
  }

  getPopUpCount() {
    return this.http.get(this.baseUrl + 'Api/Home/GetPopUpCount');
  }

  reportLastDateHeading() {
    return this.http.get(this.baseUrl + 'Api/Home/ReportLastDateHeading');
  }

  paymentHistoryList(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/AddtionalPaymentRec', value);
  }

  exchangeStockList(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetExch', value);
  }

  submitExcgange(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/SoldMarkExch', value);
  }

  getOldEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetOldEnquiry', value);
  }

  updateOldEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/UpdateOldEnquiry', value);
  }

  // NDA Enquiry Insert
  insertNdaEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/InsertNDAForm', value);
  }

  // NDA Enquiry Update
  updateNdaEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/updtNDA', value);
  }

  getNdaDistrictList(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetDistrict', value);
  }

  getNdaEnquiryList(status: string, pageNo: number, stateCode: string, duration: string, stDate: string, enDate: string,
    selectedEnquirySource: string, selectedEnquirySubSource: string, selectedMobileNumber: string,
    selectedOverdueFilter: string
  ) {
    return this.http.get(this.baseUrl + 'Api/Home/getNdaEnquiryList', {
      params: {
        status, pageNo, stateCode, duration, stDate, enDate, selectedEnquirySource,
        selectedEnquirySubSource, selectedMobileNumber, selectedOverdueFilter
      }
    });
  }

  getTehsilList(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetTehsil', value);
  }

  getCityList(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetCity', value);
  }

  GetNDAById(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetNDAById', value);
  }

  GetStateHeadByState(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetStateHeadByState', value);
  }

  getOldRetailedEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetOldRetailedEnquiry', value);
  };

  updateOldRetailedEnquiry(payload: any) { };

  getAdditionalPaymentHistory(payload: any) { };

  DownloadNotRetailedList(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/DownloadNotRetailedList', value);
  }

  DownloadExch(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/DownloadExch', value);
  }

  GetNDAHistoryById(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetNDAHistoryById', value);
  }

  getKycPendingList(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetKycPendingList', payload);
  }

  submitKycAction(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Home/ApproveSalesmanKyc', payload);
  }

  updatedealer(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Home/updatedealer', payload);
  }

  getstockforReturnBilling(values: any) {
    return this.http.post(this.baseUrl + 'Api/Home/GetChassisForReturnBilling', values);
  }

  ReturnBilling(values: any) {
    return this.http.post(this.baseUrl + 'Api/Home/ReturnBilling', values);
  }

  insertPricePosition(formData: FormData) {
    return this.http.post(this.baseUrl + 'Api/Report/insertPricePosition', formData);
  }

  updatePricePosition(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Report/UpdatePricePosiReportv2', payload);
  }

  approvalPricePosition(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Report/PricePosiReportApproval', payload);
  }

  getExchangeModel() {
    return this.http.get(this.baseUrl + 'Api/Home/GetExchangeModelList');
  }

  getSourceSubsource() {
    return this.http.get(this.baseUrl + 'Api/Home/getSourceSubSource');
  }

  getSourceSubSourceForRepFilter() {
    return this.http.get(this.baseUrl + 'Api/Home/getSourceSubSourceForRepFilter');
  }

  getbillingReqData(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Home/getbillingReqData', payload);
  }

  getDealerByLocation(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/getDealerByTehsil', value);
  }

  assignDealerToEnquiry(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/assignDealerToEnquiry', value);
  }

  notAssignDealerList(value: any) {
    return this.http.post(this.baseUrl + 'Api/Home/notAssignDealerList', value);
  }

  getUnassignedCount() {
    return this.http.get(this.baseUrl + 'Api/Home/getUnassignedCount');
  }

  getOutlookFormatData(month: number, year: number) {
    return this.http.get(this.baseUrl + 'Api/Report/getOutlookFormatData', { params: { month: month, year: year } });
  }
  getRevisedBDRCFormatData(payload: any) {
    return this.http.get(this.baseUrl + 'Api/Report/getRevisedForExcel', { params: { month: payload.month, year: payload.year, week: payload.week, stateName: payload.stateName } });
  }

  getThreeDaysOdEnquiries(value: any) {
    return this.http.get(this.baseUrl + 'api/Home/getThreeDaysOdEnquiries', { params: value });
  }

  getPendingConversionByList(pageNo: number, stateCode: string, duration: string, stDate: string, enDate: string,
    selectedEnquirySource: string, selectedEnquirySubSource: string, selectedMobileNumber: string) {
    return this.http.get(this.baseUrl + 'Api/Home/getPendingConversionByList', {
      params: {
        pageNo: pageNo, stateCode, duration, stDate, enDate,
        selectedEnquirySource, selectedEnquirySubSource, selectedMobileNumber
      }
    });
  }

  getIndustryByTaluka(talukaCode: number) {
    return this.http.get(this.baseUrl + 'Api/Home/getIndustryByTaluka', {
      params: {
        talukaCode: talukaCode
      }
    });
  }


  //Service Part

  getPdiStockList(page: number, searchQuery: string) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('searchQuery', searchQuery);
    return this.http.get(this.baseUrl + 'Api/Services/pdiList', { params });
    //return this.http.get(this.baseUrl + 'Api/Services/pdiList');

  }

  uploadPdiImage(formData: FormData) {
    return this.http.post(this.baseUrl + 'Api/Services/uploadPDIImage', formData);
  }

  addPdi(payload: PdiSubmitPayload) {
    return this.http.post(this.baseUrl + 'Api/Services/addPDI', payload);
  }

  removeImage(fileName: string) {
    return this.http.post(
      this.baseUrl + 'Api/Services/removeImage',
      { fileName }
    );
  }

  getJobCardEligibleChassis(page: number, searchQuery: string, searchBy: string) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('searchQuery', searchQuery)
      .set('searchBy', searchBy);

    return this.http.get(
      this.baseUrl + 'Api/Services/jobCardEligibleChassis',
      { params }
    );
  }

  getSpareParts() {
    return this.http.get<any[]>(this.baseUrl + 'Api/Services/getSpareParts');
  }
  addJobCard(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Services/addJobCard', payload);
  }

  getServiceTimeline(salesMasterId: string) {
    const params = new HttpParams().set('salesMasterId', salesMasterId);
    return this.http.get(this.baseUrl + 'Api/Services/GetServiceTimeline', { params });
  }

  getMenuList() {
    return this.http.get(this.baseUrl + 'Api/Home/getMenuList');
  }


  getTmByDistCode(distCode: number) {
    const params = new HttpParams().set('distCode', distCode);
    return this.http.get(this.baseUrl + 'Api/Report/getTMByDistCode', { params });
  }

  getEmployeeList(payload: any) {
    const params = new HttpParams().set('stateCode', payload.stateCode).set('position', payload.position);
    return this.http.get(this.baseUrl + 'Api/Home/getEmployeeList', { params });
  }

  updtConversionBy(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Home/updtConversionBy', payload);
  }


  getJobCardMasterById(jobCardMasterId: string) {
    const params = new HttpParams().set('jobCardMasterId', jobCardMasterId);
    return this.http.get(this.baseUrl + 'Api/Services/getJobCardById', { params });
  }

  updateJobCard(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Services/updateJobCard', payload);
  }


  getNTIRStockList(page: number, searchQuery: string) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('searchQuery', searchQuery);
    return this.http.get(this.baseUrl + 'Api/Services/NTIRList', { params });
    //return this.http.get(this.baseUrl + 'Api/Services/pdiList');

  }

  addNTIR(payload: NtirSubmitPayload) {
    return this.http.post(this.baseUrl + 'Api/Services/addNTIR', payload);
  }

  getNTIRByID(Id: string) {
    const params = new HttpParams()
      .set('Id', Id);
    return this.http.get(this.baseUrl + 'Api/Services/getNTIRByID', { params });
    //return this.http.get(this.baseUrl + 'Api/Services/pdiList');

  }

  updateNTIR(payload: NtirSubmitPayload) {
    return this.http.post(this.baseUrl + 'Api/Services/updateNTIR', payload);
  }
  uploadNTIRImage(formData: FormData) {
    return this.http.post(this.baseUrl + 'Api/Services/uploadNTIRImage', formData);
  }

  updatePDI(payload: PdiSubmitPayload) {
    return this.http.post(this.baseUrl + 'Api/Services/updatePDI', payload);
  }
  addPdiv1(payload: PdiSubmitPayload) {
    return this.http.post(this.baseUrl + 'Api/Services/addPDIv1', payload);
  }
  getPDIByID(Id: string) {
    const params = new HttpParams()
      .set('Id', Id);
    return this.http.get(this.baseUrl + 'Api/Services/getPDIByID', { params });
    //return this.http.get(this.baseUrl + 'Api/Services/pdiList');

  }

  addDealerMaster(payload: DealerRequestModel) {
    return this.http.post(
      this.baseUrl + 'Api/Services/addDealerMaster',
      payload
    );
  }

  getOpenJobCardList(page: number) {
    const params = new HttpParams()
      .set('pageNo', page)

    return this.http.get(
      this.baseUrl + 'Api/Services/getOpenJobCard',
      { params }
    );
  }

  getFreeServiceList() {
    return this.http.get(this.baseUrl + 'Api/Services/getFreeServiceClosedJobCard');
  }

  getInstallationList() {
    return this.http.get(this.baseUrl + 'Api/Services/GetPendingServiceInvoiceInstallation');
  }

  //generateServiceInvoice(ids: string[]) {
  //  return this.http.post(this.baseUrl + 'Api/Services/generateServiceInvoice', ids);
  //}

  //generateInstallationInvoice(ids: string[]) {
  //  return this.http.post(this.baseUrl + 'Api/Services/generateInstallationInvoice', ids);
  //}

  generateInvoice(endpoint: string, ids: string[]) {
    return this.http.post(this.baseUrl + 'Api/Services/' + endpoint, ids);
  }

  getInvoiceList(stDate: string, enDate: string, duration: string) {
    const params = new HttpParams()
      .set('stDate', stDate)
      .set('enDate', enDate)
      .set('duration', duration);
    return this.http.get(this.baseUrl + 'Api/Services/getInvoiceList', { params });
  }


  updateReimbursementPaymentStatus(Id: string) {
    return this.http.post(this.baseUrl + 'Api/Services/updateReimbursementPaymentStatus', { InvoiceId: Id });
  }

  updateDealerAssignments(payload: any) {
    return this.http.post(this.baseUrl + 'Api/Home/updateDealerAssignments', payload);

  }

  GetDealerDetailByDealerCode(dealerCode: string) {
    const params = new HttpParams()
      .set('dealerCode', dealerCode)

    return this.http.get(
      this.baseUrl + 'Api/Home/DealerDetailByDealerCode',
      { params }
    );
  }

  getPdd(month: number, year: number) {
    return this.http.get(this.baseUrl + 'Api/Report/getPdd', { params: { month: month, year: year } });
  }

  insertMechanic(payload: any) {
    return this.http.post(
      this.baseUrl + 'Api/Services/insertMechanic',
      payload
    );
  }


  getMechanicList(params: any) {
    return this.http.get(this.baseUrl + 'Api/Services/getMechanicList', { params });
  }

  approvalMechanicStatus(payload: any) {
    return this.http.post(
      this.baseUrl + 'Api/Services/approval-status',
      payload
    );
  }


  getMechanicPendingList() {
    return this.http.get(this.baseUrl + 'Api/Services/getMechanicsPendingList');
  }
  updateMechanic(payload: any) {
    return this.http.post(
      this.baseUrl + 'Api/Services/updateMechanic',
      payload
    );
  }

  getEmployeeListByPosition(params: any) {
    return this.http.get(this.baseUrl + 'Api/Home/getEmployeeListByPosition', { params });
  }

  addBaseLocation(params: any) {
    return this.http.post(this.baseUrl + 'Api/Home/addBaseLocation', params);
  }


  getPDIReport(request: any) {
    return this.http.get(this.baseUrl + 'Api/Services/pdiReport', { params: request });
  }
  allDealerList(id: number) {
    const params = new HttpParams()
      .set('status', id)
    return this.http.get(this.baseUrl + 'Api/Home/allDealerList', { params });
  }

  getNTIRReport(request: any) {
    return this.http.get(this.baseUrl + 'Api/Services/ntirReport', { params: request });
  }

}
