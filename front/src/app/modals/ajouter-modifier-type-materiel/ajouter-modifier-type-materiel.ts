import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonLoader, InputText } from '@jetonpeche/angular-mat-input';
import { TypeMateriel } from '@models/Materiel';
import { SnackBarService } from '@services/SnackBarService';
import { TypeMaterielService } from '@services/TypeMaterielService';

@Component({
    selector: 'app-ajouter-modifier-type-materiel',
    imports: [MatDialogModule, InputText, ButtonLoader, ReactiveFormsModule],
    templateUrl: './ajouter-modifier-type-materiel.html',
    styleUrl: './ajouter-modifier-type-materiel.scss',
})
export class AjouterModifierTypeMateriel implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);

    private matDialogData: TypeMateriel = inject(MAT_DIALOG_DATA);
    private typeMaterielServ = inject(TypeMaterielService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierTypeMateriel>);

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
            this.typeMaterielServ.Modifier(this.matDialogData.id, this.form.value.nom).subscribe({
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
            this.typeMaterielServ.Ajouter(this.form.value.nom).subscribe({
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
