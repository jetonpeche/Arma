import { AfterViewInit, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { Grade } from '@models/Grade';
import { GradeService } from '@services/GradeService';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ButtonLoader, InputFile } from "@jetonpeche/angular-mat-input";
import { CdkTableModule } from "@angular/cdk/table";
import { SnackBarService } from '@services/SnackBarService';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierGrade } from '@modals/ajouter-modifier-grade/ajouter-modifier-grade';
import { ETypeRessource } from '@enums/ETypeRessource';
import { FichierService } from '@services/FichierService';
import { AuthentificationService } from '@services/AuthentificationService';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';

@Component({
  selector: 'app-grade-page',
  imports: [MatTableModule, MatSortModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatIconModule, MatButtonModule, ButtonLoader, CdkTableModule, InputFile],
  templateUrl: './grade-page.html',
  styleUrl: './grade-page.scss',
})
export class GradePage implements OnInit, AfterViewInit
{
    protected matSort = viewChild.required(MatSort);
    protected matPaginator = viewChild.required(MatPaginator);

    protected displayedColumns: string[] = ["icon", "nom", "fonction", "nbOperationRequis", "info", "action"];
    protected dataSource = signal<MatTableDataSource<Grade>>(new MatTableDataSource());
    protected btnClick = signal<boolean>(false);

    private gradeServ = inject(GradeService);
    private snackBarServ = inject(SnackBarService);
    private fichierServ = inject(FichierService);
    private dialog = inject(MatDialog);
    private authServ = inject(AuthentificationService);
    private dialogServ = inject(DialogConfirmationService);

    protected droit: Droit;
    protected droitFichier: Droit;

    ngOnInit(): void 
    {
        this.Lister();
        
        this.droit = this.authServ.RecupererDroit(EUrl.Grade);
        this.droitFichier = this.authServ.RecupererDroit(EUrl.UploadFichier);
    }

    ngAfterViewInit(): void 
    {
        this.matPaginator()._intl.itemsPerPageLabel = "Grade par page";

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

    protected UploadFichier(_idGrade: number, _fichier: File): void
    {
        this.fichierServ.Upload(_idGrade, ETypeRessource.Grade, _fichier).subscribe({
            next: (url: string) => 
            {
                this.snackBarServ.Ok("Le fichier a été uploadé");
                this.dataSource.update(x => 
                {
                    x.data = x.data.map(p => 
                    {
                        if (p.id == _idGrade)
                            return { ...p, urlFichierIcone: `${url}?t=${new Date().getTime()}` }
                        
                        return p;
                    });

                    return x;
                });
            }
        });
    }

    protected OuvrirModalAjouterModifierGrade(_grade?: Grade): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierGrade, {
            data: _grade
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Lister();
            }
        });
    }

    protected OuvrirModalConfirmation(_garde: Grade): void
    {
        const TITRE = `Supprimer grade ${_garde.nom}`;
        const MESSAGE = `Confirmez-vous la suppression definitif de ${_garde.nom} ?`;

        this.dialogServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(_garde.id);
            }
        });
    }

    private Supprimer(_idGrade: number): void
    {
        this.btnClick.set(true);
        this.gradeServ.Supprimer(_idGrade).subscribe({
            next: () =>
            {
                this.dataSource.update(x => {
                    x.data = x.data.filter(x => x.id != _idGrade);

                    return x;
                });

                this.btnClick.set(false);

                this.snackBarServ.Ok("Le garde a été supprimé");
            },
            error: () => this.btnClick.set(false)
        });
    }

    private Lister(): void
    {
        this.gradeServ.Lister().subscribe({
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
