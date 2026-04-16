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
import { InputFile } from "@jetonpeche/angular-mat-input";
import { ETypeRessource } from '@enums/ETypeRessource';
import { FichierService } from '@services/FichierService';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-historique-campagne',
  imports: [MatPaginatorModule, MatButtonModule, MatIconModule, MatCardModule, GridContainer, GridElement, InputFile],
  templateUrl: './historique-campagne.html',
  styleUrl: './historique-campagne.scss',
})
export class HistoriqueCampagnePage implements OnInit
{
    protected btnClick = signal<boolean>(false);
    protected droit: Droit;
    protected droitFichier: Droit;
    protected listeHistoriqueCampagne = signal<HistoriqueCampagne[]>([]);
    protected nbElement = signal<number>(0);
    protected pageIndex = signal<number>(0);

    private authServ = inject(AuthentificationService);
    private histoCampagneServ = inject(HistoriqueCampagneService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private fichierServ = inject(FichierService);
    private dialog = inject(MatDialog);

    ngOnInit(): void 
    {
        this.Lister();

        this.droit = this.authServ.RecupererDroit(EUrl.HistoriqueCampagne);
        this.droitFichier = this.authServ.RecupererDroit(EUrl.UploadFichier);
    }

    handlePageEvent(e: PageEvent): void
    {
        this.Lister(e.pageIndex++);
    }

    protected UploadFichier(_idHistoriqueCompagne: number, _ancienUrlFichier: string, _fichier: File): void
    {
        let ancienNomFichier = new URL(_ancienUrlFichier).pathname.split('/').pop();

        this.fichierServ.Upload(
            _idHistoriqueCompagne, 
            ETypeRessource.HistoriqueCampagne, 
            _fichier,
            ancienNomFichier
        )
        .subscribe({
            next: (url: string) => 
            {
                this.listeHistoriqueCampagne.update(x => 
                {
                    return x.map(p => 
                    {
                        if (p.id == _idHistoriqueCompagne)
                        {
                            let listeUrlImage = p.listeUrlImage.map(y => y == _ancienUrlFichier ? `${url}?t=${new Date().getTime()}` : y);

                            return { ...p, listeUrlImage: listeUrlImage }
                        }
                        
                        return p;
                    });
                });
            }
        });
    }

    protected OuvriModalAjouterModifierHistoriqueCampagne(_historiqueCampagne?: HistoriqueCampagne): void
    {

    }

    protected OuvrirModalConfirmerSupprimerImage(_idHistoriqueCompagne: number, _nomFichier: string): void
    {
        const MESSAGE = `Confirmez-vous la suppression de l'image ?`;
        this.dialogConfirmationServ.Ouvrir("Suppression image", MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour === true)
                    this.SupprimerImage(_idHistoriqueCompagne, _nomFichier);
            }
        });
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

    private SupprimerImage(_idHistoriqueCompagne: number, _nomFichier: string): void
    {
        this.btnClick.set(true);

        this.histoCampagneServ.SupprimerImage(_idHistoriqueCompagne, _nomFichier.split('/').pop()).subscribe({
            next: () => 
            {
                this.btnClick.set(false);
                this.Lister();
            },
            error: () => this.btnClick.set(false)
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

    private Lister(_page: number = 1): void
    {
        this.histoCampagneServ.Lister(_page).subscribe({
            next: (retour) =>
            {
                this.listeHistoriqueCampagne.set(retour.liste);
                this.nbElement.set(retour.total);
                this.pageIndex.set(retour.page - 1);
            }
        });
    }
}
