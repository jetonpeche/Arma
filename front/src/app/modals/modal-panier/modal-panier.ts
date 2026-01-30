import { AfterViewInit, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { ETypeObjetProposer } from '@enums/ETypeObjetProposer';
import { ButtonLoader } from '@jetonpeche/angular-mat-input';
import { ModalInputQuantite } from '@modals/modal-input-quantite/modal-input-quantite';
import { Panier } from '@models/Panier';
import { ObjetProposerRequete } from '@models/PropositionAchat';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { PanierService } from '@services/PanierService';
import { PropositionAchatService } from '@services/PropositionAchatService';
import { SnackBarService } from '@services/SnackBarService';
import { environment } from '../../../environements/environement';
import { Authentifier } from '@models/Authentification';

@Component({
  selector: 'app-modal-panier',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, ButtonLoader, MatDialogModule],
  templateUrl: './modal-panier.html',
  styleUrl: './modal-panier.scss',
})
export class ModalPanier implements OnInit, AfterViewInit
{
    protected matSort = viewChild.required(MatSort);
    protected matPaginator = viewChild.required(MatPaginator);

    protected displayedColumns = ["nom", "type", "quantite", "prixUnitaire", "prixTotal", "action"];
    protected dataSource = signal(new MatTableDataSource<Panier>());
    protected btnClick = signal<boolean>(false);
    protected eTypeObjetProposer = ETypeObjetProposer;

    protected peutAcheterDirect = (environment.utilisateur as Authentifier).droit.peutAcheterLogistiqueMateriel;

    private dialog = inject(MatDialog);
    private panierServ = inject(PanierService);
    private snackBarServ = inject(SnackBarService);
    private propositionAchatServ = inject(PropositionAchatService);
    private dialogConfirmationServ = inject(DialogConfirmationService);

    ngOnInit(): void 
    {
        this.dataSource.update(x => {
            x.data = this.panierServ.Lister()
            return x;
        });
    }

    ngAfterViewInit(): void
    {
        this.matPaginator()._intl.itemsPerPageLabel = "Objet par page";

        this.dataSource.update(x => {
            x.sort = this.matSort();
            x.paginator = this.matPaginator();
            return x;
        });
    }

    protected Recherche(_event: Event): void
    {
        const filterValue = (_event.target as HTMLInputElement).value;

        this.dataSource.update(x => {
            x.filter = filterValue.trim().toLowerCase()
            return x;
        });
    }

    protected SupprimerObjetPanier(_objet: Panier): void
    {
        this.panierServ.Supprimer(_objet);
        this.dataSource.update(x => 
        {
            x.data = x.data.filter(y => !(y.idType == _objet.idType && y.type == _objet.type));    
            return x;
        });
    }

    protected OuvrirModalQuantite(_objet: Panier): void
    {
        const DIALOG_REF = this.dialog.open(ModalInputQuantite, {
            data: _objet
        });

        DIALOG_REF.afterClosed().subscribe({
            next: () => 
            {
                this.dataSource.update(x => {
                    x.data = this.panierServ.Lister()
                    return x;
                });
            }
        });
    }

    protected OuvrirModalConfirmation(): void
    {
        const TITRE = "Vider le panier";
        const MESSAGE = "Confirmez vous de vouloir vider le panier ?";
        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(!retour)
                    return;

                this.panierServ.Vider();
                this.dataSource.update(x => {
                    x.data = []
                    return x;
                });
            }
        });
    }

    protected OuvrirModalConfirmationAchat(): void
    {
        const TITRE = this.peutAcheterDirect ? "Acheter" : "Valider le panier";
        const MESSAGE = this.peutAcheterDirect? "Confirmez vous vos achats ?" : "Confirmez vous la proposition d'achat ?";

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.peutAcheterDirect ? this.Acheter() : this.ProposerAchat();
            }
        });
    }

    private Acheter(): void
    {
        this.btnClick.set(true);

        let liste: ObjetProposerRequete[] = this.dataSource().data
            .map(x => ({ 
                type: x.type, 
                idType: x.idType, 
                quantite: x.quantite
            })
        );

        this.propositionAchatServ.Acheter(liste).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.panierServ.Vider();
                this.dataSource.update(x => {
                    x.data = [];
                    return x;
                });

                this.snackBarServ.Ok("Le panier a été acheté");
            },
            error: () => this.btnClick.set(false)
        });
    }

    private ProposerAchat(): void
    {
        this.btnClick.set(true);

        let liste: ObjetProposerRequete[] = this.dataSource().data
            .map(x => ({ 
                type: x.type, 
                idType: x.idType, 
                quantite: x.quantite  
            })
        );

        this.propositionAchatServ.Ajouter(liste).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.panierServ.Vider();
                this.dataSource.update(x => {
                    x.data = [];
                    return x;
                });

                this.snackBarServ.Ok("La liste a été envoyée en proposition");
            },
            error: () => this.btnClick.set(false)
        });
    }
}
