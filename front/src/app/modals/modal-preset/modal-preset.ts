import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Preset } from '@models/Preset';
import { PresetService } from '@services/PresetService';
import { SnackBarService } from '@services/SnackBarService';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthentificationService } from '@services/AuthentificationService';
import { Droit } from '@models/DroitGroupe';
import { EUrl } from '@enums/EUrl';
@Component({
  selector: 'app-modal-preset',
  imports: [MatDialogModule,MatInputModule, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatIconModule],
  templateUrl: './modal-preset.html',
  styleUrl: './modal-preset.scss',
})
export class ModalPreset implements OnInit
{
  protected form: FormGroup;
  protected formFichier: FormGroup;
  protected droit: Droit;
  protected modeEdition = signal(false);
  protected chargementTermine = signal(false);
  protected preset = signal<Preset | null>(null);
  protected fichierSelectionne = signal<File | null>(null);

  private presetServ = inject(PresetService);
  private snackBarServ = inject(SnackBarService);
  private authServ = inject(AuthentificationService);

  ngOnInit(): void 
  {
    this.droit = this.authServ.RecupererDroit(EUrl.Preset);
    this.Recuperer(); 

    this.form = new FormGroup({
      serveurTS: new FormControl(this.preset()?.serveurTS, [Validators.required]),
      mdpTS: new FormControl(this.preset()?.mdpTS, [Validators.required]),
      mdpArma: new FormControl(this.preset()?.mdpArma, [Validators.required]),
      codeAmiSteam: new FormControl(this.preset()?.codeAmiSteam, [Validators.required])
    });

    this.formFichier = new FormGroup({
      aliasNomFichier: new FormControl(this.preset()?.aliasNomFichier, [Validators.required])
    });
  }

  protected BasculerEdition(): void 
  {
    const etatActuel = this.modeEdition();
    this.modeEdition.set(!etatActuel);
    
    if (etatActuel && this.preset()) 
    {
      this.form.patchValue(this.preset()!);
      this.formFichier.patchValue({ aliasNomFichier: this.preset()!.aliasNomFichier });
      this.fichierSelectionne.set(null);
    }
  }

  protected FichierChoisi(event: Event): void 
  {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0)
    {
      const fichier = input.files[0];
      this.fichierSelectionne.set(fichier);
    }
  }

  protected Sauvegarder(): void 
  {
    if (this.form.invalid) 
    {
      this.snackBarServ.Erreur('Formulaire incomplet');
      return;
    }

    const donneesModifiees = this.form.value as Preset;
    
    this.presetServ.Modifier(donneesModifiees).subscribe({
      next: () => {
        this.preset.set(donneesModifiees);
        this.modeEdition.set(false);
        this.snackBarServ.Ok('Coordonnées mises à jour');
      }
    });
  }

  protected SauvegardeFichier(): void
  {
    if(this.formFichier.invalid || this.fichierSelectionne() == null || this.fichierSelectionne() == undefined)
      return;

    this.presetServ.ModifierFichier(this.fichierSelectionne(), this.formFichier.value.aliasNomFichier).subscribe({
      next: () => 
      {
        this.preset.update(x => {
          x.aliasNomFichier = this.formFichier.value.aliasNomFichier;
          return x;
        });

        this.modeEdition.set(false);
        this.snackBarServ.Ok('Coordonnées mises à jour');
      }
    });
  }

  protected CopierDonnee(texte: string | undefined, nomDonnee: string): void
  {
    if (!texte) 
      return;

    navigator.clipboard.writeText(texte).then(() => 
    {
      this.snackBarServ.Ok(`${nomDonnee} sauvegardé dans le presse-papier.`);
    })
    .catch(() => 
    {
      this.snackBarServ.Ok(`Erreur du terminal lors de la copie`);
    });
  }

  protected Telecharger(): void
  {
    this.presetServ.Telecharger();
  }

  private Recuperer(): void
  {
    this.presetServ.Recuperer().subscribe({
      next: (retour) =>
      {
        this.chargementTermine.set(true);

        if (retour) 
        {          
          this.preset.set(retour);
          this.form.patchValue(retour);
                    console.log(this.preset());
        } 
        else 
          this.modeEdition.set(true);
      },
      error: () => 
      {
        this.chargementTermine.set(true);
        this.modeEdition.set(true);
      }
    });
  }
}
