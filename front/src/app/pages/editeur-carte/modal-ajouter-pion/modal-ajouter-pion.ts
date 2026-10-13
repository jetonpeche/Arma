import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-modal-ajouter-pion',
  imports: [MatButtonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './modal-ajouter-pion.html',
  styleUrl: './modal-ajouter-pion.scss',
})
export class ModalAjouterPion implements OnInit
{
  protected form: FormGroup;
  private dialogRef = inject(MatDialogRef<ModalAjouterPion>);

  ngOnInit(): void
  {
    this.form = new FormGroup({
      nomVaisseau: new FormControl("", [Validators.required, Validators.maxLength(100)]),
      nomCommandant: new FormControl("", [Validators.required, Validators.maxLength(100)])
    });
  }

  protected Valider(): void
  {
    if(this.form.invalid)
    {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.value);
  }
}
