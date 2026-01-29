import { AfterViewInit, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { CdkTableModule } from "@angular/cdk/table";
import { SnackBarService } from '@services/SnackBarService';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { MatDialog } from '@angular/material/dialog';
import { PlaneteService } from '@services/PlaneteService';
import { PlaneteOrigine } from '@models/PlaneteOrigine';
import { AjouterModifierPlaneteOrigine } from '@modals/ajouter-modifier-planete-origine/ajouter-modifier-planete-origine';
import { AuthentificationService } from '@services/AuthentificationService';
import { Droit } from '@models/DroitGroupe';
import { EUrl } from '@enums/EUrl';

@Component({
    selector: 'app-planete-origine',
    imports: [MatTableModule, MatSortModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatIconModule, MatButtonModule, ButtonLoader, CdkTableModule],
    templateUrl: './planete-origine.html',
    styleUrl: './planete-origine.scss',
})
export class PlaneteOriginePage implements OnInit, AfterViewInit
{
    protected matSort = viewChild.required(MatSort);
    protected matPaginator = viewChild.required(MatPaginator);

    protected displayedColumns: string[] = ["nom", "action"];
    protected dataSource = signal<MatTableDataSource<PlaneteOrigine>>(new MatTableDataSource());
    protected btnClick = signal<boolean>(false);
    protected droit: Droit;

    private snackBarServ = inject(SnackBarService);
    private dialog = inject(MatDialog);
    private dialogServ = inject(DialogConfirmationService);    
    private planeteServ = inject(PlaneteService);
    private authServ = inject(AuthentificationService);

    ngOnInit(): void
    {
        this.Lister();
        this.droit = this.authServ.RecupererDroit(EUrl.PlaneteOrigine);
    }

    ngAfterViewInit(): void 
    {
        this.matPaginator()._intl.itemsPerPageLabel = "Planète par page";

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

    protected OuvrirModalConfirmation(_planete: PlaneteOrigine): void
    {
        const TITRE = `Supprimer planète d'origine ${_planete.nom}`;
        const MESSAGE = `Confirmez-vous la suppression definitif de ${_planete.nom} ?`;

        this.dialogServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(_planete.id);
            }
        });
    }

    protected OuvrirModalAjouterModifierPlanete(_planete?: PlaneteOrigine): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierPlaneteOrigine, {
            data: _planete
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Lister();
            }
        })
    }

    private Supprimer(_idPlanete: number): void
    {
        this.btnClick.set(true);
        this.planeteServ.Supprimer(_idPlanete).subscribe({
            next: () =>
            {
                this.dataSource.update(x => {
                    x.data = x.data.filter(x => x.id != _idPlanete);

                    return x;
                });

                this.btnClick.set(false);

                this.snackBarServ.Ok("La planète a été supprimée");
            },
            error: () => this.btnClick.set(false)
        });
    }

    private Lister(): void
    {
        this.planeteServ.Lister().subscribe({
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
