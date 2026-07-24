import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { VaisseauPossederContenuStockage } from '@models/VaisseauPosseder';

@Component({
  selector: 'app-modal-contenu-stockage',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './modal-contenu-stockage.html',
  styleUrl: './modal-contenu-stockage.scss',
})
export class ModalContenuStockage implements OnInit
{
  protected dialogData: VaisseauPossederContenuStockage[] = inject(MAT_DIALOG_DATA);

  ngOnInit(): void 
  {
    
  }
}
