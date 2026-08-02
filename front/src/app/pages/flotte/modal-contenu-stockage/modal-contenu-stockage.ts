import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { VaisseauPossederContenuStockage } from '@models/VaisseauPosseder';
import { LogistiqueService } from '@services/LogistiqueService';
import { SnackBarService } from '@services/SnackBarService';
import { Droit } from '@models/DroitGroupe';
import { AuthentificationService } from '@services/AuthentificationService';
import { EUrl } from '@enums/EUrl';

@Component({
  selector: 'app-modal-contenu-stockage',
  imports: [
      MatDialogModule, MatButtonModule, MatIconModule, 
      MatFormFieldModule, MatInputModule, FormsModule
  ],
  templateUrl: './modal-contenu-stockage.html',
  styleUrl: './modal-contenu-stockage.scss',
})
export class ModalContenuStockage implements OnInit
{
    protected dialogData: VaisseauPossederContenuStockage[] = inject(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<ModalContenuStockage>);

    protected estModeEdition = signal<boolean>(false);
    protected donneesEdition = signal<VaisseauPossederContenuStockage[]>([]);

    protected droit: Droit;

    private snackBarServ = inject(SnackBarService);
    private logistiqueServ = inject(LogistiqueService);
    private authServ = inject(AuthentificationService);

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.Logistique);    
    }

    protected ActiverEdition(): void 
    {
        this.donneesEdition.set(this.dialogData.map(x => ({ ...x, quantite: 0 })));
        this.estModeEdition.set(true);
    }

    protected AnnulerEdition(): void 
    {
        this.estModeEdition.set(false);
        this.donneesEdition.set([]);
    }

    protected AjusterQuantite(item: VaisseauPossederContenuStockage): void 
    {
        const MAX = this.GetQuantiteMax(item.id);
        
        if (item.quantite > MAX)
            item.quantite = MAX;

        else if (item.quantite < 0 || item.quantite == null) 
            item.quantite = 0;
    }

    protected MettreAJour(): void 
    {
        const INFO = this.donneesEdition().filter(x => x.quantite > 0).map(x => ({ idStockageVaisseauPosseder: x.id, quantiteDetruite: x.quantite }));
        
        if(INFO.length == 0)
        {
            this.snackBarServ.Erreur("Aucune perte signalée");
            return;
        }

        this.logistiqueServ.ModifierStock(INFO).subscribe({
            next: () =>
            {
                this.snackBarServ.Ok("Les pertes ont été enregistrées");
                this.dialogRef.close();
            }
        });
    }

    // Récupère la quantité d'origine pour s'en servir de limite MAX
    protected GetQuantiteMax(id: number): number 
    {
        const original = this.dialogData.find(x => x.id === id);
        return original ? original.quantite : 9999;
    }
}