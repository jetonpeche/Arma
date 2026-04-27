import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Medaille } from '@models/Medaille';

@Component({
  selector: 'app-modal-attribuer-medaille',
  imports: [MatDialogModule],
  templateUrl: './modal-attribuer-medaille.html',
  styleUrl: './modal-attribuer-medaille.scss',
})
export class ModalAttribuerMedaille 
{
    private matDialogData: Medaille = inject(MAT_DIALOG_DATA);

    private ListerPersonnage(): void
    {
        
    }
}
