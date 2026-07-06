import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { InputText, InputPassword, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { AuthentificationService } from '@services/AuthentificationService';
import { environment } from '../../../environements/environement';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Inscription } from './inscription/inscription';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-connexion',
  imports: [MatCardModule, MatIconModule, InputText, ReactiveFormsModule, InputPassword, ButtonLoader, GridContainer, GridElement],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class ConnexionPage implements OnInit
{
    protected form: FormGroup;
    protected btnClick = signal<boolean>(false);
    protected accesAutorise = signal<boolean>(false);
    private readonly estMobile = window.innerWidth <= 800;
    private authServ = inject(AuthentificationService);
    private dialog = inject(MatDialog);
    private router = inject(Router);

    ngOnInit(): void
    {
        this.form = new FormGroup({
            login: new FormControl("", [Validators.required]),
            mdp: new FormControl("", [Validators.required])
        });
    }

    protected OuvrirModalInscription(): void
    {
        this.dialog.open(Inscription, {
            width: this.estMobile ? "95%" : "50%", 
            maxWidth: "100vw",
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
                this.authServ.droitGroupe.set(retour.droit);
                this.authServ.nbPointBanque.set(retour.nbPointBanque);
                this.authServ.peutModifierBanque.set(retour.droit.peutModifierBanque);

                this.accesAutorise.set(true);

                setTimeout(() => {
                    this.router.navigateByUrl("/personnage");
                }, 4500);
            },
            error: () => this.btnClick.set(false)
        });
    }
}
