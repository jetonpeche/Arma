import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { AjouterModifierMateriel } from '@modals/ajouter-modifier-materiel/ajouter-modifier-materiel';
import { Materiel, TypeMateriel } from '@models/Materiel';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { MaterielService } from '@services/MaterielService';
import { SnackBarService } from '@services/SnackBarService';
import { MatIconModule } from "@angular/material/icon";
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ModalInformation } from '@modals/modal-information/modal-information';
import { ModalInputQuantite } from '@modals/modal-input-quantite/modal-input-quantite';
import { Droit } from '@models/DroitGroupe';
import { environment } from '../../../../environements/environement';

@Component({
  selector: 'app-materiel-info',
  imports: [MatButtonModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatPaginatorModule, MatIconModule, MatTooltipModule, ButtonLoader, GridContainer, GridElement],
  templateUrl: './materiel-info.html',
  styleUrl: './materiel-info.scss'
})
export class MaterielInfoPage implements OnInit
{
    droit = input.required<Droit>();

    // État géré par des signaux
    protected listeComplete = signal<Materiel[]>([]);
    protected listeType = signal<TypeMateriel[]>([]);
    protected btnClick = signal(false);

    // Signaux de filtrage
    protected rechercheRequete = signal<string>('');
    protected filtreType = signal<number | null>(null);

    // Signaux de pagination
    protected pageSize = signal<number>(20);
    protected pageIndex = signal<number>(0);

    // 1. Filtrage dynamique
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

    // 2. Découpage pour la pagination
    protected listePaginee = computed(() => {
        const index = this.pageIndex();
        const size = this.pageSize();
        const debut = index * size;
        return this.listeFiltree().slice(debut, debut + size);
    });

    protected peutProposer = environment.utilisateur.droit.peutProposerLogistiqueMateriel;
    protected peutAcheter = environment.utilisateur.droit.peutAcheterLogistiqueMateriel;

    private dialog = inject(MatDialog);
    private materielServ = inject(MaterielService);
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

    protected OuvrirModalPanierQuantite(_materiel: Materiel): void
    {
        this.dialog.open(ModalInputQuantite, {
            width: "60%", 
            maxWidth: "100vw",
            data: _materiel
        });
    }
    
    protected OuvrirModalConfirmationSupprimer(_materiel: Materiel): void
    {
        const TITRE = `Suppression de ${_materiel.nom}`;
        const MESSAGE = `Confirmez-vous la suppression definitif de ${_materiel.nom} ?`;

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) => 
            {
                if(retour)
                    this.Supprimer(_materiel.id);
            }
        });
    }

    protected OuvrirModalAjouterModifierMateriel(_materiel?: Materiel): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierMateriel, {
            width: "50%", 
            maxWidth: "100vw",
            data: _materiel
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) => 
            {
                if(retour)
                    this.Lister();
            }
        });
    }

    protected FiltrerMaterielType(_event: MatSelectChange): void
    {   
        this.filtreType.set(_event.value);
        this.pageIndex.set(0); // Réinitialisation de la pagination
    }

    protected Recherche(_event: Event): void
    {
        const VALEUR = (_event.target as HTMLInputElement).value;
        this.rechercheRequete.set(VALEUR.trim().toLowerCase());
        this.pageIndex.set(0); // Réinitialisation de la pagination
    }

    private Supprimer(_idMateriel: number): void
    {
        this.btnClick.set(true);

        this.materielServ.Supprimer(_idMateriel).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.snackBarServ.Ok("L'objet a été supprimé");
                this.Lister(); // Mise à jour de la grille
            }, 
            error: () => this.btnClick.set(false)
        });
    }

    private Lister(): void
    {
        this.materielServ.Lister().subscribe({
            next: (retour: Materiel[]) => 
            {
                this.listeType.set(
                    [...new Map(retour.map(x => [x.type.id, x.type])).values()]  
                );

                this.listeComplete.set(retour);
            }
        });
    }
}