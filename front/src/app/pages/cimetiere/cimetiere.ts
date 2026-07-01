import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { PersonnageMort } from '@models/PersonnageMort';
import { PersonnageService } from '@services/PersonnageService';
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from '@angular/material/dialog';
import { AjouterMort } from './ajouter-mort/ajouter-mort';
import { AuthentificationService } from '@services/AuthentificationService';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-cimetiere',
  imports: [MatCardModule, MatDividerModule, MatIconModule, MatButtonModule, ButtonLoader],
  templateUrl: './cimetiere.html',
  styleUrl: './cimetiere.scss',
})
export class Cimetiere implements OnInit
{
  protected droit: Droit;
  protected btnClick = signal<boolean>(false);
  protected liste = signal<PersonnageMort[]>([]);
  private personnageServ = inject(PersonnageService);
  private authServ = inject(AuthentificationService);
  private dialogConfirmationServ = inject(DialogConfirmationService);
  private snackBarServ = inject(SnackBarService);
  private dialog = inject(MatDialog);

  ngOnInit(): void 
  {
    this.droit = this.authServ.RecupererDroit(EUrl.Personnage);
    this.ListerPersonnageMort();
  }

  protected OuvrirModalAjouterMort(): void
  {
    this.dialog.open(AjouterMort).afterClosed().subscribe({
      next: (retour) => 
      {
        if(retour === true)
          this.ListerPersonnageMort();
      }
    });
  }

  protected OuvrirModalConfirmationSupprimer(_personnageMort: PersonnageMort): void
  {
    this.dialogConfirmationServ.Ouvrir("Suppression d'une tombe", `Confirmez-vous la suppression de la tombe de ${_personnageMort.nom} ?`).subscribe({
      next: (retour) =>
      {
        if(retour)
          this.Supprimer(_personnageMort.id);
      }
    });
  }

  private Supprimer(_idPersonnageMort: number): void
  {
    this.btnClick.set(true);
    this.personnageServ.SupprimerMort(_idPersonnageMort).subscribe({
      next: () => 
      {
        this.btnClick.set(false);
        this.liste.update(x => x.filter(y => y.id != _idPersonnageMort));
        this.snackBarServ.Ok("La tombe a été supprimée");
      }, error : () => this.btnClick.set(false)
    });
  }

  private ListerPersonnageMort(): void
  {
    this.personnageServ.ListerMort().subscribe({
      next: (retour) => {
        this.liste.set(retour);
      }
    });
  }
}
