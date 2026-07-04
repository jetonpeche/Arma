import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutocompleteDataSource, InputAutocomplete, InputNumber, InputText, InputTextarea, ButtonLoader } from '@jetonpeche/angular-mat-input';
import { GridContainer, GridElement } from '@jetonpeche/angular-responsive';
import { GradeService } from '@services/GradeService';
import { SpecialiteService } from '@services/SpecialiteService';
import { PersonnageService } from '@services/PersonnageService';
import { MatButtonModule } from '@angular/material/button';
import { PersonnageMort } from '@models/PersonnageMort';

@Component({
  selector: 'app-ajouter-modifier-mort',
  imports: [InputText, InputNumber, InputAutocomplete, InputTextarea, GridContainer, GridElement, MatButtonModule, MatDialogModule, ReactiveFormsModule, ButtonLoader],
  templateUrl: './ajouter-modifier-mort.html',
  styleUrl: './ajouter-modifier-mort.scss',
})
export class AjouterModifierMort implements OnInit
{ 
    protected labelBtn = signal("Ajouter");
  protected form: FormGroup;
  protected btnClick = signal<boolean>(false);
  protected listeGrade = signal<AutocompleteDataSource[]>([]);
  protected listeSpecialite = signal<AutocompleteDataSource[]>([]);

  private dialogRef = inject(MatDialogRef<AjouterModifierMort>);
  private gradeServ = inject(GradeService);
  private personnageServ = inject(PersonnageService);
  private specialiteServ = inject(SpecialiteService);
  private matDialogData = inject<PersonnageMort>(MAT_DIALOG_DATA);

  ngOnInit(): void 
  {
    if(this.matDialogData)
        this.labelBtn.set("Modifier");

    this.ListerGrade();
    this.ListerSpecialite();

    this.form = new FormGroup({
      nom: new FormControl(this.matDialogData?.nom ?? null, [Validators.maxLength(50), Validators.required]),
      dateNaissance: new FormControl(this.matDialogData?.dateNaissance ?? null, [Validators.required]),
      dateMort: new FormControl(this.matDialogData?.dateMort ?? null, [Validators.required]),
      nbOperation: new FormControl(this.matDialogData?.nbOperation ?? 1, [Validators.min(1), Validators.required]),
      idGrade: new FormControl(0, [Validators.required]),
      idSpecialite: new FormControl(0, [Validators.required]),
      elogeFunebre: new FormControl(this.matDialogData?.elogeFunebre, [Validators.maxLength(300)])
    });
  }

  protected ValiderForm(): void
  {
    if(this.form.invalid || this.btnClick())
      return;

    this.btnClick.set(true);

    if(this.matDialogData)
    {
        this.personnageServ.ModifierMort(this.matDialogData.id, this.form.value).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.dialogRef.close(true);
            },
            error: () => this.btnClick.set(false)
            }
        );
    }
    else
    {
        this.personnageServ.AjouterMort(this.form.value).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                this.dialogRef.close(true);
            },
            error: () => this.btnClick.set(false)
            }
        );
    }
  }

  private ListerSpecialite(): void
  {
    this.specialiteServ.ListerLeger().subscribe({
      next: (retour) =>
      {
        this.listeSpecialite.set(retour.map(x => ({ display: x.nom, value: x.id })));
      }
    })
  }

  private ListerGrade(): void
  {
    this.gradeServ.ListerLeger().subscribe({
      next: (retour) =>
      {
        this.listeGrade.set(retour.map(x => ({ display: x.nom, value: x.id })));
      }
    });
  }
}
