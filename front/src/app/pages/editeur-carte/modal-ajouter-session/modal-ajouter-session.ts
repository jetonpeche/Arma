import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modal-ajouter-session',
    imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './modal-ajouter-session.html',
  styleUrl: './modal-ajouter-session.scss',
})
export class ModalAjouterSession 
{
    protected dialogRef = inject(MatDialogRef<ModalAjouterSession>);

  protected nomSession = '';
  protected fichierSelectionne = signal<File | null>(null);
  protected largeurDetectee = signal<number>(0);
  protected hauteurDetectee = signal<number>(0);

  protected onFichierSelectionne(event: Event): void 
  {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fichierSelectionne.set(file);

    // Extraction des dimensions natives de l'image sélectionnée
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      this.largeurDetectee.set(img.naturalWidth);
      this.hauteurDetectee.set(img.naturalHeight);
      URL.revokeObjectURL(img.src);
    };
  }

  protected valider(): void 
  {
    const file = this.fichierSelectionne();
    if (!file) return;

    this.dialogRef.close({
      nom: this.nomSession,
      fichierFond: file,
      largeur: this.largeurDetectee(),
      hauteur: this.hauteurDetectee()
    });
  }
}
