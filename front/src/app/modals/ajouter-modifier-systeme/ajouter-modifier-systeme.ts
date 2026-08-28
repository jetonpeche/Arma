import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader, InputTextarea } from "@jetonpeche/angular-mat-input";
import { SnackBarService } from '@services/SnackBarService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { MatSelectModule } from '@angular/material/select';
import { SystemeService } from '@services/SystemeService';
import { Systeme } from '@models/Systeme';

@Component({
  selector: 'app-ajouter-modifier-systeme',
  imports: [MatSelectModule, MatDialogModule, InputText, ButtonLoader, ReactiveFormsModule, InputTextarea, GridContainer, GridElement],
  templateUrl: './ajouter-modifier-systeme.html'
})
export class AjouterModifierSysteme implements OnInit
{
	protected form: FormGroup;
	protected labelBtn = signal<string>("Ajouter");
	protected btnClick = signal<boolean>(false);

	private matDialogData: Systeme = inject(MAT_DIALOG_DATA);
	private systemServ = inject(SystemeService);
	private snackBarServ = inject(SnackBarService);
	private dialogRef = inject(MatDialogRef<AjouterModifierSysteme>);

	ngOnInit(): void 
	{
		if(this.matDialogData)
			this.labelBtn.set("Modifier");

		this.form = new FormGroup({
			nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(70)]),
			description: new FormControl(this.matDialogData?.description ?? "", [Validators.maxLength(400)]),

			positionX: new FormControl(this.matDialogData.positionX),
			positionY: new FormControl(this.matDialogData.positionY)
		});
	}

    protected ValiderForm(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        const FORM = this.form.value;

        if(this.matDialogData?.id)
        {
            this.systemServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("Le système a été modifié");
                    this.btnClick.set(false);

                    this.dialogRef.close({
                        id: this.matDialogData.id,
                        nom: FORM.nom,
                        description: FORM.description,
                        positionX: FORM.positionX,
                        positionY: FORM.positionY
                    } as Systeme);

                }, error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.systemServ.Ajouter(this.form.value).subscribe({
                next: (retour) =>
                {
                    this.snackBarServ.Ok("Le système a été ajouté");
                    this.btnClick.set(false);

                    this.dialogRef.close({
                        id: retour,
                        nom: FORM.nom,
                        description: FORM.description,
                        positionX: FORM.positionX,
                        positionY: FORM.positionY
                    } as Systeme);

                }, error: () => this.btnClick.set(false)
            });
        }
    }
}
