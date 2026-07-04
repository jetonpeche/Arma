import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { Specialite } from '@models/Specialite';
import { AuthentificationService } from '@services/AuthentificationService';
import { SpecialiteService } from '@services/SpecialiteService';

@Component({
  selector: 'app-specialite',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  templateUrl: './specialite.html',
  styleUrl: './specialite.scss',
})
export class SpecialitePage implements OnInit
{
    protected listeSpecialite = signal<Specialite[]>([]);
    protected droit: Droit | null;

    private listeSpecialiteClone = signal<Specialite[]>([]);
    private specialiteServ = inject(SpecialiteService);
    private authServ = inject(AuthentificationService);
    private router = inject(Router);

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.Specialite);
        this.Lister();
    }

    protected Recherche(_valeur: string): void
    {
        const VALEUR = _valeur.toLowerCase().trim();
        const LISTE = this.listeSpecialiteClone().filter(x => x.nom.toLowerCase().includes(VALEUR || ""));
        
        this.listeSpecialite.set(LISTE);
    }

    protected GestionSpecialite(): void
    {
        this.router.navigateByUrl("/gestion-specialite");
    }

    private Lister(): void
    {
        this.specialiteServ.Lister().subscribe({
            next: (retour) => 
            {
                this.listeSpecialite.set(retour);
                this.listeSpecialiteClone.set(retour);
            }
        });
    }
}
