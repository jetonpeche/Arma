import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AutocompleteDataSource, ButtonLoader, InputText, InputTextarea, InputAutocomplete } from "@jetonpeche/angular-mat-input";
import { Specialite } from '@models/Specialite';
import { SnackBarService } from '@services/SnackBarService';
import { SpecialiteService } from '@services/SpecialiteService';
import { MatCheckbox } from "@angular/material/checkbox";
import { GradeService } from '@services/GradeService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";

@Component({
  selector: 'app-ajouter-modifier-specialite',
  imports: [ReactiveFormsModule, MatDialogModule, ButtonLoader, InputText, InputTextarea, MatCheckbox, GridContainer, GridElement, InputAutocomplete],
  templateUrl: './ajouter-modifier-specialite.html',
  styleUrl: './ajouter-modifier-specialite.scss',
})
export class AjouterModifierSpecialite 
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected listeGrade = signal<AutocompleteDataSource[]>([]);

    private matDialogData: Specialite = inject(MAT_DIALOG_DATA);
    private specialiteServ = inject(SpecialiteService);
    private gradeServ = inject(GradeService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierSpecialite>);

    ngOnInit(): void
    {
        this.ListerGrade();

        if(this.matDialogData)
            this.labelBtn.set("Modifier");

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            raccourci: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(5)]),
            idGrade: new FormControl(this.matDialogData?.grade.id ?? 0, [Validators.required]),
            estNavy: new FormControl(this.matDialogData?.estNavy ?? false),
            description: new FormControl(this.matDialogData?.description, [Validators.maxLength(300)])
        });
    }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.specialiteServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
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
        this.gradeServ.ListerLeger().subscribe({
            next: (retour) => {
                this.listeGrade.set(retour.map(x => ({ value: x.id, display: x.nom })));
            }
        });
    }
}
