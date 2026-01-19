import { AfterViewInit, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { BoutiqueAdmin } from '@models/Boutique';
import { MatIcon } from "@angular/material/icon";
import { BoutiqueService } from '@services/BoutiqueService';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-gestion-boutique',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatIcon],
  templateUrl: './gestion-boutique.html',
  styleUrl: './gestion-boutique.scss',
})
export class GestionBoutique implements OnInit, AfterViewInit
{
    protected matSort = viewChild.required(MatSort);
    protected matPaginator = viewChild.required(MatPaginator);

    protected displayedColumns: string[] = ["icon", "nom", "fonction", "nbOperationRequis", "info", "action"];
    protected dataSource = signal<MatTableDataSource<BoutiqueAdmin>>(new MatTableDataSource());
    protected btnClick = signal<boolean>(false);

    private boutiqueServ = inject(BoutiqueService);

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

    protected OuvrirModalAjouterModifierBoutique(_boutique?: BoutiqueAdmin): void
    {
        
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
