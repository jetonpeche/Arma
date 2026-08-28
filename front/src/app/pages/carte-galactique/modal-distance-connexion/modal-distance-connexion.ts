import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText } from '@jetonpeche/angular-mat-input';

@Component({
  selector: 'app-modal-distance-connexion',
  imports: [MatDialogModule, MatButtonModule, InputText, ReactiveFormsModule],
  templateUrl: './modal-distance-connexion.html',
  styleUrl: './modal-distance-connexion.scss',
})
export class ModalDistanceConnexion implements OnInit
{
    protected form: FormGroup;
    
    public data = inject(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<ModalDistanceConnexion>);

    ngOnInit(): void 
    {
      this.form = new FormGroup({
          distance: new FormControl("", [Validators.maxLength(50)])
      });
    }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
            return;

        this.dialogRef.close(this.form.value.distance);
    }
}
