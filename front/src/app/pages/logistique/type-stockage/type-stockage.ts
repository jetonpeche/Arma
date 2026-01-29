import { Component, inject, input, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from "@angular/material/icon";
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TypeStockageLogistique } from '@models/Logistique';
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { TypeStockageLogistiqueService } from '@services/TypeStockageLogistiqueService';
import { AjouterModifierTypeStockageLogistique } from '@modals/ajouter-modifier-type-stockage-logistique/ajouter-modifier-type-logistique';
import { Droit } from '@models/DroitGroupe';

@Component({
  selector: 'app-type-stockage',
  imports: [MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIcon, MatSortModule, MatPaginatorModule],
  templateUrl: './type-stockage.html',
  styleUrl: './type-stockage.scss',
})
export class TypeStockagePage
{
    droit = input.required<Droit>();

    protected displayedColumns = ["nom", "action"];
    protected dataSource = signal<MatTableDataSource<TypeStockageLogistique>>(new MatTableDataSource());

    protected paginator = viewChild.required(MatPaginator);
    protected sort = viewChild.required(MatSort);

    private dialog = inject(MatDialog);
    private typeStockageLogistiqueServ = inject(TypeStockageLogistiqueService);

    ngOnInit(): void
    {
        this.Lister();    
    }
    
    ngAfterViewInit(): void
    {
        this.paginator()._intl.itemsPerPageLabel = "Type de stockage par page";

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
    
    protected OuvrirModalAjouterModifierTypeStockageLogistique(_typeStockageLogistique?: TypeStockageLogistique): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierTypeStockageLogistique, {
            data: _typeStockageLogistique
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
        this.typeStockageLogistiqueServ.Lister().subscribe({
            next: (retour: TypeStockageLogistique[]) => 
            {
                this.dataSource.update(x => {
                    x.data = retour;

                    return x;
                });
            }
        });
    }
}
