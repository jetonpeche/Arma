import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { EUrl } from '@enums/EUrl';
import { AjouterModifierAeronef } from '@modals/ajouter-modifier-aeronef/ajouter-modifier-aeronef';
import { Aeronef } from '@models/Aeronef';
import { Droit } from '@models/DroitGroupe';
import { AeronefService } from '@services/AeronefService';
import { AuthentificationService } from '@services/AuthentificationService';
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from '@angular/material/input';
import { ETypeRessource } from '@enums/ETypeRessource';
import { FichierService } from '@services/FichierService';
import { SnackBarService } from '@services/SnackBarService';
import { DecimalPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InputFile } from "@jetonpeche/angular-mat-input";

@Component({
  selector: 'app-aeronef',
  imports: [DecimalPipe, MatIconModule, MatTooltipModule, MatFormFieldModule, MatButtonModule, MatInputModule, InputFile],
  templateUrl: './aeronef.html',
  styleUrl: './aeronef.scss',
})
export class AeronefPage implements OnInit
{
  protected listeAeronef = signal<Aeronef[]>([]);
  protected listeAeronefClone = signal<Aeronef[]>([]);
  protected droit: Droit;

  private authServ = inject(AuthentificationService);
  private aeronefServ = inject(AeronefService);
  private fichierServ = inject(FichierService);
  private snackBarServ = inject(SnackBarService);
  private dialog = inject(MatDialog);

  private readonly estMobile = window.innerWidth <= 800;

  ngOnInit(): void 
  {
    this.Lister();
    this.droit = this.authServ.RecupererDroit(EUrl.Aeronef);
  }

  protected Rechercher(_valeur: string): void
  {
      const VALEUR = _valeur.toLowerCase().trim();
      this.listeAeronef.set(this.listeAeronefClone().filter(x => x.nom.toLowerCase().includes(VALEUR)))
  }

  protected UploadFichier(_idAeronef: number, _fichier: File): void
  {
      this.fichierServ.Upload(_idAeronef, ETypeRessource.Aeronef, _fichier).subscribe({
          next: (url: string) => 
          {
            this.snackBarServ.Ok("Le fichier a été uploadé");
            this.listeAeronef.update(x => 
            {
                return x.map(y => 
                {
                    if (y.id == _idAeronef)
                        return { ...y, urlImage: `${url}?t=${new Date().getTime()}` }
                    
                    return y;
                });
            });
          }
      });
  }

  protected OuvrirModalAjouterModifierAeronef(_aeronef?: Aeronef): void
  {
    const DIALOG_REF = this.dialog.open(AjouterModifierAeronef, {
      width: this.estMobile ? "95%" : "60%", 
      maxWidth: "100vw",
      data: _aeronef
    });

    DIALOG_REF.afterClosed().subscribe({
      next: (retour) =>
      {
        if(retour === true)
          this.Lister();
      }
    });
  }

  private Lister(): void
  { 
    this.aeronefServ.Lister().subscribe({
      next: (retour) =>
      {
        this.listeAeronef.set(retour);
        this.listeAeronefClone.set(retour);
      }
    });
  }
}
