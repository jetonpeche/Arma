import { Component, inject, input, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import {MatListModule, MatListOption, MatSelectionList} from '@angular/material/list';
import { Personnage } from '@models/Personnage';
import { Grade } from '@models/Grade';
import { GradeService } from '@services/GradeService';
import { SnackBarService } from '@services/SnackBarService';
import { PersonnageService } from '@services/PersonnageService';

@Component({
  selector: 'app-modal-personnage-participer-operation',
  imports: [MatDialogModule, ButtonLoader, MatListModule],
  templateUrl: './modal-personnage-participer-operation.html',
  styleUrl: './modal-personnage-participer-operation.scss',
})
export class ModalPersonnageParticiperOperation implements OnInit
{
    protected listeGrade = signal<Grade[]>([]);
    protected liste = signal<{ id: number, nom: string, nomGrade: string, nbPoint: number }[]>([]);
    protected btnClick = signal(false);

    private listePersonnage = inject<Personnage[]>(MAT_DIALOG_DATA);
    private gradeServ = inject(GradeService);
    private personnageServ = inject(PersonnageService);
    private snackBarServ  = inject(SnackBarService);

    ngOnInit(): void
    {
        this.ListerGrade();
    }

    protected Valider(_matSelection: MatSelectionList): void
    {
        if(!_matSelection._value)
        {
            this.snackBarServ.Erreur("Aucun personnage choisi");
            return;
        }

        this.btnClick.set(true);

        const LISTE = _matSelection._value.map(x => +x);

        this.personnageServ.ModifierPoint(LISTE).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.snackBarServ.Ok("Les points ont été donnés");
            },
            error: () => this.btnClick.set(false)
        });
    }

    private ListerGrade(): void
    {
        this.gradeServ.Lister().subscribe({
            next: (retour) =>
            {
                this.listeGrade.set(retour);

                const GRADE_MAP = new Map(retour.map(x => [x.id, x.nbPointBoutiqueGagnerParOperation]));

                this.liste.set(this.listePersonnage.map(x => ({
                        id: x.id,
                        nom: x.nom,
                        nomGrade: x.grade.nom,
                        nbPoint: GRADE_MAP.get(x.grade.id)
                    })
                ));
            }
        });
    }
}
