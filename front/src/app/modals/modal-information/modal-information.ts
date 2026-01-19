import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-information',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './modal-information.html',
  styleUrl: './modal-information.scss',
})
export class ModalInformation 
{
    private info = inject(MAT_DIALOG_DATA);

    protected titre = computed(() => this.info.titre);
    protected message = computed(() => this.info.message);
}
