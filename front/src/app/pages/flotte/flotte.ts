import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { VaisseauPosseder } from '@models/VaisseauPosseder';
import { VaisseauService } from '@services/VaisseauService';

@Component({
  selector: 'app-flotte',
  imports: [MatButtonModule, MatCardModule, MatTabsModule, MatDividerModule, MatProgressBarModule, MatIconModule],
  templateUrl: './flotte.html',
  styleUrl: './flotte.scss',
})
export class Flotte implements OnInit
{
  protected listeVaisseau = signal<VaisseauPosseder[]>([]);

  private vaisseauServ = inject(VaisseauService);

  ngOnInit(): void 
  {
    this.Lister();
  }

  private Lister(): void
  {
    this.vaisseauServ.ListerPosseder().subscribe({
      next: (retour) =>
      {
        this.listeVaisseau.set(retour);
      }
    });
  }
}
