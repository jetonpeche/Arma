import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { Formation } from '@models/Formation';
import { AuthentificationService } from '@services/AuthentificationService';
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

    private formationServ = inject(FormationService);
    private authServ = inject(AuthentificationService);

    protected etapesTriees = computed(() => {
        const formation = this.formationSelectionnee();
        if (!formation || !formation.listeEtapeFormation) 
          return [];
        
        return [...formation.listeEtapeFormation].sort((a, b) => a.numeroEtape - b.numeroEtape);
    });

    ngOnInit(): void 
    {
      this.droit = this.authServ.RecupererDroit(EUrl.Formation);
      this.listeFormation.set([
            {
                id: 1,
                ordre: 1,
                nomComplet: "Formation au Combat d'Infanterie Avancé",
                nomRaccourci: "FCI-A",
                objectif: "Maîtriser les tactiques de guérilla, l'assaut en milieu urbain et la coordination d'escouade sous le feu ennemi.",
                conditionReussite: "Obtenir une note de 85% à l'épreuve de simulation à balles réelles (Wargames).",
                personnelleRequis: ["Marines", "ODST", "Sous-Officier"],
                listeEtapeFormation: [
                    { numeroEtape: 2, description: "Simulations tactiques en réalité augmentée (Environnement urbain)." },
                    { numeroEtape: 1, description: "Révision des protocoles d'engagement et maniement du fusil MA5C." },
                    { numeroEtape: 3, description: "Épreuve finale sur le terrain avec escouade complète." }
                ]
            }
        ]);
        //this.Lister();
    }

    protected OuvrirModalAjouterModifierFormation(_formation?: Formation): void
    {

    }

    private Lister(): void
    {
      this.formationServ.Lister().subscribe({
        next: (retour) => this.listeFormation.set(retour)
      })
    } 
}
