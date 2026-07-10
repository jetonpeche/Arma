import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { AutocompleteDataSource, InputText, InputAutocomplete, InputPassword, InputTextarea } from '@jetonpeche/angular-mat-input';
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { PlaneteService } from '@services/PlaneteService';
import { SpecialiteService } from '@services/SpecialiteService';
import { SnackBarService } from '@services/SnackBarService';
import { AuthentificationService } from '@services/AuthentificationService';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-inscription',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatIconModule, InputText, InputAutocomplete, InputPassword, InputTextarea],
  templateUrl: './inscription.html',
  styleUrl: './inscription.scss',
})
export class Inscription implements OnInit
{
    protected form: FormGroup;
    protected btnClick = signal<boolean>(false);
    protected etapeCourante = signal<number>(1);

    protected dataSourceGrade = signal<AutocompleteDataSource[]>([]);
    protected dataSourcePlanete = signal<AutocompleteDataSource[]>([]);
    protected dataSourceSpecialite = signal<AutocompleteDataSource[]>([]);

    private planeteServ = inject(PlaneteService);
    private specialiteServ = inject(SpecialiteService);
    private authServ = inject(AuthentificationService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<Inscription>);
    
    ngOnInit(): void
    {
        this.ListerPlanete();
        this.ListerSpecialite();
        
        this.form = new FormGroup({
            nom: new FormControl<string>("", [Validators.required, Validators.maxLength(100)]),
            nomDiscord: new FormControl<string>("", [Validators.required, Validators.maxLength(100)]),
            matricule: new FormControl<string>(""),
            groupeSanguin: new FormControl<string>("", [Validators.required, Validators.maxLength(5)]),
            dateNaissance: new FormControl<string>("20 avril 2520", [Validators.required]),
            etatService: new FormControl<string | null>(null, [Validators.maxLength(5_000)]),
            idPlaneteOrigine: new FormControl<number>(0, [Validators.required]),
            idSpecialite: new FormControl<number>(0, [Validators.required]),
            login: new FormControl<string>("", [Validators.required, Validators.maxLength(30)]),
            mdp: new FormControl("", [Validators.required])
        });
    }

    private GenererCinqChiffres(): string 
    {
        return Math.floor(Math.random() * 100000)
            .toString()
            .padStart(5, '0');
    }

    private GenererMatricule(): string 
    {
        const bloc1 = this.GenererCinqChiffres();
        const bloc2 = this.GenererCinqChiffres();
        
        const nomSplit = (this.form.value.nom as string).trim().split(' ');
        let initialePrenom = nomSplit[0].trim().charAt(0).toUpperCase() || 'X';
        let initialeNom = "X";

        if(nomSplit.length > 1)
            initialeNom = nomSplit[1].trim().charAt(0).toUpperCase() || 'X';

        const initiales = `${initialeNom}${initialePrenom}`;

        return `${bloc1}-${bloc2}-${initiales}`;
    }

    protected EtapeSuivante(): void 
    {
        if (this.etapeCourante() < 3)
            this.etapeCourante.set(this.etapeCourante() + 1);
    }

    protected EtapePrecedente(): void 
    {
        if (this.etapeCourante() > 1)
            this.etapeCourante.set(this.etapeCourante() - 1);
    }

    protected ValiderForm(): void
    {
        this.form.markAllAsTouched();

        if(this.form.invalid) 
        {
            this.snackBarServ.Erreur("Dossier incomplet. Vérifiez vos informations, recrue !");
            return;
        }

        this.btnClick.set(true);
        this.form.controls["matricule"].setValue(this.GenererMatricule());

        this.authServ.Inscription(this.form.value).subscribe({
            next: () =>
            {
                this.snackBarServ.Ok("Engagement validé. Bienvenue dans l'UNSC.");
                this.btnClick.set(false);
                this.dialogRef.close();
            },
            error: () => this.btnClick.set(false)
        });
    }

    private ListerPlanete(): void 
    {
        this.planeteServ.ListerLeger().subscribe({
            next: (x) => this.dataSourcePlanete.set(x.map(y => ({ value: y.id, display: y.nom })))
        });
    }

    private ListerSpecialite(): void 
    {
        this.specialiteServ.ListerLeger().subscribe({
            next: (x) => this.dataSourceSpecialite.set(x.map(y => ({ value: y.id, display: y.nom })))
        });
    }
}