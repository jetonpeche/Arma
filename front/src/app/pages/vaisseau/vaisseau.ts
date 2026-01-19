import { AfterViewInit, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Vaisseau, VaisseauArmement } from '@models/Vaisseau';
import { VaisseauService } from '@services/VaisseauService';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { MatDialog } from '@angular/material/dialog';
import { ModalStockage } from './modal-stockage/modal-stockage';
import { AjouterModifierVaisseau } from '@modals/ajouter-modifier-vaisseau/ajouter-modifier-vaisseau';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-vaisseau',
  imports: [MatIcon, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSortModule, MatPaginatorModule, ButtonLoader],
  templateUrl: './vaisseau.html',
  styleUrl: './vaisseau.scss',
})
export class VaisseauPage implements OnInit, AfterViewInit
{
    protected matSort = viewChild.required(MatSort);
    protected matPaginator = viewChild.required(MatPaginator);

    protected displayedColumns: string[] = [
        "nom", "prix", "stock", "role",  "equipage", 
        "armement", "vitesse", "blindage", "action"
    ];
    protected dataSource = signal<MatTableDataSource<Vaisseau>>(new MatTableDataSource());
    protected btnClick = signal<boolean>(false);

    private vaisseauServ = inject(VaisseauService);
    private snackBarServ = inject(SnackBarService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private dialog = inject(MatDialog);

    ngOnInit(): void 
    {
        this.ListerVaisseau();    
    }

    ngAfterViewInit(): void
    {
        this.matPaginator()._intl.itemsPerPageLabel = "Vaisseau par page";

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

    protected ListerArmementString(_listeArmement: VaisseauArmement[]): string
    {
        return _listeArmement.map(x => `${x.nombre} ${x.nom}`).join(" / ");
    }

    protected OuvrirModalStockage(_vaisseau: Vaisseau): void
    {
        this.dialog.open(ModalStockage, {
            data: _vaisseau
        });
    }

    protected OuvrirModalConfirmationAcheterVaisseau(_vaisseau: Vaisseau): void
    {
        const TITRE = `Acheter un vaisseau`;
        const MESSAGE = `Confirmez-vous l'achat de ${_vaisseau.nom} ?`;

        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.AcheterVaisseau(_vaisseau.id);
            }
        });
    }

    protected OuvrirModalAjouterModifierVaisseau(_vaisseau?: Vaisseau): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierVaisseau, {
            width: "50%", 
            maxWidth: "100vw",
            data: _vaisseau
        });

        DIALOG_REF.afterClosed().subscribe({
            next: () => this.ListerVaisseau()
        });
    }

    private AcheterVaisseau(_idVaisseau: number): void
    {
        this.btnClick.set(true);

        this.vaisseauServ.Acheter(_idVaisseau).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.snackBarServ.Ok("Le vaisseau a été acheté");

                this.dataSource.update(x => {
                    x.data.find(x => x.id == _idVaisseau).stock += 1;

                    return x;
                });
            },
            error: () => this.btnClick.set(false)
        });
    }

    private ListerVaisseau(): void
    {
        this.vaisseauServ.Lister().subscribe({
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
