import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PersonnageDroitGroupe, PersonnageDroitGroupeRequete } from '@models/PersonnageDroitGroupe';
import { DroitGroupeService } from '@services/DroitGroupeService';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { AutocompleteDataSource, InputAutocomplete } from "@jetonpeche/angular-mat-input";
import { MatIconModule } from "@angular/material/icon";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { SnackBarService } from '@services/SnackBarService';

type DroitGroupeLeger = 
{ 
    id: number, 
    nom: string 
}

@Component({
  selector: 'app-modal-goupe-droit-personnage',
  imports: [MatListModule, MatButtonModule, MatDialogModule, MatSelectModule, InputAutocomplete, MatIconModule, ReactiveFormsModule],
  templateUrl: './modal-goupe-droit-personnage.html',
  styleUrl: './modal-goupe-droit-personnage.scss',
})
export class ModalGoupeDroitPersonnage implements OnInit
{
    protected listePersonnage = signal<PersonnageDroitGroupe[]>([]);

    protected listePersonnageDroitGroupe = signal<PersonnageDroitGroupe[]>([]);
    protected listePersonnageAutoComplete = signal<AutocompleteDataSource[]>([]);
    protected listeDroitGroupe = signal<DroitGroupeLeger[]>([]);

    protected formControl = new FormControl();
    protected btnClick = signal<boolean>(false);

    private dialogData = inject(MAT_DIALOG_DATA);
    private droitGroupeServ = inject(DroitGroupeService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<ModalGoupeDroitPersonnage>);
    private idDroitGroupe: number;

    ngOnInit(): void
    {
        this.ListerPersonage();
        this.listeDroitGroupe.set(this.dialogData);

        this.formControl.valueChanges.subscribe({
            next: (idPersonnage) =>
            {
                if(!isNaN(idPersonnage))
                    this.Ajouter(idPersonnage);
            }
        });
    }

    protected Valider(): void
    {
        this.btnClick.set(true);

        const INFO: PersonnageDroitGroupeRequete[] = this.listePersonnage()
            .map(x => ({ idDroitGroupe: x.idDroitGroupe, idPersonnage: x.id }));

        this.droitGroupeServ.ModifierPersonnage(INFO).subscribe({
            next: () =>
            {
                this.snackBarServ.Ok("Les droits des personnages ont été mise à jour");
                this.btnClick.set(false);
                this.dialogRef.close();
            },
            error: () => this.btnClick.set(false)
        });
    }

    protected Ajouter(_idPersonnage: number): void
    {
        let personnage = this.listePersonnage().find(x => x.id == _idPersonnage);

        this.listePersonnageDroitGroupe.update(x => [...x, personnage])
        this.listePersonnageAutoComplete.update(x => 
        {
            return x.filter(y => y.value != _idPersonnage);
        });

        this.listePersonnage.update(x => 
        {
            x.find(y => y.id == _idPersonnage).idDroitGroupe = this.idDroitGroupe;

            return x;
        });
    }

    protected Supprimer(_personnage: PersonnageDroitGroupe): void
    {
        this.listePersonnageAutoComplete.update(x => [...x, { value: _personnage.id, display: _personnage.nom }])
        this.listePersonnageDroitGroupe.update(x => 
        {
            return x.filter(y => y.id != _personnage.id);
        });

        this.listePersonnage.update(x => 
        {
            x.find(y => y.id == _personnage.id).idDroitGroupe = null;

            return x;
        });
    }

    protected ChoisirGroupeDroit(_event: MatSelectChange): void
    {
        this.idDroitGroupe = _event.value;
        
        // recuperer les personnages qui ne sont pas dans le droit
        let listeAutocomplete = this.listePersonnage()
            .filter(x => x.idDroitGroupe != this.idDroitGroupe)
            .map(x => ({ value: x.id, display: x.nom }));

        let listePersonnage = this.listePersonnage()
            .filter(x => x.idDroitGroupe == this.idDroitGroupe);

        this.listePersonnageAutoComplete.set(listeAutocomplete);
        this.listePersonnageDroitGroupe.set(listePersonnage);
    }

    private ListerPersonage(): void
    {
        this.droitGroupeServ.ListerPersonnage().subscribe({
            next: (retour) => 
            {
                this.listePersonnage.set(retour);
            }
        });
    }
}
