import { Component, inject, OnInit } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { AuthentificationService } from '@services/AuthentificationService';

@Component({
  selector: 'app-gestion-droit',
  imports: [MatIcon],
  templateUrl: './gestion-droit.html',
  styleUrl: './gestion-droit.scss',
})
export class GestionDroitPage implements OnInit
{
    protected droit: Droit;

    private authServ = inject(AuthentificationService);

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.DroitGroupe);    
    }
    
    protected OuvrirModalAjouterModifierDroitGroupe(): void
    {
        
    }

    private Lister(): void
    {

    }
}
