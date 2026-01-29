import { AfterViewInit, Component, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from "@angular/material/icon";
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AjouterModifierTypeLogistique } from '@modals/ajouter-modifier-type-logistique/ajouter-modifier-type-logistique';
import { Droit } from '@models/DroitGroupe';
import { TypeLogistique } from '@models/Logistique';
import { TypeLogistiqueService } from '@services/TypeLogistiqueService';

@Component({
  selector: 'app-type-logistique',
  imports: [MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIcon, MatSortModule, MatPaginatorModule],
  templateUrl: './type-logistique.html',
  styleUrl: './type-logistique.scss',
})
export class TypeLogistiquePage implements OnInit, AfterViewInit
{
    droit = input.required<Droit>();

    protected displayedColumns = ["nom", "action"];
    protected dataSource = signal<MatTableDataSource<TypeLogistique>>(new MatTableDataSource());
    protected paginator = viewChild.required(MatPaginator);
    protected sort = viewChild.required(MatSort);

    private dialog = inject(MatDialog);
    private typeLogistiqueServ = inject(TypeLogistiqueService);

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

    protected OuvrirModalAjouterModifierTypeLogistique(_typeLogistique?: TypeLogistique): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierTypeLogistique, {
            data: _typeLogistique
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
        this.typeLogistiqueServ.Lister().subscribe({
            next: (retour: TypeLogistique[]) => 
            {
                this.dataSource.update(x => {
                    x.data = retour;

                    return x;
                });
            }
        });
    }
}
