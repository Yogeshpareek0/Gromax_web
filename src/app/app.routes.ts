import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../app/layout/main-layout/main-layout.component'
import { LoginComponent } from '../app/pages/login/login.component'
import { DashboardComponent } from '../app/pages/dashboard/dashboard.component'
import { EnquiryComponent } from '../app/pages/enquiry/enquiry.component'
import { BusinessPerformanceComponent } from '../app/pages/business-performance/business-performance.component'
import { InventoryDataComponent } from '../app/pages/inventory-data/inventory-data.component'
import { GenerateenquiryComponent } from '../app/pages/generateenquiry/generateenquiry.component'
import { EnquiryfollowupComponent } from '../app/pages/enquiryfollowup/enquiryfollowup.component'
import { CoomingsoonComponent } from '../app/pages/coomingsoon/coomingsoon.component'
//import { StockComponent } from '../app/pages/stock/stock.component'
//import { TicketgenerationComponent } from '../app/pages/ticketgeneration/ticketgeneration.component'
//import { WarrantyclaimComponent } from '../app/pages/warrantyclaim/warrantyclaim.component'
import { TransferstockComponent } from '../app/pages/transferstock/transferstock.component'
import { InstallationComponent } from '../app/pages/installation/installation.component'
import { SevendayenquiryComponent } from '../app/pages/sevendayenquiry/sevendayenquiry.component'
import { SalesmanComponent } from '../app/pages/salesman/salesman.component'
import { RaisereturnComponent } from '../app/pages/raisereturn/raisereturn.component'
import { PerenquiryfollowdetailsComponent } from '../app/pages/perenquiryfollowdetails/perenquiryfollowdetails.component'
import { StocktransferComponent } from '../app/pages/stocktransfer/stocktransfer.component'
import { DynamicreportComponent } from '../app/pages/dynamicreport/dynamicreport.component'
import { UploadexcelComponent } from '../app/pages/uploadexcel/uploadexcel.component'
import { CreatereportComponent } from '../app/pages/createreport/createreport.component'
import { EnquirygenerateComponent } from '../app/pages/enquirygenerate/enquirygenerate.component'
import { RcstatusComponent } from '../app/pages/rcstatus/rcstatus.component'
import { RetailpunchComponent } from '../app/pages/retailpunch/retailpunch.component'
import { ExchangestockComponent } from '../app/pages/exchangestock/exchangestock.component'
import { UpdateoldenquiryComponent } from '../app/pages/updateoldenquiry/updateoldenquiry.component'
import { BusinessdatareviewComponent } from '../app/pages/businessdatareview/businessdatareview.component'
import { NdaformComponent } from '../app/pages/ndaform/ndaform.component'
import { UpdateoldretailedenqComponent } from '../app/pages/updateoldretailedenq/updateoldretailedenq.component'
import { UpdatedealerComponent } from '../app/pages/updatedealer/updatedealer.component'
import { BillingrequestComponent } from '../app/pages/billingrequest/billingrequest.component'
import { AssigndealerenquiryComponent } from '../app/pages/assigndealerenquiry/assigndealerenquiry.component'

import { ThreedaysodenquComponent } from '../app/pages/threedaysodenqu/threedaysodenqu.component'

import { NtirComponent } from '../app/pages/ServicePart/ntir/ntir.component'
import { PdiComponent } from '../app/pages/ServicePart/pdi/pdi.component'
import { GeneratejobcardComponent } from '../app/pages/ServicePart/generatejobcard/generatejobcard.component'

import { DealermasterComponent } from '../app/pages/dealermaster/dealermaster.component'
import { menuGuard } from './services/guards/menu.guard';
import { ReimbersementInvComponent } from '../app/pages/ServicePart/reimbersement-inv/reimbersement-inv.component';
import { MechanicComponent } from '../app/pages/ServicePart/mechanic/mechanic.component';
import { PdiReportComponent } from '../app/pages/ServicePart/pdi-report/pdi-report.component';
import { NtirReportComponent } from '../app/pages/ServicePart/ntir-report/ntir-report.component';
import { ItemScoreComponent } from '../app/pages/ServicePart/item-score/item-score.component';




export const routes: Routes = [
  {
    path: '', component: LoginComponent
  },
  {
    path: 'main',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [menuGuard], data: { menuGroup: 'Dashboard', subMenu: 'Dashboard' } },
      { path: 'enquiry', component: EnquiryComponent, canActivate: [menuGuard], data: { menuGroup: 'Reports', subMenu: 'EnquiryMaster' } },
      { path: 'business_performance', component: BusinessPerformanceComponent, canActivate: [menuGuard], data: { menuGroup: 'Reports', subMenu: 'BusinessPerformanceMaster' } },
      { path: 'inventory_data', component: InventoryDataComponent, canActivate: [menuGuard], data: { menuGroup: 'StockMaster', subMenu: 'StockMaster' } },
      { path: 'enquiryfollowup', component: EnquiryfollowupComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'FollowUpDeliveryUpdate' } },
      /*{ path: 'generateenquiry', component: GenerateenquiryComponent },*/
      { path: 'enquirygenerate', component: EnquirygenerateComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'GenerateEnquiry' } },
      { path: 'coomingsoon', component: CoomingsoonComponent },
      /* { path: 'stock', component: StockComponent },*/
      /*{ path: 'ticketgeneration', component: TicketgenerationComponent },*/
      /*{ path: 'warrantyclaim', component: WarrantyclaimComponent },*/
      { path: 'transferstock', component: TransferstockComponent, canActivate: [menuGuard], data: { menuGroup: 'UploadBilling', subMenu: 'UploadBilling' } },/*upload billing*/
      { path: 'installation', component: InstallationComponent, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'Installation' } },
      { path: 'sevendayenquiry', component: SevendayenquiryComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'SuperHotEnquiry' } },
      { path: 'salesman', component: SalesmanComponent, canActivate: [menuGuard], data: { menuGroup: 'AddSalesman', subMenu: 'AddSalesman' } },
      { path: 'raisereturn', component: RaisereturnComponent, canActivate: [menuGuard], data: { menuGroup: 'RaiseReturn', subMenu: 'RaiseReturn' } },
      { path: 'stocktransfer', component: StocktransferComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'DealerStockTransfer' } },
      { path: 'dynamicreport', component: DynamicreportComponent },
      { path: 'uploadexcel', component: UploadexcelComponent, canActivate: [menuGuard], data: { menuGroup: 'UploadBusinessData', subMenu: 'UploadBusinessData' } },
      /*{ path: 'createreport', component: CreatereportComponent },*/
      { path: 'perenquiryfollowdetails/:id', component: PerenquiryfollowdetailsComponent },
      { path: 'rcstatus', component: RcstatusComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'RCStatus' } },
      { path: 'retailpunch', component: RetailpunchComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'RetailUpdate' } },
      { path: 'exchangestock', component: ExchangestockComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'ExchangeStock' } },
      { path: 'updateoldenquiry', component: UpdateoldenquiryComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'PostDeliveryUpdate' } },
      { path: 'businessdatareview', component: BusinessdatareviewComponent, canActivate: [menuGuard], data: { menuGroup: 'BusinessDataReview', subMenu: 'BusinessDataReview' } },
      { path: 'ndaform', component: NdaformComponent, canActivate: [menuGuard], data: { menuGroup: 'NDAEnquiryFollowUp', subMenu: 'NDAEnquiryFollowUp' } },
      /*{ path: 'updtoldretailedenq', component: UpdateoldretailedenqComponent },*/
      /*   { path: 'updtoldretailedenq', component: UpdateoldretailedenqComponent },*/
      { path: 'assigndealerenquiry', component: AssigndealerenquiryComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'AssignDealerToEnq' } },
      { path: 'billingrequest', component: BillingrequestComponent, canActivate: [menuGuard], data: { menuGroup: 'BillingRequest', subMenu: 'BillingRequest' } },
      { path: 'updtdealer', component: UpdatedealerComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'UpdateDealer' } },
      { path: 'threedaysodenqu', component: ThreedaysodenquComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'DueEnquiry3Days' } },

      { path: 'ntir', component: NtirComponent, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'NTIR' } },
      { path: 'generatejob', component: GeneratejobcardComponent, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'GenerateJobCard' } },
      { path: 'pdi', component: PdiComponent, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'PreDeliveryInspection' } },
      { path: 'dealermaster', component: DealermasterComponent, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'DealerMaster' } },
      { path: 'reimbursementservice', component: ReimbersementInvComponent, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'ReimbursementService' } },
      { path: 'Mechanic', component: MechanicComponent, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'Mechanic' } },
      { path: 'pdireport', component: PdiReportComponent, canActivate: [menuGuard], data: { menuGroup: 'Reports', subMenu: 'PdiReport' } },
      { path: 'ntirreport', component: NtirReportComponent, canActivate: [menuGuard], data: { menuGroup: 'Reports', subMenu: 'NtirReport' } },
      { path: 'additemscore', component: ItemScoreComponent, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'ItemScore' } },
      { path: 'generatedinvoicelist', component: ReimbersementInvComponent, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'GenerateInvoiceList' } },


    ]


    //, canActivate: [menuGuard], data: { menuGroup: 'Dashboard', subMenu: 'Dashboard' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'GenerateEnquiry' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'AssignDealerToEnq' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'SuperHotEnquiry' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'DueEnquiry3Days' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'FollowUpDeliveryUpdate' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'RetailUpdate' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'RCStatus' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'ExchangeStock' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'DealerStockTransfer' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'PostDeliveryUpdate' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'UpdateDealer' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'PreDeliveryInspection' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'GenerateJobCard' }
    //, canActivate: [menuGuard], data: { menuGroup: 'StockMaster', subMenu: 'StockMaster' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Reports', subMenu: 'DynamicBusinessReports' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Reports', subMenu: 'EnquiryMaster' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Reports', subMenu: 'BusinessPerformanceMaster' }
    //, canActivate: [menuGuard], data: { menuGroup: 'UploadBusinessData', subMenu: 'UploadBusinessData' }
    //, canActivate: [menuGuard], data: { menuGroup: 'BusinessDataReview', subMenu: 'BusinessDataReview' }
    //, canActivate: [menuGuard], data: { menuGroup: 'NDAEnquiryFollowUp', subMenu: 'NDAEnquiryFollowUp' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'Installation' }
    //, canActivate: [menuGuard], data: { menuGroup: 'AddSalesman', subMenu: 'AddSalesman' }
    //, canActivate: [menuGuard], data: { menuGroup: 'RaiseReturn', subMenu: 'RaiseReturn' }
    //, canActivate: [menuGuard], data: { menuGroup: 'UploadBilling', subMenu: 'UploadBilling' }
    //, canActivate: [menuGuard], data: { menuGroup: 'BillingRequest', subMenu: 'BillingRequest' }
    //, canActivate: [menuGuard], data: { menuGroup: 'SuperAdmin', subMenu: 'SuperAdmin' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Service', subMenu: 'NTIR' }
    //, canActivate: [menuGuard], data: { menuGroup: 'Sales', subMenu: 'DealerMaster' }
  }
];
