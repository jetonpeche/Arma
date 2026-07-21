import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonLoader, InputText, InputTextarea, InputNumber } from "@jetonpeche/angular-mat-input";
import { Formation, FormationEtape } from '@models/Formation';
import { GridElement, GridContainer } from "@jetonpeche/angular-responsive";
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormationService } from '@services/FormationService';
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-ajouter-modifier-formation',
  imports: [
    MatDialogModule, ReactiveFormsModule, ButtonLoader, MatButtonModule,
    GridElement, GridContainer, InputText, InputTextarea,
    MatChipsModule, MatIconModule, MatFormFieldModule,
    InputNumber
],  templateUrl: './ajouter-modifier-formation.html',
  styleUrl: './ajouter-modifier-formation.scss',
})
export class AjouterModifierFormation implements OnInit
{
    protected form: FormGroup;
    protected labelBtn = signal<string>("Ajouter");
    protected btnClick = signal(false);
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

  private dialogData?: Formation = inject(MAT_DIALOG_DATA);
  private formationServ = inject(FormationService);
  private snackBarServ = inject(SnackBarService);
  private dialogRef = inject(MatDialogRef<AjouterModifierFormation>);

  get listeEtapeFormation(): FormArray 
  {
      return this.form.get('listeEtapeFormation') as FormArray;
  }

  ngOnInit(): void 
  {
    this.form = new FormGroup({
      nomComplet: new FormControl(this.dialogData?.nomComplet ?? "", [Validators.required, Validators.maxLength(150)]),
      nomRaccourci: new FormControl(this.dialogData?.nomRaccourci ?? "", [Validators.required, Validators.maxLength(5)]),
      objectif: new FormControl(this.dialogData?.objectif ?? "", [Validators.required, Validators.maxLength(500)]),
      conditionReussite: new FormControl(this.dialogData?.conditionReussite ?? "", [Validators.required, Validators.maxLength(500)]),
      personnelleRequis: new FormControl(this.dialogData?.personnelleRequis ?? []),
      ordre: new FormControl(this.dialogData?.ordre ?? 0),
      listeEtapeFormation: new FormArray([])
    });

    if(this.dialogData)
    {
      this.labelBtn.set("Modifier");
      
      for (const element of this.dialogData.listeEtapeFormation) 
        this.AjouterEtape(element);
    }
  }

  protected AjouterEtape(_formationEtape?: FormationEtape): void
  {
    this.listeEtapeFormation.push(new FormGroup({
        description: new FormControl(_formationEtape?.description ?? "", [Validators.required, Validators.maxLength(700)]),
        numeroEtape: new FormControl(_formationEtape?.numeroEtape ?? this.listeEtapeFormation.length + 1, [Validators.required, Validators.min(0)])
    }));
  }
  
  protected SupprimerEtape(_index: number): void
  {
    this.listeEtapeFormation.removeAt(_index);

    for (let i = 0; i < this.listeEtapeFormation.controls.length; i++) 
    {
      const element = this.listeEtapeFormation.controls[i];
      element.get('numeroEtape')?.setValue(i + 1); 
    }
  }

  protected AjouterTag(event: MatChipInputEvent): void 
  {
      const value = (event.value || '').trim();
      const control = this.form.get('personnelleRequis');

      if (value && control) 
      {
          const currentValues = control.value as string[];
          
          // évite les doublons
          if (!currentValues.includes(value))
              control.setValue([...currentValues, value]);
      }
      
      event.chipInput!.clear();
    }

    protected SupprimerTag(tagToRemove: string): void 
    {
        const control = this.form.get('personnelleRequis');
        if (control) 
        {
            const currentValues = control.value as string[];
            const index = currentValues.indexOf(tagToRemove);

            if (index >= 0) 
            {
                currentValues.splice(index, 1);
                control.setValue([...currentValues]);
            }
        }
    }

    protected Valider(): void
    {
      if(this.form.invalid)
        return;

      this.btnClick.set(true);

      if(this.dialogData)
      {
        this.formationServ.Modifier(this.dialogData.id, this.form.value).subscribe({
          next: () => {
            this.btnClick.set(false);
            this.snackBarServ.Ok("La formation a été modifiée");
            this.dialogRef.close(true);
          },
          error: () => this.btnClick.set(false)
        });
      }
      else
      {
        this.formationServ.Ajouter(this.form.value).subscribe({
          next: () => {
            this.btnClick.set(false);
            this.snackBarServ.Ok("La formation a été ajoutée");
            this.dialogRef.close(true);
          },
          error: () => this.btnClick.set(false)
        });
      }
    }
}
