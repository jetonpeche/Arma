import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { MatListModule } from '@angular/material/list';
import { Personnage } from '@models/Personnage';
import { Grade } from '@models/Grade';
import { GradeService } from '@services/GradeService';
import { SnackBarService } from '@services/SnackBarService';
import { PersonnageService } from '@services/PersonnageService';
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms'; 
import { LogService } from '@services/LogService';
import { HistoriqueRapportCampagne } from '@models/HistoriqueRapportCampagne';

@Component({
  selector: 'app-modal-personnage-participer-operation',
  imports: [MatIconModule, MatDialogModule, ButtonLoader, MatListModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './modal-personnage-participer-operation.html',
  styleUrl: './modal-personnage-participer-operation.scss',
})
export class ModalPersonnageParticiperOperation implements OnInit
{
    protected listeGrade = signal<Grade[]>([]);
    protected liste = signal<{ id: number, nom: string, nomGrade: string, nbPoint: number, estBloquer: boolean }[]>([]);
    protected btnClick = signal(false);
    protected texteRecherche = signal<string>('');
    protected historique = signal<HistoriqueRapportCampagne | null>(null);

    protected operateursSelectionnes: number[] = []; 

    protected listeFiltree = computed(() => {
        const recherche = this.texteRecherche().toLowerCase().trim();
        if (!recherche) 
            return this.liste();
        
        return this.liste().filter(p => p.nom.toLowerCase().includes(recherche));
    });

    private listePersonnage = inject<Personnage[]>(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<ModalPersonnageParticiperOperation>);
    private gradeServ = inject(GradeService);
    private personnageServ = inject(PersonnageService);
    private logServ = inject(LogService);
    private snackBarServ  = inject(SnackBarService);

    ngOnInit(): void
    {
        this.ListerGrade();
        this.RecupererDerniereEntrer();
    }

    protected ChangerRecherche(event: any): void 
    {
        this.texteRecherche.set(event.target.value);
    }

    protected GererSelection(event: any): void 
    {
        for (let option of event.options) 
        {
            const ID = option.value;
            const EST_COCHE = option.selected;

            if (EST_COCHE && !this.operateursSelectionnes.includes(ID)) 
                this.operateursSelectionnes.push(ID);

            else if (!EST_COCHE) 
                this.operateursSelectionnes = this.operateursSelectionnes.filter(x => x != ID);
        }
    }

    protected Valider(): void
    {
        if(!this.operateursSelectionnes || this.operateursSelectionnes.length === 0)
        {
            this.snackBarServ.Erreur("Aucun opérateur sélectionné pour le rapport.");
            return;
        }

        this.btnClick.set(true);

        this.personnageServ.ModifierPoint(this.operateursSelectionnes).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.snackBarServ.Ok("Déploiement enregistré, crédits transférés.");
                this.dialogRef.close();
            },
            error: () => this.btnClick.set(false)
        });
    }

    private RecupererDerniereEntrer(): void
    {
        this.logServ.RecupererDerniereEntrerPersonnageParticiperOperation().subscribe({
            next: (retour) => this.historique.set(retour)
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
                        estBloquer: x.nbOperationGradeBloquer > 0,
                        nomGrade: x.grade?.nomRaccourci ?? "XXX",
                        nbPoint: GRADE_MAP.get(x.grade?.id) ?? 1
                    })
                ));
            }
        });
    }
}