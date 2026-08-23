import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environements/environement';
import { BanqueService } from '@services/BanqueService';
import { AuthentificationService } from '@services/AuthentificationService';
import { SnackBarService } from '@services/SnackBarService';
import { ButtonLoader } from "@jetonpeche/angular-mat-input";

@Component({
  selector: 'app-modal-don',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ButtonLoader
],
  templateUrl: './modal-don.html',
  styleUrl: './modal-don.scss',
})
export class ModalDon implements OnInit 
{
    protected form: FormGroup;
    protected btnClick = signal<boolean>(false);
    protected soldeActuel = signal<number>(0);

    private banqueServ = inject(BanqueService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<ModalDon>);
    
    ngOnInit(): void 
    {
        this.soldeActuel.set(environment.utilisateur.nbPointBoutique);

        this.form = new FormGroup({
            montant: new FormControl<number>(1, [
                Validators.required,
                Validators.min(1),
                Validators.max(this.soldeActuel())
            ])
        });
    }

    protected Valider(): void 
    {
        this.form.markAllAsTouched();
        
        if (this.form.invalid) 
            return;

        this.btnClick.set(true);
        const MONTANT = this.form.value.montant;
            
        this.banqueServ.Don(MONTANT).subscribe({
            next: () =>
            {
                this.btnClick.set(false);
                
                this.snackBarServ.Ok("La C21 vous remercie, WHOUAAAA !");
                this.dialogRef.close(MONTANT * 50);
            },
            error: () => this.btnClick.set(false)
        });
    }
}