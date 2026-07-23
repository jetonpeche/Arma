import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatInputModule} from '@angular/material/input';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'; 
import { Logistique, TypeLogistique } from '@models/Logistique';
import { LogistiqueService } from '@services/LogistiqueService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatSelectChange, MatSelectModule } from "@angular/material/select";
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierLogistique } from '@modals/ajouter-modifier-logistique/ajouter-modifier-logistique';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { SnackBarService } from '@services/SnackBarService';
import { ModalInputQuantite } from '@modals/modal-input-quantite/modal-input-quantite';
import { Droit } from '@models/DroitGroupe';
import { environment } from '../../../../environements/environement';
import { UpperCasePipe } from '@angular/common';
import { ModalInformation } from '@modals/modal-information/modal-information';
import { ModalLogistiqueStockage } from './modal-logistique-stockage/modal-logistique-stockage';

interface LogistiqueTable extends Logistique
{
    stock: number;
}

@Component({
  selector: 'app-logistique-info',
  imports: [UpperCasePipe, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule, GridContainer, GridElement, MatSelectModule, ButtonLoader, MatPaginatorModule],
  templateUrl: './logistique-info.html',
  styleUrl: './logistique-info.scss',
})
export class LogistiqueInfo implements OnInit
{
    droit = input.required<Droit>();

    protected listeComplete = signal<LogistiqueTable[]>([]);
    protected listeType = signal<TypeLogistique[]>([]);
    protected btnClick = signal(false);
    
    protected rechercheRequete = signal<string>('');
    protected filtreType = signal<number | null>(null);

    protected pageSize = signal<number>(20);
    protected pageIndex = signal<number>(0);

    protected listeFiltree = computed(() => {
        let resultat = this.listeComplete();
        const RECHERCHE = this.rechercheRequete();
        const TYPE_ID = this.filtreType();

        if (TYPE_ID !== null) {
            resultat = resultat.filter(x => x.type.id === TYPE_ID);
        }

        if (RECHERCHE) {
            resultat = resultat.filter(x => 
                x.nom.toLowerCase().includes(RECHERCHE) || 
                x.description?.toLowerCase().includes(RECHERCHE)
            );
        }

        return resultat;
    });

    protected listePaginee = computed(() => {
        const index = this.pageIndex();
        const size = this.pageSize();
        const debut = index * size;
        return this.listeFiltree().slice(debut, debut + size);
    });

    protected peutProposer = environment.utilisateur.droit.peutProposerLogistiqueMateriel;
    protected peutAcheter = environment.utilisateur.droit.peutAcheterLogistiqueMateriel;

    private dialog = inject(MatDialog);
    private logistiqueServ = inject(LogistiqueService);
    private snackBarServ = inject(SnackBarService);
    private dialogConfirmationServ = inject(DialogConfirmationService);

    ngOnInit(): void 
    {
        this.Lister();    
    }

    protected onPageChange(event: PageEvent): void 
    {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
    }

    protected OuvrirModalInformation(_logistique: Logistique): void 
    { 
        this.dialog.open(ModalInformation, { 
            data: { message: _logistique.description, titre: `Info ${_logistique.nom}` } 
        }); 
    }
    
    protected OuvrirModalPanierQuantite(_logistique: Logistique): void { this.dialog.open(ModalInputQuantite, { width: "60%", maxWidth: "100vw", data: _logistique }); }
    protected OuvrirModalConfirmationSupprimer(_logistique: Logistique): void { const TITRE = `Suppression de ${_logistique.nom}`; const MESSAGE = `Confirmez-vous la suppression definitif de ${_logistique.nom} ?`; this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({ next: (retour) => { if(retour) this.Supprimer(_logistique.id); } }); }
    protected OuvrirModalAjouterModifierLogistique(_logistique?: Logistique): void { const DIALOG_REF = this.dialog.open(AjouterModifierLogistique, { width: "50%", maxWidth: "100vw", data: _logistique }); DIALOG_REF.afterClosed().subscribe({ next: (retour) => { if(retour) this.Lister(); } }); }
    protected OuvrirModalStockageLogistique(_logistique: Logistique): void { this.dialog.open(ModalLogistiqueStockage, { width: "50%", maxWidth: "100vw", data: _logistique }); }

    protected FiltrerLogistiqueType(_event: MatSelectChange): void
    {   
        this.filtreType.set(_event.value);
        this.pageIndex.set(0);
    }

    protected Recherche(_event: Event): void
    {
        const VALEUR = (_event.target as HTMLInputElement).value;
        this.rechercheRequete.set(VALEUR.trim().toLowerCase());
        this.pageIndex.set(0);
    }

    private Supprimer(_idLogistique: number): void
    {
        this.btnClick.set(true);

        this.logistiqueServ.Supprimer(_idLogistique).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.snackBarServ.Ok("L'objet a été supprimé");
                this.Lister(); 
            }, 
            error: () => this.btnClick.set(false)
        });
    }

    private Lister(): void
    {
        this.logistiqueServ.Lister().subscribe({
            next: (retour: Logistique[]) => 
            {
                this.listeType.set(
                    [...new Map(retour.map(x => [x.type.id, x.type])).values()]  
                );

                for (const element of retour)
                    (element as LogistiqueTable).stock = element.listeStockageVaisseau.reduce((acc, valeurCourante) => acc + valeurCourante.quantite, 0);

                this.listeComplete.set(retour as LogistiqueTable[]);
            }
        });
    }
}