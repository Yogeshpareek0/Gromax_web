import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from '../app/layout/loader/loader.component'
import { OnlyEnglishNumericDirective } from '../app/services/directives/only-english-numeric.directive';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'grow_max_portal';

  constructor(private toastr: ToastrService) {
    /*this.toastr.success('Data saved successfully!', 'Success');*/
  }

  
}
