import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { PlaneteOrigine } from '@models/PlaneteOrigine';
import { PlaneteService } from '@services/PlaneteService';
import { SnackBarService } from '@services/SnackBarService';

@Component({
    selector: 'app-ajouter-modifier-planete-origine',
    imports: [MatDialogModule, InputText, ButtonLoader, ReactiveFormsModule],
    templateUrl: './ajouter-modifier-planete-origine.html',
})
export class AjouterModifierPlaneteOrigine implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);

    private matDialogData: PlaneteOrigine = inject(MAT_DIALOG_DATA);
    private planeteServ = inject(PlaneteService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierPlaneteOrigine>);

    ngOnInit(): void 
    {
        if(this.matDialogData)
            this.labelBtn.set("Modifier");

        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)])
        });
    }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.planeteServ.Modifier(this.matDialogData.id, this.form.value.nom).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("La planète a été modifiée");
                    this.btnClick.set(false);
                    this.dialogRef.close(true);
                },error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.planeteServ.Ajouter(this.form.value.nom).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("La planète a été ajoutée");
                    this.btnClick.set(false);
                    this.dialogRef.close(true);
                },error: () => this.btnClick.set(false)
            });
        }
    }
}
