import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { VaisseauPossederArmement } from '@models/VaisseauPosseder';

type ArmementVaisseauModifier = 
{
    idVaisseauPosseder: number,
    armement: VaisseauPossederArmement
}

@Component({
  selector: 'app-modal-modifier-armement',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './modal-modifier-armement.html',
  styleUrl: './modal-modifier-armement.scss',
})
export class ModalModifierArmement implements OnInit
{
    protected form: FormGroup;
    protected dialogData: ArmementVaisseauModifier = inject(MAT_DIALOG_DATA);

    ngOnInit(): void 
    {
        this.form = new FormGroup({
            nombreDisponible: new FormControl(this.dialogData.armement.nombreDisponible),
            nombreDetruit: new FormControl(this.dialogData.armement.nombreDetruit)
        });
    }
}
