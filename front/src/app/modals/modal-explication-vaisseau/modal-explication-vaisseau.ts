import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-modal-explication-vaisseau',
  imports: [MatTabsModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './modal-explication-vaisseau.html',
  styleUrl: './modal-explication-vaisseau.scss',
})
export class ModalExplicationVaisseau {

}
