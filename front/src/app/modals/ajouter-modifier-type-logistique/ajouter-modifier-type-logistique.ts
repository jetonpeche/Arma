import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { TypeLogistique } from '@models/Logistique';
import { SnackBarService } from '@services/SnackBarService';
import { TypeLogistiqueService } from '@services/TypeLogistiqueService';

@Component({
    selector: 'app-ajouter-modifier-type-logistique',
    imports: [MatDialogModule, InputText, ButtonLoader, ReactiveFormsModule],
    templateUrl: './ajouter-modifier-type-logistique.html',
})
export class AjouterModifierTypeLogistique implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);

    private matDialogData: TypeLogistique = inject(MAT_DIALOG_DATA);
    private typeLogistiqueServ = inject(TypeLogistiqueService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierTypeLogistique>);

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
            this.typeLogistiqueServ.Modifier(this.matDialogData.id, this.form.value.nom).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("Le type a été modifié");
                    this.btnClick.set(false);
                    this.dialogRef.close(true);
                },error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.typeLogistiqueServ.Ajouter(this.form.value.nom).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("Le type a été ajouté");
                    this.btnClick.set(false);
                    this.dialogRef.close(true);
                },error: () => this.btnClick.set(false)
            });
        }
    }
}
