import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { HistoriqueCampagne } from '@models/HistoriqueCampagne';
import { AuthentificationService } from '@services/AuthentificationService';
import { HistoriqueCampagneService } from '@services/HistoriqueCampagneService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";

@Component({
  selector: 'app-historique-campagne',
  imports: [MatButtonModule, MatIconModule, MatCardModule, GridContainer, GridElement],
  templateUrl: './historique-campagne.html',
  styleUrl: './historique-campagne.scss',
})
export class HistoriqueCampagnePage implements OnInit
{
    protected droit: Droit;
    protected droitFichier: Droit;
    protected listeHistoriqueCampagne = signal<HistoriqueCampagne[]>([]);

    private authServ = inject(AuthentificationService);
    private histoCampagne = inject(HistoriqueCampagneService);

    ngOnInit(): void 
    {
        this.Lister();

        this.droit = this.authServ.RecupererDroit(EUrl.HistoriqueCampagne);
        this.droitFichier = this.authServ.RecupererDroit(EUrl.UploadFichier);
    }

    protected OuvriModalAjouterModifierHistoriqueCampagne(_historiqueCampagne?: HistoriqueCampagne): void
    {

    }

    private Lister(): void
    {
        this.histoCampagne.Lister(1).subscribe({
            next: (retour) =>
            {
                this.listeHistoriqueCampagne.set(retour.liste);
            }
        });
    }
}
