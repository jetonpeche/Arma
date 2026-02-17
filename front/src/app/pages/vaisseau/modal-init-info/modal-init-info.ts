import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, InputTextarea } from "@jetonpeche/angular-mat-input";

@Component({
  selector: 'app-modal-init-info',
  imports: [MatButtonModule, MatDialogModule, InputText, InputTextarea, ReactiveFormsModule],
  templateUrl: './modal-init-info.html',
  styleUrl: './modal-init-info.scss',
})
export class ModalInitInfo implements OnInit
{
    protected form: FormGroup;

    private dialogRef = inject(MatDialogRef<ModalInitInfo>);

    ngOnInit(): void 
    {
        this.form = new FormGroup({
            nomVaisseau: new FormControl("", [Validators.maxLength(100)]),
            nomCommandant: new FormControl("", [Validators.maxLength(100)]),
            information: new FormControl("", [Validators.maxLength(1_000)])
        });
    }

    protected Valider(): void
    {
        if(this.form.invalid)
            return;

        this.dialogRef.close(this.form.value);
    }
}
