import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AutocompleteDataSource, ButtonLoader, InputText, InputTextarea, InputAutocomplete } from "@jetonpeche/angular-mat-input";
import { Specialite } from '@models/Specialite';
import { SnackBarService } from '@services/SnackBarService';
import { SpecialiteService } from '@services/SpecialiteService';
import { GradeService } from '@services/GradeService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-ajouter-modifier-specialite',
  imports: [ReactiveFormsModule, MatSelectModule, MatDialogModule, ButtonLoader, InputText, InputTextarea, GridContainer, GridElement, InputAutocomplete],
  templateUrl: './ajouter-modifier-specialite.html',
  styleUrl: './ajouter-modifier-specialite.scss',
})
export class AjouterModifierSpecialite 
{
    protected form: FormGroup;
    protected cacherEstNavy = signal(false);
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected estCategorieParentClicker = signal(false);
    protected listeGrade = signal<AutocompleteDataSource[]>([]);
    protected listeSpecialite = signal<AutocompleteDataSource[]>([]);

    private matDialogData: { estNavy: boolean | null, specialite: Specialite | null, estCategorieParentClicker: boolean, listeSpecialite: { id: number, nom: string }[], idParent: number } = inject(MAT_DIALOG_DATA);
    private specialiteServ = inject(SpecialiteService);
    private gradeServ = inject(GradeService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierSpecialite>);

    ngOnInit(): void
    {
        const DATA = this.matDialogData;
        const SPE = DATA.specialite;

        this.ListerGrade();
        this.listeSpecialite.set(DATA.listeSpecialite.map(x => ({ value: x.id, display: x.nom })));
        
        this.labelBtn.set(SPE ? "Modifier" : "Ajouter");
        this.estCategorieParentClicker.set(DATA.estCategorieParentClicker);

        const parentsParDefaut = SPE ? SPE.idParents : (DATA.idParent ? [DATA.idParent] : []);

        this.form = new FormGroup({
            nom: new FormControl(SPE?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            raccourci: new FormControl(SPE?.raccourci ?? "", [Validators.required, Validators.maxLength(5)]),
            idGrade: new FormControl(SPE?.grade.id ?? null, [Validators.required]),
            listeIdParent: new FormControl(parentsParDefaut),
            description: new FormControl(SPE?.description ?? "", [Validators.maxLength(300)])
        });

        if(this.estCategorieParentClicker())
        {
            this.form.addControl("categorie", 
                new FormControl(SPE?.categorie ?? "", [Validators.required, Validators.maxLength(70)])
            );
        }
    }

    protected NomSpecialite(_idSpecialite: number): string
    {
        const SPECIALITE = this.listeSpecialite().find(t => t.value === _idSpecialite);
        return SPECIALITE?.display ?? "";
    }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        if(this.matDialogData.specialite)
        {
            this.specialiteServ.Modifier(this.matDialogData.specialite.id, this.form.value).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("La spécialité a été modifiée");
                    this.btnClick.set(false);
                    this.dialogRef.close(true);
                },error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.specialiteServ.Ajouter(this.form.value).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("La spécialité a été ajoutée");
                    this.btnClick.set(false);
                    this.dialogRef.close(true);
                }, error: () => this.btnClick.set(false)
            });
        }
    }

    private ListerGrade(): void
    {
        const mode = this.matDialogData.estNavy === true ? "navy" : 
                    (this.matDialogData.estNavy === false ? "marines" : "tout");

        this.gradeServ.ListerLeger(mode).subscribe({
            next: (retour) => {
                this.listeGrade.set(retour.map(x => ({ value: x.id, display: x.nom })));
            }
        });
    }
}
