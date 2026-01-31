import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { InputText, InputPassword, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { AuthentificationService } from '@services/AuthentificationService';
import { environment } from '../../../environements/environement';
import { Router } from '@angular/router';

@Component({
  selector: 'app-connexion',
  imports: [MatCardModule, InputText, ReactiveFormsModule, InputPassword, ButtonLoader, GridContainer, GridElement],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class ConnexionPage implements OnInit
{
    protected form: FormGroup;
    protected btnClick = signal<boolean>(false);

    private authServ = inject(AuthentificationService);
    private router = inject(Router);

    ngOnInit(): void
    {
        this.form = new FormGroup({
            login: new FormControl("", [Validators.required]),
            mdp: new FormControl("", [Validators.required])
        });
    }

    protected Valider(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        this.authServ.Connexion(this.form.value).subscribe({
            next: (retour) =>
            {
                this.btnClick.set(false);
                environment.utilisateur = retour;
                sessionStorage.setItem("utilisateur", JSON.stringify(retour));
                this.authServ.estConnecter.set(true);

                this.router.navigateByUrl("/personnage");
            },
            error: () => this.btnClick.set(false)
        });
    }
}
