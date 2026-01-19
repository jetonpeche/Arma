import { AfterViewInit, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AjouterModifierTypeMateriel } from '@modals/ajouter-modifier-type-materiel/ajouter-modifier-type-materiel';
import { TypeMateriel } from '@models/Materiel';
import { TypeMaterielService } from '@services/TypeMaterielService';

@Component({
  selector: 'app-type-materiel',
  imports: [MatTableModule, MatIcon, MatButtonModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSortModule],
  templateUrl: './type-materiel.html',
  styleUrl: './type-materiel.scss',
})
export class TypeMaterielPage implements OnInit, AfterViewInit
{
    protected displayedColumns = ["nom", "action"];
    protected dataSource = signal<MatTableDataSource<TypeMateriel>>(new MatTableDataSource());
    protected paginator = viewChild.required(MatPaginator);
    protected sort = viewChild.required(MatSort);

    private dialog = inject(MatDialog);
    private typeMaterielServ = inject(TypeMaterielService);

    ngOnInit(): void
    {
        this.Lister();
    }

    ngAfterViewInit(): void
    {
        this.paginator()._intl.itemsPerPageLabel = "Type par page";

        this.dataSource.update(x => {
            x.paginator = this.paginator();
            x.sort = this.sort();

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

    protected OuvrirModalAjouterModifierTypeMateriel(_typeMateriel?: TypeMateriel): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierTypeMateriel, {
            data: _typeMateriel
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Lister();
            }
        });
    }

    private Lister(): void
    {
        this.typeMaterielServ.Lister().subscribe({
            next: (retour: TypeMateriel[]) => 
            {
                this.dataSource.update(x => {
                    x.data = retour;

                    return x;
                });
            }
        });
    }
}
