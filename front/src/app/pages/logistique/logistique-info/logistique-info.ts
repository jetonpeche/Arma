import { AfterViewInit, Component, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import { MatSort, MatSortModule} from '@angular/material/sort';
import { MatTableDataSource, MatTableModule} from '@angular/material/table';
import { MatInputModule} from '@angular/material/input';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
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

@Component({
  selector: 'app-logistique-info',
  imports: [MatFormFieldModule, MatInputModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatTableModule, MatIcon, GridContainer, GridElement, MatSelectModule, ButtonLoader],
  templateUrl: './logistique-info.html',
  styleUrl: './logistique-info.scss',
})
export class LogistiqueInfo implements OnInit, AfterViewInit
{
    droit = input.required<Droit>();

    protected displayedColumns = ["nom", "prix", "stock", "nbDetruit", "tailleUnitaireInventaire", "typeStockage", "action"];
    protected dataSource = signal<MatTableDataSource<Logistique>>(new MatTableDataSource());
    protected listeType = signal<TypeLogistique[]>([]);
    protected btnClick = signal(false);
    protected peutProposer = environment.utilisateur.droit.peutProposerLogistiqueMateriel;
    protected peutAcheter = environment.utilisateur.droit.peutAcheterLogistiqueMateriel;

    protected paginator = viewChild.required(MatPaginator);
    protected sort = viewChild.required(MatSort);

    private dialog = inject(MatDialog);
    private logistiqueServ = inject(LogistiqueService);
    private snackBarServ = inject(SnackBarService);
    private dialogConfirmationServ = inject(DialogConfirmationService);

    ngOnInit(): void 
    {
        this.Lister();    
    }

    ngAfterViewInit(): void
    {
        this.paginator()._intl.itemsPerPageLabel = "Objet par page";

        this.dataSource.update(x => {
            x.paginator = this.paginator();
            x.sort = this.sort();
            x.filterPredicate = (data: Logistique, filter: string) => 
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

    protected OuvrirModalPanierQuantite(_logistique: Logistique): void
    {
        this.dialog.open(ModalInputQuantite, {
            data: _logistique
        });
    }

    protected OuvrirModalConfirmationSupprimer(_logistique: Logistique): void
    {
        const TITRE = `Suppression de ${_logistique.nom}`;
        const MESSAGE = `Confirmez-vous la suppression definitif de ${_logistique.nom} ?`;

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) => 
            {
                if(retour)
                    this.Supprimer(_logistique.id);
            }
        });
    }

    protected OuvrirModalAjouterModifierLogistique(_logistique?: Logistique): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierLogistique, {
            width: "50%", 
            maxWidth: "100vw",
            data: _logistique
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) => 
            {
                if(retour)
                    this.Lister();
            }
        });
    }

    protected FiltrerLogistiqueType(_event: MatSelectChange): void
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

    private Supprimer(_idLogistique: number): void
    {
        this.btnClick.set(true);

        this.logistiqueServ.Supprimer(_idLogistique).subscribe({
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
        this.logistiqueServ.Lister().subscribe({
            next: (retour: Logistique[]) => 
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
