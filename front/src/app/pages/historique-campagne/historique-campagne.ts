import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
import { AjouterModifierHistoriqueCampagne } from '@modals/ajouter-modifier-historique-campagne/ajouter-modifier-historique-campagne';
import { DecimalPipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { Campagne } from '@models/Campagne';
import { MatSelectModule } from '@angular/material/select';
import { AjouterModifierCampagne } from '@modals/ajouter-modifier-campagne/ajouter-modifier-campagne';

@Component({
  selector: 'app-historique-campagne',
  imports: [MatSelectModule, SlicePipe, DecimalPipe, UpperCasePipe, MatPaginatorModule, MatButtonModule, MatIconModule, MatCardModule, GridContainer, GridElement, InputFile],
  templateUrl: './historique-campagne.html',
  styleUrl: './historique-campagne.scss',
})
export class HistoriqueCampagnePage implements OnInit
{
    protected btnClick = signal<boolean>(false);
    protected droit: Droit;
    protected droitFichier: Droit;
    protected listeHistoriqueCampagne = signal<HistoriqueCampagne[]>([]);
    protected listeCampagne = signal<Campagne[]>([]);
    protected nbElement = signal<number>(0);
    protected pageIndex = signal<number>(0);
    protected idCampagneSelectionnee = signal<number>(0);

    private authServ = inject(AuthentificationService);
    private histoCampagneServ = inject(HistoriqueCampagneService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private fichierServ = inject(FichierService);
    private dialog = inject(MatDialog);
    private readonly estMobile = window.innerWidth <= 800;

    protected campagneCourante = computed(() => {
        return this.listeCampagne().find(c => c.id == this.idCampagneSelectionnee()) || null;
    });

    ngOnInit(): void 
    {
        this.ListerCampagne();

        this.droit = this.authServ.RecupererDroit(EUrl.HistoriqueCampagne);
        this.droitFichier = this.authServ.RecupererDroit(EUrl.UploadFichier);
    }

    protected ChangerCampagne(idCampagne: number): void 
    {
        this.idCampagneSelectionnee.set(idCampagne);
        this.pageIndex.set(0);
        this.ListerHistorique(idCampagne, 1);
    }

    handlePageEvent(e: PageEvent): void
    {
        const conteneurScroll = document.querySelector('mat-sidenav-content') || document.documentElement;

        if (conteneurScroll) 
            conteneurScroll.scrollTo({ top: 0, behavior: 'smooth' });

        this.ListerHistorique(this.idCampagneSelectionnee(), e.pageIndex + 1);
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

    protected OuvrirModalAjouterModifierCampagne(_campagne?: Campagne): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierCampagne, {
            width: this.estMobile ? "95%" : "80%", 
            maxWidth: "100vw",
            data: _campagne
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (ok) =>
            {
                if(ok === true)
                    this.ListerCampagne();
            }
        });
    }

    protected OuvriModalAjouterModifierHistoriqueCampagne(_historiqueCampagne?: HistoriqueCampagne): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierHistoriqueCampagne, {
            width: this.estMobile ? "95%" : "80%", 
            maxWidth: "100vw",
            data: _historiqueCampagne
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (ok) =>
            {
                if(ok === true)
                    this.ListerHistorique(this.idCampagneSelectionnee(), 1);
            }
        });
    }

    protected OuvrirModalConfirmerSupprimerCampagne(_campagne: Campagne): void
    {
        const MESSAGE = `Confirmez-vous la suppression de la campagne ${_campagne.nom} ?`;
        this.dialogConfirmationServ.Ouvrir("Suppression image", MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour === true)
                    this.SupprimerCampagne(_campagne.id);
            }
        });
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
                    this.SupprimerHistorique(_historiqueCampagne.id);
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
                this.ListerHistorique(this.idCampagneSelectionnee(), this.pageIndex() + 1);
            },
            error: () => this.btnClick.set(false)
        });
    }

    private SupprimerHistorique(_idHistoriqueCompagne: number): void
    {
        this.btnClick.set(true);

        this.histoCampagneServ.SupprimerHistorique(_idHistoriqueCompagne).subscribe({
            next: () => 
            {
                this.btnClick.set(false);
                this.ListerHistorique(this.idCampagneSelectionnee(), this.pageIndex() + 1);
            },
            error: () => this.btnClick.set(false)
        });
    }

    private SupprimerCampagne(_idCampagne: number): void
    {
        this.btnClick.set(true);

        this.histoCampagneServ.SupprimerHistorique(_idCampagne).subscribe({
            next: () => 
            {
                this.btnClick.set(false);
                this.listeCampagne();
            },
            error: () => this.btnClick.set(false)
        });
    }

    private ListerHistorique(_idCampagne: number, _page: number = 1): void
    {
        this.histoCampagneServ.ListerHistorique(_idCampagne, _page).subscribe({
            next: (retour) =>
            {
                this.listeHistoriqueCampagne.set(retour.liste);
                this.nbElement.set(retour.total);
                this.pageIndex.set(retour.page - 1);
            }
        });
    }

    private ListerCampagne(): void
    {
        this.histoCampagneServ.ListerCampagne().subscribe({
            next: (retour) =>
            {
                this.listeCampagne.set(retour);

                if (retour && retour.length > 0)
                {
                    this.idCampagneSelectionnee.set(retour[0].id);
                    this.ListerHistorique(retour[0].id, 1);
                }
            }
        });
    }
}
