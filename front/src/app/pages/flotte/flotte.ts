import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { VaisseauPosseder } from '@models/VaisseauPosseder';
import { VaisseauService } from '@services/VaisseauService';
import { ModalContenuStockage } from './modal-contenu-stockage/modal-contenu-stockage';

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
  private dialog = inject(MatDialog);
  private readonly estMobile = window.innerWidth <= 800;

  ngOnInit(): void 
  {
    this.Lister();
  }

  protected OuvrirModalContenuStockage(_idVaisseau: number, _idStockage): void
  {
    this.vaisseauServ.ListerContenuStockage(_idVaisseau, _idStockage).subscribe({
      next: (retour) =>
      {
        this.dialog.open(ModalContenuStockage, {
          width: this.estMobile ? "95%" : "30%", 
          maxWidth: "100vw",
          data: retour
        });
      }
    });
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
