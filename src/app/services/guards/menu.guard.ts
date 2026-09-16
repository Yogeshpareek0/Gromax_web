import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../userpermission/permission.service';
import Swal from 'sweetalert2';

export const menuGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const permi = inject(PermissionService)

  const requiredMenu = route.data['subMenu'];
  console.log('requiredMenu', requiredMenu);
  /* debugger;*/
  const hasAccess = permi.hasSubmenuPermission(requiredMenu);
  console.log('hasAccess', hasAccess);

  if (hasAccess) {
    return true;
  }

  Swal.fire({
    icon: 'warning',
    title: 'Not Authorized',
    text: 'You do not have permission to access this page.',
    confirmButtonText: 'OK'
  });

  return router.parseUrl('');
  //return true;

};
