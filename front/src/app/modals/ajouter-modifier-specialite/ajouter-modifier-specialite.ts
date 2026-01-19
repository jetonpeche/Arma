import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonLoader, InputText, InputTextarea } from "@jetonpeche/angular-mat-input";
import { Specialite } from '@models/Specialite';
import { SnackBarService } from '@services/SnackBarService';
import { SpecialiteService } from '@services/SpecialiteService';

@Component({
  selector: 'app-ajouter-modifier-specialite',
  imports: [ReactiveFormsModule, MatDialogModule, ButtonLoader, InputText, InputTextarea],
  templateUrl: './ajouter-modifier-specialite.html',
  styleUrl: './ajouter-modifier-specialite.scss',
})
export class AjouterModifierSpecialite 
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);

    private matDialogData: Specialite = inject(MAT_DIALOG_DATA);
    private specialiteServ = inject(SpecialiteService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierSpecialite>);

    ngOnInit(): void
    {
        if(this.matDialogData)
            this.labelBtn.set("Modifier");

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
            description: new FormControl(this.matDialogData?.description, [Validators.maxLength(1_000)])
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
}
