import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { InputNumber, InputAutocomplete, AutocompleteDataSource, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { AuthentificationService } from '@services/AuthentificationService';
import { BanqueService } from '@services/BanqueService';

@Component({
  selector: 'app-modal-point-banque',
  imports: [MatButtonModule, MatDialogModule, InputNumber, ReactiveFormsModule, InputAutocomplete, ButtonLoader],
  templateUrl: './modal-point-banque.html',
  styleUrl: './modal-point-banque.scss',
})
export class ModalPointBanque implements OnInit
{
    protected btnClick = signal<boolean>(false);
    protected form: FormGroup;
    protected liste: AutocompleteDataSource[] = [{ 
        value: 0,
        display: "Ajouter"
    },
    {
        value: 1,
        display: "Retirer"
    }];

    private banqueServ = inject(BanqueService);
    private authServ = inject(AuthentificationService);

    ngOnInit(): void
    {
        this.form = new FormGroup({
            mode: new FormControl(0, [Validators.required]),
            quantite: new FormControl(0, [Validators.required, Validators.min(1)])
        });
    }

    protected Valider(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        this.banqueServ.Modifier(this.form.value.quantite, this.form.value.mode).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.authServ.ModifierPointBanque(this.form.value.quantite, this.form.value.mode);
            },
            error: () => this.btnClick.set(false)
        });
    }
}
