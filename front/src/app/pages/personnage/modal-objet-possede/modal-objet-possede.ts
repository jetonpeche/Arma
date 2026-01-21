import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { BoutiquePage } from "../../boutique/boutique";

@Component({
  selector: 'app-modal-objet-possede',
  imports: [MatDialogModule, MatButtonModule, BoutiquePage],
  templateUrl: './modal-objet-possede.html',
  styleUrl: './modal-objet-possede.scss',
})
export class ModalObjetPossede 
{
    protected idPersonnage: number = inject(MAT_DIALOG_DATA);
}
