import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { VaisseauPage } from "../vaisseau/vaisseau";
import { AeronefPage } from '../aeronef/aeronef';

@Component({
  selector: 'app-chantier-naval',
  imports: [MatTabsModule, VaisseauPage, AeronefPage],
  templateUrl: './chantier-naval.html',
  styleUrl: './chantier-naval.scss',
})
export class ChantierNaval 
{

}
