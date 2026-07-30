import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Aeronef } from '@models/Aeronef';
import { AeronefService } from '@services/AeronefService';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { InputText, InputNumber, InputTextarea, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-ajouter-modifier-aeronef',
  imports: [MatDialogModule, ReactiveFormsModule, MatButtonModule, GridContainer, GridElement, InputText, InputNumber, InputTextarea, ButtonLoader],
  templateUrl: './ajouter-modifier-aeronef.html',
  styleUrl: './ajouter-modifier-aeronef.scss',
})
export class AjouterModifierAeronef implements OnInit
{
  protected form: FormGroup;
  protected labelBtn = signal<string>("Ajouter");
  protected btnClick = signal<boolean>(false);

  private matDialogData = inject<Aeronef>(MAT_DIALOG_DATA);
  private aeronefServ = inject(AeronefService);
  private snackBarServ = inject(SnackBarService);
  private dialogRef = inject(MatDialogRef<AjouterModifierAeronef>);

  ngOnInit(): void 
  {
    if(this.matDialogData)
        this.labelBtn.set("Modifier");

    this.form = new FormGroup({
        nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.maxLength(70), Validators.required]),
        role: new FormControl(this.matDialogData?.role ?? "", [Validators.maxLength(100), Validators.required]),
        prix: new FormControl(this.matDialogData?.prix ?? "", [Validators.min(1), Validators.required]),
        description: new FormControl(this.matDialogData?.description, [Validators.maxLength(500)]),
    });
  }

  protected Valider(): void
  {
    if(this.form.invalid)
      return;

    if(this.matDialogData)
    {
      this.aeronefServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
        next: () =>
        {
          this.snackBarServ.Ok("L'aéronef a été modifié");
          this.btnClick.set(false);
          this.dialogRef.close(true);
        }, 
        error: () => this.btnClick.set(false)
      });
    }
    else
    {
      this.aeronefServ.Ajouter(this.form.value).subscribe({
        next: () =>
        {
          this.snackBarServ.Ok("L'aéronef a été ajouté");
          this.btnClick.set(false);
          this.dialogRef.close(true);
        }, 
        error: () => this.btnClick.set(false)
      });
    }
  }
}
