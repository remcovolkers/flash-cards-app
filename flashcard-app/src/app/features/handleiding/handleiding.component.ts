import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-handleiding',
  standalone: true,
  imports: [],
  templateUrl: './handleiding.component.html',
  styleUrl: './handleiding.component.scss',
})
export class HandleidingComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }
}
