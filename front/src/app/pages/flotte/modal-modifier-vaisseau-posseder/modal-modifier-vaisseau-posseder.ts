import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { InputNumber, ButtonLoader, InputTextarea } from "@jetonpeche/angular-mat-input";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VaisseauPosseder } from '@models/VaisseauPosseder';
import { VaisseauService } from '@services/VaisseauService';
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-modal-modifier-vaisseau-posseder',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, GridContainer, GridElement, InputNumber, ButtonLoader, InputTextarea],
  templateUrl: './modal-modifier-vaisseau-posseder.html',
  styleUrl: './modal-modifier-vaisseau-posseder.scss',
})
export class ModalModifierVaisseauPosseder implements OnInit
{
  protected form: FormGroup;
  protected dialogData: VaisseauPosseder = inject(MAT_DIALOG_DATA);
  protected btnClick = signal(false);

  private vaisseauServ = inject(VaisseauService);
  private snackBarServ = inject(SnackBarService);
  private dialogRef = inject(MatDialogRef<ModalModifierVaisseauPosseder>);

  ngOnInit(): void 
  {
    this.form = new FormGroup({
      information: new FormControl(this.dialogData.information, [Validators.maxLength(1000)]),
      nbPlaceMarines: new FormControl(this.dialogData.equipage.nbPlaceMarines, [Validators.min(0), Validators.max(this.dialogData.equipage.nbPlaceMarinesMax)]),
      nbPlacePassager: new FormControl(this.dialogData.equipage.nbPlacePassager, [Validators.min(0), Validators.max(this.dialogData.equipage.nbPlacePassagerMax)])
    });
  }

  protected Valider(): void
  {
    if(this.form.invalid)
      return;

    this.btnClick.set(true);

    this.vaisseauServ.ModifierPosseder(this.dialogData.id, this.form.value).subscribe({
      next: () =>
      {
        this.snackBarServ.Ok("Vaisseau mis à jour");
        this.btnClick.set(false);
        this.dialogRef.close(true);
      },
      error: () => this.btnClick.set(false)
    });
  }
}
