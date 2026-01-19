import { AfterViewInit, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Specialite } from '@models/Specialite';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { SnackBarService } from '@services/SnackBarService';
import { SpecialiteService } from '@services/SpecialiteService';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { AjouterModifierSpecialite } from '@modals/ajouter-modifier-specialite/ajouter-modifier-specialite';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-specialite',
  imports: [MatTableModule, MatFormFieldModule, MatSortModule, MatInputModule, MatButtonModule, MatIconModule, ButtonLoader, MatPaginator],
  templateUrl: './specialite.html',
  styleUrl: './specialite.scss',
})
export class SpecialitePage implements OnInit, AfterViewInit
{
    protected matSort = viewChild.required(MatSort);
    protected matPaginator = viewChild.required(MatPaginator);

    protected displayedColumns: string[] = ["nom", "action"];
    protected dataSource = signal<MatTableDataSource<Specialite>>(new MatTableDataSource());
    protected btnClick = signal<boolean>(false);

    private dialogServ = inject(DialogConfirmationService); 
    private specialiteServ = inject(SpecialiteService);
    private snackBarServ = inject(SnackBarService);
    private dialog = inject(MatDialog);

    ngOnInit(): void 
    {
        this.Lister();
    }

    ngAfterViewInit(): void 
    {
        this.matPaginator()._intl.itemsPerPageLabel = "Spécialité par page";

        this.dataSource.update(x => {
            x.sort = this.matSort();
            x.paginator = this.matPaginator();
            return x;
        });
    }

    protected Recherche(_event: Event): void
    {
        const VALEUR = (_event.target as HTMLInputElement).value;

        this.dataSource.update(x => {
            x.filter = VALEUR.trim().toLowerCase()
            return x;
        });
    }

    protected OuvrirModalAjouterModifierSpecialite(_specialite?: Specialite): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierSpecialite, {
            width: "50%", 
            maxWidth: "100vw",
            data: _specialite
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Lister();
            }
        });
    }

    protected OuvrirModalConfirmation(_specialite: Specialite): void
    {
        const TITRE = `Supprimer la spécialisté ${_specialite.nom}`;
        const MESSAGE = `Confirmez-vous la suppression definitif de ${_specialite.nom} ?`;

        this.dialogServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(_specialite.id);
            }
        });
    }

    private Supprimer(_idSpecialiste: number): void
    {
        this.btnClick.set(true);
        this.specialiteServ.Supprimer(_idSpecialiste).subscribe({
            next: () => 
            {
                this.dataSource.update(x => {
                    x.data = x.data.filter(x => x.id != _idSpecialiste);

                    return x;
                });

                this.btnClick.set(false);

                this.snackBarServ.Ok("La spécialité a été supprimée");
            }, error: () => this.btnClick.set(false)
        });
    }

    private Lister(): void
    {
        this.specialiteServ.Lister().subscribe({
            next: (retour) => 
            {
                this.dataSource.update(x => {
                    x.data = retour;

                    return x;
                });
            }
        });
    }
}
