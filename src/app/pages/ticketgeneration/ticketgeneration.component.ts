import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-ticketgeneration',
  imports: [],
  templateUrl: './ticketgeneration.component.html',
  styleUrl: './ticketgeneration.component.css'
})
export class TicketgenerationComponent implements OnInit {

  ticketId: string | null = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    //this.route.paramMap.subscribe(params => {
    //  this.ticketId = params.get('id');
    //  console.log("Ticket ID (subscribe):", this.ticketId);
    //});
  }
}
