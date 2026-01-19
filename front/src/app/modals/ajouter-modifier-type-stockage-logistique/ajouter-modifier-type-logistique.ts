import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { TypeLogistique } from '@models/Logistique';
import { SnackBarService } from '@services/SnackBarService';
import { TypeStockageLogistiqueService } from '@services/TypeStockageLogistiqueService';

@Component({
    selector: 'app-ajouter-modifier-type-stockage-logistique',
    imports: [MatDialogModule, InputText, ButtonLoader, ReactiveFormsModule],
    templateUrl: './ajouter-modifier-type-stockage-logistique.html',
})
export class AjouterModifierTypeStockageLogistique implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);

    private matDialogData: TypeLogistique = inject(MAT_DIALOG_DATA);
    private typeStockageLogistiqueServ = inject(TypeStockageLogistiqueService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierTypeStockageLogistique>);

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
            this.typeStockageLogistiqueServ.Modifier(this.matDialogData.id, this.form.value.nom).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("Le type de stockage a été modifié");
                    this.btnClick.set(false);
                    this.dialogRef.close(true);
                },error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.typeStockageLogistiqueServ.Ajouter(this.form.value.nom).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("Le type de stockage a été ajouté");
                    this.btnClick.set(false);
                    this.dialogRef.close(true);
                },error: () => this.btnClick.set(false)
            });
        }
    }
}
