import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoaderService } from '../../services/loader/loader.service';
import { AuthService } from '../../services/auth.service';
import { catchError, finalize, throwError, EMPTY } from 'rxjs';
import Swal from 'sweetalert2';

let isLoggingOut = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoaderService);
  const auth = inject(AuthService);


  const skipAuth = req.url.includes('/Login') || req.url.includes('/SendSms');

  if (!skipAuth) {
    loader.show();
  }

  const token = auth.getToken();
  const authReq = !skipAuth && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {

      if ((err.status === 401 || err.status === 403)) {
        isLoggingOut = true;
        const isUnauthorized = err.status === 401;

        Swal.fire({
          icon: 'warning',
          title: isUnauthorized ? 'Session Expired' : 'Access Denied',
          text: isUnauthorized
            ? 'Your session has expired. Please login again.'
            : 'You do not have permission to access this resource.',
          allowOutsideClick: false,
          allowEscapeKey: false
        });

        auth.logout();
        return EMPTY;
      }
      return throwError(() => err);
    }),
    finalize(() => {
      if (!skipAuth) {
        loader.hide();
      }
    })
  );
};
