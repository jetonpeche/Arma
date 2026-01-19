import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, ButtonLoader, InputNumber, InputTextarea } from "@jetonpeche/angular-mat-input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { Boutique } from '@models/Boutique';
import { BoutiqueService } from '@services/BoutiqueService';
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-ajouter-modifier-boutique',
  imports: [MatCheckboxModule, MatDialogModule, ReactiveFormsModule, InputText, ButtonLoader, InputNumber, InputTextarea, GridContainer, GridElement],
  templateUrl: './ajouter-modifier-boutique.html',
  styleUrl: './ajouter-modifier-boutique.scss',
})
export class AjouterModifierBoutique implements OnInit
{
  protected form: FormGroup;
  protected labelBtn = signal<string>("Ajouter");
  protected btnClick = signal<boolean>(false);

  private matDialogData = inject<Boutique>(MAT_DIALOG_DATA);
  private boutiqueServ = inject(BoutiqueService);
  private snackBarServ = inject(SnackBarService);
  private dialogRef = inject(MatDialogRef<AjouterModifierBoutique>);

  ngOnInit(): void 
  {
    if(this.matDialogData)
      this.labelBtn.set("Modifier");

    this.form = new FormGroup({
      nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.maxLength(100), Validators.required]),
      prix: new FormControl(this.matDialogData?.prix ?? 1, [Validators.min(1), Validators.required]),
      description: new FormControl(this.matDialogData?.description, [Validators.maxLength(500)])
    });
  }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
        return;

        this.btnClick.set(true);

        if(this.matDialogData)
        {          
            this.boutiqueServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("L'objet a été modifier dans la boutique");
                    this.dialogRef.close(true);
                },
                error: () => this.btnClick.set(false)
            });
        }
        else
        {          
            this.boutiqueServ.Ajouter(this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("L'objet a été ajouté dans la boutique");
                    this.dialogRef.close(true);
                },
                error: () => this.btnClick.set(false)
            });
        }
    }
}
