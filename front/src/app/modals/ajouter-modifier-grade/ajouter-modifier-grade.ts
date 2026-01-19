import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonLoader, InputText, InputNumber, InputAutocomplete, AutocompleteDataSource } from "@jetonpeche/angular-mat-input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Grade } from '@models/Grade';
import { GradeService } from '@services/GradeService';
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-ajouter-modifier-grade',
  imports: [MatDialogModule, MatCheckboxModule, ReactiveFormsModule, ButtonLoader, GridContainer, GridElement, InputText, InputNumber, InputAutocomplete],
  templateUrl: './ajouter-modifier-grade.html',
  styleUrl: './ajouter-modifier-grade.scss',
})
export class AjouterModifierGrade implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected liste: AutocompleteDataSource[] = [{
        value: 0,
        display: "Les deux"
    },
    {
        value: 1,
        display: "Navy"
    },
    {
        value: 2,
        display: "Marines"
    }];

    private matDialogData = inject<Grade>(MAT_DIALOG_DATA);
    private gradeServ = inject(GradeService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierGrade>);

    ngOnInit(): void
    {
        if(this.matDialogData)
            this.labelBtn.set("Modifier");

        this.form = new FormGroup({
            nom: new FormControl(
                this.matDialogData?.nom ?? "", 
                [Validators.required, Validators.maxLength(100)]
            ),
            fonction: new FormControl<string | null>(
                this.matDialogData?.fonction, 
                [Validators.maxLength(300)]
            ),
            ordre: new FormControl<number>(
                this.matDialogData?.ordre ?? 0, 
                [Validators.required, Validators.min(0)]
            ),
            nbOperationRequis: new FormControl<number>(
                this.matDialogData?.nbOperationRequis ?? 0, 
                [Validators.min(0)]
            ),
            nbPlace: new FormControl<number>(
                this.matDialogData?.nbPlace ?? 0, 
                [Validators.min(0)]
            ),
            nbPointBoutiqueGagnerParOperation: new FormControl<number>(
                this.matDialogData?.nbPointBoutiqueGagnerParOperation ?? 0, 
                [Validators.required, Validators.min(0)]
            ),
            conserne: new FormControl<number>(
                this.matDialogData?.conserne ?? 0, 
                [Validators.required]
            ),
            candidatureRequise: new FormControl(
                this.matDialogData?.candidatureRequise ?? false
            ),
            estHonorifique: new FormControl(
                this.matDialogData?.estHonorifique ?? false
            )
        });
    }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
            return;
     
        this.btnClick.set(true);
        
        if(this.matDialogData)
        {
            this.gradeServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("Le grade a été modifié");
                    this.dialogRef.close(true);
                }, error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.gradeServ.Ajouter(this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("Le grade a été ajouté");
                    this.dialogRef.close(true);
                }, error: () => this.btnClick.set(false)
            });
        }
    }
}
