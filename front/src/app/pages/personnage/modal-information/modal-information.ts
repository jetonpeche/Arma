import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Personnage } from '@models/Personnage';
import { BoutiquePage } from "../../boutique/boutique";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-modal-information',
  imports: [MatDialogModule, MatIconModule, MatTooltipModule, MatTabsModule, MatButtonModule, BoutiquePage],
  templateUrl: './modal-information.html',
  styleUrl: './modal-information.scss',
})
export class ModalInformation 
{
  protected dialogData: Personnage = inject(MAT_DIALOG_DATA);
}
