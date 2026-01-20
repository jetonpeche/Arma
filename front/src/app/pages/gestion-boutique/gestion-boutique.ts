import { AfterViewInit, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { BoutiqueAdmin } from '@models/Boutique';
import { MatIcon } from "@angular/material/icon";
import { BoutiqueService } from '@services/BoutiqueService';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ButtonLoader, InputFile } from "@jetonpeche/angular-mat-input";
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { SnackBarService } from '@services/SnackBarService';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierBoutique } from '@modals/ajouter-modifier-boutique/ajouter-modifier-boutique';
import { ETypeRessource } from '@enums/ETypeRessource';
import { FichierService } from '@services/FichierService';

@Component({
  selector: 'app-gestion-boutique',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatIcon, ButtonLoader, InputFile],
  templateUrl: './gestion-boutique.html',
  styleUrl: './gestion-boutique.scss',
})
export class GestionBoutiquePage implements OnInit, AfterViewInit
{
    protected matSort = viewChild.required(MatSort);
    protected matPaginator = viewChild.required(MatPaginator);

    protected displayedColumns: string[] = ["image", "titre", "nb", "action"];
    protected dataSource = signal<MatTableDataSource<BoutiqueAdmin>>(new MatTableDataSource());
    protected btnClick = signal<boolean>(false);

    private boutiqueServ = inject(BoutiqueService);
    private snackBarServ = inject(SnackBarService);
    private fichierServ = inject(FichierService);
    private dialog = inject(MatDialog);
    private dialogConfirmationServ = inject(DialogConfirmationService);

    ngOnInit(): void 
    {
        this.Lister();
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

    protected UploadFichier(_idBoutique: number, _fichier: File): void
    {
        this.fichierServ.Upload(_idBoutique, ETypeRessource.Boutique, _fichier).subscribe({
            next: (url: string) => 
            {
                this.snackBarServ.Ok("Le fichier a été uploadé");
                this.dataSource.update(x => 
                {
                    x.data = x.data.map(y => 
                    {
                        if (y.id == _idBoutique)
                            return { ...y, urlImageObjet: `${url}?t=${new Date().getTime()}` }
                        
                        return y;
                    });

                    return x;
                });
            }
        });
    }

    protected OuvrirModalConfirmation(_boutique: BoutiqueAdmin): void
    {
        const TITRE = `Confirmation suppression ${_boutique.titre}`;
        const MESSAGE = `Confirmez-vous la suppression de ${_boutique.titre} ?`;

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(_boutique.id);
            }
        });
    }

    protected OuvrirModalAjouterModifierBoutique(_boutique?: BoutiqueAdmin): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierBoutique, {
            width: "60%", 
            maxWidth: "100vw",
            data: _boutique
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) => 
            {
                if(retour === true)
                    this.Lister();
            }
        });
    }

    private Supprimer(_idBoutique: number): void
    {
        this.btnClick.set(true);
        this.boutiqueServ.Supprimer(_idBoutique).subscribe({
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
        this.boutiqueServ.ListerAdmin().subscribe({
            next: (retour) =>
            {
                this.dataSource.update(x => {
                    x.data = retour
                    return x;
                });
            }
        });
    }
}
