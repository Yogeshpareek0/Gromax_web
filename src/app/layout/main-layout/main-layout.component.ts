import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
  activeRoute: string = '';
  isSidebarOpen = false;
  isSalesOpen: boolean = false;
  isServiceOpen: boolean = false;
  isBusinessReportsOpen: boolean = false;
  screenWidth!: number;
  dealerCode = '';
  dealerName = '';
  possitionId = '';
  misstatus = '';
  mobileNo = '';
  username = '';

  businessReports: any[] = [];
  menuList: any[] = [];
  activeDashboardId: number | null = null;
  activeDashboardName: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private apis: AuthService,
    private activatedRoute: ActivatedRoute
  ) {
    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.setActiveRoute();
      this.restoreDropdownStates();
    });
  }

  ngOnInit() {

    this.screenWidth = window.innerWidth;
    this.updateSidebarState();
    this.dealerCode = sessionStorage.getItem('dealerCode') || '';
    this.dealerName = sessionStorage.getItem('name') || '';
    this.possitionId = sessionStorage.getItem('possitionId') || '';
    this.misstatus = sessionStorage.getItem('misstatus') || '';
    this.mobileNo = sessionStorage.getItem('mobileNo') || '';
    this.username = sessionStorage.getItem('userName') || '';
    const data = sessionStorage.getItem('MenuList');

    this.menuList = data ? JSON.parse(data) : [];

    //console.log('menulist', this.menuList);

    this.loadBusinessReports();
    this.restoreActiveState();
  }

  @HostListener('window:resize')
  onResize() {
    this.screenWidth = window.innerWidth;
    this.updateSidebarState();
  }

  updateSidebarState() {
    if (this.screenWidth > 768) {
      this.isSidebarOpen = true;
    } else {
      this.isSidebarOpen = false;
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleBusinessReports() {
    this.isBusinessReportsOpen = !this.isBusinessReportsOpen;
    sessionStorage.setItem('isBusinessReportsOpen', String(this.isBusinessReportsOpen));
  }

  toggleSales() {
    this.isSalesOpen = !this.isSalesOpen;
    sessionStorage.setItem('isSalesOpen', String(this.isSalesOpen));
  }

  toggleService() {

    this.isServiceOpen = !this.isServiceOpen;
    sessionStorage.setItem('isServiceOpen', String(this.isServiceOpen));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = (event.target as HTMLElement).closest('.btn.btn-light');
    const clickedInsideSidebar = sidebar?.contains(event.target as Node);

    if (!clickedInsideSidebar && !toggleBtn && this.screenWidth <= 768) {
      this.isSidebarOpen = false;
    }
  }

  closeSidebarOnMobile() {
    if (this.screenWidth <= 768) {
      this.isSidebarOpen = false;
    }
  }

  onNavigate(path: string) {

    const salesRoutes = ['enquiryfollowup', 'enquirygenerate', 'sevendayenquiry', 'stocktransfer', 'rcstatus',
      'retailpunch', 'exchangestock', 'updateoldenquiry', 'assigndealerenquiry', 'threedaysodenqu', 'dealermaster', 'updtdealer'];
    const businessReportRoutes = ['enquiry', 'business_performance', 'dynamicreport', 'pdireport', 'ntirreport'];
    const serviceRoutes = ['pdi', 'generatejob', 'installation', 'ntir', 'reimbursementservice', 'Mechanic', 'additemscore', 'generatedinvoicelist']; // 🔑 naya array

    if (path !== 'dynamicreport') {
      this.activeDashboardId = null;
      this.activeDashboardName = '';
      sessionStorage.removeItem('activeDashboardId');
      sessionStorage.removeItem('activeDashboardName');
    }

    this.router.navigate([`main/${path}`]).then(() => {
      this.setActiveRoute();

      // Close all three dropdowns first
      this.isSalesOpen = false;
      this.isBusinessReportsOpen = false;
      this.isServiceOpen = false;

      // Then open only the relevant one
      if (salesRoutes.includes(path)) {
        this.isSalesOpen = true;
        sessionStorage.setItem('isSalesOpen', 'true');
        sessionStorage.setItem('isBusinessReportsOpen', 'false');
        sessionStorage.setItem('isServiceOpen', 'false');
      } else if (businessReportRoutes.includes(path)) {
        this.isBusinessReportsOpen = true;
        sessionStorage.setItem('isBusinessReportsOpen', 'true');
        sessionStorage.setItem('isSalesOpen', 'false');
        sessionStorage.setItem('isServiceOpen', 'false');
      } else if (serviceRoutes.includes(path)) {
        this.isServiceOpen = true;
        sessionStorage.setItem('isServiceOpen', 'true');
        sessionStorage.setItem('isSalesOpen', 'false');
        sessionStorage.setItem('isBusinessReportsOpen', 'false');
      } else {
        sessionStorage.setItem('isSalesOpen', 'false');
        sessionStorage.setItem('isBusinessReportsOpen', 'false');
        sessionStorage.setItem('isServiceOpen', 'false');
      }
    });

    this.closeSidebarOnMobile();
  }

  closeAllDropdowns() {
    this.isSalesOpen = false;
    this.isBusinessReportsOpen = false;
    this.isServiceOpen = false;
    sessionStorage.setItem('isSalesOpen', 'false');
    sessionStorage.setItem('isBusinessReportsOpen', 'false');
    sessionStorage.setItem('isServiceOpen', 'false');
  }

  private setActiveRoute() {

    const segments = this.router.url.split('?')[0].split('/').filter(x => x);
    this.activeRoute = segments[segments.length - 1];
  }

  private restoreDropdownStates() {

    const salesRoutes = ['enquiryfollowup', 'enquirygenerate', 'sevendayenquiry',
      'stocktransfer', 'rcstatus', 'retailpunch', 'exchangestock', 'updateoldenquiry',
      'updtoldretailedenq', 'assigndealerenquiry', 'threedaysodenqu', 'dealermaster', 'updtdealer'];
    const businessReportRoutes = ['enquiry', 'business_performance', 'dynamicreport', 'pdireport', 'ntirreport'];
    const serviceRoutes = ['pdi', 'serviceRoutes', 'ntir', 'reimbursementservice', 'Mechanic', 'additemscore', 'generatedinvoicelist'];

    this.isSalesOpen = false;
    this.isBusinessReportsOpen = false;
    this.isServiceOpen = false;

    if (salesRoutes.includes(this.activeRoute)) {
      this.isSalesOpen = true;
      sessionStorage.setItem('isSalesOpen', 'true');
    }

    if (businessReportRoutes.includes(this.activeRoute)) {
      this.isBusinessReportsOpen = true;
      sessionStorage.setItem('isBusinessReportsOpen', 'true');
    }

    if (serviceRoutes.includes(this.activeRoute)) {
      this.isServiceOpen = true;
      sessionStorage.setItem('isServiceOpen', 'true');
    }
  }

  private restoreActiveState() {

    const savedSalesState = sessionStorage.getItem('isSalesOpen');
    const savedBusinessReportsState = sessionStorage.getItem('isBusinessReportsOpen');
    const savedServiceState = sessionStorage.getItem('isServiceOpen');

    if (savedSalesState === 'true') this.isSalesOpen = true;
    if (savedBusinessReportsState === 'true') this.isBusinessReportsOpen = true;
    if (savedServiceState === 'true') this.isServiceOpen = true;

    // ...baaki code same
  }

  logout() {

    sessionStorage.clear();
    this.apis.logout();
  }

  get routeLabels(): { [key: string]: string } {
    return {
      dashboard: 'Dashboard',
      salesman:
        (this.possitionId === 'Territory Manager'
          || this.possitionId === 'Dealer'
          || this.misstatus?.toLowerCase() === 'yes'
          ? 'Add Salesman' : 'Approve Salesman'),
      rcstatus: 'RC Status',
      updtdealer: 'Update Dealer',
      retailpunch: 'Retail Update',
      updateoldenquiry: 'Post Delivery Update',
      updtoldretailedenq: 'Post Retailed Delivery Update',
      exchangestock: 'Exchange Stock',
      enquiryfollowup: 'Enquiry FollowUp',
      enquirygenerate: 'Generate Enquiry',
      enquiry: 'Enquiry Master',
      business_performance: 'Business Performance Master',
      pdireport: 'PDI Report',
      ntirreport: 'NTIR Report',
      stocktransfer: 'Dealer Stock Transfer',
      /*    stockreturn: 'Dealer Stock Return',*/
      inventory_data: 'Stock Master',
      ticketgeneration: 'Ticket Generation',
      warrantyclaim: 'Warranty Claim',
      installation: 'Installation',
      raisereturn: 'Raise Return',
      sevendayenquiry: 'Super Hot Enquiry',
      assigndealerenquiry: 'Assign Dealer to Enquiries',
      transferstock: 'Upload Billing',
      uploadexcel: 'Upload Business Data',
      businessdatareview: 'Business Data Review',
      createreport: 'Create Business Report',
      ndaform: 'NDA Enquiry & Follow Up',
      dynamicreport: 'Report',
      billingrequest: 'Billing Request',
      threedaysodenqu: 'Enquiries Due in Next 3 Days',
      pdi: 'Pre-Delivery Inspection',
      ntir: 'New Tractor Inspection Report',
      generatejob: 'Generate Job Card',
      dealermaster: 'Add Dealer',
      reimbursementservice: 'Reimbursement Service',
      generatedinvoicelist: 'Generated Invoice List',
      Mechanic: 'Mechanic Master',
      additemscore: 'Add Item Score'


    }
  };

  get activePageLabel(): string {
    if (this.activeRoute === 'dynamicreport' && this.activeDashboardName) {
      return this.activeDashboardName;
    }
    return this.routeLabels[this.activeRoute] || '';
  }

  loadBusinessReports() {
    this.apis.getAllDashboards().subscribe({
      next: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.businessReports = res.data;

          const savedDashboardId = sessionStorage.getItem('activeDashboardId');
          if (savedDashboardId) {
            const report = this.businessReports.find(r => r.Id === parseInt(savedDashboardId));
            if (report) {
              this.activeDashboardId = report.Id;
              this.activeDashboardName = report.Name;
            }
          }
        } else {
          this.apis.showAlert('warning', 'Warning!', 'No reports are available.');
        }
      },
      error: (err) => {
        this.apis.showAlert('error', 'Error!', 'Unable to load reports. Please try again.');
      }
    });
  }

  openReport(report: any) {
    this.activeDashboardId = report.Id;
    this.activeDashboardName = report.Name;

    sessionStorage.setItem('activeDashboardId', String(report.Id));
    sessionStorage.setItem('activeDashboardName', report.Name);
    sessionStorage.setItem('isBusinessReportsOpen', 'true');
    sessionStorage.setItem('isSalesOpen', 'false');
    sessionStorage.setItem('isServiceOpen', 'false');

    this.router.navigate(
      ['main/dynamicreport'],
      { queryParams: { dashboardId: report.Id } }
    ).then(() => {
      this.activeRoute = 'dynamicreport';
      this.isBusinessReportsOpen = true;
      this.isSalesOpen = false;
    });

    this.closeSidebarOnMobile();
  }

  hasSubMenu(mainMenu: string, subMenu: string): boolean {
    return this.menuList.some(
      (x: any) =>
        x.MainMenu === mainMenu &&
        x.SubMenu === subMenu
    );
  }
  hasMenu(mainMenu: string): boolean {
    return this.menuList.some(
      (x: any) =>
        x.MainMenu === mainMenu
    );
  }
}
