import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, InputTextarea, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { Campagne } from '@models/Campagne';
import { HistoriqueCampagneService } from '@services/HistoriqueCampagneService';
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-ajouter-modifier-campagne',
  imports: [MatButtonModule, ReactiveFormsModule, MatDialogModule, InputText, InputTextarea, ButtonLoader],
  templateUrl: './ajouter-modifier-campagne.html',
  styleUrl: './ajouter-modifier-campagne.scss',
})
export class AjouterModifierCampagne implements OnInit
{
  protected form: FormGroup;
  protected labelBtn = signal<string>("Ajouter");
  protected btnClick = signal<boolean>(false);

  private matDialogData = inject<Campagne>(MAT_DIALOG_DATA);
  private historiqueCampagneServ = inject(HistoriqueCampagneService);
  private snackBarServ = inject(SnackBarService);
  private dialogRef = inject(MatDialogRef<AjouterModifierCampagne>);

  ngOnInit(): void
  {
    if(this.matDialogData)
      this.labelBtn.set("Modifier");

    this.form = new FormGroup({
        nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(120)]),
        intervalDate: new FormControl(this.matDialogData?.intervalDate ?? "", [Validators.required]),
        resumer: new FormControl(this.matDialogData?.resumer ?? "", [Validators.required, Validators.maxLength(1_200)])
    });
  }

  protected Valider(): void
  {
    if(this.form.invalid)
    {
      this.form.markAsTouched();
      return;
    }

    this.btnClick.set(true);

    if(this.matDialogData)
    {
      this.historiqueCampagneServ.ModifierCampagne(this.matDialogData.id, this.form.value).subscribe({
        next: () =>
        {
          this.snackBarServ.Ok("Campagne modifiée");
          this.btnClick.set(false);
          this.dialogRef.close(true);
        }, 
        error: () => this.btnClick.set(false)
      });
    }
    else
    {
      this.historiqueCampagneServ.AjouterCampagne(this.form.value).subscribe({
        next: () =>
        {
          this.snackBarServ.Ok("Campagne créée");
          this.btnClick.set(false);
          this.dialogRef.close(true);
        },
        error: () => this.btnClick.set(false)
      });
    }
  }
}
