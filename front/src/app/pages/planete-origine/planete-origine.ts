import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ETypeRessource } from '@enums/ETypeRessource';
import { EUrl } from '@enums/EUrl';
import { AjouterModifierPlaneteOrigine } from '@modals/ajouter-modifier-planete-origine/ajouter-modifier-planete-origine';
import { Droit } from '@models/DroitGroupe';
import { PlaneteOrigine } from '@models/PlaneteOrigine';
import { AuthentificationService } from '@services/AuthentificationService';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { FichierService } from '@services/FichierService';
import { PlaneteService } from '@services/PlaneteService';
import { SnackBarService } from '@services/SnackBarService';
import { InputFile } from "@jetonpeche/angular-mat-input";

@Component({
  selector: 'app-planete-origine',
  imports: [MatIconModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatCardModule, MatButtonModule, InputFile],
  templateUrl: './planete-origine.html',
  styleUrl: './planete-origine.scss',
})
export class PlaneteOriginePage implements OnInit 
{
    protected listePlanete = signal<PlaneteOrigine[]>([]);
    protected nbElement = signal<number>(0);
    protected pageIndex = signal<number>(0);
    protected btnClick = signal<boolean>(false);
    protected droit: Droit;
    protected droitFichier: Droit;

    private planeteServ = inject(PlaneteService);
    private authServ = inject(AuthentificationService);
    private snackBarServ = inject(SnackBarService);
    private dialog = inject(MatDialog);
    private fichierServ = inject(FichierService);
    private dialogServ = inject(DialogConfirmationService);    

    ngOnInit(): void 
    {
        this.Lister();
        this.droit = this.authServ.RecupererDroit(EUrl.PlaneteOrigine);
        this.droitFichier = this.authServ.RecupererDroit(EUrl.UploadFichier);
    }

    protected handlePageEvent(e: PageEvent): void
    {
        this.Lister(e.pageIndex + 1);
    }

    protected Recherche(_valeur: string): void
    {
        const VALEUR = _valeur.toLowerCase().trim();
        
        if(VALEUR.length >= 2 || VALEUR.length == 0)
            this.Lister(1, VALEUR);
    }

    protected OuvrirModalConfirmation(_planete: PlaneteOrigine): void
    {
        const TITRE = `Supprimer planète d'origine ${_planete.nom}`;
        const MESSAGE = `Confirmez-vous la suppression definitif de ${_planete.nom} ?`;

        this.dialogServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(_planete.id);
            }
        });
    }

    protected OuvrirModalAjouterModifierPlanete(_planete?: PlaneteOrigine): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierPlaneteOrigine, {
            width: "50%", 
            maxWidth: "100vw",
            data: _planete
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Lister();
            }
        })
    }

    protected UploadFichier(_idGrade: number, _fichier: File): void
    {
        this.fichierServ.Upload(_idGrade, ETypeRessource.Planete, _fichier).subscribe({
            next: (url: string) => 
            {
                this.snackBarServ.Ok("Le fichier a été uploadé");
                this.listePlanete.update(x => 
                {
                    return x.map(p => 
                    {
                        if (p.id == _idGrade)
                            return { ...p, nomFichier: `${url}?t=${new Date().getTime()}` }
                        
                        return p;
                    });
                });
            }
        });
    }

    private Supprimer(_idPlanete: number): void
    {
        this.btnClick.set(true);
        this.planeteServ.Supprimer(_idPlanete).subscribe({
            next: () =>
            {
                this.Lister(this.pageIndex() + 1);

                this.snackBarServ.Ok("La planète a été supprimée");
            },
            error: () => this.btnClick.set(false)
        });
    }

    private Lister(_page: number = 1, _recherche: string = ""): void
    {
        this.planeteServ.Lister(_page, _recherche).subscribe({
            next: (retour) => {
                this.nbElement.set(retour.total);
                this.pageIndex.set(retour.page - 1);
                this.listePlanete.set(retour.liste);
            }
        });
    }
}
