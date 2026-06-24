import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { AutocompleteDataSource, InputText, InputAutocomplete, InputPassword, InputTextarea, ButtonLoader } from '@jetonpeche/angular-mat-input';
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { PlaneteService } from '@services/PlaneteService';
import { SpecialiteService } from '@services/SpecialiteService';
import { SnackBarService } from '@services/SnackBarService';
import { AuthentificationService } from '@services/AuthentificationService';

@Component({
  selector: 'app-inscription',
  imports: [ReactiveFormsModule, MatDialogModule, GridContainer, GridElement, InputText, InputAutocomplete, InputPassword, InputTextarea, ButtonLoader],
  templateUrl: './inscription.html',
  styleUrl: './inscription.scss',
})
export class Inscription implements OnInit
{
    protected form: FormGroup;
    protected btnClick = signal<boolean>(false);

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
            nom: new FormControl<string>( "", 
                [Validators.required, Validators.maxLength(100)]
            ),
            nomDiscord: new FormControl<string>("", 
                [Validators.required, Validators.maxLength(100)]
            ),
            matricule: new FormControl<string>("", 
                [Validators.required, Validators.maxLength(40)]
            ),
            groupeSanguin: new FormControl<string>("", 
                [Validators.required, Validators.maxLength(5)]
            ),
            dateNaissance: new FormControl<string>("20 avril 2520", 
                [Validators.required]
            ),
            etatService: new FormControl<string | null>(null,
                [Validators.maxLength(5_000)]
            ),
            idPlaneteOrigine: new FormControl<number>(0, [Validators.required]),
            idSpecialite: new FormControl<number>(0, [Validators.required]),
            login: new FormControl<string>("", [Validators.required, Validators.maxLength(30)]),
            mdp: new FormControl("", [Validators.required])
        });
    }

    protected ValiderForm(): void
    {
        if(this.form.invalid)
            return;

        this.btnClick.set(true);

        this.authServ.Inscription(this.form.value).subscribe({
            next: () =>
            {
                this.snackBarServ.Ok("Votre compte est créé");
                this.btnClick.set(false);
                this.dialogRef.close();
            },
            error: () => this.btnClick.set(false)
        });
    }

    private ListerPlanete(): void
    {
        this.planeteServ.Lister().subscribe({
            next: (x) => 
            {
                this.dataSourcePlanete.set(x.map(y => ({ value: y.id, display: y.nom })));
            }
        });
    }

    private ListerSpecialite(): void
    {
        this.specialiteServ.ListerLeger().subscribe({
            next: (x) => 
            {
                this.dataSourceSpecialite.set(x.map(y => ({ value: y.id, display: y.nom })));
            }
        });
    }
}
