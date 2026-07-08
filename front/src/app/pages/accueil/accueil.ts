import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Inscription } from '../connexion/inscription/inscription';

@Component({
  selector: 'app-accueil',
  imports: [MatIconModule, MatDividerModule, MatButtonModule, MatCardModule],
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss',
})
export class Accueil 
{
    protected cinematiquePasse = signal(false);
    private dialog = inject(MatDialog);
    private readonly estMobile = window.innerWidth <= 800;

    protected PasserCinematique(): void 
    {
        this.cinematiquePasse.set(true);
    }

    protected OuvrirModalInscription(): void
    {
        this.dialog.open(Inscription, {
            width: this.estMobile ? "95%" : "60%", 
            maxWidth: "100vw",
        });
    }
}
