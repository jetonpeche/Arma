import { EModeVisibilite } from "@enums/EModeVisibilite"
import { ETypeRevelation } from "@enums/ETypeRevelation"

export type SessionCombat = 
{
    nomPartie: string,
    urlImagecarte: string,
    hauteur: number, 
    largeur: number,
    listePion: SessionCombatPion[],
    listeDecor: SessionCombatDecor[],
    bibliothequeDecor: SessionCombatBibliothequeDecor[],
    bibliothequeVaisseau: SessionCombatBibliothequeVaisseau[],
    bibliothequeAeronef: SessionCombatBibliothequeVaisseau[]
}

export type SessionCombatPion =
{
    idPion: string,
    idVaisseau: number,
    idBibliothequePion: number,
    idUtilisateurAssigner: number | null,
    positionX: number,
    positionY: number,
    rotationDegres: number,
    echelle: number,
    visibiliteMode: EModeVisibilite,
    listeIdUtilisateurAutoriser: number[],
    revelationType: ETypeRevelation
}

export type SessionCombatDecor =
{
    idDecor: string,
    idBibliothequeDecor: number,
    positionX: number,
    positionY: number,
    rotationDegres: number,
    echelle: number,
    ordreCalque: number,
    visibiliteMode: EModeVisibilite,
    listeIdUtilisateurAutoriser: number[]
}

export type SessionCombatBibliothequeDecor =
{
    id: number,
    nomRecherche: string | null,
    urlImage: string
}

export type SessionCombatBibliothequeVaisseau =
{
    id: number,
    nom: string,
    urlImage: string,
    rayonDeplacement: number,
    rotationMaxDegres: number
}


export type ModifierFondTransformRequete =
{
    hauteur: number,
    largeur: number
}
