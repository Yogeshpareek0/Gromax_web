import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  menuList: any[] = [];
  constructor() {
    this.loadMenu();
  }

  private loadMenu(): void {
    const data = sessionStorage.getItem('MenuList');
    this.menuList = data ? JSON.parse(data) : [];
    //console.log('menuList', this.menuList);
  }

  hasSubMenu(): boolean {
    return this.menuList.some(
      (x: any) =>
        x.MainMenu === 'SuperAdmin' &&
        x.SubMenu === 'SuperAdmin'
    );
  }

  hasDashboard(): boolean {
    return this.menuList.some(
      (x: any) =>
        x.MainMenu === 'Dashboard' &&
        x.SubMenu === 'Dashboard'
    );
  }

  hasSubmenuPermission(subMenu: string): boolean {
    return this.menuList.some(
      (x: any) =>
        x.SubMenu === subMenu
    );
  }

  dealerAccess(): boolean {
    const positionId = sessionStorage.getItem('possitionId');
    if (positionId === 'Dealer')
      return true;
    else
      return false;
  }

}
