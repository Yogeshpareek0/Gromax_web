import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoginResponse } from '../../model/apiresponse';
import { PermissionService } from '../../services/userpermission/permission.service'

declare var bootstrap: any;

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  showPassword: boolean = false;
  isMobileVerified: boolean = false;
  otpStep = false;
  mobileNumber: string = '';
  password: string = '';
  otp: string = '';
  generatedCaptcha: string = '';
  captchaInput: string = '';
  otpTimer: number = 0;
  otpInterval: any;
  currentOtp: string = '';
  otpValid: boolean = false;
  rotationAngle = 0;

  forgotStep = 1;
  forgotMobile = '';
  forgotPassword = '';
  forgotConfirmPassword = '';
  forgotOtp = '';
  forgotPasswordError: string = '';
  constructor(private router: Router, private http: HttpClient, private apis: AuthService, private snackBar: MatSnackBar, private permi: PermissionService) { }

  ngOnInit(): void {
    this.generateCaptcha();
  }

  generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  resendOtp() {
    this.otp = '';
    this.forgotOtp = '';
    //this.getOtp(true);
    this.sendOtp(true);

  }

  getOtp(isResend: boolean = false) {
    const mobile = this.mobileNumber.trim();

    if (!mobile || mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
      this.snackBar.open('Please enter a valid mobile number', 'error', {
        duration: 3000,
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.currentOtp = this.generateOtp();
    this.otpValid = true;

    const message = `Your OTP is ${this.currentOtp} - GEO Planet`;

    this.apis.sendotp(message, mobile).subscribe({
      next: (response) => {
        /*console.log('OTP sent', response);*/
      }
    });

    if (!isResend) {
      this.otpStep = true;
    }

    this.generateCaptcha();
    this.startOtpTimer();
  }

  generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.generatedCaptcha = Array.from({ length: 5 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }

  startOtpTimer() {
    this.otpTimer = 60;
    if (this.otpInterval) clearInterval(this.otpInterval);

    this.otpInterval = setInterval(() => {
      if (this.otpTimer > 0) {
        this.otpTimer--;
      } else {
        clearInterval(this.otpInterval);
        this.otpValid = false;
      }
    }, 1000);
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  onLogin() {
    const validations = [
      { condition: !this.mobileNumber, message: 'Please enter mobile number.' },
      { condition: this.mobileNumber && !/^\d{10}$/.test(this.mobileNumber), message: 'Mobile number must be 10 digits.' },
      { condition: !this.password, message: 'Please enter password.' },
      {
        condition: !this.captchaInput || this.captchaInput !== this.generatedCaptcha, message: 'Captcha is incorrect. Please try again.',
        onError: () => this.generateCaptcha()
      }
    ];

    for (let v of validations) {
      if (v.condition) {

        this.showError(v.message);
        if (v.onError) {
          v.onError();
        }
        return;
      }
    }

    const MobileNumber = this.mobileNumber;
    const Password = this.password

    this.apis.loginapi(MobileNumber, Password).subscribe({
      //this.apis.loginapis(MobileNumber).subscribe({
      next: (res: any) => {


        if (res.message?.toLowerCase() === 'success' && res.data?.token) {
          sessionStorage.setItem('token', res.data.token);
          sessionStorage.setItem('possitionId', res.data.possitionId);
          sessionStorage.setItem('mobileNo', res.data.mobileNo);
          sessionStorage.setItem('dealerCode', res.data.dealerCode);
          sessionStorage.setItem('userName', res.data.userName);
          sessionStorage.setItem('stateCode', res.data.stateCode);
          sessionStorage.setItem('state', res.data.state);
          sessionStorage.setItem('name', res.data.name);
          sessionStorage.setItem('misstatus', res.data.misstatus);
          this.getMenuList();
          //this.router.navigate(['/main/dashboard']);
        }
        else if (res.message?.toLowerCase() === 'invalid') {
          this.snackBar.open('Invalid username & password', '', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.generateCaptcha();
        }
        else {
          this.snackBar.open('Something went wrong! Please try again later.', '', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.generateCaptcha();
        }
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Something went wrong! Please try again later.';
        this.snackBar.open(errorMsg, '', {
          duration: 3000,
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.generateCaptcha();
      }
    });
  }

  openForgotPasswordModal() {
    this.forgotStep = 1;
    const modalEl = document.getElementById('forgotPasswordModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl, {
        backdrop: 'static',
        keyboard: false
      });
      modal.show();
    }
  }

  rotateCaptchaIcon() {
    this.rotationAngle += 360;
    this.generateCaptcha();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  sendOtp(isResend: boolean = false) {

    if (!this.forgotMobile || !this.forgotPassword || !this.forgotConfirmPassword) {
      this.forgotPasswordError = 'All fields are required.';
      setTimeout(() => {
        this.forgotPasswordError = '';
      }, 2000);
      return;
    }
    if (this.forgotPassword.length <= 3) {
      this.forgotPasswordError = 'Password minimum length 3 characters!';
      setTimeout(() => {
        this.forgotPasswordError = '';
      }, 2000);
      return;
    }

    if (this.forgotPassword !== this.forgotConfirmPassword) {
      this.forgotPasswordError = 'Password and Confirm Password do not match!';
      setTimeout(() => {
        this.forgotPasswordError = '';
      }, 2000);
      return;
    }

    this.forgotPasswordError = '';

    this.currentOtp = this.generateOtp();
    this.otpValid = true;
    const message = `Dear User,
Your OTP for login is ${this.currentOtp}.
Gromax Agri Equipment`;

    this.apis.sendotp(message, this.forgotMobile).subscribe({
      next: (response) => {
        /*console.log('OTP sent', response);*/
      }
    });

    if (!isResend) {
      this.otpStep = true;
    }

    this.startOtpTimer();
    this.forgotStep = 2;
  }

  updatePassword() {
    if (!this.forgotOtp) {
      this.forgotPasswordError = 'Please enter OTP.';
      setTimeout(() => {
        this.forgotPasswordError = '';
      }, 2000);
      return;
    }

    if (!this.otpValid) {
      this.forgotPasswordError = 'OTP expired. Please request a new OTP.';
      setTimeout(() => {
        this.forgotPasswordError = '';
      }, 2000);
      return;
    }

    if (this.forgotOtp !== this.currentOtp) {
      this.forgotPasswordError = 'Invalid OTP. Please try again.';
      setTimeout(() => {
        this.forgotPasswordError = '';
      }, 2000);
      return;
    }
    var request = {
      MobileNo: this.forgotMobile,
      Password: this.forgotPassword
    }
    this.apis.updatePassword(request).subscribe({
      next: (res: any) => {
        if (res && res.statusCode === 200 && res.message === 'Success') {
          this.forgotPasswordError = 'Password updated successfully.';
          setTimeout(() => {
            this.forgotPasswordError = '';
            this.closeConvertedModal();
          }, 1500);
        }
        else {
          this.forgotPasswordError = 'Password updated failed.';
          setTimeout(() => {
            this.forgotPasswordError = '';
            this.closeConvertedModal();
          }, 2000);
        }
      },
      error: (err) => {
        console.error(err);
        this.forgotPasswordError = 'Something went wrong. Try again.';
        setTimeout(() => {
          this.forgotPasswordError = '';
          this.closeConvertedModal();
        }, 2000);
      }
    });
  }

  closeConvertedModal() {
    const modalEl = document.getElementById('forgotPasswordModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      this.forgotMobile = '';
      this.forgotPassword = '';
      this.forgotConfirmPassword = '';
      this.forgotOtp = '';
      modal.hide();
    }
  }

  onForgotMobileChange() {
    this.forgotPasswordError = '';

    if (this.forgotMobile && this.forgotMobile.length === 10 && /^[0-9]{10}$/.test(this.forgotMobile)) {
      const request = { MobileNo: this.forgotMobile };

      this.apis.checkMobileExists(request).subscribe({
        next: (res: any) => {
          if (res && res.statusCode === 200) {
            if (res.data === 'Not Exists') {
              this.isMobileVerified = false;
              this.forgotPasswordError = 'Mobile number invalid. Please check';
              setTimeout(() => {
                this.forgotPasswordError = '';
              }, 2000);
            } else {
              this.isMobileVerified = true;
            }
          } else {
            this.isMobileVerified = false;
            this.forgotPasswordError = 'Unexpected response from server.';
            setTimeout(() => {
              this.forgotPasswordError = '';
            }, 2000);
          }
        },
        error: (err) => {
          console.error(err);
          this.isMobileVerified = false;
          this.forgotPasswordError = 'Something went wrong. Try again.';
          setTimeout(() => {
            this.forgotPasswordError = '';
          }, 2000);
        }
      });
    }
    else {
      this.isMobileVerified = false;
    }
  }

  getMenuList() {

    this.apis.getMenuList().subscribe({
      next: (res: any) => {

        sessionStorage.setItem('MenuList', JSON.stringify(res.data));
        //console.log('MenuList', res.data);
        //const positionId = sessionStorage.getItem('possitionId');
        this.permi.menuList = res.data;
        const dashPermision = this.permi.hasDashboard();
        //console.log('dashPermision', dashPermision);
        if (dashPermision) {
          this.router.navigate(['/main/dashboard']);
        }
        else {
          this.router.navigate(['/main/installation']);

        }
      },
      error: (err) => {
        console.error(err);
      }
    });

  }
}

