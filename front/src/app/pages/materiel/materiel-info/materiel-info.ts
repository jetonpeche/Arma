import { AfterViewInit, Component, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AjouterModifierMateriel } from '@modals/ajouter-modifier-materiel/ajouter-modifier-materiel';
import { Materiel, TypeMateriel } from '@models/Materiel';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { MaterielService } from '@services/MaterielService';
import { SnackBarService } from '@services/SnackBarService';
import { MatIcon } from "@angular/material/icon";
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ModalInformation } from '@modals/modal-information/modal-information';
import { ModalInputQuantite } from '@modals/modal-input-quantite/modal-input-quantite';
import { Droit } from '@models/DroitGroupe';
import { environment } from '../../../../environements/environement';

@Component({
  selector: 'app-materiel-info',
  imports: [MatTableModule, MatButtonModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatSortModule, MatPaginatorModule, MatIcon, ButtonLoader, GridContainer, GridElement],
  templateUrl: './materiel-info.html'
})
export class MaterielInfoPage implements OnInit, AfterViewInit
{
    droit = input.required<Droit>();

    protected displayedColumns = ["nom", "prix", "stock", "nbPlacer", "nbDetruit", "action"];
    protected dataSource = signal<MatTableDataSource<Materiel>>(new MatTableDataSource());
    protected listeType = signal<TypeMateriel[]>([]);
    protected btnClick = signal(false);
    protected peutProposer = environment.utilisateur.droit.peutProposerLogistiqueMateriel;
    protected peutAcheter = environment.utilisateur.droit.peutAcheterLogistiqueMateriel;

    protected paginator = viewChild.required(MatPaginator);
    protected sort = viewChild.required(MatSort);

    private dialog = inject(MatDialog);
    private materielServ = inject(MaterielService);
    private snackBarServ = inject(SnackBarService);
    private dialogConfirmationServ = inject(DialogConfirmationService);

    ngOnInit(): void 
    {
        this.Lister();
    }

    ngAfterViewInit(): void
    {
        this.paginator()._intl.itemsPerPageLabel = "Matériel par page";

        this.dataSource.update(x => {
            x.paginator = this.paginator();
            x.sort = this.sort();
            x.filterPredicate = (data: Materiel, filter: string) => 
            {
                const INFO = JSON.parse(filter);

                if(INFO.idType != null)
                    return data.type.id == INFO.idType;

                if(INFO.valeur == "")
                    return true;

                const dataStr = JSON.stringify(data).toLowerCase();

                return dataStr.includes(INFO.valeur);
            }

            return x;
        });
    }
    
    protected OuvrirModalPanierQuantite(_materiel: Materiel): void
    {
        this.dialog.open(ModalInputQuantite, {
            data: _materiel
        });
    }

    protected OuvrirModalInformation(_materiel: Materiel): void
    {
        this.dialog.open(ModalInformation, {
            data: {
                message: _materiel.description,
                titre: `Info ${_materiel.nom}`
            }
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
        this.dataSource.update(x => {
            x.filter = JSON.stringify({ idType: _event.value, valeur: "" })

            return x;
        });
    }

    protected Recherche(_event: Event): void
    {
        const VALEUR = (_event.target as HTMLInputElement).value;

        this.dataSource.update(x => {
            x.filter = JSON.stringify({ idType: null, valeur: VALEUR.trim().toLowerCase() }) 
            return x;
        });
    }

    private Supprimer(_idMateriel: number): void
    {
        this.btnClick.set(true);

        this.materielServ.Supprimer(_idMateriel).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.snackBarServ.Ok("L'objet a été supprimé");
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

                this.dataSource.update(x => {
                    x.data = retour;

                    return x;
                });
            }
        });
    }
}
