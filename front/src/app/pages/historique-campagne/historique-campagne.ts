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
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmationService } from '@services/DialogConfirmationService';

@Component({
  selector: 'app-historique-campagne',
  imports: [MatButtonModule, MatIconModule, MatCardModule, GridContainer, GridElement],
  templateUrl: './historique-campagne.html',
  styleUrl: './historique-campagne.scss',
})
export class HistoriqueCampagnePage implements OnInit
{
    protected btnClick = signal<boolean>(false);
    protected droit: Droit;
    protected droitFichier: Droit;
    protected listeHistoriqueCampagne = signal<HistoriqueCampagne[]>([]);

    private authServ = inject(AuthentificationService);
    private histoCampagneServ = inject(HistoriqueCampagneService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private dialog = inject(MatDialog);

    ngOnInit(): void 
    {
        this.Lister();

        this.droit = this.authServ.RecupererDroit(EUrl.HistoriqueCampagne);
        this.droitFichier = this.authServ.RecupererDroit(EUrl.UploadFichier);
    }

    protected OuvriModalAjouterModifierHistoriqueCampagne(_historiqueCampagne?: HistoriqueCampagne): void
    {

    }

    protected OuvrirModalConfirmerSupprimer(_historiqueCampagne: HistoriqueCampagne): void
    {
        const MESSAGE = `Confirmez-vous la suppression de ${_historiqueCampagne.titre} ?`;
        this.dialogConfirmationServ.Ouvrir("Suppression historique", MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour === true)
                    this.Supprimer(_historiqueCampagne.id);
            }
        });
    }

    private Supprimer(_idHistoriqueCompagne: number): void
    {
        this.btnClick.set(true);

        this.histoCampagneServ.Supprimer(_idHistoriqueCompagne).subscribe({
            next: () => 
            {
                this.btnClick.set(false);
                this.Lister();
            },
            error: () => this.btnClick.set(false)
        });
    }

    private Lister(): void
    {
        this.histoCampagneServ.Lister(1).subscribe({
            next: (retour) =>
            {
                this.listeHistoriqueCampagne.set(retour.liste);
            }
        });
    }
}
