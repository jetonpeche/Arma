import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InputText, InputNumber, ButtonLoader, InputAutocomplete, AutocompleteDataSource, InputTextarea } from "@jetonpeche/angular-mat-input";
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import {MatCheckboxModule} from '@angular/material/checkbox';
import { GradeService } from '@services/GradeService';
import { PlaneteService } from '@services/PlaneteService';
import { SpecialiteService } from '@services/SpecialiteService';
import { PersonnageService } from '@services/PersonnageService';
import { Personnage } from '@models/Personnage';
import { SnackBarService } from '@services/SnackBarService';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormationLeger } from '@models/Formation';
import { FormationService } from '@services/FormationService';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-ajouter-modifier-personnage',
  imports: [MatDialogModule, MatSelectModule, MatFormFieldModule, MatCheckboxModule, ReactiveFormsModule, InputText, GridContainer, GridElement, InputNumber, ButtonLoader, InputAutocomplete, InputTextarea],
  templateUrl: './ajouter-modifier-personnage.html',
  styleUrl: './ajouter-modifier-personnage.scss',
})
export class AjouterModifierPersonnage implements OnInit
{
    protected form: FormGroup;
    protected modeMort: boolean = false;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);

    protected dataSourceGrade = signal<AutocompleteDataSource[]>([]);
    protected dataSourcePlanete = signal<AutocompleteDataSource[]>([]);
    protected dataSourceSpecialite = signal<AutocompleteDataSource[]>([]);
    protected listeFormation = signal<FormationLeger[]>([]);

    private matDialogData = inject<Personnage>(MAT_DIALOG_DATA);
    private gradeServ = inject(GradeService);
    private planeteServ = inject(PlaneteService);
    private specialiteServ = inject(SpecialiteService);
    private personnageServ = inject(PersonnageService);
    private snackBarServ = inject(SnackBarService);
    private formationServ = inject(FormationService);
    private dialogRef = inject(MatDialogRef<AjouterModifierPersonnage>);

  ngOnInit(): void 
  {
    this.modeMort = (this.matDialogData as any)?.modeMort ?? false;

    if(!this.modeMort)
    {
        this.ListerGrade();
        this.ListerFormationLeger();
    }

    this.ListerPlanete();
    this.ListerSpecialite();

    this.form = new FormGroup({
        nom: new FormControl<string>(
            this.matDialogData?.nom ?? "", 
            [Validators.required, Validators.maxLength(100)]
        ),
        nomDiscord: new FormControl<string>(
            this.matDialogData?.nomDiscord ?? "", 
            [Validators.required, Validators.maxLength(100)]
        ),
        matricule: new FormControl<string>(
            this.matDialogData?.matricule ?? "", 
            [Validators.required, Validators.maxLength(40)]
        ),
        groupeSanguin: new FormControl<string>(
            this.matDialogData?.groupeSanguin ?? "", 
            [Validators.required, Validators.maxLength(5)]
        ),
        dateNaissance: new FormControl<string>(
            this.matDialogData?.dateNaissance ?? "20 avril 2520", 
            [Validators.required]
        ),
        etatService: new FormControl<string | null>(
            this.matDialogData?.etatService, 
            [Validators.maxLength(5_000)]
        ),
        nbPointBoutique: new FormControl<number>(
            this.matDialogData?.nbPointBoutique ?? 0, 
            [Validators.required, Validators.min(0)]
        ),
      idGrade: new FormControl<number>(
        this.matDialogData?.grade?.id ?? 0, 
        [Validators.required]
      ),
      idPlaneteOrigine: new FormControl<number>(
        this.matDialogData?.planeteOrigine?.id ?? 0, 
        [Validators.required]
      ),
      idSpecialite: new FormControl<number | null>(this.matDialogData?.specialite?.id),
      formationFaite: new FormControl<boolean>(this.matDialogData?.formationFaite ?? false),
      nbOperation: new FormControl<number>(this.matDialogData?.nbOperation ?? 0, [Validators.min(0)]),
      listeFormation: new FormControl<string[]>(this.matDialogData?.listeFormation ?? [], [Validators.required]),
      estFormateur: new FormControl<boolean>(this.matDialogData?.estFormateur ?? false),
      estFormateurSpecialite: new FormControl<boolean>(this.matDialogData?.estFormateurSpecialite ?? false)
    });

        if(this.modeMort)
        {
            this.form.removeControl("nbOperation");
            this.form.removeControl("listeFormation");
            this.form.removeControl("nomDiscord");
            this.form.removeControl("idGrade");
            this.form.removeControl("nbPointBoutique");
            this.form.addControl("elogeFunebre", new FormControl(null, [Validators.maxLength(1500)]));
            this.form.addControl("dateMort", new FormControl(null, [Validators.required]));
        }

        if(this.modeMort)
            this.labelBtn.set("Déclarer mort");

        else if(this.matDialogData)
            this.labelBtn.set("Modifier");
  }

  protected NomFormation(): void
  {
    return this.form.controls["listeFormation"].value?.[0] ?? "";
  }

  protected ValiderFormMort(): void
  {
    if(this.form.invalid)
      return;

      this.btnClick.set(true);

      this.personnageServ.DeclarerMort(this.matDialogData.id, this.form.value).subscribe({
        next: () =>
        {
          this.btnClick.set(false);
          this.snackBarServ.Ok("Le personnage a été declaré mort, paix a son âme");
          this.dialogRef.close(true);
        },
        error: () => this.btnClick.set(false)
      });
  }

  protected ValiderForm(): void
  {
    if(this.form.invalid)
      return;

    this.btnClick.set(true);

    if(!this.matDialogData)
    {
      this.personnageServ.Ajouter(this.form.value).subscribe({
        next: () => 
        {
          this.btnClick.set(false);
          this.snackBarServ.Ok("Le personnage a été ajouté");
          this.dialogRef.close(true);
        },
        error: () => this.btnClick.set(false)
      });
    }
    else
    {
      this.personnageServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
        next: () => 
        {
          this.btnClick.set(false);
          this.snackBarServ.Ok("Le personnage a été modifié");
          this.dialogRef.close(true);
        },
        error: () => this.btnClick.set(false)
      });
    }
  }

  private ListerFormationLeger(): void
  {
    this.formationServ.ListerLeger().subscribe({
        next: (retour) => this.listeFormation.set(retour)
    });
  }

  private ListerGrade(): void
  {
    this.gradeServ.ListerLeger().subscribe({
      next: (x) => 
      {
        this.dataSourceGrade.set(x.map(y => ({ value: y.id, display: y.nom })));
      }
    });
  }

  private ListerPlanete(): void
  {
    this.planeteServ.ListerLeger().subscribe({
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
