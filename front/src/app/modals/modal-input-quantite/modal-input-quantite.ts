import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputNumber } from '@jetonpeche/angular-mat-input';
import { PanierService } from '@services/PanierService';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-modal-input-quantite',
  imports: [MatIcon, MatButtonModule, MatDialogModule, InputNumber, ReactiveFormsModule, MatIcon],
  templateUrl: './modal-input-quantite.html',
  styleUrl: './modal-input-quantite.scss',
})
export class ModalInputQuantite implements OnInit
{
    protected formControl = new FormControl(1, [Validators.min(1)]);
    protected btnLabel = signal("Ajouter au panier");

    private matDialogData = inject(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<ModalInputQuantite>);
    private panierServ = inject(PanierService);

    ngOnInit(): void 
    {
        if(this.matDialogData?.quantite)
        {
            this.formControl.setValue(this.matDialogData.quantite);    
            this.btnLabel.set("Modifier la quantité");
        }
    }

    protected Valider(): void
    {
        if(this.formControl.invalid)
            return;

        if(this.matDialogData?.quantite)
            this.panierServ.Modifier(this.matDialogData, this.formControl.value);

        else
            this.panierServ.Ajouter(this.matDialogData, this.formControl.value);

        this.dialogRef.close();
    }
}
