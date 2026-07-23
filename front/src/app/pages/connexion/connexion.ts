import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  imports: [MatIconModule, InputText, ReactiveFormsModule, InputPassword, ButtonLoader, GridContainer, GridElement],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class ConnexionPage implements OnInit
{
    protected form: FormGroup;
    protected btnClick = signal<boolean>(false);
    protected enCoursDeScan = signal<boolean>(false);
    protected accesAutorise = signal<boolean>(false);
    protected accesRefuse = signal<boolean>(false);

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
            width: this.estMobile ? "95%" : "60%", 
            maxWidth: "100vw",
        });
    }

    protected Valider(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);
        this.enCoursDeScan.set(true);
        this.accesAutorise.set(false);
        this.accesRefuse.set(false);

        const DATE_DEBUT = Date.now();
        const TEMPS_MINIMUM_SCAN = 2000;

        this.authServ.Connexion(this.form.value).subscribe({
            next: (retour) =>
            {
                // On calcule le temps que l'API a mis à répondre
                const tempsEcoule = Date.now() - DATE_DEBUT;
                // S'il reste du temps sur nos 2 secondes obligatoires, on patiente
                const tempsRestant = Math.max(0, TEMPS_MINIMUM_SCAN - tempsEcoule);

                setTimeout(() => {
                    this.enCoursDeScan.set(false);
                    this.accesAutorise.set(true);

                    setTimeout(() => 
                    {
                        this.btnClick.set(false);
                        environment.utilisateur = retour;
                        sessionStorage.setItem("utilisateur", JSON.stringify(retour));
                        this.authServ.estConnecter.set(true);
                        this.authServ.droitGroupe.set(retour.droit);
                        this.authServ.nbPointBanque.set(retour.nbPointBanque);
                        this.authServ.peutModifierBanque.set(retour.droit.peutModifierBanque);
                        this.router.navigateByUrl("/personnage");
                    }, 3500);
                }, tempsRestant);
            },
            error: () => 
            {
                const tempsEcoule = Date.now() - DATE_DEBUT;
                const tempsRestant = Math.max(0, TEMPS_MINIMUM_SCAN - tempsEcoule);

                setTimeout(() => 
                {
                    this.enCoursDeScan.set(false);
                    this.accesRefuse.set(true);

                    setTimeout(() => 
                    {
                        this.accesRefuse.set(false);
                        this.btnClick.set(false);
                    }, 3500);
                }, tempsRestant);
            }
        });
    }
}
