import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Grade } from '@models/Grade';
import { Orbat, OrbatSlot } from '@models/Orbat';
import { Personnage } from '@models/Personnage';
import { GradeService } from '@services/GradeService';
import { PersonnageService } from '@services/PersonnageService';
import { SnackBarService } from '@services/SnackBarService';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ButtonLoader } from '@jetonpeche/angular-mat-input';
import { OrbatService } from '@services/OrbatService';

@Component({
  selector: 'app-ajouter-modifier-orbat',
  imports: [
      MatDialogModule, MatButtonModule, ReactiveFormsModule, 
      MatFormFieldModule, MatInputModule, MatSelectModule, 
      MatIconModule, MatSlideToggleModule, MatDividerModule,
      MatAutocompleteModule, ButtonLoader
  ],
  templateUrl: './ajouter-modifier-orbat.html',
  styleUrl: './ajouter-modifier-orbat.scss',
})
export class AjouterModifierOrbat implements OnInit
{
    protected btnLabel = signal<string>("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected form: FormGroup;

    protected listeGrade = signal<Grade[]>([]);
    protected listePersonnage = signal<Personnage[]>([]);

    private dialogData: Orbat = inject(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<AjouterModifierOrbat>);
    private gradeServ = inject(GradeService);
    private orbatServ = inject(OrbatService);
    private personnageServ = inject(PersonnageService);
    private snackBarServ = inject(SnackBarService);

    get ListeOrbatSlot(): FormArray
    {
        return this.form.get("listeSlot") as FormArray;
    }

    protected listeRoleSuggestion = computed<string[]>(() => {
        const grades = this.listeGrade();

        const fonctions = grades
            .map(g => g.fonction)
            .filter(f => f !== null && f.trim() != "") as string[];

        // Set supprime tous les doublons
        const fonctionsUniques = [...new Set(fonctions)];

        return fonctionsUniques.sort((a, b) => a.localeCompare(b));
    });

    ngOnInit(): void
    {
        console.log(this.dialogData);
        
        this.ListerGrade();
        this.ListerPersonnage();

        this.form = new FormGroup({
            idParent: new FormControl(this.dialogData?.idParent ?? null),
            titre: new FormControl(this.dialogData?.titre ?? "", [Validators.maxLength(100)]),
            indicatif: new FormControl(this.dialogData?.indicatif ?? "", [Validators.required, Validators.maxLength(100)]),
            frequenceRadio: new FormControl(this.dialogData?.frequenceRadio ?? "", [Validators.maxLength(6)]),
            listeSlot: new FormArray([])
        });

        if(this.dialogData?.id != null)
        {
            this.btnLabel.set("Modifier");
     
            if (this.dialogData.listeSlot)
                this.dialogData.listeSlot.forEach(slot => this.AjouterSlot(slot));
        }
    }

    protected AjouterSlot(_slot?: OrbatSlot): void
    {
        const slotForm = new FormGroup({
            id: new FormControl(_slot?.id ?? null),
            role: new FormControl(_slot?.role ?? "", [Validators.required]),
            idGradeRequis: new FormControl(_slot?.gradeRequis?.id ?? null),
            idPersonnage: new FormControl(_slot?.personnage?.id ?? null),
            estOptionnel: new FormControl(_slot?.estOptionnel ?? false),
            ordreAffichage: new FormControl(_slot?.ordreAffichage ?? this.ListeOrbatSlot.length + 1)
        });

        this.ListeOrbatSlot.push(slotForm);
    }

    protected SupprimerSlot(index: number): void
    {
        this.ListeOrbatSlot.removeAt(index);
    }

    protected FiltrerRoles(valeurSaisie: string): string[] 
    {
        const suggestions = this.listeRoleSuggestion();

        if (!valeurSaisie) 
            return suggestions;
            
        const valeurLower = valeurSaisie.toLowerCase();
        return suggestions.filter(role => role.toLowerCase().includes(valeurLower));
    }

    protected FiltrerPersonnages(idGradeRequis: number | null): Personnage[] 
    {
        const tousLesPersonnages = this.listePersonnage();

        if (!idGradeRequis)
            return tousLesPersonnages;

        return tousLesPersonnages.filter(p => p.grade && p.grade.id == idGradeRequis);
    }

    protected Valider(): void
    {
        if(this.form.invalid)
        {
            this.form.markAllAsTouched();
            this.snackBarServ.Erreur("Des informations sont manquantes ou incorrectes");
            return;
        }
            
        this.btnClick.set(true);

        if(this.dialogData?.id != null)
        {                  
            this.orbatServ.Modifier(this.dialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("Element de l'orbat modifié");
                    this.dialogRef.close(true);
                },
                error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.orbatServ.Ajouter(this.form.value).subscribe({
                next: () =>
                {
                    this.btnClick.set(false);
                    this.snackBarServ.Ok("Element ajouté à l'orbat");
                    this.dialogRef.close(true);
                },
                error: () => this.btnClick.set(false)
            });
        }
    }

    private ListerGrade(): void
    {
        this.gradeServ.Lister().subscribe({
            next: (retour) => this.listeGrade.set(retour)
        });
    }

    private ListerPersonnage(): void
    {
        this.personnageServ.Lister().subscribe({
            next: (retour) => this.listePersonnage.set(retour)
        });
    }
}