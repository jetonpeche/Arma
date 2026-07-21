import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { EUrl } from '@enums/EUrl';
import { AjouterModifierFormation } from '@modals/ajouter-modifier-formation/ajouter-modifier-formation';
import { Droit } from '@models/DroitGroupe';
import { Formation } from '@models/Formation';
import { AuthentificationService } from '@services/AuthentificationService';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { FormationService } from '@services/FormationService';

@Component({
  selector: 'app-formation',
  imports: [MatSelectModule, MatButtonModule, MatFormFieldModule, MatIconModule, FormsModule],
  templateUrl: './formation.html',
  styleUrl: './formation.scss',
})
export class FormationPage implements OnInit
{
    protected droit: Droit;
    protected listeFormation = signal<Formation[]>([]);
    protected formationSelectionnee = signal<Formation | null>(null);
    private readonly estMobile = window.innerWidth <= 800;

    private formationServ = inject(FormationService);
    private authServ = inject(AuthentificationService);
    private dialogServ = inject(DialogConfirmationService);
    private dialog = inject(MatDialog);

    protected etapesTriees = computed(() => {
        const formation = this.formationSelectionnee();
        if (!formation || !formation.listeEtapeFormation) 
          return [];
        
        return [...formation.listeEtapeFormation].sort((a, b) => a.numeroEtape - b.numeroEtape);
    });

    ngOnInit(): void 
    {
      this.droit = this.authServ.RecupererDroit(EUrl.Formation);
        this.Lister();
    }

    protected OuvrirModalAjouterModifierFormation(_formation?: Formation): void
    {
      const DIALOG_REF = this.dialog.open(AjouterModifierFormation, {
        width: this.estMobile ? "95%" : "70%",
        maxWidth: "100vw",
        data: _formation
      });

      DIALOG_REF.afterClosed().subscribe({
        next: (retour) =>
        {
          if(retour === true)
            this.Lister();
        }
      });
    }

    protected OuvrirModalConfirmation(_formation: Formation): void
    {
        const TITRE = `Supprimer la formation ${_formation.nomRaccourci}`;
        const MESSAGE = `Confirmez-vous la suppression definitif de ${_formation.nomComplet} ?`;

        this.dialogServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(_formation.id);
            }
        });
    }

    private Supprimer(_idFormation: number): void
    {
      this.formationServ.Supprimer(_idFormation).subscribe({
        next: () =>
        {
          this.formationSelectionnee.set(null);
          this.listeFormation.update(x => x.filter(y => y.id != _idFormation));
        }
      });
    }

    private Lister(): void
    {
      this.formationServ.Lister().subscribe({
        next: (retour) => this.listeFormation.set(retour)
      })
    } 
}
