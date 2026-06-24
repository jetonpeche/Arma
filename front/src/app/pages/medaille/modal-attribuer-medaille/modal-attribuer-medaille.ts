import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AttribuerMedailleRequete, Medaille } from '@models/Medaille';
import { MedailleService } from '@services/MedailleService';
import { AutocompleteDataSource, InputAutocomplete, ButtonLoader } from "@jetonpeche/angular-mat-input";
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PersonnageLeger } from '@models/Personnage';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-modal-attribuer-medaille',
  imports: [MatButtonModule, MatIconModule, MatDialogModule, InputAutocomplete, ReactiveFormsModule, ButtonLoader],
  templateUrl: './modal-attribuer-medaille.html',
  styleUrl: './modal-attribuer-medaille.scss',
})
export class ModalAttribuerMedaille implements OnInit
{
    protected formControl = new FormControl();
    protected nomMedaille = signal<string>("");
    protected btnClick = signal<boolean>(false);
    protected listePersonnageAutoComplete = signal<AutocompleteDataSource[]>([]);
    protected listePersonnage = signal<PersonnageLeger[]>([]);
    protected listePersonnageChoisi = signal<PersonnageLeger[]>([]);

    private snackBarServ = inject(SnackBarService);
    private medailleServ = inject(MedailleService);
    private dialogRef = inject(MatDialogRef<ModalAttribuerMedaille>);
    private matDialogData: Medaille = inject(MAT_DIALOG_DATA);

    ngOnInit(): void 
    {
        this.formControl.valueChanges.subscribe({
            next: (idPersonnage) =>
            {
                if(!isNaN(idPersonnage))
                    this.Ajouter(idPersonnage);
            }
        });

        this.nomMedaille.set(this.matDialogData.nom);
        this.ListerPersonnage(this.matDialogData.id);
    }

    protected Ajouter(_idPersonnage: number): void
    {   
        let personnage = this.listePersonnage().find(x => x.id == _idPersonnage);

        this.listePersonnageAutoComplete.update(x => {
            return x.filter(y => y.value != _idPersonnage);
        });

        this.listePersonnageChoisi.update(x => [...x, personnage])
    }

    protected Supprimer(_personnage: PersonnageLeger): void
    {
        this.listePersonnageAutoComplete.update(x => [...x, { value: _personnage.id, display: _personnage.nom }])
        this.listePersonnageChoisi.update(x => 
        {
            return x.filter(y => y.id != _personnage.id);
        });
    }

    protected Valider(): void
    {
        if(this.listePersonnageChoisi().length == 0)
            return;

        this.btnClick.set(true);

        const INFO: AttribuerMedailleRequete = 
        {
            idMedaille: this.matDialogData.id,
            listeIdPersonnage: this.listePersonnageChoisi().map(x => x.id)
        }

        this.medailleServ.Attribuer(INFO).subscribe({
            next: () =>
            {
                this.snackBarServ.Ok("La médaille a été attribuée");
                this.btnClick.set(false);
                this.dialogRef.close();
            },
            error: () => this.btnClick.set(false)
        });
    }

    private ListerPersonnage(_idMedaille: number): void
    {
        this.medailleServ.ListerPersonnage(_idMedaille).subscribe({
            next: (retour) =>
            {
                this.listePersonnage.set(retour);
                this.listePersonnageAutoComplete.set(retour.map(x => ({ display: x.nom, value: x.id })));
            }
        });
    }
}
