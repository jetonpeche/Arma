import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { PersonnageMort } from '@models/PersonnageMort';
import { PersonnageService } from '@services/PersonnageService';

@Component({
  selector: 'app-cimetiere',
  imports: [MatCardModule, MatDividerModule, MatIconModule],
  templateUrl: './cimetiere.html',
  styleUrl: './cimetiere.scss',
})
export class Cimetiere implements OnInit
{
  protected liste = signal<PersonnageMort[]>([]);
  private personnageServ = inject(PersonnageService);

  ngOnInit(): void 
  {
    this.ListerPersonnageMort();
  }

  private ListerPersonnageMort(): void
  {
    this.personnageServ.ListerMort().subscribe({
      next: (retour) => {
        this.liste.set(retour);
      }
    });
  }
}
