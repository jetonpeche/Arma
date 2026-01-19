import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Vaisseau } from '@models/Vaisseau';

@Component({
  selector: 'app-modal-stockage',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './modal-stockage.html',
  styleUrl: './modal-stockage.scss',
})
export class ModalStockage 
{
    protected dialogData: Vaisseau = inject(MAT_DIALOG_DATA);
}
