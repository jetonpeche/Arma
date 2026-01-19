import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-confirmation',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './modal-confirmation.html'
})
export class ModalConfirmation 
{
  private info = inject(MAT_DIALOG_DATA);

  protected titre = computed(() => this.info.titre);
  protected message = computed(() => this.info.message);
}
